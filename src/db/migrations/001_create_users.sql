-- Migration 001: Create users table

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(10)  NOT NULL DEFAULT 'EMP',
  created_at TIMESTAMP DEFAULT NOW()
);
