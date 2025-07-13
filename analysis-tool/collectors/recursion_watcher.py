from .collector import Collector
from datatypes import transform_variable_list

class RecursionWatcher(Collector):
    def setup(self, frame):
        self.stack_trace = [(frame.GetFunction().GetDisplayName(), frame)]
        self.functions_with_breakpoints = set()
        self.current_step = None
        self.previous_step = None

    def activate_step_out_breakpoint(self, frame):
        """
        Is needed for thread.GetStopReturnValue() to work
        """
        function = frame.GetFunction()
        function_name = function.GetDisplayName()

        if function_name in self.functions_with_breakpoints:
            return
        
        self.functions_with_breakpoints.add(function_name)

        target = frame.GetThread().GetProcess().GetTarget()
        instructions = function.GetInstructions(target)

        for i in range(instructions.GetSize()):
            inst = instructions.GetInstructionAtIndex(i)
            if inst.GetMnemonic(target) in ["ret", "retq"]:
                addr = inst.GetAddress().GetLoadAddress(target)
                bp = target.BreakpointCreateByAddress(addr)
                bp.SetScriptCallbackBody("frame.GetThread().StepOut()")

    def step(self, frame):
        self.current_step = self.previous_step
        self.previous_step = self.intern_step(frame)
        return self.previous_step
        # return self.current_step
    
    def intern_step(self, frame):
        if len(self.stack_trace) == 0:
            return None

        # No change in stack trace, no need to step
        if self.stack_trace[-1][1].IsEqual(frame):
            return None
        
        if len(self.stack_trace) > 1 and self.stack_trace[-2][1].IsEqual(frame):
            # We are going back in the stack trace, we need to step out
            previous_fn,_ = self.stack_trace[-1]
            self.stack_trace.pop()
            return {
                'type': 'step_out',
                'from': previous_fn,
                'to': frame.GetFunction().GetDisplayName(),
                'returnValue': frame.GetThread().GetStopReturnValue().GetValue()
            }
        
        # We are going deeper in the stack trace, we need to step in
        self.activate_step_out_breakpoint(frame)
        previous_name,_ = self.stack_trace[-1]
        self.stack_trace.append((frame.GetFunction().GetDisplayName(), frame))
        return {
            'type': 'step_in',
            'from': previous_name, 
            'to': frame.GetFunction().GetDisplayName(),
            'arguments': transform_variable_list(frame.GetVariables(True, False, False, False))
        }

    def is_reason_for_new_step(self):
        return True
    