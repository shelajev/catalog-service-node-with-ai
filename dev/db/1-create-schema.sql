CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL, 
  category VARCHAR(50) NOT NULL,
  upc VARCHAR(64) NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  has_image BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE saved_recommendations (
  id SERIAL PRIMARY KEY,
  source_product_id INTEGER NOT NULL REFERENCES products(id),
  recommended_product_id INTEGER NOT NULL REFERENCES products(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_product_id, recommended_product_id)
);


