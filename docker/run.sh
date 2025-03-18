#!/bin/bash

path=/app/algorithms/$1

clang++-19 -g $path/main.cpp -o /tmp/a.out
python3 $path/analyze.py
