export interface WalkSession {
  id: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  steps: number;
  distanceKm: number;
  caloriesKcal: number;
  avgCadence: number;
  paceMinPerKm: number;
}

export interface UserFitnessProfile {
  weightKg: number;
  heightCm: number;
  strideLengthMeters: number;
  dailyStepGoal: number;
  dailyCalorieGoal: number;
}
