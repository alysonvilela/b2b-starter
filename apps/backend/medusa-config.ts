import { QUOTE_MODULE } from "./src/modules/quote";
import { APPROVAL_MODULE } from "./src/modules/approval";
import { COMPANY_MODULE } from "./src/modules/company";
import { loadEnv, defineConfig, Modules } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const redisUrl = process.env.REDIS_URL;

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
      cookieOptions: {
        secure: process.env.COOKIE_SECURE !== "false",
        sameSite: "lax",
        httpOnly: true,
      },
    },
    workerMode: process.env.MEDUSA_WORKER_MODE as any,
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: {
    [COMPANY_MODULE]: {
      resolve: "./modules/company",
    },
    [QUOTE_MODULE]: {
      resolve: "./modules/quote",
    },
    [APPROVAL_MODULE]: {
      resolve: "./modules/approval",
    },
    ...(redisUrl
      ? {
          [Modules.CACHE]: {
            resolve: "@medusajs/cache-redis",
            options: { redisUrl },
          },
          [Modules.EVENT_BUS]: {
            resolve: "@medusajs/event-bus-redis",
            options: { redisUrl },
          },
          [Modules.WORKFLOW_ENGINE]: {
            resolve: "@medusajs/workflow-engine-redis",
            options: { redis: { url: redisUrl } },
          },
        }
      : {}),
  },
});
