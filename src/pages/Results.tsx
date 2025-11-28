import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Clock, CheckCircle, XCircle, Award } from "lucide-react";
import Navbar from "@/components/Navbar";

interface QuizResult {
  quiz_title: string;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  wrong_answers: number;
  score: number;
  max_score: number;
  percentage: number;
  time_taken: number;
  completed_at: string;
}

const Results = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [rank, setRank] = useState<number>(0);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("id", attemptId)
      .single();

    if (error) {
      console.error("Error fetching result:", error);
    } else {
      setResult(data as QuizResult);
      // Mock rank calculation
      setRank(Math.floor(Math.random() * 100) + 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (!result) {
    return <div>Loading...</div>;
  }

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return { text: "Exceptional!", color: "text-success" };
    if (percentage >= 75) return { text: "Excellent!", color: "text-primary" };
    if (percentage >= 60) return { text: "Good Job!", color: "text-accent" };
    if (percentage >= 40) return { text: "Keep Practicing!", color: "text-warning" };
    return { text: "Need Improvement", color: "text-destructive" };
  };

  const performance = getPerformanceMessage(result.percentage);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Quiz Completed!</h1>
            <p className="text-xl text-muted-foreground">{result.quiz_title}</p>
          </div>

          {/* Score Card */}
          <Card className="mb-6 border-2 border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl mb-2">Your Score</CardTitle>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-6xl font-bold text-primary">{result.score}</span>
                <span className="text-3xl text-muted-foreground">/ {result.max_score}</span>
              </div>
              <div className={`text-2xl font-semibold mt-2 ${performance.color}`}>
                {performance.text}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Percentage</span>
                    <span className="text-sm font-bold">{result.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={result.percentage} className="h-3" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="text-center p-4 bg-success/10 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
                    <div className="text-2xl font-bold text-success">{result.correct_answers}</div>
                    <div className="text-xs text-muted-foreground">Correct</div>
                  </div>
                  <div className="text-center p-4 bg-destructive/10 rounded-lg">
                    <XCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                    <div className="text-2xl font-bold text-destructive">{result.wrong_answers}</div>
                    <div className="text-xs text-muted-foreground">Wrong</div>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">{formatTime(result.time_taken)}</div>
                    <div className="text-xs text-muted-foreground">Time Taken</div>
                  </div>
                  <div className="text-center p-4 bg-accent/10 rounded-lg">
                    <Award className="h-6 w-6 text-accent mx-auto mb-2" />
                    <div className="text-2xl font-bold text-accent">#{rank}</div>
                    <div className="text-xs text-muted-foreground">Your Rank</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Total Questions</span>
                  <Badge variant="secondary">{result.total_questions}</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Questions Attempted</span>
                  <Badge variant="secondary">{result.answered_questions}</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Accuracy</span>
                  <Badge variant="secondary">
                    {((result.correct_answers / result.answered_questions) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Completed At</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(result.completed_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/")} variant="outline" size="lg">
              Back to Home
            </Button>
            <Button onClick={() => navigate("/leaderboard")} size="lg">
              <Trophy className="h-4 w-4 mr-2" />
              View Leaderboard
            </Button>
            <Button onClick={() => navigate("/profile")} variant="outline" size="lg">
              View History
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Results;
