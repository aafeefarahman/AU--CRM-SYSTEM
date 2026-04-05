import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, ChevronUp, ChevronDown, Download, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Pagination from '../components/ui/Pagination';
import useAuthStore from '../store/authStore';

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
const SOURCES = ['Website', 'Referral', 'Cold Call', 'Trade Show', 'LinkedIn', 'Email Campaign', 'Other'];

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  customerId: z.string().min(1, 'Customer required'),
  value: z.string().optional(),
  status: z.enum(STATUSES),
  source: z.string().optional(),
  notes: z.string().optional(),
  expectedCloseDate: z.string().optional(),
  assignedToId: z.string().optional(),
});

function LeadForm({ onSubmit, defaultValues, loading }) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => api.get('/customers', { params: { limit: 100 } }).then((r) => r.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: isAdmin,
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'NEW',
      ...defaultValues,
      customerId: defaultValues?.customerId?.toString(),
      assignedToId: defaultValues?.assignedToId?.toString() || '',
      expectedCloseDate: defaultValues?.expectedCloseDate
        ? new Date(defaultValues.expectedCloseDate).toISOString().split('T')[0]
        : '',
    },
  });

  const users = usersData?.users || usersData || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Title *" error={errors.title?.message} {...register('title')} />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Customer *" error={errors.customerId?.message} {...register('customerId')}>
          <option value="">Select customer...</option>
          {customersData?.customers?.map((c) => (
            <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
          ))}
        </Select>
        <Select label="Status" {...register('status')}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Input label="Value (₹)" type="number" step="0.01" {...register('value')} />
        <Select label="Source" {...register('source')}>
          <option value="">Select source...</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Input label="Expected Close Date" type="date" {...register('expectedCloseDate')} />
        {isAdmin && (
          <Select label="Assign To" {...register('assignedToId')}>
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Notes</label>
        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 resize-none" rows={3} {...register('notes')} />
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>Save Lead</Button>
      </div>
    </form>
  );
}

export default function Leads() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [modal, setModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['leads', search, statusFilter, page, sortBy, order],
    queryFn: () => api.get('/leads', { params: { search, status: statusFilter, page, limit: 10, sortBy, order } }).then((r) => r.data),
    keepPreviousData: true,
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/leads', {
      ...d,
      customerId: parseInt(d.customerId),
      value: d.value ? parseFloat(d.value) : undefined,
      assignedToId: d.assignedToId ? parseInt(d.assignedToId) : null,
      expectedCloseDate: d.expectedCloseDate || null,
    }),
    onSuccess: () => { qc.invalidateQueries(['leads']); qc.invalidateQueries(['dashboard']); toast.success('Lead created'); setModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/leads/${id}`, {
      ...d,
      value: d.value ? parseFloat(d.value) : undefined,
      assignedToId: d.assignedToId ? parseInt(d.assignedToId) : null,
      expectedCloseDate: d.expectedCloseDate || null,
    }),
    onSuccess: () => { qc.invalidateQueries(['leads']); qc.invalidateQueries(['dashboard']); toast.success('Lead updated'); setModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const quickStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/leads/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries(['leads']); qc.invalidateQueries(['dashboard']); toast.success('Status updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/leads/${id}`),
    onSuccess: () => { qc.invalidateQueries(['leads']); qc.invalidateQueries(['dashboard']); toast.success('Lead deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleExport = async () => {
    try {
      const res = await api.get('/leads/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const handleSort = (field) => {
    if (sortBy === field) setOrder(order === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setOrder('asc'); }
    setPage(1);
  };

  const SortIcon = ({ field }) => sortBy === field
    ? (order === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)
    : <ChevronDown size={14} className="opacity-30" />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} total leads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport}><Download size={16} /> Export CSV</Button>
          <Button onClick={() => setModal({ mode: 'create' })}><Plus size={16} /> Add Lead</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 w-64"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('title')}>
                  <span className="flex items-center gap-1">Title <SortIcon field="title" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('status')}>
                  <span className="flex items-center gap-1">Status <SortIcon field="status" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('value')}>
                  <span className="flex items-center gap-1">Value <SortIcon field="value" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Close Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Assigned</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Quick Action</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : data?.leads?.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No leads found</td></tr>
              ) : data?.leads?.map((l) => {
                const isOverdue = l.expectedCloseDate && isPast(new Date(l.expectedCloseDate)) && l.status !== 'WON' && l.status !== 'LOST';
                return (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{l.title}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{l.customer?.name}</div>
                      {l.customer?.company && <div className="text-xs text-gray-400">{l.customer.company}</div>}
                    </td>
                    <td className="px-4 py-3"><Badge value={l.status} /></td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {l.value ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(l.value) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {l.expectedCloseDate ? (
                        <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                          {isOverdue ? '⚠ ' : ''}{format(new Date(l.expectedCloseDate), 'dd MMM yyyy')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{l.assignedTo?.name || '—'}</td>
                    <td className="px-4 py-3">
                      {l.status !== 'WON' && l.status !== 'LOST' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => quickStatusMutation.mutate({ id: l.id, status: 'WON' })}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
                          >
                            <CheckCircle size={12} /> Won
                          </button>
                          <button
                            onClick={() => quickStatusMutation.mutate({ id: l.id, status: 'LOST' })}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
                          >
                            <XCircle size={12} /> Lost
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setModal({ mode: 'edit', data: l })} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => { if (confirm('Delete this lead?')) deleteMutation.mutate(l.id); }} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={data?.pages} total={data?.total} onPage={setPage} />
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Edit Lead' : 'Add Lead'} size="lg">
        <LeadForm
          defaultValues={modal?.data}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={(d) => modal?.mode === 'edit'
            ? updateMutation.mutate({ id: modal.data.id, ...d })
            : createMutation.mutate(d)
          }
        />
      </Modal>
    </div>
  );
}
