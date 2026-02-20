'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';

export async function exportOrdersToExcel(schoolId: string, classId?: string) {
    const session = await getSession();

    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'TEACHER')) {
        throw new Error('Unauthorized');
    }

    if (session.role === 'TEACHER' && session.classId !== classId) {
        throw new Error('Access denied: You can only export your own classroom');
    }

    const school = await prisma.school.findUnique({
        where: { id: schoolId },
        include: {
            classrooms: {
                where: classId ? { id: classId } : {},
                include: {
                    orders: {
                        include: {
                            items: {
                                include: {
                                    photo: {
                                        select: {
                                            fileName: true,
                                            alt: true
                                        } as any
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!school) throw new Error('School not found');

    // Helper to generate a worksheet for a classroom
    const addClassroomToWorkbook = (workbook: ExcelJS.Workbook, classroom: any) => {
        const sheetName = classroom.name.replace(/[\[\]\?\*\\\/: ]/g, '_').slice(0, 31);
        const worksheet = workbook.addWorksheet(sheetName);

        worksheet.columns = [
            { header: 'Родитель', key: 'parent', width: 25 },
            { header: 'Статус', key: 'status', width: 15 },
            { header: 'Файл', key: 'file', width: 30 },
            { header: 'Формат', key: 'format', width: 10 },
            { header: 'Кол-во', key: 'quantity', width: 8 },
            { header: 'Сумма (₸)', key: 'total', width: 12 },
        ];

        classroom.orders.forEach((order: any) => {
            order.items.forEach((item: any) => {
                worksheet.addRow({
                    parent: `${order.parentName} ${order.parentSurname}`,
                    status: order.isPaid ? 'Оплачено' : 'Не оплачено',
                    file: item.photo.fileName || item.photo.alt || 'N/A',
                    format: item.format,
                    quantity: item.quantity,
                    total: Number(item.subtotal)
                });
            });
        });

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        return sheetName;
    };

    // If it's a single class, return one XLSX file or ZIP? 
    // The user wants "separate and together", so for single class returning the XLSX is fine.
    if (classId && school.classrooms.length === 1) {
        const classroom = school.classrooms[0];
        const workbook = new ExcelJS.Workbook();
        addClassroomToWorkbook(workbook, classroom);
        const buffer = await workbook.xlsx.writeBuffer();
        return Array.from(new Uint8Array(buffer));
    }

    // Full School Export: ZIP containing individual files + Summary file
    const zip = new JSZip();

    // 1. Create Summary Workbook
    const summaryWorkbook = new ExcelJS.Workbook();
    const summarySheet = summaryWorkbook.addWorksheet('Сводка');

    summarySheet.columns = [
        { header: 'Класс', key: 'class', width: 20 },
        { header: 'Всего заказов', key: 'totalOrders', width: 15 },
        { header: 'Оплачено', key: 'paidCount', width: 15 },
        { header: 'Не оплачено', key: 'unpaidCount', width: 15 },
        { header: 'Общая сумма (₸)', key: 'totalRevenue', width: 18 },
    ];

    for (const classroom of school.classrooms) {
        // Individual XLSX for this class
        const classWorkbook = new ExcelJS.Workbook();
        addClassroomToWorkbook(classWorkbook, classroom);
        const classBuffer = await classWorkbook.xlsx.writeBuffer();
        zip.file(`${classroom.name}.xlsx`, classBuffer);

        // Add to Summary Workbook
        const sheetName = addClassroomToWorkbook(summaryWorkbook, classroom);

        const stats = classroom.orders.reduce((acc: any, order: any) => {
            acc.total++;
            if (order.isPaid) acc.paid++;
            else acc.unpaid++;
            acc.sum += Number(order.totalSum);
            return acc;
        }, { total: 0, paid: 0, unpaid: 0, sum: 0 });

        const row = summarySheet.addRow({
            class: classroom.name,
            totalOrders: stats.total,
            paidCount: stats.paid,
            unpaidCount: stats.unpaid,
            totalRevenue: stats.sum
        });

        // Add hyperlink from Summary sheet to class-specific sheet in the same file
        const cell = row.getCell('class');
        cell.value = {
            text: classroom.name,
            hyperlink: `#'${sheetName}'!A1`
        };
        cell.font = { color: { argb: 'FF0000FF' }, underline: true };
    }

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    const summaryBuffer = await summaryWorkbook.xlsx.writeBuffer();
    zip.file(`ОБЩИЙ_ОТЧЕТ.xlsx`, summaryBuffer);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    return Array.from(new Uint8Array(zipBuffer));
}
