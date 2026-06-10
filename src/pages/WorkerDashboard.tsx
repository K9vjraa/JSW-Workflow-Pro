import { CheckCircle, Clock, ListTodo, Sun } from "lucide-react";
import TasksPage from "./TasksPage";

export default function WorkerDashboard({ category }: { category: string }) {
    
    // In a real app we would load real counts from supabase for the logged in worker
    const workerStats = {
        myTasks: 12,
        myDay: 5,
        completedTasks: 48
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-y-auto">
            <div className="p-8 pb-4 max-w-5xl mx-auto w-full shrink-0">
                <div className="flex items-center gap-3 mb-6">
                    <h1 className="text-xl font-semibold text-white">Worker Dashboard</h1>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 transition hover:border-slate-700 cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                <ListTodo size={20} />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">{workerStats.myTasks}</h3>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">My Tasks</p>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 transition hover:border-slate-700 cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 bg-jsw-orange/10 text-jsw-orange rounded-lg">
                                <Sun size={20} />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">{workerStats.myDay}</h3>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">My Day</p>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 transition hover:border-slate-700 cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
                                <CheckCircle size={20} />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">{workerStats.completedTasks}</h3>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Completed Tasks</p>
                    </div>
                </div>
            </div>

            {/* Task List - Embeds TasksPage but modified to fit the dashboard layout */}
            <div className="flex-1 w-full mx-auto relative">
                 <TasksPage category={category} overrideTitle="Recent Assignments" />
            </div>
        </div>
    );
}

