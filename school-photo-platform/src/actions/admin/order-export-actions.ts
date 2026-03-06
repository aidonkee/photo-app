'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';

export async function exportOrdersToExcel(schoolId: string, classId?: string, excludedOrderIds?: string[]) {
    const session = await getSession();

    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'TEACHER' && session.role !== 'HEAD_TEACHER')) {
        throw new Error('Unauthorized');
    }

    if (session.role === 'TEACHER' && session.classId !== classId) {
        throw new Error('Access denied: You can only export your own classroom');
    }

    if (session.role === 'HEAD_TEACHER' && session.userId !== schoolId) {
        throw new Error('Access denied: You can only export your own school');
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

    // Filter out excluded orders from each classroom
    if (excludedOrderIds && excludedOrderIds.length > 0) {
        for (const classroom of school.classrooms) {
            classroom.orders = classroom.orders.filter(
                (order: any) => !excludedOrderIds.includes(order.id)
            );
        }
    }

    // Helper to generate a worksheet for a classroom
    const addClassroomToWorkbook = (workbook: ExcelJS.Workbook, classroom: any) => {
        const sheetName = classroom.name.replace(/[\[\]\?\*\\\\\\/: ]/g, '_').slice(0, 31);
        const worksheet = workbook.addWorksheet(sheetName);

        // Set column widths without using the headers setter
        worksheet.getColumn(1).width = 25; // Родитель
        worksheet.getColumn(2).width = 30; // Файл
        worksheet.getColumn(3).width = 10; // Формат
        worksheet.getColumn(4).width = 8;  // Кол-во
        worksheet.getColumn(5).width = 12; // Сумма
        worksheet.getColumn(6).width = 25; // Статус

        // --- Row 1: Class name title ---
        const titleRow = worksheet.getRow(1);
        titleRow.height = 40;
        const titleCell = titleRow.getCell(1);
        titleCell.value = classroom.name;
        worksheet.mergeCells('A1:F1');
        titleCell.font = { name: 'Arial', size: 22, bold: true, color: { argb: 'FF000000' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        titleRow.commit();

        // --- Row 2: Column headers ---
        const headerRow = worksheet.getRow(2);
        headerRow.values = ['Родитель', 'Файл', 'Формат', 'Кол-во', 'Сумма (₸)', 'Статус / Примечание'];
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        headerRow.commit();

        // --- Data rows starting from row 3 ---
        let totalSum = 0;
        classroom.orders.forEach((order: any) => {
            order.items.forEach((item: any) => {
                const subtotal = Number(item.subtotal);
                totalSum += subtotal;
                worksheet.addRow([
                    `${order.parentName} ${order.parentSurname}`,
                    item.photo.fileName || item.photo.alt || 'N/A',
                    item.format,
                    item.quantity,
                    subtotal,
                    ''
                ]);
            });
        });

        const totalRow = worksheet.addRow(['ИТОГО:', '', '', '', totalSum, '']);
        totalRow.font = { bold: true };

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
