from .postprocessor import Postprocessor

class PostprocessingManager:
    def from_dict(config):
        postprocessors = [Postprocessor.from_dict(c) for c in config]
        return PostprocessingManager(postprocessors)

    def __init__(self, postprocessors):
        self.postprocessors = postprocessors

    def process(self, collected_list):
        """
        Process the result of the collectors.
        """
        for postprocessor in self.postprocessors:
            postprocessor.prepare()

        for postprocessor in self.postprocessors:
            collected_list = postprocessor.process(collected_list)
        return collected_list
