

class Collector:
    def __init__(self, key, parameters, frame):
        self.key = key
        self.parameters = parameters
        self.setup(frame, **parameters)

    def process_step(self, frame):
        value = self.step(frame)
        return self.key, value

    def setup(self, frame):
        raise Exception("Collector hasn't implemented its setup function")
    
    def pre_step(self, frame):
        pass
    
    def step(self, frame):
        raise Exception("Collector hasn't implemented its step function")
    
    def is_reason_for_new_step():
        raise Exception("Collector hasn't implemented its is_reason_for_new_step function")


class CollectorManager:
    def __init__(self, collectors):
        self.first_level_collectors = [c for c in collectors if c.is_reason_for_new_step()]
        self.second_level_collectors = [c for c in collectors if not c.is_reason_for_new_step()]
        self.result = []

    def prepare(self, frame):
        for collector in self.first_level_collectors:
            collector.pre_step(frame)
        for collector in self.second_level_collectors:
            collector.pre_step(frame)
    
    def collect(self, frame):
        self.prepare(frame)
        flc_results = dict( collector.process_step(frame) for collector in self.first_level_collectors )
        if not any(flc_results.values()):
            return
        slc_reults = dict( collector.process_step(frame) for collector in self.second_level_collectors )
        self.result.append({**flc_results, **slc_reults})

    def get_result_list(self):
        return self.result
    