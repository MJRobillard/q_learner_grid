import { QLearningEnvironment } from './qLearning';
import { SARSAEnvironment } from './sarsa';
import { QLearningConfig, Position, Action, CellType, StepResult, EpisodeResult, Cell } from './qLearning';

export type LearningMethod = 'qlearning' | 'sarsa';

export interface RLEnvironment {
  // Core methods that all algorithms must implement
  step(): StepResult | null;
  runEpisode(): EpisodeResult;
  reset(): void;
  resetPosition(): void;
  getGrid(): Cell[][] | CellType[][];
  getCurrentPosition(): Position;
  getConfig(): QLearningConfig;
  updateConfig(newConfig: Partial<QLearningConfig>): void;
  getPolicy(): Record<string, Action>;
  getQValuesForPosition(pos: Position): Record<Action, number>;
  getMinQValue(): number;
  getMaxQValue(): number;
  getAverageQValue(): number;
}

export class RLAlgorithmFactory {
  static createEnvironment(method: LearningMethod, config: QLearningConfig): RLEnvironment {
    switch (method) {
      case 'qlearning':
        return new QLearningEnvironment(config);
      case 'sarsa':
        return new SARSAEnvironment(config);
      default:
        throw new Error(`Unknown learning method: ${method}`);
    }
  }
}

// Extended config to include learning method
export interface ExtendedQLearningConfig extends QLearningConfig {
  learningMethod: LearningMethod;
}

// Algorithm comparison utilities
export interface AlgorithmComparison {
  method: LearningMethod;
  episodeCount: number;
  totalReward: number;
  averageSteps: number;
  successRate: number;
  convergenceRate: number;
  finalQValueStats: {
    min: number;
    max: number;
    mean: number;
    std: number;
  };
}

export class AlgorithmComparator {
  static async compareAlgorithms(
    config: QLearningConfig,
    methods: LearningMethod[],
    episodes: number = 100
  ): Promise<AlgorithmComparison[]> {
    const results: AlgorithmComparison[] = [];

    for (const method of methods) {
      const env = RLAlgorithmFactory.createEnvironment(method, config);
      const episodeResults: EpisodeResult[] = [];

      // Run training episodes
      for (let i = 0; i < episodes; i++) {
        const result = env.runEpisode();
        episodeResults.push(result);
      }

      // Calculate statistics
      const successfulEpisodes = episodeResults.filter(r => r.reachedGoal);
      const successRate = successfulEpisodes.length / episodes;
      const averageSteps = episodeResults.reduce((sum, r) => sum + r.steps, 0) / episodes;
      const totalReward = episodeResults.reduce((sum, r) => sum + r.totalReward, 0);

      // Calculate convergence rate (how quickly Q-values stabilize)
      const qValueChanges = episodeResults.map(r => r.averageQChange);
      const convergenceRate = this.calculateConvergenceRate(qValueChanges);

      // Final Q-value statistics
      const allQValues: number[] = [];
      for (let row = 0; row < config.gridSize; row++) {
        for (let col = 0; col < config.gridSize; col++) {
          const pos = { row, col };
          const qValues = env.getQValuesForPosition(pos);
          Object.values(qValues).forEach(q => allQValues.push(q));
        }
      }

      const finalQValueStats = this.calculateQValueStats(allQValues);

      results.push({
        method,
        episodeCount: episodes,
        totalReward,
        averageSteps,
        successRate,
        convergenceRate,
        finalQValueStats
      });
    }

    return results;
  }

  private static calculateConvergenceRate(qValueChanges: number[]): number {
    if (qValueChanges.length < 10) return 0;
    
    // Calculate the rate at which Q-value changes decrease
    const recentChanges = qValueChanges.slice(-10);
    const earlyChanges = qValueChanges.slice(0, 10);
    
    const recentAvg = recentChanges.reduce((sum, change) => sum + Math.abs(change), 0) / recentChanges.length;
    const earlyAvg = earlyChanges.reduce((sum, change) => sum + Math.abs(change), 0) / earlyChanges.length;
    
    return earlyAvg > 0 ? (earlyAvg - recentAvg) / earlyAvg : 0;
  }

  private static calculateQValueStats(qValues: number[]): AlgorithmComparison['finalQValueStats'] {
    const mean = qValues.reduce((sum, q) => sum + q, 0) / qValues.length;
    const variance = qValues.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / qValues.length;
    const std = Math.sqrt(variance);
    
    return {
      min: Math.min(...qValues),
      max: Math.max(...qValues),
      mean,
      std
    };
  }
}

// Educational content for each algorithm
export const algorithmInfo: Record<LearningMethod, {
  name: string;
  description: string;
  formula: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
}> = {
  qlearning: {
    name: 'Q-Learning',
    description: 'An off-policy temporal difference learning algorithm that learns the optimal action-value function.',
    formula: 'Q(s,a) ← Q(s,a) + α[r + γ max Q(s\',a\') - Q(s,a)]',
    pros: [
      'Off-policy: can learn optimal policy while following exploratory policy',
      'Converges to optimal Q-values under certain conditions',
      'Simple to implement and understand',
      'Works well with discrete state-action spaces'
    ],
    cons: [
      'Can overestimate Q-values due to max operator',
      'May converge slowly in some environments',
      'Requires sufficient exploration to find optimal policy'
    ],
    bestFor: [
      'Discrete state-action spaces',
      'When optimal policy is desired',
      'Environments with clear reward structure'
    ]
  },
  sarsa: {
    name: 'SARSA',
    description: 'An on-policy temporal difference learning algorithm that learns the action-value function for the current policy.',
    formula: 'Q(s,a) ← Q(s,a) + α[r + γ Q(s\',a\') - Q(s,a)]',
    pros: [
      'On-policy: learns the value of the policy being followed',
      'Generally more conservative around hazards',
      'Can be more stable in some environments',
      'Natural exploration-exploitation balance'
    ],
    cons: [
      'May not converge to optimal policy',
      'Performance depends on exploration policy',
      'Can be slower to converge than Q-learning'
    ],
    bestFor: [
      'When safety is important',
      'Environments with hazards or penalties',
      'When following a specific policy is desired'
    ]
  }
}; 