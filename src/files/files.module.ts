import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryProvider } from './files.provider';

@Module({
  imports: [ConfigModule],
  providers: [CloudinaryProvider, FilesService],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {}
