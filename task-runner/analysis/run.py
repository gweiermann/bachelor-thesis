#!/usr/bin/env python3

import sys
import json
import analyse
import tests

if __name__ == '__main__':
    data = json.loads(sys.argv[1])
    mode = data['type']

    if mode == 'analyse':
        analyse.compile(data['code'])
        analyse.analyse(data['config'])
    elif mode == 'test':
        tests.compile(data['code'])
        tests.runTests(data['testCases'])
    else:
        raise ValueError("Invalid mode. Use 'analyse' or 'test'.")