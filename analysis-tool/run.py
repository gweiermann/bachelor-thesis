#!/usr/bin/env python3

import sys
import traceback
import analyse
import tests
import json
from execution_time_limit import TimeoutException, time_limit
from output import CompilationError, UserError, print_compilation_error, print_error, print_user_error


if __name__ == '__main__':
    if len(sys.argv) != 4:
        print_error("Usage: run.py <mode> <preset> <code>")
        sys.exit(1)
    mode = sys.argv[1]
    preset = json.loads(sys.argv[2])
    code = json.loads(sys.argv[3])

    try:
        with time_limit(10):
            if mode == 'analyse':
                analyse.entrypoint(preset, code)
            elif mode == 'test':
                tests.entrypoint(preset, code)
            else:
                raise ValueError("Invalid mode. Use 'analyse' or 'test'.")
    except UserError as e:
        print_user_error(str(e))
    except CompilationError as e:
        print_compilation_error(e)
    except TimeoutException:
        # will probably be caught by a different try except block, but just in case
        print_error("The operation timed out after 10 seconds. Please try again with a more efficient solution.")
    except Exception as e:
        print_error(traceback.format_exc())
        raise e
