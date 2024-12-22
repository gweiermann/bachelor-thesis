FROM ubuntu:20.04

RUN <<EOF
    apt update
    apt install -y -q g++
    apt update && apt install -y -q gdb
    apt install -y -q python3-dbg
EOF

WORKDIR /app

COPY run.sh gdb.py .
# COPY example.cpp main.cpp

ENTRYPOINT /bin/bash /app/run.sh