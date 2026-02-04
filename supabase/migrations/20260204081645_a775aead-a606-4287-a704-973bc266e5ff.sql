
-- Add tag columns to SOPs table for categorization
ALTER TABLE public.sops 
ADD COLUMN employee_tags TEXT[] DEFAULT '{}',
ADD COLUMN department_tags TEXT[] DEFAULT '{}',
ADD COLUMN tools_tags TEXT[] DEFAULT '{}';

-- Add a comment for documentation
COMMENT ON COLUMN public.sops.employee_tags IS 'Tags for employees associated with this SOP';
COMMENT ON COLUMN public.sops.department_tags IS 'Tags for departments this SOP applies to';
COMMENT ON COLUMN public.sops.tools_tags IS 'Tags for tools and software used in this SOP';
