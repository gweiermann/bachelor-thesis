#!/bin/bash
docker build -t ba_gdb_collector ./docker
docker run --rm -v ${pwd}/input:/input -v ${pwd}/dist:/output ba_gdb_collector