
class Postprocessor:
    def from_dict(config):
        from .register import get_postprocessor
        collector_name = config['type']
        postprocessor = get_postprocessor(collector_name)
        key = config['key']
        parameters = config.get('parameters', {})
        return postprocessor(key, parameters)

    def __init__(self, key, parameters):
        self.key = key
        self.parameters = parameters
    
    def prepare(self):
        self.setup(**self.parameters)

    def setup(self):
        raise NotImplementedError("Postprocessor hasn't implemented its setup function")

    def process(self, current_step, index):
        raise NotImplementedError("Postprocessor hasn't implemented its process function")
