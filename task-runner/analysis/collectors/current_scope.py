from .collector import Collector

class CurrentScope(Collector):
    def setup(self, frame):
        self.line_offset = frame.GetLineEntry().GetLine() - 3
    
    def step(self, frame):
        varlist = frame.GetVariables(False, True, False, False)
        return {var.GetName(): var.GetValue() for var in varlist}
    
    def is_reason_for_new_step(self):
        return False
    