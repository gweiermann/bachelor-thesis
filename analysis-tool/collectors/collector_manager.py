from .collector import Collector
from .buffered_collector import BufferedCollector
from clang import cindex
from lldb import SBFrame
class CollectorManager:
    def from_dict(config, frame: SBFrame, tokens: cindex.Token):
        collectors = [Collector.from_dict(c, frame, tokens) for c in config]
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
        slc_results = dict( collector.process_step(frame) for collector in self.second_level_collectors )
        self.result.append({**flc_results, **slc_results})

    def collect_buffered_results(self):
        flc_results = dict( collector.get_buffered_step() for collector in self.first_level_collectors if isinstance(collector, BufferedCollector) )
        if all(v is None for v in flc_results.values()):
            return
        slc_results = dict( collector.get_buffered_step() for collector in self.second_level_collectors if isinstance(collector, BufferedCollector) )
        self.result.append({**flc_results, **slc_results})

    def get_result_list(self):
        return self.result
    