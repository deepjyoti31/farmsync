-- Bulk Orders Table
CREATE TABLE IF NOT EXISTS public.bulk_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('open', 'closed', 'ordered', 'delivered')) DEFAULT 'open',
    deadline TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bulk Order Items Table
CREATE TABLE IF NOT EXISTS public.bulk_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bulk_order_id UUID REFERENCES public.bulk_orders(id) ON DELETE CASCADE NOT NULL,
    product_name TEXT NOT NULL,
    unit_price NUMERIC NOT NULL,
    unit TEXT NOT NULL
);

-- Member Orders Table
CREATE TABLE IF NOT EXISTS public.member_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bulk_order_id UUID REFERENCES public.bulk_orders(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    items JSONB NOT NULL, -- Array of {product_name, quantity}
    status TEXT CHECK (status IN ('committed', 'paid')) DEFAULT 'committed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bulk_order_id, user_id)
);

-- Produce Batches Table
CREATE TABLE IF NOT EXISTS public.produce_batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    batch_number TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    total_quantity NUMERIC DEFAULT 0,
    status TEXT CHECK (status IN ('collecting', 'processing', 'shipped')) DEFAULT 'collecting',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch Contributions Table
CREATE TABLE IF NOT EXISTS public.batch_contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID REFERENCES public.produce_batches(id) ON DELETE CASCADE NOT NULL,
    harvest_id UUID, -- Optional link to harvests table if it exists
    quantity NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bulk_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produce_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Bulk Orders: Visible to all org members
CREATE POLICY "Org members can view bulk orders" 
ON public.bulk_orders FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members 
        WHERE organization_id = bulk_orders.organization_id 
        AND user_id = auth.uid()
    )
);

-- Bulk Orders: Owners/Admins can manage
CREATE POLICY "Admins can manage bulk orders" 
ON public.bulk_orders FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members 
        WHERE organization_id = bulk_orders.organization_id 
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- Member Orders: Users can see their own orders AND Admins can see all
CREATE POLICY "Users view own commitments" 
ON public.member_orders FOR SELECT 
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.bulk_orders bo
        JOIN public.organization_members om ON bo.organization_id = om.organization_id
        WHERE bo.id = member_orders.bulk_order_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
);

-- Member Orders: Users can create/edit their own commitments
CREATE POLICY "Users manage own commitments" 
ON public.member_orders FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own commitments" 
ON public.member_orders FOR UPDATE
USING (user_id = auth.uid());

-- Produce Batches: Viewable by all org members
CREATE POLICY "Org members view batches" 
ON public.produce_batches FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members 
        WHERE organization_id = produce_batches.organization_id 
        AND user_id = auth.uid()
    )
);

-- Produce Batches: Managed by Admins
CREATE POLICY "Admins manage batches" 
ON public.produce_batches FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members 
        WHERE organization_id = produce_batches.organization_id 
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);
