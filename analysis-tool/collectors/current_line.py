from .buffered_collector import BufferedCollector

class CurrentLine(BufferedCollector):
    def buffered_step(self, frame):
        return frame.GetLineEntry().GetLine()
    
    def is_reason_for_new_step(self):
        return False
