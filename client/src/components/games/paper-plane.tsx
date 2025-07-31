import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameEngine, type GameConfig, type Position } from "@/lib/game-engine";
import { gameStorage } from "@/lib/storage";
import { Send, Play, Pause } from "lucide-react";

interface Plane {
  x: number;
  y: number;
  velocityY: number;
  rotation: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'pipe' | 'cloud';
}

class PaperPlaneGameEngine extends GameEngine {
  private plane: Plane;
  private obstacles: Obstacle[] = [];
  private gravity = 0.6;
  private jumpPower = -12;
  private gameSpeed = 3;
  private lastObstacleX = 0;
  private obstacleSpacing = 300;
  private distance = 0;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    super(canvas, config);
    this.plane = this.createPlane();
  }

  private createPlane(): Plane {
    return {
      x: 80,
      y: this.config.height / 2,
      velocityY: 0,
      rotation: 0
    };
  }

  protected bindEvents(): void {
    const handleInput = () => {
      if (this.state.isPlaying) {
        this.plane.velocityY = this.jumpPower;
      }
    };

    this.canvas.addEventListener('click', handleInput);
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleInput();
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleInput();
      }
    });
  }

  private generateObstacle(): void {
    const gapSize = 120;
    const minHeight = 50;
    const maxHeight = this.config.height - gapSize - minHeight;
    const topHeight = minHeight + Math.random() * (maxHeight - minHeight);
    
    // Top obstacle
    this.obstacles.push({
      x: this.config.width,
      y: 0,
      width: 60,
      height: topHeight,
      type: 'pipe'
    });
    
    // Bottom obstacle
    this.obstacles.push({
      x: this.config.width,
      y: topHeight + gapSize,
      width: 60,
      height: this.config.height - (topHeight + gapSize),
      type: 'pipe'
    });

    this.lastObstacleX = this.config.width;
  }

  private checkCollisions(): boolean {
    // Check ground and ceiling
    if (this.plane.y <= 0 || this.plane.y >= this.config.height - 20) {
      return true;
    }

    // Check obstacles
    const planeRect = {
      x: this.plane.x,
      y: this.plane.y,
      width: 40,
      height: 20
    };

    for (const obstacle of this.obstacles) {
      if (planeRect.x < obstacle.x + obstacle.width &&
          planeRect.x + planeRect.width > obstacle.x &&
          planeRect.y < obstacle.y + obstacle.height &&
          planeRect.y + planeRect.height > obstacle.y) {
        return true;
      }
    }

    return false;
  }

  protected update(deltaTime: number): void {
    // Update plane physics
    this.plane.velocityY += this.gravity;
    this.plane.y += this.plane.velocityY;
    
    // Update plane rotation based on velocity
    this.plane.rotation = Math.max(-30, Math.min(30, this.plane.velocityY * 2));

    // Update distance and score
    this.distance += this.gameSpeed;
    this.updateScore(Math.floor(this.distance / 10));

    // Generate obstacles
    if (this.config.width - this.lastObstacleX >= this.obstacleSpacing) {
      this.generateObstacle();
    }

    // Update obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      this.obstacles[i].x -= this.gameSpeed;
      
      // Remove off-screen obstacles
      if (this.obstacles[i].x + this.obstacles[i].width < 0) {
        this.obstacles.splice(i, 1);
      }
    }

    // Increase difficulty gradually
    this.gameSpeed += 0.002;

    // Check collisions
    if (this.checkCollisions()) {
      this.stop();
    }
  }

  protected render(): void {
    // Clear canvas with sky blue gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(1, '#98d8eb');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw clouds (background decoration)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 5; i++) {
      const x = (this.distance * 0.5 + i * 150) % (this.config.width + 100);
      const y = 50 + i * 30;
      this.drawCloud(x, y);
    }

    // Draw obstacles
    for (const obstacle of this.obstacles) {
      if (obstacle.type === 'pipe') {
        // Draw pipe
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Pipe border
        this.ctx.strokeStyle = '#059669';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Pipe cap
        this.ctx.fillStyle = '#047857';
        if (obstacle.y === 0) {
          // Top pipe cap
          this.ctx.fillRect(obstacle.x - 5, obstacle.height - 20, obstacle.width + 10, 20);
        } else {
          // Bottom pipe cap
          this.ctx.fillRect(obstacle.x - 5, obstacle.y, obstacle.width + 10, 20);
        }
      }
    }

    // Draw plane
    this.ctx.save();
    this.ctx.translate(this.plane.x + 20, this.plane.y + 10);
    this.ctx.rotate((this.plane.rotation * Math.PI) / 180);
    
    // Paper plane shape
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.moveTo(-20, 0);
    this.ctx.lineTo(20, -5);
    this.ctx.lineTo(20, 5);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Plane outline
    this.ctx.strokeStyle = '#64748b';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Plane fold lines
    this.ctx.strokeStyle = '#94a3b8';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(-20, 0);
    this.ctx.lineTo(0, 0);
    this.ctx.stroke();
    
    this.ctx.restore();

    // Draw UI
    this.ctx.fillStyle = '#1e293b';
    this.ctx.font = '20px Inter';
    this.ctx.fillText(`Distance: ${Math.floor(this.distance / 10)}m`, 20, 30);
    this.ctx.fillText(`Score: ${this.state.score}`, 20, 55);

    if (!this.state.isPlaying && this.state.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '32px Inter';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Crashed!', this.config.width / 2, this.config.height / 2 - 20);
      this.ctx.font = '20px Inter';
      this.ctx.fillText(`Distance: ${Math.floor(this.distance / 10)}m`, this.config.width / 2, this.config.height / 2 + 20);
      this.ctx.textAlign = 'left';
    }
  }

  private drawCloud(x: number, y: number): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, 15, 0, Math.PI * 2);
    this.ctx.arc(x + 15, y, 20, 0, Math.PI * 2);
    this.ctx.arc(x + 30, y, 15, 0, Math.PI * 2);
    this.ctx.arc(x + 15, y - 10, 12, 0, Math.PI * 2);
    this.ctx.fill();
  }

  protected reset(): void {
    this.plane = this.createPlane();
    this.obstacles = [];
    this.distance = 0;
    this.gameSpeed = 3;
    this.lastObstacleX = 0;
    this.updateScore(0);
  }
}

export function PaperPlaneGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<PaperPlaneGameEngine | null>(null);
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

    gameRef.current = new PaperPlaneGameEngine(canvas, config);
    gameRef.current.setCallbacks(
      (newScore) => setScore(newScore),
      (finalScore) => {
        setIsPlaying(false);
        gameStorage.saveScore({
          gameSlug: 'paper-plane-flight',
          score: finalScore,
          timestamp: Date.now(),
          playerName: gameStorage.getPreferences().playerName
        });
      }
    );

    setBestScore(gameStorage.getBestScore('paper-plane-flight'));

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
              <Send className="w-6 h-6 text-purple-500" />
              <span>Paper Plane Flight</span>
            </div>
            <Badge variant="outline">Endless Game</Badge>
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
                    Start Flying
                  </Button>
                ) : (
                  <>
                    <Button onClick={handlePause} variant="outline">
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </Button>
                    <Button onClick={handleRestart} variant="outline">
                      <Send className="w-5 h-5 mr-2" />
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
                  <li>• Tap or click to make the plane fly up</li>
                  <li>• Navigate through the gaps between pipes</li>
                  <li>• Don't hit the ground, ceiling, or obstacles</li>
                  <li>• See how far you can fly!</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-primary">{score}</div>
                    <p className="text-xs text-muted-foreground">Distance (m)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-accent">{bestScore}</div>
                    <p className="text-xs text-muted-foreground">Best Distance</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Tips</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Tap regularly to maintain altitude</li>
                  <li>• Don't tap too rapidly - smooth control is key</li>
                  <li>• The game gets faster as you progress</li>
                  <li>• Practice makes perfect - learn the timing!</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
