import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { GameCard } from "@/components/game-card";
import { Leaderboard } from "@/components/leaderboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Smartphone, 
  Download, 
  WifiOff, 
  UserX, 
  ShieldCheck,
  RotateCcw,
  Target,
  Truck,
  Send,
  Layers,
  Twitter,
  Instagram,
  Youtube
} from "lucide-react";
import type { Game } from "@shared/schema";

const gameIcons = {
  "bottle-flip-2d": <RotateCcw className="w-16 h-16" />,
  "color-trap": <Target className="w-16 h-16" />,
  "traffic-tapper": <Truck className="w-16 h-16" />,
  "paper-plane-flight": <Send className="w-16 h-16" />,
  "tap-snake": <Zap className="w-16 h-16" />,
  "doodle-stack": <Layers className="w-16 h-16" />
};

const gameGradients = {
  "bottle-flip-2d": { from: "from-blue-400", to: "to-blue-600" },
  "color-trap": { from: "from-red-400", to: "to-pink-600" },
  "traffic-tapper": { from: "from-green-400", to: "to-emerald-600" },
  "paper-plane-flight": { from: "from-purple-400", to: "to-indigo-600" },
  "tap-snake": { from: "from-yellow-400", to: "to-orange-600" },
  "doodle-stack": { from: "from-teal-400", to: "to-cyan-600" }
};

export default function Home() {
  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const scrollToGames = () => {
    document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Lightning Fast
              </span>
              <br />
              Browser Games
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              बिना heavy download, बिना boring gameplay – bas pure timepass के लिए! 
              <span className="font-semibold">10MB से कम वाले addictive games</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="gradient-primary text-white hover:opacity-90 transition-all transform hover:scale-105"
                onClick={scrollToGames}
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Playing Now
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              >
                How It Works
              </Button>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">0.5s</div>
                <div className="text-sm text-muted-foreground">Load Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">5MB</div>
                <div className="text-sm text-muted-foreground">Max Size</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">100%</div>
                <div className="text-sm text-muted-foreground">Free</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Games Section */}
      <section id="games" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Featured Games</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple yet addictive games that you'll want to play again and again. One tap to start!
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-muted animate-pulse" />
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-4 bg-muted animate-pulse rounded mb-4 w-3/4" />
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-muted animate-pulse rounded w-20" />
                      <div className="h-9 bg-muted animate-pulse rounded w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {games.map((game) => {
                const gradient = gameGradients[game.slug as keyof typeof gameGradients] || 
                  { from: "from-gray-400", to: "to-gray-600" };
                const icon = gameIcons[game.slug as keyof typeof gameIcons] || 
                  <Zap className="w-16 h-16" />;

                return (
                  <GameCard
                    key={game.id}
                    game={game}
                    gradientFrom={gradient.from}
                    gradientTo={gradient.to}
                    icon={icon}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Leaderboard Section */}
      <section id="leaderboard" className="py-16 lg:py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Top Players</h2>
            <p className="text-lg text-muted-foreground">Compete with players worldwide and climb the leaderboards!</p>
          </div>
          <Leaderboard />
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Choose TapTime Games?</h2>
            <p className="text-lg text-muted-foreground">Built for speed, designed for fun</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Lightning Fast</h3>
              <p className="text-muted-foreground">Games load in under 0.5 seconds. No waiting, just instant fun!</p>
            </Card>
            
            <Card className="text-center p-8 bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Mobile Optimized</h3>
              <p className="text-muted-foreground">Perfect for touch controls. Works flawlessly on any device, any screen size.</p>
            </Card>
            
            <Card className="text-center p-8 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Ultra Lightweight</h3>
              <p className="text-muted-foreground">All games under 5MB. Save your data and storage space!</p>
            </Card>
            
            <Card className="text-center p-8 bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 border-indigo-500/20">
              <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <WifiOff className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Offline Ready</h3>
              <p className="text-muted-foreground">Once loaded, play without internet. Perfect for commuting!</p>
            </Card>
            
            <Card className="text-center p-8 bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <UserX className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">No Registration</h3>
              <p className="text-muted-foreground">Jump straight into games. Sign up only if you want to save progress.</p>
            </Card>
            
            <Card className="text-center p-8 bg-gradient-to-br from-teal-500/5 to-teal-500/10 border-teal-500/20">
              <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Privacy First</h3>
              <p className="text-muted-foreground">No forced ads, no tracking. Your privacy is our priority.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">TapTime Games</span>
              </div>
              <p className="text-slate-400 mb-6 max-w-md">
                बिना heavy download, बिना boring gameplay – bas pure timepass के लिए! Lightning fast browser games that you'll love.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon" className="bg-slate-800 hover:bg-slate-700">
                  <Twitter className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="bg-slate-800 hover:bg-slate-700">
                  <Instagram className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="bg-slate-800 hover:bg-slate-700">
                  <Youtube className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {/* Games */}
            <div>
              <h3 className="text-white font-semibold mb-6">Games</h3>
              <ul className="space-y-3">
                {games.map((game) => (
                  <li key={game.id}>
                    <a href={`/game/${game.slug}`} className="hover:text-primary transition-colors">
                      {game.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h3 className="text-white font-semibold mb-6">Company</h3>
              <ul className="space-y-3">
                <li><a href="#about" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 text-center">
            <p className="text-slate-400">© 2024 TapTime Games. Made with ❤️ for gamers worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
