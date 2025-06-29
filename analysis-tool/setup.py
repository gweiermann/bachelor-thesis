import lldb

def setup_debugger(function_name, executable_filename):
    debugger = lldb.SBDebugger.Create()
    debugger.SetAsync(False)

    error = lldb.SBError()
    target = debugger.CreateTarget(executable_filename, None, None, True, error)

    if error.Fail():
        raise Exception(f"Error creating the target: {error.GetCString()}")

    if not target:
        raise Exception("Error creating the target: target is None")

    # Set Breakpoint at beginning of the algorithm
    target.BreakpointCreateByName(function_name, target.GetExecutable().GetFilename())

    # Launch the process. Since we specified synchronous mode, we won't return
    # from this function until we hit the breakpoint at main
    launch_info = lldb.SBLaunchInfo(None)
    launch_info.SetLaunchFlags(1 << lldb.eLaunchFlagDisableASLR)
    error = lldb.SBError()
    process = target.Launch(launch_info, error)

    if error.Fail():
        raise Exception(f"Error launching the process: {error.GetCString()}")

    # Make sure the launch went ok
    if not process:
        raise Exception("Error launching the process: process is None")
    
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


def steps_of_function(frame, process, thread):
    wanted_filename = frame.GetLineEntry().GetFileSpec().GetFilename()
    stack_depth = thread.GetNumFrames()
    initial_frame = thread.GetFrameAtIndex(0)

    while process.GetState() == lldb.eStateStopped:
        frame = thread.GetFrameAtIndex(0)
        filename = frame.GetLineEntry().GetFileSpec().GetFilename()

        if wanted_filename != filename:
            # We moved out of the user code file, and we want to get back in (if possible)
            if thread.GetNumFrames() > stack_depth:
                thread.StepOut() # We are in some library code, so we want to go back to the user code
            if thread.GetNumFrames() == stack_depth and not initial_frame.IsEqual(frame):
                thread.StepOut() # We are somewhere else but not in user code, so we want to go back to the main code so it can get into the user code again
            else:
                thread.StepInto() # We are probably in the main function, so we want to go into the user code again
            continue

        yield frame

        thread.StepInto()