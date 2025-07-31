import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Calendar, Target } from "lucide-react";
import type { Score, Challenge } from "@shared/schema";

interface LeaderboardEntry extends Score {
  rank: number;
}

export function Leaderboard() {
  const { data: scores = [], isLoading: scoresLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/scores", { limit: 10 }],
  });

  const { data: challenges = [], isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  if (scoresLoading || challengesLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 bg-muted animate-pulse rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl border-2 border-muted">
                  <div className="h-5 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-4 bg-muted animate-pulse rounded mb-3 w-3/4" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topScores = scores.slice(0, 3).map((score, index) => ({
    ...score,
    rank: index + 1
  }));

  const activeChallenges = challenges.filter(challenge => {
    const now = new Date();
    return challenge.startDate <= now && challenge.endDate >= now;
  });

  const upcomingChallenges = challenges.filter(challenge => {
    const now = new Date();
    return challenge.startDate > now;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Overall Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="w-6 h-6 mr-3 text-yellow-500" />
            Overall Champions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topScores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No scores yet. Be the first to play!</p>
              </div>
            ) : (
              topScores.map((score) => {
                const medalColors = {
                  1: "from-yellow-400 to-yellow-600",
                  2: "from-gray-400 to-gray-600", 
                  3: "from-amber-600 to-orange-600"
                };

                return (
                  <div key={score.id} className="flex items-center space-x-4 p-4 rounded-xl bg-muted/50">
                    <div className={`w-10 h-10 bg-gradient-to-r ${medalColors[score.rank as keyof typeof medalColors]} rounded-full flex items-center justify-center text-white font-bold`}>
                      {score.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{score.playerName || "Anonymous Player"}</div>
                      <div className="text-sm text-muted-foreground">{score.score.toLocaleString()} points</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {score.createdAt && new Date(score.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-primary" />
            Daily Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {activeChallenges.length === 0 && upcomingChallenges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active challenges at the moment.</p>
              </div>
            ) : (
              <>
                {activeChallenges.map((challenge) => (
                  <div key={challenge.id} className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{challenge.title}</h4>
                      <Badge variant="default" className="text-xs">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Target: {challenge.target}</div>
                      <div className="text-sm text-accent">+{challenge.reward} points</div>
                    </div>
                    <Progress value={0} className="mt-2" />
                  </div>
                ))}
                
                {upcomingChallenges.slice(0, 2).map((challenge) => (
                  <div key={challenge.id} className="p-4 rounded-xl border-2 border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{challenge.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {challenge.startDate > new Date() ? "Upcoming" : "Tomorrow"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>
                    <div className="text-sm text-accent">+{challenge.reward} points</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
