import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface AnalyticsData {
    taskStats: {
        total: number;
        completed: number;
        in_progress: number;
        pending_approval: number;
    };
    departmentPerformance: {
        name: string;
        completed: number;
        total: number;
    }[];
    workerProductivity: {
        name: string;
        completed_tasks: number;
    }[];
    monthlyTrends: {
        month: string;
        completed: number;
    }[];
    pendingApprovals: number;
}

export function useAdminAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!supabase) {
                // Mock data for initial UI render
                setData({
                    taskStats: { total: 154, completed: 89, in_progress: 45, pending_approval: 20 },
                    departmentPerformance: [
                        { name: 'Mechanical', completed: 45, total: 60 },
                        { name: 'Electrical', completed: 30, total: 50 },
                        { name: 'Civil', completed: 14, total: 44 }
                    ],
                    workerProductivity: [
                        { name: 'Raju Sharma', completed_tasks: 25 },
                        { name: 'Arif Khan', completed_tasks: 21 },
                        { name: 'Vikram Singh', completed_tasks: 18 }
                    ],
                    monthlyTrends: [
                        { month: 'Jan', completed: 40 },
                        { month: 'Feb', completed: 55 },
                        { month: 'Mar', completed: 78 },
                        { month: 'Apr', completed: 65 },
                        { month: 'May', completed: 89 }
                    ],
                    pendingApprovals: 20
                });
                setLoading(false);
                return;
            }

            try {
                const { data: result, error } = await supabase.rpc('get_admin_analytics');
                if (error) throw error;
                if (result) {
                    setData(result as AnalyticsData);
                }
            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    return { data, loading };
}
