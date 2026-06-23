-- Hill Thrill Voice MVP — PostgreSQL Schema
-- Run: psql -U postgres -d hill_thrill -f sql/001_schema.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- Inventory (Phase 1: mock seed | Phase 2: DealerCenter XML sync)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
    id            SERIAL PRIMARY KEY,
    stock_no      VARCHAR(50) UNIQUE NOT NULL,
    make          VARCHAR(100) NOT NULL,
    model         VARCHAR(100) NOT NULL,
    year          INTEGER,
    price         DECIMAL(10, 2),
    mileage       INTEGER,
    color         VARCHAR(50),
    status        VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'sold')),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_make_model ON inventory (make, model);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory (status);

-- ---------------------------------------------------------------------------
-- Leads (voice now; chat/form later via source column)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
    id                      SERIAL PRIMARY KEY,
    phone                   VARCHAR(20) NOT NULL,
    name                    VARCHAR(255),
    source                  VARCHAR(50) DEFAULT 'inbound_voice',
    vehicle_interest        TEXT,
    qualification           VARCHAR(20) CHECK (qualification IN ('hot', 'warm', 'cold')),
    status                  VARCHAR(50) DEFAULT 'new',
    ai_summary              TEXT,
    appointment_at          TIMESTAMPTZ,
    needs_post_processing   BOOLEAN DEFAULT FALSE,
    needs_handoff           BOOLEAN DEFAULT FALSE,
    failure_reason          TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads (phone);
CREATE INDEX IF NOT EXISTS idx_leads_post_processing ON leads (needs_post_processing) WHERE needs_post_processing = TRUE;
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);

-- ---------------------------------------------------------------------------
-- Active call sessions (Twilio CallSid tracking)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS call_sessions (
    id            SERIAL PRIMARY KEY,
    call_sid      VARCHAR(100) UNIQUE NOT NULL,
    lead_id       INTEGER REFERENCES leads (id) ON DELETE SET NULL,
    caller_phone  VARCHAR(20) NOT NULL,
    status        VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    started_at    TIMESTAMPTZ DEFAULT NOW(),
    ended_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_call_sessions_call_sid ON call_sessions (call_sid);
CREATE INDEX IF NOT EXISTS idx_call_sessions_lead_id ON call_sessions (lead_id);

-- ---------------------------------------------------------------------------
-- Conversations (voice turns now; chat messages later via channel column)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id          SERIAL PRIMARY KEY,
    lead_id     INTEGER REFERENCES leads (id) ON DELETE CASCADE,
    channel     VARCHAR(20) DEFAULT 'voice',
    call_sid    VARCHAR(100),
    role        VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_call_sid ON conversations (call_sid);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations (lead_id);

-- ---------------------------------------------------------------------------
-- Workflow run logs (matches existing repo pattern)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_logs (
    id              SERIAL PRIMARY KEY,
    workflow_name   VARCHAR(100) NOT NULL,
    run_at          TIMESTAMPTZ DEFAULT NOW(),
    leads_processed INTEGER DEFAULT 0,
    leads_failed    INTEGER DEFAULT 0,
    duration_ms     INTEGER DEFAULT 0,
    notes           TEXT
);

-- ---------------------------------------------------------------------------
-- Mock inventory seed — Hill Thrill Motoplex style catalog
-- ---------------------------------------------------------------------------
INSERT INTO inventory (stock_no, make, model, year, price, mileage, color, status)
VALUES
    ('HT-001', 'BMW',       'M1000RR',           2026, 42995.00,  120,  'White',      'available'),
    ('HT-002', 'BMW',       'M1000RR M Competition', 2026, 44995.00, 45,   'Black',      'available'),
    ('HT-003', 'Kawasaki',  'ZX-10R',            2024, 18999.00, 2400,  'Green',      'available'),
    ('HT-004', 'Kawasaki',  'Ninja 650',         2023,  7999.00, 5100,  'Blue',       'available'),
    ('HT-005', 'Ducati',    'Panigale V4',       2023, 27999.00, 4200,  'Red',        'available'),
    ('HT-006', 'Ducati',    'Panigale V2',       2024, 19999.00, 1800,  'Red',        'available'),
    ('HT-007', 'Yamaha',    'R1',                2024, 18995.00, 3200,  'Blue',       'available'),
    ('HT-008', 'Yamaha',    'MT-09',             2023,  9499.00, 6800,  'Dark Gray',  'available'),
    ('HT-009', 'Honda',     'CBR1000RR-R',       2024, 21999.00, 1500,  'Red/White',  'available'),
    ('HT-010', 'Honda',     'Rebel 1100',        2023, 10999.00, 4200,  'Black',      'available'),
    ('HT-011', 'Suzuki',    'Hayabusa',          2024, 19999.00, 900,   'Black/Gold', 'available'),
    ('HT-012', 'Suzuki',    'GSX-R750',          2022, 11999.00, 8900,  'Blue/White', 'available'),
    ('HT-013', 'Can-Am',    'Ryker 900',         2024, 11999.00, 2100,  'Yellow',     'available'),
    ('HT-014', 'Polaris',   'RZR XP 1000',       2023, 22999.00, 3400,  'Camo',       'available'),
    ('HT-015', 'Harley-Davidson', 'Street Glide', 2022, 24999.00, 12000, 'Black',     'available'),
    ('HT-016', 'Triumph',   'Speed Triple 1200', 2024, 17999.00, 2200,  'Silver',     'available'),
    ('HT-017', 'Aprilia',   'RSV4',              2023, 19999.00, 3600,  'Black/Red',  'available'),
    ('HT-018', 'KTM',       '1290 Super Duke R', 2024, 19999.00, 1100,  'Orange',     'available'),
    ('HT-019', 'BMW',       'S1000RR',           2023, 19995.00, 5800,  'White/Red',  'available'),
    ('HT-020', 'Ducati',    'Panigale V4',       2022, 24999.00, 7200,  'Red',        'sold')
ON CONFLICT (stock_no) DO UPDATE SET
    make       = EXCLUDED.make,
    model      = EXCLUDED.model,
    year       = EXCLUDED.year,
    price      = EXCLUDED.price,
    mileage    = EXCLUDED.mileage,
    color      = EXCLUDED.color,
    status     = EXCLUDED.status,
    updated_at = NOW();

COMMIT;
