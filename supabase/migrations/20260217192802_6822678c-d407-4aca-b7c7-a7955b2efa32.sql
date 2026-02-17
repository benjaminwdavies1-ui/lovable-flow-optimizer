
-- Knowledge base entries: user-added business info, software stack, process notes
CREATE TABLE public.knowledge_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own knowledge entries" ON public.knowledge_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own knowledge entries" ON public.knowledge_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own knowledge entries" ON public.knowledge_entries FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own knowledge entries" ON public.knowledge_entries FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER update_knowledge_entries_updated_at
  BEFORE UPDATE ON public.knowledge_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
