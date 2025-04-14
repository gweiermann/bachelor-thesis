from .collector import Collector

class RecursionWatcher(Collector):
    def setup(self, frame):
        self.stack_trace = [frame]
    
    def step(self, frame):
        if self.stack_trace is None:
            raise Exception("really none")
        if len(self.stack_trace) == 0:
            return None

        # No change in stack trace, no need to step
        if self.stack_trace[-1].IsEqual(frame):
            return None
        
        if len(self.stack_trace) > 1 and self.stack_trace[-2].IsEqual(frame):
            # We are going back in the stack trace, we need to step out
            previous_frame = self.stack_trace.pop()
            return {
                'type': 'step_out',
                'from': previous_frame.GetFunction().GetDisplayName(),
                'to': frame.GetFunction().GetDisplayName(),
            }
        
        # We are going deeper in the stack trace, we need to step in
        previous_frame = self.stack_trace[-1]
        self.stack_trace.append(frame)
        return {
            'type': 'step_in',
            'from': previous_frame.GetFunction().GetDisplayName(),
            'to': frame.GetFunction().GetDisplayName(),
        }

    def is_reason_for_new_step(self):
        return True
    