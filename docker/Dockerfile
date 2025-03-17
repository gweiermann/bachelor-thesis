FROM ubuntu:20.04

RUN <<EOF
    apt update
    apt install -y -q g++ gdb python3-dbg
EOF

WORKDIR /app

COPY run.sh gdb.py .
# COPY example.cpp main.cpp

CMD ["/bin/bash", "/app/run.sh"]
