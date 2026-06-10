import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (supabase) {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password',
            });
            if (resetError) {
                setError(resetError.message);
                return;
            }
        }
        
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-dark px-4 overflow-hidden relative">
            <div className="relative w-full max-w-md bg-surface border border-slate-800 shadow-2xl rounded-xl p-8 z-10 ai-glow">
                
                <Link to="/login" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider mb-8">
                    <ArrowLeft size={16} /> Back to Login
                </Link>

                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-slate-300 shadow-lg">
                        <Mail size={24} />
                    </div>
                </div>
                
                <h1 className="text-xl font-bold tracking-tight text-center text-white mb-2">
                    Reset Password
                </h1>

                {error && (
                    <div className="mb-6 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs font-medium text-red-400 text-center uppercase tracking-widest">
                        {error}
                    </div>
                )}
                
                {submitted ? (
                    <div className="text-center">
                        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                            If an account exists for <strong className="text-white">{email}</strong>, you will receive password reset instructions.
                        </p>
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm mb-6">
                            Check your inbox for the recovery link.
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-slate-400 text-center mb-8 text-sm leading-relaxed">
                            Enter your employee email. We will send you instructions to reset your secure enterprise password.
                        </p>
        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                    Enterprise Email
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-slate-600 transition-all text-sm"
                                        placeholder="employee@jswworkflow.com"
                                        required
                                    />
                                    <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-lg shadow-blue-900/20 text-sm tracking-wide"
                            >
                                Send Reset Instructions
                            </button>
                        </form>
                    </>
                )}

                <p className="mt-8 text-center text-[10px] text-slate-600 font-mono tracking-widest uppercase">
                    JSW Workflow Pro v2.4.0
                </p>
            </div>
            
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none flex justify-center items-center opacity-[0.03]">
               <div className="w-[800px] h-[800px] border border-white rounded-full"></div>
            </div>
        </div>
    );
}
