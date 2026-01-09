-- Create notification preferences table
CREATE TABLE public.admin_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_role_changes BOOLEAN NOT NULL DEFAULT true,
  email_access_grants BOOLEAN NOT NULL DEFAULT true,
  email_access_removals BOOLEAN NOT NULL DEFAULT true,
  email_bulk_actions BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create in-app notifications table
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_email TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.admin_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS for notification preferences
CREATE POLICY "Users can view their own preferences"
ON public.admin_notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.admin_notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.admin_notification_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS for in-app notifications
CREATE POLICY "Users can view their own notifications"
ON public.admin_notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.admin_notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins and editors can insert notifications"
ON public.admin_notifications
FOR INSERT
WITH CHECK (has_profile_role(auth.uid(), 'admin') OR has_profile_role(auth.uid(), 'editor'));

-- Add updated_at trigger to preferences
CREATE TRIGGER update_admin_notification_preferences_updated_at
BEFORE UPDATE ON public.admin_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;