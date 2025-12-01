import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { EnvironmentalImpact } from './entities/environmental-impact.entity';
import { MaterialProduct } from './entities/material-product.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Certification } from '../certifications/entities/certification.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { MaterialProductDto } from './dto/material-product.dto';
import { MaterialComposition } from 'src/material-composition/entities/material-composition.entity';

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

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(EnvironmentalImpact)
    private readonly impactRepository: Repository<EnvironmentalImpact>,
    @InjectRepository(MaterialComposition)
    private readonly compositionRepository: Repository<MaterialComposition>,
    @InjectRepository(MaterialProduct)
    private readonly materialProductRepository: Repository<MaterialProduct>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(Certification)
    private readonly certificationRepository: Repository<Certification>,

    private readonly dataSource: DataSource,
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

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const {
      brandId,
      certificationIds = [],
      environmentalImpact,
      materials,
      name,
      weightKg, // Para el calculo de la huella de CO2
      ...productDetails
    } = createProductDto;

    // 1 CONFIG DE TRASACCIONES DE TYPEORM
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2 RELACIONES EXISTENTES DE MARCAS Y CERTFICADOS, SOLO BUSCANDO PO ID
      // FUTURO ENDPOINT DE BUSQUEDA DE ID OJOOO
      const brand = await queryRunner.manager.findOne(Brand, {
        where: { id: brandId },
      });
      if (!brand) {
        throw new NotFoundException(`Marca con ID ${brandId} no encontrada`);
      }

      let certifications: Certification[] = [];
      if (certificationIds.length > 0) {
        certifications = await queryRunner.manager.findBy(Certification, {
          id: In(certificationIds),
        });
        if (certifications.length !== certificationIds.length) {
          const foundIds = certifications.map((c) => c.id);
          const notFoundIds = certificationIds.filter(
            (id) => !foundIds.includes(id),
          );
          throw new BadRequestException(
            `Algunos ID de certificados no son validos o no existen: ${notFoundIds.join(', ')}.`,
          );
        }
      }

      // 3 GENERAR PRODUCTO BASE Y GUARDAR EN DB
      const slug = generateSlug(name);
      const sku = generateSku(name);

      // crear el producto y guardar
      const newProduct = this.productRepository.create({
        ...productDetails,
        name,
        weightKg, // para el calculo
        slug,
        sku,
        brand: brand,
        certifications: certifications,
      });
      const product = await queryRunner.manager.save(Product, newProduct);

      // 4 MANEJO DE MATERIALES Y CALCULO DE FACTORES AMBIENTALES
      const { totalCarbonFactor, totalWaterFactor } =
        await this.handleMaterialComposition(product, materials, queryRunner);

      const carbonFootprint = weightKg * totalCarbonFactor;
      const waterUsage = weightKg * totalWaterFactor; // Creación del Impacto Ambiental con valores calculados
      const safeRound = (value: number): number =>
        Math.round(value * 100) / 100;

      const newImpact = this.impactRepository.create({
        ...environmentalImpact,
        carbonFootprint: safeRound(carbonFootprint),
        waterUsage: safeRound(waterUsage),
        product: product,
      });
      await queryRunner.manager.save(EnvironmentalImpact, newImpact);

      // commit de la transaccion y retorno del result
      await queryRunner.commitTransaction();

      // 5 DEVOLVER EL PRODUCT CON SUS RELACIONES Y TODO LISTITO
      // FUTURO ENDPOINT DE BUSQUEDA DE ID OJOOO
      const createdProduct = await this.productRepository.findOne({
        where: { id: product.id },
        relations: [
          'brand',
          'environmentalImpact',
          'certifications',
          'materials.materialComposition',
        ],
      });

      if (!createdProduct) {
        throw new InternalServerErrorException(
          'Error al obtener el product creado',
        );
      }

      return createdProduct;
    } catch (error) {
      await queryRunner.rollbackTransaction(); // Si hay error manda un rollback
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      // Errores de duplicados
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException(
          'El nombre/slug o el SKU generado esta duplicado',
        );
      }
      throw new InternalServerErrorException(
        'Ocurrio un error inicial al procesar el product',
      );
    } finally {
      // Cerrar el query runner siempre
      await queryRunner.release();
    }
  }

  async update(id: string, changes: UpdateProductDto): Promise<Product> {
    const {
      brandId,
      certificationIds, // Opcional
      environmentalImpact, //Opcional
      materials, //Opcional
      name,
      weightKg,
      ...productDetails
    } = changes;

    // 1 CONFIG DE TRANSACCIONES DE TYPEORM
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2 BUSCAR EL PRODUCT CON LAS RELACIONES DE IMPACT y MATERIALS
      const productToUpdate = await this.productRepository.findOne({
        where: { id },
        relations: ['environmentalImpact', 'materials'],
      });
      if (!productToUpdate) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      // 3 MANEJO DE RELACIONES
      let brand: Brand | undefined; // el resultado que puede ser brand o null
      if (brandId) {
        const foundBrand = await queryRunner.manager.findOne(Brand, {
          where: { id: brandId },
        });

        if (!foundBrand) {
          throw new NotFoundException(`Marca con ID ${brandId} no encontrada`);
        }
        brand = foundBrand;
      }

      let certifications: Certification[] =
        productToUpdate.certifications || []; // Si no hay cambios nuevos dejamos los viejos
      if (certificationIds !== undefined) {
        if (certificationIds.length > 0) {
          certifications = await queryRunner.manager.findBy(Certification, {
            id: In(certificationIds),
          });
          if (certifications.length !== certificationIds.length) {
            const foundIds = certifications.map((c) => c.id);
            const notFoundIds = certificationIds.filter(
              (certId) => !foundIds.includes(certId),
            );
            throw new BadRequestException(
              `Algunos ID de certificados no son validos o no existen: ${notFoundIds.join(', ')}.`,
            );
          }
        } else {
          certifications = []; // Si el array de IDs esta vacío limpiamos todas los certif
        }
      }
      // 4 ACTUALIZAR CAMPOS BASE DEL PRODUCT
      const updatedProduct = this.productRepository.merge(productToUpdate, {
        ...productDetails,
        name,
        weightKg,
        slug: name ? generateSlug(name) : productToUpdate.slug,
        sku: name ? generateSku(name) : productToUpdate.sku,
        brand: brand || productToUpdate.brand, // Actualizar SOLO si brandId fue dado
        certifications: certifications,
      });

      const product = await queryRunner.manager.save(Product, updatedProduct);

      let totalCarbonFactor = 0;
      let totalWaterFactor = 0;

      // 5 MANEJO DE MATERIALES
      if (materials && materials.length > 0) {
        // OJO Esto borra fisicamente las entradas en la tabla material_products
        await queryRunner.manager.delete(MaterialProduct, {
          product: productToUpdate,
        });

        // Recrear nuevas relacioes y calcular los factores ambientales
        const factors = await this.handleMaterialComposition(
          product,
          materials,
          queryRunner,
        );
        totalCarbonFactor = factors.totalCarbonFactor;
        totalWaterFactor = factors.totalWaterFactor;
      } else {
        // Si no hay nuevos materiales dejamoslos viejos
        totalCarbonFactor =
          productToUpdate.environmentalImpact.carbonFootprint /
          productToUpdate.weightKg;
        totalWaterFactor =
          productToUpdate.environmentalImpact.waterUsage /
          productToUpdate.weightKg;
      }

      // 6 ACTUALIZAR IMPACTO AMBIENTAL
      const finalWeightKg = weightKg ?? productToUpdate.weightKg;

      // Recalculo SOLO si hay materiales o si el peso cambio
      if (materials || weightKg) {
        const carbonFootprint = finalWeightKg * totalCarbonFactor;
        const waterUsage = finalWeightKg * totalWaterFactor;
        const safeRound = (value: number): number =>
          Math.round(value * 100) / 100;

        // Actualizar el impacto existente
        const updatedImpact = this.impactRepository.merge(
          productToUpdate.environmentalImpact,
          {
            ...environmentalImpact, // Aplicar cambios opcinales
            carbonFootprint: safeRound(carbonFootprint),
            waterUsage: safeRound(waterUsage),
          },
        );
        await queryRunner.manager.save(EnvironmentalImpact, updatedImpact);
      }

      // 7 COMMIT Y RETURN
      await queryRunner.commitTransaction();

      return this.findOne(product.id);
    } catch (error) {
      await queryRunner.rollbackTransaction(); // Si hay error manda un rollback
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      // Errores de duplicados
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException(
          'El nombre/slug o el SKU generado esta duplicado',
        );
      }
      throw new InternalServerErrorException(
        'Ocurrio un error inicial al procesar el product',
      );
    } finally {
      // Cerrar el query runner siempre
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
    product: Product,
    materials: MaterialProductDto[],
    queryRunner: any,
  ): Promise<{ totalCarbonFactor: number; totalWaterFactor: number }> {
    const compositionIds = materials.map((m) => m.materialCompositionId);

    const compositions = await queryRunner.manager.findBy(MaterialComposition, {
      id: In(compositionIds),
    });

    if (compositions.length !== compositionIds.length) {
      const foundIds = compositions.map((c) => c.id);
      const notFoundIds = compositionIds.filter((id) => !foundIds.includes(id));

      throw new NotFoundException(
        `Los siguientes IDs de MaterialComposition no existen: ${notFoundIds.join(', ')}. Recuerda que deben ser creados a través de su propio endpoint.`,
      );
    }

    const compositionsMap = new Map(
      compositions.map((c) => [c.id, c] as [string, MaterialComposition]),
    );

    let totalCarbonFactor = 0;
    let totalWaterFactor = 0;

    const materialProductsToSave = materials.map((matData) => {
      // FIX 1 & 2: Usamos aserción de tipo para que TypeScript reconozca las propiedades
      const compositionEntity = compositionsMap.get(
        matData.materialCompositionId,
      ) as MaterialComposition; // Calcular la contribución de este material al factor total

      totalCarbonFactor +=
        (matData.percentage / 100) * compositionEntity.carbonFootprintPerKg;
      totalWaterFactor +=
        (matData.percentage / 100) * compositionEntity.waterUsagePerKg; // FIX 3: El objeto creado ahora usa el tipo correcto para materialComposition

      return this.materialProductRepository.create({
        percentage: matData.percentage,
        product: product,
        materialComposition: compositionEntity,
      });
    });

    await queryRunner.manager.save(MaterialProduct, materialProductsToSave);

    return { totalCarbonFactor, totalWaterFactor };
  }
}
