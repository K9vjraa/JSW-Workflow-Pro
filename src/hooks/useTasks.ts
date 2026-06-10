import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Task {
    id: string;
    title: string;
    description: string | null;
    department_id: string;
    creator_id: string;
    assignee_id: string | null;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'PLANNED' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'COMPLETED' | 'REJECTED';
    category: string | null;
    due_date: string | null;
    completed_at: string | null;
    latitude?: number | null;
    longitude?: number | null;
    created_at: string;
    updated_at: string;
    
    // Joined fields
    assignee?: {
        full_name: string;
        email: string;
    };
    department?: {
        name: string;
    }
}

export type TaskFilterCategory = 'MY_DAY' | 'IMPORTANT' | 'PLANNED' | 'ASSIGNED' | 'COMPLETED' | 'OVERDUE' | 'ALL';

export function useTasks(filterCategory: TaskFilterCategory) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            if (!supabase) {
                throw new Error("Supabase client not initialized.");
            }

            let query = supabase.from('tasks').select(`
                *,
                assignee:users!tasks_assignee_id_fkey(full_name, email),
                department:departments(name)
            `);

            // Apply global user filters based on role
            // In a real app, RLS handles most of this, but we filter for UI specifics
            if (user.role === 'WORKER') {
                query = query.eq('assignee_id', user.id);
            } else if (user.role === 'EMPLOYEE' && user.department_id) {
                query = query.eq('department_id', user.department_id);
            }

            // Apply category filters
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            switch (filterCategory) {
                case 'MY_DAY':
                    // Tasks specifically marked as MY_DAY or due today
                    // Using an arbitrary field or just filtering by due_date
                    // We also exclude completed
                    query = query.neq('status', 'COMPLETED').gte('due_date', today.toISOString()).lte('due_date', new Date(today.getTime() + 86400000).toISOString());
                    break;
                case 'IMPORTANT':
                    query = query.neq('status', 'COMPLETED').in('priority', ['HIGH', 'CRITICAL']);
                    break;
                case 'PLANNED':
                    query = query.neq('status', 'COMPLETED').not('due_date', 'is', null);
                    break;
                case 'ASSIGNED':
                    query = query.neq('status', 'COMPLETED').eq('assignee_id', user.id);
                    break;
                case 'COMPLETED':
                    query = query.eq('status', 'COMPLETED');
                    break;
                case 'OVERDUE':
                    query = query.neq('status', 'COMPLETED').lt('due_date', today.toISOString());
                    break;
                case 'ALL':
                default:
                    // Just all tasks
                    break;
            }

            // Order by creation or due date
            query = query.order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false });

            const { data, error: fetchError } = await query;
            
            if (fetchError) throw fetchError;
            setTasks(data as any as Task[]);

        } catch (err: any) {
            console.error("Error fetching tasks:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, filterCategory]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return { tasks, loading, error, refetch: fetchTasks };
}

export async function createTask(taskData: Partial<Task>) {
    if (!supabase) return;
    const { data, error } = await supabase.from('tasks').insert([taskData]).select().single();
    if (error) throw error;
    return data;
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
    if (!supabase) return;
    updates.updated_at = new Date().toISOString();
    
    if (updates.status === 'COMPLETED' && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
    } else if (updates.status && updates.status !== 'COMPLETED') {
        updates.completed_at = null;
    }

    const { data, error } = await supabase.from('tasks').update(updates).eq('id', taskId).select().single();
    if (error) throw error;
    return data;
}
