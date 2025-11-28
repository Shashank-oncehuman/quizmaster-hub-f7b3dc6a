-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  total_quizzes_taken INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create quiz_attempts table
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  quiz_id TEXT NOT NULL,
  quiz_title TEXT NOT NULL,
  subject_name TEXT,
  total_questions INTEGER NOT NULL,
  answered_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  max_score INTEGER NOT NULL,
  time_taken INTEGER, -- in seconds
  time_limit INTEGER, -- in seconds
  percentage DECIMAL(5,2),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  answers JSONB, -- Store user answers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quiz attempts policies
CREATE POLICY "Users can view their own attempts"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempts"
  ON public.quiz_attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- Create leaderboard view for global rankings
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  p.id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.total_quizzes_taken,
  p.total_score,
  RANK() OVER (ORDER BY p.total_score DESC, p.total_quizzes_taken ASC) as rank
FROM public.profiles p
WHERE p.total_quizzes_taken > 0
ORDER BY rank;

-- Function to update profile stats after quiz completion
CREATE OR REPLACE FUNCTION public.update_profile_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    UPDATE public.profiles
    SET 
      total_quizzes_taken = total_quizzes_taken + 1,
      total_score = total_score + NEW.score,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to update profile stats
CREATE TRIGGER update_profile_stats_trigger
AFTER UPDATE ON public.quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_stats();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();