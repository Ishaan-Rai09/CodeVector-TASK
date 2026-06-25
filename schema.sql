-- Products table for CodeVector internship task
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast "newest first" pagination
CREATE INDEX IF NOT EXISTS idx_products_created_id ON products (created_at DESC, id DESC);

-- Index for category filtering + pagination
CREATE INDEX IF NOT EXISTS idx_products_category_created_id ON products (category, created_at DESC, id DESC);

-- Allow public access (no auth needed for this demo)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON products FOR ALL USING (true) WITH CHECK (true);
