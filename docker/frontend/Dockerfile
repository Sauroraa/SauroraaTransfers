FROM node:22-alpine

WORKDIR /app

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend ./frontend

WORKDIR /app/frontend

RUN npm run build

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
