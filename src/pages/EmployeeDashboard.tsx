import { Users, Clock, CheckCircle, ListTodo } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const teamData = [
  { name: "John Doe", planned: 12, completed: 10, issues: 0 },
  { name: "Jane Smith", planned: 15, completed: 8, issues: 2 },
  { name: "Mike Ross", planned: 8, completed: 8, issues: 0 },
  { name: "Sarah Lee", planned: 10, completed: 5, issues: 1 },
];

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
     assigned: 45,
     completed: 32,
     pendingApprovals: 8,
     teamSize: 12
  });

  useEffect(() => {
     // Expected realistic Supabase query usage:
     // const fetchStats = async () => {
     //    const { count: assigned } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('department_id', user?.department_id);
     //    const { count: completed } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('department_id', user?.department_id).eq('status', 'COMPLETED');
     //    const { count: pending } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('department_id', user?.department_id).eq('status', 'PENDING_APPROVAL');
     //    setStats({ assigned: assigned || 0, completed: completed || 0, pendingApprovals: pending || 0, teamSize: 12 });
     // };
     // fetchStats();
  }, [user]);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Department Dashboard</h1>
          <p className="text-sm text-slate-500">Manage your team and operations</p>
        </div>
        <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-medium rounded-lg text-sm transition-colors">
                Assign New Task
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 transition hover:border-slate-700 cursor-pointer">
            <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                    <ListTodo size={20} />
                </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{stats.assigned}</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Assigned Tasks</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 transition hover:border-slate-700 cursor-pointer">
            <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
                    <CheckCircle size={20} />
                </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{stats.completed}</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Completed Tasks</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 transition hover:border-slate-700 cursor-pointer">
            <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-jsw-orange/10 text-jsw-orange rounded-lg">
                    <Clock size={20} />
                </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{stats.pendingApprovals}</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Pending Approvals</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 transition hover:border-slate-700 cursor-pointer">
            <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                    <Users size={20} />
                </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{stats.teamSize}</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Team Members</p>
        </div>
      </div>

      {/* Analytics Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-96">
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-slate-400">Team Performance</h3>
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                <BarChart data={teamData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#f8fafc' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 20, color: '#94a3b8' }} />
                    <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} name="Completed" />
                    <Bar dataKey="planned" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} name="Assigned" />
                    <Bar dataKey="issues" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} name="Issues" />
                </BarChart>
            </ResponsiveContainer>
        </div>
        
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-96 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Recent Approvals Needed</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                        <div>
                            <div className="text-sm font-medium text-white mb-1">Verify Motor Vibration (P-12)</div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span>Report submitted by <strong className="text-slate-400">Jane Smith</strong></span>
                                <span>•</span>
                                <span>2 hrs ago</span>
                            </div>
                        </div>
                        <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors shadow-lg shadow-blue-900/20">
                            Review
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
