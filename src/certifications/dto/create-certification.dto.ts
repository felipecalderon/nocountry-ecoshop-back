import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateCertificationDto {
  @ApiProperty({ description: 'Nombre del sello', example: 'Cruelty Free' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Explicación del impacto',
    example: 'Producto no testeado en animales.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'URL de la imagen (badge) subida previamente',
    example: 'https://res.cloudinary.com/.../badge.png',
  })
  @IsUrl()
  @IsNotEmpty()
  badgeUrl?: string;
}
