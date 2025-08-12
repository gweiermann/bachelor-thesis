import subprocess
from output import print_status, print_error, print_result
import preparation

executable_filename = "/tmp/a.out"
user_cpp_filename = "/tmp/user.cpp"
main_cpp_filename = "/tmp/main.cpp"


def chunks(lst):
    """
    Yield successive chunks from lst where its length is based on the first number of the list.
    """
    if lst == []:
        return
    n = lst[0]
    yield lst[1:n+1]
    yield from chunks(lst[n+1:])

def test_case_to_stdin(test_case):
    return str(len(test_case['input'])) + ' ' + ' '.join(map(str, test_case['input']))

def run_tests(test_cases, is_secret):
    stdin = str(len(test_cases)) + ' ' + ' '.join(map(test_case_to_stdin, test_cases))
    p = subprocess.run([executable_filename], input=stdin, text=True, capture_output=True)
    
    if p.returncode != 0:
        print_error("Test execution failed: " + p.stderr)
        return
    stdout = list(map(int, p.stdout.strip().split(' ')))
    output_values = chunks(stdout)

    if is_secret:
        return [{
            'suite': 'private',
            'passed': output == test_case['expected']
        } for output, test_case in zip(output_values, test_cases)]
    else:
        return [{
            'testCase': test_case,
            'output': output,
            'suite': 'public',
            'passed': output == test_case['expected']
        } for output, test_case in zip(output_values, test_cases)]

def entrypoint(preset, code):
    """
    Run the tests specified in the preset.
    """

    tokens = preparation.prepare_and_compile(preset, 'test', code, executable_filename, user_cpp_filename, main_cpp_filename)

    print_status("Running tests...")
    
    print_result([
        *run_tests(preset['test']['testcases']['public'], False),
        *run_tests(preset['test']['testcases']['private'], True)
    ])
