-- Add DELETE policy for admins on profiles table
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_profile_role(auth.uid(), 'admin'::user_role));