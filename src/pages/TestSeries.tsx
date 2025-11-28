import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileQuestion, Play, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

interface TestTitle {
  id: string;
  title: string;
  time: string;
  questions: string;
  marks: string;
  free_flag: string;
  is_completed: boolean;
  is_test_attempted: boolean;
  remaining_attempt: string;
  test_questions_url: string;
  language: string;
}

const TestSeries = () => {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestTitle[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    // Mock data - Replace with actual API call to fetch test titles
    setTests([
      {
        id: "25847",
        title: "Trigonometry",
        time: "30",
        questions: "20",
        marks: "20",
        free_flag: "0",
        is_completed: false,
        is_test_attempted: false,
        remaining_attempt: "2",
        test_questions_url: "https://testseries-assets-v3.classx.co.in/test_title_question/rozgar_db/25847/25847_questions0.4490519559483944.json",
        language: "hi",
      },
      {
        id: "25848",
        title: "Inverse trigonometric function",
        time: "15",
        questions: "10",
        marks: "10",
        free_flag: "0",
        is_completed: false,
        is_test_attempted: false,
        remaining_attempt: "2",
        test_questions_url: "https://testseries-assets-v3.classx.co.in/test_title_question/rozgar_db/25848/25848_questions0.7542290258228078.json",
        language: "hi",
      },
      {
        id: "25849",
        title: "Properties of triangle",
        time: "15",
        questions: "10",
        marks: "10",
        free_flag: "0",
        is_completed: false,
        is_test_attempted: false,
        remaining_attempt: "2",
        test_questions_url: "https://testseries-assets-v3.classx.co.in/test_title_question/rozgar_db/25849/25849_questions0.24097797068844873.json",
        language: "hi",
      },
    ]);
  }, [navigate]);

  const handleStartTest = (testId: string) => {
    navigate(`/quiz/${testId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/")}>
            ← Back to Home
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Test Series</h1>
          <p className="text-muted-foreground">Select a test to begin your practice</p>
        </div>

        <div className="grid gap-4">
          {tests.map((test) => (
            <Card
              key={test.id}
              className="overflow-hidden hover:shadow-md transition-smooth"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{test.title}</CardTitle>
                    <CardDescription className="flex flex-wrap gap-4">
                      <span className="flex items-center">
                        <FileQuestion className="h-4 w-4 mr-1" />
                        {test.questions} Questions
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {test.time} Minutes
                      </span>
                      <span className="flex items-center font-medium">
                        Total Marks: {test.marks}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {test.is_completed ? (
                      <Badge variant="secondary" className="bg-success/10 text-success">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    ) : test.is_test_attempted ? (
                      <Badge variant="secondary">In Progress</Badge>
                    ) : (
                      <Badge variant="outline">Not Started</Badge>
                    )}
                    {test.free_flag === "1" && (
                      <Badge className="bg-accent">Free</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Attempts remaining: {test.remaining_attempt}
                  </div>
                  <Button
                    onClick={() => handleStartTest(test.id)}
                    disabled={parseInt(test.remaining_attempt) <= 0}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {test.is_test_attempted ? "Continue Test" : "Start Test"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default TestSeries;
