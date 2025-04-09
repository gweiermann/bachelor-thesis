#!/usr/bin/env python3

import sys
import analyse
import tests
import config
import json

def load_json_string(json_string):
    """
    Load a JSON string and return the parsed object.
    """
    if not json_string.startswith('"') and not json_string.endswith('"'):
        json_string = f'"{json_string}"'
    return json.loads(json_string)

if __name__ == '__main__':
    mode = sys.argv[1]
    preset = sys.argv[2]

    # print(' '.join(sys.argv[1:]))

    data = config.find_preset(preset)

    if mode == 'analyse':
        function_bodies = list(map(load_json_string, sys.argv[3:]))
        analyse.entrypoint(data, function_bodies)
    elif mode == 'test':
        tests.compile(data['code'])
        tests.runTests(data['testCases'])
    else:
        raise ValueError("Invalid mode. Use 'analyse' or 'test'.")