# SauroraaTransfers

SauroraaTransfers est un MVP full-stack inspire du concept `Aurora Stream Upload Experience`.

- page unique immersive pour deposer des fichiers
- upload multi-fichiers sans compte
- lien public de telechargement
- expiration configurable
- mot de passe et limite de telechargements optionnels
- stack Docker avec `nginx`, `frontend`, `api`, `mariadb`

## Stack

- `frontend`: React + Vite + Framer Motion
- `api`: Node.js + Fastify + MariaDB
- `proxy`: Nginx
- `storage`: volume local pour les fichiers

## Demarrage

1. Copier `.env.example` vers `.env`
2. Ajuster les secrets si necessaire
3. Verifier dans `.env` que `APP_BASE_URL` et `VITE_API_BASE_URL` pointent vers `http://dl.sauroraa.be`
4. Lancer `docker compose up --build`

L'application sera disponible sur `http://dl.sauroraa.be`.

## Endpoints MVP

- `GET /api/health`
- `POST /api/transfers`
- `GET /api/transfers/:token`
- `GET /api/download/:token/:fileId`
- `POST /api/transfers/:token/verify`
