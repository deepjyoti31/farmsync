-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'alert')),
    title TEXT NOT NULL,
    message TEXT,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Grant permissions (optional, depending on default setup)
GRANT ALL ON public.notifications TO postgres;
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.notifications TO authenticated;
