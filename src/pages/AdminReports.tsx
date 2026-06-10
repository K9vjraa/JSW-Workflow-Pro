import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Report } from '../hooks/useReports';
import MapLocationViewer from '../components/MapLocationViewer';
import { FileText, Search, MapPin, Camera, Video, Cpu, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminReports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                if (supabase) {
                    const { data, error } = await supabase.from('reports').select(`
                        *,
                        task:tasks(title, department_id, department:departments(name)),
                        submitter:users!reports_submitter_id_fkey(full_name, email),
                        attachments(id, file_url, file_type)
                    `).order('created_at', { ascending: false });
                    
                    if (error) throw error;
                    setReports(data as any as Report[]);
                } else {
                    // mock
                    setReports([
                         {
                            id: 'mock-1',
                            task_id: 'task-1',
                            submitter_id: 'worker-1',
                            text_content: 'Replaced bearing on B-22. It was running hot.',
                            ai_formatted_content: 'Action Taken: Replaced bearing on Conveyor Belt B-22.\nObservation: The previous bearing was observed to be running at an elevated temperature.',
                            latitude: 40.7128,
                            longitude: -74.0060,
                            status: 'APPROVED',
                            supervisor_notes: 'Good job',
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
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const filteredReports = reports;

    if (loading) {
        return <div className="p-8 text-white">Loading all reports...</div>;
    }

    return (
        <div className="flex bg-slate-950 text-white h-full relative">
             {/* Left column: List */}
             <div className={`w-full md:w-80 min-w-[320px] bg-slate-900 border-r border-slate-800 flex flex-col ${selectedReport ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold">All Reports</h1>
                    <div className="mt-4 relative">
                        <input type="text" placeholder="Search reports..." className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                        <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {filteredReports.map(report => (
                        <button 
                            key={report.id}
                            onClick={() => setSelectedReport(report)}
                            className={`w-full text-left p-5 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors ${selectedReport?.id === report.id ? 'bg-slate-800/80 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-sm truncate w-2/3">{report.task?.title}</h3>
                                <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                                    {format(new Date(report.created_at), 'MMM d')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-xs text-slate-400 truncate w-2/3">{report.submitter?.full_name}</p>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${report.status === 'APPROVED' ? 'bg-emerald-900/40 text-emerald-400' : report.status === 'REJECTED' ? 'bg-red-900/40 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                                    {report.status}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right column: Detail */}
            <div className={`flex-1 flex flex-col ${!selectedReport ? 'hidden md:flex' : 'flex'} bg-slate-950 h-full`}>
                {!selectedReport ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500 flex-col">
                        <FileText size={48} className="mb-4 opacity-20" />
                        <p>Select a report to view details</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-start bg-slate-900 shrink-0">
                            <div>
                                <button onClick={() => setSelectedReport(null)} className="md:hidden text-slate-400 hover:text-white mb-4 text-sm font-medium flex items-center gap-1">
                                    ← Back
                                </button>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-bold">{selectedReport.task?.title}</h2>
                                    <span className={`text-xs uppercase font-bold px-2 py-1 rounded-full ${selectedReport.status === 'APPROVED' ? 'bg-emerald-900/40 text-emerald-400' : selectedReport.status === 'REJECTED' ? 'bg-red-900/40 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                                        {selectedReport.status}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400">
                                    Submitted by <span className="text-white font-medium">{selectedReport.submitter?.full_name}</span> in <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">{selectedReport.task?.department?.name}</span>
                                    <span className="mx-2">•</span>
                                    {format(new Date(selectedReport.created_at), 'MMMM d, yyyy h:mm a')}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                            
                            {/* Geo Tag verification */}
                            {selectedReport.latitude && selectedReport.longitude && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <MapPin size={16} /> Geo-Location Verification
                                    </h3>
                                    <MapLocationViewer 
                                        taskLocation={(selectedReport.task as any)?.latitude ? { lat: (selectedReport.task as any).latitude, lng: (selectedReport.task as any).longitude } : null}
                                        workerLocation={{ lat: selectedReport.latitude, lng: selectedReport.longitude }}
                                    />
                                    <div className="text-xs text-slate-500 mt-2">
                                        Report location logged at: {format(new Date(selectedReport.created_at), 'MMM d, yyyy h:mm:ss a')}
                                    </div>
                                </div>
                            )}

                            {/* Attachments Gallery */}
                            {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Evidences</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {selectedReport.attachments.map(att => (
                                            <div key={att.id} className="w-40 h-40 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 relative">
                                                {att.file_type === 'IMAGE' ? (
                                                    <img src={att.file_url} alt="Evidence" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                                                        {att.file_type === 'VIDEO' ? <Video size={32} /> : <FileText size={32} />}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Content */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Raw Notes</h3>
                                    <div className="bg-black/30 p-5 rounded-xl border border-slate-800 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed h-full">
                                        {selectedReport.text_content}
                                    </div>
                                </div>

                                {selectedReport.ai_formatted_content && (
                                    <div>
                                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Cpu size={16} /> AI Formatted Output
                                        </h3>
                                        <div className="bg-indigo-950/20 p-6 rounded-xl border border-indigo-500/20 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed ai-glow h-full">
                                            {selectedReport.ai_formatted_content}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Supervisor Notes */}
                            {selectedReport.supervisor_notes && (
                                <div className={`p-5 rounded-xl border ${selectedReport.status === 'APPROVED' ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-red-950/20 border-red-900/50'}`}>
                                    <h3 className={`text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${selectedReport.status === 'APPROVED' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {selectedReport.status === 'APPROVED' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                        Supervisor Notes
                                    </h3>
                                    <p className="text-slate-300 text-sm">{selectedReport.supervisor_notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
