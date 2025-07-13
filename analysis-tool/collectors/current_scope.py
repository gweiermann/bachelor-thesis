from .buffered_collector import BufferedCollector
from datatypes import transform_variable_list

class CurrentScope(BufferedCollector):
    def buffered_step(self, frame):
        return transform_variable_list(frame.GetVariables(True, True, False, False))

    def get_initial_value(self):
        return {}
    
    def is_reason_for_new_step(self):
        return False
    