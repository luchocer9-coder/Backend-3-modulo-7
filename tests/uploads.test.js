import fs from 'node:fs/promises';
import { expect } from 'chai';
import { DeliveryModel } from '../src/models/delivery.model.js';
import { MAX_FILE_SIZE_MB } from '../src/config/multer.config.js';
import {
  request,
  clearDatabase,
  clearUploads,
  countUploadedFiles,
  createClient,
  createDriver,
  createOrder,
  expectError,
  NON_EXISTENT_ID,
  TEST_FILES,
} from './helpers.js';

const attach = (req, file, field = 'file') =>
  req.attach(field, file.buffer, { filename: file.filename, contentType: file.contentType });

const expectFileMetadata = (metadata, file, documentType, folder) => {
  expect(metadata).to.include({
    originalName: file.filename,
    mimeType: file.contentType,
    size: file.buffer.length,
    documentType,
  });
  expect(metadata.fileName).to.match(/^\d+-[a-f0-9]{12}\.\w+$/);
  expect(metadata.path).to.equal(`uploads-test/${folder}/${metadata.fileName}`);
  expect(new Date(metadata.uploadedAt).toString()).to.not.equal('Invalid Date');
};

describe('Carga de archivos', () => {
  beforeEach(async () => {
    await clearDatabase();
    await clearUploads();
  });

  describe('POST /api/users/:id/documents', () => {
    let client;

    beforeEach(async () => {
      client = await createClient();
    });

    const uploadDocument = (userId, file, documentType) => {
      const req = request.post(`/api/users/${userId}/documents`);
      if (documentType !== undefined) req.field('documentType', documentType);
      return file ? attach(req, file) : req;
    };

    it('guarda el archivo y registra sus metadatos en el usuario', async () => {
      const res = await uploadDocument(client._id, TEST_FILES.pdf, 'ID_CARD');

      expect(res.status).to.equal(201);
      expect(res.body.payload).to.include({ _id: String(client._id) });
      expect(res.body.payload.documents).to.have.lengthOf(1);

      const [document] = res.body.payload.documents;
      expectFileMetadata(document, TEST_FILES.pdf, 'ID_CARD', 'documents');

      // El archivo existe en el servidor y tiene el contenido enviado
      const content = await fs.readFile(document.path);
      expect(content.equals(TEST_FILES.pdf.buffer)).to.equal(true);
    });

    it('acumula los documentos del usuario', async () => {
      await uploadDocument(client._id, TEST_FILES.pdf, 'ID_CARD');
      await uploadDocument(client._id, TEST_FILES.png, 'PROOF_OF_ADDRESS');

      const res = await request.get(`/api/users/${client._id}`);

      expect(res.status).to.equal(200);
      expect(res.body.payload.documents.map((doc) => doc.documentType)).to.deep.equal(['ID_CARD', 'PROOF_OF_ADDRESS']);
    });

    it('guarda la licencia de un repartidor en la carpeta licenses', async () => {
      const driver = await createDriver();

      const res = await uploadDocument(driver._id, TEST_FILES.pdf, 'DRIVER_LICENSE');

      expect(res.status).to.equal(201);
      expectFileMetadata(res.body.payload.documents[0], TEST_FILES.pdf, 'DRIVER_LICENSE', 'licenses');
      expect(await countUploadedFiles('licenses')).to.equal(1);
      expect(await countUploadedFiles('documents')).to.equal(0);
    });

    it('responde 400 FILE_REQUIRED si no se envía archivo', async () => {
      const res = await uploadDocument(client._id, null, 'ID_CARD');

      expectError(res, 400, 'FILE_REQUIRED');
      expect(res.body.details).to.deep.equal({ field: 'file' });
    });

    it('responde 400 INVALID_DOCUMENT_TYPE con un tipo inexistente y borra el archivo', async () => {
      const res = await uploadDocument(client._id, TEST_FILES.pdf, 'PASAPORTE');

      expectError(res, 400, 'INVALID_DOCUMENT_TYPE');
      expect(res.body.details.received).to.equal('PASAPORTE');
      expect(await countUploadedFiles('documents')).to.equal(0);
    });

    it('responde 400 INVALID_DOCUMENT_TYPE si no se envía el tipo', async () => {
      const res = await uploadDocument(client._id, TEST_FILES.pdf);

      expectError(res, 400, 'INVALID_DOCUMENT_TYPE');
      expect(res.body.details.received).to.equal(null);
    });

    it('responde 400 INVALID_DOCUMENT_TYPE si un cliente sube una licencia', async () => {
      const res = await uploadDocument(client._id, TEST_FILES.pdf, 'DRIVER_LICENSE');

      expectError(res, 400, 'INVALID_DOCUMENT_TYPE');
      expect(res.body.details).to.deep.equal({ received: 'DRIVER_LICENSE', allowed: ['ID_CARD', 'PROOF_OF_ADDRESS'] });
    });

    it('responde 400 INVALID_FILE_TYPE con un archivo no permitido', async () => {
      const res = await uploadDocument(client._id, TEST_FILES.txt, 'ID_CARD');

      expectError(res, 400, 'INVALID_FILE_TYPE');
      expect(await countUploadedFiles('documents')).to.equal(0);
    });

    it('responde 400 INVALID_FILE_TYPE si la extensión no coincide con el tipo', async () => {
      const fake = { ...TEST_FILES.pdf, filename: 'virus.exe' };

      const res = await uploadDocument(client._id, fake, 'ID_CARD');

      expectError(res, 400, 'INVALID_FILE_TYPE');
    });

    it('responde 413 FILE_TOO_LARGE si supera el tamaño máximo', async () => {
      const big = { ...TEST_FILES.pdf, buffer: Buffer.alloc(MAX_FILE_SIZE_MB * 1024 * 1024 + 1) };

      const res = await uploadDocument(client._id, big, 'ID_CARD');

      expectError(res, 413, 'FILE_TOO_LARGE');
      expect(res.body.details).to.deep.equal({ maxSizeMB: MAX_FILE_SIZE_MB });
      expect(await countUploadedFiles('documents')).to.equal(0);
    });

    it('responde 400 INVALID_FILE_FIELD si el archivo viene en otro campo', async () => {
      const req = request.post(`/api/users/${client._id}/documents`).field('documentType', 'ID_CARD');

      const res = await attach(req, TEST_FILES.pdf, 'documento');

      expectError(res, 400, 'INVALID_FILE_FIELD');
      expect(res.body.details).to.deep.equal({ expected: 'file', received: 'documento' });
    });

    it('responde 404 USER_NOT_FOUND si el usuario no existe y borra el archivo', async () => {
      const res = await uploadDocument(NON_EXISTENT_ID, TEST_FILES.pdf, 'ID_CARD');

      expectError(res, 404, 'USER_NOT_FOUND');
      expect(await countUploadedFiles('documents')).to.equal(0);
    });

    it('responde 400 INVALID_ID si el id no tiene formato válido', async () => {
      const res = await uploadDocument('123', TEST_FILES.pdf, 'ID_CARD');

      expectError(res, 400, 'INVALID_ID');
    });
  });

  describe('POST /api/deliveries/:id/receipts', () => {
    let delivery;

    beforeEach(async () => {
      const client = await createClient();
      const order = await createOrder(client._id);
      delivery = await DeliveryModel.findOne({ order: order._id }).lean();
    });

    const uploadReceipt = (deliveryId, file) => {
      const req = request.post(`/api/deliveries/${deliveryId}/receipts`);
      return file ? attach(req, file) : req;
    };

    it('guarda el comprobante y lo asocia a la entrega', async () => {
      const res = await uploadReceipt(delivery._id, TEST_FILES.png);

      expect(res.status).to.equal(201);
      expect(res.body.payload).to.include({ _id: String(delivery._id), status: 'PENDING_ASSIGNMENT' });
      expect(res.body.payload.order).to.include({ total: 3300 });
      expect(res.body.payload.receipts).to.have.lengthOf(1);
      expectFileMetadata(res.body.payload.receipts[0], TEST_FILES.png, 'DELIVERY_RECEIPT', 'receipts');
      expect(await countUploadedFiles('receipts')).to.equal(1);
    });

    it('responde 400 FILE_REQUIRED si no se envía archivo', async () => {
      const res = await uploadReceipt(delivery._id, null);

      expectError(res, 400, 'FILE_REQUIRED');
    });

    it('responde 404 DELIVERY_NOT_FOUND si la entrega no existe y borra el archivo', async () => {
      const res = await uploadReceipt(NON_EXISTENT_ID, TEST_FILES.png);

      expectError(res, 404, 'DELIVERY_NOT_FOUND');
      expect(await countUploadedFiles('receipts')).to.equal(0);
    });

    it('responde 400 INVALID_FILE_TYPE con un archivo no permitido', async () => {
      const res = await uploadReceipt(delivery._id, TEST_FILES.txt);

      expectError(res, 400, 'INVALID_FILE_TYPE');
    });
  });
});
