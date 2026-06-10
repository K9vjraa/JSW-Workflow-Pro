import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Report {
    id: string;
    task_id: string;
    submitter_id: string;
    text_content: string;
    ai_formatted_content: string | null;
    latitude: number | null;
    longitude: number | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    supervisor_notes: string | null;
    created_at: string;
    
    // joined
    task?: {
        title: string;
        department?: {
            name: string;
        };
    };
    submitter?: {
        full_name: string;
        email: string;
    };
    attachments?: {
        id: string;
        file_url: string;
        file_type: string;
    }[];
}

export function usePendingReports() {
    const { user } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = useCallback(async () => {
        if (!user || user.role === 'WORKER') return;
        setLoading(true);
        try {
            if (supabase) {
                // Fetch reports where status is PENDING.
                // For EMPLOYEE (Supervisor), ideally we filter by tasks in their department.
                let query = supabase.from('reports').select(`
                    *,
                    task:tasks(title, department_id, department:departments(name)),
                    submitter:users!reports_submitter_id_fkey(full_name, email),
                    attachments(id, file_url, file_type)
                `).eq('status', 'PENDING');
                
                // RLS or direct filter
                // Note: supabase filter on nested object requires inner join or we filter manually.
                const { data, error } = await query;
                if (error) throw error;
                
                let filteredData = data as any as Report[];
                if (user.role === 'EMPLOYEE' && user.department_id) {
                    filteredData = filteredData.filter(r => (r.task as any)?.department_id === user.department_id);
                }
                
                setReports(filteredData);
            } else {
                setReports([
                    {
                        id: 'mock-1',
                        task_id: 'task-1',
                        submitter_id: 'worker-1',
                        text_content: 'Replaced bearing on B-22. It was running hot.',
                        ai_formatted_content: 'Action Taken: Replaced bearing on Conveyor Belt B-22.\nObservation: The previous bearing was observed to be running at an elevated temperature.',
                        latitude: 40.7128,
                        longitude: -74.0060,
                        status: 'PENDING',
                        supervisor_notes: null,
                        created_at: new Date().toISOString(),
                        task: { title: 'Inspect Conveyor Belt B-22', department: { name: 'Mechanical' }, latitude: 40.7126, longitude: -74.0062 },
                        submitter: { full_name: 'John Doe', email: 'john@example.com' },
                        attachments: [
                            { id: 'att-1', file_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800', file_type: 'IMAGE' }
                        ]
                    }
                ]);
            }
        } catch (err) {
            console.error("Failed to fetch reports", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const reviewReport = async (reportId: string, status: 'APPROVED' | 'REJECTED', notes: string) => {
        try {
            if (supabase) {
                const { error: reportErr } = await supabase.from('reports').update({ status, supervisor_notes: notes }).eq('id', reportId);
                if (reportErr) throw reportErr;
                
                // After approving report, we might want to automatically mark task as COMPLETED
                if (status === 'APPROVED') {
                    // Get task id
                    const rep = reports.find(r => r.id === reportId);
                    if (rep) {
                        await supabase.from('tasks').update({ status: 'COMPLETED', completed_at: new Date().toISOString() }).eq('id', rep.task_id);
                    }
                } else {
                    // If rejected, put task back to in progress
                    const rep = reports.find(r => r.id === reportId);
                    if (rep) {
                        await supabase.from('tasks').update({ status: 'IN_PROGRESS' }).eq('id', rep.task_id);
                    }
                }
                fetchReports();
            } else {
                setReports(reports.filter(r => r.id !== reportId));
            }
        } catch (err) {
            console.error("Failed to review report", err);
        }
    };

    return { reports, loading, reviewReport, refetch: fetchReports };
}
