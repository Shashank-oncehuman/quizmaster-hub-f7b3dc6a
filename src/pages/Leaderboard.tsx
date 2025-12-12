import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

interface LeaderboardEntry {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  total_tests: number | null;
  total_points: number | null;
  rank: number | null;
  overall_accuracy: number | null;
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });

    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    
    // Since leaderboard_view now uses security_invoker, we need to query profiles and user_stats directly
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, total_points")
      .order("total_points", { ascending: false, nullsFirst: false })
      .limit(50);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      setLoading(false);
      return;
    }

    // Get user stats for the profiles
    const userIds = profiles?.map(p => p.id) || [];
    const { data: stats, error: statsError } = await supabase
      .from("user_stats")
      .select("user_id, total_tests, overall_accuracy")
      .in("user_id", userIds);

    if (statsError) {
      console.error("Error fetching user stats:", statsError);
    }

    // Combine data and calculate ranks
    const combined: LeaderboardEntry[] = (profiles || [])
      .filter(p => (p.total_points || 0) > 0)
      .map((profile, index) => {
        const userStats = stats?.find(s => s.user_id === profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          total_points: profile.total_points,
          total_tests: userStats?.total_tests || 0,
          overall_accuracy: userStats?.overall_accuracy || 0,
          rank: index + 1
        };
      });

    setLeaderboard(combined);
    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1)
      return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2)
      return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3)
      return <Medal className="h-6 w-6 text-orange-600" />;
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600";
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500";
    if (rank === 3) return "bg-gradient-to-r from-orange-400 to-orange-600";
    return "bg-muted";
  };

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
            <h1 className="text-4xl font-bold mb-2">Global Leaderboard</h1>
            <p className="text-xl text-muted-foreground">Top performers across all quizzes</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading leaderboard...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && leaderboard.length === 0 && (
            <Card className="p-8 text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Rankings Yet</h2>
              <p className="text-muted-foreground">Complete quizzes to appear on the leaderboard!</p>
            </Card>
          )}

          {/* Top 3 Podium */}
          {!loading && leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* 2nd Place */}
              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-300 dark:border-gray-600">
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-2">
                    <Medal className="h-12 w-12 text-gray-400" />
                  </div>
                  <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-gray-300">
                    <AvatarImage src={leaderboard[1].avatar_url || undefined} />
                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xl">
                      {leaderboard[1].full_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg">{leaderboard[1].full_name || "User"}</h3>
                  <p className="text-3xl font-bold text-gray-600 dark:text-gray-300 mt-2">{leaderboard[1].total_points || 0}</p>
                  <p className="text-sm text-muted-foreground">{leaderboard[1].total_tests || 0} quizzes</p>
                </CardContent>
              </Card>

              {/* 1st Place */}
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-2 border-yellow-400 -mt-4 scale-105">
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-2">
                    <Trophy className="h-16 w-16 text-yellow-500" />
                  </div>
                  <Avatar className="h-24 w-24 mx-auto mb-3 border-4 border-yellow-400">
                    <AvatarImage src={leaderboard[0].avatar_url || undefined} />
                    <AvatarFallback className="bg-yellow-200 text-yellow-800 text-2xl">
                      {leaderboard[0].full_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-xl">{leaderboard[0].full_name || "User"}</h3>
                  <p className="text-4xl font-bold text-yellow-600 mt-2">{leaderboard[0].total_points || 0}</p>
                  <p className="text-sm text-muted-foreground">{leaderboard[0].total_tests || 0} quizzes</p>
                </CardContent>
              </Card>

              {/* 3rd Place */}
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-2 border-orange-400">
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-2">
                    <Medal className="h-12 w-12 text-orange-600" />
                  </div>
                  <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-orange-300">
                    <AvatarImage src={leaderboard[2].avatar_url || undefined} />
                    <AvatarFallback className="bg-orange-200 text-orange-700 text-xl">
                      {leaderboard[2].full_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg">{leaderboard[2].full_name || "User"}</h3>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{leaderboard[2].total_points || 0}</p>
                  <p className="text-sm text-muted-foreground">{leaderboard[2].total_tests || 0} quizzes</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Full Leaderboard */}
          {!loading && leaderboard.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>All Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                        entry.id === currentUserId
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankBadge(entry.rank || 0)}`}>
                          {getRankIcon(entry.rank || 0) || (
                            <span className="text-lg font-bold">{entry.rank}</span>
                          )}
                        </div>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={entry.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {entry.full_name?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{entry.full_name || "User"}</h3>
                            {entry.id === currentUserId && (
                              <Badge variant="secondary" className="text-xs">You</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {entry.total_tests || 0} quizzes completed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{entry.total_points || 0}</div>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
