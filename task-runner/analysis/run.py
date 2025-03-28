#!/usr/bin/env python3

import sys
import analyse
import json

if __name__ == '__main__':
    mode = sys.argv[1]
    data = json.loads(sys.argv[2])

    if mode == 'analyse':
        analyse.compile(data['code'])
        analyse.analyse(data['config'])
    elif mode == 'test':
        raise NotImplementedError("Test mode is not implemented yet")
    else:
        raise ValueError("Invalid mode. Use 'analyse' or 'test'.")