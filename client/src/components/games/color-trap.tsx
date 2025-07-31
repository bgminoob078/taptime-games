import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameEngine, type GameConfig } from "@/lib/game-engine";
import { gameStorage } from "@/lib/storage";
import { Target, Play, Pause } from "lucide-react";

interface ColorButton {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isTarget: boolean;
}

class ColorTrapGameEngine extends GameEngine {
  private buttons: ColorButton[] = [];
  private targetColor = "";
  private colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
  private buttonSize = 60;
  private timeLeft = 30;
  private lastTimeUpdate = 0;
  private correctClicks = 0;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    super(canvas, config);
    this.generateLevel();
  }

  protected bindEvents(): void {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.handleClickAtPosition(x, y);
    });
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.handleClickAtPosition(x, y);
  }

  private handleClickAtPosition(x: number, y: number): void {
    if (!this.state.isPlaying) return;

    for (const button of this.buttons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        
        if (button.isTarget) {
          this.correctClicks++;
          this.updateScore(this.correctClicks * 10);
          this.generateLevel();
        } else {
          // Wrong color clicked - game over
          this.stop();
        }
        break;
      }
    }
  }

  private generateLevel(): void {
    this.buttons = [];
    
    // Choose target color
    this.targetColor = this.colors[Math.floor(Math.random() * this.colors.length)];
    
    // Generate 4-9 buttons
    const buttonCount = 4 + Math.floor(Math.random() * 6);
    const cols = Math.ceil(Math.sqrt(buttonCount));
    const rows = Math.ceil(buttonCount / cols);
    
    const spacing = 20;
    const totalWidth = cols * this.buttonSize + (cols - 1) * spacing;
    const totalHeight = rows * this.buttonSize + (rows - 1) * spacing;
    const startX = (this.config.width - totalWidth) / 2;
    const startY = (this.config.height - totalHeight) / 2;

    let targetPlaced = false;
    
    for (let i = 0; i < buttonCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      const x = startX + col * (this.buttonSize + spacing);
      const y = startY + row * (this.buttonSize + spacing);
      
      let color = this.colors[Math.floor(Math.random() * this.colors.length)];
      let isTarget = false;
      
      // Ensure at least one target button
      if (!targetPlaced && (i === buttonCount - 1 || Math.random() < 0.3)) {
        color = this.targetColor;
        isTarget = true;
        targetPlaced = true;
      }
      
      this.buttons.push({
        x, y,
        width: this.buttonSize,
        height: this.buttonSize,
        color,
        isTarget
      });
    }
    
    // If no target was placed, force one
    if (!targetPlaced && this.buttons.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.buttons.length);
      this.buttons[randomIndex].color = this.targetColor;
      this.buttons[randomIndex].isTarget = true;
    }
  }

  protected update(deltaTime: number): void {
    this.lastTimeUpdate += deltaTime;
    
    if (this.lastTimeUpdate >= 1000) {
      this.timeLeft--;
      this.lastTimeUpdate = 0;
      
      if (this.timeLeft <= 0) {
        this.stop();
      }
    }
  }

  protected render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw target color instruction
    this.ctx.fillStyle = '#1e293b';
    this.ctx.font = 'bold 24px Inter';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Tap this color:', this.config.width / 2, 50);
    
    // Draw target color sample
    this.ctx.fillStyle = this.targetColor;
    this.ctx.fillRect(this.config.width / 2 - 30, 60, 60, 30);
    this.ctx.strokeStyle = '#1e293b';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.config.width / 2 - 30, 60, 60, 30);

    // Draw buttons
    for (const button of this.buttons) {
      this.ctx.fillStyle = button.color;
      this.ctx.fillRect(button.x, button.y, button.width, button.height);
      
      // Border
      this.ctx.strokeStyle = '#1e293b';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(button.x, button.y, button.width, button.height);
    }

    // Draw UI
    this.ctx.fillStyle = '#1e293b';
    this.ctx.font = '20px Inter';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.state.score}`, 20, 30);
    this.ctx.fillText(`Time: ${this.timeLeft}s`, 20, 55);
    
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Correct: ${this.correctClicks}`, this.config.width - 20, 30);

    if (!this.state.isPlaying && this.state.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '32px Inter';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2 - 20);
      this.ctx.font = '20px Inter';
      this.ctx.fillText(`Final Score: ${this.state.score}`, this.config.width / 2, this.config.height / 2 + 20);
    }
  }

  protected reset(): void {
    this.timeLeft = 30;
    this.correctClicks = 0;
    this.lastTimeUpdate = 0;
    this.updateScore(0);
    this.generateLevel();
  }
}

export function ColorTrapGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<ColorTrapGameEngine | null>(null);
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

    gameRef.current = new ColorTrapGameEngine(canvas, config);
    gameRef.current.setCallbacks(
      (newScore) => setScore(newScore),
      (finalScore) => {
        setIsPlaying(false);
        gameStorage.saveScore({
          gameSlug: 'color-trap',
          score: finalScore,
          timestamp: Date.now(),
          playerName: gameStorage.getPreferences().playerName
        });
      }
    );

    setBestScore(gameStorage.getBestScore('color-trap'));

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
              <Target className="w-6 h-6 text-red-500" />
              <span>Color Trap</span>
            </div>
            <Badge variant="outline">Reaction Game</Badge>
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
                      <Target className="w-5 h-5 mr-2" />
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
                  <li>• Look at the target color shown at the top</li>
                  <li>• Click only buttons that match that color</li>
                  <li>• Wrong color = game over instantly</li>
                  <li>• Beat the clock to maximize your score</li>
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
                  <li>• Focus on the target color sample</li>
                  <li>• Don't rush - accuracy is more important than speed</li>
                  <li>• Watch out for similar colors that might trick you</li>
                  <li>• Each correct click gives you 10 points</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
