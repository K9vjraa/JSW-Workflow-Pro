import { supabase } from "../lib/supabase";

/**
 * Admin Dashboard Queries
 */
export async function getAdminDashboardStats() {
    const { count: totalTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
    const { count: openTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).neq('status', 'COMPLETED');
    const { count: completedTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED');
    const { count: activeWorkers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'WORKER');

    return { totalTasks, openTasks, completedTasks, activeWorkers };
}

export async function getDepartmentPerformance() {
    // Note: Complex aggregations in Supabase are best handled by RPC (Postgres functions) or Views.
    const { data, error } = await supabase.rpc('get_department_performance');
    if (error) throw error;
    return data;
}

/**
 * Employee Dashboard Queries 
 */
export async function getEmployeeDashboardStats(departmentId: string) {
    const { count: assigned } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('department_id', departmentId);
    const { count: completed } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('department_id', departmentId).eq('status', 'COMPLETED');
    const { count: pendingApprovals } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('department_id', departmentId).eq('status', 'PENDING_APPROVAL');

    return { assigned, completed, pendingApprovals };
}

export async function getTeamPerformance(departmentId: string) {
    // Similarly, best handled by RPC
    const { data, error } = await supabase.rpc('get_team_performance', { target_department_id: departmentId });
    if (error) throw error;
    return data;
}

/**
 * Worker Dashboard Queries
 */
export async function getWorkerDashboardStats(userId: string) {
    const { count: myTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assignee_id', userId).neq('status', 'COMPLETED');
    
    // Using current date bound
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { count: myDay } = await supabase.from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assignee_id', userId)
        .gte('due_date', startOfDay.toISOString());

    const { count: completedTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assignee_id', userId).eq('status', 'COMPLETED');

    return { myTasks, myDay, completedTasks };
}
