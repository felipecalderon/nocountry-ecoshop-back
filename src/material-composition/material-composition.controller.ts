import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MaterialCompositionService } from './material-composition.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateMaterialCompositionDto } from './dto/material-composition.dto';
import { UpdateMaterialCompositionDto } from './dto/update-material-composition.dto';

@Controller('material-composition')
export class MaterialCompositionController {
  constructor(
    private readonly materialCompositionService: MaterialCompositionService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BRAND_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo material base' })
  createMaterialComposition(@Body() createDto: CreateMaterialCompositionDto) {
    return this.materialCompositionService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los materiales' })
  findAll() {
    return this.materialCompositionService.findAll();
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Obtener un material por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.materialCompositionService.findOne(id);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar material' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateMaterialCompositionDto,
  ) {
    return this.materialCompositionService.update(id, updateDto);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar material' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.materialCompositionService.remove(id);
  }
}
