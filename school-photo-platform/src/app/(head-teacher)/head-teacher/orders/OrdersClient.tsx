'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Edit, Trash2, X, AlertCircle, Save, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { updateOrderItemsByHeadTeacher, deleteOrderByHeadTeacher, updateOrderStatusByHeadTeacher } from '@/actions/head-teacher/orders-actions';

// Define simplified types for UI based on prisma return
type OrderItem = {
    id: string;
    format: 'A4' | 'A5';
    quantity: number;
    price: number | any;
    subtotal: number | any;
    photoUrl: string;
};

type OrderData = {
    id: string;
    parentName: string;
    parentSurname: string;
    parentPhone: string | null;
    status: string;
    totalSum: number | any;
    createdAt: Date;
    classroom: { name: string };
    items: OrderItem[];
};

type ClassroomData = {
    id: string;
    name: string;
};

export default function OrdersClient({ initialOrders, classrooms }: { initialOrders: OrderData[], classrooms: ClassroomData[] }) {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderData[]>(initialOrders);

    // Filtering state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState<string>('all');

    // Modal state for editing
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<OrderData | null>(null);
    const [editItems, setEditItems] = useState<{ id: string, format: 'A4' | 'A5', quantity: number }[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Modal state for deleting
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

    // Modal state for changing status
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [statusOrderId, setStatusOrderId] = useState<string | null>(null);
    const [newStatus, setNewStatus] = useState<string>('PENDING');

    // Filter logic
    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.parentSurname.toLowerCase().includes(searchQuery.toLowerCase());

        // We only have classroom name here, to properly filter by ID we'd need to add classId to the order object
        // Assuming we do or doing basic client filter for now using classroom name if we don't have ID.
        // For accurate filtering, use server-side. For this demo, client is ok.
        const matchesClass = selectedClassId === 'all' ? true :
            classrooms.find(c => c.id === selectedClassId)?.name === order.classroom.name;

        return matchesSearch && matchesClass;
    });

    const openEditModal = (order: OrderData) => {
        setEditingOrder(order);
        setEditItems(order.items.map(item => ({
            id: item.id,
            format: item.format,
            quantity: item.quantity,
        })));
        setIsEditModalOpen(true);
    };

    const handleUpdateItem = (id: string, field: 'format' | 'quantity', value: any) => {
        setEditItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleSaveOrder = async () => {
        if (!editingOrder) return;

        try {
            setIsSaving(true);
            const result = await updateOrderItemsByHeadTeacher(editingOrder.id, editItems);
            if (result.success) {
                toast.success('Заказ успешно обновлен');
                setIsEditModalOpen(false);
                router.refresh(); // Usually we should then update local state, but refresh is easier
            }
        } catch (error: any) {
            toast.error(error.message || 'Ошибка обновления заказа');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = (id: string) => {
        setDeletingOrderId(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteOrder = async () => {
        if (!deletingOrderId) return;

        try {
            setIsSaving(true);
            const result = await deleteOrderByHeadTeacher(deletingOrderId);
            if (result.success) {
                toast.success('Заказ удален');
                setIsDeleteModalOpen(false);
                router.refresh();
            }
        } catch (error: any) {
            toast.error(error.message || 'Ошибка удаления заказа');
        } finally {
            setIsSaving(false);
            setDeletingOrderId(null);
        }
    };

    const openStatusModal = (id: string, currentStatus: string) => {
        setStatusOrderId(id);
        setNewStatus(currentStatus);
        setIsStatusModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!statusOrderId) return;

        try {
            setIsSaving(true);
            const result = await updateOrderStatusByHeadTeacher(statusOrderId, newStatus as any);
            if (result.success) {
                toast.success('Статус изменен');
                setIsStatusModalOpen(false);
                router.refresh();
            }
        } catch (error: any) {
            toast.error(error.message || 'Ошибка изменения статуса');
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Новый (не подтвержден)';
            case 'APPROVED_BY_TEACHER': return 'Одобрен учителем';
            case 'LOCKED': return 'В печати';
            case 'COMPLETED': return 'Выполнен';
            default: return status;
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        placeholder="Поиск по ФИО родителя..."
                        className="pl-9 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-[250px]">
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Все классы" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все классы</SelectItem>
                            {classrooms.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto w-full pb-2">
                    <Table className="min-w-[800px] [&_th]:border-r [&_th:last-child]:border-r-0 [&_td]:border-r [&_td:last-child]:border-r-0">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Родитель</TableHead>
                                <TableHead className="w-[150px]">Класс</TableHead>
                                <TableHead className="w-[120px]">Сумма</TableHead>
                                <TableHead className="w-[180px]">Статус</TableHead>
                                <TableHead className="w-[120px]">Дата</TableHead>
                                <TableHead className="text-right w-[150px]">Действия</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        Заказов не найдено.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            <div className="font-medium">{order.parentName} {order.parentSurname}</div>
                                            <div className="text-xs text-slate-500">{order.parentPhone || 'Нет номера'}</div>
                                            <div className="text-xs text-indigo-600 mt-1">{order.items.length} фото</div>
                                        </TableCell>
                                        <TableCell>{order.classroom.name}</TableCell>
                                        <TableCell className="font-medium">{Number(order.totalSum)} ₸</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${order.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    order.status === 'APPROVED_BY_TEACHER' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        order.status === 'LOCKED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    }`}>
                                                    {getStatusText(order.status)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                                            {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => openStatusModal(order.id, order.status)} title="Изменить статус">
                                                    <RefreshCw className="w-4 h-4 text-slate-600" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => openEditModal(order)} title="Редактировать позиции">
                                                    <Edit className="w-4 h-4 text-indigo-600" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="hover:bg-red-50" onClick={() => confirmDelete(order.id)} title="Удалить">
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Edit Order Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-full">
                    <DialogHeader>
                        <DialogTitle>Редактирование заказа</DialogTitle>
                        <DialogDescription>
                            Изменение форматов и количества выбранных фотографий. Сохранение пересчитает итоговую сумму.
                        </DialogDescription>
                    </DialogHeader>

                    {editingOrder && (
                        <div className="py-4 space-y-4">
                            {editingOrder.items.map((item, index) => {
                                const editState = editItems.find(ei => ei.id === item.id);
                                if (!editState) return null;

                                return (
                                    <div key={item.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <div className="w-16 h-16 bg-slate-200 rounded shrink-0 overflow-hidden relative">
                                            <img src={item.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs mb-1 block text-slate-500">Формат</Label>
                                                <Select value={editState.format} onValueChange={(val) => handleUpdateItem(item.id, 'format', val)}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="A4">A4 (30x21 см)</SelectItem>
                                                        <SelectItem value="A5">A5 (21x15 см)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-xs mb-1 block text-slate-500">Количество</Label>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9"
                                                        onClick={() => handleUpdateItem(item.id, 'quantity', Math.max(1, editState.quantity - 1))}
                                                    >
                                                        -
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={editState.quantity}
                                                        onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                        className="h-9 w-16 text-center"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9"
                                                        onClick={() => handleUpdateItem(item.id, 'quantity', editState.quantity + 1)}
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>
                            Отмена
                        </Button>
                        <Button onClick={handleSaveOrder} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Сохранить пересчет
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Status Change Modal */}
            <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Изменение статуса</DialogTitle>
                        <DialogDescription>
                            Вы можете принудительно изменить статус заказа.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Новый статус</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger className="mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDING">Новый (не подтвержден)</SelectItem>
                                <SelectItem value="APPROVED_BY_TEACHER">Одобрен учителем</SelectItem>
                                <SelectItem value="LOCKED">В печати (LOCKED)</SelectItem>
                                <SelectItem value="COMPLETED">Выполнен</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsStatusModalOpen(false)} disabled={isSaving}>
                            Отмена
                        </Button>
                        <Button onClick={handleUpdateStatus} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Применить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            Удалить заказ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие нельзя отменить. Заказ будет полностью удален из базы данных. Если клиент передумал, это лучший способ очистить корзину для новых заказов.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSaving}>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDeleteOrder(); }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Удалить безвозвратно
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
