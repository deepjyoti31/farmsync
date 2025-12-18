-- Part 2: Feature Modules
-- This file creates tables for specific application modules: 
-- Harvests, Sustainability, IoT, Forums, Marketing, Marketplace, Compliance, Coop, Finance(adv).

-- -----------------------------------------------------------------------------
-- 1. Harvest Management
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.harvests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    field_crop_id UUID REFERENCES public.field_crops(id) ON DELETE CASCADE NOT NULL,
    harvest_date DATE DEFAULT CURRENT_DATE NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    notes TEXT,
    revenue DECIMAL(10, 2)
);

CREATE INDEX IF NOT EXISTS idx_harvests_field_crop_id ON public.harvests(field_crop_id);
CREATE INDEX IF NOT EXISTS idx_harvests_date ON public.harvests(harvest_date);


-- -----------------------------------------------------------------------------
-- 2. Sustainability & Resource Management
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sustainability_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
    log_date DATE DEFAULT CURRENT_DATE NOT NULL,
    type TEXT NOT NULL, -- 'fertilizer', 'pesticide', 'herbicide', 'fungicide', 'other'
    product_name TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    method TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.water_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
    usage_date DATE DEFAULT CURRENT_DATE NOT NULL,
    volume DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    source TEXT -- 'well', 'rainwater', 'municipal', 'canal'
);

CREATE INDEX IF NOT EXISTS idx_sustainability_logs_field_id ON public.sustainability_logs(field_id);
CREATE INDEX IF NOT EXISTS idx_water_usage_field_id ON public.water_usage(field_id);


-- -----------------------------------------------------------------------------
-- 3. IoT & Smart Farming
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'weather_station', 'soil_sensor', 'drone', 'generic'
    external_id TEXT, -- Hardware serial number
    api_key TEXT NOT NULL,
    configuration JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.telemetry (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    data JSONB NOT NULL,
    type TEXT -- 'interval_reading', 'alert'
);

CREATE INDEX IF NOT EXISTS idx_devices_farm_id ON public.devices(farm_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_device_id ON public.telemetry(device_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON public.telemetry(timestamp DESC);


-- -----------------------------------------------------------------------------
-- 4. Community & Forums
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    forum_id UUID REFERENCES public.forums(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_forum ON public.forum_posts(forum_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);


-- -----------------------------------------------------------------------------
-- 5. Marketing & Market Data
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name TEXT NOT NULL,
    role TEXT,
    quote TEXT NOT NULL,
    image_url TEXT,
    rating SMALLINT,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.app_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    display_order INTEGER,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.market_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name TEXT NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    market_location TEXT,
    price_date DATE NOT NULL,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_market_data_crop_name ON public.market_data(crop_name);
CREATE INDEX IF NOT EXISTS idx_market_data_price_date ON public.market_data(price_date);


-- -----------------------------------------------------------------------------
-- 6. Marketplace & Suppliers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references public.farms(id) on delete cascade not null,
  seller_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  category text not null,
  price_per_unit numeric not null check (price_per_unit >= 0),
  unit text not null,
  quantity_available numeric not null check (quantity_available >= 0),
  min_order_quantity numeric not null default 1 check (min_order_quantity > 0),
  available_date date not null default current_date,
  location jsonb not null default '{}'::jsonb,
  images text[] default array[]::text[],
  status text not null default 'active' check (status in ('active', 'sold', 'expired')),
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.marketplace_listings(id) on delete cascade not null,
  buyer_id uuid references auth.users(id) on delete cascade not null,
  message text not null,
  offer_price numeric check (offer_price >= 0),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  contact_info jsonb default '{}'::jsonb,
  location text not null,
  description text,
  verified boolean default false,
  image_url text,
  created_at timestamptz default now()
);


-- -----------------------------------------------------------------------------
-- 7. Compliance
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compliance_standards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    version TEXT,
    authority TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.compliance_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    standard_id UUID REFERENCES public.compliance_standards(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    rule_description TEXT NOT NULL,
    validation_logic JSONB NOT NULL,
    severity TEXT CHECK (severity IN ('critical', 'major', 'minor')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.farm_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    standard_id UUID REFERENCES public.compliance_standards(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('active', 'suspended')) DEFAULT 'active',
    start_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(farm_id, standard_id)
);

CREATE TABLE IF NOT EXISTS public.compliance_audits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    severity_score INT DEFAULT 0,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    results JSONB NOT NULL
);


-- -----------------------------------------------------------------------------
-- 8. Cooperatives & Bulk Orders
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bulk_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('open', 'closed', 'ordered', 'delivered')) DEFAULT 'open',
    deadline TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bulk_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bulk_order_id UUID REFERENCES public.bulk_orders(id) ON DELETE CASCADE NOT NULL,
    product_name TEXT NOT NULL,
    unit_price NUMERIC NOT NULL,
    unit TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.member_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bulk_order_id UUID REFERENCES public.bulk_orders(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    items JSONB NOT NULL,
    status TEXT CHECK (status IN ('committed', 'paid')) DEFAULT 'committed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bulk_order_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.produce_batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    batch_number TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    total_quantity NUMERIC DEFAULT 0,
    status TEXT CHECK (status IN ('collecting', 'processing', 'shipped')) DEFAULT 'collecting',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.batch_contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID REFERENCES public.produce_batches(id) ON DELETE CASCADE NOT NULL,
    harvest_id UUID,
    quantity NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- -----------------------------------------------------------------------------
-- 9. Advanced Finance (Loans, Insurance)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    interest_rate NUMERIC NOT NULL,
    term_months INT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'paid')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.insurance_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    coverage_type TEXT NOT NULL,
    premium_amount NUMERIC NOT NULL,
    coverage_amount NUMERIC NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT CHECK (status IN ('active', 'expired')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.insurance_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID REFERENCES public.insurance_policies(id) ON DELETE CASCADE NOT NULL,
    claim_date DATE DEFAULT CURRENT_DATE,
    reason TEXT NOT NULL,
    evidence TEXT,
    amount_requested NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('submitted', 'reviewing', 'approved', 'rejected')) DEFAULT 'submitted',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('loan_repayment', 'premium', 'input_purchase')),
    amount NUMERIC NOT NULL,
    provider TEXT CHECK (provider IN ('stripe', 'mpesa', 'cash')),
    status TEXT CHECK (status IN ('completed', 'failed')) DEFAULT 'completed',
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
