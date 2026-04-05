import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

const createSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Min 8 characters'),
  role: z.enum(['EMPLOYEE', 'ADMIN']),
});

const editSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Valid email required'),
  role: z.enum(['EMPLOYEE', 'ADMIN']),
  password: z.string().optional(),
});

function UserForm({ onSubmit, defaultValues, loading }) {
  const isEdit = !!defaultValues;
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: { role: 'EMPLOYEE', ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Name *" error={errors.name?.message} {...register('name')} />
        <Input label="Email *" type="email" error={errors.email?.message} {...register('email')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={isEdit ? 'New Password (leave blank to keep)' : 'Password *'}
          type="password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Select label="Role" {...register('role')}>
          <option value="EMPLOYEE">Employee</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>Save User</Button>
      </div>
    </form>
  );
}

export default function Users() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/users', d),
    onSuccess: () => { qc.invalidateQueries(['users']); toast.success('User created'); setModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/users/${id}`, d),
    onSuccess: () => { qc.invalidateQueries(['users']); toast.success('User updated'); setModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries(['users']); toast.success('User deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const users = data?.users || data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Admin-only — manage all system employees</p>
        </div>
        <Button onClick={() => setModal({ mode: 'create' })}>
          <Plus size={16} /> Add User
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Last Login</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Activities</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-medium shrink-0">
                      {u.name[0]}
                    </div>
                    <span className="font-medium text-gray-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3"><Badge value={u.role} /></td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {u.lastLoginAt ? formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true }) : 'Never'}
                </td>
                <td className="px-4 py-3 text-gray-600">{u._count?.activities ?? 0}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setModal({ mode: 'edit', data: u })} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => { if (confirm('Delete this user?')) deleteMutation.mutate(u.id); }} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Edit User' : 'Add User'} size="md">
        <UserForm
          defaultValues={modal?.mode === 'edit' ? modal.data : undefined}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={(d) => {
            const payload = { ...d };
            if (modal?.mode === 'edit' && !payload.password) delete payload.password;
            modal?.mode === 'edit'
              ? updateMutation.mutate({ id: modal.data.id, ...payload })
              : createMutation.mutate(payload);
          }}
        />
      </Modal>
    </div>
  );
}
