import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Typically Supabase handles the session via hash fragment in the URL
        // If the user lands here, Supabase client should detect it.
        supabase?.auth.onAuthStateChange((event, session) => {
            if (event == "PASSWORD_RECOVERY") {
                console.log("Password recovery event received");
            }
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        
        setLoading(true);
        if (supabase) {
             const { error } = await supabase.auth.updateUser({ password });
             if (error) {
                 setError(error.message);
                 setLoading(false);
             } else {
                 navigate('/login', { replace: true, state: { message: "Password updated successfully." } });
             }
        } else {
             // Mock scenario
             setTimeout(() => {
                 navigate('/login', { replace: true });
             }, 1000);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-dark px-4 overflow-hidden relative">
            <div className="relative w-full max-w-md bg-surface border border-slate-800 shadow-2xl rounded-xl p-8 z-10 ai-glow">
                
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-slate-300 shadow-lg">
                        <Lock size={24} />
                    </div>
                </div>
                
                <h1 className="text-xl font-bold tracking-tight text-center text-white mb-2">
                    Set New Password
                </h1>
                
                <p className="text-slate-400 text-center mb-8 text-sm leading-relaxed">
                    Please secure your account with a strong new password.
                </p>

                {error && (
                    <div className="mb-6 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs font-medium text-red-400 text-center uppercase tracking-widest">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-slate-600 transition-all text-sm"
                                placeholder="••••••••"
                                required
                            />
                            <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-slate-600 transition-all text-sm"
                                placeholder="••••••••"
                                required
                            />
                            <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-lg shadow-blue-900/20 text-sm tracking-wide disabled:opacity-50"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
