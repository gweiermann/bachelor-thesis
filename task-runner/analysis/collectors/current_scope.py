from .collector import Collector

class CurrentScope(Collector):
    def setup(self, frame):
        self.line_offset = frame.GetLineEntry().GetLine() - 3
        self.current_scope = {}
        self.previous_scope = {}

    def pre_step(self, frame):
        self.current_scope = self.previous_scope
        varlist = frame.GetVariables(True, True, False, False)
        self.previous_scope = {var.GetName(): var.GetValue() for var in varlist}

    def step(self, frame):
        return {
            'current': self.previous_scope, # yes this is correct
            'previous': self.current_scope
        }
    
    def is_reason_for_new_step(self):
        return False
