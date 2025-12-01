import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Users, FileQuestion, Award, TrendingUp, Activity, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted))'];

const Analytics = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAttempts: 0,
    totalQuizzes: 0,
    avgScore: 0,
    activeUsers: 0,
    completionRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [popularQuizzes, setPopularQuizzes] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [subjectDistribution, setSubjectDistribution] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      navigate("/");
      return;
    }

    setIsAdmin(true);
    fetchAnalyticsData();
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);

    // Fetch total users
    const { count: usersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Fetch total quiz attempts
    const { data: attempts, count: attemptsCount } = await supabase
      .from("quiz_attempts")
      .select("*", { count: "exact" });

    // Calculate average score
    const avgScore = attempts?.length 
      ? attempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / attempts.length 
      : 0;

    // Fetch recent activity
    const { data: recentAttempts } = await supabase
      .from("quiz_attempts")
      .select(`
        *,
        profiles:user_id (username, avatar_url)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    // Mock data for popular quizzes (will be replaced with real data)
    const quizStats = [
      { name: "Airforce Physics", attempts: 45, avgScore: 75 },
      { name: "Airforce Maths", attempts: 38, avgScore: 82 },
      { name: "BSF Test Series", attempts: 32, avgScore: 68 },
      { name: "Navy SSR", attempts: 28, avgScore: 71 },
      { name: "CAPF Test", attempts: 25, avgScore: 79 },
    ];

    // Mock performance data over time
    const performanceOverTime = [
      { date: "Week 1", attempts: 45, avgScore: 72 },
      { date: "Week 2", attempts: 52, avgScore: 75 },
      { date: "Week 3", attempts: 48, avgScore: 78 },
      { date: "Week 4", attempts: 61, avgScore: 74 },
      { date: "Week 5", attempts: 58, avgScore: 80 },
    ];

    // Mock subject distribution
    const subjects = [
      { name: "Physics", value: 30 },
      { name: "Maths", value: 25 },
      { name: "English", value: 20 },
      { name: "Reasoning", value: 15 },
      { name: "History", value: 10 },
    ];

    setStats({
      totalUsers: usersCount || 0,
      totalAttempts: attemptsCount || 0,
      totalQuizzes: 50,
      avgScore: Math.round(avgScore),
      activeUsers: Math.round((usersCount || 0) * 0.6),
      completionRate: 85,
    });

    setRecentActivity(recentAttempts || []);
    setPopularQuizzes(quizStats);
    setPerformanceData(performanceOverTime);
    setSubjectDistribution(subjects);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <Activity className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor platform performance and user activity</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-primary">↑ {stats.activeUsers}</span> active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Quiz Attempts</CardTitle>
              <FileQuestion className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalAttempts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-primary">↑ {stats.completionRate}%</span> completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgScore}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-primary">↑ 5%</span> from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Popular Quizzes */}
              <Card>
                <CardHeader>
                  <CardTitle>Popular Quizzes</CardTitle>
                  <CardDescription>Most attempted quiz topics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={popularQuizzes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="attempts" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Subject Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Subject Distribution</CardTitle>
                  <CardDescription>Quiz attempts by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={subjectDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {subjectDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Quiz attempts and average scores over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="attempts" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Attempts"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgScore" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      name="Avg Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performers Table */}
            <Card>
              <CardHeader>
                <CardTitle>Quiz Performance Details</CardTitle>
                <CardDescription>Average scores by quiz</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quiz Name</TableHead>
                      <TableHead className="text-right">Attempts</TableHead>
                      <TableHead className="text-right">Avg Score</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {popularQuizzes.map((quiz) => (
                      <TableRow key={quiz.name}>
                        <TableCell className="font-medium">{quiz.name}</TableCell>
                        <TableCell className="text-right">{quiz.attempts}</TableCell>
                        <TableCell className="text-right">{quiz.avgScore}%</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={quiz.avgScore >= 75 ? "default" : "secondary"}>
                            {quiz.avgScore >= 75 ? "Excellent" : "Good"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest quiz attempts by users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-smooth"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileQuestion className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{activity.quiz_title}</p>
                          <p className="text-sm text-muted-foreground">
                            by {activity.profiles?.username || "User"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{activity.accuracy?.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.score}/{activity.total_marks} points
                        </p>
                      </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Analytics;
