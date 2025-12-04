import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner } from 'typeorm';
import { Product } from './entities/product.entity';
import { EnvironmentalImpact } from './entities/environmental-impact.entity';
import { MaterialProduct } from './entities/material-product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { BrandsService } from 'src/brands/brands.service';
import { MaterialCompositionService } from 'src/material-composition/material-composition.service';
import { CertificationsService } from 'src/certifications/certifications.service';
import { ProductsHelper } from './helpers/products.helper';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly PRODUCT_RELATIONS = [
    'brand',
    'environmentalImpact',
    'certifications',
    'materials.materialComposition',
  ];

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(EnvironmentalImpact)
    private readonly dataSource: DataSource,
    private readonly brandsService: BrandsService,
    private readonly certificationsService: CertificationsService,
    private readonly productsHelperService: ProductsHelper,
  ) {}

  async findAll(): Promise<Product[]> {
    try {
      return await this.productRepository.find({
        relations: this.PRODUCT_RELATIONS,
        order: { name: 'ASC' },
      });
    } catch (error) {
      this.productsHelperService.handleDBExceptions(
        error,
        'Error al buscar los productos',
      );
    }
  }

  async findOne(term: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: [{ id: term }, { slug: term }, { sku: term }],
      relations: this.PRODUCT_RELATIONS,
    });

    if (!product) {
      throw new NotFoundException(
        `Producto con término '${term}' no encontrado.`,
      );
    }
    return product;
  }

  async findByBrand(userId: string): Promise<Product[]> {
    try {
      const brand = await this.brandsService.findOne(userId);
      if (!brand)
        throw new BadRequestException(
          'El usuario no posee una marca registrada.',
        );
      return await this.productRepository.find({
        where: { brand: { id: brand.id } },
        relations: this.PRODUCT_RELATIONS,
        order: { name: 'ASC' },
      });
    } catch (error) {
      this.productsHelperService.handleDBExceptions(
        error,
        `Error al buscar productos de la marca.`,
      );
    }
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

    this.productsHelperService.validateMaterialPercentageSum(materials);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener dependencias externas
      const brand = await this.brandsService.findOneByOwnerId(userId);
      const certifications =
        await this.certificationsService.findAllAndValidate(
          certificationIds || [],
        );

      // 2. Crear Producto Base
      const product = this.productRepository.create({
        ...productDetails,
        slug: this.productsHelperService.generateSlug(productDetails.name),
        sku: this.productsHelperService.generateSku(productDetails.name),
        brand,
        certifications,
      });
      await queryRunner.manager.save(product);

      // 3. Procesar Materiales y Calcular Factores
      const { totalCarbonFactor, totalWaterFactor, materialProducts } =
        await this.productsHelperService.processMaterialComposition(
          materials,
          product,
        );

      await queryRunner.manager.save(materialProducts);

      // 4. Procesar Impacto Ambiental
      const impactEntity =
        this.productsHelperService.createEnvironmentalImpactEntity(
          environmentalImpact,
          product,
          productDetails.weightKg,
          totalCarbonFactor,
          totalWaterFactor,
        );
      await queryRunner.manager.save(impactEntity);

      // 5. Finalizar
      await queryRunner.commitTransaction();

      // Asignar relaciones para el retorno (sin recargar de DB)
      product.environmentalImpact = impactEntity;
      product.materials = materialProducts;

      return product;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.productsHelperService.handleDBExceptions(
        error,
        'Error al crear el producto',
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
      materials,
      certificationIds,
      environmentalImpact,
      ...productDetails
    } = changes;

    if (materials) {
      this.productsHelperService.validateMaterialPercentageSum(materials);
    }

    const productToUpdate = await this.findOne(id);
    await this.productsHelperService.validateProductOwnership(
      productToUpdate,
      ownerId,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Actualizar Datos Básicos
      if (productDetails.name) {
        productToUpdate.slug = this.productsHelperService.generateSlug(
          productDetails.name,
        );
        productToUpdate.sku = this.productsHelperService.generateSku(
          productDetails.name,
        );
      }
      this.productRepository.merge(productToUpdate, productDetails);

      // 2. Actualizar Certificaciones
      if (certificationIds !== undefined) {
        productToUpdate.certifications =
          certificationIds.length > 0
            ? await this.certificationsService.findAllAndValidate(
                certificationIds,
              )
            : [];
      }

      await queryRunner.manager.save(productToUpdate);

      // 3. Actualizar Materiales e Impacto
      // Calculamos factores base actuales por si no cambian los materiales
      let currentFactors =
        this.productsHelperService.calculateCurrentFactors(productToUpdate);

      if (materials && materials.length > 0) {
        // Borrar anteriores
        await queryRunner.manager.delete(MaterialProduct, {
          product: { id: id },
        });

        // Crear nuevos
        const materialResult =
          await this.productsHelperService.processMaterialComposition(
            materials,
            productToUpdate,
          );
        await queryRunner.manager.save(materialResult.materialProducts);

        // Actualizar factores y relación en memoria
        currentFactors = {
          carbon: materialResult.totalCarbonFactor,
          water: materialResult.totalWaterFactor,
        };
        productToUpdate.materials = materialResult.materialProducts;
      }

      // 4. Recalcular Impacto Ambiental
      const updatedImpact =
        this.productsHelperService.updateEnvironmentalImpactEntity(
          productToUpdate.environmentalImpact,
          environmentalImpact,
          productToUpdate.weightKg,
          currentFactors.carbon,
          currentFactors.water,
        );

      await queryRunner.manager.save(updatedImpact);
      productToUpdate.environmentalImpact = updatedImpact;

      await queryRunner.commitTransaction();
      return productToUpdate;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.productsHelperService.handleDBExceptions(
        error,
        'Error al actualizar el producto',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.productRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }
  }
}
