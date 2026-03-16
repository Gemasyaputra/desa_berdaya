-- Dynamic Form Builder schema
-- Run this against your DATABASE_URL, for example:
--   psql "$DATABASE_URL" -f form-builder-schema.sql

CREATE TABLE IF NOT EXISTS form_categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS category_custom_fields (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES form_categories(id) ON DELETE CASCADE,
  field_name VARCHAR(255) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

