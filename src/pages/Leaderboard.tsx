import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import Navbar from "@/components/Navbar";

interface LeaderboardEntry {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  total_quizzes_taken: number;
  total_score: number;
  rank: number;
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });

    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .limit(50);

    if (error) {
      console.error("Error fetching leaderboard:", error);
    } else {
      setLeaderboard(data as LeaderboardEntry[]);
    }
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

          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* 2nd Place */}
              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300">
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-2">
                    <Medal className="h-12 w-12 text-gray-400" />
                  </div>
                  <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-gray-300">
                    <AvatarImage src={leaderboard[1].avatar_url} />
                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xl">
                      {leaderboard[1].username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg">{leaderboard[1].username}</h3>
                  <p className="text-3xl font-bold text-gray-600 mt-2">{leaderboard[1].total_score}</p>
                  <p className="text-sm text-muted-foreground">{leaderboard[1].total_quizzes_taken} quizzes</p>
                </CardContent>
              </Card>

              {/* 1st Place */}
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-400 -mt-4 scale-105">
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-2">
                    <Trophy className="h-16 w-16 text-yellow-500" />
                  </div>
                  <Avatar className="h-24 w-24 mx-auto mb-3 border-4 border-yellow-400">
                    <AvatarImage src={leaderboard[0].avatar_url} />
                    <AvatarFallback className="bg-yellow-200 text-yellow-800 text-2xl">
                      {leaderboard[0].username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-xl">{leaderboard[0].username}</h3>
                  <p className="text-4xl font-bold text-yellow-600 mt-2">{leaderboard[0].total_score}</p>
                  <p className="text-sm text-muted-foreground">{leaderboard[0].total_quizzes_taken} quizzes</p>
                </CardContent>
              </Card>

              {/* 3rd Place */}
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-400">
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-2">
                    <Medal className="h-12 w-12 text-orange-600" />
                  </div>
                  <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-orange-300">
                    <AvatarImage src={leaderboard[2].avatar_url} />
                    <AvatarFallback className="bg-orange-200 text-orange-700 text-xl">
                      {leaderboard[2].username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg">{leaderboard[2].username}</h3>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{leaderboard[2].total_score}</p>
                  <p className="text-sm text-muted-foreground">{leaderboard[2].total_quizzes_taken} quizzes</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Full Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>All Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-smooth ${
                      entry.id === currentUserId
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankBadge(entry.rank)}`}>
                        {getRankIcon(entry.rank) || (
                          <span className="text-lg font-bold">{entry.rank}</span>
                        )}
                      </div>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={entry.avatar_url} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {entry.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{entry.username}</h3>
                          {entry.id === currentUserId && (
                            <Badge variant="secondary" className="text-xs">You</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {entry.total_quizzes_taken} quizzes completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{entry.total_score}</div>
                      <p className="text-xs text-muted-foreground">points</p>
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

export default Leaderboard;
