
CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auth_uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 2 AND 80),
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_created_at ON customer_profiles(created_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_uid TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_uid, created_at);

INSERT INTO categories (slug, name_ar, name_en, sort_order, is_active) VALUES
  ('tees', 'تيشيرتات', 'T-shirts', 1, 1),
  ('pants', 'بناطيل وجينز', 'Pants & jeans', 2, 1),
  ('sports', 'ملابس رياضية', 'Sportswear', 3, 1),
  ('hoodies', 'هوديز', 'Hoodies', 4, 1),
  ('shirts', 'قمصان', 'Shirts', 5, 1),
  ('jackets', 'جاكيتات', 'Jackets', 6, 1)
ON CONFLICT(slug) DO NOTHING;
