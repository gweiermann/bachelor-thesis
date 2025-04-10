import subprocess
import shutil
from output import print_status

main_cpp_filename = "/tmp/main.cpp"
user_cpp_filename = "/tmp/user.cpp"
h_filename = "/tmp/user-input.h"
exe = "/tmp/a.out"

def generate_user_cpp(preset, function_bodies):
    def prepare_arguments(args):
        return ', '.join(f"{arg['type']} {arg['name']}" for arg in args)
    def prepare_function(fn, body):
        return (fn['returnType'], fn['name'], prepare_arguments(fn['arguments']), body)
    functions = (prepare_function(fn, body) for fn, body in zip(preset['manifest']['functions'], function_bodies))
    functions_code = (f"""
{return_type} {name}({args})
{{
    {body}
}}
    """.strip() for return_type, name, args, body in functions)
    return '\n'.join(functions_code)

def compile_target(preset, type, function_bodies, output_file, compile_flags=[]):
    """
    Creates source files based on user input and compiles them.
    """
    main_cpp = preset['analysis_cpp_filename'] if type == 'analysis' else preset['test_cpp_filename']
    print_status("Preparing...")
    shutil.copyfile(preset['h_filename'], h_filename)
    shutil.copyfile(main_cpp, main_cpp_filename)
    user_cpp = generate_user_cpp(preset, function_bodies)
    with open(user_cpp_filename, 'w') as f:
        f.write(user_cpp)

    print_status("Compiling...")
    subprocess.run(['clang++-19', *compile_flags, '-c', main_cpp_filename, '-o', '/tmp/main.o'], check=True)
    subprocess.run(['clang++-19', *compile_flags, '-c', user_cpp_filename, '-o', '/tmp/user.o'], check=True)
    subprocess.run(['clang++-19', *compile_flags, '-o', output_file, '/tmp/main.o', '/tmp/user.o'], check=True)
