
class Collector:
    def from_dict(config, frame):
        from .register import get_collector
        collector_name = config['type']
        collector = get_collector(collector_name)
        key = config['key']
        parameters = config.get('parameters', {})
        return collector(key, parameters, frame)

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
        raise NotImplementedError("Collector hasn't implemented its setup function")
    
    def pre_step(self, frame):
        """Will be called for every collector for any step."""
        pass
    
    def step(self, frame):
        """
        Will be called for every first-level-collector (those who return `True` in `is_reason_for_new_step()`).
        If it is a second-level-collector it will only be called if one of the first-level-collector had detected something useful (not `None`).
        The return value of this function will be taken into the result array and corresponds to the current step.
        """
        raise NotImplementedError("Collector hasn't implemented its step function")
    
    def is_reason_for_new_step():
        """
        If it is a first-level- or second-level-collector. Take a look at `step(...)` for more details
        """
        raise NotImplementedError("Collector hasn't implemented its is_reason_for_new_step function")
