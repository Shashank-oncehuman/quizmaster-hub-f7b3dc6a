import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileQuestion, Award, ChevronLeft } from "lucide-react";
import { useSubjects, useTestTitles } from "@/hooks/useApiData";
import { SubjectSkeleton, TestSeriesSkeleton } from "@/components/TestSeriesSkeleton";
import { ApiErrorState, EmptyState } from "@/components/ApiErrorState";

const TestSeries = () => {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string | null>(null);

  // Get subjects for this test series
  const { subjects, loading: subjectsLoading, error: subjectsError, refetch: refetchSubjects } = useSubjects(apiUrl, seriesId || null);
  
  // Get test titles for selected subject
  const { testTitles, loading: titlesLoading, error: titlesError, refetch: refetchTitles } = useTestTitles(
    apiUrl,
    seriesId || null,
    selectedSubject
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    // Get API URL from localStorage (set in Home page)
    const storedApiUrl = localStorage.getItem("selectedApiUrl");
    if (storedApiUrl) {
      setApiUrl(storedApiUrl);
    }
  }, [navigate]);

  const handleStartTest = (questionsUrl: string, titleId: string) => {
    // Store questions URL in localStorage to use in Quiz page
    localStorage.setItem("currentQuizUrl", questionsUrl);
    navigate(`/quiz/${titleId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Test Series</h1>
          <p className="text-muted-foreground">Select a subject to view available tests</p>
        </div>

        {/* Subjects Section */}
        {!selectedSubject && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Select Subject</h2>
            
            {subjectsError && (
              <ApiErrorState 
                title="Failed to load subjects" 
                message={subjectsError}
                onRetry={refetchSubjects}
              />
            )}

            {subjectsLoading ? (
              <SubjectSkeleton />
            ) : subjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((subject, index) => (
                  <Card
                    key={`${subject.id}-${index}`}
                    className="hover:shadow-lg transition-smooth cursor-pointer group"
                    onClick={() => setSelectedSubject(subject.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        {subject.logo && (
                          <img
                            src={subject.logo}
                            alt={subject.name}
                            className="h-12 w-12 object-contain rounded"
                          />
                        )}
                        <Badge variant="secondary">{subject.total_tests} tests</Badge>
                      </div>
                      <CardTitle className="group-hover:text-primary transition-smooth">
                        {subject.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" variant="outline">
                        View Tests
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !subjectsLoading && !subjectsError ? (
              <EmptyState message="No subjects available for this test series." />
            ) : null}
          </div>
        )}

        {/* Test Titles Section */}
        {selectedSubject && (
          <div>
            <Button
              variant="ghost"
              onClick={() => setSelectedSubject(null)}
              className="mb-6"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Subjects
            </Button>

            <h2 className="text-2xl font-semibold mb-4">Available Tests</h2>
            
            {titlesError && (
              <ApiErrorState 
                title="Failed to load tests" 
                message={titlesError}
                onRetry={refetchTitles}
              />
            )}

            {titlesLoading ? (
              <TestSeriesSkeleton />
            ) : testTitles.length > 0 ? (
              <div className="grid gap-4">
                {testTitles.map((test, index) => (
                  <Card key={`${test.id}-${index}`} className="hover:shadow-lg transition-smooth">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{test.name}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {test.duration} mins
                            </div>
                            <div className="flex items-center">
                              <FileQuestion className="h-4 w-4 mr-1" />
                              {test.totalQuestions} questions
                            </div>
                            <div className="flex items-center">
                              <Award className="h-4 w-4 mr-1" />
                              {test.totalMarks} marks
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                          <div className="flex gap-2">
                            {test.isPremium && (
                              <Badge variant="default">
                                Premium
                              </Badge>
                            )}
                            {test.attemptCount !== undefined && test.attemptCount > 0 && (
                              <Badge variant="secondary">
                                {test.attemptCount} attempts
                              </Badge>
                            )}
                          </div>
                          <Button
                            onClick={() => handleStartTest(test.questionsUrl, test.id)}
                            disabled={!test.questionsUrl}
                            className="w-full md:w-auto"
                          >
                            Start Test
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !titlesLoading && !titlesError ? (
              <EmptyState message="No tests available for this subject." />
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
};

export default TestSeries;
