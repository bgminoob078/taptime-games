import { type User, type InsertUser, type Game, type InsertGame, type Score, type InsertScore, type Challenge, type InsertChallenge } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getGames(): Promise<Game[]>;
  getGame(id: string): Promise<Game | undefined>;
  getGameBySlug(slug: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  
  getScores(gameId?: string, limit?: number): Promise<Score[]>;
  createScore(score: InsertScore): Promise<Score>;
  getTopScores(gameId: string, limit: number): Promise<Score[]>;
  
  getChallenges(): Promise<Challenge[]>;
  getActiveChallenge(gameId: string): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private games: Map<string, Game>;
  private scores: Map<string, Score>;
  private challenges: Map<string, Challenge>;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.scores = new Map();
    this.challenges = new Map();
    
    // Initialize with default games
    this.initializeGames();
    this.initializeChallenges();
  }

  private initializeGames() {
    const defaultGames: InsertGame[] = [
      {
        name: "Bottle Flip 2D",
        slug: "bottle-flip-2d",
        description: "Perfect your timing! Flip the bottle and land it upright. Looks easy? Think again!",
        category: "Timing",
        size: "2.1MB",
        thumbnail: "/games/bottle-flip.jpg",
        isActive: 1
      },
      {
        name: "Color Trap",
        slug: "color-trap", 
        description: "Match the colors as fast as you can! Wrong move = game over. Test your reflexes!",
        category: "Reaction",
        size: "1.8MB",
        thumbnail: "/games/color-trap.jpg",
        isActive: 1
      },
      {
        name: "Traffic Tapper",
        slug: "traffic-tapper",
        description: "Control traffic flow with perfect timing. One crash and it's over!",
        category: "Strategy", 
        size: "3.2MB",
        thumbnail: "/games/traffic-tapper.jpg",
        isActive: 1
      },
      {
        name: "Paper Plane Flight",
        slug: "paper-plane-flight",
        description: "Guide your paper plane through endless obstacles. How far can you fly?",
        category: "Endless",
        size: "2.7MB", 
        thumbnail: "/games/paper-plane.jpg",
        isActive: 1
      },
      {
        name: "Tap Snake",
        slug: "tap-snake",
        description: "Classic snake with a twist - just tap to turn! Simple but addictive.",
        category: "Classic",
        size: "1.5MB",
        thumbnail: "/games/tap-snake.jpg", 
        isActive: 1
      },
      {
        name: "Doodle Stack",
        slug: "doodle-stack",
        description: "Stack random doodles as high as possible without letting them fall!",
        category: "Balance",
        size: "2.9MB",
        thumbnail: "/games/doodle-stack.jpg",
        isActive: 1
      }
    ];

    defaultGames.forEach(game => {
      const id = randomUUID();
      const fullGame: Game = {
        ...game,
        id,
        createdAt: new Date()
      };
      this.games.set(id, fullGame);
    });
  }

  private initializeChallenges() {
    const games = Array.from(this.games.values());
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    const defaultChallenges: InsertChallenge[] = [
      {
        gameId: games.find(g => g.slug === 'bottle-flip-2d')?.id || '',
        title: "Bottle Flip Master",
        description: "Land 10 consecutive flips",
        target: 10,
        reward: 500,
        startDate: today,
        endDate: tomorrow,
        isActive: 1
      },
      {
        gameId: games.find(g => g.slug === 'color-trap')?.id || '',
        title: "Speed Demon", 
        description: "Complete Color Trap in under 30 seconds",
        target: 30,
        reward: 750,
        startDate: tomorrow,
        endDate: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
        isActive: 1
      },
      {
        gameId: games.find(g => g.slug === 'traffic-tapper')?.id || '',
        title: "Traffic Master",
        description: "Guide 100 vehicles without a crash", 
        target: 100,
        reward: 1000,
        startDate: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
        endDate: new Date(tomorrow.getTime() + 48 * 60 * 60 * 1000),
        isActive: 1
      }
    ];

    defaultChallenges.forEach(challenge => {
      const id = randomUUID();
      const fullChallenge: Challenge = {
        ...challenge,
        id
      };
      this.challenges.set(id, fullChallenge);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.isActive === 1);
  }

  async getGame(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGameBySlug(slug: string): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(game => game.slug === slug);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = randomUUID();
    const game: Game = { 
      ...insertGame, 
      id, 
      createdAt: new Date() 
    };
    this.games.set(id, game);
    return game;
  }

  async getScores(gameId?: string, limit: number = 100): Promise<Score[]> {
    let scores = Array.from(this.scores.values());
    
    if (gameId) {
      scores = scores.filter(score => score.gameId === gameId);
    }
    
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async createScore(insertScore: InsertScore): Promise<Score> {
    const id = randomUUID();
    const score: Score = { 
      ...insertScore, 
      id, 
      createdAt: new Date() 
    };
    this.scores.set(id, score);
    return score;
  }

  async getTopScores(gameId: string, limit: number): Promise<Score[]> {
    return this.getScores(gameId, limit);
  }

  async getChallenges(): Promise<Challenge[]> {
    return Array.from(this.challenges.values()).filter(challenge => challenge.isActive === 1);
  }

  async getActiveChallenge(gameId: string): Promise<Challenge | undefined> {
    const now = new Date();
    return Array.from(this.challenges.values()).find(
      challenge => 
        challenge.gameId === gameId && 
        challenge.isActive === 1 &&
        challenge.startDate <= now &&
        challenge.endDate >= now
    );
  }

  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const id = randomUUID();
    const challenge: Challenge = { ...insertChallenge, id };
    this.challenges.set(id, challenge);
    return challenge;
  }
}

export const storage = new MemStorage();
