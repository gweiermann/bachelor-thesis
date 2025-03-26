#!/usr/bin/env python3

import lldb
import os
import json
from setup import setup_debugger
from datatypes import Array


source_filename = "/tmp/main.cpp"
exe = "/tmp/a.out"
function_name = "bubbleSort"

array_var = None
size_var = None

result_list = []
function_line_number = None
function_frame_index = None

def get_variables(frame):
    varlist = frame.GetVariables(False, True, False, False)
    return {var.GetName(): var.GetValue()
            for var in varlist}

def append_array_to_result(array, frame, line_number):
    global result_list
    global function_line_number
    result_list.append({
        "line": line_number - function_line_number,
        "array": array,
        "scope": get_variables(frame)
    })

if __name__ == "__main__":
    frame, process, thread, debugger = setup_debugger(function_name)

    array = Array(frame, "arr", "n")

    # save frame index
    function_frame_index = frame.GetFrameID()
    function_frame = frame

    # get initial line number
    function_line_number = frame.GetLineEntry().GetLine() - 3

    # add initial state
    before = array.get()
    append_array_to_result(before, frame, function_line_number)

    previous_line_number = function_line_number

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
            new = array.get()
            if new != before:
                before = new
                append_array_to_result(new, frame, previous_line_number)
            thread.StepOver()
        else:
            thread.StepOut()
        
        previous_line_number = line_number

    print(json.dumps({
        "type": "result",
        "result": {
            "steps": result_list
        }
    }))

    debugger.Terminate()

