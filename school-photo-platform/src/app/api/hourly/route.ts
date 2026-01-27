import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ServerlessWorker } from '@/lib/worker-runner';

// Prevent Vercel from caching this route
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // 1. Security Check
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 2. Instantiate your worker with the existing Prisma connection
    // This reuses the DB pool, which is crucial for Serverless!
    const worker = new ServerlessWorker(prisma, 'process-uploads', 3600);

    // 3. Run one batch and return stats
    const stats = await worker.runBatch();

    return NextResponse.json(stats);
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
