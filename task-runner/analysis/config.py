import os
import json

def read_json(filename):
    with open(filename, 'r') as f:
        return json.load(f)

def find_preset(name):
    """
    Get the configuration for the given name. (Located in /config)
    """
    dir = f"/app/config/{name}"
    if not os.path.isdir(dir):
        raise ValueError(f"There is no preset for {name}.")
    manifest_file = dir + "/manifest.json"
    h_file = dir + "/user-input.h"
    analysis_config_file = dir + "/analysis/analysis.json"
    analysis_cpp_file = dir + "/analysis/main.cpp"
    test_config_file = dir + "/test/testcases.json"
    test_cpp_file = dir + "/test/main.cpp"

    if not os.path.isfile(manifest_file):
        raise ValueError(f"Manifest file {manifest_file} does not exist.")
    if not os.path.isfile(h_file):
        raise ValueError(f"Header file {h_file} does not exist.")
    if not os.path.isfile(analysis_config_file):
        raise ValueError(f"Analysis config file {analysis_config_file} does not exist.")
    if not os.path.isfile(analysis_cpp_file):
        raise ValueError(f"Analysis cpp file {analysis_cpp_file} does not exist.")
    if not os.path.isfile(test_config_file):
        raise ValueError(f"Test config file {test_config_file} does not exist.")
    if not os.path.isfile(test_cpp_file):
        raise ValueError(f"Test cpp file {test_cpp_file} does not exist.")
    
    return {
        'manifest': read_json(manifest_file),
        'h_filename': h_file,
        'analysis': read_json(analysis_config_file),
        'analysis_cpp_filename': analysis_cpp_file,
        'testcases': read_json(test_config_file),
        'test_cpp_filename': test_cpp_file
    }