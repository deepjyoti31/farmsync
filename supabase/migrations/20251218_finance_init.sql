
-- Loans Table
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

-- Insurance Policies Table
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

-- Insurance Claims Table
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

-- Payments Table (Simplified for demo)
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

-- Enable RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Loans Policies: Users can view loans for farms they have access to
CREATE POLICY "View farm loans" 
ON public.loans FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.farms 
        WHERE id = loans.farm_id 
        AND auth.uid() = user_id -- Basic ownership check, can be expanded for RBAC
    )
);

CREATE POLICY "Manage farm loans" 
ON public.loans FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.farms 
        WHERE id = loans.farm_id 
        AND auth.uid() = user_id
    )
);

-- Insurance Policies: Similar to loans
CREATE POLICY "View insurance policies" 
ON public.insurance_policies FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.farms 
        WHERE id = insurance_policies.farm_id 
        AND auth.uid() = user_id
    )
);

CREATE POLICY "Manage insurance policies" 
ON public.insurance_policies FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.farms 
        WHERE id = insurance_policies.farm_id 
        AND auth.uid() = user_id
    )
);

-- Claims Policies
CREATE POLICY "Manage claims" 
ON public.insurance_claims FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.insurance_policies ip
        JOIN public.farms f ON ip.farm_id = f.id
        WHERE ip.id = insurance_claims.policy_id 
        AND f.user_id = auth.uid()
    )
);

-- Payments Policies
CREATE POLICY "Users view own payments" 
ON public.payments FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users make payments" 
ON public.payments FOR INSERT 
WITH CHECK (user_id = auth.uid());
