-- Enable Row Level Security on all tables
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access for testimonials" 
ON public.testimonials FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access for app_screenshots" 
ON public.app_screenshots FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access for post_comments" 
ON public.post_comments FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access for post_likes" 
ON public.post_likes FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access for market_data" 
ON public.market_data FOR SELECT 
USING (true);

-- Create policies for authenticated users to create/update their own data
CREATE POLICY "Allow authenticated users to create their own comments"
ON public.post_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update their own comments"
ON public.post_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete their own comments"
ON public.post_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to like posts"
ON public.post_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to unlike posts"
ON public.post_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
