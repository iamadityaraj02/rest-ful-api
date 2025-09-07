"use strict";

const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Postgres (Supabase) connection
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : undefined,
});

// Ensure table exists on startup (compatible with spec)
async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recipes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      making_time TEXT NOT NULL,
      serves TEXT NOT NULL,
      ingredients TEXT NOT NULL,
      cost TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}
ensureSchema().catch((err) => {
  console.error("Schema init failed", err);
  process.exit(1);
});

// Helpers
function nowTimestamp() {
  const pad = (n) => String(n).padStart(2, "0");
  const d = new Date();
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function toRecipeRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    making_time: row.making_time,
    serves: row.serves,
    ingredients: row.ingredients,
    cost: row.cost,
    created_at: formatTimestamp(row.created_at),
    updated_at: formatTimestamp(row.updated_at),
  };
}

function formatTimestamp(value) {
  if (!value) return value;
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// POST /recipes - create a recipe
app.post("/recipes", async (req, res) => {
  const { title, making_time, serves, ingredients, cost } = req.body || {};
  if (!title || !making_time || !serves || !ingredients || !cost) {
    res.status(200).json({
      message: "Recipe creation failed!",
      required: "title, making_time, serves, ingredients, cost",
    });
    return;
  }

  const { rows } = await pool.query(
    `INSERT INTO recipes (title, making_time, serves, ingredients, cost)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, making_time, serves, ingredients, cost]
  );
  res
    .status(200)
    .json({
      message: "Recipe successfully created!",
      recipe: [toRecipeRow(rows[0])],
    });
});

// GET /recipes - list all recipes
app.get("/recipes", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM recipes ORDER BY id");
  res.status(200).json({ recipes: rows.map(toRecipeRow) });
});

// GET /recipes/:id - get one
app.get("/recipes/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await pool.query("SELECT * FROM recipes WHERE id = $1", [
    id,
  ]);
  const row = rows[0];
  if (!row) {
    res.status(200).json({ message: "Recipe details by id", recipe: [] });
    return;
  }
  res
    .status(200)
    .json({ message: "Recipe details by id", recipe: [toRecipeRow(row)] });
});

// PATCH /recipes/:id - update
app.patch("/recipes/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { title, making_time, serves, ingredients, cost } = req.body || {};

  const { rows: existingRows } = await pool.query(
    "SELECT * FROM recipes WHERE id = $1",
    [id]
  );
  const row = existingRows[0];
  if (!row) {
    // Spec does not define error body here; align with general rule of 200
    res.status(200).json({ message: "No Recipe found" });
    return;
  }

  const { rows: updatedRows } = await pool.query(
    `UPDATE recipes
     SET title = COALESCE($1, title),
         making_time = COALESCE($2, making_time),
         serves = COALESCE($3, serves),
         ingredients = COALESCE($4, ingredients),
         cost = COALESCE($5, cost),
         updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [title, making_time, serves, ingredients, cost, id]
  );
  res
    .status(200)
    .json({
      message: "Recipe successfully updated!",
      recipe: [toRecipeRow(updatedRows[0])],
    });
});

// DELETE /recipes/:id - delete
app.delete("/recipes/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { rowCount } = await pool.query("DELETE FROM recipes WHERE id = $1", [
    id,
  ]);
  if (rowCount === 0) {
    res.status(200).json({ message: "No Recipe found" });
    return;
  }
  res.status(200).json({ message: "Recipe successfully removed!" });
});

// 404 for any other endpoint
app.use((_req, res) => {
  res.status(404).json({ message: "Not Found" });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
