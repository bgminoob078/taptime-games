import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameEngine, type GameConfig, type Position } from "@/lib/game-engine";
import { gameStorage } from "@/lib/storage";
import { Layers, Play, Pause } from "lucide-react";

interface DoodleBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  shape: 'rectangle' | 'circle' | 'triangle' | 'star';
  velocityX: number;
  velocityY: number;
  rotation: number;
  angularVelocity: number;
}

class DoodleStackGameEngine extends GameEngine {
  private blocks: DoodleBlock[] = [];
  private currentBlock: DoodleBlock | null = null;
  private gravity = 0.5;
  private friction = 0.98;
  private stackHeight = 0;
  private gameHeight: number;
  private colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  private shapes: DoodleBlock['shape'][] = ['rectangle', 'circle', 'triangle', 'star'];
  private dropSpeed = 5;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    super(canvas, config);
    this.gameHeight = config.height;
    this.spawnNewBlock();
  }

  protected bindEvents(): void {
    const handleDrop = () => {
      if (this.state.isPlaying && this.currentBlock) {
        this.dropCurrentBlock();
      }
    };

    this.canvas.addEventListener('click', handleDrop);
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleDrop();
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleDrop();
      }
    });
  }

  private spawnNewBlock(): void {
    const size = 30 + Math.random() * 40;
    const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];

    this.currentBlock = {
      x: this.config.width / 2 - size / 2,
      y: 50,
      width: size,
      height: size,
      color,
      shape,
      velocityX: 0,
      velocityY: 0,
      rotation: 0,
      angularVelocity: 0
    };
  }

  private dropCurrentBlock(): void {
    if (!this.currentBlock) return;

    this.currentBlock.velocityY = this.dropSpeed;
    this.currentBlock.angularVelocity = (Math.random() - 0.5) * 10;
    this.blocks.push(this.currentBlock);
    this.currentBlock = null;

    // Spawn next block after a short delay
    setTimeout(() => {
      if (this.state.isPlaying) {
        this.spawnNewBlock();
      }
    }, 500);
  }

  private checkCollisions(block: DoodleBlock): boolean {
    // Ground collision
    if (block.y + block.height >= this.config.height - 20) {
      return true;
    }

    // Collision with other blocks
    for (const otherBlock of this.blocks) {
      if (otherBlock === block) continue;

      const dx = block.x - otherBlock.x;
      const dy = block.y - otherBlock.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = (block.width + otherBlock.width) / 2 - 5;

      if (distance < minDistance) {
        return true;
      }
    }

    return false;
  }

  private isStackStable(): boolean {
    // Check if any block is moving significantly
    for (const block of this.blocks) {
      if (Math.abs(block.velocityX) > 0.5 || Math.abs(block.velocityY) > 0.5) {
        return false;
      }
    }
    return true;
  }

  private updateStackHeight(): void {
    if (this.blocks.length === 0) {
      this.stackHeight = 0;
      return;
    }

    const lowestPoint = Math.min(...this.blocks.map(block => block.y));
    this.stackHeight = this.config.height - lowestPoint;
    this.updateScore(Math.floor(this.stackHeight / 10));
  }

  protected update(deltaTime: number): void {
    // Update falling blocks
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const block = this.blocks[i];

      // Apply physics
      block.velocityY += this.gravity;
      block.x += block.velocityX;
      block.y += block.velocityY;
      block.rotation += block.angularVelocity;

      // Apply friction
      block.velocityX *= this.friction;
      block.velocityY *= this.friction;
      block.angularVelocity *= this.friction;

      // Check collisions
      if (this.checkCollisions(block)) {
        // Bounce and settle
        if (block.velocityY > 0) {
          block.velocityY = -block.velocityY * 0.3;
        }
        if (Math.abs(block.velocityX) < 0.1) {
          block.velocityX = 0;
        }
        if (Math.abs(block.velocityY) < 0.1) {
          block.velocityY = 0;
        }
      }

      // Remove blocks that fall off screen
      if (block.y > this.config.height + 100) {
        this.blocks.splice(i, 1);
      }
    }

    // Check for game over (if stack becomes too unstable)
    if (this.blocks.length > 3 && !this.isStackStable()) {
      const topBlocks = this.blocks.filter(block => block.y < this.config.height / 2);
      if (topBlocks.length > 0 && topBlocks.some(block => 
        Math.abs(block.velocityX) > 2 || Math.abs(block.velocityY) > 2)) {
        this.stop();
      }
    }

    this.updateStackHeight();
  }

  private drawShape(block: DoodleBlock): void {
    this.ctx.save();
    this.ctx.translate(block.x + block.width / 2, block.y + block.height / 2);
    this.ctx.rotate((block.rotation * Math.PI) / 180);
    this.ctx.fillStyle = block.color;

    const size = block.width / 2;

    switch (block.shape) {
      case 'rectangle':
        this.ctx.fillRect(-size, -size, block.width, block.height);
        break;

      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'triangle':
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size);
        this.ctx.lineTo(-size, size);
        this.ctx.lineTo(size, size);
        this.ctx.closePath();
        this.ctx.fill();
        break;

      case 'star':
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5;
          const x = Math.cos(angle) * size;
          const y = Math.sin(angle) * size;
          if (i === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
        }
        this.ctx.closePath();
        this.ctx.fill();
        break;
    }

    // Add outline
    this.ctx.strokeStyle = '#1f2937';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.restore();
  }

  protected render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#f0f9ff';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw ground
    this.ctx.fillStyle = '#64748b';
    this.ctx.fillRect(0, this.config.height - 20, this.config.width, 20);

    // Draw grid lines for reference
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 1;
    for (let y = 0; y < this.config.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.config.width, y);
      this.ctx.stroke();
    }

    // Draw stacked blocks
    for (const block of this.blocks) {
      this.drawShape(block);
    }

    // Draw current falling block
    if (this.currentBlock) {
      this.drawShape(this.currentBlock);
    }

    // Draw UI
    this.ctx.fillStyle = '#1e293b';
    this.ctx.font = '20px Inter';
    this.ctx.fillText(`Score: ${this.state.score}`, 20, 30);
    this.ctx.fillText(`Height: ${Math.floor(this.stackHeight)}px`, 20, 55);
    this.ctx.fillText(`Blocks: ${this.blocks.length}`, 20, 80);

    if (this.currentBlock) {
      this.ctx.font = '16px Inter';
      this.ctx.fillText('Tap to drop!', this.config.width / 2 - 40, 30);
    }

    if (!this.state.isPlaying && this.state.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '32px Inter';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Stack Collapsed!', this.config.width / 2, this.config.height / 2 - 20);
      this.ctx.font = '20px Inter';
      this.ctx.fillText(`Final Height: ${Math.floor(this.stackHeight)}px`, this.config.width / 2, this.config.height / 2 + 20);
      this.ctx.textAlign = 'left';
    }
  }

  protected reset(): void {
    this.blocks = [];
    this.currentBlock = null;
    this.stackHeight = 0;
    this.updateScore(0);
    this.spawnNewBlock();
  }
}

export function DoodleStackGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<DoodleStackGameEngine | null>(null);
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

    gameRef.current = new DoodleStackGameEngine(canvas, config);
    gameRef.current.setCallbacks(
      (newScore) => setScore(newScore),
      (finalScore) => {
        setIsPlaying(false);
        gameStorage.saveScore({
          gameSlug: 'doodle-stack',
          score: finalScore,
          timestamp: Date.now(),
          playerName: gameStorage.getPreferences().playerName
        });
      }
    );

    setBestScore(gameStorage.getBestScore('doodle-stack'));

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
              <Layers className="w-6 h-6 text-teal-500" />
              <span>Doodle Stack</span>
            </div>
            <Badge variant="outline">Balance Game</Badge>
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
                    Start Stacking
                  </Button>
                ) : (
                  <>
                    <Button onClick={handlePause} variant="outline">
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </Button>
                    <Button onClick={handleRestart} variant="outline">
                      <Layers className="w-5 h-5 mr-2" />
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
                  <li>• Tap or click to drop the current doodle</li>
                  <li>• Stack doodles as high as possible</li>
                  <li>• Don't let your stack become too unstable</li>
                  <li>• Different shapes behave differently</li>
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
                  <li>• Rectangles are most stable for foundations</li>
                  <li>• Circles tend to roll - use them carefully</li>
                  <li>• Wait for your stack to settle before dropping</li>
                  <li>• Score is based on total stack height</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
