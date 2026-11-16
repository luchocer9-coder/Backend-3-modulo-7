import fs from 'node:fs/promises';
import path from 'node:path';
import supertest from 'supertest';
import { expect } from 'chai';
import app from '../src/app.js';
import { UserModel } from '../src/models/user.model.js';
import { ProductModel } from '../src/models/product.model.js';
import { OrderModel } from '../src/models/order.model.js';
import { DeliveryModel } from '../src/models/delivery.model.js';
import { ERRORS } from '../src/errors/error-dictionary.js';
import { USER_ROLES } from '../src/constants/index.js';
import { UPLOADS_ROOT } from '../src/config/multer.config.js';

// Supertest usa la app directamente, sin abrir un puerto
export const request = supertest(app);

export const MODELS = [UserModel, ProductModel, OrderModel, DeliveryModel];

// Un id con formato válido que no existe en la base
export const NON_EXISTENT_ID = '6af38d8e956809dfdcdde899';

// Borra todos los datos de la base de testing
export const clearDatabase = async () => {
  await Promise.all(MODELS.map((Model) => Model.deleteMany({})));
};

let userCounter = 0;

const createUser = async (role, overrides = {}) => {
  userCounter += 1;
  const user = await UserModel.create({
    name: `Usuario Test ${userCounter}`,
    email: `usuario.test.${userCounter}@test.com`,
    password: 'password-de-prueba',
    role,
    ...overrides,
  });
  return user.toObject();
};

export const createClient = (overrides) => createUser(USER_ROLES.USER, overrides);
export const createDriver = (overrides) => createUser(USER_ROLES.DRIVER, overrides);

export const validOrderBody = (userId) => ({
  user: String(userId),
  address: 'Av. Siempre Viva 742, Buenos Aires',
  priority: 'HIGH',
  items: [
    { description: 'Caja mediana', quantity: 2, unitPrice: 1500 },
    { description: 'Cinta', quantity: 1, unitPrice: 300 },
  ],
});

// Crea un pedido por la API y devuelve el pedido creado
export const createOrder = async (userId) => {
  const res = await request.post('/api/orders').send(validOrderBody(userId));
  expect(res.status).to.equal(201);
  return res.body.payload;
};

// Valida el status y el formato de error del módulo de errores
export const expectError = (res, statusCode, code) => {
  expect(res.status).to.equal(statusCode);
  expect(res.body).to.have.all.keys('status', 'statusCode', 'code', 'message', 'details', 'path', 'timestamp');
  expect(res.body.status).to.equal('error');
  expect(res.body.statusCode).to.equal(statusCode);
  expect(res.body.code).to.equal(code);
  expect(res.body.message).to.equal(ERRORS[code].message);
  expect(new Date(res.body.timestamp).toString()).to.not.equal('Invalid Date');
};

// Archivos de prueba: se generan en memoria, no hace falta tenerlos en disco
export const TEST_FILES = {
  pdf: { buffer: Buffer.from('%PDF-1.4 documento de prueba'), filename: 'dni.pdf', contentType: 'application/pdf' },
  png: { buffer: Buffer.from('imagen de prueba'), filename: 'comprobante.png', contentType: 'image/png' },
  txt: { buffer: Buffer.from('texto plano'), filename: 'notas.txt', contentType: 'text/plain' },
};

// Borra la carpeta de archivos que generan los tests
export const clearUploads = async () => {
  await fs.rm(UPLOADS_ROOT, { recursive: true, force: true });
};

// Cuenta los archivos que quedaron guardados en una subcarpeta
export const countUploadedFiles = async (folder) => {
  try {
    return (await fs.readdir(path.join(UPLOADS_ROOT, folder))).length;
  } catch {
    return 0;
  }
};
