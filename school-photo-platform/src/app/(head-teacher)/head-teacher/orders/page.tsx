import { getSchoolOrders } from '@/actions/head-teacher/orders-actions';
import { getSchoolClassrooms } from '@/actions/head-teacher/classrooms-actions';
import OrdersClient from './OrdersClient';

export default async function OrdersPage() {
    // We fetch orders and classrooms to pass down for filtering
    const orders = await getSchoolOrders();
    const classrooms = await getSchoolClassrooms();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Модерация заказов</h1>
                <p className="text-slate-600 mt-1">Просматривайте и редактируйте любые заказы в школе.</p>
            </div>

            <OrdersClient initialOrders={orders as any} classrooms={classrooms} />
        </div>
    );
}
