import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Map, AlertTriangle, FileText, Truck, 
  Package, BarChart2, Navigation, Bell, TrendingUp, 
  Database, Activity, Settings, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { DataModeIndicator } from '../components/ui/DataModeIndicator';

interface NavItem {
  icon: React.FC<any>;
  label: string;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Command Center', path: '/' },
  { icon: Map, label: 'Road Network', path: '/roads' },
  { icon: AlertTriangle, label: 'Incident Center', path: '/incidents' },
  { icon: FileText, label: 'Field Reports', path: '/field-reports' },
  { icon: Truck, label: 'Vehicles', path: '/vehicles' },
  { icon: Package, label: 'Deliveries', path: '/deliveries' },
  { icon: BarChart2, label: 'Risk Analysis', path: '/risk' },
  { icon: Navigation, label: 'Route Planner', path: '/routes' },
  { icon: Bell, label: 'Alerts', path: '/alerts', badge: 3 },
  { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
  { icon: Database, label: 'Data Sources', path: '/data-sources' },
  { icon: Activity, label: 'System Health', path: '/system' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const savedState = localStorage.getItem('sidebar_collapsed');
    if (savedState) {
      setCollapsed(JSON.parse(savedState));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(newState));
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex h-screen w-full bg-[#0F172A] text-slate-200 overflow-hidden font-sans">
      
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#1E293B] border-r border-slate-800 transition-all duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-16' : 'lg:w-60 w-64'}
        `}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-slate-800">
          <div className={`flex flex-col overflow-hidden whitespace-nowrap transition-opacity ${collapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100'}`}>
            <span className="font-bold text-lg tracking-tight text-white">NER-RAKSHA</span>
            <span className="text-[10px] text-blue-400 font-semibold tracking-widest uppercase">Command Center</span>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={closeMobile}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobile}
              className={({ isActive }) => `
                flex items-center px-4 py-2.5 mx-2 rounded transition-colors group relative
                ${isActive 
                  ? 'bg-slate-800 text-white border-l-2 border-blue-500' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent'
                }
              `}
            >
              <item.icon size={18} className="shrink-0" />
              <span className={`ml-3 text-sm font-medium whitespace-nowrap overflow-hidden transition-all ${collapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
                {item.label}
              </span>
              {item.badge && !collapsed && (
                <span className="ml-auto bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-slate-800 hidden lg:block">
          <button 
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-14 flex items-center justify-between px-4 bg-[#1E293B] border-b border-slate-800 shrink-0">
          <div className="flex items-center">
            <button 
              className="lg:hidden text-slate-400 hover:text-white mr-4"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base font-semibold text-white capitalize hidden sm:block">
              {({
                '/': 'Command Center',
                '/roads': 'Road Network Monitor',
                '/incidents': 'Incident Center',
                '/field-reports': 'Field Report Center',
                '/vehicles': 'Vehicle Operations',
                '/deliveries': 'Delivery Management',
                '/risk': 'Risk Analysis',
                '/routes': 'Route Planner',
                '/alerts': 'Alert Feed',
                '/analytics': 'Analytics & Reports',
                '/data-sources': 'Data Source Registry',
                '/system': 'System Health',
                '/settings': 'Settings',
              } as Record<string, string>)[location.pathname] || location.pathname.substring(1).replace(/-/g, ' ')}
            </h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center text-xs text-slate-400 space-x-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Systems Normal</span>
            </div>
            
            <div className="text-xs text-slate-400 font-mono hidden lg:block">
              {new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC
            </div>

            <DataModeIndicator mode="MIXED" />
            
            <div className="h-8 w-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-sm font-bold text-slate-300">
              PR
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-[#0F172A] relative">
          <React.Suspense fallback={
            <div className="flex h-full w-full items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          }>
            <Outlet />
          </React.Suspense>
        </main>

      </div>
    </div>
  );
};
