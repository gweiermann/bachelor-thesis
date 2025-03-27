#!/usr/bin/env python3

import lldb
import os
import json
from setup import setup_debugger
from collectors import init_collector
from collectors.collector import CollectorManager

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
            'type': 'line',
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
        frame, process, thread, debugger = setup_debugger(function_name)

        collectors = [init_collector(c, frame) for c in setup['collect']]
        collect_manager = CollectorManager(collectors)

        # save frame index
        function_frame_index = frame.GetFrameID()
        function_frame = frame
    
        # add initial state
        collect_manager.collect(frame)

        while process.GetState() == lldb.eStateStopped:
            frame = thread.GetFrameAtIndex(0)

            line_entry = frame.GetLineEntry()
            file_name = line_entry.GetFileSpec().GetFilename()
            line_number = line_entry.GetLine()
            current_function_name = frame.GetFunction().GetDisplayName()

            if file_name is None or current_function_name is None:
                thread.StepOver()
                continue

            current_function_name = current_function_name.split('(', 1)[0]
            base_source_filename = os.path.basename(source_filename)

            if file_name == base_source_filename and current_function_name == function_name:
                collect_manager.collect(frame)
                thread.StepOver()
            else:
                thread.StepOut()

        print(json.dumps({
            "type": "result",
            "result": collect_manager.get_result_list()
        }))

        debugger.Terminate()
    except Exception as e:
        print(json.dumps({
            "type": "error",
            "error": str(e)
        }))
        raise e
    