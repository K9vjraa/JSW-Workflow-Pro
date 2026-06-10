import React, { useState } from 'react';
import { Cpu, CheckCircle, ShieldAlert, ListChecks, Paperclip, Loader2, Sparkles } from 'lucide-react';

interface AIPlan {
    inspectionChecklist: string[];
    suggestedTasks: string[];
    safetyChecks: string[];
    requiredAttachments: string[];
}

export default function AITaskGenerator({ onApply }: { onApply?: (plan: AIPlan & { title: string }) => void }) {
    const [issue, setIssue] = useState('');
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [plan, setPlan] = useState<AIPlan | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!issue.trim()) return;
        
        setGenerating(true);
        setError('');
        setPlan(null);
        
        try {
            const res = await fetch("/api/ai/task", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ issue })
            });
            const data = await res.json();
            
            if (res.ok) {
                setPlan(data);
            } else {
                setError(data.error || 'Failed to generate task plan');
            }
        } catch (err: any) {
            console.error("AI Task Generation error:", err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-xl overflow-hidden shadow-lg shadow-indigo-900/10">
            <div className="p-5 border-b border-slate-800 bg-indigo-950/20">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white tracking-wide">AI Task Plan Generator</h3>
                        <p className="text-xs text-slate-400">Describe an issue to generate a comprehensive maintenance plan</p>
                    </div>
                </div>
                
                <form onSubmit={handleGenerate} className="mt-4 flex gap-3">
                    <input 
                        type="text" 
                        value={issue}
                        onChange={(e) => setIssue(e.target.value)}
                        placeholder="e.g., Motor vibration issue in Pump P-12"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        disabled={generating}
                    />
                    <button 
                        type="submit" 
                        disabled={generating || !issue.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {generating ? <Loader2 size={16} className="animate-spin" /> : <Cpu size={16} />} 
                        {generating ? 'ANALYZING...' : 'GENERATE'}
                    </button>
                </form>

                {error && (
                    <div className="mt-3 text-red-400 text-xs bg-red-950/30 border border-red-900/50 p-2 rounded">
                        <span className="font-bold uppercase tracking-wider">Error:</span> {error}
                    </div>
                )}
            </div>

            {plan && (
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/50">
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <ListChecks size={14} className="text-blue-400" /> Inspection Checklist
                        </h4>
                        <ul className="space-y-2">
                            {plan.inspectionChecklist.map((item, i) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="text-blue-500 mt-1">•</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <CheckCircle size={14} className="text-emerald-400" /> Suggested Tasks
                        </h4>
                        <ul className="space-y-2">
                            {plan.suggestedTasks.map((item, i) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="text-emerald-500 mt-1">•</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <ShieldAlert size={14} className="text-amber-400" /> Safety Checks (LOTO)
                        </h4>
                        <ul className="space-y-2">
                            {plan.safetyChecks.map((item, i) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="text-amber-500 mt-1">•</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Paperclip size={14} className="text-purple-400" /> Required Attachments
                        </h4>
                        <ul className="space-y-2">
                            {plan.requiredAttachments.map((item, i) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="text-purple-500 mt-1">•</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {onApply && (
                        <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-slate-800 flex justify-end">
                            <button 
                                onClick={() => onApply({ ...plan, title: issue })}
                                className="bg-white text-black hover:bg-slate-200 px-6 py-2 rounded-lg text-sm font-bold tracking-wider uppercase transition-colors"
                            >
                                Apply Plan to New Task
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
