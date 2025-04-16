#!/usr/bin/env python3

import traceback
from setup import setup_debugger, steps_of_function
from collectors import CollectorManager
from postprocessing import PostprocessingManager
from output import print_result, print_error, print_status
import preparation

executable_filename = "/tmp/a.out"

def entrypoint(preset, function_bodies):
    try:
        preparation.compile_target(preset, 'analysis', function_bodies, executable_filename, compile_flags=['-g'])
        
        function_name = preset['manifest']['entrypointFunction']
        collect_configs = preset['analysis']['collect']
        post_process_configs = preset['analysis'].get('postProcess', {})

        print_status("Launching Analysis...")
        frame, process, thread, debugger = setup_debugger(function_name, executable_filename)

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
        print_error(traceback.format_exc())
        raise e
    