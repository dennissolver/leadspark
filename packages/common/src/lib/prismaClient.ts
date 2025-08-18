// packages/common/src/lib/prismaClient.ts

import { PrismaClient } from "@prisma/client";

// This file initializes a single PrismaClient instance to be reused throughout your application.
// This is a best practice to prevent multiple database connections, which can
// lead to performance issues and connection pool exhaustion.

let prisma: PrismaClient;

// We use a global variable to ensure that the PrismaClient is only
// instantiated once, even with Next.js's hot-reloading in development.
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // @ts-ignore
  if (!global.prisma) {
    // @ts-ignore
    global.prisma = new PrismaClient();
  }
  // @ts-ignore
  prisma = global.prisma;
}

export { prisma };
