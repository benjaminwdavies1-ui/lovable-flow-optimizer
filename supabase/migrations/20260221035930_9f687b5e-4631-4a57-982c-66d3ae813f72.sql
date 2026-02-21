CREATE TABLE public.waitlist_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit email"
  ON public.waitlist_emails FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view waitlist"
  ON public.waitlist_emails FOR SELECT
  TO authenticated
  USING (true);