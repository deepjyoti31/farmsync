-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    is_personal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('owner', 'admin', 'editor', 'viewer')) NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Create organization_invites table
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

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organizations: Users can view orgs they are members of
CREATE POLICY "Users can view organizations they belong to" 
ON public.organizations FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members 
        WHERE organization_id = organizations.id 
        AND user_id = auth.uid()
    )
);

-- Organizations: Users can create organizations
CREATE POLICY "Users can create organizations" 
ON public.organizations FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Organizations: Owners and Admins can update their organizations
CREATE POLICY "Owners and Admins can update organization" 
ON public.organizations FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members 
        WHERE organization_id = organizations.id 
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- Members: Users can view members of their organizations
CREATE POLICY "Users can view members of their organizations" 
ON public.organization_members FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members AS om
        WHERE om.organization_id = organization_members.organization_id 
        AND om.user_id = auth.uid()
    )
);

-- Members: Only Owners and Admins can insert/update/delete members
-- (Note: This is simplified, usually requires more granular checks)

-- Add organization_id to farms table
ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Migration Function: Create personal organizations for existing users
-- and link their farms to it.
CREATE OR REPLACE FUNCTION migrate_users_to_organizations() RETURNS void AS $$
DECLARE
    user_record RECORD;
    org_id UUID;
BEGIN
    FOR user_record IN SELECT id, email FROM auth.users LOOP
        -- Check if user already has a personal org
        IF NOT EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE owner_id = user_record.id AND is_personal = true
        ) THEN
            -- Create personal org
            INSERT INTO public.organizations (name, owner_id, is_personal)
            VALUES ('Personal Workspace', user_record.id, true)
            RETURNING id INTO org_id;

            -- Add user as owner member
            INSERT INTO public.organization_members (organization_id, user_id, role)
            VALUES (org_id, user_record.id, 'owner');

            -- Update user's farms
            UPDATE public.farms 
            SET organization_id = org_id 
            WHERE user_id = user_record.id 
            AND organization_id IS NULL;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger migration (optional, can be run manually)
-- SELECT migrate_users_to_organizations();
