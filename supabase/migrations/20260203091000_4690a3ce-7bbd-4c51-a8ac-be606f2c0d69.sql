-- Create automation_suggestions table to store AI-generated automation ideas
CREATE TABLE public.automation_suggestions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    sop_id UUID REFERENCES public.sops(id) ON DELETE CASCADE,
    step_id UUID REFERENCES public.sop_steps(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    automation_type TEXT NOT NULL, -- 'zapier', 'n8n', 'make', 'api', 'script', 'other'
    integration_tools TEXT[], -- e.g., ['Slack', 'Google Sheets', 'Email']
    estimated_time_saved TEXT, -- e.g., '5 minutes per execution'
    implementation_difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    status TEXT DEFAULT 'pending', -- 'pending', 'implemented', 'dismissed'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own automation suggestions"
ON public.automation_suggestions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automation suggestions"
ON public.automation_suggestions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation suggestions"
ON public.automation_suggestions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automation suggestions"
ON public.automation_suggestions FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_automation_suggestions_user ON public.automation_suggestions(user_id);
CREATE INDEX idx_automation_suggestions_sop ON public.automation_suggestions(sop_id);
CREATE INDEX idx_automation_suggestions_status ON public.automation_suggestions(status);