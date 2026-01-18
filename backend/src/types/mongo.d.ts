import { FastifyMongoObject } from "@fastify/mongodb";

declare module "fastify" {
  interface FastifyInstance {
    mongo: FastifyMongoObject;
  }
}
