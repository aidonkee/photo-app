import { PrismaClient } from '@prisma/client';
import { pgmq } from 'prisma-pgmq';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ??  prismaClientSingleton();

try {
  await pgmq.createQueue(prisma, 'process-uploads');
} catch (error) {
  // console.error('Failed to create queue:', error);
}

export default prisma;

// Вместо process.env.NODE_ENV используй проверку на наличие самого процесса
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
