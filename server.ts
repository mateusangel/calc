import 'dotenv/config';
import Fastify from 'fastify';
import middie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { PrismaClient } from '@prisma/client';
import jwt from '@fastify/jwt';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'calcplace-development-secret-change-me';

// Default initial datasets to seed into Prisma if empty
const SEED_MARKETPLACES = [
  { id: 'shopee', name: 'Shopee', commissionPercent: 14.0, fixedFee: 4.00, freeShippingThreshold: 19.00, shippingSubsidy: 0, payoutDays: 7, color: '#EE4D2D' },
  { id: 'mercadolivre', name: 'Mercado Livre (Clássico)', commissionPercent: 13.0, fixedFee: 6.00, freeShippingThreshold: 79.00, shippingSubsidy: 0, payoutDays: 14, color: '#FFE600' },
  { id: 'amazon', name: 'Amazon Brasil', commissionPercent: 15.0, fixedFee: 0.00, freeShippingThreshold: 0, shippingSubsidy: 0, payoutDays: 14, color: '#FF9900' },
  { id: 'shein', name: 'Shein Marketplace', commissionPercent: 12.0, fixedFee: 0.00, freeShippingThreshold: 69.00, shippingSubsidy: 0, payoutDays: 15, color: '#222222' },
  { id: 'tiktok', name: 'TikTok Shop', commissionPercent: 9.0, fixedFee: 2.00, freeShippingThreshold: 29.00, shippingSubsidy: 0, payoutDays: 7, color: '#000000' },
  { id: 'magalu', name: 'Magazine Luiza', commissionPercent: 16.0, fixedFee: 3.00, freeShippingThreshold: 79.00, shippingSubsidy: 0, payoutDays: 30, color: '#0086FF' },
];

const SEED_SUPPLIERS = [
  {
    id: 'sup-1',
    name: 'Couros Nobre SP',
    cnpj: '18.234.567/0001-89',
    contactName: 'Carlos Eduardo',
    phone: '(11) 98452-1100',
    email: 'comercial@courosnobre.com.br',
    leadTimeDays: 4,
    notes: 'Excelente acabamento em couro legítimo. Pontualidade na entrega.',
  },
  {
    id: 'sup-2',
    name: 'Têxtil Santa Catarina',
    cnpj: '24.981.332/0001-45',
    contactName: 'Mariana Silva',
    phone: '(47) 99123-4567',
    email: 'vendas@textilsc.com.br',
    leadTimeDays: 5,
    notes: 'Fornecedor de malhas 100% algodão penteado 30.1. MOQ 100 peças.',
  },
  {
    id: 'sup-3',
    name: 'Importadora Delta Tech',
    cnpj: '33.109.876/0001-12',
    contactName: 'Roberto Chen',
    phone: '(11) 97788-9900',
    email: 'contato@deltatech.com.br',
    leadTimeDays: 7,
    notes: 'Importação direta de eletrônicos homologados Anatel.',
  },
];

const SEED_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Cinto Social Masculino Couro Legítimo Dupla Face',
    sku: 'CNT-SOC-01',
    ean: '7898956230014',
    category: 'Acessórios & Moda',
    brand: 'Vanguard Leather',
    description: 'Cinto social em couro legítimo bovino, fivela giratória dupla face.',
    acquisitionCost: 12.00,
    packagingCost: 1.50,
    otherCosts: 0.50,
    targetMargin: 20.0,
    taxRate: 6.0,
    adCostPercent: 4.5,
    stock: 125,
    minStock: 25,
    supplierId: 'sup-1',
    imageUrl: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=400&auto=format&fit=crop&q=80',
    marketplacePrices: JSON.stringify([
      { marketplaceId: 'shopee', price: 39.90, active: true },
      { marketplaceId: 'mercadolivre', price: 44.90, active: true },
      { marketplaceId: 'amazon', price: 42.90, active: true },
      { marketplaceId: 'shein', price: 39.90, active: true },
      { marketplaceId: 'tiktok', price: 37.90, active: true },
    ]),
    channelStock: JSON.stringify({ shopee: 35, mercadolivre: 40, amazon: 20, shein: 15, tiktok: 10, reserved: 5 }),
    dimensions: JSON.stringify({ lengthCm: 120, widthCm: 3.5, heightCm: 0.5 }),
    weightKg: 0.22,
    notes: 'Item de alto giro e baixa taxa de devolução.',
  },
  {
    id: 'prod-2',
    name: 'Fone de Ouvido Bluetooth TWS Pro Cancelamento de Ruído',
    sku: 'FON-TWS-PRO',
    ean: '7898956230021',
    category: 'Eletrônicos & Áudio',
    brand: 'AcousticWave',
    description: 'Fone sem fio Bluetooth 5.3 com display digital LED e case recarregável.',
    acquisitionCost: 32.50,
    packagingCost: 2.20,
    otherCosts: 1.00,
    targetMargin: 22.0,
    taxRate: 6.0,
    adCostPercent: 6.0,
    stock: 14,
    minStock: 30,
    supplierId: 'sup-3',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80',
    marketplacePrices: JSON.stringify([
      { marketplaceId: 'shopee', price: 79.90, active: true },
      { marketplaceId: 'mercadolivre', price: 89.90, active: true },
      { marketplaceId: 'amazon', price: 84.90, active: true },
      { marketplaceId: 'tiktok', price: 74.90, active: true },
    ]),
    channelStock: JSON.stringify({ shopee: 5, mercadolivre: 5, amazon: 2, shein: 0, tiktok: 2, reserved: 0 }),
    dimensions: JSON.stringify({ lengthCm: 8, widthCm: 6, heightCm: 4 }),
    weightKg: 0.15,
    notes: 'Alerta de estoque baixo! Abaixo do estoque mínimo.',
  },
  {
    id: 'prod-3',
    name: 'Ring Light LED 26cm com Tripé Profissional 2.10m',
    sku: 'RNG-LED-26',
    ean: '7898956230038',
    category: 'Foto & Vídeo',
    brand: 'LuminaPro',
    description: 'Iluminador LED 10 polegadas, 3 tonalidades de luz e ajuste contínuo de brilho.',
    acquisitionCost: 23.80,
    packagingCost: 3.50,
    otherCosts: 0.80,
    targetMargin: 20.0,
    taxRate: 6.0,
    adCostPercent: 5.0,
    stock: 48,
    minStock: 20,
    supplierId: 'sup-3',
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80',
    marketplacePrices: JSON.stringify([
      { marketplaceId: 'shopee', price: 59.90, active: true },
      { marketplaceId: 'mercadolivre', price: 68.90, active: true },
      { marketplaceId: 'amazon', price: 64.90, active: true },
      { marketplaceId: 'shein', price: 58.90, active: true },
    ]),
    channelStock: JSON.stringify({ shopee: 15, mercadolivre: 18, amazon: 10, shein: 5, tiktok: 0, reserved: 2 }),
    dimensions: JSON.stringify({ lengthCm: 35, widthCm: 30, heightCm: 7 }),
    weightKg: 0.75,
    notes: 'Produto com boa margem no Mercado Livre e Amazon.',
  },
  {
    id: 'prod-4',
    name: 'Garrafa Térmica Inox 500ml Display Digital LED',
    sku: 'GAR-INOX-500',
    ean: '7898956230045',
    category: 'Casa & Utilidades',
    brand: 'ThermoSmart',
    description: 'Garrafa térmica com sensor de temperatura touch na tampa, isolamento duplo a vácuo.',
    acquisitionCost: 15.50,
    packagingCost: 1.80,
    otherCosts: 0.50,
    targetMargin: 25.0,
    taxRate: 6.0,
    adCostPercent: 4.0,
    stock: 68,
    minStock: 25,
    supplierId: 'sup-1',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&auto=format&fit=crop&q=80',
    marketplacePrices: JSON.stringify([
      { marketplaceId: 'shopee', price: 42.90, active: true },
      { marketplaceId: 'mercadolivre', price: 48.90, active: true },
      { marketplaceId: 'amazon', price: 46.90, active: true },
      { marketplaceId: 'tiktok', price: 39.90, active: true },
    ]),
    channelStock: JSON.stringify({ shopee: 20, mercadolivre: 25, amazon: 15, shein: 0, tiktok: 8, reserved: 3 }),
    dimensions: JSON.stringify({ lengthCm: 23, widthCm: 7, heightCm: 7 }),
    weightKg: 0.32,
    notes: 'Alta procura para brindes e presentes corporativos.',
  },
  {
    id: 'prod-5',
    name: 'Camiseta Básica Masculina Algodão Penteado 30.1',
    sku: 'CAM-ALG-301',
    ean: '7898956230052',
    category: 'Vestuário & Moda',
    brand: 'UrbanCotton',
    description: 'Camiseta gola redonda reforçada, malha premium 100% algodão penteado 30.1.',
    acquisitionCost: 16.50,
    packagingCost: 1.20,
    otherCosts: 0.30,
    targetMargin: 18.0,
    taxRate: 6.0,
    adCostPercent: 3.5,
    stock: 110,
    minStock: 40,
    supplierId: 'sup-2',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80',
    marketplacePrices: JSON.stringify([
      { marketplaceId: 'shopee', price: 32.90, active: true },
      { marketplaceId: 'mercadolivre', price: 45.90, active: true },
      { marketplaceId: 'shein', price: 34.90, active: true },
      { marketplaceId: 'tiktok', price: 33.90, active: true },
    ]),
    channelStock: JSON.stringify({ shopee: 35, mercadolivre: 35, amazon: 0, shein: 25, tiktok: 15, reserved: 8 }),
    dimensions: JSON.stringify({ lengthCm: 30, widthCm: 22, heightCm: 2 }),
    weightKg: 0.18,
    notes: 'Margem na Shopee reduzida devido à taxa fixa de R$ 4,00.',
  },
];

async function seedDatabaseIfEmpty() {
  try {
    const organization = await prisma.organization.upsert({
      where: { slug: 'empresa-demo' },
      update: {},
      create: { name: 'Empresa Demo', slug: 'empresa-demo' },
    });
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await prisma.user.upsert({
      where: { email: 'admin@calcplace.com' },
      update: { organizationId: organization.id },
      create: {
        name: 'Administrador',
        email: 'admin@calcplace.com',
        passwordHash: await bcrypt.hash(adminPassword, 10),
        organizationId: organization.id,
      },
    });

    const organizationId = organization.id;
    const marketplaceCount = await prisma.marketplaceConfig.count({ where: { organizationId } });
    if (marketplaceCount === 0) {
      console.log('Seeding initial marketplaces into Prisma ORM...');
      for (const mkt of SEED_MARKETPLACES) {
        await prisma.marketplaceConfig.create({ data: { ...mkt, organizationId } });
      }
    }

    const supplierCount = await prisma.supplier.count({ where: { organizationId } });
    if (supplierCount === 0) {
      console.log('Seeding initial suppliers into Prisma ORM...');
      for (const sup of SEED_SUPPLIERS) {
        await prisma.supplier.create({ data: { ...sup, organizationId } });
      }
    }

    const productCount = await prisma.product.count({ where: { organizationId } });
    if (productCount === 0) {
      console.log('Seeding initial products into Prisma ORM...');
      for (const prod of SEED_PRODUCTS) {
        await prisma.product.create({ data: { ...prod, organizationId } });
      }

      // Seed initial sales
      await prisma.sale.createMany({
        data: [
          {
            orderNumber: 'PED-94812',
            productId: 'prod-1',
            marketplaceId: 'mercadolivre',
            marketplaceName: 'Mercado Livre',
            quantity: 2,
            unitPrice: 44.90,
            totalAmount: 89.80,
            commissionAmount: 11.67,
            fixedFeeAmount: 6.00,
            taxAmount: 5.39,
            costOfGoods: 27.00,
            netProfit: 39.74,
            marginPercent: 44.25,
            status: 'concluida',
            saleDate: new Date('2026-08-28T14:30:00Z'),
          },
          {
            orderNumber: 'PED-94813',
            productId: 'prod-2',
            marketplaceId: 'shopee',
            marketplaceName: 'Shopee',
            quantity: 1,
            unitPrice: 79.90,
            totalAmount: 79.90,
            commissionAmount: 11.19,
            fixedFeeAmount: 4.00,
            taxAmount: 4.79,
            costOfGoods: 35.70,
            netProfit: 24.22,
            marginPercent: 30.31,
            status: 'concluida',
            saleDate: new Date('2026-08-29T10:15:00Z'),
          },
          {
            orderNumber: 'PED-94814',
            productId: 'prod-4',
            marketplaceId: 'amazon',
            marketplaceName: 'Amazon',
            quantity: 1,
            unitPrice: 46.90,
            totalAmount: 46.90,
            commissionAmount: 7.04,
            fixedFeeAmount: 0.00,
            taxAmount: 2.81,
            costOfGoods: 17.80,
            netProfit: 19.25,
            marginPercent: 41.04,
            status: 'concluida',
            saleDate: new Date('2026-08-30T16:40:00Z'),
          },
        ].map((sale) => ({ ...sale, organizationId })),
      });

      // Seed initial inventory movement
      await prisma.inventoryMovement.createMany({
        data: [
          {
            productId: 'prod-1',
            type: 'entrada',
            quantity: 50,
            previousStock: 75,
            newStock: 125,
            reason: 'Recebimento de lote do fornecedor Couros Nobre SP (NF 4521)',
            createdAt: new Date('2026-08-25T11:00:00Z'),
          },
          {
            productId: 'prod-2',
            type: 'saida',
            quantity: 10,
            previousStock: 24,
            newStock: 14,
            reason: 'Vendas acumuladas na semana Shopee/Mercado Livre',
            createdAt: new Date('2026-08-28T18:00:00Z'),
          },
        ].map((movement) => ({ ...movement, organizationId })),
      });
      console.log('Prisma ORM database seeding completed successfully.');
    }
  } catch (error) {
    console.error('Error during database initialization/seeding:', error);
  }
}

async function ensureSystemAccount() {
  const organization = await prisma.organization.upsert({
    where: { slug: 'empresa-demo' },
    update: {},
    create: { name: 'Empresa Demo', slug: 'empresa-demo' },
  });
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  await prisma.user.upsert({
    where: { email: 'admin@calcplace.com' },
    update: { organizationId: organization.id },
    create: {
      name: 'Administrador',
      email: 'admin@calcplace.com',
      passwordHash: await bcrypt.hash(adminPassword, 10),
      organizationId: organization.id,
    },
  });
  await ensureMarketplaceConfigs(organization.id);
}

async function ensureMarketplaceConfigs(organizationId: string) {
  for (const marketplace of SEED_MARKETPLACES) {
    await prisma.marketplaceConfig.upsert({
      where: { organizationId_id: { organizationId, id: marketplace.id } },
      update: {},
      create: { ...marketplace, organizationId },
    });
  }
}

async function startServer() {
  const fastify = Fastify({
    logger: {
      level: 'info',
    },
  });

  await fastify.register(jwt, {
    secret: JWT_SECRET,
    sign: { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  });

  fastify.addHook('onRequest', async (request, reply) => {
    if (!request.url.startsWith('/api/') || request.url === '/api/health' || request.url.startsWith('/api/auth/')) return;
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ ok: false, error: 'Autenticação necessária.' });
    }
  });

  // Enable middie for middleware support (needed for Vite dev server)
  await fastify.register(middie);

  // Initialize only the system account. Business data is never generated by the server.
  await ensureSystemAccount();

  // ==========================================
  // REST API ROUTES (Node.js + Fastify + Prisma)
  // ==========================================

  // Health check & System info
  fastify.get('/api/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      backend: 'Node.js + Fastify',
      orm: 'Prisma ORM',
      nodeVersion: process.version,
    };
  });

  fastify.post('/api/auth/login', async (request, reply) => {
    const body = request.body as { email?: string; password?: string };
    const user = body.email ? await prisma.user.findUnique({
      where: { email: body.email.toLowerCase().trim() },
      include: { organization: true },
    }) : null;
    if (!user || !body.password || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return reply.status(401).send({ ok: false, error: 'E-mail ou senha inválidos.' });
    }
    const token = fastify.jwt.sign({ userId: user.id, organizationId: user.organizationId, role: user.role });
    return { ok: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role, organization: user.organization } };
  });

  fastify.post('/api/auth/register', async (request, reply) => {
    const body = request.body as { name?: string; companyName?: string; email?: string; password?: string };
    const email = body.email?.toLowerCase().trim();
    if (!body.name?.trim() || !body.companyName?.trim() || !email || !body.password || body.password.length < 6) {
      return reply.status(400).send({ ok: false, error: 'Nome, empresa, e-mail e senha (mínimo 6 caracteres) são obrigatórios.' });
    }
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(409).send({ ok: false, error: 'Este e-mail já está cadastrado.' });
      }
      const slug = `${body.companyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
      const { organization, user } = await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({ data: { name: body.companyName!.trim(), slug } });
        await tx.marketplaceConfig.createMany({
          data: SEED_MARKETPLACES.map((marketplace) => ({ ...marketplace, organizationId: organization.id })),
        });
        const user = await tx.user.create({
          data: {
            name: body.name!.trim(),
            email,
            passwordHash: await bcrypt.hash(body.password!, 10),
            organizationId: organization.id,
          },
        });
        return { organization, user };
      });
      const token = fastify.jwt.sign({ userId: user.id, organizationId: organization.id, role: user.role });
      return reply.status(201).send({ ok: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role, organization } });
    } catch (error: any) {
      return reply.status(error.code === 'P2002' ? 409 : 400).send({ ok: false, error: error.code === 'P2002' ? 'Este e-mail já está cadastrado.' : error.message });
    }
  });

  // Products API
  fastify.get('/api/products', async (request, reply) => {
    try {
      const organizationId = (request as any).user.organizationId;
      const products = await prisma.product.findMany({
        where: { organizationId },
        include: { supplier: true },
        orderBy: { createdAt: 'desc' },
      });
      return { ok: true, data: products };
    } catch (error: any) {
      reply.status(500).send({ ok: false, error: error.message });
    }
  });

  fastify.post('/api/products', async (request, reply) => {
    try {
      const organizationId = (request as any).user.organizationId;
      const body = request.body as any;
      if (body.supplierId) {
        const supplier = await prisma.supplier.findFirst({ where: { id: body.supplierId, organizationId } });
        if (!supplier) return reply.status(400).send({ ok: false, error: 'Fornecedor inválido para esta empresa.' });
      }
      const product = await prisma.product.create({
        data: {
          organizationId,
          name: body.name,
          sku: body.sku,
          ean: body.ean || null,
          category: body.category || 'Geral',
          brand: body.brand || null,
          description: body.description || null,
          acquisitionCost: parseFloat(body.acquisitionCost) || 0,
          packagingCost: parseFloat(body.packagingCost) || 0,
          otherCosts: parseFloat(body.otherCosts) || 0,
          targetMargin: parseFloat(body.targetMargin) || 20,
          taxRate: parseFloat(body.taxRate) || 6,
          adCostPercent: parseFloat(body.adCostPercent) || 0,
          stock: parseInt(body.stock, 10) || 0,
          minStock: parseInt(body.minStock, 10) || 5,
          supplierId: body.supplierId || null,
          imageUrl: body.imageUrl || null,
          marketplacePrices: typeof body.marketplacePrices === 'string' ? body.marketplacePrices : JSON.stringify(body.marketplacePrices || []),
          channelStock: typeof body.channelStock === 'string' ? body.channelStock : JSON.stringify(body.channelStock || {}),
          dimensions: typeof body.dimensions === 'string' ? body.dimensions : JSON.stringify(body.dimensions || {}),
          weightKg: body.weightKg ? parseFloat(body.weightKg) : null,
          notes: body.notes || null,
        },
        include: { supplier: true },
      });
      return { ok: true, data: product };
    } catch (error: any) {
      reply.status(400).send({ ok: false, error: error.message });
    }
  });

  fastify.put('/api/products/:id', async (request, reply) => {
    try {
      const organizationId = (request as any).user.organizationId;
      const { id } = request.params as { id: string };
      const body = request.body as any;
      const ownedProduct = await prisma.product.findFirst({ where: { id, organizationId } });
      if (!ownedProduct) return reply.status(404).send({ ok: false, error: 'Produto não encontrado.' });
      const product = await prisma.product.update({
        where: { id },
        data: {
          name: body.name,
          sku: body.sku,
          ean: body.ean || null,
          category: body.category,
          brand: body.brand || null,
          description: body.description || null,
          acquisitionCost: body.acquisitionCost !== undefined ? parseFloat(body.acquisitionCost) : undefined,
          packagingCost: body.packagingCost !== undefined ? parseFloat(body.packagingCost) : undefined,
          otherCosts: body.otherCosts !== undefined ? parseFloat(body.otherCosts) : undefined,
          targetMargin: body.targetMargin !== undefined ? parseFloat(body.targetMargin) : undefined,
          taxRate: body.taxRate !== undefined ? parseFloat(body.taxRate) : undefined,
          adCostPercent: body.adCostPercent !== undefined ? parseFloat(body.adCostPercent) : undefined,
          stock: body.stock !== undefined ? parseInt(body.stock, 10) : undefined,
          minStock: body.minStock !== undefined ? parseInt(body.minStock, 10) : undefined,
          supplierId: body.supplierId || null,
          imageUrl: body.imageUrl || null,
          marketplacePrices: body.marketplacePrices ? (typeof body.marketplacePrices === 'string' ? body.marketplacePrices : JSON.stringify(body.marketplacePrices)) : undefined,
          channelStock: body.channelStock ? (typeof body.channelStock === 'string' ? body.channelStock : JSON.stringify(body.channelStock)) : undefined,
          dimensions: body.dimensions ? (typeof body.dimensions === 'string' ? body.dimensions : JSON.stringify(body.dimensions)) : undefined,
          weightKg: body.weightKg !== undefined ? parseFloat(body.weightKg) : undefined,
          notes: body.notes !== undefined ? body.notes : undefined,
        },
        include: { supplier: true },
      });
      return { ok: true, data: product };
    } catch (error: any) {
      reply.status(400).send({ ok: false, error: error.message });
    }
  });

  fastify.delete('/api/products/:id', async (request, reply) => {
    try {
      const organizationId = (request as any).user.organizationId;
      const { id } = request.params as { id: string };
      const ownedProduct = await prisma.product.findFirst({ where: { id, organizationId } });
      if (!ownedProduct) return reply.status(404).send({ ok: false, error: 'Produto não encontrado.' });
      await prisma.inventoryMovement.deleteMany({ where: { productId: id, organizationId } });
      await prisma.sale.deleteMany({ where: { productId: id, organizationId } });
      await prisma.product.delete({ where: { id } });
      return { ok: true, message: 'Produto excluído com sucesso.' };
    } catch (error: any) {
      reply.status(400).send({ ok: false, error: error.message });
    }
  });

  // Suppliers API
  fastify.get('/api/suppliers', async (request, reply) => {
    try {
      const organizationId = (request as any).user.organizationId;
      const suppliers = await prisma.supplier.findMany({
        where: { organizationId },
        include: { products: true },
        orderBy: { name: 'asc' },
      });
      return { ok: true, data: suppliers };
    } catch (error: any) {
      reply.status(500).send({ ok: false, error: error.message });
    }
  });

  fastify.post('/api/suppliers', async (request, reply) => {
    try {
      const organizationId = (request as any).user.organizationId;
      const body = request.body as any;
      const supplier = await prisma.supplier.create({
        data: {
          organizationId,
          name: body.name,
          cnpj: body.cnpj || null,
          contactName: body.contactName || null,
          phone: body.phone || null,
          email: body.email || null,
          leadTimeDays: parseInt(body.leadTimeDays, 10) || 7,
          notes: body.notes || null,
        },
      });
      return { ok: true, data: supplier };
    } catch (error: any) {
      reply.status(400).send({ ok: false, error: error.message });
    }
  });

  fastify.put('/api/suppliers/:id', async (request, reply) => {
    try {
      const organizationId = (request as any).user.organizationId;
      const { id } = request.params as { id: string };
      const body = request.body as any;
      const ownedSupplier = await prisma.supplier.findFirst({ where: { id, organizationId } });
      if (!ownedSupplier) return reply.status(404).send({ ok: false, error: 'Fornecedor não encontrado.' });
      const supplier = await prisma.supplier.update({
        where: { id },
        data: {
          name: body.name,
          cnpj: body.cnpj,
          contactName: body.contactName,
          phone: body.phone,
          email: body.email,
          leadTimeDays: body.leadTimeDays !== undefined ? parseInt(body.leadTimeDays, 10) : undefined,
          notes: body.notes,
        },
      });
      return { ok: true, data: supplier };
    } catch (error: any) {
      reply.status(400).send({ ok: false, error: error.message });
    }
  });

  fastify.delete('/api/suppliers/:id', async (request, reply) => {
    try {
      const organizationId = (request as any).user.organizationId;
      const { id } = request.params as { id: string };
      const ownedSupplier = await prisma.supplier.findFirst({ where: { id, organizationId } });
      if (!ownedSupplier) return reply.status(404).send({ ok: false, error: 'Fornecedor não encontrado.' });
      await prisma.product.updateMany({
        where: { supplierId: id, organizationId },
        data: { supplierId: null },
      });
      await prisma.supplier.delete({ where: { id } });
      return { ok: true, message: 'Fornecedor removido com sucesso.' };
    } catch (error: any) {
      reply.status(400).send({ ok: false, error: error.message });
    }
  });

  // Sales API
  fastify.get('/api/sales', async (request, reply) => {
    try {
      const organizationId = (request as any).user.organizationId;
      const sales = await prisma.sale.findMany({
        where: { organizationId },
        include: { product: true },
        orderBy: { saleDate: 'desc' },
      });
      return { ok: true, data: sales };
    } catch (error: any) {
      reply.status(500).send({ ok: false, error: error.message });
    }
  });



  fastify.get('/health', async (request, reply) => {
  return reply.status(200).send({
    status: 'ok',
    service: 'calcplace-api',
    timestamp: new Date().toISOString()
  });
});

  fastify.post('/api/sales', async (request, reply) => {
    try {
      const organizationId = (request as any).user.organizationId;
      const body = request.body as any;
      const qty = parseInt(body.quantity, 10) || 1;

      // Create sale and decrement product physical stock
      const sale = await prisma.$transaction(async (tx) => {
        const product = await tx.product.findFirst({ where: { id: body.productId, organizationId } });
        if (!product) {
          throw new Error('Produto não encontrado');
        }
        const marketplace = await tx.marketplaceConfig.findFirst({ where: { id: body.marketplaceId, organizationId } });
        if (!marketplace) {
          throw new Error('Marketplace não encontrado');
        }

        const quantity = Math.max(1, qty);
        const unitPrice = Number(body.unitPrice);
        const totalAmount = unitPrice * quantity;
        const discountAmount = Math.max(0, Number(body.discountAmount) || 0);
        const effectiveAmount = Math.max(0, totalAmount - discountAmount);
        const variableFeePercent = marketplace.commissionPercent + marketplace.paymentFeePercent + marketplace.campaignFeePercent;
        const commissionAmount = effectiveAmount * (variableFeePercent / 100);
        const fixedFeeAmount = marketplace.fixedFee;
        const taxAmount = effectiveAmount * (product.taxRate / 100);
        const adCost = effectiveAmount * (product.adCostPercent / 100);
        const packagingCost = product.packagingCost * quantity;
        const costOfGoods = (product.acquisitionCost + product.otherCosts) * quantity + packagingCost;
        const shippingCost = Math.max(0, Number(body.shippingCost) || marketplace.shippingSubsidy * quantity);
        const netProfit = effectiveAmount - commissionAmount - fixedFeeAmount - taxAmount - adCost - shippingCost - costOfGoods;
        const marginPercent = effectiveAmount > 0 ? (netProfit / effectiveAmount) * 100 : 0;

        const newSale = await tx.sale.create({
          data: {
            organizationId,
            orderNumber: body.orderNumber || `PED-${Date.now().toString().slice(-6)}`,
            productId: body.productId,
            marketplaceId: body.marketplaceId,
            marketplaceName: body.marketplaceName,
            quantity,
            unitPrice,
            totalAmount: effectiveAmount,
            commissionAmount,
            fixedFeeAmount,
            taxAmount,
            shippingCost,
            adCost,
            packagingCost,
            discountAmount,
            costOfGoods,
            netProfit,
            marginPercent,
            status: body.status || 'concluida',
            saleDate: body.saleDate ? new Date(body.saleDate) : new Date(),
          },
        });

        // Deduct inventory
        const updatedStock = Math.max(0, product.stock - qty);
        await tx.product.update({
          where: { id: body.productId },
          data: { stock: updatedStock },
        });

        await tx.inventoryMovement.create({
          data: {
            organizationId,
            productId: body.productId,
            type: 'saida',
            quantity: qty,
            previousStock: product.stock,
            newStock: updatedStock,
            reason: `Venda ${body.marketplaceName} (Pedido: ${newSale.orderNumber})`,
          },
        });

        return newSale;
      });

      return { ok: true, data: sale };
    } catch (error: any) {
      reply.status(400).send({ ok: false, error: error.message });
    }
  });

  // Inventory API
  fastify.get('/api/inventory/movements', async (request, reply) => {
    try {
      const organizationId = (request as any).user.organizationId;
      const movements = await prisma.inventoryMovement.findMany({
        where: { organizationId },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      });
      return { ok: true, data: movements };
    } catch (error: any) {
      reply.status(500).send({ ok: false, error: error.message });
    }
  });

  fastify.post('/api/inventory/movements', async (request, reply) => {
    try {
      const organizationId = (request as any).user.organizationId;
      const body = request.body as any;
      const qty = Math.abs(parseInt(body.quantity, 10) || 0);
      const type = body.type as 'entrada' | 'saida' | 'ajuste';

      const result = await prisma.$transaction(async (tx) => {
        const product = await tx.product.findFirst({ where: { id: body.productId, organizationId } });
        if (!product) {
          throw new Error('Produto não encontrado');
        }

        let newStock = product.stock;
        if (type === 'entrada') newStock += qty;
        else if (type === 'saida') newStock = Math.max(0, newStock - qty);
        else if (type === 'ajuste') newStock = qty;

        await tx.product.update({
          where: { id: body.productId },
          data: { stock: newStock },
        });

        const movement = await tx.inventoryMovement.create({
          data: {
            organizationId,
            productId: body.productId,
            type,
            quantity: qty,
            previousStock: product.stock,
            newStock,
            reason: body.reason || 'Movimentação manual de estoque',
          },
        });

        return { movement, newStock };
      });

      return { ok: true, data: result };
    } catch (error: any) {
      reply.status(400).send({ ok: false, error: error.message });
    }
  });

  // Marketplaces API
  fastify.get('/api/marketplaces', async (request, reply) => {
    try {
      const organizationId = (request as any).user.organizationId;
      const marketplaces = await prisma.marketplaceConfig.findMany({ where: { organizationId } });
      return { ok: true, data: marketplaces };
    } catch (error: any) {
      reply.status(500).send({ ok: false, error: error.message });
    }
  });

  fastify.put('/api/marketplaces/:id', async (request, reply) => {
    try {
      const organizationId = (request as any).user.organizationId;
      const { id } = request.params as { id: string };
      const body = request.body as any;
      const ownedMarketplace = await prisma.marketplaceConfig.findFirst({ where: { id, organizationId } });
      if (!ownedMarketplace) return reply.status(404).send({ ok: false, error: 'Canal não encontrado.' });
      const updated = await prisma.marketplaceConfig.update({
        where: { organizationId_id: { organizationId, id } },
        data: {
          name: body.name,
          commissionPercent: body.commissionPercent !== undefined ? parseFloat(body.commissionPercent) : undefined,
          fixedFee: body.fixedFee !== undefined ? parseFloat(body.fixedFee) : undefined,
          freeShippingThreshold: body.freeShippingThreshold !== undefined ? parseFloat(body.freeShippingThreshold) : undefined,
          shippingSubsidy: body.shippingSubsidy !== undefined ? parseFloat(body.shippingSubsidy) : undefined,
          payoutDays: body.payoutDays !== undefined ? parseInt(body.payoutDays, 10) : undefined,
          paymentFeePercent: body.paymentFeePercent !== undefined ? parseFloat(body.paymentFeePercent) : undefined,
          campaignFeePercent: body.campaignFeePercent !== undefined ? parseFloat(body.campaignFeePercent) : undefined,
          color: body.color,
        },
      });
      return { ok: true, data: updated };
    } catch (error: any) {
      reply.status(400).send({ ok: false, error: error.message });
    }
  });

  // Server-side Financial Pricing Calculation endpoint
  fastify.post('/api/calculate-price', async (request, reply) => {
    try {
      const {
        acquisitionCost = 0,
        packagingCost = 0,
        otherCosts = 0,
        commissionPercent = 14,
        fixedFee = 4,
        taxPercent = 6,
        adCostPercent = 0,
        desiredMarginPercent = 20,
      } = request.body as any;

      const directCosts = acquisitionCost + packagingCost + otherCosts;
      const totalDeductionRate = (commissionPercent + taxPercent + adCostPercent + desiredMarginPercent) / 100;

      let sellingPrice = directCosts + fixedFee;
      if (totalDeductionRate < 0.999) {
        sellingPrice = (directCosts + fixedFee) / (1 - totalDeductionRate);
      }

      const commission = (sellingPrice * commissionPercent) / 100;
      const taxes = (sellingPrice * taxPercent) / 100;
      const ads = (sellingPrice * adCostPercent) / 100;
      const netProfit = sellingPrice - directCosts - fixedFee - commission - taxes - ads;
      const netMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
      const markup = directCosts > 0 ? sellingPrice / directCosts : 0;

      return {
        ok: true,
        calculation: {
          sellingPrice: Number(sellingPrice.toFixed(2)),
          directCosts: Number(directCosts.toFixed(2)),
          fixedFee: Number(fixedFee.toFixed(2)),
          commissionAmount: Number(commission.toFixed(2)),
          taxesAmount: Number(taxes.toFixed(2)),
          adCostAmount: Number(ads.toFixed(2)),
          netProfit: Number(netProfit.toFixed(2)),
          netMarginPercent: Number(netMargin.toFixed(2)),
          markupMultiplier: Number(markup.toFixed(2)),
        },
      };
    } catch (error: any) {
      reply.status(400).send({ ok: false, error: error.message });
    }
  });

  // ==========================================
  // Vite Integration (Dev) / Static Asset Serving (Prod)
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    fastify.use((req, res, next) => {
      if (req.url?.startsWith('/api/')) {
        next();
        return;
      }
      vite.middlewares(req, res, next);
    });
  } else {
    const rootDistPath = path.join(process.cwd(), 'front', 'dist');
    const distPath = existsSync(rootDistPath) ? rootDistPath : path.join(process.cwd(), 'dist');
    await fastify.register(fastifyStatic, {
      root: distPath,
      prefix: '/',
    });
    fastify.setNotFoundHandler((req, reply) => {
      reply.sendFile('index.html');
    });
  }

  // Bind to host 0.0.0.0 and port 3000
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`[Fastify + Prisma] Server is running on http://0.0.0.0:${PORT}`);
}

startServer().catch((err) => {
  console.error('Fatal error starting Fastify server:', err);
  process.exit(1);
});
