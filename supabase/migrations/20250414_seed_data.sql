-- Seed data for forums (if not already present)
INSERT INTO public.forums (id, title, description, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    'Crop Management', 
    'Discuss best practices for crop management, planting techniques, and harvest strategies.',
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.forums WHERE title = 'Crop Management'
);

INSERT INTO public.forums (id, title, description, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    'Equipment & Technology', 
    'Share experiences with farm equipment, technology solutions, and automation tools.',
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.forums WHERE title = 'Equipment & Technology'
);

INSERT INTO public.forums (id, title, description, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    'Market Insights', 
    'Discuss market trends, pricing strategies, and selling opportunities for farm products.',
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.forums WHERE title = 'Market Insights'
);

-- Seed data for app_screenshots
INSERT INTO public.app_screenshots (title, description, image_url, display_order, is_featured, created_at, updated_at)
VALUES
    ('Dashboard Overview', 'Comprehensive dashboard showing farm status at a glance', '/dashboard-screenshot.jpg', 1, true, now(), now()),
    ('Crop Management Interface', 'Easy-to-use interface for managing all your crops', '/crop-management-screenshot.jpg', 2, true, now(), now()),
    ('Weather Forecast Module', 'Accurate weather predictions to plan your farm activities', '/weather-forecast-screenshot.jpg', 3, true, now(), now());

-- Seed data for testimonials
INSERT INTO public.testimonials (user_name, role, quote, image_url, rating, is_featured, created_at, updated_at)
VALUES
    ('Vijay Singh', 'Mixed Farmer, Haryana', 'As a small-scale farmer, I never thought I''d be able to use technology like this. It''s easy and free!', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6', 5, true, now(), now()),
    ('Anita Patel', 'Organic Farmer, Gujarat', 'FarmSync has revolutionized how I manage my organic farm. The crop tracking features are invaluable.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 4, true, now(), now()),
    ('Rajesh Kumar', 'Dairy Farmer, Punjab', 'The livestock management tools have helped me increase productivity by 20% in just six months.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 5, true, now(), now());

-- Seed data for market_data
INSERT INTO public.market_data (crop_name, price_per_unit, unit, market_location, price_date, source, created_at, updated_at)
VALUES
    ('Rice', 22.50, 'kg', 'National Commodity Exchange', CURRENT_DATE, 'Ministry of Agriculture', now(), now()),
    ('Wheat', 24.75, 'kg', 'National Commodity Exchange', CURRENT_DATE, 'Ministry of Agriculture', now(), now()),
    ('Cotton', 65.30, 'kg', 'National Commodity Exchange', CURRENT_DATE, 'Ministry of Agriculture', now(), now()),
    ('Sugarcane', 3.25, 'kg', 'National Commodity Exchange', CURRENT_DATE, 'Ministry of Agriculture', now(), now()),
    ('Maize', 18.90, 'kg', 'National Commodity Exchange', CURRENT_DATE, 'Ministry of Agriculture', now(), now()),
    ('Soybeans', 42.15, 'kg', 'National Commodity Exchange', CURRENT_DATE, 'Ministry of Agriculture', now(), now()),
    ('Potatoes', 15.50, 'kg', 'National Commodity Exchange', CURRENT_DATE, 'Ministry of Agriculture', now(), now());
