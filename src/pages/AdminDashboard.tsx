import { Users, AlertTriangle, CheckCircle, Clock, ListTodo } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const data = [
  { name: "Coke Oven", planned: 40, completed: 24, issues: 4 },
  { name: "Blast Furnace", planned: 30, completed: 13, issues: 8 },
  { name: "Electrical", planned: 20, completed: 18, issues: 1 },
  { name: "Mechanical", planned: 27, completed: 20, issues: 3 },
  { name: "Logistics", planned: 18, completed: 15, issues: 2 },
];

export default function AdminDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Overview Terminal</h1>
          <p className="text-sm text-slate-500">Enterprise operations command center</p>
        </div>
        <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] uppercase tracking-widest font-bold rounded-full cursor-default">
                System Online
            </span>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-lg shadow-blue-900/20">
                Export Daily Report
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 transition hover:bg-slate-900/80 cursor-pointer">
            <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                    <ListTodo size={20} />
                </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">1,250</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total Tasks</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 transition hover:bg-slate-900/80 cursor-pointer">
            <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-jsw-orange/10 text-jsw-orange rounded-lg">
                    <Clock size={20} />
                </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">390</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Open Tasks</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 transition hover:bg-slate-900/80 cursor-pointer">
            <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
                    <CheckCircle size={20} />
                </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">842</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Completed Tasks</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 transition hover:bg-slate-900/80 cursor-pointer">
            <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                    <Users size={20} />
                </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">18</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Critical Issues</p>
        </div>
      </div>

      {/* Analytics Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-96">
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-slate-400">Department Performance</h3>
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#f8fafc' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 20, color: '#94a3b8' }} />
                    <Bar dataKey="completed" fill="#0056b3" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar dataKey="planned" fill="#334155" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar dataKey="issues" fill="#f87171" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
            </ResponsiveContainer>
        </div>
        
        <div className="bg-indigo-950/20 p-6 rounded-xl border border-indigo-500/20 ai-glow h-96 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-300">AI Generated Insights</h3>
                <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase flex items-center gap-1">✨ Powered by Gemini</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-500/20">
                    <div className="font-semibold text-xs mb-1 text-slate-200 uppercase tracking-widest">Blast Furnace Delay</div>
                    <p className="text-xs text-slate-400 italic">Model detects an anomaly in task resolution times for the Blast Furnace. Historical correlation suggests raw material supply constraints.</p>
                </div>
                <div className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-500/20">
                    <div className="font-semibold text-xs mb-1 text-slate-200 uppercase tracking-widest">Mechanical Efficiency +4%</div>
                    <p className="text-xs text-slate-400 italic">Mechanical department task completion speed improved after integrating modern checklist workflows generated by the system last week.</p>
                </div>
                <div className="p-4 bg-red-950/30 rounded-lg border border-red-900/50">
                    <div className="font-semibold text-xs mb-1 text-red-400 uppercase tracking-widest">Safety Flag: Heat Equipment</div>
                    <p className="text-xs text-red-300 italic">Three field reports today mentioned "excessive vibration" near Motor P-12. Recommend triggering immediate maintenance protocol.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
