import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

import { Brand } from '../../brands/entities/brand.entity';
import { Certification } from '../../certifications/entities/certification.entity';
import {
  Product,
  RecyclabilityStatus,
} from '../../products/entities/product.entity';
import {
  EnvironmentalImpact,
  EcoBadgeLevel,
} from '../../products/entities/environmental-impact.entity';
import { MaterialProduct } from '../../products/entities/material-product.entity';
import { MaterialComposition } from '../../products/entities/material-composition.entity';

interface BrandData {
  name: string;
  description: string;
}

interface CertificationData {
  name: string;
  badgeUrl: string;
  description: string;
}

interface EnvironmentalImpactData {
  recycledContent: number;
  ecoBadgeLevel: EcoBadgeLevel;
}

interface MaterialCompositionData {
  name: string;
  isEcoFriendly: boolean;
  carbonFootprintPerKg: number;
  waterUsagePerKg: number;
}

interface MaterialProductData {
  materialComposition: MaterialCompositionData;
  percentage: number;
}

interface ProductData {
  slug: string;
  name: string;
  image: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  originCountry: string;
  weightKg: number;
  recyclabilityStatus: RecyclabilityStatus;
  imageAltText: string;
  brandName: string;
  certificationNames: string[];
  environmentalImpact: EnvironmentalImpactData;
  materials: MaterialProductData[];
}

interface SeedData {
  brands: BrandData[];
  certifications: CertificationData[];
  products: ProductData[];
}

// CONFIG DE LA DB
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3036,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    Brand,
    Certification,
    Product,
    EnvironmentalImpact,
    MaterialProduct,
    MaterialComposition,
  ],
  synchronize: true,
  logging: true,
});

async function runSeed() {
  console.log('🌱 Iniciando seed...\n');

  // CONECTAR A LA DB
  await dataSource.initialize();
  console.log('✅ Conectado a la DB\n');

  // LEER EL ARCHIVO JSON
  const jsonPath = path.join(__dirname, 'products.json');
  const jsonData = fs.readFileSync(jsonPath, 'utf-8');
  const data: SeedData = JSON.parse(jsonData) as SeedData;

  // CREAR MARCAS
  console.log('✅ Creando marcas...');
  const brands: Record<string, Brand> = {};

  for (const brandData of data.brands) {
    const brand = await dataSource.getRepository(Brand).save({
      name: brandData.name,
      description: brandData.description,
    });
    brands[brand.name] = brand; // Guardao en memoria
    console.log(`   ✓ ${brand.name}`);
  }
  console.log('');

  // CREAR CERTIFICADOS
  console.log('✅ Creando certificados...');
  const certifications: Record<string, Certification> = {};

  for (const certData of data.certifications) {
    const cert = await dataSource.getRepository(Certification).save({
      name: certData.name,
      badgeUrl: certData.badgeUrl,
      description: certData.description,
    });
    certifications[cert.name] = cert; // Guardao en memoria
    console.log(`   ✓ ${cert.name}`);
  }
  console.log('');

  // CREAR COMPOSICIONES DE MATERIALES
  console.log('✅ Creando composiciones de TODOS los materiales...');
  const materialsMap: Record<string, MaterialComposition> = {};

  const allMaterialsRaw = data.products.flatMap((p) =>
    p.materials.map((m) => m.materialComposition),
  );

  // Filtrado por nombre
  const uniqueMaterialsMap = new Map<string, MaterialCompositionData>();
  allMaterialsRaw.forEach((m) => uniqueMaterialsMap.set(m.name, m));

  for (const mcData of uniqueMaterialsMap.values()) {
    const composition = await dataSource
      .getRepository(MaterialComposition)
      .save({
        name: mcData.name,
        isEcoFriendly: mcData.isEcoFriendly,
        carbonFootprintPerKg: mcData.carbonFootprintPerKg,
        waterUsagePerKg: mcData.waterUsagePerKg,
      });
    materialsMap[composition.name] = composition; // Guardao en memoria
    console.log(`   ✓ ${composition.name}`);
  }
  console.log('');

  // CREAR PRODUCTOS
  console.log('✅  Creando productos...');

  for (const productData of data.products) {
    // Crear certificados
    const productCertifications = productData.certificationNames
      .map((name: string) => certifications[name])
      .filter((cert): cert is Certification => cert !== undefined);

    // Crear producto
    const product = await dataSource.getRepository(Product).save({
      slug: productData.slug,
      name: productData.name,
      image: productData.image,
      description: productData.description,
      price: productData.price,
      stock: productData.stock,
      sku: productData.sku,
      originCountry: productData.originCountry,
      weightKg: productData.weightKg,
      recyclabilityStatus: productData.recyclabilityStatus,
      imageAltText: productData.imageAltText,
      brand: brands[productData.brandName], //  manyToOne
      certifications: productCertifications, // manyToMany
    });

    console.log(`   ✓ ${product.name}`);

    // Crear impacto ambiental
    await dataSource.getRepository(EnvironmentalImpact).save({
      recycledContent: productData.environmentalImpact.recycledContent,
      ecoBadgeLevel: productData.environmentalImpact.ecoBadgeLevel,
      product: product,
    });

    // Crear MaterialProduct
    for (const matData of productData.materials) {
      const compositionEntity = materialsMap[matData.materialComposition.name];

      if (compositionEntity) {
        await dataSource.getRepository(MaterialProduct).save({
          percentage: matData.percentage,
          materialComposition: compositionEntity, // ENTIDAD COMPLETA
          product: product, // ENTIDAD PRODUCTO ACTUAL
        });
      } else {
        console.warn(
          `Material no encontraddo: ${matData.materialComposition.name}`,
        );
      }
    }
  }

  console.log('\n💪 Seed completo\n');
  console.log('Total creado:');
  console.log(`   • ${Object.keys(brands).length} marcas`);
  console.log(`   • ${Object.keys(certifications).length} certificados`);
  console.log(`   • ${Object.keys(materialsMap).length} tipos de materiales`);
  console.log(`   • ${data.products.length} productos\n`);

  // CERRAR PROCESOS
  await dataSource.destroy();
}

// npm run seed
runSeed().catch((error: Error) => {
  console.error('❌ Error durante el seed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
