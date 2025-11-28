import { ApiProperty } from '@nestjs/swagger';

export class BrandStatsDto {
  @ApiProperty({
    description:
      'Ingresos totales generados por los productos de la marca (Suma de precios al momento de compra)',
    example: 15400.5,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Cantidad total de unidades de productos vendidas',
    example: 340,
  })
  totalUnitsSold: number;

  @ApiProperty({
    description:
      'Cantidad de órdenes únicas que contienen al menos un producto de la marca',
    example: 45,
  })
  totalOrders: number;
}
