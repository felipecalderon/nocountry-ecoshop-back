import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class OrderItemDto {
  @ApiProperty({ description: 'ID del producto', example: 'uuid-product' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Cantidad a comprar', example: 2 })
  @IsInt()
  @IsPositive()
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'ID de la dirección de envío',
    example: 'uuid-address',
  })
  @IsUUID()
  @IsNotEmpty()
  addressId: string;

  @ApiProperty({ description: 'Lista de productos', type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
