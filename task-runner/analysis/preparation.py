import subprocess
import shutil
import os
from output import print_status

main_cpp_filename = "/tmp/main.cpp"
user_cpp_filename = "/tmp/user.cpp"
h_filename = "/tmp/user-input.h"
utils_h_filename = ("/app/config/utils.h", "/tmp/utils.h")
utils_cpp_filename = ("/app/config/utils.cpp", "/tmp/utils.cpp")
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
    return '#include "utils.h"\n#include "user-input.h"\n' + '\n'.join(functions_code)

def copy_files(src_dsts):
    """
    Copies files from src_dsts[i][0] to src_dsts[i][1].
    """
    for src, dst in src_dsts:
        shutil.copyfile(src, dst)

def compile_target(preset, type, function_bodies, output_file, compile_flags=[]):
    """
    Creates source files based on user input and compiles them.
    """

    print_status("Preparing...")

    # Find out which files to use
    main_cpp_filename = preset['analysis_cpp_filename'] if type == 'analysis' else preset['test_cpp_filename']
    user_cpp_filename = "/tmp/user-input.cpp"
    
    # Generate cpp file based on user input
    user_cpp_content = generate_user_cpp(preset, function_bodies)
    with open(user_cpp_filename, 'w') as f: f.write(user_cpp_content)

    # Get a list of h and cpp files to copy and compile
    files = [
        main_cpp_filename,
        preset['h_filename'],
        "/app/config/utils.h",
        "/app/config/utils.cpp",
        user_cpp_filename
    ]

    # Map files to their destination paths
    src_dsts = [
        (filename, '/tmp/' + os.path.basename(filename)) for filename in files
    ]

    # Copy the files to the tmp directory (if they aren't there yet)
    for src, dst in src_dsts:
        if src != dst:
            shutil.copyfile(src, dst)

    # map cpp files to their o filenames
    cpp_o_files = [(filename, filename.replace('.cpp', '.o')) for _, filename in src_dsts if filename.endswith('.cpp')]
    

    print_status("Compiling...")
    for cpp_file, o_file in cpp_o_files:
        subprocess.run(['clang++-19', *compile_flags, '-c', cpp_file, '-o', o_file], check=True)
    
    file_flags = ['-o', output_file] + [o_file for _, o_file in cpp_o_files]
    subprocess.run(['clang++-19', *compile_flags, *file_flags], check=True)
