#!/usr/bin/env python3

import lldb
import os
import json

source_filename = "/tmp/main.cpp"
exe = "/tmp/a.out"
function_name = "bubbleSort"

array_var = None
size_var = None

result_list = []
function_line_number = None
function_frame_index = None

def process_step(frame, line_number):
    global function_line_number
    array = get_array()
    print('processing step')
    if array != result_list[-1]:
        result_list.append({
            "line": line_number - function_line_number,
            "array": array,
            "scope": str(frame.GetVariables())
        }.items())

class ArrayWatcher:
    def __init__(self, thread_plan, dict):
        self.thread_plan = thread_plan

    def should_stop(self, event):
        """Each step this function is called. Returning True means: control to user, False means: continue with the step-scripting"""
        return False
        
    def should_step(self):
        """Returning False means wait for next breakpoint. Returning True means we continue stepping"""
        thread = self.thread_plan.GetThread()
        target = thread.GetProcess().GetTarget()
        frame = thread.GetFrameAtIndex(0)

        line_entry = frame.GetLineEntry()
        file_name = line_entry.GetFileSpec().GetFilename()
        line_number = line_entry.GetLine()
        current_function_name = frame.GetFunctionName()

        global source_filename
        global function_name
        global function_frame_index

        if file_name == source_filename and current_function_name == function_name:
            process_step(frame, line_number)
        else:
            print("step out")
            self.thread_plan.QueueThreadPlanForStepOut(function_frame_index)
        return True

    def explains_stop(self, event):
        """Are we the reason it has stopped?"""
        return True

    
    
    

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

# def watchpoint_callback(frame, wp, internal_dict):
#     new_step = get_array()
#     if result_list[-1] != new_step:
#         result_list.append(new_step)
#     return False


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

    # error = lldb.SBError()
    # options = lldb.SBWatchpointOptions()
    # options.SetWatchpointTypeWrite(True)
    # wp = target.WatchpointCreateByAddress(array, size, options, error)
    # if error.Fail():
    #     raise Exception(f"Failed to watch array: {error.GetCString()}")
    # debugger.HandleCommand(f"watchpoint command add -F watchpoint_callback {wp.GetID()}")

    # debugger.HandleCommand("thread step-scripted -C ArrayWatcher")

    # save frame index
    function_frame_index = frame.GetFrameID()

    # get initial line number
    function_line_number = frame.GetLineEntry().GetLine()

    # add initial state
    initial_state = get_array()

    debugger.HandleCommand("script import __main__")
    debugger.HandleCommand("thread step-scripted -C __main__.ArrayWatcher")

    process.Continue()

    print("resultlist", result_list)

    # print(json.dumps({
    #     "initial_state": initial_state,
    #     "steps": map(dict, result_list)
    # }))

    debugger.Terminate()

