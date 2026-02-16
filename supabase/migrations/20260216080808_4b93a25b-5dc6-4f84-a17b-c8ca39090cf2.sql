
-- Create activity_events table for continuous monitoring
CREATE TABLE public.activity_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'click',
  url TEXT,
  element_info JSONB,
  screenshot_url TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cluster_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create process_clusters table for AI-detected groupings
CREATE TABLE public.process_clusters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  event_count INTEGER NOT NULL DEFAULT 0,
  confidence_score DOUBLE PRECISION DEFAULT 0.5,
  status TEXT NOT NULL DEFAULT 'detected',
  converted_to_recording_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key from activity_events.cluster_id to process_clusters
ALTER TABLE public.activity_events
  ADD CONSTRAINT activity_events_cluster_id_fkey
  FOREIGN KEY (cluster_id) REFERENCES public.process_clusters(id) ON DELETE SET NULL;

-- Add index on session_date for daily queries
CREATE INDEX idx_activity_events_session_date ON public.activity_events (user_id, session_date);
CREATE INDEX idx_activity_events_cluster ON public.activity_events (cluster_id);
CREATE INDEX idx_process_clusters_user_date ON public.process_clusters (user_id, created_at);

-- Enable RLS
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_clusters ENABLE ROW LEVEL SECURITY;

-- RLS for activity_events
CREATE POLICY "Users can view own activity events"
  ON public.activity_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own activity events"
  ON public.activity_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own activity events"
  ON public.activity_events FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own activity events"
  ON public.activity_events FOR DELETE
  USING (user_id = auth.uid());

-- RLS for process_clusters
CREATE POLICY "Users can view own process clusters"
  ON public.process_clusters FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own process clusters"
  ON public.process_clusters FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own process clusters"
  ON public.process_clusters FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own process clusters"
  ON public.process_clusters FOR DELETE
  USING (user_id = auth.uid());
