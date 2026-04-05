import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, Building2, MapPin } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../api/axios';
import Badge from '../components/ui/Badge';

const inr = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const statusColor = { Active: 'bg-green-100 text-green-700', Inactive: 'bg-gray-100 text-gray-600', Prospect: 'bg-blue-100 text-blue-700' };

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get(`/customers/${id}`).then((r) => r.data),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  if (!data?.customer) return <div className="text-center py-20 text-gray-400">Customer not found</div>;

  const { customer } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-sm text-gray-500">{customer.company || 'No company'}</p>
        </div>
        <span className={`ml-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[customer.status] || 'bg-gray-100 text-gray-600'}`}>
          {customer.status}
        </span>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Mail size={16} className="text-gray-400 shrink-0" />
            <span>{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Phone size={16} className="text-gray-400 shrink-0" />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.company && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Building2 size={16} className="text-gray-400 shrink-0" />
              <span>{customer.company}</span>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <MapPin size={16} className="text-gray-400 shrink-0" />
              <span>{customer.address}</span>
            </div>
          )}
        </div>
        {customer.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 font-medium mb-1">Notes</p>
            <p className="text-sm text-gray-700">{customer.notes}</p>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-4">Added by {customer.user?.name} · {formatDistanceToNow(new Date(customer.createdAt), { addSuffix: true })}</p>
      </div>

      {/* Leads */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Leads ({customer.leads?.length ?? 0})</h2>
        {customer.leads?.length === 0 ? (
          <p className="text-sm text-gray-400">No leads for this customer</p>
        ) : (
          <div className="space-y-3">
            {customer.leads.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{l.title}</p>
                  <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(l.createdAt), { addSuffix: true })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">{l.value ? inr(l.value) : '—'}</span>
                  <Badge value={l.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Activity Timeline ({customer.activities?.length ?? 0})</h2>
        {customer.activities?.length === 0 ? (
          <p className="text-sm text-gray-400">No activities yet</p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
            <div className="space-y-4">
              {customer.activities.map((a) => (
                <div key={a.id} className="flex gap-4 pl-10 relative">
                  <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-indigo-400 border-2 border-white" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge value={a.type} />
                      <span className="text-sm font-medium text-gray-900">{a.subject}</span>
                    </div>
                    {a.notes && <p className="text-xs text-gray-500 mb-1">{a.notes}</p>}
                    <div className="flex items-center gap-2">
                      {a.completedAt ? (
                        <span className="text-xs text-green-600 font-medium">Completed</span>
                      ) : (
                        <span className="text-xs text-orange-500 font-medium">Pending</span>
                      )}
                      <span className="text-xs text-gray-400">· {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
