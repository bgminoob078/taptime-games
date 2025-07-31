import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Home } from "lucide-react";
import { Link } from "wouter";
import type { Game } from "@shared/schema";

// Game components
import { BottleFlipGame } from "@/components/games/bottle-flip";
import { ColorTrapGame } from "@/components/games/color-trap";
import { TrafficTapperGame } from "@/components/games/traffic-tapper";
import { PaperPlaneGame } from "@/components/games/paper-plane";
import { TapSnakeGame } from "@/components/games/tap-snake";
import { DoodleStackGame } from "@/components/games/doodle-stack";

const gameComponents = {
  "bottle-flip-2d": BottleFlipGame,
  "color-trap": ColorTrapGame,
  "traffic-tapper": TrafficTapperGame,
  "paper-plane-flight": PaperPlaneGame,
  "tap-snake": TapSnakeGame,
  "doodle-stack": DoodleStackGame,
};

export default function Game() {
  const { slug } = useParams();
  
  const { data: game, isLoading, error } = useQuery<Game>({
    queryKey: ["/api/games", slug],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardHeader>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[500px] bg-muted animate-pulse rounded-lg" />
                <div className="space-y-6">
                  <div className="h-6 bg-muted animate-pulse rounded" />
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-4 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h1 className="text-2xl font-bold text-destructive mb-4">Game Not Found</h1>
                <p className="text-muted-foreground mb-6">
                  The game you're looking for doesn't exist or isn't available right now.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/">
                    <Button>
                      <Home className="w-4 h-4 mr-2" />
                      Go Home
                    </Button>
                  </Link>
                  <Link href="/#games">
                    <Button variant="outline">
                      Browse Games
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const GameComponent = gameComponents[game.slug as keyof typeof gameComponents];

  if (!GameComponent) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Link href="/">
                    <Button variant="ghost" size="icon">
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  </Link>
                  <span>{game.name}</span>
                </div>
                <Badge variant="outline">{game.category}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold mb-4">Coming Soon!</h2>
                <p className="text-muted-foreground mb-6">
                  This game is currently under development. Check back soon!
                </p>
                <Link href="/">
                  <Button>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Games
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Breadcrumb */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/#games" className="hover:text-primary transition-colors">
              Games
            </Link>
            <span>/</span>
            <span className="text-foreground">{game.name}</span>
          </div>
        </div>
      </div>

      <GameComponent />
    </div>
  );
}
