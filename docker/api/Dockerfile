FROM node:22-alpine

WORKDIR /app

COPY api/package*.json ./api/
RUN cd api && npm install

COPY api ./api
COPY storage ./storage

WORKDIR /app/api

EXPOSE 8080

CMD ["npm", "start"]

