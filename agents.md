This project is a coding challenge plattform where instead of only showing test cases, it also visualizes every step that your algorithm does.
Each run the analysis-tool container is started with the user code. It steps it through with a debugger and returns a json output that can be visualized by a frontend.

Commands:
```bash
docker compose up -d # start the environment
docker compose exec frontend npm ... # run npm commands
docker compose logs frontend # check the dev watchers logs
```

Steering:
- don't remove todo comments unless you fix them and verify they are actually fully implemented
- don't remove comments that explain concepts
- don't remove left over comments that are supposed to quickly swap out multiple solutions