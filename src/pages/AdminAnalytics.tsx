import React from 'react';
import { useAdminAnalytics } from '../hooks/useAdminAnalytics';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Activity, CheckCircle, Clock, FileText, TrendingUp, Users } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminAnalytics() {
    const { data, loading } = useAdminAnalytics();

    if (loading || !data) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-950 text-slate-400">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"></div>
                    <p>Loading Analytics...</p>
                </div>
            </div>
        );
    }

    const taskPieData = [
        { name: 'Completed', value: data.taskStats.completed },
        { name: 'In Progress', value: data.taskStats.in_progress },
        { name: 'Pending Approval', value: data.taskStats.pending_approval },
    ];

    return (
        <div className="h-full bg-slate-950 text-white overflow-y-auto p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-2xl font-bold uppercase tracking-wider">System Analytics</h1>
                <p className="text-sm text-slate-400 mt-1">Real-time performance and metrics dashboard</p>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <KPICard 
                    title="Total Tasks" 
                    value={data.taskStats.total} 
                    icon={<Activity size={24} />} 
                    color="text-blue-500" 
                    bg="bg-blue-500/10" 
                />
                <KPICard 
                    title="Completion Rate" 
                    value={`${Math.round((data.taskStats.completed / Math.max(data.taskStats.total, 1)) * 100)}%`} 
                    icon={<CheckCircle size={24} />} 
                    color="text-emerald-500" 
                    bg="bg-emerald-500/10" 
                />
                <KPICard 
                    title="Pending Approvals" 
                    value={data.pendingApprovals} 
                    icon={<FileText size={24} />} 
                    color="text-amber-500" 
                    bg="bg-amber-500/10" 
                />
                <KPICard 
                    title="Active Workers" 
                    value={data.workerProductivity.length} 
                    icon={<Users size={24} />} 
                    color="text-purple-500" 
                    bg="bg-purple-500/10" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Task Distribution Pie Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg shadow-black/20 lg:col-span-1">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                        <PieChart size={16} /> Task Distribution
                    </h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={taskPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {taskPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                    itemStyle={{ color: '#cbd5e1' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Trends Line Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg shadow-black/20 lg:col-span-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                        <TrendingUp size={16} /> Completion Trends
                    </h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.monthlyTrends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                    itemStyle={{ color: '#3b82f6' }}
                                />
                                <Line type="monotone" dataKey="completed" name="Completed Tasks" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Performance */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg shadow-black/20">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                        <Activity size={16} /> Department Performance
                    </h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.departmentPerformance} layout="vertical" margin={{ left: 20, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                                <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={100} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                    cursor={{ fill: '#1e293b' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="total" name="Total Assigned" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Workers List */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg shadow-black/20">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                        <Users size={16} /> Top Worker Productivity
                    </h2>
                    <div className="space-y-4">
                        {data.workerProductivity.map((worker, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded bg-blue-900/40 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-800/50">
                                        #{i + 1}
                                    </div>
                                    <span className="font-medium">{worker.name}</span>
                                </div>
                                <div className="text-emerald-400 font-bold text-sm tracking-wider flex items-center gap-2">
                                    <CheckCircle size={14} />
                                    {worker.completed_tasks} RESOLVED
                                </div>
                            </div>
                        ))}
                        {data.workerProductivity.length === 0 && (
                            <div className="text-center text-slate-500 py-8">
                                No productivity data available.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon, color, bg }: { title: string, value: string | number, icon: React.ReactNode, color: string, bg: string }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg shadow-black/20 flex items-start justify-between">
            <div>
                <p className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-2">{title}</p>
                <p className="text-3xl font-light">{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${bg} ${color}`}>
                {icon}
            </div>
        </div>
    );
}
