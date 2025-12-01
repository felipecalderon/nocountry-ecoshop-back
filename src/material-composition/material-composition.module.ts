import { Module } from '@nestjs/common';
import { MaterialCompositionService } from './material-composition.service';
import { MaterialCompositionController } from './material-composition.controller';

@Module({
  controllers: [MaterialCompositionController],
  providers: [MaterialCompositionService],
})
export class MaterialCompositionModule {}
