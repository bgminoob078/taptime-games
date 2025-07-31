import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { Link } from "wouter";
import type { Game } from "@shared/schema";

interface GameCardProps {
  game: Game;
  gradientFrom: string;
  gradientTo: string;
  icon: React.ReactNode;
}

export function GameCard({ game, gradientFrom, gradientTo, icon }: GameCardProps) {
  return (
    <div className="game-card-hover bg-card dark:bg-card rounded-2xl shadow-xl overflow-hidden border border-border group">
      {/* Game Preview */}
      <div className={`relative h-48 bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center`}>
        <div className="text-white opacity-80 transform scale-125">
          {icon}
        </div>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        <Link href={`/game/${game.slug}`}>
          <Button
            variant="ghost"
            size="icon"
            className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity bg-transparent hover:bg-white/10"
          >
            <div className="glass-effect rounded-full p-4">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          </Button>
        </Link>
      </div>

      {/* Game Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{game.name}</h3>
        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
          {game.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {game.category}
            </Badge>
            <span className="text-xs text-muted-foreground">{game.size}</span>
          </div>
          <Link href={`/game/${game.slug}`}>
            <Button className="play-button">
              <Play className="w-4 h-4 mr-2" />
              Play Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
