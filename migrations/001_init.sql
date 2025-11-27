-- 1. Create Enum safely
DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACTED', 'RESPONDED', 'IGNORED', 'CONVERTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Table
CREATE TABLE IF NOT EXISTS leads (
  id serial PRIMARY KEY,
  place_id text UNIQUE NOT NULL,
  
  -- Basic Info
  name text NOT NULL,
  address text,
  lat double precision,
  lng double precision,
  
  -- Contact Info
  phone text,
  website text, -- Target if NULL
  google_url text,
  
  -- Metadata
  category text,
  rating numeric(2,1),
  user_ratings_total integer,
  
  -- Lifecycle Logic
  status lead_status DEFAULT 'NEW',
  found_at timestamptz DEFAULT now(),
  
  -- Contact Tracking
  contacted boolean DEFAULT false,
  contact_attempts int DEFAULT 0,
  last_contacted_at timestamptz,
  
  -- Debugging
  raw_data jsonb,
  internal_notes text
);

-- 3. Indexes for Speed
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_found_at ON leads(found_at DESC);