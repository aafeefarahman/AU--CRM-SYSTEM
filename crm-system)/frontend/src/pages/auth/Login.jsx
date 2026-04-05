import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import useAuthStore from "../../store/authStore";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const schema = z.object({
  email: z.string().min(1, "Email required"),
  password: z.string().min(1, "Password required"),
});

const DEMO = { email: "rahul@aucrm.com", password: "Emp@123" };

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => api.post("/auth/login", data).then((r) => r.data),
    onSuccess: ({ token, user }) => {
      setAuth(user, token);
      toast.success(`Welcome back, ${user.name}`);
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Login failed"),
  });

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-900 flex-col justify-center px-16 overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-white/5" />
        <div className="absolute -bottom-40 -left-20 w-[360px] h-[360px] rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-8 w-40 h-40 rounded-full bg-white/[0.03]" />

        <div className="relative space-y-5">
          <h1 className="text-5xl font-bold text-white leading-tight tracking-tight">
            Welcome to<br />AU CRM
          </h1>
          <p className="text-indigo-200 text-lg leading-relaxed max-w-xs">
            Manage customers, track leads, and grow efficiently.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div
          className="w-full max-w-[360px] animate-fade-in"
          style={{ animation: "fadeIn 0.4s ease both" }}
        >
          {/* Mobile heading */}
          <div className="lg:hidden mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900">AU CRM</h1>
            <p className="text-gray-400 text-sm mt-1">Manage customers, track leads, grow efficiently.</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
            <p className="text-sm text-gray-400 mt-1">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit(mutate)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
            <div className="pt-1">
              <Button type="submit" className="w-full" loading={isPending}>
                Sign In
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button
            type="button"
            onClick={() => { setValue("email", DEMO.email); setValue("password", DEMO.password); }}
            className="w-full py-2 px-4 rounded-lg border border-gray-200 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-150 font-medium"
          >
            Continue as Demo User
          </button>

          <p className="mt-8 text-center text-xs text-gray-400">
            No account?{" "}
            <Link to="/register" className="text-indigo-500 hover:text-indigo-700 hover:underline transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
