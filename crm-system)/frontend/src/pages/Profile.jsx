import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { UserCircle, Lock } from 'lucide-react';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import useAuthStore from '../store/authStore';

const profileSchema = z.object({
  name: z.string().min(1, 'Name required'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function Profile() {
  const { user, setUser } = useAuthStore();

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '' },
  });

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { errors: pwdErrors } } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const profileMutation = useMutation({
    mutationFn: (d) => api.put('/auth/profile', d),
    onSuccess: (res) => {
      toast.success('Profile updated');
      if (setUser) setUser(res.data.user);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: (d) => api.put('/auth/profile', { currentPassword: d.currentPassword, newPassword: d.newPassword }),
    onSuccess: () => { toast.success('Password changed successfully'); resetPwd(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account settings</p>
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-5">
          <UserCircle size={20} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Personal Information</h2>
        </div>
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p><span className="font-medium">Email:</span> {user?.email}</p>
          <p className="mt-1"><span className="font-medium">Role:</span> {user?.role === 'ADMIN' ? 'Admin' : 'Employee'}</p>
        </div>
        <form onSubmit={handleProfile((d) => profileMutation.mutate(d))} className="space-y-4">
          <Input label="Full Name" error={profileErrors.name?.message} {...regProfile('name')} />
          <div className="flex justify-end">
            <Button type="submit" loading={profileMutation.isPending}>Update Name</Button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-5">
          <Lock size={20} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Change Password</h2>
        </div>
        <form onSubmit={handlePwd((d) => passwordMutation.mutate(d))} className="space-y-4">
          <Input label="Current Password" type="password" error={pwdErrors.currentPassword?.message} {...regPwd('currentPassword')} />
          <Input label="New Password" type="password" error={pwdErrors.newPassword?.message} {...regPwd('newPassword')} />
          <Input label="Confirm New Password" type="password" error={pwdErrors.confirmPassword?.message} {...regPwd('confirmPassword')} />
          <div className="flex justify-end">
            <Button type="submit" loading={passwordMutation.isPending}>Change Password</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
