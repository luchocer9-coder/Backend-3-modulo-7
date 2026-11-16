import mongoose from 'mongoose';
import { DOCUMENT_TYPES } from '../constants/index.js';

// Metadatos de un archivo subido. El archivo en sí queda en la carpeta uploads/
export const fileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    path: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    documentType: { type: String, enum: Object.values(DOCUMENT_TYPES), required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);
