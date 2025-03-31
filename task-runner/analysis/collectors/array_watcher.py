from .collector import Collector
from datatypes import Array

class ArrayWatcher(Collector):
    def setup(self, frame, *, name, size):
        self.array = Array(frame, name, size)
        self.previous = None
    
    def step(self, frame):
        new = self.array.get()
        if new != self.previous:
            self.previous = new
            return new
        return None
    
    def is_reason_for_new_step(self):
        return True
    