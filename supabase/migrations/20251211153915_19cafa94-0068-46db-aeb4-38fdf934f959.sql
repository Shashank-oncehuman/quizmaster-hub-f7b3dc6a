-- Fix 1: Remove overly permissive RLS policy on quiz_attempts
DROP POLICY IF EXISTS "Everyone can view all attempts for leaderboard" ON public.quiz_attempts;

-- Fix 2: Recreate leaderboard_view with SECURITY INVOKER to fix security definer issue
DROP VIEW IF EXISTS public.leaderboard_view;

CREATE VIEW public.leaderboard_view
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.total_points,
  us.total_tests,
  us.overall_accuracy,
  RANK() OVER (ORDER BY p.total_points DESC NULLS LAST) as rank
FROM public.profiles p
LEFT JOIN public.user_stats us ON p.id = us.user_id
WHERE p.total_points > 0 OR us.total_tests > 0;