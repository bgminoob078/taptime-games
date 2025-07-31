export interface GameState {
  score: number;
  isPlaying: boolean;
  isPaused: boolean;
  gameOver: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface GameConfig {
  width: number;
  height: number;
  fps: number;
}

export abstract class GameEngine {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected config: GameConfig;
  protected state: GameState;
  protected animationId: number | null = null;
  protected lastTime = 0;
  protected onScoreUpdate?: (score: number) => void;
  protected onGameOver?: (score: number) => void;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = config;
    this.state = {
      score: 0,
      isPlaying: false,
      isPaused: false,
      gameOver: false
    };
    
    this.setupCanvas();
    this.bindEvents();
  }

  private setupCanvas() {
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    this.canvas.style.width = `${this.config.width}px`;
    this.canvas.style.height = `${this.config.height}px`;
  }

  protected abstract bindEvents(): void;
  protected abstract update(deltaTime: number): void;
  protected abstract render(): void;
  protected abstract reset(): void;

  public start() {
    if (this.state.isPlaying) return;
    
    this.state.isPlaying = true;
    this.state.gameOver = false;
    this.state.isPaused = false;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  public pause() {
    this.state.isPaused = !this.state.isPaused;
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.state.isPlaying = false;
    this.state.gameOver = true;
    this.onGameOver?.(this.state.score);
  }

  public restart() {
    this.stop();
    this.reset();
    this.start();
  }

  private gameLoop(currentTime: number) {
    if (!this.state.isPlaying) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (!this.state.isPaused && !this.state.gameOver) {
      this.update(deltaTime);
      this.render();
    }

    this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  protected updateScore(newScore: number) {
    this.state.score = newScore;
    this.onScoreUpdate?.(newScore);
  }

  public setCallbacks(onScoreUpdate?: (score: number) => void, onGameOver?: (score: number) => void) {
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public destroy() {
    this.stop();
  }
}

export function createGame<T extends GameEngine>(
  GameClass: new (canvas: HTMLCanvasElement, config: GameConfig) => T,
  canvas: HTMLCanvasElement,
  config: GameConfig
): T {
  return new GameClass(canvas, config);
}
