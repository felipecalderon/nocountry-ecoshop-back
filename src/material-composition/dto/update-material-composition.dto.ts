import { PartialType } from '@nestjs/swagger';
import { CreateMaterialCompositionDto } from './material-composition.dto';

export class UpdateMaterialCompositionDto extends PartialType(
  CreateMaterialCompositionDto,
) {}
