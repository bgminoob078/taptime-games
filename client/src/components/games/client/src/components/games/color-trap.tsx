import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameEngine, type GameConfig, type Position } from "@/lib/game-engine";
import { gameStorage } from "@/lib/storage";
import { RotateCcw, Play, Pause } from "lucide-react";

interface Bottle {
  x: number;
  y: number;
  rotation: number;
  velocityY: number;
  angularVelocity: number;
  isFlipping: boolean;
}

class BottleFlipGameEngine extends GameEngine {
  private bottle: Bottle;
  private gravity = 0.8;
  private groundY: number;
  private attempts = 0;
  private consecutiveFlips = 0;
  private targetRotation = 0;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    super(canvas, config);
    this.groundY = config.height - 50;
    this.bottle = this.createBottle();
  }

  private createBottle(): Bottle {
    return {
      x: this.config.width / 2,
      y: this.groundY - 40,
      rotation: 0,
      velocityY: 0,
      angularVelocity: 0,
      isFlipping: false
    };
  }

  protected bindEvents(): void {
    this.canvas.addEventListener('click', () => this.flipBottle());
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.flipBottle();
    });
  }

  private flipBottle(): void {
    if (!this.state.isPlaying || this.bottle.isFlipping) return;

    this.bottle.isFlipping = true;
    this.bottle.velocityY = -18;
    this.bottle.angularVelocity = 15 + Math.random() * 5;
    this.targetRotation = this.bottle.rotation + 360;
    this.attempts++;
  }

  protected update(deltaTime: number): void {
    if (!this.bottle.isFlipping) return;

    // Apply gravity
    this.bottle.velocityY += this.gravity;
    this.bottle.y += this.bottle.velocityY;
    this.bottle.rotation += this.bottle.angularVelocity;

    // Check landing
    if (this.bottle.y >= this.groundY - 40) {
      this.bottle.y = this.groundY - 40;
      this.bottle.isFlipping = false;
      this.bottle.velocityY = 0;
      this.bottle.angularVelocity = 0;

      // Check if bottle landed upright (within 15 degrees of upright)
      const normalizedRotation = this.bottle.rotation % 360;
      const isUpright = (normalizedRotation >= 350 || normalizedRotation <= 10) ||
                       (normalizedRotation >= 170 && normalizedRotation <= 190);

      if (isUpright) {
        this.consecutiveFlips++;
        this.updateScore(this.consecutiveFlips * 100);
        this.bottle.rotation = normalizedRotation > 180 ? 180 : 0;
      } else {
        if (this.consecutiveFlips > 0) {
          // Game over after missing
          this.stop();
        }
      }
    }
  }

  protected render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw ground
    this.ctx.fillStyle = '#64748b';
    this.ctx.fillRect(0, this.groundY, this.config.width, this.config.height - this.groundY);

    // Draw bottle
    this.ctx.save();
    this.ctx.translate(this.bottle.x, this.bottle.y);
    this.ctx.rotate((this.bottle.rotation * Math.PI) / 180);

    // Bottle body
    this.ctx.fillStyle = '#3b82f6';
    this.ctx.fillRect(-15, -40, 30, 80);

    // Bottle cap
    this.ctx.fillStyle = '#1d4ed8';
    this.ctx.fillRect(-10, -50, 20, 10);

    // Bottle label
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(-12, -20, 24, 15);

    this.ctx.restore();

    // Draw UI
    this.ctx.fillStyle = '#1e293b';
    this.ctx.font = '24px Inter';
    this.ctx.fillText(`Score: ${this.state.score}`, 20, 40);
    this.ctx.fillText(`Consecutive: ${this.consecutiveFlips}`, 20, 70);
    this.ctx.fillText(`Attempts: ${this.attempts}`, 20, 100);

    if (!this.state.isPlaying && !this.bottle.isFlipping) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '32px Inter';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Tap to flip the bottle!', this.config.width / 2, this.config.height / 2);
      this.ctx.textAlign = 'left';
    }
  }

  protected reset(): void {
    this.bottle = this.createBottle();
    this.attempts = 0;
    this.consecutiveFlips = 0;
    this.updateScore(0);
  }
}

export function BottleFlipGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<BottleFlipGameEngine | null>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const config: GameConfig = {
      width: 400,
      height: 500,
      fps: 60
    };

    gameRef.current = new BottleFlipGameEngine(canvas, config);
    gameRef.current.setCallbacks(
      (newScore) => setScore(newScore),
      (finalScore) => {
        setIsPlaying(false);
        gameStorage.saveScore({
          gameSlug: 'bottle-flip-2d',
          score: finalScore,
          timestamp: Date.now(),
          playerName: gameStorage.getPreferences().playerName
        });
      }
    );

    setBestScore(gameStorage.getBestScore('bottle-flip-2d'));

    return () => {
      gameRef.current?.destroy();
    };
  }, []);

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
              <RotateCcw className="w-6 h-6 text-blue-500" />
              <span>Bottle Flip 2D</span>
            </div>
            <Badge variant="outline">Timing Game</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Game Canvas */}
            <div className="flex flex-col items-center space-y-4">
              <canvas
                ref={canvasRef}
                className="border-2 border-border rounded-lg bg-slate-50 dark:bg-slate-800"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              
              {/* Game Controls */}
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
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Restart
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Game Info & Stats */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">How to Play</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Tap or click to flip the bottle</li>
                  <li>• Land the bottle upright to score points</li>
                  <li>• Consecutive flips multiply your score</li>
                  <li>• Missing a flip ends the game</li>
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
                  <li>• Timing is everything - watch the bottle's rotation</li>
                  <li>• Aim for complete 360° rotations</li>
                  <li>• The bottle has some randomness to keep it challenging</li>
                  <li>• Practice makes perfect!</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
