-- Create business_context table
CREATE TABLE public.business_context (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    context_type TEXT NOT NULL CHECK (context_type IN ('process_pattern', 'business_rule', 'optimization_insight')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_ids UUID[] DEFAULT '{}',
    confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_recommendations table
CREATE TABLE public.ai_recommendations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('automation', 'consolidation', 'warning', 'efficiency')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    affected_processes UUID[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.business_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies for business_context
CREATE POLICY "Users can view own business context"
ON public.business_context FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own business context"
ON public.business_context FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own business context"
ON public.business_context FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own business context"
ON public.business_context FOR DELETE USING (user_id = auth.uid());

-- RLS policies for ai_recommendations
CREATE POLICY "Users can view own recommendations"
ON public.ai_recommendations FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own recommendations"
ON public.ai_recommendations FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recommendations"
ON public.ai_recommendations FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own recommendations"
ON public.ai_recommendations FOR DELETE USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_business_context_user_id ON public.business_context(user_id);
CREATE INDEX idx_business_context_type ON public.business_context(context_type);
CREATE INDEX idx_ai_recommendations_user_id ON public.ai_recommendations(user_id);
CREATE INDEX idx_ai_recommendations_status ON public.ai_recommendations(status);

-- Create trigger for updated_at on business_context
CREATE TRIGGER update_business_context_updated_at
BEFORE UPDATE ON public.business_context
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();