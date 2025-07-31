import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameEngine, type GameConfig, type Position } from "@/lib/game-engine";
import { gameStorage } from "@/lib/storage";
import { Truck, Play, Pause } from "lucide-react";

interface Vehicle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
  lane: number;
  direction: 'horizontal' | 'vertical';
}

interface TrafficLight {
  x: number;
  y: number;
  isGreen: boolean;
  direction: 'horizontal' | 'vertical';
}

class TrafficTapperGameEngine extends GameEngine {
  private vehicles: Vehicle[] = [];
  private trafficLights: TrafficLight[] = [];
  private vehiclesPassedSafely = 0;
  private lastVehicleSpawn = 0;
  private vehicleSpawnRate = 2000; // ms between spawns
  private gameSpeed = 1;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    super(canvas, config);
    this.setupTrafficLights();
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

  private setupTrafficLights(): void {
    // Horizontal road traffic light (controls vertical traffic)
    this.trafficLights.push({
      x: this.config.width / 2 - 20,
      y: this.config.height / 2 - 60,
      isGreen: true,
      direction: 'horizontal'
    });

    // Vertical road traffic light (controls horizontal traffic)
    this.trafficLights.push({
      x: this.config.width / 2 + 40,
      y: this.config.height / 2 - 20,
      isGreen: false,
      direction: 'vertical'
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

    // Check if clicked on traffic lights
    for (const light of this.trafficLights) {
      const lightSize = 30;
      if (x >= light.x && x <= light.x + lightSize &&
          y >= light.y && y <= light.y + lightSize) {
        light.isGreen = !light.isGreen;
        
        // Toggle the other light (realistic traffic light behavior)
        const otherLight = this.trafficLights.find(l => l !== light);
        if (otherLight) {
          otherLight.isGreen = !otherLight.isGreen;
        }
        break;
      }
    }
  }

  private spawnVehicle(): void {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    if (Math.random() < 0.5) {
      // Horizontal vehicle
      this.vehicles.push({
        x: Math.random() < 0.5 ? -40 : this.config.width + 40,
        y: this.config.height / 2 + (Math.random() < 0.5 ? -30 : 30),
        width: 40,
        height: 20,
        speed: (2 + Math.random() * 2) * this.gameSpeed * (Math.random() < 0.5 ? 1 : -1),
        color,
        lane: 0,
        direction: 'horizontal'
      });
    } else {
      // Vertical vehicle
      this.vehicles.push({
        x: this.config.width / 2 + (Math.random() < 0.5 ? -30 : 30),
        y: Math.random() < 0.5 ? -40 : this.config.height + 40,
        width: 20,
        height: 40,
        speed: (2 + Math.random() * 2) * this.gameSpeed * (Math.random() < 0.5 ? 1 : -1),
        color,
        lane: 1,
        direction: 'vertical'
      });
    }
  }

  private checkCollisions(): boolean {
    const intersectionZone = {
      x: this.config.width / 2 - 50,
      y: this.config.height / 2 - 50,
      width: 100,
      height: 100
    };

    const vehiclesInIntersection = this.vehicles.filter(vehicle => 
      vehicle.x < intersectionZone.x + intersectionZone.width &&
      vehicle.x + vehicle.width > intersectionZone.x &&
      vehicle.y < intersectionZone.y + intersectionZone.height &&
      vehicle.y + vehicle.height > intersectionZone.y
    );

    // Check for collisions between vehicles in intersection
    for (let i = 0; i < vehiclesInIntersection.length; i++) {
      for (let j = i + 1; j < vehiclesInIntersection.length; j++) {
        const v1 = vehiclesInIntersection[i];
        const v2 = vehiclesInIntersection[j];
        
        if (v1.x < v2.x + v2.width &&
            v1.x + v1.width > v2.x &&
            v1.y < v2.y + v2.height &&
            v1.y + v1.height > v2.y) {
          return true; // Collision detected
        }
      }
    }

    return false;
  }

  protected update(deltaTime: number): void {
    // Spawn vehicles
    this.lastVehicleSpawn += deltaTime;
    if (this.lastVehicleSpawn >= this.vehicleSpawnRate) {
      this.spawnVehicle();
      this.lastVehicleSpawn = 0;
      
      // Increase difficulty over time
      this.vehicleSpawnRate = Math.max(1000, this.vehicleSpawnRate - 50);
      this.gameSpeed += 0.02;
    }

    // Update vehicles
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const vehicle = this.vehicles[i];
      const light = this.trafficLights.find(l => l.direction === vehicle.direction);
      
      // Check if vehicle should stop at red light
      const approachingIntersection = (
        (vehicle.direction === 'horizontal' && Math.abs(vehicle.x - this.config.width / 2) < 60) ||
        (vehicle.direction === 'vertical' && Math.abs(vehicle.y - this.config.height / 2) < 60)
      );

      if (light && !light.isGreen && approachingIntersection) {
        // Stop at red light
        continue;
      }

      // Move vehicle
      if (vehicle.direction === 'horizontal') {
        vehicle.x += vehicle.speed;
      } else {
        vehicle.y += vehicle.speed;
      }

      // Remove vehicles that are off screen
      if (vehicle.x < -60 || vehicle.x > this.config.width + 60 ||
          vehicle.y < -60 || vehicle.y > this.config.height + 60) {
        this.vehicles.splice(i, 1);
        this.vehiclesPassedSafely++;
        this.updateScore(this.vehiclesPassedSafely * 10);
      }
    }

    // Check for collisions
    if (this.checkCollisions()) {
      this.stop();
    }
  }

  protected render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#22c55e';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw roads
    this.ctx.fillStyle = '#64748b';
    // Horizontal road
    this.ctx.fillRect(0, this.config.height / 2 - 50, this.config.width, 100);
    // Vertical road
    this.ctx.fillRect(this.config.width / 2 - 50, 0, 100, this.config.height);

    // Draw road markings
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([20, 10]);
    
    // Horizontal road center line
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.config.height / 2);
    this.ctx.lineTo(this.config.width, this.config.height / 2);
    this.ctx.stroke();
    
    // Vertical road center line
    this.ctx.beginPath();
    this.ctx.moveTo(this.config.width / 2, 0);
    this.ctx.lineTo(this.config.width / 2, this.config.height);
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);

    // Draw traffic lights
    for (const light of this.trafficLights) {
      // Light post
      this.ctx.fillStyle = '#1f2937';
      this.ctx.fillRect(light.x, light.y, 30, 30);
      
      // Light
      this.ctx.fillStyle = light.isGreen ? '#10b981' : '#ef4444';
      this.ctx.fillRect(light.x + 5, light.y + 5, 20, 20);
      
      // Border
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(light.x, light.y, 30, 30);
    }

    // Draw vehicles
    for (const vehicle of this.vehicles) {
      this.ctx.fillStyle = vehicle.color;
      this.ctx.fillRect(vehicle.x, vehicle.y, vehicle.width, vehicle.height);
      
      // Vehicle border
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(vehicle.x, vehicle.y, vehicle.width, vehicle.height);
    }

    // Draw UI
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px Inter';
    this.ctx.fillText(`Score: ${this.state.score}`, 20, 30);
    this.ctx.fillText(`Vehicles: ${this.vehiclesPassedSafely}`, 20, 55);

    if (!this.state.isPlaying && this.state.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '32px Inter';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Crash!', this.config.width / 2, this.config.height / 2 - 20);
      this.ctx.font = '20px Inter';
      this.ctx.fillText(`Vehicles guided safely: ${this.vehiclesPassedSafely}`, this.config.width / 2, this.config.height / 2 + 20);
      this.ctx.textAlign = 'left';
    }
  }

  protected reset(): void {
    this.vehicles = [];
    this.vehiclesPassedSafely = 0;
    this.lastVehicleSpawn = 0;
    this.vehicleSpawnRate = 2000;
    this.gameSpeed = 1;
    this.updateScore(0);
    this.setupTrafficLights();
  }
}

export function TrafficTapperGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<TrafficTapperGameEngine | null>(null);
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

    gameRef.current = new TrafficTapperGameEngine(canvas, config);
    gameRef.current.setCallbacks(
      (newScore) => setScore(newScore),
      (finalScore) => {
        setIsPlaying(false);
        gameStorage.saveScore({
          gameSlug: 'traffic-tapper',
          score: finalScore,
          timestamp: Date.now(),
          playerName: gameStorage.getPreferences().playerName
        });
      }
    );

    setBestScore(gameStorage.getBestScore('traffic-tapper'));

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
              <Truck className="w-6 h-6 text-green-500" />
              <span>Traffic Tapper</span>
            </div>
            <Badge variant="outline">Strategy Game</Badge>
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
                      <Truck className="w-5 h-5 mr-2" />
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
                  <li>• Tap traffic lights to control traffic flow</li>
                  <li>• Green = vehicles can pass, Red = vehicles stop</li>
                  <li>• Prevent vehicles from crashing in the intersection</li>
                  <li>• Guide as many vehicles as possible safely</li>
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
                  <li>• Watch the speed and direction of approaching vehicles</li>
                  <li>• Toggle lights at the right moment to avoid crashes</li>
                  <li>• Traffic gets heavier and faster over time</li>
                  <li>• Each vehicle guided safely gives you 10 points</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
