import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

interface Question {
  question_id: string;
  question_text: string;
  options: { id: string; text: string }[];
  correct_answer: string;
}

const Quiz = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        initializeQuiz(session.user.id);
      }
    });
  }, [navigate, testId]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const initializeQuiz = async (userId: string) => {
    // Mock questions - Replace with actual API call
    const mockQuestions: Question[] = [
      {
        question_id: "1",
        question_text: "What is sin(90°)?",
        options: [
          { id: "a", text: "0" },
          { id: "b", text: "1" },
          { id: "c", text: "-1" },
          { id: "d", text: "undefined" },
        ],
        correct_answer: "b",
      },
      {
        question_id: "2",
        question_text: "What is cos(0°)?",
        options: [
          { id: "a", text: "0" },
          { id: "b", text: "1" },
          { id: "c", text: "-1" },
          { id: "d", text: "undefined" },
        ],
        correct_answer: "b",
      },
    ];

    setQuestions(mockQuestions);

    // Create quiz attempt record
    const { data, error } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: userId,
        quiz_id: testId!,
        quiz_title: "Sample Quiz",
        subject_name: "Mathematics",
        total_questions: mockQuestions.length,
        max_score: mockQuestions.length,
        time_limit: 1800,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start quiz",
      });
      navigate(-1);
    } else {
      setQuizAttemptId(data.id);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!quizAttemptId || !user) return;

    setLoading(true);

    // Calculate score
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.question_id] === q.correct_answer) {
        correctCount++;
      }
    });

    const score = correctCount;
    const percentage = (score / questions.length) * 100;
    const timeTaken = 1800 - timeLeft;

    const { error } = await supabase
      .from("quiz_attempts")
      .update({
        answered_questions: Object.keys(answers).length,
        correct_answers: correctCount,
        wrong_answers: Object.keys(answers).length - correctCount,
        score,
        percentage,
        time_taken: timeTaken,
        completed_at: new Date().toISOString(),
        answers: answers,
      })
      .eq("id", quizAttemptId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit quiz",
      });
    } else {
      navigate(`/results/${quizAttemptId}`);
    }

    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Quiz Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-lg px-3 py-1">
                  Question {currentQuestionIndex + 1}/{questions.length}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`text-lg px-3 py-1 ${
                    timeLeft < 300 ? "bg-destructive/10 text-destructive" : ""
                  }`}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(timeLeft)}
                </Badge>
              </div>
              <Button variant="outline" size="sm">
                <Flag className="h-4 w-4 mr-2" />
                Mark for Review
              </Button>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{currentQuestion.question_text}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion.question_id] || ""}
              onValueChange={(value) => handleAnswerSelect(currentQuestion.question_id, value)}
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-smooth cursor-pointer hover:border-primary ${
                    answers[currentQuestion.question_id] === option.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => handleAnswerSelect(currentQuestion.question_id, option.id)}
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer text-base">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button onClick={handleSubmit} disabled={loading} className="shadow-accent">
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
              }
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Question Grid */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Question Navigator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {questions.map((_, index) => (
                <Button
                  key={index}
                  variant={currentQuestionIndex === index ? "default" : "outline"}
                  size="sm"
                  className={`
                    ${answers[questions[index].question_id] ? "border-success" : ""}
                  `}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Quiz;
