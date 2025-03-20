#!/usr/bin/env python3

import lldb
import os
import json

array_var = None
size_var = None

result_list = []

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


def watchpoint_callback(frame, wp, internal_dict):
    new_step = get_array()
    if result_list[-1] != new_step:
        result_list.append(new_step)
    return False


if __name__ == "__main__":
    exe = "/tmp/a.out"

    debugger = lldb.SBDebugger.Create()
    debugger.SetAsync(False)
    target = debugger.CreateTarget(exe)

    if not target:
        raise Exception("target is None")

    # Set Breakpoint at beginning of the algorithm
    bp = target.BreakpointCreateByName("bubbleSort", target.GetExecutable().GetFilename())

    # Launch the process. Since we specified synchronous mode, we won't return
    # from this function until we hit the breakpoint at main
    process = target.LaunchSimple(None, None, os.getcwd())

    # Make sure the launch went ok
    if not process:
        raise Exception("process is None")

    state = process.GetState()

    if state != lldb.eStateStopped:
        raise Exception("Didn't stop unfortunately. Check if there was an error launching the process")

    # Get the first thread
    thread = process.GetThreadAtIndex(0)
    if not thread:
        raise Exception("thread is None")

    # Get the first frame
    frame = thread.GetFrameAtIndex (0)
    if not frame:
        raise Exception("frame is None")

    _array, _size = extract_vars(frame)
    set_vars(_array, _size)

    array = int(_array.GetValue(), 0)
    size = int(_size.GetValue(), 0) * _array.Dereference().GetByteSize()

    error = lldb.SBError()
    options = lldb.SBWatchpointOptions()
    options.SetWatchpointTypeWrite(True)
    wp = target.WatchpointCreateByAddress(array, size, options, error)
    if error.Fail():
        raise Exception(f"Failed to watch array: {error.GetCString()}")
    debugger.HandleCommand(f"watchpoint command add -F watchpoint_callback {wp.GetID()}")

    # add initial state
    result_list.append(get_array())

    process.Continue()

    print(json.dumps({ "steps": result_list }))
    debugger.Terminate()

