# 🌱 EcoShop Backend API

> **Plataforma de E-commerce Sostenible & Trazabilidad de Impacto**

Backend RESTful desarrollado con **NestJS** para EcoShop, una plataforma que conecta marcas sostenibles con consumidores responsables. Este sistema no solo gestiona transacciones, sino que calcula la huella de carbono de cada producto y recompensa a los usuarios a través de una **Eco-Wallet** gamificada.

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-FE0902?style=for-the-badge&logo=typeorm&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=stripe&logoColor=white)

## 🚀 Características Principales

Este backend orquesta la lógica de negocio para tres actores principales: **Usuarios (Compradores)**, **Marcas (Vendedores)** y **Administradores**.

- **🛒 Gestión de Catálogo Sostenible:** Productos con desglose de materiales y certificaciones (Fair Trade, Cruelty Free).
- **🌍 Cálculo de Impacto Ambiental:** Algoritmo automático que estima la huella de carbono (CO₂e) y uso de agua basado en el peso y composición del producto.
- **👛 Eco-Wallet (Gamificación):** Sistema de puntos donde las compras sostenibles generan crédito para canjear por descuentos, donaciones o productos.
- **💳 Pasarela de Pagos:** Integración completa con **Stripe** (Checkout Sessions y Webhooks).
- **📊 Dashboard de Marcas:** Métricas de ventas y visualización del impacto positivo generado.
- **🔐 Seguridad:** Autenticación vía JWT y roles de usuario (Guards).

## 🛠️ Stack Tecnológico

* **Core:** NestJS 11, TypeScript.
* **Base de Datos:** MySQL, TypeORM.
* **Pagos:** Stripe API.
* **Imágenes:** Cloudinary (Almacenamiento y optimización).
* **Mailing:** Nodemailer / Handlebars.
* **Documentación:** Swagger (OpenAPI 3.0).

## 📋 Prerrequisitos

Asegúrate de tener instalado:
* [Node.js](https://nodejs.org/) (v18 o superior)
* [MySQL](https://www.mysql.com/) (v8.0 recomendado)
* [NPM](https://www.npmjs.com/)

## ⚙️ Instalación y Configuración

1.  **Clonar el repositorio**
    ```bash
    git clone [https://github.com/nocountry/ecoshop-back.git](https://github.com/nocountry/ecoshop-back.git)
    cd ecoshop-back
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**
    Crea un archivo `.env` en la raíz del proyecto. Puedes basarte en el siguiente ejemplo:

    ```ini
    # Servidor
    PORT=3000

    # Base de Datos (MySQL)
    DB_HOST=localhost
    DB_PORT=3306
    DB_USERNAME=tu_usuario
    DB_PASSWORD=tu_contraseña
    DB_NAME=ecoshop_db

    # Autenticación (JWT / Auth0)
    JWT_SECRET=tu_secreto_super_seguro
    
    # Cloudinary (Imágenes)
    CLOUDINARY_CLOUD_NAME=tu_cloud_name
    CLOUDINARY_API_KEY=tu_api_key
    CLOUDINARY_API_SECRET=tu_api_secret

    # Stripe (Pagos)
    STRIPE_SECRET_KEY=sk_test_...
    STRIPE_WEBHOOK_SECRET=whsec_...

    # Nodemailer (Emails)
    MAIL_HOST=smtp.example.com
    MAIL_USER=user@example.com
    MAIL_PASS=password
    ```

4.  **Levantar el servidor en desarrollo**
    ```bash
    npm run start:dev
    ```
    *El servidor iniciará en `http://localhost:3000`*

## 📚 Documentación de la API

Una vez que el servidor esté corriendo, puedes acceder a la documentación interactiva generada con Swagger para probar los endpoints directamente:

📍 **URL:** `http://localhost:3000/api/docs` (o la ruta configurada en `main.ts`)

## 🧪 Testing

El proyecto incluye tests unitarios y e2e configurados con Jest.

```bash
# Correr tests unitarios
npm run test

# Correr test coverage
npm run test:cov
```

🤝 Contribución
Este proyecto es parte de una simulación de entorno laboral (NoCountry).

Crea un branch para tu feature (git checkout -b feature/nueva-feature).

Haz commit de tus cambios (git commit -m 'Add: nueva feature').

Haz push al branch (git push origin feature/nueva-feature).

Abre un Pull Request.

⌨️ con ❤️ por el equipo de EcoShop