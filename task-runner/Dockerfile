FROM node:22-bookworm

# add docker capabilities
RUN wget -O- get.docker.com | sh

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 80

CMD docker build -t registry:5000/task-runner-worker ./analysis && node index.js
# CMD ["docker", "build", "-t", "task-runner-worker", "./analysis", "&&", "node", "index.js"]
