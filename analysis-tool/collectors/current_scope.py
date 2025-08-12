from .collector import Collector
from datatypes import transform_variable_list

class CurrentScope(Collector):
    def step(self, frame):
        return transform_variable_list(frame.GetVariables(True, True, False, False))

    def get_initial_value(self):
        return {}
    
    def is_reason_for_new_step(self):
        return False
    