#!/usr/bin/env python3

import sys
import analyse
import tests
import config
import json
from execution_time_limit import TimeoutException, time_limit
from output import print_error

def load_json_string(json_string):
    """
    Load a JSON string and return the parsed object.
    """
    if not json_string.startswith('"') and not json_string.endswith('"'):
        json_string = f'"{json_string}"'
    return json.loads(json_string)

if __name__ == '__main__':
    mode = sys.argv[1]
    preset_name = sys.argv[2]
    code = load_json_string(sys.argv[3])

    preset = config.find_preset(preset_name)

    try:
        with time_limit(10):
            if mode == 'analyse':
                analyse.entrypoint(preset_name, preset, code)
            elif mode == 'test':
                tests.entrypoint(preset_name, preset, code)
            else:
                raise ValueError("Invalid mode. Use 'analyse' or 'test'.")
    except TimeoutException:
        # will probably be caught by a different try except block, but just in case
        print_error("The operation timed out after 10 seconds. Please try again with a more efficient solution.")
