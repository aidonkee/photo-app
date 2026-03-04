import { getSchoolClassrooms } from '@/actions/head-teacher/classrooms-actions';
import ClassroomsClient from './ClassroomsClient';

export default async function ClassroomsPage() {
    const classrooms = await getSchoolClassrooms();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Управление классами</h1>
                <p className="text-slate-600 mt-1">Останавливайте заказы и управляйте доступами учителей.</p>
            </div>

            <ClassroomsClient initialClassrooms={classrooms} />
        </div>
    );
}
