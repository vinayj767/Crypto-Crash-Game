const crypto = require('crypto');

class ProvablyFairService {
  constructor() {
    this.maxCrashMultiplier = 100; // Maximum crash point (100x)
    this.houseEdge = 0.01; // 1% house edge
  }

  // Generate cryptographically secure seed
  generateSeed() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate hash from seed and round number
  generateHash(seed, roundNumber) {
    const input = `${seed}:${roundNumber}`;
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  // Generate crash point using provably fair algorithm
  generateCrashPoint(seed, roundNumber) {
    const hash = this.generateHash(seed, roundNumber);
    
    // Convert first 8 characters of hash to integer
    const hashInt = parseInt(hash.substring(0, 8), 16);
    
    // Generate random number between 0 and 1
    const randomFloat = hashInt / 0xFFFFFFFF;
    
    // Apply house edge and generate crash point
    // Using inverse exponential distribution for realistic crash points
    const adjustedRandom = randomFloat * (1 - this.houseEdge);
    
    if (adjustedRandom === 0) {
      return 1.0; // Instant crash
    }
    
    // Generate crash point using logarithmic distribution
    // This creates more frequent low multipliers and rare high multipliers
    const crashPoint = Math.max(1.0, -Math.log(1 - adjustedRandom) / Math.log(0.99));
    
    // Cap at maximum multiplier
    return Math.min(crashPoint, this.maxCrashMultiplier);
  }

  // Verify crash point is fair
  verifyCrashPoint(seed, roundNumber, claimedCrashPoint) {
    const actualCrashPoint = this.generateCrashPoint(seed, roundNumber);
    return Math.abs(actualCrashPoint - claimedCrashPoint) < 0.01; // Allow small floating point differences
  }

  // Generate round data with provably fair crash point
  generateRoundData(roundNumber, customSeed = null) {
    const seed = customSeed || this.generateSeed();
    const hash = this.generateHash(seed, roundNumber);
    const crashPoint = this.generateCrashPoint(seed, roundNumber);

    return {
      roundNumber,
      seed,
      hash,
      crashPoint: parseFloat(crashPoint.toFixed(2)),
      timestamp: Date.now()
    };
  }

  // Calculate multiplier at given time (for real-time display)
  calculateMultiplier(startTime, currentTime, growthFactor = 0.00006) {
    const timeElapsed = Math.max(0, currentTime - startTime);
    
    // Exponential growth formula: multiplier = 1 + (time_elapsed * growth_factor)^1.5
    const multiplier = 1 + Math.pow(timeElapsed * growthFactor, 1.5);
    
    return parseFloat(multiplier.toFixed(2));
  }

  // Calculate time to reach specific multiplier
  calculateTimeToMultiplier(multiplier, growthFactor = 0.00006) {
    if (multiplier <= 1) return 0;
    
    // Inverse of the multiplier formula
    const timeElapsed = Math.pow((multiplier - 1) / growthFactor, 1/1.5);
    
    return Math.round(timeElapsed);
  }

  // Get crash statistics (for transparency)
  getCrashStatistics(crashPoints) {
    if (!crashPoints || crashPoints.length === 0) {
      return null;
    }

    const sorted = [...crashPoints].sort((a, b) => a - b);
    const total = crashPoints.length;

    return {
      total,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      average: parseFloat((crashPoints.reduce((sum, point) => sum + point, 0) / total).toFixed(2)),
      median: total % 2 === 0 
        ? (sorted[total/2 - 1] + sorted[total/2]) / 2 
        : sorted[Math.floor(total/2)],
      under2x: crashPoints.filter(p => p < 2).length / total * 100,
      under5x: crashPoints.filter(p => p < 5).length / total * 100,
      over10x: crashPoints.filter(p => p >= 10).length / total * 100,
      over50x: crashPoints.filter(p => p >= 50).length / total * 100
    };
  }

  // Validate that a multiplier is possible at given time
  isValidCashout(startTime, cashoutTime, multiplier, crashPoint) {
    if (multiplier >= crashPoint) {
      return false; // Can't cash out after crash
    }

    const expectedMultiplier = this.calculateMultiplier(startTime, cashoutTime);
    
    // Allow small tolerance for network delays
    return multiplier <= expectedMultiplier + 0.1 && multiplier >= 1.0;
  }

  // Generate proof data for client verification
  generateProof(seed, roundNumber, crashPoint) {
    const hash = this.generateHash(seed, roundNumber);
    
    return {
      seed,
      roundNumber,
      hash,
      crashPoint,
      algorithm: 'SHA256',
      formula: 'crash_point = max(1.0, -log(1 - (hash_int / 0xFFFFFFFF) * 0.99) / log(0.99))',
      maxMultiplier: this.maxCrashMultiplier,
      houseEdge: this.houseEdge,
      timestamp: Date.now()
    };
  }
}

// Export singleton instance
module.exports = new ProvablyFairService();
