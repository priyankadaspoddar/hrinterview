
-- 1. Base tables
CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  avg_score NUMERIC,
  total_questions INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.session_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  category TEXT,
  score NUMERIC,
  star_scores JSONB,
  strengths TEXT[],
  improvements TEXT[],
  skipped BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Helper functions (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.user_owns_session(_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.interview_sessions
    WHERE id = _session_id AND user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.user_owns_session_answer(_answer_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.session_answers sa
    JOIN public.interview_sessions s ON s.id = sa.session_id
    WHERE sa.id = _answer_id AND s.user_id = auth.uid()
  )
$$;

-- 3. Enable RLS
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_answers ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for interview_sessions
CREATE POLICY "Users can insert own sessions"
  ON public.interview_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions"
  ON public.interview_sessions FOR SELECT
  USING (public.user_owns_session(id));

CREATE POLICY "Users can update own sessions"
  ON public.interview_sessions FOR UPDATE
  USING (public.user_owns_session(id));

CREATE POLICY "Users can delete own sessions"
  ON public.interview_sessions FOR DELETE
  USING (public.user_owns_session(id));

-- 5. RLS policies for session_answers
CREATE POLICY "Users can insert answers to own sessions"
  ON public.session_answers FOR INSERT
  WITH CHECK (session_id IN (SELECT id FROM public.interview_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own answers"
  ON public.session_answers FOR SELECT
  USING (public.user_owns_session_answer(id));

CREATE POLICY "Users can update own answers"
  ON public.session_answers FOR UPDATE
  USING (public.user_owns_session_answer(id));

CREATE POLICY "Users can delete own answers"
  ON public.session_answers FOR DELETE
  USING (public.user_owns_session_answer(id));
