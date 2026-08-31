-- ============================================================================
-- LogistAI — PostgreSQL schema
-- Core tables below match the product spec exactly. A few tables/columns are
-- additive (clearly marked) to make order history, ratings, admin balance
-- audit trail and AI failover ordering actually work end-to-end.
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('driver', 'shipper', 'admin')),
    balance NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS driver_profiles (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    car_name VARCHAR(100) NOT NULL,
    car_number VARCHAR(20) NOT NULL,
    car_year INT NOT NULL,
    capacity_tons NUMERIC(5, 2) NOT NULL,
    car_photo_url TEXT NOT NULL,
    license_photo_url TEXT,                 -- extension: texpasport rasmi, needed for admin verification
    rating NUMERIC(3, 2) DEFAULT 5.00
);

CREATE TABLE IF NOT EXISTS driver_daily_status (
    id SERIAL PRIMARY KEY,
    driver_id INT REFERENCES users(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    current_location VARCHAR(100) NOT NULL,
    destination_location VARCHAR(100) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('available', 'busy', 'day_off')),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- one row per driver per day keeps "today's status" trivial to upsert/query
CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_status_unique_per_day
    ON driver_daily_status (driver_id, date);

CREATE TABLE IF NOT EXISTS ai_configs (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL,
    provider VARCHAR(50) DEFAULT 'openai',
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,
    priority INT DEFAULT 0,                 -- extension: failover order, lower = tried first
    label VARCHAR(100),                     -- extension: friendly name shown in admin panel
    last_error TEXT,                        -- extension: last failure reason (quota/auth/timeout)
    last_used_at TIMESTAMP                  -- extension: observability
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- extension: cargo bookings — powers "Buyurtmalar tarixi" on the driver
-- dashboard and the rating that feeds driver_profiles.rating.
CREATE TABLE IF NOT EXISTS cargo_orders (
    id SERIAL PRIMARY KEY,
    shipper_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    driver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_location VARCHAR(100) NOT NULL,
    to_location VARCHAR(100) NOT NULL,
    cargo_description TEXT,
    weight_tons NUMERIC(5, 2),
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'in_transit', 'completed', 'cancelled')),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    rating_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- extension: audit trail for the admin's manual balance refill feature
CREATE TABLE IF NOT EXISTS balance_transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_id INT REFERENCES users(id),
    amount NUMERIC(12, 2) NOT NULL,
    type VARCHAR(20) DEFAULT 'refill' CHECK (type IN ('refill', 'deduction')),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role_status ON users (role, status);
CREATE INDEX IF NOT EXISTS idx_cargo_orders_driver ON cargo_orders (driver_id);
CREATE INDEX IF NOT EXISTS idx_cargo_orders_shipper ON cargo_orders (shipper_id);
CREATE INDEX IF NOT EXISTS idx_daily_status_status ON driver_daily_status (status, date);
