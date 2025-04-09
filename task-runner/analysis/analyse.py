#!/usr/bin/env python3

import lldb
import os
import shutil
from setup import setup_debugger, steps_of_function
from collectors import CollectorManager
from postprocessing import PostprocessingManager
from output import print_result, print_error, print_status


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
    
def entrypoint(preset, function_bodies):
    shutil.copyfile(preset['h_filename'], h_filename)
    shutil.copyfile(preset['analysis_cpp_filename'], main_cpp_filename)
    user_cpp = generate_user_cpp(preset, function_bodies)
    with open(user_cpp_filename, 'w') as f:
        f.write(user_cpp)

    compile()
    analyse(preset)

def compile():
    """
    Compile the C++ code to a binary executable.
    """
    print_status("Compiling...")
    os.system(f"clang++-19 -g -c {main_cpp_filename} -o /tmp/main.o")
    os.system(f"clang++-19 -g -c {user_cpp_filename} -o /tmp/user.o")
    os.system(f"clang++-19 -o {exe} /tmp/main.o /tmp/user.o")
    

def analyse(preset):
    try:
        function_name = preset['manifest']['entrypointFunction']
        collect_configs = preset['analysis']['collect']
        post_process_configs = preset['analysis'].get('postProcess', {})

        print_status("Launching Analysis...")
        frame, process, thread, debugger = setup_debugger(function_name, exe)

        collect_manager = CollectorManager.from_dict(collect_configs, frame)

        print_status("Analysing...")
        for frame in steps_of_function(frame, process, thread):
            collect_manager.collect(frame)
        
        debugger.Terminate()

        collected = collect_manager.get_result_list()
        postprocessing_manager = PostprocessingManager.from_dict(post_process_configs)
        result_list = postprocessing_manager.process(collected)

        print_result(result_list)
    except Exception as e:
        print_error(str(e))
        raise e
    