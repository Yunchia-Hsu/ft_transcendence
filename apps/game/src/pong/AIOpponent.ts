// AIOpponent.ts - Advanced AI system for Pong game
// Updated AI system that works with your engine structure

interface AIDecision {
  direction: -1 | 0 | 1;
  usePowerUp: boolean;
  confidence: number;
}

class PongAI {
  private lastUpdateTime: number = 0;
  private updateInterval: number = 1000; // 1 second constraint
  private currentDecision: AIDecision = { direction: 0, usePowerUp: false, confidence: 0 };
  private predictedY: number = 0.5;
  private difficulty: number = 0.8;
  private strategyMode: string = 'adaptive';
  private reactionBuffer: (-1 | 0 | 1)[] = [];
  private lastReactionTime: number = 0;

  constructor(difficulty: number = 0.8) {
    this.setDifficulty(difficulty);
  }

  update(gameState: State, currentTime: number): AIDecision {
    // Only analyze game state once per second (project requirement)
    if (currentTime - this.lastUpdateTime >= this.updateInterval) {
      this.analyzeGameState(gameState);
      this.lastUpdateTime = currentTime;
    }

    // Process reaction buffer to simulate human-like keyboard input
    this.processReactionBuffer(currentTime);
    
    return this.currentDecision;
  }

  private analyzeGameState(gameState: State): void {
    const ball = gameState.ball;
    const velocity = gameState.vel;
    const myPaddleY = gameState.paddles[1];
    const opponentPaddleY = gameState.paddles[0];
    
    // Predict ball trajectory with physics simulation
    const prediction = this.predictBallTrajectory(ball, velocity);
    this.predictedY = prediction.impactY;
    
    // Calculate strategic movement
    const strategicMove = this.calculateMove(myPaddleY, prediction, gameState);
    
    // Add human-like behavior and delays
    this.addToReactionBuffer(strategicMove.direction);
    
    // Evaluate power-up usage
    const shouldUsePowerUp = this.evaluatePowerUp(gameState, prediction);
    
    // Update internal decision (will be applied with delay)
    this.currentDecision = {
      direction: 0, // Will be set by reaction buffer
      usePowerUp: shouldUsePowerUp,
      confidence: strategicMove.confidence
    };
  }

  private predictBallTrajectory(ball: Vec, velocity: Vec): {
    impactY: number;
    timeToImpact: number;
    confidence: number;
  } {
    // Only predict if ball is moving towards AI paddle (right side)
    if (velocity.x <= 0) {
      return { impactY: 0.5, timeToImpact: Infinity, confidence: 0.1 };
    }

    let simX = ball.x;
    let simY = ball.y;
    let simVx = velocity.x;
    let simVy = velocity.y;
    
    const paddleX = 0.97; // AI paddle X position
    let bounceCount = 0;
    let confidence = this.difficulty;
    
    // Simulate physics until ball reaches paddle
    while (simX < paddleX && bounceCount < 3) {
      const timeToReachPaddle = (paddleX - simX) / simVx;
      const potentialY = simY + (simVy * timeToReachPaddle);
      
      // Check for wall bounces (top/bottom)
      if (potentialY < 0 || potentialY > 1) {
        // Calculate time to wall collision
        const timeToWall = potentialY < 0 
          ? -simY / simVy 
          : (1 - simY) / simVy;
        
        // Update position to wall collision point
        simX += simVx * timeToWall;
        simY = potentialY < 0 ? 0 : 1;
        simVy = -simVy; // Ball bounces
        
        bounceCount++;
        confidence *= 0.8; // Reduce confidence with each bounce
      } else {
        // No wall collision, ball will reach paddle
        return {
          impactY: Math.max(0.1, Math.min(0.9, potentialY)),
          timeToImpact: timeToReachPaddle,
          confidence
        };
      }
    }
    
    // Fallback if too many bounces
    return { impactY: 0.5, timeToImpact: Infinity, confidence: 0.2 };
  }

  private calculateMove(myPaddleY: number, prediction: any, gameState: State): {
    direction: -1 | 0 | 1;
    confidence: number;
  } {
    let targetY = prediction.impactY;
    
    // Adjust strategy based on game situation
    const scoreDiff = gameState.score[1] - gameState.score[0];
    
    if (scoreDiff < 0) {
      // Behind in score - be more aggressive
      this.strategyMode = 'aggressive';
      // Try to hit ball at angles
      targetY += (Math.random() - 0.5) * 0.1;
    } else if (scoreDiff > 2) {
      // Ahead by a lot - be more defensive
      this.strategyMode = 'defensive';
      targetY = targetY * 0.8 + 0.5 * 0.2; // Blend towards center
    } else {
      this.strategyMode = 'adaptive';
    }
    
    // Calculate movement direction
    const diff = targetY - myPaddleY;
    const deadzone = 0.03 + ((1 - this.difficulty) * 0.02);
    
    let direction: -1 | 0 | 1 = 0;
    if (diff > deadzone) {
      direction = 1; // Move down
    } else if (diff < -deadzone) {
      direction = -1; // Move up
    }
    
    // Add human-like errors
    const errorRate = (1 - this.difficulty) * 0.15;
    if (Math.random() < errorRate) {
      // Occasionally make wrong moves
      direction = Math.random() < 0.5 ? -1 : 1;
    }
    
    // Calculate confidence
    const confidence = prediction.confidence * (1 - Math.abs(diff) * 2);
    
    return { direction, confidence: Math.max(0, Math.min(1, confidence)) };
  }

  private addToReactionBuffer(direction: -1 | 0 | 1): void {
    // Simulate human reaction time delay
    const reactionDelay = 100 + ((1 - this.difficulty) * 200); // 100-300ms delay
    
    setTimeout(() => {
      this.reactionBuffer.push(direction);
    }, reactionDelay);
  }

  private processReactionBuffer(currentTime: number): void {
    // Process buffered reactions at ~60fps rate (simulating keyboard polling)
    if (this.reactionBuffer.length > 0 && 
        currentTime - this.lastReactionTime > 16) {
      
      const movement = this.reactionBuffer.shift()!;
      this.currentDecision.direction = movement;
      this.lastReactionTime = currentTime;
      
      // Simulate key hold duration
      if (movement !== 0) {
        const holdTime = 50 + Math.random() * 100; // 50-150ms hold
        setTimeout(() => {
          if (this.reactionBuffer.length === 0) {
            this.currentDecision.direction = 0;
          }
        }, holdTime);
      }
    }
  }

  private evaluatePowerUp(gameState: State, prediction: any): boolean {
    // Power-up strategy based on game situation
    const scoreDiff = gameState.score[1] - gameState.score[0];
    const ballSpeed = Math.sqrt(gameState.vel.x ** 2 + gameState.vel.y ** 2);
    
    // Use power-ups more when losing or in difficult situations
    let useProbability = 0.05; // Base 5% chance
    
    if (scoreDiff < 0) {
      useProbability += 0.1; // Higher when losing
    }
    
    if (prediction.confidence < 0.3) {
      useProbability += 0.15; // Higher when uncertain
    }
    
    if (ballSpeed > 0.6) {
      useProbability += 0.1; // Higher when ball is fast
    }
    
    return Math.random() < useProbability;
  }

  setDifficulty(difficulty: number): void {
    this.difficulty = Math.max(0.1, Math.min(1, difficulty));
    // Easier AI updates less frequently
    this.updateInterval = 1000 + ((1 - this.difficulty) * 500);
  }

  getDebugInfo(): any {
    return {
      predictedY: this.predictedY,
      strategyMode: this.strategyMode,
      confidence: this.currentDecision.confidence,
      difficulty: this.difficulty,
      reactionBufferLength: this.reactionBuffer.length
    };
  }

  reset(): void {
    this.lastUpdateTime = 0;
    this.currentDecision = { direction: 0, usePowerUp: false, confidence: 0 };
    this.reactionBuffer = [];
    this.lastReactionTime = 0;
  }
}

// Replace your aiDirection function with this:
function AIDecision(gameState: State, aiInstance: PongAI, currentTime: number): -1 | 0 | 1 {
  const decision = aiInstance.update(gameState, currentTime);
  return decision.direction;
}