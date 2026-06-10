import { useParams, useNavigate } from "react-router-dom";
import ReportBuilder from "../components/ReportBuilder";
import TaskChat from "../components/TaskChat";
import { ArrowLeft, CheckCircle2, Paperclip, Camera, MapPin, Send, Mic, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function TaskDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // Mock local task reference
    const task = {
        id,
        title: "Inspect Conveyor Belt B-22",
        department: "Mechanical",
        status: "PENDING",
        priority: "HIGH",
        date: new Date().toISOString()
    };

    const [fieldNotes, setFieldNotes] = useState("");
    const [generating, setGenerating] = useState(false);
    const [report, setReport] = useState("");

    const handleGenerateReport = async () => {
        if (!fieldNotes.trim()) return;
        setGenerating(true);
        try {
            const res = await fetch("/api/ai/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: fieldNotes })
            });
            const data = await res.json();
            if (data.report) {
                setReport(data.report);
            } else {
                alert("Generation failed: " + data.error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="flex h-full bg-slate-950/50 backdrop-blur-sm text-white">
            {/* Left Column: Task Details & Reporting */}
            <div className="flex-1 overflow-y-auto border-r border-slate-800 p-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors font-medium text-sm">
                    <ArrowLeft size={16} /> Back to list
                </button>

                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{task.title}</h1>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span className="bg-blue-900/20 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-md font-medium">
                                {task.department}
                            </span>
                            <span className="flex items-center gap-1">
                                <CheckCircle2 size={14} className={task.status === 'COMPLETED' ? 'text-green-500' : ''} /> 
                                {task.status.replace("_", " ")}
                            </span>
                        </div>
                    </div>
                    <button className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-lg shadow-blue-900/20">
                        Mark as Complete
                    </button>
                </div>

                {/* Submitting a Field Report */}
                {task.id && (
                    <ReportBuilder taskId={task.id} onSubmitted={() => {
                        navigate('/worker/dashboard'); // Or show success
                        alert('Report successfully submitted for approval!');
                    }} />
                )}
            </div>

            {/* Right Column: Task Chat */}
            {task.id && <TaskChat taskId={task.id} />}
        </div>
    );
}
