CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- Clerk user ID
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);