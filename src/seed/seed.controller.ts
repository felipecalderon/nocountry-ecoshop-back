import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeedService } from './seed.service';

@ApiTags('Seed (Carga de Datos)')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get('execute')
  @ApiOperation({
    summary: 'Ejecuta la carga inicial de datos (SOLO DESARROLLO)',
  })
  async executeSeed() {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException(
        'El seeding no está permitido en producción',
      );
    }

    return this.seedService.runSeed();
  }
}
