import mongoose from 'mongoose';
import { config, missingEnvVars } from '../src/config/env.config.js';
import { clearDatabase, clearUploads, MODELS } from './helpers.js';

// Hooks globales: corren una vez antes y después de toda la suite
export const mochaHooks = {
  async beforeAll() {
    if (!config.isTest) {
      throw new Error('Los tests tienen que correr con NODE_ENV=test. Usá npm test');
    }

    if (missingEnvVars.length > 0) {
      throw new Error(`Faltan variables en .env.test: ${missingEnvVars.join(', ')}`);
    }

    await mongoose.connect(config.mongoUri);

    // Protección: nunca borrar datos de una base que no sea de testing
    if (!mongoose.connection.name.endsWith('-test')) {
      await mongoose.disconnect();
      throw new Error(
        `La base de testing tiene que terminar en "-test" y es "${mongoose.connection.name}". Revisá .env.test`,
      );
    }

    // Crea los índices (como el email único) antes de empezar
    await Promise.all(MODELS.map((Model) => Model.init()));
    await clearDatabase();
    await clearUploads();
  },

  async afterAll() {
    await clearDatabase();
    await clearUploads();
    await mongoose.disconnect();
  },
};
