

class Collector:
    def __init__(self, key, parameters, frame):
        self.key = key
        self.parameters = parameters
        self.setup(frame, **parameters)

    def process_step(self, frame):
        """Returns a tuple with the key and the evaluated value of the collector. Don't override it."""
        value = self.step(frame)
        return self.key, value

    def setup(self, frame):
        """Init function of any collector. Parameters will be passed as kwargs."""
        raise Exception("Collector hasn't implemented its setup function")
    
    def pre_step(self, frame):
        """Will be called for every collector for any step."""
        pass
    
    def step(self, frame):
        """
        Will be called for every first-level-collector (those who return `True` in `is_reason_for_new_step()`).
        If it is a second-level-collector it will only be called if one of the first-level-collector had detected something useful (not `None`).
        The return value of this function will be taken into the result array and corresponds to the current step.
        """
        raise Exception("Collector hasn't implemented its step function")
    
    def is_reason_for_new_step():
        """
        If it is a first-level- or second-level-collector. Take a look at `step(...)` for more details
        """
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
        if all(v is None for v in flc_results.values()):
            return
        slc_reults = dict( collector.process_step(frame) for collector in self.second_level_collectors )
        self.result.append({**flc_results, **slc_reults})

    def get_result_list(self):
        return self.result
    