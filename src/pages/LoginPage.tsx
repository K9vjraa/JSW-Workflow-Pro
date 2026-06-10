import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Lock, User as UserIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, user } = useAuth();
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    
    // If already logged in, redirect to respective dashboard
    React.useEffect(() => {
        if (user) {
            const redirectPath = user.role === 'ADMIN' ? '/admin/dashboard' : 
                                 user.role === 'EMPLOYEE' ? '/employee/dashboard' : 
                                 '/worker/dashboard';
            navigate(redirectPath, { replace: true });
        }
    }, [user, navigate]);

    if (user) {
        return null; // Don't render login page
    }

    const from = location.state?.from?.pathname || '/';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
             await login(email, password);
             navigate(from, { replace: true });
        } catch (err: any) {
             setError(err.message || 'Failed to login');
        }
    };

    const handleDemoLogin = async (demoEmail: string, role: string) => {
        setEmail(demoEmail);
        setPassword(`${role}@123`);
        // We delay slightly to show the form auto-fill before submitting
        setTimeout(async () => {
             try {
                await login(demoEmail, `${role}@123`);
                
                const redirectPath = role === 'Admin' ? '/admin/dashboard' : 
                                     role === 'Employee' ? '/employee/dashboard' : 
                                     '/worker/dashboard';
                navigate(redirectPath, { replace: true });
             } catch (err) {
                console.error(err);
             }
        }, 500);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-dark px-4 overflow-hidden relative">
            
            {/* Demo Accounts Panel */}
            <div className="absolute top-8 right-8 z-20 flex flex-col gap-2">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2 ml-1">Demo Access</div>
                <button 
                  onClick={() => handleDemoLogin('admin@jswworkflow.com', 'Admin')}
                  className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-lg text-xs text-slate-300 font-medium transition-colors text-left flex items-center justify-between shadow-lg"
                >
                   <span>Admin Login</span> <span className="w-2 h-2 rounded-full bg-blue-500 ml-6"></span>
                </button>
                <button 
                  onClick={() => handleDemoLogin('employee@jswworkflow.com', 'Employee')}
                  className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-jsw-orange rounded-lg text-xs text-slate-300 font-medium transition-colors text-left flex items-center justify-between shadow-lg"
                >
                   <span>Employee Login</span> <span className="w-2 h-2 rounded-full bg-jsw-orange ml-6"></span>
                </button>
                <button 
                  onClick={() => handleDemoLogin('worker@jswworkflow.com', 'Worker')}
                  className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-green-500 rounded-lg text-xs text-slate-300 font-medium transition-colors text-left flex items-center justify-between shadow-lg"
                >
                   <span>Worker Login</span> <span className="w-2 h-2 rounded-full bg-green-500 ml-6"></span>
                </button>
            </div>

            <div className="relative w-full max-w-md bg-surface border border-slate-800 shadow-2xl rounded-xl p-8 z-10 ai-glow">
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl italic shadow-lg shadow-blue-600/20">
                        JSW
                    </div>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-center text-white mb-2">
                    WorkFlow <span className="text-blue-500 glow-text">PRO</span>
                </h1>
                <p className="text-slate-400 text-center mb-8 text-sm">
                    Enter your enterprise credentials to access the portal
                </p>

                {error && (
                    <div className="mb-6 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs font-medium text-red-400 text-center uppercase tracking-widest">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Employee Email or ID
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-slate-600 transition-all text-sm"
                                placeholder="e.g., worker1@jsw.in"
                                required
                            />
                            <UserIcon size={16} className="absolute left-3 top-3 text-slate-500" />
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
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-slate-600 transition-all text-sm pr-10"
                                placeholder="••••••••"
                                required
                            />
                            <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between pb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-bg-dark" />
                            <span className="text-sm text-slate-400">Remember me</span>
                        </label>
                        <Link to="/forgot-password" className="text-sm text-blue-500 hover:text-blue-400 transition-colors">Forgot password?</Link>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-lg shadow-blue-900/20 text-sm tracking-wide flex justify-center items-center gap-2"
                    >
                        Sign In Securely
                    </button>
                    <div className="mt-4 text-center">
                        <Link to="/register" className="text-sm text-slate-400 hover:text-white transition-colors">Request Account Access</Link>
                    </div>
                    <p className="mt-8 text-center text-[10px] text-slate-600 font-mono tracking-widest uppercase">
                        Authorized personnel only.
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
