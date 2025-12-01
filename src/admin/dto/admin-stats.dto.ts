import { ApiProperty } from '@nestjs/swagger';

export class AdminStatsDto {
  @ApiProperty({
    description: 'Ingresos totales históricos de la plataforma',
    example: 150000.5,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Cantidad total de órdenes procesadas y pagadas',
    example: 120,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Total de CO2 compensado por la comunidad (kg)',
    example: 500.25,
  })
  totalCo2Saved: number;

  @ApiProperty({
    description: 'Cantidad de usuarios registrados',
    example: 350,
  })
  totalUsers: number;
}
