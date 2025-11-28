import { ApiProperty } from '@nestjs/swagger';

export class ImpactStatsDto {
  @ApiProperty({ description: 'Total de órdenes pagadas', example: 12 })
  totalOrders: number;

  @ApiProperty({ description: 'Kg de CO2 evitados/compensados', example: 45.5 })
  co2SavedKg: number;

  @ApiProperty({ description: 'Equivalencia en árboles plantados', example: 2 })
  treesEquivalent: number;

  @ApiProperty({
    description: 'Nivel de sostenibilidad del usuario',
    example: '🌱 Brote Consciente',
  })
  ecoLevel: string;

  @ApiProperty({
    description: 'Siguiente meta para subir de nivel',
    example: 50,
  })
  nextLevelGoal: number;
}
