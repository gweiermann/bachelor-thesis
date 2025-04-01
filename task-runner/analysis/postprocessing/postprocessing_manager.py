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

        before_list = collected_list

        for postprocessor in self.postprocessors:
            result_list = []
            for i, step in enumerate(before_list):
                result = postprocessor.process(step, i, before_list)
                if result:
                    result_list.append(result)
            before_list = result_list
        return before_list
