import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const swaggerConfig = (app: INestApplication<any>) => {
  const config = new DocumentBuilder()
    .setTitle('EcoShop E-commerce')
    .setDescription(
      'API de EcoShop para la gestion de productos sostenibles y ecologicos',
    )
    .setVersion('1.0')
    .addTag('products', 'operaciones relacionadas con productos')
    .addTag('certifications', 'operaciones de certificaciones')
    .addTag('orders', 'gestion de ordenes')
    .addTag('users', 'gestion de usuarios')
    .addTag('brands', 'gestion de marcas')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
  });
};
