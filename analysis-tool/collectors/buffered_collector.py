from clang import cindex
from lldb import SBFrame
from .collector import Collector

class BufferedCollector(Collector):
    def __init__(self, key, parameters, frame: SBFrame, tokens: cindex.Token):
        super().__init__(key, parameters, frame, tokens)
        self.previous_step = self.get_initial_value()
        self.current_step = None
        self.setup(frame, **parameters)
    
    def buffered_step(self, frame: SBFrame):
        """
        This method should be overridden by the collector to provide the buffered value.
        It will be called every time a new step is processed.
        """
        raise NotImplementedError("BufferedCollector hasn't implemented its buffered_step function")
    
    def get_initial_value(self):
        """
        Returns the initial value of the collector that will be used for the first step when there is no previous step.
        """
        return None

    def pre_step(self, frame: SBFrame):
        """
        This method will be called before each step to update the previous result.
        It should not be overridden by the collector.
        """
        self.current_step = self.previous_step
        self.previous_step = self.buffered_step(frame)

    def process_step(self, frame: SBFrame):
        """Returns a tuple with the key and the evaluated value of the collector. Don't override it."""
        return self.key, self.current_step

    def get_buffered_step(self):
        """
        Returns the previous result of the collector.
        This is useful for buffered collectors to access the last value.
        """
        return self.key, self.previous_step
