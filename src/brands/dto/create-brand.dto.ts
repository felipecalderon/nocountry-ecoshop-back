import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({
    description: 'Nombre de la marca (unico)',
    example: 'Patagonia',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descripcion de la marca',
    example:
      'Marca lider en ropa outdoor sostenible y comprometida con el medio ambiente',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'La descripcion no puede exceder 2000 caracteres',
  })
  description?: string;
}
