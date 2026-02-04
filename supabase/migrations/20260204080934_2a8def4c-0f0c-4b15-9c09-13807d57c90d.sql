
-- Drop the old check constraint
ALTER TABLE public.steps DROP CONSTRAINT IF EXISTS steps_action_type_check;

-- Add a new check constraint that matches frontend action types
ALTER TABLE public.steps ADD CONSTRAINT steps_action_type_check 
CHECK (action_type = ANY (ARRAY['click'::text, 'type'::text, 'navigate'::text, 'scroll'::text, 'custom'::text, 'navigation'::text, 'form_submit'::text, 'input'::text]));
