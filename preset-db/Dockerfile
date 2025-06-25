FROM node:22-bookworm

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN groupadd -r myuser && useradd -r -g myuser myuser
RUN chown -R myuser:myuser /app
USER myuser

EXPOSE 80

CMD ["node", "db.js"]
