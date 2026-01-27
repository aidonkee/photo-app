import { getAdminsList } from '@/actions/super-admin/platform-actions';
import CreateAdminDialog from '@/components/super-admin/CreateAdminDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Users, 
  Mail, 
  Building2, 
  Calendar,
  CheckCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Управление фотографами | Супер Админ',
  description: 'Просмотр и управление всеми аккаунтами фотографов',
};

export default async function AdminsPage() {
  const admins = await getAdminsList();

  const getInitials = (firstName: string | null, lastName: string | null) => {
    if (!firstName && !lastName) return 'AD';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="w-9 h-9 text-slate-900" />
            Управление фотографами
          </h1>
          <p className="text-slate-600 mt-2">
            Просмотр и управление всеми аккаунтами администраторов-фотографов
          </p>
        </div>
        <CreateAdminDialog />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Всего фотографов</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{admins.length}</p>
              </div>
              <Users className="w-12 h-12 text-slate-900 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Активные аккаунты</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {admins.filter(a => a.isActive).length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-slate-900 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Всего школ</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {admins.reduce((sum, admin) => sum + admin._count.schools, 0)}
                </p>
              </div>
              <Building2 className="w-12 h-12 text-slate-900 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admins List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Все фотографы</CardTitle>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Пока нет фотографов
              </h3>
              <p className="text-slate-600 mb-6">
                Начните с добавления первого администратора-фотографа
              </p>
              <CreateAdminDialog />
            </div>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
                <Link 
                  key={admin.id} 
                  href={`/admins/${admin.id}`}
                  className="block group"
                >
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-900 hover:bg-slate-50 transition-all cursor-pointer">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar */}
                      <Avatar className="w-12 h-12 border border-slate-200">
                        <AvatarFallback className="bg-slate-900 text-white font-bold group-hover:bg-slate-800 transition-colors">
                          {getInitials(admin.firstName, admin.lastName)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 group-hover:underline decoration-slate-900/50 underline-offset-4">
                            {admin.firstName} {admin.lastName}
                          </h3>
                          {admin.isActive ? (
                            <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-0">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Активен
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-slate-100 text-slate-600 border-0">
                              <XCircle className="w-3 h-3 mr-1" />
                              Неактивен
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {admin.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {admin._count.schools} {admin._count.schools === 1 ? 'школа' : 'школы'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(admin.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrow Icon */}
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
