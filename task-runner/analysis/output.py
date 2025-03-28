import json

def print_status(status_message):
    print(json.dumps({
        'type': 'status',
        'message': status_message
    }), flush=True)

def print_error(error_message):
    print(json.dumps({
        'type': 'error',
        'message': error_message
    }), flush=True)

def print_result(result):
    print(json.dumps({
        'type': 'result',
        'result': result
    }), flush=True)
