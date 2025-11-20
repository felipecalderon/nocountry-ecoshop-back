import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

export class BrandOwnerResponseDto {
  @ApiProperty({
    description: 'Email del propietario',
    example: 'owner@example.com',
  })
  @Expose()
  email: string;

  @ApiPropertyOptional({
    description: 'Nombre completo del propietario',
    example: 'Juan Cruz',
  })
  @Expose()
  fullName?: string;
}

export class BrandResponseDto {
  @ApiProperty({
    description: 'Nombre de la marca',
    example: 'Patagonia',
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción de la marca',
    example: 'Marca lider en ropa outdoor sostenible',
  })
  @Expose()
  description: string;

  @ApiPropertyOptional({
    description: 'Informacion del propietario',
    type: BrandOwnerResponseDto,
  })
  @Expose()
  @Type(() => BrandOwnerResponseDto)
  owner?: BrandOwnerResponseDto;

  // campos sensibles de la entity
  @Exclude()
  deletedAt: Date;

  @Exclude()
  products: any;
}

// response DTO (sin relaciones)
export class BrandSimpleResponseDto {
  @ApiProperty({
    description: 'Nombre de la marca',
    example: 'Patagonia',
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Descripcion de la marca',
    example: 'Marca líder en ropa outdoor sostenible',
  })
  @Expose()
  description: string;

  @Exclude()
  deletedAt: Date;

  @Exclude()
  owner: any; // relacion no incluida

  @Exclude()
  products: any; // relacion no incluida
}
