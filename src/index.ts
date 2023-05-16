import { config } from "dotenv";
import path from "path";
import express from "express";
import { pino } from "pino";
import { readdirSync } from "fs";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
export const app = express();
export const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
  level: process.env.LOG_LEVEL || "info",
});

async function main() {
  config();

  logger.info(`Loaded .env file from ${path.join(process.cwd(), ".env")}`);

  readdirSync(path.join(__dirname, "routes")).forEach((file) => {
    const route = require(`./routes/${file}`);
    app.use(route.path, route.router);

    logger.debug(`Loaded route ${route.path} from ${file}`);
  });

  const PORT = process.env.PORT || 4500;
  app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}. http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
