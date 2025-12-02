import { Injectable } from '@nestjs/common';

@Injectable()
export class PointsCalculatorService {
  private readonly POINTS_PER_DOLLAR = 1;
  private readonly POINTS_PER_KG_CO2 = 20;

  calculatePoints(
    orderTotal: number,
    co2SavedKg: number,
    userLevel: string = 'Semilla',
  ): { totalPoints: number; breakdown: any } {
    const pointsFromRevenue = Math.floor(orderTotal * this.POINTS_PER_DOLLAR);

    const pointsFromImpact = Math.floor(co2SavedKg * this.POINTS_PER_KG_CO2);

    const multiplier = this.getLevelMultiplier(userLevel);

    const basePoints = pointsFromRevenue + pointsFromImpact;
    const finalPoints = Math.floor(basePoints * multiplier);

    return {
      totalPoints: finalPoints,
      breakdown: {
        pointsFromRevenue,
        pointsFromImpact,
        multiplier,
        basePoints,
        appliedLevel: userLevel,
      },
    };
  }

  private getLevelMultiplier(level: string): number {
    switch (level?.toUpperCase()) {
      case 'BROTE CONSCIENTE':
        return 1.1;
      case 'GUARDIÁN DEL BOSQUE':
        return 1.25;
      case 'HÉROE CLIMÁTICO':
        return 1.5;
      case 'SEMILLA':
      default:
        return 1.0;
    }
  }
}
