import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameEngine, type GameConfig, type Position } from "@/lib/game-engine";
import { gameStorage } from "@/lib/storage";
import { Zap, Play, Pause, Maximize2 } from "lucide-react";

interface SnakeSegment extends Position {}
interface Food extends Position {}

type Difficulty = "Easy" | "Medium" | "Hard";

class TapSnakeGameEngine extends GameEngine {
  private snake: SnakeSegment[] = [];
  private food: Food = { x: 0, y: 0 };
  private direction = { x: 1, y: 0 };
  private gridSize = 20;
  private lastMoveTime = 0;
  private moveInterval = 200;
  private foodEaten = 0;
  private difficulty: Difficulty = "Medium";

  constructor(canvas: HTMLCanvasElement, config: GameConfig, difficulty: Difficulty) {
    super(canvas, config);
    this.difficulty = difficulty;
    this.setDifficulty();
    this.initializeGame();
  }

  private setDifficulty() {
    switch (this.difficulty) {
      case "Easy":
        this.moveInterval = 250;
        break;
      case "Medium":
        this.moveInterval = 200;
        break;
      case "Hard":
        this.moveInterval = 150;
        break;
    }
  }

  protected bindEvents(): void {
    const handleTap = () => {
      if (this.state.isPlaying) this.changeDirection();
    };

    this.canvas.addEventListener("click", handleTap);
    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      handleTap();
    });

    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleTap();
      } else if (e.code === "ArrowUp" && this.direction.y === 0) this.direction = { x: 0, y: -1 };
      else if (e.code === "ArrowDown" && this.direction.y === 0) this.direction = { x: 0, y: 1 };
      else if (e.code === "ArrowLeft" && this.direction.x === 0) this.direction = { x: -1, y: 0 };
      else if (e.code === "ArrowRight" && this.direction.x === 0) this.direction = { x: 1, y: 0 };
      else if (e.key.toLowerCase() === "p") this.togglePause();
      else if (e.key.toLowerCase() === "f") this.toggleFullscreen();
    });
  }

  private togglePause() {
    this.state.isPlaying ? this.pause() : this.start();
  }

  private toggleFullscreen() {
    if (!document.fullscreenElement) this.canvas.requestFullscreen();
    else document.exitFullscreen();
  }

  // ... rest of class remains the same
}

export function TapSnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<TapSnakeGameEngine | null>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const config: GameConfig = { width: 400, height: 500, fps: 60 };

    gameRef.current = new TapSnakeGameEngine(canvas, config, difficulty);
    gameRef.current.setCallbacks(
      (newScore) => setScore(newScore),
      (finalScore) => {
        setIsPlaying(false);
        gameStorage.saveScore({
          gameSlug: "tap-snake",
          score: finalScore,
          timestamp: Date.now(),
          playerName: gameStorage.getPreferences().playerName,
        });
      }
    );

    setBestScore(gameStorage.getBestScore("tap-snake"));

    return () => {
      gameRef.current?.destroy();
    };
  }, [difficulty]);

  const handleStart = () => {
    gameRef.current?.start();
    setIsPlaying(true);
  };

  const handlePause = () => {
    gameRef.current?.pause();
  };

  const handleRestart = () => {
    gameRef.current?.restart();
    setScore(0);
    setIsPlaying(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6 text-yellow-500" />
              <span>Tap Snake</span>
            </div>
            <Badge variant="outline">Classic Game</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col items-center space-y-4">
              <canvas
                ref={canvasRef}
                className="border-2 border-border rounded-lg bg-slate-50 dark:bg-slate-800"
                style={{ maxWidth: '100%', height: 'auto' }}
              />

              <div className="flex items-center space-x-3">
                {!isPlaying ? (
                  <Button onClick={handleStart} size="lg">
                    <Play className="w-5 h-5 mr-2" />
                    Start Game
                  </Button>
                ) : (
                  <>
                    <Button onClick={handlePause} variant="outline">
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </Button>
                    <Button onClick={handleRestart} variant="outline">
                      <Zap className="w-5 h-5 mr-2" />
                      Restart
                    </Button>
                  </>
                )}
                <Button variant="ghost" onClick={() => {
                  if (!document.fullscreenElement) canvasRef.current?.requestFullscreen();
                  else document.exitFullscreen();
                }}>
                  <Maximize2 className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex space-x-2">
                {(["Easy", "Medium", "Hard"] as Difficulty[]).map((level) => (
                  <Button
                    key={level}
                    variant={difficulty === level ? "default" : "outline"}
                    onClick={() => setDifficulty(level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">How to Play</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Use arrow keys or tap/click to control the snake</li>
                  <li>• Eat red food to grow and earn points</li>
                  <li>• Don't hit walls or your own body</li>
                  <li>• Use P to pause, F for fullscreen</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-primary">{score}</div>
                    <p className="text-xs text-muted-foreground">Current Score</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-accent">{bestScore}</div>
                    <p className="text-xs text-muted-foreground">Best Score</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Tips</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Create safe paths as the snake grows</li>
                  <li>• Don't turn too quickly near edges</li>
                  <li>• Eat more food to increase speed & score</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
