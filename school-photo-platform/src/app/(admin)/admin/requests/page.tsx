import React from 'react';
import { getAllRequests } from '@/actions/admin/request-actions';
import EditRequestList from '@/components/admin/EditRequestList';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  FileEdit,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const metadata = {
  title: 'Запросы на редактирование | Фотограф',
  description: 'Управляйте запросами учителей на редактирование',
};

export default async function RequestsPage() {
  const allRequests = await getAllRequests();

  const pendingRequests = allRequests.filter((r) => r.status === 'PENDING');
  const approvedRequests = allRequests.filter((r) => r.status === 'APPROVED');
  const rejectedRequests = allRequests.filter((r) => r.status === 'REJECTED');

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
          <FileEdit className="w-8 h-8 text-slate-900" />
          Запросы доступа
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Управление заявками на редактирование альбомов
        </p>
      </div>

      {/* Stats - Monochrome */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="В ожидании" 
          value={pendingRequests.length} 
          icon={<Clock className="w-5 h-5" />} 
        />
        <StatCard 
          label="Одобрено" 
          value={approvedRequests.length} 
          icon={<CheckCircle className="w-5 h-5" />} 
        />
        <StatCard 
          label="Отклонено" 
          value={rejectedRequests.length} 
          icon={<XCircle className="w-5 h-5" />} 
        />
      </div>

      {/* Tabs - Minimalist */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="pending" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-500">
            В ожидании
            {pendingRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-slate-900 text-white rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-500">
            Одобрено
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-500">
            Отклонено
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-8">
          <EditRequestList requests={pendingRequests} />
        </TabsContent>

        <TabsContent value="approved" className="mt-8">
          {approvedRequests.length === 0 ? (
            <EmptyState icon={<CheckCircle className="w-12 h-12" />} title="Нет одобренных запросов" />
          ) : (
            <div className="space-y-4">
              {approvedRequests.map((request) => (
                <RequestCard 
                  key={request.id} 
                  request={request} 
                  status="APPROVED" 
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-8">
          {rejectedRequests.length === 0 ? (
            <EmptyState icon={<XCircle className="w-12 h-12" />} title="Нет отклоненных запросов" />
          ) : (
            <div className="space-y-4">
              {rejectedRequests.map((request) => (
                <RequestCard 
                  key={request.id} 
                  request={request} 
                  status="REJECTED" 
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Вспомогательные компоненты ---

function StatCard({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) {
  return (
    <Card className="bg-white border border-slate-200 shadow-none rounded-lg hover:border-slate-400 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-light text-slate-900 mt-2">{value}</p>
          </div>
          <div className="text-slate-900 opacity-80">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div className="border border-dashed border-slate-300 rounded-lg py-16 text-center">
      <div className="text-slate-300 mx-auto mb-4 w-fit">{icon}</div>
      <h3 className="text-lg font-medium text-slate-900">{title}</h3>
      <p className="text-slate-500 mt-1">Список пуст</p>
    </div>
  );
}

function RequestCard({ request, status, formatDate }: { request: any, status: 'APPROVED' | 'REJECTED', formatDate: (d: Date) => string }) {
  const isApproved = status === 'APPROVED';
  
  return (
    <Card className="border border-slate-200 shadow-none bg-white">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={isApproved ? "text-slate-900 border-slate-900" : "text-slate-500 border-slate-300"}>
                {isApproved ? (
                  <><CheckCircle className="w-3 h-3 mr-2" /> Одобрено</>
                ) : (
                  <><XCircle className="w-3 h-3 mr-2" /> Отклонено</>
                )}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                {formatDate(request.createdAt)}
              </span>
            </div>
            
            <div>
              <p className="font-semibold text-slate-900 text-lg">
                {request.classroom.school.name}
                <span className="text-slate-400 mx-2">/</span>
                {request.classroom.name}
              </p>
              <p className="text-slate-600 mt-1">{request.reason}</p>
            </div>

            {request.adminNote && (
              <div className="flex items-start gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-md border border-slate-100">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><span className="font-medium text-slate-700">Примечание админа:</span> {request.adminNote}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}