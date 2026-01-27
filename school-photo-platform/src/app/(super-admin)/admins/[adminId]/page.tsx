import { notFound } from 'next/navigation';
import { getAdminDetails } from '@/actions/super-admin/platform-actions';
import { 
  Building2, 
  Image as ImageIcon, 
  ShoppingCart, 
  Wallet,
  Calendar,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface PageProps {
  params: Promise<{ adminId: string }>;
}

export default async function AdminDetailsPage({ params }: PageProps) {
  // Await params correctly in Next.js 15
  const { adminId } = await params;
  const data = await getAdminDetails(adminId);

  if (!data) {
    notFound();
  }

  const { admin, stats, schools } = data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const getInitials = (first: string | null, last: string | null) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || 'AD';
  };

  return (
    <div className="space-y-8 pb-10">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-slate-200">
            <AvatarFallback className="bg-slate-900 text-white text-xl font-bold">
              {getInitials(admin.firstName, admin.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              {admin.firstName} {admin.lastName}
              {admin.isActive ? (
                <Badge className="bg-slate-900 hover:bg-slate-800 text-white">Активен</Badge>
              ) : (
                <Badge variant="destructive">Заблокирован</Badge>
              )}
            </h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                {admin.email}
              </div>
              {admin.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  {admin.phone}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Регистрация: {formatDate(admin.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <Wallet className="w-5 h-5 text-slate-900" />
              </div>
              <span className="text-sm font-medium text-slate-600">Общая выручка</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.revenue)}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <Building2 className="w-5 h-5 text-slate-900" />
              </div>
              <span className="text-sm font-medium text-slate-600">Школы</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.schools}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <ImageIcon className="w-5 h-5 text-slate-900" />
              </div>
              <span className="text-sm font-medium text-slate-600">Загружено фото</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.photos}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <ShoppingCart className="w-5 h-5 text-slate-900" />
              </div>
              <span className="text-sm font-medium text-slate-600">Всего заказов</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.orders}</p>
          </CardContent>
        </Card>
      </div>

      {/* --- SCHOOLS LIST --- */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Список школ фотографа
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schools.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              У этого фотографа пока нет созданных школ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-700">Название школы</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Slug (Ссылка)</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-center">Классы</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-right">Выручка школы</th>
                    <th className="px-4 py-3 font-medium text-slate-700 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schools.map((school) => (
                    <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {school.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        /{school.slug}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="border-slate-300">
                          {school.classroomsCount}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(school.revenue)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          asChild 
                          variant="ghost" 
                          size="sm"
                          className="h-8 gap-1 hover:bg-slate-200"
                        >
                          <Link href={`/admin/schools/${school.id}`}>
                            Обзор
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
