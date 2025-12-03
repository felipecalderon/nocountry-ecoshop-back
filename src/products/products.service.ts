import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { Product } from './entities/product.entity';
import {
  EcoBadgeLevel,
  EnvironmentalImpact,
} from './entities/environmental-impact.entity';
import { MaterialProduct } from './entities/material-product.entity';
import { MaterialComposition } from 'src/material-composition/entities/material-composition.entity';

import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { MaterialProductDto } from './dto/material-product.dto';
import { BrandsService } from 'src/brands/brands.service';
import { MaterialCompositionService } from 'src/material-composition/material-composition.service';
import { CertificationsService } from 'src/certifications/certifications.service';

// Tranforma el nombre a minusculas y reemplaza espacios por guiones. El slug
function generateSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-');
}

// SKU. toma las tres primeras letras del nombre
function generateSku(name: string): string {
  const prefix = name.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);

  return `${prefix}-${timestamp}`;
}

// Calculo automatico de ecoBadgeLevel
function calculateEcoBadgeLevel(
  recycledContent: number,
  carbonFactor: number,
): EcoBadgeLevel {
  if (carbonFactor < 0.05) return EcoBadgeLevel.NEUTRAL;
  if (recycledContent >= 75 && carbonFactor <= 1.5) return EcoBadgeLevel.HIGH;
  if (recycledContent >= 50 || carbonFactor <= 3.0) return EcoBadgeLevel.MEDIUM;
  return EcoBadgeLevel.LOW;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(EnvironmentalImpact)
    private readonly environmentalImpactRepository: Repository<EnvironmentalImpact>,
    @InjectRepository(MaterialProduct)
    private readonly materialProductRepository: Repository<MaterialProduct>,
    private readonly dataSource: DataSource,
    private readonly brandsService: BrandsService,
    private readonly certificationsService: CertificationsService,
    private readonly materialCompositionService: MaterialCompositionService,
  ) {}

  async findAll(): Promise<Product[]> {
    try {
      const relationsToLoad = [
        'brand',
        'environmentalImpact',
        'certifications',
        'materials.materialComposition',
      ];

      const products = await this.productRepository.find({
        relations: relationsToLoad,
        order: { name: 'ASC' }, // Ordenar por nombre
      });

      return products;
    } catch (error) {
      throw new InternalServerErrorException(
        'Ocurrio un error al buscar los productos.',
      );
    }
  }

  async findOne(term: string): Promise<Product> {
    const relationsToLoad = [
      'brand',
      'environmentalImpact',
      'certifications',
      'materials.materialComposition',
    ];

    // Par buscar cualquiera de los 3 campos
    const product = await this.productRepository.findOne({
      where: [{ id: term }, { slug: term }, { sku: term }],
      relations: relationsToLoad,
    });

    if (!product) {
      throw new NotFoundException(
        `Producto con el termino ${term} no encontrado. usa el UUID, el slug, o el SKU`,
      );
    }
    return product;
  }

  async create(
    createProductDto: CreateProductDto,
    userId: string,
  ): Promise<Product> {
    const {
      materials,
      environmentalImpact,
      certificationIds,
      ...productDetails
    } = createProductDto;

    // Validacion de la suma de porcentajes
    const totalPercentage = materials.reduce(
      (sum, mat) => sum + mat.percentage,
      0,
    );
    if (totalPercentage !== 100) {
      throw new BadRequestException(
        'La suma de los porcentajes de los materiales debe ser igual a 100',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1 VALIDACION DE MARCA Y  CERTIFICADOS
      const brand = await this.brandsService.findOneByOwnerId(userId);

      const certifications =
        await this.certificationsService.findAllAndValidate(
          certificationIds || [], // Puede estar vacio
        );

      // 2 CREACION DE LA ENTIDAD DEL PRODUCTO BASE
      const product = this.productRepository.create({
        ...productDetails,
        slug: generateSlug(productDetails.name),
        sku: generateSku(productDetails.name),
        brand: brand,
        certifications: certifications,
      });

      await queryRunner.manager.save(product); // Guardar el producto SOLO para obtener la id

      // 3 MANEJO DE MATERIALES
      const { totalCarbonFactor, totalWaterFactor, materialProductsToSave } =
        await this.handleMaterialComposition(materials, product);

      await queryRunner.manager.save(materialProductsToSave);

      // 4 MANEJO DE IMPACTO AMBIENTAL
      const environmentalImpactEntity =
        this.environmentalImpactRepository.create({
          ...environmentalImpact,
          product: product, // Product ya tiene id, ojo
        });

      // Calculos ambientales
      const rawCarbonFootprint = totalCarbonFactor * productDetails.weightKg;
      const rawWaterUsage = totalWaterFactor * productDetails.weightKg;

      environmentalImpactEntity.carbonFootprint = parseFloat(
        rawCarbonFootprint.toFixed(2),
      );
      environmentalImpactEntity.waterUsage = parseFloat(
        rawWaterUsage.toFixed(2),
      );

      // Calculo auto de la ecoBadge
      environmentalImpactEntity.ecoBadgeLevel = calculateEcoBadgeLevel(
        environmentalImpact.recycledContent,
        totalCarbonFactor,
      );

      await queryRunner.manager.save(environmentalImpactEntity);

      // 5 ASIGNAR RELACIONES PARA FINALIZAR TODO TODITO
      product.environmentalImpact = environmentalImpactEntity;
      product.materials = materialProductsToSave;

      await queryRunner.commitTransaction();

      return product;
    } catch (error) {
      await queryRunner.rollbackTransaction(); // Si hay error manda un rollback
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException(
          'El nombre/slug o el SKU generado esta duplicado',
        );
      }
      throw new InternalServerErrorException(
        `Ocurrio un error al procesar el producto: ${error.message || 'Error de DB desconocido'}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: string,
    changes: UpdateProductDto,
    ownerId: string,
  ): Promise<Product> {
    const {
      certificationIds,
      environmentalImpact,
      materials,
      ...productDetails
    } = changes;

    if (materials) {
      const totalPercentage = materials.reduce(
        (sum, mat) => sum + mat.percentage,
        0,
      );
      if (totalPercentage !== 100) {
        throw new BadRequestException(
          'La suma de los porcentajes de los materiales debe ser igual a 100',
        );
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1 BUSCAR EL PRODUCT CON TODAS LAS RELACIONES
      const productToUpdate = await this.productRepository.findOne({
        where: { id },
        relations: [
          'brand',
          'environmentalImpact',
          'materials',
          'certifications',
        ],
      });
      if (!productToUpdate) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      // 2 MANEJO Y VALIDACION DE RELACIONES
      const userBrand = await this.brandsService.findOneByOwnerId(ownerId);
      if (productToUpdate.brand.id !== userBrand.id) {
        throw new BadRequestException(
          'No tienes permiso para actualizar este producto (no pertenece a tu marca)',
        );
      }

      // 3 ACTUALIZAR CAMPOS BASE DEL PRODUCTO
      if (productDetails.name) {
        productToUpdate.slug = generateSlug(productDetails.name);
        productToUpdate.sku = generateSku(productDetails.name);
      }
      this.productRepository.merge(productToUpdate, productDetails); // precio descripcion stock etc etc

      // 4 MANEJO DE CERTIFICACIONES
      if (certificationIds !== undefined) {
        if (certificationIds.length > 0) {
          productToUpdate.certifications =
            await this.certificationsService.findAllAndValidate(
              certificationIds,
            );
        } else {
          productToUpdate.certifications = []; // Limpiar si esta vacio
        }
      }

      await queryRunner.manager.save(productToUpdate); // Guardar los cambios del producto Base

      // 5 MANEJO DE MATERIALES Y CÁLCULOS AMBIENTALES
      let totalCarbonFactor = 0;
      let totalWaterFactor = 0;
      let newMaterialProducts: MaterialProduct[] = [];

      // Si hay nuevos materiales borrar materiales viejos de la DB
      if (materials && materials.length > 0) {
        await queryRunner.manager.delete(MaterialProduct, {
          product: { id: productToUpdate.id },
        });

        // Generar nuevos materiales
        const factors = await this.handleMaterialComposition(
          materials,
          productToUpdate,
        );
        totalCarbonFactor = factors.totalCarbonFactor;
        totalWaterFactor = factors.totalWaterFactor;
        newMaterialProducts = factors.materialProductsToSave;

        await queryRunner.manager.save(newMaterialProducts);

        // Actualizar en memoria para el final
        productToUpdate.materials = newMaterialProducts;
      }

      // Si NO cambian los materiales
      else {
        // Recalcular basado en totales actuales y peso anterior
        const currentWeight = productToUpdate.weightKg || 1;
        totalCarbonFactor =
          productToUpdate.environmentalImpact.carbonFootprint / currentWeight;
        totalWaterFactor =
          productToUpdate.environmentalImpact.waterUsage / currentWeight;
      }

      // 6 ACTUALIZAR IMPACTO AMBIENTAL
      const updatedImpactData = {
        ...productToUpdate.environmentalImpact,
        ...environmentalImpact,
      };

      if (materials || productDetails.weightKg) {
        const finalWeight = productToUpdate.weightKg;

        const rawCarbon = totalCarbonFactor * finalWeight;
        const rawWater = totalWaterFactor * finalWeight;

        updatedImpactData.carbonFootprint = parseFloat(rawCarbon.toFixed(2));
        updatedImpactData.waterUsage = parseFloat(rawWater.toFixed(2));
      }

      // Recalcular EcoBadge
      updatedImpactData.ecoBadgeLevel = calculateEcoBadgeLevel(
        updatedImpactData.recycledContent,
        totalCarbonFactor,
      );

      // Mergear los cambios en la entidad de impacto
      this.environmentalImpactRepository.merge(
        productToUpdate.environmentalImpact,
        updatedImpactData,
      );

      await queryRunner.manager.save(productToUpdate.environmentalImpact);

      await queryRunner.commitTransaction();

      // Devolver el producto actualizado
      return productToUpdate;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException(
          'El nombre/slug o el SKU generado esta duplicado',
        );
      }
      throw new InternalServerErrorException(
        'Ocurrio un error inicial al procesar el product',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.productRepository.softDelete(id); // borrado logico de typeorm

    if (result.affected === 0) {
      throw new NotFoundException(
        `Producto con ID ${id} no encontrado o ya eliminado.`,
      );
    }
  }

  // VIVA LA IA --- Manejo de la composicion de materiales y calculo de factores para la creacion del producto
  private async handleMaterialComposition(
    materials: MaterialProductDto[],
    product: Product,
  ): Promise<{
    totalCarbonFactor: number;
    totalWaterFactor: number;
    materialProductsToSave: MaterialProduct[];
  }> {
    const compositionIds = materials.map((mat) => mat.materialCompositionId);

    // Service de MaterialComposition
    const compositions =
      await this.materialCompositionService.findByIds(compositionIds);

    if (compositions.length !== compositionIds.length) {
      const foundIds = compositions.map((c) => c.id);
      const notFoundIds = compositionIds.filter((id) => !foundIds.includes(id));

      throw new NotFoundException(
        `Los siguientes IDs de MaterialComposition no existen: ${notFoundIds.join(
          ', ',
        )}`,
      );
    }

    const compositionsMap = new Map(
      compositions.map((c) => [c.id, c] as [string, MaterialComposition]),
    );

    let totalCarbonFactor = 0;
    let totalWaterFactor = 0;

    const materialProductsToSave = materials.map((matData) => {
      // Usamos aserción de tipo para que TypeScript reconozca las propiedades
      const compositionEntity = compositionsMap.get(
        matData.materialCompositionId,
      ) as MaterialComposition;

      // Calcular la contribución de este material al factor total
      totalCarbonFactor +=
        (matData.percentage / 100) * compositionEntity.carbonFootprintPerKg;
      totalWaterFactor +=
        (matData.percentage / 100) * compositionEntity.waterUsagePerKg;

      return this.materialProductRepository.create({
        percentage: matData.percentage,
        product: product,
        materialComposition: compositionEntity,
      });
    });

    return { totalCarbonFactor, totalWaterFactor, materialProductsToSave };
  }
}
