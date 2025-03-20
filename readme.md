# About
This is for my bachelor thesis. I am trying to achieve a code challenge website like leet code. It should be structured in chapters like my lectures would be.
I want my core feature to be that running the code will also visualize, what your own code does, using animations.

# Current Goal
As the visualization is my core feature, I'm trying to start with creating a docker image that collects runtime information about the user's program using gdb.

# Current State
At the moment there's a script that can watch a bubble sort algorithm that sorts an array with a size of max 32 byte.
It's using hardware watchpoints that have a hard limit of 32 byte unforunately.

How to run it:
```sh
cd docker
echo "int main() { return 0; }" | docker compose run --rm app bubbleSort
```

# Frontend
There's also a frontend which is quite handy and runs the command for you. To start use the following commands:
```sh
cd frontend
npm install
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000).