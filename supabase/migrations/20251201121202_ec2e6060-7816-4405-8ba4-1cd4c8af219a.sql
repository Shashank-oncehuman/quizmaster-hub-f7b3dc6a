-- Recreate user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Recreate achievements table if not exists
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Recreate user_achievements table if not exists
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Recreate notifications table if not exists
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- RLS Policies for achievements
CREATE POLICY "Everyone can view achievements" ON public.achievements
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage achievements" ON public.achievements
  FOR ALL USING (public.is_admin());

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view all user achievements" ON public.user_achievements
  FOR SELECT USING (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (title, description, icon, requirement_type, requirement_value, points)
VALUES 
  ('First Steps', 'Complete your first quiz', '🎯', 'quiz_count', 1, 10),
  ('Quiz Master', 'Complete 10 quizzes', '🏆', 'quiz_count', 10, 50),
  ('Century Club', 'Complete 100 quizzes', '💯', 'quiz_count', 100, 200),
  ('Perfect Score', 'Get 100% on any quiz', '⭐', 'perfect_score', 1, 25),
  ('High Achiever', 'Score above 90% on 5 quizzes', '🌟', 'high_score_count', 5, 75),
  ('Week Warrior', 'Maintain a 7-day streak', '🔥', 'streak', 7, 30),
  ('Month Master', 'Maintain a 30-day streak', '💪', 'streak', 30, 150),
  ('Point Pioneer', 'Earn 1000 total points', '💎', 'total_points', 1000, 100)
ON CONFLICT DO NOTHING;

-- Function to check and grant achievements
CREATE OR REPLACE FUNCTION public.check_and_grant_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  achievement_record RECORD;
  quiz_count INTEGER;
  perfect_score_count INTEGER;
  high_score_count INTEGER;
  user_points INTEGER;
  user_streak INTEGER;
BEGIN
  -- Get user stats
  SELECT total_tests INTO quiz_count FROM public.user_stats WHERE user_id = NEW.user_id;
  SELECT total_points INTO user_points FROM public.profiles WHERE id = NEW.user_id;
  SELECT current_streak INTO user_streak FROM public.profiles WHERE id = NEW.user_id;
  
  -- Count perfect scores
  SELECT COUNT(*) INTO perfect_score_count 
  FROM public.quiz_attempts 
  WHERE user_id = NEW.user_id AND accuracy = 100;
  
  -- Count high scores (>90%)
  SELECT COUNT(*) INTO high_score_count 
  FROM public.quiz_attempts 
  WHERE user_id = NEW.user_id AND accuracy > 90;

  -- Check all achievements
  FOR achievement_record IN 
    SELECT * FROM public.achievements
  LOOP
    -- Check if user already has this achievement
    IF NOT EXISTS (
      SELECT 1 FROM public.user_achievements 
      WHERE user_id = NEW.user_id AND achievement_id = achievement_record.id
    ) THEN
      -- Check achievement requirements
      IF (achievement_record.requirement_type = 'quiz_count' AND quiz_count >= achievement_record.requirement_value) OR
         (achievement_record.requirement_type = 'perfect_score' AND perfect_score_count >= achievement_record.requirement_value) OR
         (achievement_record.requirement_type = 'high_score_count' AND high_score_count >= achievement_record.requirement_value) OR
         (achievement_record.requirement_type = 'total_points' AND user_points >= achievement_record.requirement_value) OR
         (achievement_record.requirement_type = 'streak' AND user_streak >= achievement_record.requirement_value) THEN
        
        -- Grant achievement
        INSERT INTO public.user_achievements (user_id, achievement_id)
        VALUES (NEW.user_id, achievement_record.id);
        
        -- Create notification
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (
          NEW.user_id,
          'Achievement Unlocked! 🎉',
          'You earned: ' || achievement_record.title,
          'achievement'
        );
        
        -- Add achievement points to user
        UPDATE public.profiles
        SET total_points = total_points + achievement_record.points
        WHERE id = NEW.user_id;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger to check achievements after quiz completion
DROP TRIGGER IF EXISTS check_achievements_trigger ON public.quiz_attempts;
CREATE TRIGGER check_achievements_trigger
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_grant_achievements();

-- Function to create notifications for quiz completion
CREATE OR REPLACE FUNCTION public.create_quiz_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create notification for quiz completion
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.user_id,
    'Quiz Completed! 📝',
    'You scored ' || NEW.score || '/' || NEW.total_marks || ' (' || ROUND(NEW.accuracy::numeric, 1) || '%)',
    'quiz_result'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for quiz completion notifications
DROP TRIGGER IF EXISTS quiz_completion_notification_trigger ON public.quiz_attempts;
CREATE TRIGGER quiz_completion_notification_trigger
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_quiz_notification();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Enable realtime for user_achievements
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;
ALTER TABLE public.user_achievements REPLICA IDENTITY FULL;