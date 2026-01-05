-- Add virtual tour URL column to properties table
ALTER TABLE public.properties 
ADD COLUMN virtual_tour_url TEXT;

-- Add description column for richer property details
ALTER TABLE public.properties 
ADD COLUMN description TEXT;