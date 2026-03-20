# Sappey Backend

## Overview
This backend is built with **Express + TypeScript** and uses **Sequelize** (PostgreSQL) for data persistence. It is structured to support modular features and scalability.

## Key folders
- `src/config` — centralized configuration (env vars, JWT, session)
- `src/db` — database setup, migrations, and models
- `src/modules` — feature modules (users, auth, etc.)
- `src/middleware` — shared request middleware (auth, error handling)
- `src/utils` — shared helpers (errors, hashing)
- `src/types` — shared TypeScript types

## Getting started
1. Set up Redis for session storage:
   - **Windows**: Download Redis from https://github.com/microsoftarchive/redis/releases (choose redis-x.x.x.zip)
     - Extract the zip file
     - Run `redis-server.exe` from the extracted folder
     - Keep it running in a separate terminal/command prompt
   - **Linux/Mac**: Install via package manager or use Docker:
     ```sh
     docker run -d -p 6379:6379 --name redis redis:alpine
     ```
   - Or install Redis from https://redis.io/download
   - Update `REDIS_URL` in `.env` if needed (default: redis://localhost:6379)

2. Copy `.env.example` to `.env` and update values.

3. Install dependencies:
   ```sh
   npm install
   ```

4. Create the database and run migrations:
   ```sh
   npm run migrate
   ```

5. Start the server:
   ```sh
   npm run dev
   ```

## Common commands
- `npm run dev` — start in development mode (auto-reload)
- `npm run build` — build TypeScript to `dist`
- `npm run start` — run production build
- `npm run migrate` — apply database migrations
- `npm run migrate:undo` — rollback latest migration
- `npm test` — run unit tests
