import os
import subprocess
from output import print_status, print_error, print_result

source_filename = "/tmp/main.cpp"
exe = "/tmp/a.out"
function_name = "bubbleSort"

def compile(code):
    """
    Compile the C++ code to a binary executable.
    """
    print_status("Compiling...")
    with open(source_filename, 'w') as f:
        f.write(code)
    os.system(f"clang++-19 -o2 -o {exe} {source_filename}")

def chunks(lst):
    """
    Yield successive chunks from lst where its length is based on the first number of the list.
    """
    if lst == []:
        return
    n = lst[0]
    yield lst[1:n+1]
    yield from chunks(lst[n+1:])

def runTests(test_cases):
    """
    Run the tests specified in the config.
    """
    print_status("Running tests...")
    stdin = ' '.join(
        str(len(test_case['input'])) + ' ' + ' '.join(map(str, test_case['input']))
        for test_case in test_cases
    )
    p = subprocess.run([exe], input=stdin, text=True, capture_output=True)
    if p.returncode != 0:
        print_error("Test execution failed: " + p.stderr)
        return
    stdout = list(map(int, p.stdout.strip().split(' ')))
    output_values = chunks(stdout)

    result_list = [{
        'testCase': test_case,
        'output': output,
        'passed': output == test_case['expectedOutput']
    } for output, test_case in zip(output_values, test_cases)]
    
    print_result(result_list)
