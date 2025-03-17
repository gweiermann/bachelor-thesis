#!/bin/bash

g++ /input/main.cpp -g -o a.out
gdb -x gdb.py


# g++ -fdump-tree-all-graph main.c -o main