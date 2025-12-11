import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { SeedService } from 'src/seed/seed.service';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

describe('Products Module E2E', () => {
  let app: INestApplication;
  let seedService: SeedService;
  let dataSource: DataSource;

  jest.setTimeout(60000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    seedService = moduleFixture.get<SeedService>(SeedService);

    await dataSource.dropDatabase();
    await dataSource.synchronize();

    seedService = moduleFixture.get<SeedService>(SeedService);
    await seedService.runSeed();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /products', () => {
    it('Debería retornar una lista de productos poblada', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      if (!Array.isArray(body) && !Array.isArray(body.data)) {
        console.log(
          '🚨 Respuesta inesperada GET /products:',
          JSON.stringify(body, null, 2),
        );
      }

      const products = Array.isArray(body) ? body : body.data;

      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      const product = products[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('environmentalImpact');
      expect(product).toHaveProperty('brand');
      global.testProductSlug = product.slug;
    });
  });

  describe('GET /products/{term}', () => {
    it('Debería buscar un producto por su Slug', async () => {
      const targetSlug = global.testProductSlug;

      if (!targetSlug) {
        throw new Error('No se pudo obtener un slug del test anterior');
      }

      const response = await request(app.getHttpServer())
        .get(`/products/${targetSlug}`)
        .expect(200);

      const body = response.body;
      const product = body.data ? body.data : body;

      expect(product.slug).toBe(targetSlug);
    });

    it('Debería retornar 404 si el producto no existe', async () => {
      await request(app.getHttpServer())
        .get('/products/slug-que-no-existe-123')
        .expect(404);
    });
  });
});
