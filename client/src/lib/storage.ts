interface GameScore {
  gameSlug: string;
  score: number;
  playerName?: string;
  timestamp: number;
  gameData?: any;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  playerName?: string;
}

class LocalStorage {
  private readonly SCORES_KEY = 'taptime-scores';
  private readonly PREFERENCES_KEY = 'taptime-preferences';

  // Score management
  saveScore(score: GameScore): void {
    const scores = this.getScores();
    scores.push(score);
    
    // Keep only top 100 scores per game
    const gameScores = scores.filter(s => s.gameSlug === score.gameSlug);
    const otherScores = scores.filter(s => s.gameSlug !== score.gameSlug);
    
    const topGameScores = gameScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);
    
    const finalScores = [...otherScores, ...topGameScores];
    localStorage.setItem(this.SCORES_KEY, JSON.stringify(finalScores));
  }

  getScores(gameSlug?: string): GameScore[] {
    try {
      const scores = JSON.parse(localStorage.getItem(this.SCORES_KEY) || '[]');
      if (gameSlug) {
        return scores.filter((score: GameScore) => score.gameSlug === gameSlug);
      }
      return scores;
    } catch {
      return [];
    }
  }

  getTopScores(gameSlug: string, limit: number = 10): GameScore[] {
    return this.getScores(gameSlug)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  getBestScore(gameSlug: string): number {
    const scores = this.getTopScores(gameSlug, 1);
    return scores.length > 0 ? scores[0].score : 0;
  }

  // User preferences
  savePreferences(preferences: Partial<UserPreferences>): void {
    const current = this.getPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(updated));
  }

  getPreferences(): UserPreferences {
    try {
      const preferences = localStorage.getItem(this.PREFERENCES_KEY);
      return preferences ? JSON.parse(preferences) : {
        theme: 'system',
        soundEnabled: true
      };
    } catch {
      return {
        theme: 'system',
        soundEnabled: true
      };
    }
  }

  // Statistics
  getGameStats(gameSlug: string) {
    const scores = this.getScores(gameSlug);
    if (scores.length === 0) {
      return {
        gamesPlayed: 0,
        bestScore: 0,
        averageScore: 0,
        totalScore: 0
      };
    }

    const totalScore = scores.reduce((sum, score) => sum + score.score, 0);
    const bestScore = Math.max(...scores.map(s => s.score));
    const averageScore = Math.round(totalScore / scores.length);

    return {
      gamesPlayed: scores.length,
      bestScore,
      averageScore,
      totalScore
    };
  }

  getAllStats() {
    const allScores = this.getScores();
    const gameStats = new Map<string, ReturnType<typeof this.getGameStats>>();
    
    // Group by game
    const gameGroups = allScores.reduce((groups, score) => {
      if (!groups[score.gameSlug]) {
        groups[score.gameSlug] = [];
      }
      groups[score.gameSlug].push(score);
      return groups;
    }, {} as Record<string, GameScore[]>);

    // Calculate stats for each game
    Object.entries(gameGroups).forEach(([gameSlug, scores]) => {
      const totalScore = scores.reduce((sum, score) => sum + score.score, 0);
      const bestScore = Math.max(...scores.map(s => s.score));
      const averageScore = Math.round(totalScore / scores.length);

      gameStats.set(gameSlug, {
        gamesPlayed: scores.length,
        bestScore,
        averageScore,
        totalScore
      });
    });

    return {
      totalGamesPlayed: allScores.length,
      gamesStats: Object.fromEntries(gameStats)
    };
  }

  // Clear data
  clearScores(gameSlug?: string): void {
    if (gameSlug) {
      const scores = this.getScores().filter(s => s.gameSlug !== gameSlug);
      localStorage.setItem(this.SCORES_KEY, JSON.stringify(scores));
    } else {
      localStorage.removeItem(this.SCORES_KEY);
    }
  }

  clearAll(): void {
    localStorage.removeItem(this.SCORES_KEY);
    localStorage.removeItem(this.PREFERENCES_KEY);
  }
}

export const gameStorage = new LocalStorage();
export type { GameScore, UserPreferences };
