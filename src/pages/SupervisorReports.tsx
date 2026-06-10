import React, { useState } from 'react';
import { usePendingReports, Report } from '../hooks/useReports';
import MapLocationViewer from '../components/MapLocationViewer';
import { CheckCircle2, XCircle, MapPin, Camera, Video, Mic, FileText, Cpu } from 'lucide-react';
import { format } from 'date-fns';

export default function SupervisorReports() {
    const { reports, loading, reviewReport } = usePendingReports();
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [supervisorNotes, setSupervisorNotes] = useState('');
    const [reviewing, setReviewing] = useState(false);

    const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
        if (!selectedReport) return;
        setReviewing(true);
        try {
            await reviewReport(selectedReport.id, status, supervisorNotes);
            setSelectedReport(null);
            setSupervisorNotes('');
        } finally {
            setReviewing(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-white">Loading pending reports...</div>;
    }

    return (
        <div className="flex h-full bg-slate-950 text-white overflow-hidden">
            {/* Left column: List */}
            <div className={`w-full md:w-1/3 min-w-[320px] bg-slate-900 border-r border-slate-800 flex flex-col ${selectedReport ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold">Pending Approvals</h1>
                    <p className="text-sm text-slate-400 mt-1">{reports.length} reports to review</p>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {reports.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            <CheckCircle2 size={40} className="mx-auto mb-4 opacity-50" />
                            <p>All caught up!</p>
                        </div>
                    )}
                    {reports.map(report => (
                        <button 
                            key={report.id}
                            onClick={() => setSelectedReport(report)}
                            className={`w-full text-left p-5 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors ${selectedReport?.id === report.id ? 'bg-slate-800/80 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-sm truncate">{report.task?.title}</h3>
                                <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                                    {format(new Date(report.created_at), 'MMM d, p')}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mb-3 truncate">By: {report.submitter?.full_name}</p>
                            
                            <div className="flex gap-2">
                                {report.attachments?.some(a => a.file_type === 'IMAGE') && <Camera size={14} className="text-slate-500" />}
                                {report.attachments?.some(a => a.file_type === 'VIDEO') && <Video size={14} className="text-slate-500" />}
                                {report.latitude && <MapPin size={14} className="text-slate-500" />}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right column: Detail */}
            <div className={`flex-1 flex flex-col ${!selectedReport ? 'hidden md:flex' : 'flex'} bg-slate-950`}>
                {!selectedReport ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500 flex-col">
                        <FileText size={48} className="mb-4 opacity-20" />
                        <p>Select a report to review</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-start md:items-center bg-slate-900 shrink-0">
                            <div>
                                <button onClick={() => setSelectedReport(null)} className="md:hidden text-slate-400 hover:text-white mb-4 text-sm font-medium flex items-center gap-1">
                                    ← Back to list
                                </button>
                                <h2 className="text-2xl font-bold mb-1">{selectedReport.task?.title}</h2>
                                <p className="text-sm text-slate-400">
                                    Submitted by <span className="text-white font-medium">{selectedReport.submitter?.full_name}</span> in <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">{selectedReport.task?.department?.name}</span>
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
                                            <div key={att.id} className="w-40 h-40 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 relative group">
                                                {att.file_type === 'IMAGE' ? (
                                                    <img src={att.file_url} alt="Evidence" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                        {att.file_type === 'VIDEO' ? <Video size={32} /> : <Mic size={32} />}
                                                        <span className="text-xs mt-2">{att.file_type}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Content */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Raw Notes</h3>
                                <div className="bg-black/30 p-5 rounded-xl border border-slate-800 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                    {selectedReport.text_content}
                                </div>
                            </div>

                            {selectedReport.ai_formatted_content && (
                                <div>
                                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Cpu size={16} /> AI Formatted Output
                                    </h3>
                                    <div className="bg-indigo-950/20 p-6 rounded-xl border border-indigo-500/20 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed ai-glow">
                                        {selectedReport.ai_formatted_content}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Bar */}
                        <div className="bg-slate-900 border-t border-slate-800 p-6 shrink-0">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Supervisor Notes (Optional)</label>
                            <textarea 
                                value={supervisorNotes}
                                onChange={e => setSupervisorNotes(e.target.value)}
                                placeholder="Add comments before approving or rejecting..."
                                className="w-full h-20 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 mb-4 text-sm resize-none"
                            />
                            
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => handleReview('REJECTED')}
                                    disabled={reviewing}
                                    className="flex-1 px-4 py-3 bg-red-950 hover:bg-red-900 text-red-400 border border-red-900 font-semibold rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                                >
                                    <XCircle size={18} /> Reject & Rework
                                </button>
                                <button 
                                    onClick={() => handleReview('APPROVED')}
                                    disabled={reviewing}
                                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2 disabled:opacity-50"
                                >
                                    <CheckCircle2 size={18} /> Approve & Complete Task
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
