import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
    CheckSquare, Sun, Star, Calendar, UserIcon, LayoutDashboard, 
    MessageSquare, Settings, LogOut, Search, Bell, MapPin, Users,
    FileText, PieChart, Download
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Dynamic Navigation based on user role
  const getNavItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'ADMIN':
        return [
          { name: "Terminal", path: "/admin/dashboard", icon: LayoutDashboard },
          { name: "Users", path: "/admin/users", icon: Users },
          { name: "Departments", path: "/admin/departments", icon: LayoutDashboard },
          { name: "All Reports", path: "/admin/reports", icon: FileText },
          { name: "Analytics", path: "/admin/analytics", icon: PieChart },
          { name: "Global Chat", path: "/chat", icon: MessageSquare },
        ];
      case 'EMPLOYEE':
        return [
          { name: "Dashboard", path: "/employee/dashboard", icon: LayoutDashboard },
          { name: "Manage Tasks", path: "/employee/tasks", icon: CheckSquare },
          { name: "Dept Reports", path: "/employee/reports", icon: FileText },
          { name: "My Team", path: "/employee/team", icon: Users },
          { name: "Dept Chat", path: "/chat", icon: MessageSquare },
        ];
      case 'WORKER':
        return [
          { name: "My Day", path: "/worker/dashboard", icon: Sun },
          { name: "Assigned Tasks", path: "/worker/tasks", icon: CheckSquare },
          { name: "My Reports", path: "/worker/reports", icon: FileText },
          { name: "Task Chat", path: "/chat", icon: MessageSquare },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen bg-bg-dark text-text-main font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-black border-r border-slate-800 flex flex-col h-full z-10 transition-colors shrink-0">
        <div className="p-4 flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold italic">
            JSW
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            WorkFlow <span className="text-blue-500">PRO</span>
          </h1>
        </div>

        <div className="text-[10px] font-semibold text-slate-500 mb-2 px-7 uppercase tracking-widest mt-2">
            {user?.role.replace('_', ' ')} PORTAL
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== "/admin/dashboard" && item.path !== "/employee/dashboard" && item.path !== "/worker/dashboard" && item.path !== "/chat");
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={isActive 
                  ? "flex items-center gap-3 px-3 py-2.5 bg-surface-bright text-white rounded-md font-medium border-l-[3px] border-blue-600 transition-all mb-1 text-sm shadow-sm"
                  : "flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-surface-bright hover:border-l-[3px] hover:border-blue-600 rounded-md border-l-[3px] border-transparent transition-all mb-1 text-sm"}
              >
                <Icon size={18} className={isActive ? "text-blue-500" : ""} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800 space-y-2">
          {user?.role === 'WORKER' && (
            <div className="p-4 glass rounded-xl border border-slate-800 mb-4">
              <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-widest font-semibold">Current Shift</div>
              <div className="text-sm font-medium text-slate-200">Morning: 06:00 - 14:00</div>
            </div>
          )}
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 w-full text-slate-400 hover:bg-surface-bright rounded-md text-sm transition-all text-left">
             <Settings size={18} />
             Settings
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full text-red-500 hover:bg-surface-bright hover:text-red-400 rounded-md text-sm transition-all text-left">
             <LogOut size={18} />
             Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 z-20 shrink-0">
            <div className="flex items-center gap-4">
               <h1 className="text-xl font-semibold text-white">Operations Terminal</h1>
               <span className="text-sm text-slate-500">
                   {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
               </span>
            </div>
            
            <div className="flex items-center gap-6 ml-auto">
                {deferredPrompt && (
                   <button 
                     onClick={handleInstallClick}
                     className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-full transition-colors shrink-0"
                   >
                     <Download size={14} /> Install
                   </button>
                )}
                <div className="relative flex items-center bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 hidden sm:flex">
                    <Search size={16} className="text-slate-500 mr-2" />
                    <input 
                      type="text" 
                      placeholder="Search tasks..." 
                      className="bg-transparent border-none outline-none text-sm w-48 text-white placeholder-slate-500"
                    />
                </div>
                
                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <div className="flex items-center gap-2 cursor-pointer pl-4 border-l border-slate-800">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold text-xs uppercase">
                            {user?.name.substring(0, 2) || 'JD'}
                        </div>
                        <div className="text-sm font-medium text-white hidden md:block">
                            <div className="leading-tight">{user?.name}</div>
                            <div className="text-[10px] text-slate-500 tracking-wide">{user?.role}</div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
        
        <div className="flex-1 overflow-auto bg-transparent relative">
            <Outlet />
        </div>

        {/* Footer */}
        <footer className="h-10 border-t border-slate-800 bg-black flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-6 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
             <div className="flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> System Online
             </div>
             <div className="flex items-center gap-1.5 hidden sm:flex">
                 <span className="text-slate-400"><MapPin size={10} /></span> 21.1466° N, 79.0882° E
             </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-600 font-mono hidden sm:flex">
             <div>LAST SYNC: {new Date().toLocaleTimeString()}</div>
             <div>VERSION 2.4.0-PRO</div>
          </div>
        </footer>
      </main>

    </div>
  );
}
