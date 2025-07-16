#!/usr/bin/env python3

import traceback
from setup import setup_debugger, steps_of_function
from collectors import CollectorManager
from postprocessing import PostprocessingManager
from output import UserError, print_result, print_error, print_status
import preparation
import sanitize_code
from clang import cindex

executable_filename = "/tmp/a.out"
user_cpp_filename = "/tmp/user.cpp"
main_cpp_filename = "/tmp/main.cpp"

def entrypoint(preset, code):
    # Preparation:
    tokens = preparation.prepare_and_compile(preset, 'analysis', code, executable_filename, main_cpp_filename, user_cpp_filename)

    # Analysis:
    function_name = preset['analysis']['config']['entrypointFunction']
    collect_configs = preset['analysis']['config']['collect']
    post_process_configs = preset['analysis']['config'].get('postProcess', {})

    print_status("Launching Analysis...")
    frame, process, thread, debugger = setup_debugger(function_name, executable_filename)

    collect_manager = CollectorManager.from_dict(collect_configs, frame, tokens)

    print_status("Analysing...")
    for frame in steps_of_function(frame, process, thread):
        collect_manager.collect(frame)

    collect_manager.collect_buffered_results()  # collect all buffered results that is delayed by one step and has not come out yet
    
    debugger.Terminate()

    collected = collect_manager.get_result_list()
    postprocessing_manager = PostprocessingManager.from_dict(post_process_configs)
    result_list = postprocessing_manager.process(collected)

    print_result(result_list)
    
    