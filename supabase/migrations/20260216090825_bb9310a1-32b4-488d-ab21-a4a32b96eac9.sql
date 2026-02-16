
-- Add decision tree columns to steps table
ALTER TABLE public.steps 
  ADD COLUMN is_decision boolean NOT NULL DEFAULT false,
  ADD COLUMN decision_mode text NOT NULL DEFAULT 'simple',
  ADD COLUMN yes_branch_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN no_branch_steps jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add decision tree columns to sop_steps table
ALTER TABLE public.sop_steps 
  ADD COLUMN is_decision boolean NOT NULL DEFAULT false,
  ADD COLUMN decision_mode text NOT NULL DEFAULT 'simple',
  ADD COLUMN yes_branch_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN no_branch_steps jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Update the action_type check constraint on steps to include 'decision'
ALTER TABLE public.steps DROP CONSTRAINT IF EXISTS steps_action_type_check;
ALTER TABLE public.steps ADD CONSTRAINT steps_action_type_check 
  CHECK (action_type IN ('click', 'type', 'navigate', 'scroll', 'custom', 'navigation', 'form_submit', 'input', 'decision'));
