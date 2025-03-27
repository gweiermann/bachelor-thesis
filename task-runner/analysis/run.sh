#!/bin/bash

# put contents of argument into a cpp file
cat - > /tmp/main.cpp

# compile it
echo '{"type": "status", "message": "Compiling..."}'
clang++-19 -g /tmp/main.cpp -o /tmp/a.out

# analyze it
python3 /app/main.py
