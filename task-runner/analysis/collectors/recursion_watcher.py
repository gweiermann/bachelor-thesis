from .collector import Collector

class RecursionWatcher(Collector):
    def setup(self, frame):
        self.stack_trace = [(frame.GetFunction().GetDisplayName(), frame)]
    
    def step(self, frame):
        if self.stack_trace is None:
            raise Exception("really none")
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
            }
        
        # We are going deeper in the stack trace, we need to step in
        previous_name,_ = self.stack_trace[-1]
        self.stack_trace.append((frame.GetFunction().GetDisplayName(), frame))
        return {
            'type': 'step_in',
            'from': previous_name, 
            'to': frame.GetFunction().GetDisplayName(),
        }

    def is_reason_for_new_step(self):
        return True
    