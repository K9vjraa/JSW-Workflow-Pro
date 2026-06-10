import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
    CheckCircle2, Circle, Star, Calendar as CalendarIcon, 
    MoreVertical, Sun, User as UserIcon, AlertCircle, Menu, X, CheckSquare, Plus, Sparkles
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { TaskFilterCategory, useTasks, updateTask, createTask, Task } from "../hooks/useTasks";
import { useAuth } from "../contexts/AuthContext";
import { format, isPast, isToday } from "date-fns";
import AITaskGenerator from "../components/AITaskGenerator";

export default function TasksPage({ category, overrideTitle }: { category?: string, overrideTitle?: string }) {
    const { user } = useAuth();
    
    // Map initial prop category to our filter type
    const initialCategory: TaskFilterCategory = (category as TaskFilterCategory) || 'MY_DAY';
    const [activeCategory, setActiveCategory] = useState<TaskFilterCategory>(initialCategory);
    
    // Determine title
    let displayTitle = overrideTitle;
    if (!displayTitle) {
        switch (activeCategory) {
            case 'MY_DAY': displayTitle = 'My Day'; break;
            case 'IMPORTANT': displayTitle = 'Important'; break;
            case 'PLANNED': displayTitle = 'Planned'; break;
            case 'ASSIGNED': displayTitle = 'Assigned to me'; break;
            case 'COMPLETED': displayTitle = 'Completed'; break;
            case 'OVERDUE': displayTitle = 'Overdue'; break;
            default: displayTitle = 'All Tasks'; break;
        }
    }

    const { tasks, loading, error, refetch } = useTasks(activeCategory);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [showAIGenerator, setShowAIGenerator] = useState(false);

    // Mock data fallback if Supabase is not configured yet
    const useMockData = tasks.length === 0 && !loading && !error && import.meta.env.VITE_SUPABASE_URL === undefined;
    
    const displayTasks = useMockData ? [
        { id: "1", title: "Inspect Conveyor Belt B-22", department: { name: "Mechanical" }, status: "PENDING", priority: "HIGH", due_date: new Date().toISOString() },
        { id: "2", title: "Submit daily shift operations report", department: { name: "Blast Furnace" }, status: "COMPLETED", priority: "MEDIUM", due_date: new Date().toISOString() },
        { id: "3", title: "Calibrate pressure sensors", department: { name: "Instrumentation" }, status: "IN_PROGRESS", priority: "HIGH", due_date: null },
    ] : tasks;

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !user) return;
        
        try {
            await createTask({
                title: newTaskTitle,
                department_id: user.department_id || undefined,
                creator_id: user.id,
                assignee_id: user.id, // Assign to self by default
                priority: activeCategory === 'IMPORTANT' ? 'HIGH' : 'MEDIUM',
                status: 'PLANNED',
                due_date: activeCategory === 'MY_DAY' || activeCategory === 'PLANNED' ? new Date().toISOString() : null
            });
            setNewTaskTitle("");
            refetch();
        } catch (err) {
            console.error("Failed to create task", err);
        }
    };

    const handleApplyAIPlan = async (plan: any) => {
        if (!user || useMockData) return;
        
        const description = `**Inspection Checklist:**\n${plan.inspectionChecklist.map((i:any)=>`- ${i}`).join('\n')}
        
**Suggested Tasks:**\n${plan.suggestedTasks.map((i:any)=>`- ${i}`).join('\n')}

**Safety Checks:**\n${plan.safetyChecks.map((i:any)=>`- ${i}`).join('\n')}

**Required Attachments:**\n${plan.requiredAttachments.map((i:any)=>`- ${i}`).join('\n')}`;

        try {
            await createTask({
                title: plan.title,
                description: description,
                department_id: user.department_id || undefined,
                creator_id: user.id,
                assignee_id: user.id,
                priority: 'HIGH',
                status: 'PLANNED',
                due_date: new Date().toISOString()
            });
            setShowAIGenerator(false);
            refetch();
        } catch (err) {
            console.error("Failed to apply AI plan", err);
        }
    };

    const toggleTaskStatus = async (id: string, currentStatus: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const newStatus = currentStatus === "COMPLETED" ? "PLANNED" : "COMPLETED";
        try {
            await updateTask(id, { status: newStatus });
            refetch();
        } catch (err) {
            console.error("Failed to toggle status", err);
        }
    };

    const togglePriority = async (id: string, currentPriority: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const newPriority = currentPriority === "HIGH" || currentPriority === "CRITICAL" ? "MEDIUM" : "HIGH";
        try {
            await updateTask(id, { priority: newPriority });
            refetch();
        } catch (err) {
            console.error("Failed to update priority", err);
        }
    };

    return (
        <div className="flex h-full bg-slate-950 text-white overflow-hidden relative">
            
            {/* Secondary Sidebar (Categories) - Microsoft To Do Style */}
            {/* Hidden if overrideTitle is provided (assumes embedded view) */}
            {!overrideTitle && (
                <div className={`shrink-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full hidden md:flex md:w-16 lg:w-64'}`}>
                    <div className="p-4 flex items-center justify-between lg:hidden border-b border-slate-800">
                        <span className="font-semibold">Categories</span>
                        <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <nav className="flex-1 py-4 space-y-1">
                        <CategoryItem icon={<Sun size={18} />} label="My Day" count={3} active={activeCategory === 'MY_DAY'} onClick={() => setActiveCategory('MY_DAY')} />
                        <CategoryItem icon={<Star size={18} />} label="Important" color="text-yellow-500" active={activeCategory === 'IMPORTANT'} onClick={() => setActiveCategory('IMPORTANT')} />
                        <CategoryItem icon={<CalendarIcon size={18} />} label="Planned" active={activeCategory === 'PLANNED'} onClick={() => setActiveCategory('PLANNED')} />
                        <CategoryItem icon={<UserIcon size={18} />} label="Assigned to me" active={activeCategory === 'ASSIGNED'} onClick={() => setActiveCategory('ASSIGNED')} />
                        <CategoryItem icon={<CheckSquare size={18} />} label="Completed" active={activeCategory === 'COMPLETED'} onClick={() => setActiveCategory('COMPLETED')} />
                        <CategoryItem icon={<AlertCircle size={18} />} label="Overdue" color="text-red-500" active={activeCategory === 'OVERDUE'} onClick={() => setActiveCategory('OVERDUE')} />
                    </nav>
                </div>
            )}

            {/* Task List Content */}
            <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full relative h-full">
                <header className="px-8 py-6 mb-2 flex flex-col justify-start text-white shrink-0">
                    <div className="flex items-center gap-3">
                        {!overrideTitle && (
                            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-400 hover:text-white mr-2">
                                <Menu size={24} />
                            </button>
                        )}
                        <h1 className={`text-2xl font-bold capitalize flex items-center gap-3 ${activeCategory === 'MY_DAY' ? 'text-blue-500' : ''}`}>
                            {displayTitle}
                        </h1>
                    </div>
                    {/* Subtitle / Date */}
                    {activeCategory === 'MY_DAY' && (
                        <p className="text-slate-400 text-sm mt-1 ml-1 lg:ml-0">
                            {format(new Date(), 'EEEE, MMMM d')}
                        </p>
                    )}
                </header>

                <div className="px-8 flex-1 overflow-y-auto pb-24">
                    {/* Add Task Form (Inline) */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex items-center p-3 mb-6 focus-within:ring-2 focus-within:ring-blue-500 transition-all focus-within:bg-slate-900">
                        <div className="px-3">
                            <Plus size={20} className="text-blue-500" />
                        </div>
                        <form onSubmit={handleAddTask} className="flex-1 shrink-0">
                            <input 
                                type="text" 
                                className="w-full bg-transparent border-none outline-none text-white placeholder-slate-500 font-medium text-sm" 
                                placeholder="Add a task" 
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                            />
                        </form>
                        <button 
                            type="button"
                            onClick={() => setShowAIGenerator(!showAIGenerator)}
                            className={`p-2 rounded-lg transition-colors ${showAIGenerator ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
                            title="AI Task Generator"
                        >
                            <Sparkles size={18} />
                        </button>
                    </div>

                    {/* AI Generator Panel */}
                    {showAIGenerator && (
                        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <AITaskGenerator onApply={handleApplyAIPlan} />
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && !useMockData && (
                        <div className="text-center py-12 text-slate-500">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            Loading tasks...
                        </div>
                    )}

                    {/* Task Roster */}
                    {!loading && (
                        <div className="space-y-2">
                            {displayTasks.map((task: any) => {
                                const isCompleted = task.status === 'COMPLETED';
                                const isImportant = task.priority === 'HIGH' || task.priority === 'CRITICAL';
                                const isTaskOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && !isCompleted;
                                
                                return (
                                    <Link to={`/task/${task.id}`} key={task.id} className="block group">
                                        <div className={`p-4 flex items-center gap-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition cursor-pointer relative overflow-hidden ${isCompleted ? 'opacity-50' : 'shadow-sm'}`}>
                                            <div className="p-1 cursor-pointer z-10 shrink-0" onClick={(e) => toggleTaskStatus(task.id, task.status, e)}>
                                                {isCompleted ? (
                                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <span className="text-[12px] text-white">✓</span>
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 border-2 border-slate-600 group-hover:border-blue-500 transition-colors rounded-full flex items-center justify-center">
                                                        {task.status === "IN_PROGRESS" && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="ml-2 flex-1 z-10 min-w-0">
                                                <h3 className={`text-sm font-medium truncate ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                                    {task.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-1.5">
                                                    {task.department && (
                                                        <span className="text-slate-500">{task.department.name}</span>
                                                    )}
                                                    
                                                    {!task.department && <span className="text-slate-500">No Department</span>}
                                                    
                                                    {task.due_date && (
                                                        <div className={`flex items-center gap-1 ${isTaskOverdue ? 'text-red-400 font-medium' : isToday(new Date(task.due_date)) ? 'text-blue-400' : 'text-slate-500'}`}>
                                                            <CalendarIcon size={10} />
                                                            <span>{isTaskOverdue ? 'Overdue' : format(new Date(task.due_date), 'MMM d')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="px-4 z-10 flex gap-4 items-center shrink-0">
                                                <button 
                                                    className={`transition focus:outline-none ${isImportant ? 'text-yellow-500' : 'text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100'}`} 
                                                    onClick={(e) => togglePriority(task.id, task.priority, e)}
                                                >
                                                    <Star size={18} fill={isImportant ? "currentColor" : "none"} />
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                            
                            {displayTasks.length === 0 && !loading && (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-slate-600 mx-auto mb-4">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h3 className="text-slate-400 font-medium">Nothing to do here</h3>
                                    <p className="text-slate-600 text-sm mt-1">Enjoy your day or add a new task.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Subcomponent for the Sidebar Navigation Items
function CategoryItem({ icon, label, count, color, active, onClick }: { icon: React.ReactNode, label: string, count?: number, color?: string, active?: boolean, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center justify-between px-6 py-3 text-sm transition-colors ${active ? 'bg-slate-800 border-l-[3px] border-blue-500' : 'border-l-[3px] border-transparent hover:bg-slate-800/50 text-slate-400 lg:text-slate-300'}`}
        >
            <div className={`flex items-center gap-4 ${active && !color ? 'text-blue-500' : color ? color : ''}`}>
                {icon}
                <span className={`font-medium ${active && !color ? 'text-white' : ''}`}>{label}</span>
            </div>
            {count !== undefined && count > 0 && (
                <span className="text-xs font-semibold text-slate-500">{count}</span>
            )}
        </button>
    );
}

