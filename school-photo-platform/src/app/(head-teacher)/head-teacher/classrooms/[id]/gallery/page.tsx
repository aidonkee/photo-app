import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import GalleryClient from './GalleryClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function HeadTeacherGalleryPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getSession();

    if (!session || session.role !== 'HEAD_TEACHER') {
        redirect('/login');
    }

    const schoolId = session.userId;
    const classId = params.id;

    // Verify classroom belongs to school
    const classroom = await prisma.classroom.findFirst({
        where: { id: classId, schoolId },
        include: {
            photos: {
                orderBy: { uploadedAt: 'desc' }
            }
        }
    });

    if (!classroom) {
        redirect('/head-teacher/classrooms');
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/head-teacher/classrooms"
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Галерея: {classroom.name}</h1>
                    <p className="text-slate-600 mt-1">Всего фотографий: {classroom.photos.length}</p>
                </div>
            </div>

            <GalleryClient photos={classroom.photos as any} />
        </div>
    );
}
