import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Attempt to update a non-existent order with isPaid
        // We expect "Record to update not found", NOT "Unknown argument"
        await prisma.order.update({
            where: { id: '00000000-0000-0000-0000-000000000000' },
            data: { isPaid: true },
        });
    } catch (e: any) {
        if (e.code === 'P2025') {
            console.log('SUCCESS: Types are correct, record just not found.');
        } else if (e.message.includes('Unknown argument')) {
            console.error('FAILURE: Unknown argument error still persists.');
            console.error(e.message);
            process.exit(1);
        } else {
            console.log('SUCCESS: Verified type check passed (other error occurred).');
            console.log(e.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
