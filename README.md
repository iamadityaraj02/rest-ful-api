RESTful Recipe API

Run locally (SQLite was replaced with Supabase Postgres)

1. Install deps

```
npm install
```

2. Start server

```
DATABASE_URL=postgres://... npm start
```

The server auto-creates the `recipes` table in your Postgres database on startup.

Endpoints

- POST `/recipes`
- GET `/recipes`
- GET `/recipes/{id}`
- PATCH `/recipes/{id}`
- DELETE `/recipes/{id}`

All responses are JSON with HTTP 200 for the defined endpoints and 404 otherwise.

Deploy notes (free-friendly)

- Create a Supabase project and copy the `Connection string` (Node.js) as `DATABASE_URL`.
- Deploy the Node service to Render/Railway/Fly.io. Configure `DATABASE_URL` env var and enable SSL.
- Start Command: `npm start`. Build Command: `npm install`.
