from .collector import Collector

class CollectorManager:
    def from_dict(config, frame):
        collectors = [Collector.from_dict(c, frame) for c in config]
        return CollectorManager(collectors)

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
    