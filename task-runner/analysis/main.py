#!/usr/bin/env python3

import lldb
import os
import json
from setup import setup_debugger, steps_of_function
from collectors import init_collectors
from collectors.collector import CollectorManager
from output import print_result, print_error, print_status

setup = {
    'functionName': 'bubbleSort',
    'collect': [
        {
            'type': 'arrayWatcher',
            'parameters': {
                'name': 'arr',
                'size': 'n',
            },
            'key': 'array'
        },
        {
            'type': 'currentLine',
            'key': 'line'
        },
        {
            'type': 'currentScope',
            'key': 'scope'
        }
    ],
    'postProcess': [
        {
            'type': 'detectThreeWaySwap',
            'parameters': {
                'target': 'array'
            },
            'key': 'threeWaySwap'
        },
        {
            'type': 'detectChange',
            'parameters': {
                'target': 'array',
                'filter': 'threeWaySwap.ignore'
            },
            'key': 'change'
        }
    ]
}


source_filename = "/tmp/main.cpp"
exe = "/tmp/a.out"
function_name = "bubbleSort"
    

if __name__ == "__main__":
    try:
        print_status("Launching Analysis...")
        frame, process, thread, debugger = setup_debugger(function_name)

        collectors = init_collectors(setup['collect'], frame)
        collect_manager = CollectorManager(collectors)

        print_status("Analysing...")
        for frame in steps_of_function(frame, process, thread):
            collect_manager.collect(frame)

        print_result(collect_manager.get_result_list())

        debugger.Terminate()
    except Exception as e:
        print_error(str(e))
        raise e
    