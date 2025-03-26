

class ArrayWatcher:
    def __init__(self, array):
        self.array = array
        self.result = []
        self.previous = None

    def init(self):
        values = self.array.get()
        self.previous = values
        return values
    
    def step(self):
        new = self.array.get()
        if new != self.previous:
            self.previous = new
            return new
        return None