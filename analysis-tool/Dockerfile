FROM ubuntu:20.04

ENV llvmVersion=19

RUN apt update -yq
RUN apt install -yq lsb-release wget software-properties-common apt-utils
RUN wget -O - https://apt.llvm.org/llvm-snapshot.gpg.key|apt-key add -
RUN add-apt-repository -y "deb http://apt.llvm.org/focal/ llvm-toolchain-focal-${llvmVersion} main"
RUN apt update -yq
RUN apt install -yq clang-${llvmVersion} lldb-${llvmVersion} lld-${llvmVersion} python3 python3-clang-${llvmVersion} python3-pip
RUN pip install clang

ENV LLDB_DEBUGSERVER_PATH=/usr/bin/lldb-server-19
ENV PYTHONPATH=/usr/lib/python3/dist-packages:/app

WORKDIR /app

RUN groupadd -r myuser && useradd -r -g myuser myuser
RUN chown -R myuser:myuser /app
USER myuser

COPY . .

ENTRYPOINT ["python3", "/app/run.py"]
