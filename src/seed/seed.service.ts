import { Injectable, Logger } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { BrandsService } from 'src/brands/brands.service';
import { UsersService } from 'src/users/users.service';
import { MaterialCompositionService } from 'src/material-composition/material-composition.service';
import { CertificationsService } from 'src/certifications/certifications.service';
import { WalletService } from 'src/wallet/services/wallet.service';
import { CreateProductDto } from 'src/products/dto/product.dto';
import { RewardType } from 'src/wallet/entities/reward.entity';
import { CreateMaterialCompositionDto } from 'src/material-composition/dto/material-composition.dto';
import { UserRole } from 'src/users/entities/user.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly brandsService: BrandsService,
    private readonly usersService: UsersService,
    private readonly materialService: MaterialCompositionService,
    private readonly certService: CertificationsService,
    private readonly walletService: WalletService,
  ) {}

  async runSeed() {
    this.logger.log('🌱 INICIANDO PROCESO DE SEEDING...');
    const start = Date.now();

    try {
      const brandOwner = await this.seedUsersAndBrand();

      await this.seedMasterData();

      await this.seedProducts(brandOwner.id);

      await this.seedRewards();

      const time = Date.now() - start;
      this.logger.log(`✅ SEEDING FINALIZADO exitosamente en ${time}ms`);
      return {
        message: 'Base de datos poblada exitosamente',
        duration: `${time}ms`,
      };
    } catch (error) {
      this.logger.error('❌ Error fatal en el seeder:', error);
      throw error;
    }
  }

  private async seedUsersAndBrand() {
    this.logger.log('👤 Verificando usuario administrador de marca...');

    const demoEmail = 'brandadmin@demo.com';
    let user;

    try {
      user = await this.usersService.findByEmail(demoEmail);
    } catch (error) {}

    if (!user) {
      this.logger.log(`⚠️ Usuario no encontrado. Creando ${demoEmail}...`);

      user = await this.usersService.create({
        email: demoEmail,
        firstName: 'Brand',
        lastName: 'Admin',
        roles: [UserRole.BRAND_ADMIN],
        providerId: `seed-${Date.now()}`,
      } as any);

      this.logger.log(`✅ Usuario creado ID: ${user.id}`);
    } else {
      this.logger.log(`👤 Usuario existente encontrado: ${user.email}`);
    }

    const brandName = 'EcoShop Official Brand';
    let existingBrand;

    try {
      existingBrand = await this.brandsService.findOneByOwnerId(user.id);
    } catch (error) {}

    if (!existingBrand) {
      await this.brandsService.create(
        {
          name: brandName,
          description: 'Marca oficial de demostración para EcoShop MVP.',
          logoUrl:
            'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/logo-ecoshop.png',
        },
        user,
      );
      this.logger.log(`🏷️ Marca creada: ${brandName}`);
    } else {
      this.logger.log(`🏷️ Marca existente encontrada: ${existingBrand.name}`);
    }

    return user;
  }

  private async seedMasterData() {
    this.logger.log('🧪 Cargando Materiales y Certificaciones...');

    const materials: CreateMaterialCompositionDto[] = [
      {
        name: 'Algodón Orgánico',
        isEcoFriendly: true,
        carbonFootprintPerKg: 3.5,
        waterUsagePerKg: 2000,
      },
      {
        name: 'Algodón Convencional',
        isEcoFriendly: false,
        carbonFootprintPerKg: 10.5,
        waterUsagePerKg: 9800,
      },
      {
        name: 'Poliéster Reciclado',
        isEcoFriendly: true,
        carbonFootprintPerKg: 5.0,
        waterUsagePerKg: 50,
      },
      {
        name: 'Poliéster Vírgen',
        isEcoFriendly: false,
        carbonFootprintPerKg: 5.5,
        waterUsagePerKg: 50,
      },
      {
        name: 'Plástico Virgen',
        isEcoFriendly: false,
        carbonFootprintPerKg: 6.0,
        waterUsagePerKg: 180,
      },
      {
        name: 'Bambú (Mecánico)',
        isEcoFriendly: true,
        carbonFootprintPerKg: 0.8,
        waterUsagePerKg: 500,
      },
      {
        name: 'Cuero Vegano (Nopal)',
        isEcoFriendly: true,
        carbonFootprintPerKg: 2.5,
        waterUsagePerKg: 100,
      },
      {
        name: 'Cáñamo (Hemp)',
        isEcoFriendly: true,
        carbonFootprintPerKg: 2.9,
        waterUsagePerKg: 300,
      },
      {
        name: 'Nylon Regenerado (Econyl)',
        isEcoFriendly: true,
        carbonFootprintPerKg: 3.0,
        waterUsagePerKg: 80,
      },
      {
        name: 'Vidrio Reciclado',
        isEcoFriendly: true,
        carbonFootprintPerKg: 0.4,
        waterUsagePerKg: 10,
      },
      {
        name: 'Lana Merino Responsable',
        isEcoFriendly: true,
        carbonFootprintPerKg: 12.0,
        waterUsagePerKg: 500,
      },
      {
        name: 'Lino',
        isEcoFriendly: true,
        carbonFootprintPerKg: 1.9,
        waterUsagePerKg: 2500,
      },
      {
        name: 'Tencel™ (Lyocell)',
        isEcoFriendly: true,
        carbonFootprintPerKg: 1.5,
        waterUsagePerKg: 150,
      },
    ];

    for (const mat of materials) {
      try {
        await this.materialService.create(mat);
      } catch (e) {
        if (
          !e.message?.includes('Duplicate') &&
          !e.message?.includes('unique')
        ) {
          this.logger.error(`Error creando material ${mat.name}: ${e.message}`);
        }
      }
    }

    const certs = [
      {
        name: 'Fair Trade Certified (Comercio Justo)',
        description: 'Comercio Justo',
        badgeUrl:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/badges/fair-trade.png',
      },
      {
        name: 'GOTS (Global Organic Textile Standard)',
        description: 'Orgánico',
        badgeUrl:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/badges/gots.png',
      },
      {
        name: 'Leaping Bunny (Cruelty Free)',
        description: 'Cruelty Free',
        badgeUrl:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/badges/cruelty-free.png',
      },
      {
        name: 'FSC (Forest Stewardship Council)',
        description: 'Forestal',
        badgeUrl:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/badges/fsc.png',
      },
      {
        name: 'Carbon Neutral Certified',
        description: 'Neutro',
        badgeUrl:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/badges/carbon-neutral.png',
      },
    ];

    for (const cert of certs) {
      try {
        await this.certService.create(cert);
      } catch (e) {
        if (
          !e.message?.includes('Duplicate') &&
          !e.message?.includes('unique')
        ) {
          this.logger.error(
            `Error creando certificación ${cert.name}: ${e.message}`,
          );
        }
      }
    }
  }

  private async seedProducts(ownerId: string) {
    this.logger.log('👕 Creando Productos...');

    const allMaterials = await this.materialService.findAll();
    const allCerts = await this.certService.findAll();

    const getMatId = (name: string) =>
      allMaterials.find((m) => m.name.includes(name))?.id;
    const getCertId = (name: string) =>
      allCerts.find((c) => c.name.includes(name))?.id;

    if (!getMatId('Algodón Orgánico')) {
      this.logger.error('❌ Error crítico: Materiales base no encontrados.');
      return;
    }

    const products: Partial<CreateProductDto>[] = [
      {
        name: "Camiseta Básica 'Pure Cotton'",
        description: '100% Algodón orgánico suave.',
        price: 25.0,
        stock: 200,
        originCountry: 'Perú',
        weightKg: 0.25,
        image:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/products/remera-algodon-organico.jpg',
        environmentalImpact: {
          recycledContent: 0,
          materials: [
            {
              materialCompositionId: getMatId('Algodón Orgánico')!,
              percentage: 100,
            },
          ],
        },
        certificationIds: [getCertId('GOTS')].filter(Boolean) as string[],
      },
      {
        name: 'Mochila Urbana de Cáñamo',
        description:
          'Resistencia y sostenibilidad en una sola mochila. Fabricada con fibras de cáñamo duraderas y detalles en poliéster reciclado post-consumo.',
        price: 65.0,
        stock: 45,
        originCountry: 'Nepal',
        weightKg: 0.75,
        image:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/products/mochila-canamo.jpg',
        imageAltText:
          'Mochila color beige de textura natural con correas negras',
        environmentalImpact: {
          recycledContent: 40,
          materials: [
            { materialCompositionId: getMatId('Cáñamo')!, percentage: 60 },
            {
              materialCompositionId: getMatId('Poliéster Reciclado')!,
              percentage: 40,
            },
          ],
        },
        certificationIds: [getCertId('Carbon Neutral')].filter(
          Boolean,
        ) as string[],
      },
      {
        name: 'Zapatillas Deportivas de Bambú',
        description:
          'Calzado ligero y transpirable. El tejido de bambú ofrece propiedades antibacterianas naturales, mientras que el nylon regenerado aporta estructura y durabilidad.',
        price: 95.0,
        stock: 80,
        originCountry: 'Vietnam',
        weightKg: 0.6,
        image:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/products/zapatillas-bambu.jpg',
        imageAltText: 'Zapatillas deportivas verdes y grises',
        environmentalImpact: {
          recycledContent: 30,
          materials: [
            { materialCompositionId: getMatId('Bambú')!, percentage: 70 },
            {
              materialCompositionId: getMatId('Nylon Regenerado')!,
              percentage: 30,
            },
          ],
        },
        certificationIds: [getCertId('Fair Trade')].filter(Boolean) as string[],
      },
      {
        name: 'Bolso Tote de Cuero Vegano',
        description:
          'Elegancia libre de crueldad. Este bolso está hecho de piel de cactus, una alternativa innovadora y sostenible al cuero animal, con forro de algodón orgánico.',
        price: 110.0,
        stock: 30,
        originCountry: 'México',
        weightKg: 0.9,
        image:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/products/bolso-cuero-vegano.jpg',
        imageAltText: 'Bolso tote negro de textura suave similar al cuero',
        environmentalImpact: {
          recycledContent: 0,
          materials: [
            {
              materialCompositionId: getMatId('Cuero Vegano')!,
              percentage: 85,
            },
            {
              materialCompositionId: getMatId('Algodón Orgánico')!,
              percentage: 15,
            },
          ],
        },
        certificationIds: [
          getCertId('Leaping Bunny'),
          getCertId('Carbon Neutral'),
        ].filter(Boolean) as string[],
      },
      {
        name: "Botella de Agua Reutilizable 'Infinity'",
        description:
          'Fabricada con vidrio 100% reciclado y una funda protectora de silicona. Mantiene el sabor puro de tus bebidas.',
        price: 22.0,
        stock: 200,
        originCountry: 'España',
        weightKg: 0.5,
        image:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/products/botella-vidrio-reciclado.jpg',
        imageAltText: 'Botella de vidrio transparente con tapa de bambú',
        environmentalImpact: {
          recycledContent: 100,
          materials: [
            {
              materialCompositionId: getMatId('Vidrio Reciclado')!,
              percentage: 100,
            },
          ],
        },
        certificationIds: [],
      },
      {
        name: 'Pantalón de Lino Fresco',
        description:
          'Comodidad natural para el verano. El lino es una fibra biodegradable que requiere muy poca agua para su cultivo. Corte relajado.',
        price: 55.0,
        stock: 60,
        originCountry: 'Portugal',
        weightKg: 0.4,
        image:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/products/pantalon-lino.jpg',
        imageAltText: 'Pantalón color arena de tela ligera',
        environmentalImpact: {
          recycledContent: 0,
          materials: [
            { materialCompositionId: getMatId('Lino')!, percentage: 100 },
          ],
        },
        certificationIds: [getCertId('Fair Trade')].filter(Boolean) as string[],
      },
      {
        name: 'Vestido Midi de Tencel™',
        description:
          'Suavidad botánica. Fibra derivada de madera de bosques gestionados de forma sostenible. Caída elegante y tacto sedoso.',
        price: 85.0,
        stock: 40,
        originCountry: 'Austria',
        weightKg: 0.35,
        image:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/products/vestido-tencel.jpg',
        imageAltText: 'Vestido midi color azul marino',
        environmentalImpact: {
          recycledContent: 0,
          materials: [
            { materialCompositionId: getMatId('Tencel')!, percentage: 100 },
          ],
        },
        certificationIds: [getCertId('FSC')].filter(Boolean) as string[],
      },
      {
        name: 'Sweater Patagónico Merino',
        description:
          'Abrigo natural para climas extremos. Lana obtenida de esquila responsable y ética en la Patagonia.',
        price: 150.0,
        stock: 40,
        originCountry: 'Argentina',
        weightKg: 0.55,
        image:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/products/sweater-merino.jpg',
        imageAltText: 'Sweater tejido grueso color gris marengo',
        environmentalImpact: {
          recycledContent: 0,
          materials: [
            {
              materialCompositionId: getMatId('Lana Merino')!,
              percentage: 100,
            },
          ],
        },
        certificationIds: [getCertId('Fair Trade')].filter(Boolean) as string[],
      },
      {
        name: "Jeans 'Fast Fashion' (Referencia)",
        description:
          'Producto estándar de la industria textil convencional para comparación de impacto. Mezcla de algodón tradicional con fibras sintéticas vírgenes.',
        price: 35.0,
        stock: 500,
        originCountry: 'China',
        weightKg: 0.65,
        image:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/products/jeans-convencionales.jpg',
        imageAltText: 'Jeans clásicos de denim azul oscuro',
        environmentalImpact: {
          recycledContent: 0,
          materials: [
            {
              materialCompositionId: getMatId('Algodón Convencional')!,
              percentage: 80,
            },
            {
              materialCompositionId: getMatId('Poliéster Vírgen')!,
              percentage: 20,
            },
          ],
        },
        certificationIds: [],
      },
    ];

    for (const prod of products) {
      try {
        await this.productsService.create(prod as CreateProductDto, ownerId);
        this.logger.log(`✅ Producto creado: ${prod.name}`);
      } catch (error) {
        if (
          !error.message?.includes('Duplicate') &&
          !error.message?.includes('unique')
        ) {
          this.logger.error(`❌ Error creando ${prod.name}: ${error.message}`);
        }
      }
    }
  }

  private async seedRewards() {
    this.logger.log('🎁 Creando Recompensas de Wallet...');

    const rewards = [
      {
        name: 'Donación: Plantar un Árbol',
        description: 'Ayuda a la reforestación.',
        costInPoints: 500,
        type: RewardType.DONATION,
        isActive: true,
      },
      {
        name: 'Cupón 10% OFF',
        description: 'Descuento para tu próxima compra.',
        costInPoints: 300,
        type: RewardType.COUPON,
        isActive: true,
        metadata: { discountPercentage: 10, validDays: 30 },
      },
    ];

    const existingRewards = await this.walletService.findAllRewards();
    const existingNames = new Set(existingRewards.map((r) => r.name));

    for (const reward of rewards) {
      if (!existingNames.has(reward.name)) {
        try {
          await this.walletService.createReward(reward as any);
          this.logger.log(`🎟️ Recompensa creada: ${reward.name}`);
        } catch (e) {
          this.logger.error(
            `Error creando recompensa ${reward.name}: ${e.message}`,
          );
        }
      }
    }
  }
}
