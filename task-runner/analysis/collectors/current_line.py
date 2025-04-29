from .collector import Collector

class CurrentLine(Collector):
    def setup(self, frame):
        self.previous_line = 0
        self.current_line = 0

    def pre_step(self, frame):
        self.current_line = self.previous_line
        self.previous_line = frame.GetLineEntry().GetLine()
    
    def step(self, frame):
        return self.current_line
    
    def is_reason_for_new_step(self):
        return False
