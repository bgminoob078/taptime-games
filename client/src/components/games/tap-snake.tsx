import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameEngine, type GameConfig, type Position } from "@/lib/game-engine";
import { gameStorage } from "@/lib/storage";
import { Zap, Play, Pause } from "lucide-react";

interface SnakeSegment extends Position {
  // Snake body segment
}

interface Food extends Position {
  // Food item
}

class TapSnakeGameEngine extends GameEngine {
  private snake: SnakeSegment[] = [];
  private food: Food = { x: 0, y: 0 };
  private direction = { x: 1, y: 0 }; // Moving right initially
  private gridSize = 20;
  private lastMoveTime = 0;
  private moveInterval = 200; // ms between moves
  private foodEaten = 0;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    super(canvas, config);
    this.initializeGame();
  }

  protected bindEvents(): void {
    const handleTap = () => {
      if (this.state.isPlaying) {
        this.changeDirection();
      }
    };

    this.canvas.addEventListener('click', handleTap);
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleTap();
    });

    // Keyboard support for desktop
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleTap();
      }
    });
  }

  private initializeGame(): void {
    // Initialize snake in the center
    const centerX = Math.floor((this.config.width / 2) / this.gridSize) * this.gridSize;
    const centerY = Math.floor((this.config.height / 2) / this.gridSize) * this.gridSize;
    
    this.snake = [
      { x: centerX, y: centerY },
      { x: centerX - this.gridSize, y: centerY },
      { x: centerX - this.gridSize * 2, y: centerY }
    ];
    
    this.direction = { x: 1, y: 0 };
    this.generateFood();
  }

  private changeDirection(): void {
    // Rotate direction 90 degrees clockwise
    const newDirection = {
      x: -this.direction.y,
      y: this.direction.x
    };
    this.direction = newDirection;
  }

  private generateFood(): void {
    let newFood: Food;
    let attempts = 0;
    
    do {
      newFood = {
        x: Math.floor(Math.random() * (this.config.width / this.gridSize)) * this.gridSize,
        y: Math.floor(Math.random() * (this.config.height / this.gridSize)) * this.gridSize
      };
      attempts++;
    } while (this.isPositionOnSnake(newFood) && attempts < 100);
    
    this.food = newFood;
  }

  private isPositionOnSnake(pos: Position): boolean {
    return this.snake.some(segment => segment.x === pos.x && segment.y === pos.y);
  }

  private checkCollision(): boolean {
    const head = this.snake[0];
    
    // Wall collision
    if (head.x < 0 || head.x >= this.config.width || 
        head.y < 0 || head.y >= this.config.height) {
      return true;
    }
    
    // Self collision
    for (let i = 1; i < this.snake.length; i++) {
      if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
        return true;
      }
    }
    
    return false;
  }

  protected update(deltaTime: number): void {
    this.lastMoveTime += deltaTime;
    
    if (this.lastMoveTime >= this.moveInterval) {
      this.moveSnake();
      this.lastMoveTime = 0;
      
      // Increase speed slightly as score increases
      this.moveInterval = Math.max(100, 200 - (this.foodEaten * 5));
    }
  }

  private moveSnake(): void {
    const head = { ...this.snake[0] };
    head.x += this.direction.x * this.gridSize;
    head.y += this.direction.y * this.gridSize;
    
    // Check collision before moving
    this.snake.unshift(head);
    
    if (this.checkCollision()) {
      this.stop();
      return;
    }
    
    // Check food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.foodEaten++;
      this.updateScore(this.foodEaten * 10);
      this.generateFood();
    } else {
      // Remove tail if no food eaten
      this.snake.pop();
    }
  }

  protected render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw grid (subtle)
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 1;
    
    for (let x = 0; x <= this.config.width; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.config.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= this.config.height; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.config.width, y);
      this.ctx.stroke();
    }

    // Draw food
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fillRect(this.food.x + 2, this.food.y + 2, this.gridSize - 4, this.gridSize - 4);
    
    // Food shine effect
    this.ctx.fillStyle = '#fca5a5';
    this.ctx.fillRect(this.food.x + 4, this.food.y + 4, 4, 4);

    // Draw snake
    this.snake.forEach((segment, index) => {
      if (index === 0) {
        // Head
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillRect(segment.x + 1, segment.y + 1, this.gridSize - 2, this.gridSize - 2);
        
        // Eyes
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(segment.x + 4, segment.y + 4, 3, 3);
        this.ctx.fillRect(segment.x + 13, segment.y + 4, 3, 3);
        
        this.ctx.fillStyle = '#1f2937';
        this.ctx.fillRect(segment.x + 5, segment.y + 5, 1, 1);
        this.ctx.fillRect(segment.x + 14, segment.y + 5, 1, 1);
      } else {
        // Body
        this.ctx.fillStyle = '#34d399';
        this.ctx.fillRect(segment.x + 2, segment.y + 2, this.gridSize - 4, this.gridSize - 4);
      }
    });

    // Draw UI
    this.ctx.fillStyle = '#1e293b';
    this.ctx.font = '20px Inter';
    this.ctx.fillText(`Score: ${this.state.score}`, 20, 30);
    this.ctx.fillText(`Length: ${this.snake.length}`, 20, 55);

    // Direction indicator
    this.ctx.font = '16px Inter';
    this.ctx.fillText('Tap to turn →', this.config.width - 120, 30);

    if (!this.state.isPlaying && this.state.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '32px Inter';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2 - 20);
      this.ctx.font = '20px Inter';
      this.ctx.fillText(`Length: ${this.snake.length}`, this.config.width / 2, this.config.height / 2 + 20);
      this.ctx.textAlign = 'left';
    }
  }

  protected reset(): void {
    this.initializeGame();
    this.foodEaten = 0;
    this.lastMoveTime = 0;
    this.moveInterval = 200;
    this.updateScore(0);
  }
}

export function TapSnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<TapSnakeGameEngine | null>(null);
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

    gameRef.current = new TapSnakeGameEngine(canvas, config);
    gameRef.current.setCallbacks(
      (newScore) => setScore(newScore),
      (finalScore) => {
        setIsPlaying(false);
        gameStorage.saveScore({
          gameSlug: 'tap-snake',
          score: finalScore,
          timestamp: Date.now(),
          playerName: gameStorage.getPreferences().playerName
        });
      }
    );

    setBestScore(gameStorage.getBestScore('tap-snake'));

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
              <Zap className="w-6 h-6 text-yellow-500" />
              <span>Tap Snake</span>
            </div>
            <Badge variant="outline">Classic Game</Badge>
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
                      <Zap className="w-5 h-5 mr-2" />
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
                  <li>• Tap or click to turn the snake 90° clockwise</li>
                  <li>• Eat red food to grow and earn points</li>
                  <li>• Don't hit walls or your own body</li>
                  <li>• Snake gets faster as you grow longer</li>
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
                  <li>• Plan your path - don't turn randomly</li>
                  <li>• Use the walls to help navigate tight spaces</li>
                  <li>• Each food gives you 10 points</li>
                  <li>• Try to create patterns to avoid getting trapped</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
