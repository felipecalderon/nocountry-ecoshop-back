import { Module } from '@nestjs/common';
import { MaterialCompositionService } from './material-composition.service';
import { MaterialCompositionController } from './material-composition.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialComposition } from './entities/material-composition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MaterialComposition])],
  controllers: [MaterialCompositionController],
  providers: [MaterialCompositionService],
  exports: [MaterialCompositionService],
})
export class MaterialCompositionModule {}
