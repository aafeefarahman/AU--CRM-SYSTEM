import { useQuery } from '@tanstack/react-query';
import { Users, TrendingUp, Activity, IndianRupee, Clock, Target, Calendar } from 'lucide-react';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import api from '../api/axios';
import Badge from '../components/ui/Badge';
import useAuthStore from '../store/authStore';

const inr = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-200 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard...</div>;

  const { stats, recentActivities, recentCustomers, leadsByStatus, upcomingActivities, employeePerformance } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your CRM activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total Customers" value={stats?.totalCustomers} color="bg-blue-500" />
        <StatCard icon={TrendingUp} label="Total Leads" value={stats?.totalLeads} color="bg-indigo-500" />
        <StatCard icon={Activity} label="Activities" value={stats?.totalActivities} color="bg-purple-500" />
        <StatCard icon={IndianRupee} label="Won Revenue" value={inr(stats?.wonRevenue)} color="bg-green-500" />
        <StatCard icon={Target} label="Conversion Rate" value={`${stats?.conversionRate ?? 0}%`} color="bg-orange-500" sub={`${stats?.wonLeads ?? 0} won leads`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Leads by Status</h2>
          <div className="space-y-3">
            {leadsByStatus?.map(({ status, _count, _sum }) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge value={status} />
                  <span className="text-sm text-gray-600">{_count.status} leads</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{inr(_sum.value)}</span>
              </div>
            ))}
            {!leadsByStatus?.length && <p className="text-sm text-gray-400">No leads yet</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Customers</h2>
          <div className="space-y-3">
            {recentCustomers?.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-sm font-medium">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.company || c.email}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                </span>
              </div>
            ))}
            {!recentCustomers?.length && <p className="text-sm text-gray-400">No customers yet</p>}
          </div>
        </div>
      </div>

      {/* Upcoming Activities */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-orange-500" />
          Upcoming Activities (Next 7 Days)
        </h2>
        <div className="space-y-3">
          {upcomingActivities?.length > 0 ? upcomingActivities.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
              <Badge value={a.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{a.subject}</p>
                <p className="text-xs text-gray-500">{a.customer?.name}</p>
              </div>
              <span className="text-xs font-medium text-orange-600 shrink-0">
                {a.dueAt ? format(new Date(a.dueAt), 'dd MMM') : ''}
              </span>
            </div>
          )) : (
            <p className="text-sm text-gray-400">No upcoming activities in the next 7 days</p>
          )}
        </div>
      </div>

      {/* Employee Performance (admin only) */}
      {isAdmin && employeePerformance?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Employee Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Employee</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Customers</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Leads</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Won</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Revenue</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Activities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employeePerformance.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-medium">
                          {e.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{e.name}</p>
                          <Badge value={e.role} />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700">{e.totalCustomers}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700">{e.totalLeads}</td>
                    <td className="py-2.5 px-3 text-right text-green-600 font-medium">{e.wonLeads}</td>
                    <td className="py-2.5 px-3 text-right text-gray-900 font-medium">{inr(e.wonRevenue)}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700">{e.totalActivities}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-gray-400" />
          Recent Activity
        </h2>
        <div className="space-y-4">
          {recentActivities?.map((a) => (
            <div key={a.id} className="flex gap-3">
              <div className="mt-0.5 shrink-0"><Badge value={a.type} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{a.subject}</p>
                <p className="text-xs text-gray-500">
                  {a.customer?.name} · {a.user?.name} · {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          {!recentActivities?.length && <p className="text-sm text-gray-400">No recent activity</p>}
        </div>
      </div>
    </div>
  );
}
