import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandsService } from 'src/brands/brands.service';
import { MaterialCompositionService } from 'src/material-composition/material-composition.service';
import { Product, RecyclabilityStatus } from '../entities/product.entity';
import {
  EcoBadgeLevel,
  EnvironmentalImpact,
} from '../entities/environmental-impact.entity';
import { MaterialProduct } from '../entities/material-product.entity';
import { MaterialProductDto } from '../dto/material-product.dto';
import { User, UserRole } from 'src/users/entities/user.entity';

@Injectable()
export class ProductsHelper {
  private readonly logger = new Logger(ProductsHelper.name);

  constructor(
    @InjectRepository(EnvironmentalImpact)
    private readonly environmentalImpactRepository: Repository<EnvironmentalImpact>,
    @InjectRepository(MaterialProduct)
    private readonly materialProductRepository: Repository<MaterialProduct>,
    private readonly brandsService: BrandsService,
    private readonly materialCompositionService: MaterialCompositionService,
  ) {}

  validateMaterialPercentageSum(materials: MaterialProductDto[]): void {
    if (!materials || !Array.isArray(materials)) {
      console.log(materials);
      throw new BadRequestException(
        'La lista de materiales (materials) es obligatoria y debe ser un array válido.',
      );
    }
    const total = materials.reduce((sum, mat) => sum + mat.percentage, 0);
    if (total > 100) {
      throw new BadRequestException(
        'La suma de los porcentajes de materiales no debe ser mayor al 100%',
      );
    }
  }

  async validateProductOwnership(product: Product, user: User): Promise<void> {
    if (user.role.includes(UserRole.ADMIN)) {
      return;
    }
    const userBrand = await this.brandsService.findOneByOwnerId(user.id);

    if (!userBrand) {
      throw new BadRequestException('El usuario no tiene una marca asociada.');
    }

    if (product.brand.id !== userBrand.id) {
      throw new BadRequestException(
        'No tienes permiso para modificar este producto.',
      );
    }
  }

  generateSlug(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '-');
  }

  generateSku(name: string): string {
    const prefix = name.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  }

  calculateCurrentFactors(product: Product): { carbon: number; water: number } {
    const weight = product.weightKg || 1;
    return {
      carbon: product.environmentalImpact.carbonFootprint / weight,
      water: product.environmentalImpact.waterUsage / weight,
    };
  }

  async processMaterialComposition(
    materials: MaterialProductDto[],
    product: Product,
  ): Promise<{
    totalCarbonFactor: number;
    totalWaterFactor: number;
    materialProducts: MaterialProduct[];
  }> {
    const ids = materials.map((m) => m.materialCompositionId);
    const compositions = await this.materialCompositionService.findByIds(ids);

    if (compositions.length !== ids.length) {
      const foundIds = new Set(compositions.map((c) => c.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Materiales no encontrados: ${missing.join(', ')}`,
      );
    }

    const compositionsMap = new Map(compositions.map((c) => [c.id, c]));
    let totalCarbonFactor = 0;
    let totalWaterFactor = 0;

    const materialProducts = materials.map((dto) => {
      const composition = compositionsMap.get(dto.materialCompositionId)!;
      const factor = dto.percentage / 100;

      totalCarbonFactor += factor * composition.carbonFootprintPerKg;
      totalWaterFactor += factor * composition.waterUsagePerKg;

      return this.materialProductRepository.create({
        percentage: dto.percentage,
        product,
        materialComposition: composition,
      });
    });

    return { totalCarbonFactor, totalWaterFactor, materialProducts };
  }

  createEnvironmentalImpactEntity(
    dto: Partial<EnvironmentalImpact>,
    product: Product,
    weight: number,
    carbonFactor: number,
    waterFactor: number,
  ): EnvironmentalImpact {
    const carbonFootprint = parseFloat((carbonFactor * weight).toFixed(2));
    const waterUsage = parseFloat((waterFactor * weight).toFixed(2));

    return this.environmentalImpactRepository.create({
      ...dto,
      product,
      carbonFootprint,
      waterUsage,
      ecoBadgeLevel: this.calculateEcoBadgeLevel(
        dto.recycledContent || 0,
        carbonFactor,
      ),
    });
  }

  updateEnvironmentalImpactEntity(
    currentImpact: EnvironmentalImpact,
    changesDto: Partial<EnvironmentalImpact> | undefined,
    weight: number,
    carbonFactor: number,
    waterFactor: number,
  ): EnvironmentalImpact {
    const mergedData = { ...currentImpact, ...(changesDto || {}) };

    mergedData.carbonFootprint = parseFloat((carbonFactor * weight).toFixed(2));
    mergedData.waterUsage = parseFloat((waterFactor * weight).toFixed(2));
    mergedData.ecoBadgeLevel = this.calculateEcoBadgeLevel(
      mergedData.recycledContent,
      carbonFactor,
    );

    return this.environmentalImpactRepository.merge(currentImpact, mergedData);
  }

  handleDBExceptions(error: any, contextMessage: string): never {
    this.logger.error(`${contextMessage}: ${error.message}`, error.stack);

    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    if (error.code === 'ER_DUP_ENTRY') {
      throw new BadRequestException(
        'El producto ya existe (Nombre, Slug o SKU duplicado).',
      );
    }

    throw new InternalServerErrorException(
      `Error inesperado: ${error.message || 'Check server logs'}`,
    );
  }

  calculateRecyclabilityStatus(
    materialProducts: MaterialProduct[],
  ): RecyclabilityStatus {
    let ecoFriendlyPercentage = 0;

    for (const mp of materialProducts) {
      if (mp.materialComposition.isEcoFriendly) {
        ecoFriendlyPercentage += Number(mp.percentage);
      }
    }

    if (ecoFriendlyPercentage >= 95) {
      return RecyclabilityStatus.FULLY_RECYCLABLE;
    } else if (ecoFriendlyPercentage <= 5) {
      return RecyclabilityStatus.NON_RECYCLABLE;
    } else {
      return RecyclabilityStatus.PARTIALLY_RECYCLABLE;
    }
  }

  private calculateEcoBadgeLevel(
    recycledContent: number,
    carbonFactor: number,
  ): EcoBadgeLevel {
    if (carbonFactor < 0.05) return EcoBadgeLevel.NEUTRAL;
    if (recycledContent >= 75 && carbonFactor <= 1.5) return EcoBadgeLevel.HIGH;
    if (recycledContent >= 50 || carbonFactor <= 3.0)
      return EcoBadgeLevel.MEDIUM;
    return EcoBadgeLevel.LOW;
  }
}
