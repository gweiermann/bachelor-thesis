#!/bin/bash
docker build -t ba_gdb_collector . 
docker run --rm -v ./example.cpp:/input/main.cpp -v ./output:/output ba_gdb_collector