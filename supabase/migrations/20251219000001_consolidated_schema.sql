-- Part 1: Foundation Schema
-- This file creates the core structural tables for the application.
-- Includes: Profiles, Organizations, Farms, Fields, Crops, Finance, Machinery.

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Organizations (RBAC & Multi-tenancy)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    is_personal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('owner', 'admin', 'editor', 'viewer')) NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.organization_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role TEXT CHECK (role IN ('owner', 'admin', 'editor', 'viewer')) NOT NULL,
    token UUID DEFAULT gen_random_uuid() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. User Profiles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    zip_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. Core Farming Entities (Farms, Fields, Crops)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    village TEXT,
    district TEXT,
    state TEXT,
    total_area NUMERIC,
    area_unit TEXT,
    user_id UUID REFERENCES auth.users(id) NOT NULL, -- Original owner
    organization_id UUID REFERENCES public.organizations(id), -- For shared access
    gps_latitude NUMERIC,
    gps_longitude NUMERIC,
    boundaries JSONB, -- GeoJSON polygon
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    area NUMERIC NOT NULL,
    area_unit TEXT NOT NULL,
    soil_type TEXT,
    soil_ph NUMERIC,
    images TEXT[],
    location TEXT,
    boundaries JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catalog of crops (Base data)
CREATE TABLE IF NOT EXISTS public.crops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    variety TEXT,
    description TEXT,
    growing_season TEXT,
    growing_duration INTEGER, -- days
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crops planted in fields
CREATE TABLE IF NOT EXISTS public.field_crops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE NOT NULL,
    crop_id UUID REFERENCES public.crops(id) ON DELETE CASCADE, -- Optional if custom crop
    name TEXT, -- Fallback name if crop_id is usage specific
    planting_date DATE NOT NULL,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    status TEXT CHECK (status IN ('planned', 'planted', 'growing', 'harvested', 'failed')) DEFAULT 'planned',
    yield_amount NUMERIC,
    yield_unit TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. Equipment & Maintenance
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    equipment_type TEXT NOT NULL,
    manufacturer TEXT,
    model TEXT,
    purchase_date DATE,
    purchase_price NUMERIC,
    status TEXT DEFAULT 'active', -- active, maintenance, retired
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.equipment_maintenance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE NOT NULL,
    maintenance_date DATE NOT NULL,
    maintenance_type TEXT NOT NULL,
    cost NUMERIC,
    performed_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. Finance Core
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    user_id UUID REFERENCES auth.users(id), -- Null for system categories
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.financial_categories(id),
    amount NUMERIC NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT,
    payment_method TEXT,
    reference_number TEXT,
    type TEXT CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. Indexes for Foundational Tables
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_farms_user ON public.farms(user_id);
CREATE INDEX IF NOT EXISTS idx_farms_org ON public.farms(organization_id);
CREATE INDEX IF NOT EXISTS idx_fields_farm ON public.fields(farm_id);
CREATE INDEX IF NOT EXISTS idx_field_crops_field ON public.field_crops(field_id);
CREATE INDEX IF NOT EXISTS idx_field_crops_status ON public.field_crops(status);
CREATE INDEX IF NOT EXISTS idx_equipment_farm ON public.equipment(farm_id);
CREATE INDEX IF NOT EXISTS idx_finance_farm ON public.financial_transactions(farm_id);
CREATE INDEX IF NOT EXISTS idx_finance_date ON public.financial_transactions(transaction_date);
