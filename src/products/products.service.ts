import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { MaterialProduct } from './entities/material-product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { BrandsService } from 'src/brands/brands.service';
import { CertificationsService } from 'src/certifications/certifications.service';
import { ProductsHelper } from './helpers/products.helper';

@Injectable()
export class ProductsService {
  private readonly PRODUCT_RELATIONS = [
    'brand',
    'environmentalImpact',
    'certifications',
    'materials.materialComposition',
  ];

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
    private readonly brandsService: BrandsService,
    private readonly certificationsService: CertificationsService,
    private readonly productsHelper: ProductsHelper,
  ) {}

  async findAll(): Promise<Product[] | void> {
    try {
      return await this.productRepository.find({
        relations: this.PRODUCT_RELATIONS,
        order: { name: 'ASC' },
      });
    } catch (error) {
      this.productsHelper.handleDBExceptions(
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

  async findByBrand(brandId: string): Promise<Product[] | void> {
    try {
      return await this.productRepository.find({
        where: { brand: { id: brandId } },
        relations: this.PRODUCT_RELATIONS,
        order: { name: 'ASC' },
      });
    } catch (error) {
      this.productsHelper.handleDBExceptions(
        error,
        `Error al buscar productos de la marca ${brandId}`,
      );
    }
  }

  async create(
    createProductDto: CreateProductDto,
    userId: string,
  ): Promise<Product | void> {
    let { environmentalImpact, certificationIds, ...productDetails } =
      createProductDto;

    const materials = environmentalImpact.materials;

    this.productsHelper.validateMaterialPercentageSum(materials);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const brand = await this.brandsService.findOneByOwnerId(userId);
      const certifications =
        await this.certificationsService.findAllAndValidate(
          certificationIds || [],
        );

      const product = this.productRepository.create({
        ...productDetails,
        slug: this.productsHelper.generateSlug(productDetails.name),
        sku: this.productsHelper.generateSku(productDetails.name),
        brand,
        certifications,
      });
      await queryRunner.manager.save(product);

      const { totalCarbonFactor, totalWaterFactor, materialProducts } =
        await this.productsHelper.processMaterialComposition(
          materials,
          product,
        );

      await queryRunner.manager.save(materialProducts);

      const impactEntity = this.productsHelper.createEnvironmentalImpactEntity(
        environmentalImpact,
        product,
        productDetails.weightKg,
        totalCarbonFactor,
        totalWaterFactor,
      );
      await queryRunner.manager.save(impactEntity);

      await queryRunner.commitTransaction();

      product.environmentalImpact = impactEntity;
      product.materials = materialProducts;

      return product;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.productsHelper.handleDBExceptions(
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
  ): Promise<Product | void> {
    let { environmentalImpact, certificationIds, ...productDetails } = changes;

    const materials = environmentalImpact?.materials;

    if (materials) {
      this.productsHelper.validateMaterialPercentageSum(materials);
    }

    const productToUpdate = await this.findOne(id);
    await this.productsHelper.validateProductOwnership(
      productToUpdate,
      ownerId,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (productDetails.name) {
        productToUpdate.slug = this.productsHelper.generateSlug(
          productDetails.name,
        );
        productToUpdate.sku = this.productsHelper.generateSku(
          productDetails.name,
        );
      }
      this.productRepository.merge(productToUpdate, productDetails);

      if (certificationIds !== undefined) {
        productToUpdate.certifications =
          certificationIds.length > 0
            ? await this.certificationsService.findAllAndValidate(
                certificationIds,
              )
            : [];
      }

      await queryRunner.manager.save(productToUpdate);

      let currentFactors =
        this.productsHelper.calculateCurrentFactors(productToUpdate);

      if (materials && materials.length > 0) {
        await queryRunner.manager.delete(MaterialProduct, {
          product: { id: id },
        });

        const materialResult =
          await this.productsHelper.processMaterialComposition(
            materials,
            productToUpdate,
          );
        await queryRunner.manager.save(materialResult.materialProducts);

        currentFactors = {
          carbon: materialResult.totalCarbonFactor,
          water: materialResult.totalWaterFactor,
        };
        productToUpdate.materials = materialResult.materialProducts;
      }

      if (environmentalImpact || materials) {
        const updatedImpact =
          this.productsHelper.updateEnvironmentalImpactEntity(
            productToUpdate.environmentalImpact,
            environmentalImpact,
            productToUpdate.weightKg,
            currentFactors.carbon,
            currentFactors.water,
          );

        await queryRunner.manager.save(updatedImpact);
        productToUpdate.environmentalImpact = updatedImpact;
      }

      await queryRunner.commitTransaction();
      return productToUpdate;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.productsHelper.handleDBExceptions(
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
