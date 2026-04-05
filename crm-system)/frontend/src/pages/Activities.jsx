import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, Search, Pencil, Trash2, CheckCircle2, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../api/axios";
import useAuthStore from "../store/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import Pagination from "../components/ui/Pagination";

const TYPES = ["CALL", "EMAIL", "MEETING", "NOTE", "TASK"];

const schema = z.object({
  subject: z.string().min(1, "Subject required"),
  type: z.enum(TYPES),
  customerId: z.string().min(1, "Customer required"),
  leadId: z.string().optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
});

function StatusBadge({ completed }) {
  return completed ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle2 size={11} /> Completed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
      <Circle size={11} /> Pending
    </span>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className={`bg-white rounded-xl border p-4 flex flex-col gap-1 ${color}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value ?? 0}</p>
    </div>
  );
}

function ActivityForm({ onSubmit, defaultValues, loading }) {
  const { data: customersData } = useQuery({
    queryKey: ["customers-all"],
    queryFn: () => api.get("/customers", { params: { limit: 100 } }).then((r) => r.data),
  });
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: "CALL", ...defaultValues, customerId: defaultValues?.customerId?.toString(), leadId: defaultValues?.leadId?.toString() || "" },
  });
  const selectedCustomerId = watch("customerId");
  const { data: leadsData } = useQuery({
    queryKey: ["leads-for-customer", selectedCustomerId],
    queryFn: () => api.get("/leads", { params: { limit: 100 } }).then((r) => r.data),
    enabled: !!selectedCustomerId,
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Subject *" error={errors.subject?.message} {...register("subject")} />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Type" {...register("type")}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select>
        <Select label="Customer *" error={errors.customerId?.message} {...register("customerId")}>
          <option value="">Select customer...</option>
          {customersData?.customers?.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}
        </Select>
        <Select label="Related Lead" {...register("leadId")}>
          <option value="">None</option>
          {leadsData?.leads?.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </Select>
        <Input label="Due Date" type="datetime-local" {...register("dueDate")} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Notes</label>
        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 resize-none" rows={3} {...register("notes")} />
      </div>
      <div className="flex justify-end pt-2"><Button type="submit" loading={loading}>Save Activity</Button></div>
    </form>
  );
}

export default function Activities() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["activities", search, typeFilter, statusFilter, page],
    queryFn: () =>
      api.get("/activities", { params: { search, type: typeFilter, page, limit: 10 } }).then((r) => r.data),
    keepPreviousData: true,
  });

  const allActivities = data?.activities || [];
  const filtered = statusFilter === "completed"
    ? allActivities.filter((a) => !!a.completedAt)
    : statusFilter === "pending"
    ? allActivities.filter((a) => !a.completedAt)
    : allActivities;

  const totalCount = data?.total ?? 0;
  const completedCount = allActivities.filter((a) => !!a.completedAt).length;
  const pendingCount = allActivities.filter((a) => !a.completedAt).length;

  const createMutation = useMutation({
    mutationFn: (d) => api.post("/activities", { ...d, customerId: parseInt(d.customerId), leadId: d.leadId ? parseInt(d.leadId) : undefined, dueDate: d.dueDate || undefined }),
    onSuccess: () => { qc.invalidateQueries(["activities"]); qc.invalidateQueries(["dashboard"]); toast.success("Activity created"); setModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/activities/${id}`, { ...d, leadId: d.leadId ? parseInt(d.leadId) : undefined, dueDate: d.dueDate || undefined }),
    onSuccess: () => { qc.invalidateQueries(["activities"]); toast.success("Activity updated"); setModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/activities/${id}`),
    onSuccess: () => { qc.invalidateQueries(["activities"]); qc.invalidateQueries(["dashboard"]); toast.success("Activity deleted"); },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/activities/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries(["activities"]); qc.invalidateQueries(["dashboard"]); },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isAdmin ? "All Activities" : "My Activities"}</h1>
          <p className="text-sm text-gray-500 mt-1">{isAdmin ? "Manage all team activities" : "Track your personal activity log"}</p>
        </div>
        <Button onClick={() => setModal({ mode: "create" })}><Plus size={16} /> Add Activity</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Total Activities" value={totalCount} color="border-gray-200" />
        <SummaryCard label="Completed" value={completedCount} color="border-green-200" />
        <SummaryCard label="Pending" value={pendingCount} color="border-orange-200" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 w-64" placeholder="Search activities..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Lead</th>
                {isAdmin && <th className="text-left px-4 py-3 font-medium text-gray-600">By</th>}
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={isAdmin ? 8 : 7} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={isAdmin ? 8 : 7} className="text-center py-12 text-gray-400">No activities found</td></tr>
              ) : filtered.map((a) => (
                <tr key={a.id} className={`hover:bg-gray-50 transition-colors ${a.completedAt ? "opacity-70" : ""}`}>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleMutation.mutate(a.id)}
                      className="flex items-center gap-1.5 group"
                      title={a.completedAt ? "Mark as pending" : "Mark as completed"}
                    >
                      {a.completedAt
                        ? <CheckCircle2 size={18} className="text-green-500 group-hover:text-green-600" />
                        : <Circle size={18} className="text-gray-300 group-hover:text-orange-400" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3"><Badge value={a.type} /></td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <span className={a.completedAt ? "line-through text-gray-400" : ""}>{a.subject}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.customer?.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{a.lead?.title || "—"}</td>
                  {isAdmin && <td className="px-4 py-3 text-gray-500">{a.user?.name || "—"}</td>}
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setModal({ mode: "edit", data: a })} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600"><Pencil size={15} /></button>
                      <button onClick={() => { if (confirm("Delete this activity?")) deleteMutation.mutate(a.id); }} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={data?.pages} total={data?.total} onPage={setPage} />
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "edit" ? "Edit Activity" : "Add Activity"} size="lg">
        <ActivityForm
          defaultValues={modal?.data}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={(d) => modal?.mode === "edit" ? updateMutation.mutate({ id: modal.data.id, ...d }) : createMutation.mutate(d)}
        />
      </Modal>
    </div>
  );
}
