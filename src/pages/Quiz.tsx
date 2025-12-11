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
import { LoadingProgress } from "@/components/LoadingProgress";
import { apiService } from "@/services/apiService";

interface Question {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  solution?: string;
}

const Quiz = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(1800);
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    if (timeLeft <= 0 && questions.length > 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, questions.length]);

  const initializeQuiz = async (userId: string) => {
    setLoading(true);
    
    try {
      // Get questions URL from localStorage
      const questionsUrl = localStorage.getItem("currentQuizUrl");
      
      if (!questionsUrl) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No quiz URL found. Please select a test again.",
        });
        navigate(-1);
        return;
      }

      // Fetch questions from API
      const response = await apiService.fetchQuizQuestions(questionsUrl);
      
      if (!response || response.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load quiz questions. Please try again.",
        });
        navigate(-1);
        return;
      }

      // Transform API questions to our format
      const transformedQuestions: Question[] = response.map((item: any) => {
        const options: { id: string; text: string }[] = [];
        
        // Extract options from option_1, option_2, etc.
        for (let i = 1; i <= 10; i++) {
          const optionKey = `option_${i}`;
          if (item[optionKey] && item[optionKey].trim()) {
            options.push({
              id: String(i),
              text: item[optionKey]
            });
          }
        }

        return {
          id: item.id || item.qid || String(Math.random()),
          question: item.question || item.question_text || '',
          options,
          correctAnswer: item.answer || item.correct_answer || '',
          solution: item.solution_text || item.solution || ''
        };
      });

      setQuestions(transformedQuestions);
      
      // Set timer based on quiz duration if available
      const storedDuration = localStorage.getItem("currentQuizDuration");
      if (storedDuration) {
        setTimeLeft(parseInt(storedDuration) * 60);
      }

      // Create quiz attempt record
      const { data, error } = await supabase
        .from("quiz_attempts")
        .insert([{
          user_id: userId,
          quiz_id: testId!,
          score: 0,
          total_marks: transformedQuestions.length,
          accuracy: 0,
          time_taken_seconds: 0
        }])
        .select()
        .single();

      if (error) {
        console.error("Quiz attempt error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to start quiz tracking",
        });
      } else {
        setQuizAttemptId(data.id);
      }
    } catch (error) {
      console.error("Quiz init error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initialize quiz",
      });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!user || submitting) return;

    setSubmitting(true);

    // Calculate score
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = correctCount;
    const accuracy = questions.length > 0 ? (score / questions.length) * 100 : 0;
    const timeTaken = (localStorage.getItem("currentQuizDuration") 
      ? parseInt(localStorage.getItem("currentQuizDuration")!) * 60 
      : 1800) - timeLeft;

    if (quizAttemptId) {
      const { error } = await supabase
        .from("quiz_attempts")
        .update({
          score,
          accuracy,
          time_taken_seconds: timeTaken,
        })
        .eq("id", quizAttemptId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to submit quiz",
        });
        setSubmitting(false);
        return;
      }
    }

    // Store results for results page
    localStorage.setItem("quizResults", JSON.stringify({
      score,
      total: questions.length,
      accuracy,
      timeTaken,
      answers,
      questions
    }));

    navigate(`/results/${quizAttemptId || testId}`);
    setSubmitting(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Render HTML content safely
  const renderHtmlContent = (html: string) => {
    // Clean up the HTML - remove wrapper tags if present
    let cleanHtml = html;
    if (cleanHtml.includes('<body>')) {
      const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        cleanHtml = bodyMatch[1];
      }
    }
    return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <LoadingProgress message="Loading quiz questions..." />
        </main>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">No questions available</h2>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 animate-fade-in">
        {/* Quiz Header */}
        <Card className="mb-6 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-lg px-3 py-1">
                  Question {currentQuestionIndex + 1}/{questions.length}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`text-lg px-3 py-1 transition-colors duration-300 ${
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
            <Progress value={progress} className="mt-4 transition-all duration-500" />
          </CardHeader>
        </Card>

        {/* Question Card */}
        <Card className="mb-6 animate-scale-in">
          <CardHeader>
            <CardTitle className="text-xl quiz-content">
              {renderHtmlContent(currentQuestion.question)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
              className="space-y-3"
            >
              {currentQuestion.options.map((option, idx) => (
                <div
                  key={option.id}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:border-primary hover:bg-primary/5 ${
                    answers[currentQuestion.id] === option.id
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                >
                  <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                  <Label 
                    htmlFor={`option-${option.id}`} 
                    className="flex-1 cursor-pointer text-base quiz-content"
                  >
                    {renderHtmlContent(option.text)}
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
            className="transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button 
              onClick={handleSubmit} 
              disabled={submitting} 
              className="shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          ) : (
            <Button
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
              }
              className="transition-all duration-200"
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
              {questions.map((q, index) => (
                <Button
                  key={index}
                  variant={currentQuestionIndex === index ? "default" : "outline"}
                  size="sm"
                  className={`transition-all duration-200 ${
                    answers[q.id] ? "border-green-500 bg-green-500/10" : ""
                  }`}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Add styles for quiz HTML content */}
      <style>{`
        .quiz-content img {
          max-width: 100%;
          height: auto;
          display: inline-block;
          vertical-align: middle;
        }
        .quiz-content p {
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default Quiz;
