import subprocess
import shutil
import os
from output import print_status
from clang import cindex
import sanitize_code

main_cpp_filename = "/tmp/main.cpp"
exe = "/tmp/a.out"

def copy_files(src_dsts):
    """
    Copies files from src_dsts[i][0] to src_dsts[i][1].
    """
    for src, dst in src_dsts:
        shutil.copyfile(src, dst)

def create_files(preset, type, code, user_cpp_filename):
    """
    Creates source files based on user input
    """
    # Find out which files to use
    main_cpp_filename = preset['analysis_cpp_filename'] if type == 'analysis' else preset['test_cpp_filename']
    
    # Generate cpp file based on user input
    user_cpp_content = code
    with open(user_cpp_filename, 'w') as f: f.write(user_cpp_content)

    # Get a list of h and cpp files to copy and compile
    files = [
        main_cpp_filename,
        user_cpp_filename
    ]

    # Map files to their destination paths
    src_dsts = [
        (filename, '/tmp/' + os.path.basename(filename)) for filename in files
    ]

    # Copy the files to the tmp directory (if they aren't there yet)
    for src, dst in src_dsts:
        if src != dst:
            shutil.copyfile(src, dst)

    return [destination for _, destination in src_dsts]

    

def compile_target(cpp_files, output_file, compile_flags=[]):
    """
    Compiles and links all supplied source files.
    """

    # map cpp files to their o filenames
    cpp_o_files = [(filename, filename.replace('.cpp', '.o')) for filename in cpp_files]

    print_status("Compiling...")
    for cpp_file, o_file in cpp_o_files:
        subprocess.run(['clang++-19', *compile_flags, '-c', cpp_file, '-o', o_file], check=True)
    
    file_flags = ['-o', output_file] + [o_file for _, o_file in cpp_o_files]
    subprocess.run(['clang++-19', *compile_flags, *file_flags], check=True)


def prepare_and_compile(preset, type, code, executable_filename, user_cpp_filename, template_cpp_filename):
    """
    Prepares the environment for analysis or testing by copying files and compiling them.
    """
    compile_flags = type == 'analysis' and ['-g'] or ['-O2']

    print_status("Preparing...")
    files = create_files(preset, type, code, user_cpp_filename)
    cpp_files = [f for f in files if f.endswith('.cpp')]

    # Check if user code obeys to the rules
    print_status("Validating...")
    index = cindex.Index.create()
    tokens = index.parse(user_cpp_filename, args=['-std=c++17'])
    sanitize_code.check_code(tokens, allow_includes=False)
    sanitize_code.ensure_code_structure(tokens, template_cpp_filename)

    print_status("Compiling...")
    compile_target(cpp_files, executable_filename, compile_flags)

    return tokens