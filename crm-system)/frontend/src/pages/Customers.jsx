import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, ChevronUp, ChevronDown, Download, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Pagination from '../components/ui/Pagination';

const STATUSES = ['Active', 'Inactive', 'Prospect'];

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Prospect']).default('Active'),
});

function CustomerForm({ onSubmit, defaultValues, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { status: 'Active', ...defaultValues },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Name *" error={errors.name?.message} {...register('name')} />
        <Input label="Email *" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Phone" {...register('phone')} />
        <Input label="Company" {...register('company')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Address" {...register('address')} />
        <Select label="Status" {...register('status')}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Notes</label>
        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 resize-none" rows={3} {...register('notes')} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={loading}>Save Customer</Button>
      </div>
    </form>
  );
}

const statusColor = { Active: 'bg-green-100 text-green-700', Inactive: 'bg-gray-100 text-gray-600', Prospect: 'bg-blue-100 text-blue-700' };

export default function Customers() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [modal, setModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, statusFilter, page, sortBy, order],
    queryFn: () => api.get('/customers', { params: { search, status: statusFilter, page, limit: 10, sortBy, order } }).then((r) => r.data),
    keepPreviousData: true,
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/customers', d),
    onSuccess: () => { qc.invalidateQueries(['customers']); qc.invalidateQueries(['dashboard']); toast.success('Customer created'); setModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/customers/${id}`, d),
    onSuccess: () => { qc.invalidateQueries(['customers']); toast.success('Customer updated'); setModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/customers/${id}`),
    onSuccess: () => { qc.invalidateQueries(['customers']); qc.invalidateQueries(['dashboard']); toast.success('Customer deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleExport = async () => {
    try {
      const res = await api.get('/customers/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'customers.csv'; a.click();
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
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} total customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport}><Download size={16} /> Export CSV</Button>
          <Button onClick={() => setModal({ mode: 'create' })}><Plus size={16} /> Add Customer</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 w-64"
            placeholder="Search customers..."
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
                {[['name', 'Name'], ['email', 'Email'], ['company', 'Company']].map(([field, label]) => (
                  <th key={field} className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort(field)}>
                    <span className="flex items-center gap-1">{label} <SortIcon field={field} /></span>
                  </th>
                ))}
                <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('createdAt')}>
                  <span className="flex items-center gap-1">Added <SortIcon field="createdAt" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Leads</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : data?.customers?.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">No customers found</td></tr>
              ) : data?.customers?.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/customers/${c.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-medium shrink-0">
                        {c.name[0]}
                      </div>
                      <span className="font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-gray-600">{c.company || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] || 'bg-gray-100 text-gray-600'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</td>
                  <td className="px-4 py-3 text-gray-600">{c._count?.leads ?? 0}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => navigate(`/customers/${c.id}`)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600">
                        <ExternalLink size={15} />
                      </button>
                      <button onClick={() => setModal({ mode: 'edit', data: c })} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => { if (confirm('Delete this customer?')) deleteMutation.mutate(c.id); }} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={data?.pages} total={data?.total} onPage={setPage} />
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Edit Customer' : 'Add Customer'} size="lg">
        <CustomerForm
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
