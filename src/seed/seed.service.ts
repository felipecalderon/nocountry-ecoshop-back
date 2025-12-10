import { Injectable, Logger } from '@nestjs/common';

// Servicios de tus módulos
import { ProductsService } from 'src/products/products.service';
import { BrandsService } from 'src/brands/brands.service';
import { UsersService } from 'src/users/users.service';
import { MaterialCompositionService } from 'src/material-composition/material-composition.service';
import { CertificationsService } from 'src/certifications/certifications.service';
import { WalletService } from 'src/wallet/services/wallet.service';

// DTOs y Enums necesarios
import { CreateProductDto } from 'src/products/dto/product.dto';
import { RecyclabilityStatus } from 'src/products/entities/product.entity';
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

    // 1. Usuarios y Marcas (Necesarios para ser dueños de los productos)
    const brandOwner = await this.seedUsersAndBrand();

    // 2. Datos Maestros (Materiales y Certificaciones)
    await this.seedMasterData();

    // 3. Productos (Usando IDs reales buscados en DB y el usuario dueño)
    await this.seedProducts(brandOwner.id);

    // 4. Recompensas de Wallet (Cupones y Donaciones)
    await this.seedRewards();

    const time = Date.now() - start;
    this.logger.log(`✅ SEEDING FINALIZADO exitosamente en ${time}ms`);
    return {
      message: 'Base de datos poblada exitosamente',
      duration: `${time}ms`,
    };
  }

  // --- MÉTODOS PRIVADOS DE CARGA ---

  private async seedUsersAndBrand() {
    this.logger.log('👤 Verificando usuario administrador de marca...');

    // NOTA: Para el MVP, usamos un email fijo que coincida con tu login de Auth0
    // Si el usuario no existe en tu DB local, el seed fallará intencionalmente
    // para obligarte a hacer el login inicial o puedes mockear la creación aquí.
    const demoEmail = 'brandadmin@demo.com';
    let user;

    try {
      user = await this.usersService.findByEmail(demoEmail);
    } catch (error) {
      // Si no existe, user queda undefined
    }

    if (!user) {
      this.logger.log(
        `⚠️ Usuario ${demoEmail} no encontrado. Creando usuario local para seeding...`,
      );

      // CREACIÓN AUTOMÁTICA DEL USUARIO
      // Asumimos que tu usersService.create acepta estos datos básicos.
      // Si tu lógica de Auth0 es estricta, aquí estamos simulando un usuario "ya validado".
      user = await this.usersService.create({
        email: demoEmail,
        firstName: 'Brand',
        lastName: 'Admin',
        roles: [UserRole.ADMIN], // Asignamos rol de marca importante
        // password: 'Password123!', // Descomentar si tu modelo local usa password
      } as any); // Casteo a 'any' por si tu DTO es muy estricto con campos opcionales

      this.logger.log(`✅ Usuario creado: ${user.email} (ID: ${user.id})`);
    } else {
      this.logger.log(`👤 Usuario existente encontrado: ${user.email}`);
    }

    // Crear Marca para este usuario si no tiene una
    const brandName = 'EcoShop Official Brand';
    let existingBrand;

    try {
      existingBrand = await this.brandsService.findOneByOwnerId(user.id);
    } catch (error) {
      // Si entra aquí, es que no tiene marca (404), lo cual es perfecto para crearla.
      // No hacemos nada, dejamos existingBrand como null.
    }

    if (!existingBrand) {
      await this.brandsService.create(
        {
          name: brandName,
          description:
            'Marca oficial de demostración para EcoShop MVP. Productos 100% sostenibles.',
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

    // --- MATERIALES ---
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
    ];

    for (const mat of materials) {
      try {
        // Verificamos si existe por nombre para no duplicar en cada seed
        // (Asumiendo que no tienes un método findByName, intentamos crear y capturamos error de unique)
        await this.materialService.create(mat);
      } catch (e) {
        // Ignoramos error de duplicado silenciosamente
      }
    }

    // --- CERTIFICACIONES ---
    const certs = [
      {
        name: 'Fair Trade',
        description: 'Comercio Justo Garantizado',
        badgeUrl:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/badges/fair-trade.png',
      },
      {
        name: 'GOTS',
        description: 'Global Organic Textile Standard',
        badgeUrl:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/badges/gots.png',
      },
      {
        name: 'Leaping Bunny',
        description: 'Libre de Crueldad Animal',
        badgeUrl:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/badges/cruelty-free.png',
      },
    ];

    for (const cert of certs) {
      try {
        await this.certService.create(cert);
      } catch (e) {}
    }
  }

  private async seedProducts(ownerId: string) {
    this.logger.log('👕 Creando Productos...');

    // 1. Recuperar IDs reales de la DB para armar las relaciones
    const allMaterials = await this.materialService.findAll();
    const allCerts = await this.certService.findAll();

    // Helpers para buscar IDs rápido
    const getMatId = (name: string) =>
      allMaterials.find((m) => m.name.includes(name))?.id;
    const getCertId = (name: string) =>
      allCerts.find((c) => c.name.includes(name))?.id;

    // Validación básica
    if (!getMatId('Algodón Orgánico')) {
      this.logger.error(
        '❌ Error crítico: Materiales base no encontrados. Verifica el paso anterior.',
      );
      return;
    }

    // 2. Definición de Productos (Array JSON)
    // Nota: recyclabilityStatus lo dejamos undefined o null, el servicio lo calcula solo ahora.
    const products: Partial<CreateProductDto>[] = [
      {
        name: 'Remera Básica Eco',
        description:
          '100% Algodón orgánico suave. Ideal para pieles sensibles.',
        price: 25.0,
        stock: 100,
        originCountry: 'Perú',
        weightKg: 0.2,
        image:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/products/remera-eco.jpg',
        environmentalImpact: {
          recycledContent: 0,
          materials: [
            {
              materialCompositionId: getMatId('Algodón Orgánico')!,
              percentage: 100,
            },
          ],
        },
        certificationIds: getCertId('Fair Trade')!
          ? [getCertId('Fair Trade')!]
          : [],
      },
      {
        name: 'Mochila Urbana Reciclada',
        description: 'Hecha de botellas plásticas recuperadas del océano.',
        price: 60.0,
        stock: 50,
        originCountry: 'Colombia',
        weightKg: 0.8,
        image:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/products/mochila.jpg',
        environmentalImpact: {
          recycledContent: 100,
          materials: [
            {
              materialCompositionId: getMatId('Poliéster Reciclado')!,
              percentage: 100,
            },
          ],
        },
        certificationIds: [],
      },
      {
        name: 'Bolso de Cuero Vegano',
        description: 'Elegancia sin crueldad. Hecho de nopal (cactus).',
        price: 120.0,
        stock: 20,
        originCountry: 'México',
        weightKg: 0.5,
        image:
          'https://res.cloudinary.com/dclnfdcbf/image/upload/v1/products/bolso-nopal.jpg',
        environmentalImpact: {
          recycledContent: 0,
          materials: [
            {
              materialCompositionId: getMatId('Cuero Vegano')!,
              percentage: 80,
            },
            {
              materialCompositionId: getMatId('Algodón Orgánico')!,
              percentage: 20,
            },
          ],
        },
        certificationIds: [getCertId('Leaping Bunny')!].filter(Boolean),
      },
    ];

    // 3. Inserción
    for (const prod of products) {
      try {
        // El servicio se encarga de calcular huella, status y guardar todo
        await this.productsService.create(prod as CreateProductDto, ownerId);
        this.logger.log(`✅ Producto creado: ${prod.name}`);
      } catch (error) {
        // Ignoramos si ya existe (por unique constraint de nombre/slug)
        if (
          !error.message?.includes('duplicado') &&
          !error.message?.includes('ya existe')
        ) {
          this.logger.error(`❌ Error creando ${prod.name}: ${error.message}`);
        }
      }
    }
  }

  private async seedRewards() {
    this.logger.log('🎁 Creando Recompensas de Wallet...');

    // Usamos 'any' temporalmente si CreateRewardDto es estricto, o mapeamos correctamente
    const rewards = [
      {
        name: 'Donación: Plantar un Árbol',
        description: 'Ayuda a la reforestación del Amazonas.',
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
      {
        name: 'Cupón 20% OFF',
        description: 'Gran descuento para usuarios comprometidos.',
        costInPoints: 800,
        type: RewardType.COUPON,
        isActive: true,
        metadata: { discountPercentage: 20, validDays: 60 },
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
