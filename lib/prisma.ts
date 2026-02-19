import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient()
/*
   Ensuring singleton pattern for Prisma Client.
   Updated for Soft Deletes support.
*/

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
