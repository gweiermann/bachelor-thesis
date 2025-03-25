#!/usr/bin/env python3

import lldb
import os
import json

class ExecutionError(Exception):
    def __init__(self, message):
        self.message = message
        print(json.dumps({ "type": "error", "message": message }))
        super().__init__(message)

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

def process_step(frame, line_number):
    array = get_array()
    if array != result_list[-1]['array']:
        append_array_to_result(array, frame, line_number)
        print(json.dumps({ "type": "status", "message": f"Found sorting step {len(result_list)}" }))
    
def get_vars():
    global array_var
    global size_var
    return array_var, size_var

def set_vars(array, size):
    global array_var
    global size_var
    array_var = array
    size_var = size

def extract_vars(frame):
    array_ptr = frame.FindVariable("arr")
    array_size = frame.FindVariable("n")
    if not array_ptr:
        raise Exception("arr is None")
    if not array_size:
        raise Exception("n is None")
    return array_ptr, array_size

def get_array():
    array, _size = get_vars()
    size = int(_size.GetValue(), 0)
    return tuple(int(array.GetChildAtIndex(i, lldb.eDynamicCanRunTarget, True).GetValue(), 0) for i in range(size))


if __name__ == "__main__":
    debugger = lldb.SBDebugger.Create()
    debugger.SetAsync(False)
    target = debugger.CreateTarget(exe)

    if not target:
        raise Exception("target is None")

    # Set Breakpoint at beginning of the algorithm
    bp = target.BreakpointCreateByName(function_name, target.GetExecutable().GetFilename())

    # Launch the process. Since we specified synchronous mode, we won't return
    # from this function until we hit the breakpoint at main
    process = target.LaunchSimple(None, None, os.getcwd())

    # Make sure the launch went ok
    if not process:
        raise ExecutionError("process is None")

    state = process.GetState()

    if state != lldb.eStateStopped:
        raise ExecutionError("Didn't stop unfortunately. Check if there was an error launching the process")

    # Get the first thread
    thread = process.GetThreadAtIndex(0)
    if not thread:
        raise ExecutionError("thread is None")

    # Get the first frame
    frame = thread.GetFrameAtIndex (0)
    if not frame:
        raise ExecutionError("frame is None")

    _array, _size = extract_vars(frame)
    set_vars(_array, _size)

    array = int(_array.GetValue(), 0)
    size = int(_size.GetValue(), 0) * _array.Dereference().GetByteSize()

    # save frame index
    function_frame_index = frame.GetFrameID()
    function_frame = frame

    # get initial line number
    function_line_number = frame.GetLineEntry().GetLine() - 3

    # add initial state
    append_array_to_result(get_array(), frame, function_line_number)

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
            process_step(frame, previous_line_number)
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

    print()

    debugger.Terminate()

