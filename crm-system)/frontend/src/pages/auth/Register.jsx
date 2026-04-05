import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TrendingUp } from 'lucide-react';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => api.post('/auth/register', data).then((r) => r.data),
    onSuccess: ({ token, user }) => {
      setAuth(user, token);
      toast.success('Account created successfully');
      navigate('/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Registration failed'),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AU CRM</h1>
            <p className="text-sm text-gray-500">Create your account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(mutate)} className="space-y-4">
          <Input label="Full Name" placeholder="John Doe" error={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          <Input label="Confirm Password" type="password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          <Button type="submit" className="w-full" loading={isPending}>Create Account</Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
