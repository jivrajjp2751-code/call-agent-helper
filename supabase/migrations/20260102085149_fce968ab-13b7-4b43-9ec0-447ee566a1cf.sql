-- Fix 1: Replace permissive SELECT policy with role-based policy
DROP POLICY IF EXISTS "Service role can read all inquiries" ON public.customer_inquiries;

CREATE POLICY "Admins and editors can read inquiries" 
ON public.customer_inquiries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

-- Fix 2: Replace weak DELETE policy with role-based policy
DROP POLICY IF EXISTS "Authenticated users can delete inquiries" ON public.customer_inquiries;

CREATE POLICY "Admins and editors can delete inquiries" 
ON public.customer_inquiries 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

-- Fix 3: Add database constraints for input validation
-- Using triggers instead of CHECK constraints for better compatibility

-- Create validation function for customer_inquiries
CREATE OR REPLACE FUNCTION public.validate_customer_inquiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate name length (2-100 characters)
  IF char_length(NEW.name) < 2 OR char_length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;
  
  -- Validate email format and length
  IF char_length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Email must be less than 255 characters';
  END IF;
  
  IF NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate phone length (10-20 characters, allowing digits, spaces, hyphens, plus)
  IF char_length(NEW.phone) < 10 OR char_length(NEW.phone) > 20 THEN
    RAISE EXCEPTION 'Phone number must be between 10 and 20 characters';
  END IF;
  
  -- Validate message length if provided
  IF NEW.message IS NOT NULL AND char_length(NEW.message) > 2000 THEN
    RAISE EXCEPTION 'Message must be less than 2000 characters';
  END IF;
  
  -- Validate preferred_area if provided
  IF NEW.preferred_area IS NOT NULL AND char_length(NEW.preferred_area) > 100 THEN
    RAISE EXCEPTION 'Preferred area must be less than 100 characters';
  END IF;
  
  -- Validate budget if provided
  IF NEW.budget IS NOT NULL AND char_length(NEW.budget) > 50 THEN
    RAISE EXCEPTION 'Budget must be less than 50 characters';
  END IF;
  
  -- Validate preferred_time if provided
  IF NEW.preferred_time IS NOT NULL AND char_length(NEW.preferred_time) > 50 THEN
    RAISE EXCEPTION 'Preferred time must be less than 50 characters';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for validation on insert and update
DROP TRIGGER IF EXISTS validate_inquiry_trigger ON public.customer_inquiries;

CREATE TRIGGER validate_inquiry_trigger
BEFORE INSERT OR UPDATE ON public.customer_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.validate_customer_inquiry();