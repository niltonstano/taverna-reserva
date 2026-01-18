import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform
} from "fastify-type-provider-zod";

async function zodPlugin(app: FastifyInstance) {
  // Configura como o Fastify valida e envia dados usando Zod
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
}

// Exportamos o transformador para o plugin do Swagger conseguir ler os schemas
export { jsonSchemaTransform };
export default fp(zodPlugin);