import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Clock, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import { AchievementsSection } from "@/components/AchievementsSection";

interface Profile {
  username: string;
  full_name: string;
  avatar_url: string;
  total_points: number;
  current_streak: number;
  longest_streak: number;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number;
  total_marks: number;
  accuracy: number;
  created_at: string;
  time_taken_seconds: number;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [rank, setRank] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchAttempts();
  }, []);

  const fetchProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data as Profile);

      // Fetch user rank from leaderboard
      const { data: leaderboardData } = await supabase
        .from("leaderboard_view")
        .select("rank")
        .eq("id", session.user.id)
        .maybeSingle();

      if (leaderboardData) {
        setRank(leaderboardData.rank || 0);
      }
    }
  };

  const fetchAttempts = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching attempts:", error);
    } else {
      setAttempts(data as QuizAttempt[]);
    }
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  const avgScore = attempts.length > 0
    ? attempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / attempts.length
    : 0;
  
  const totalQuizzes = attempts.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                <Avatar className="h-32 w-32 border-4 border-primary">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                    {profile.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-2">{profile.full_name || profile.username}</h1>
                  <p className="text-muted-foreground mb-4">@{profile.username}</p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="flex items-center space-x-2 bg-primary/10 rounded-lg px-4 py-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      <div>
                        <div className="text-2xl font-bold">{profile.total_points}</div>
                        <div className="text-xs text-muted-foreground">Total Points</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 bg-accent/10 rounded-lg px-4 py-2">
                      <Target className="h-5 w-5 text-accent" />
                      <div>
                        <div className="text-2xl font-bold">{totalQuizzes}</div>
                        <div className="text-xs text-muted-foreground">Quizzes Taken</div>
                      </div>
                    </div>
                    {rank > 0 && (
                      <div className="flex items-center space-x-2 bg-success/10 rounded-lg px-4 py-2">
                        <TrendingUp className="h-5 w-5 text-success" />
                        <div>
                          <div className="text-2xl font-bold">#{rank}</div>
                          <div className="text-xs text-muted-foreground">Global Rank</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Average Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Average Score</span>
                      <span className="text-sm font-bold">{avgScore.toFixed(1)}%</span>
                    </div>
                    <Progress value={avgScore} className="h-3" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {attempts.filter((a) => (a.accuracy || 0) >= 75).length}
                      </div>
                      <div className="text-xs text-muted-foreground">High Scores</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-accent">
                        {attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Best Score</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attempts.slice(0, 3).map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">Quiz {attempt.quiz_id}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(attempt.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={(attempt.accuracy || 0) >= 75 ? "default" : "secondary"}
                        className="ml-2"
                      >
                        {(attempt.accuracy || 0).toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievements Section */}
          <AchievementsSection />

          {/* Quiz History */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Quiz History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attempts.map((attempt) => (
                  <div key={attempt.id} className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Quiz {attempt.quiz_id}</h4>
                      <Badge variant={(attempt.accuracy || 0) >= 75 ? "default" : "secondary"}>
                        {attempt.score}/{attempt.total_marks}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Target className="h-4 w-4 mr-1" />
                        {(attempt.accuracy || 0).toFixed(1)}%
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {Math.floor((attempt.time_taken_seconds || 0) / 60)}m {(attempt.time_taken_seconds || 0) % 60}s
                      </div>
                      <div className="text-muted-foreground text-right">
                        {new Date(attempt.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
