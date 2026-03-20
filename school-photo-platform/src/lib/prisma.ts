import { PrismaClient } from '@prisma/client';
import { pgmq } from 'prisma-pgmq';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Ленивая инициализация очереди — вызывается только когда очередь реально нужна
let queueReady = false;
export async function ensureQueue() {
  if (queueReady) return;
  try {
    await pgmq.createQueue(prisma, 'process-uploads');
    queueReady = true;
  } catch (error) {
    // Queue may already exist, that's okay
  }
}

export default prisma;

// Вместо process.env.NODE_ENV используй проверку на наличие самого процесса
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
