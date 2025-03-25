#!/bin/bash

# put contents of argument into a cpp file
cat - > /tmp/main.cpp

path=/app/algorithms/$1

# compile it
echo '{ "type": "status", "message": "Compiling..." }'
clang++-19 -g /tmp/main.cpp -o /tmp/a.out

# analyze it
echo '{ "type": "status", "message": "Analysing..." }'
python3 $path/analyze.py
