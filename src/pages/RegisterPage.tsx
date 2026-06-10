import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, User as UserIcon, Mail, Building, ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register, user } = useAuth();
    
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    React.useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    if (user) {
        return null;
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await register(email, password, { full_name: fullName, employee_id: employeeId });
            navigate('/login', { replace: true, state: { message: "Registration successful. Please log in." } });
        } catch (err: any) {
            setError(err.message || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-dark px-4 overflow-hidden relative">
            <div className="relative w-full max-w-md bg-surface border border-slate-800 shadow-2xl rounded-xl p-8 z-10 ai-glow">
                
                <Link to="/login" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider mb-8">
                    <ArrowLeft size={16} /> Back to Login
                </Link>

                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl italic shadow-lg shadow-blue-600/20">
                        JSW
                    </div>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-center text-white mb-2">
                    Enterprise Registration
                </h1>
                <p className="text-slate-400 text-center mb-8 text-sm">
                    Register for organizational access
                </p>

                {error && (
                    <div className="mb-6 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs font-medium text-red-400 text-center uppercase tracking-widest">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Full Name
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-slate-600 transition-all text-sm"
                                placeholder="John Doe"
                                required
                            />
                            <UserIcon size={16} className="absolute left-3 top-3 text-slate-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Employee ID
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={employeeId}
                                onChange={e => setEmployeeId(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-slate-600 transition-all text-sm"
                                placeholder="JSW-10492"
                                required
                            />
                            <Building size={16} className="absolute left-3 top-3 text-slate-500" />
                        </div>
                    </div>
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
                                placeholder="name@jswworkflow.com"
                                required
                            />
                            <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Password
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
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-lg shadow-blue-900/20 text-sm tracking-wide mt-2 disabled:opacity-50"
                    >
                        {loading ? 'Registering...' : 'Register Account'}
                    </button>
                    <p className="mt-6 text-center text-[10px] text-slate-600 font-mono tracking-widest uppercase">
                        Pending Admin Approval
                    </p>
                </form>
            </div>
            
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none flex justify-center items-center opacity-[0.03]">
               <div className="w-[800px] h-[800px] border border-white rounded-full"></div>
            </div>
        </div>
    );
}
