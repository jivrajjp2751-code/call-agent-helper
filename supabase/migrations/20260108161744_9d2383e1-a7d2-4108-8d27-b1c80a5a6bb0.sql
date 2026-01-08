-- Create audit log table to track admin actions
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  target_email TEXT,
  details JSONB,
  performed_by UUID NOT NULL,
  performed_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (has_profile_role(auth.uid(), 'admin'::user_role));

-- Admins and editors can insert audit logs
CREATE POLICY "Admins and editors can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (
  has_profile_role(auth.uid(), 'admin'::user_role) OR 
  has_profile_role(auth.uid(), 'editor'::user_role)
);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX idx_audit_logs_performed_by ON public.admin_audit_logs(performed_by);