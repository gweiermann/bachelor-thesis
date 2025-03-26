import json

class ExecutionError(Exception):
    def __init__(self, message):
        self.message = message
        print(json.dumps({ "type": "error", "message": message }))
        super().__init__(message)
        