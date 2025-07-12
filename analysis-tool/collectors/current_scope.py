from .buffered_collector import BufferedCollector

class CurrentScope(BufferedCollector):
    def buffered_step(self, frame):
        varlist = frame.GetVariables(True, True, False, False)
        return {var.GetName(): {
            'value': var.GetValue(),
            'type': var.GetType().GetDisplayTypeName(),
            'isPointer': var.GetType().IsPointerType(),
            'isReference': var.GetType().IsReferenceType(),
        } for var in varlist}
    
    def get_initial_value(self):
        return {}
    
    def is_reason_for_new_step(self):
        return False
