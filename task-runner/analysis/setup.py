import lldb
import os

def setup_debugger(function_name, *, executable_filename='/tmp/a.out', source_filename='/tmp/main.cpp'):
    debugger = lldb.SBDebugger.Create()
    debugger.SetAsync(False)
    target = debugger.CreateTarget(executable_filename)

    if not target:
        raise Exception("Couldn't run debugger: target is None")

    # Set Breakpoint at beginning of the algorithm
    target.BreakpointCreateByName(function_name, target.GetExecutable().GetFilename())

    # Launch the process. Since we specified synchronous mode, we won't return
    # from this function until we hit the breakpoint at main
    process = target.LaunchSimple(None, None, os.getcwd())

    # Make sure the launch went ok
    if not process:
        raise Exception("Couldn't run debugger: process is None")

    state = process.GetState()

    if state != lldb.eStateStopped:
        raise Exception("Couldn't run debugger: Check if there was an error launching the process")

    # Get the first thread
    thread = process.GetThreadAtIndex(0)
    if not thread:
        raise Exception("Couldn't run debugger: thread is None")

    # Get the first frame
    frame = thread.GetFrameAtIndex(0)
    if not frame:
        raise Exception("Couldn't run debugger: frame is None")
    
    return frame, process, thread, debugger