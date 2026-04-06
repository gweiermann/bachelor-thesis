This project is a coding challenge plattform where instead of only showing test cases, it also visualizes every step that your algorithm does.
Each run the analysis-tool container is started with the user code. It steps it through with a debugger and returns a json output that can be visualized by a frontend.

## Cursor Cloud specific instructions

### Architecture overview

Five Docker Compose services, all required:

| Service | Dir | Role |
|---|---|---|
| `frontend` | `frontend/` | Next.js 15 (React 19) dev server |
| `executor` | `executor/` | Express 5 API – receives user code, delegates to analysis-tool containers |
| `preset-db` | `preset-db/` | Express 5 microservice serving challenge templates/configs from `preset-db/config/` |
| `reverse-proxy` | `reverse-proxy/` | Nginx – routes `/` → frontend, `/api/` → executor |
| `analysis-tool` | `analysis-tool/` | Python + LLDB (Ubuntu 20.04) – built as image only; executor spawns it via `docker run` |

### Running the app

```sh
cd /workspace
docker compose up -d          # build & start all services
# App available at http://localhost:3000 (PORT from .env)
```

### Key gotchas

- **Docker-in-Docker**: The executor container mounts `/var/run/docker.sock` to spawn analysis-tool containers. Docker must be running on the host and the socket must be accessible (`chmod 666 /var/run/docker.sock` if needed).
- **`ANALYSIS_DOCKER_IMAGE` env var**: Must match the Compose-built image name. With project root `workspace`, the image is `workspace-analysis-tool`. Already set in `.env`.
- **analysis-tool service** has `entrypoint: sleep infinity` — it exists only to trigger image builds. It does not serve traffic.
- **Frontend dev mode** uses `Dockerfile.dev` and runs `next dev --turbopack` on port 80 inside the container.
- **Lint**: `docker exec workspace-frontend-1 npm run lint` (ESLint via `next lint`).
- **Build check**: `docker exec workspace-frontend-1 npm run build`.
- **No automated test suites** exist for executor or preset-db (`npm test` just prints an error placeholder).
- Preset challenges are defined as file-based configs under `preset-db/config/` (sort, quick-sort, bst-insert).

### Development with hot reload

`docker compose watch` enables live sync/rebuild for all services. Alternatively, `docker compose up -d` and manually rebuild on changes.