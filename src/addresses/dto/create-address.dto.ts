import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AddressType } from '../entities/address.entity';

export class CreateAddressDto {
  @ApiProperty({
    description: 'Calle y número',
    example: 'Av. Corrientes 1234',
  })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiPropertyOptional({ description: 'Ciudad', example: 'Buenos Aires' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Código Postal', example: 'C1043' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ description: 'País', example: 'Argentina' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiPropertyOptional({ enum: AddressType, default: AddressType.SHIPPING })
  @IsOptional()
  @IsEnum(AddressType)
  addressType?: AddressType;
}
