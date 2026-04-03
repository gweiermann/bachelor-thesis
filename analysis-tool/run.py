#!/usr/bin/env python3

import argparse
import os
import shutil
import sys
import traceback

import analyse
import tests
from execution_time_limit import TimeoutException, time_limit
from output import CompilationError, UserError, print_compilation_error, print_error, print_user_error

EXTENSIONS_TMP = "/tmp/analysis-extensions"


def _parse_args(argv):
    parser = argparse.ArgumentParser(
        description="Run analysis or tests. Preset and code are read from the bundle (preset.json, code.json).",
        epilog=(
            "Bundle layout: preset.json, code.json, register_extensions.py (+ optional .py modules).\n"
            "Examples:\n"
            "  docker run --rm -i ... IMAGE --extensions-from-stdin analyse < bundle.tar.gz\n"
            "  docker run --rm -v \"$PWD/bundle:/bundle:ro\" ... IMAGE --extensions-dir /bundle analyse"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--extensions-from-stdin",
        action="store_true",
        help="Read a gzip tarball from stdin (preset, code, extensions), then run",
    )
    group.add_argument(
        "--extensions-dir",
        metavar="DIR",
        help="Read bundle from this directory (e.g. docker run -v ...)",
    )
    parser.add_argument("mode", choices=("analyse", "test"))
    return parser.parse_args(argv)


def _prepare_bundle(args):
    from extensions_loader import (
        extract_stdin_tarball_to,
        load_extensions_from_path,
        load_run_payload_from_path,
    )

    if args.extensions_from_stdin:
        shutil.rmtree(EXTENSIONS_TMP, ignore_errors=True)
        os.makedirs(EXTENSIONS_TMP, exist_ok=True)
        extract_stdin_tarball_to(EXTENSIONS_TMP)
        root = EXTENSIONS_TMP
    else:
        root = os.path.abspath(args.extensions_dir)

    preset, code = load_run_payload_from_path(root)
    load_extensions_from_path(root)
    return preset, code


if __name__ == "__main__":
    args = _parse_args(sys.argv[1:])

    try:
        preset, code = _prepare_bundle(args)
    except Exception as e:
        print_error(f"Failed to load run bundle: {e}\n{traceback.format_exc()}")
        sys.exit(1)

    try:
        with time_limit(10):
            if args.mode == "analyse":
                analyse.entrypoint(preset, code)
            else:
                tests.entrypoint(preset, code)
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
