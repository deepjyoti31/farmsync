-- Marketplace Listings Table
create table public.marketplace_listings (
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

-- Marketplace Inquiries Table (for buyer-seller communication)
create table public.marketplace_inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.marketplace_listings(id) on delete cascade not null,
  buyer_id uuid references auth.users(id) on delete cascade not null,
  message text not null,
  offer_price numeric check (offer_price >= 0),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now()
);

-- Suppliers Table (Directory)
create table public.suppliers (
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

-- RLS Policies

-- Marketplace Listings
alter table public.marketplace_listings enable row level security;

-- Everyone can view active listings
create policy "Active listings are viewable by everyone"
  on public.marketplace_listings for select
  using (true);

-- Sellers can insert their own listings
create policy "Users can insert their own listings"
  on public.marketplace_listings for insert
  with check (auth.uid() = seller_id);

-- Sellers can update their own listings
create policy "Users can update their own listings"
  on public.marketplace_listings for update
  using (auth.uid() = seller_id);

-- Sellers can delete their own listings
create policy "Users can delete their own listings"
  on public.marketplace_listings for delete
  using (auth.uid() = seller_id);


-- Marketplace Inquiries
alter table public.marketplace_inquiries enable row level security;

-- Buyers can see their sent inquiries, Sellers can see inquiries for their listings
create policy "Users can see their own inquiries or inquiries on their listings"
  on public.marketplace_inquiries for select
  using (
    auth.uid() = buyer_id or 
    exists (
      select 1 from public.marketplace_listings
      where id = marketplace_inquiries.listing_id
      and seller_id = auth.uid()
    )
  );

-- Authenticated users can create inquiries
create policy "Authenticated users can create inquiries"
  on public.marketplace_inquiries for insert
  with check (auth.uid() = buyer_id);

-- Marketplace Inquiries Update (Accept/Reject by Seller)
create policy "Sellers can update inquiry status"
  on public.marketplace_inquiries for update
  using (
    exists (
      select 1 from public.marketplace_listings
      where id = marketplace_inquiries.listing_id
      and seller_id = auth.uid()
    )
  );


-- Suppliers
alter table public.suppliers enable row level security;

-- Everyone can view suppliers
create policy "Suppliers are viewable by everyone"
  on public.suppliers for select
  using (true);

-- Only admins/service role can manage suppliers (Simplified for now)
-- Skipping insert/update/delete policies effectively makes it read-only for normal users

-- Seed Data for Suppliers
insert into public.suppliers (name, category, contact_info, location, description, verified, image_url)
values 
  ('Kisan Agro Center', 'Seeds', '{"phone": "+91-9876543210", "email": "contact@kisanagro.com"}', 'Nashik, Maharashtra', 'Certified supplier of high-yield vegetable seeds and fertilizers.', true, 'https://images.unsplash.com/photo-1563811771046-ba98c66a41f8?q=80&w=1000&auto=format&fit=crop'),
  ('Green Earth Organics', 'Fertilizers', '{"phone": "+91-9876543211", "website": "www.greenearth.in"}', 'Pune, Maharashtra', 'Manufacturer of organic compost and bio-pesticides.', true, 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?q=80&w=1000&auto=format&fit=crop'),
  ('FarmTech Machinery', 'Machinery', '{"phone": "+91-9876543212"}', 'Indore, Madhya Pradesh', 'Sales and rental of tractors, harvesters, and irrigation equipment.', false, 'https://images.unsplash.com/photo-1530267981375-f0de93fe1e91?q=80&w=1000&auto=format&fit=crop'),
  ('AgriCare Solutions', 'Services', '{"email": "help@agricare.com"}', 'Nagpur, Maharashtra', 'Soil testing lab and agronomy consultancy services.', true, 'https://images.unsplash.com/photo-1589923188900-85dae5233271?q=80&w=1000&auto=format&fit=crop');
