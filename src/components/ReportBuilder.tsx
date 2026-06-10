import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Video, Mic, MapPin, Send, Cpu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ReportBuilderProps {
  taskId: string;
  onSubmitted: () => void;
}

export default function ReportBuilder({ taskId, onSubmitted }: ReportBuilderProps) {
  const { user } = useAuth();
  const [textContent, setTextContent] = useState('');
  const [aiFormatted, setAiFormatted] = useState('');
  const [aiError, setAiError] = useState('');
  const [generating, setGenerating] = useState(false);
  
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locating, setLocating] = useState(false);
  
  const [attachments, setAttachments] = useState<{type: 'IMAGE' | 'VIDEO' | 'AUDIO', url: string}[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const getGeoLocation = () => {
    setLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocating(false);
        },
        (error) => {
          console.error("Error obtaining location:", error);
          setLocating(false);
        }
      );
    } else {
      setLocating(false);
    }
  };

  const handleAiFormat = async () => {
    if (!textContent.trim()) return;
    setGenerating(true);
    setAiError('');
    try {
        const res = await fetch("/api/ai/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textContent })
        });
        const data = await res.json();
        if (res.ok && data.report) {
            setAiFormatted(data.report);
        } else {
            setAiError(data.error || 'Failed to format report');
        }
    } catch (err: any) {
        console.error(err);
        setAiError(err.message || 'An unexpected error occurred');
    } finally {
        setGenerating(false);
    }
  };

  const addMockAttachment = (type: 'IMAGE' | 'VIDEO' | 'AUDIO') => {
      const mockUrls = {
          IMAGE: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
          VIDEO: "https://example.com/mock-video.mp4",
          AUDIO: "https://example.com/mock-audio.mp3"
      };
      setAttachments([...attachments, { type, url: mockUrls[type] }]);
  };

  const submitReport = async () => {
      if (!user) return;
      setSubmitting(true);
      try {
          if (supabase) {
             const reportData = {
                 task_id: taskId,
                 submitter_id: user.id,
                 text_content: textContent,
                 ai_formatted_content: aiFormatted || null,
                 latitude: location?.lat || null,
                 longitude: location?.lng || null,
                 status: 'PENDING'
             };
             
             const { data: reportObj, error: reportErr } = await supabase.from('reports').insert([reportData]).select().single();
             if (reportErr) throw reportErr;
             
             if (attachments.length > 0 && reportObj) {
                 const attData = attachments.map(att => ({
                     uploader_id: user.id,
                     report_id: reportObj.id,
                     file_url: att.url,
                     file_type: att.type
                 }));
                 const { error: attErr } = await supabase.from('attachments').insert(attData);
                 if (attErr) throw attErr;
             }
             
             // Update task status to PENDING_APPROVAL
             await supabase.from('tasks').update({ status: 'PENDING_APPROVAL' }).eq('id', taskId);
             onSubmitted();
          } else {
             // Mock success
             console.log("Mock submitted report:", { textContent, attachments, location });
             setTimeout(() => onSubmitted(), 1000);
          }
      } catch (err) {
          console.error("Submit error", err);
      } finally {
          setSubmitting(false);
      }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Submit Execution Report</h3>
      
      <textarea 
          placeholder="Detailed field notes..."
          value={textContent}
          onChange={e => setTextContent(e.target.value)}
          className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-4 text-white resize-none focus:outline-none focus:border-blue-500 mb-4 text-sm"
      />
      
      {aiFormatted && (
          <div className="mb-4 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
             <div className="text-xs font-bold text-indigo-400 mb-2 uppercase flex items-center gap-2">
                <Cpu size={14} /> AI Formatted Preview
             </div>
             <p className="text-sm text-indigo-100 whitespace-pre-wrap">{aiFormatted}</p>
          </div>
      )}

      {aiError && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <span className="font-bold">AI Error:</span> {aiError}
          </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
          <button onClick={handleAiFormat} disabled={generating || !textContent} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors">
              <Cpu size={14} /> {generating ? 'Formatting...' : 'AI Enhance'}
          </button>
          
          <div className="h-4 w-px bg-slate-700 mx-1"></div>
          
          <button onClick={() => addMockAttachment('IMAGE')} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors">
              <Camera size={14} /> Photo
          </button>
          <button onClick={() => addMockAttachment('VIDEO')} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors">
              <Video size={14} /> Video
          </button>
          <button onClick={() => addMockAttachment('AUDIO')} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors">
              <Mic size={14} /> Audio
          </button>
          
          <div className="h-4 w-px bg-slate-700 mx-1"></div>
          
          <button onClick={getGeoLocation} disabled={locating} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${location ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}>
              <MapPin size={14} /> {locating ? 'Locating...' : location ? 'Location Added' : 'Add Geo-Tag'}
          </button>
      </div>

      {attachments.length > 0 && (
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
              {attachments.map((att, i) => (
                  <div key={i} className="relative w-16 h-16 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center shrink-0">
                      {att.type === 'IMAGE' && <Camera size={20} className="text-slate-400" />}
                      {att.type === 'VIDEO' && <Video size={20} className="text-slate-400" />}
                      {att.type === 'AUDIO' && <Mic size={20} className="text-slate-400" />}
                      <span className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full border border-slate-900"></span>
                  </div>
              ))}
          </div>
      )}

      <button 
          onClick={submitReport} 
          disabled={submitting || !textContent}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
      >
          <Send size={18} />
          {submitting ? 'Submitting...' : 'Submit Report For Approval'}
      </button>
    </div>
  );
}
