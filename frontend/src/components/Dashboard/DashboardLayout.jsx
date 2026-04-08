import React, { useState } from 'react';
import { useModal } from '../../context/ModalContext';

export default function DashboardLayout({ 
  title, 
  subtitle, 
  tabs, 
  activeTab, 
  setActiveTab, 
  children,
  roleColor = 'emerald' // emerald for provider, indigo for ngo, slate for admin
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeTabClass = roleColor === 'emerald' ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-500' : 
                        roleColor === 'indigo' ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-500' : 
                        'bg-slate-100 text-slate-900 font-bold border-l-4 border-slate-500';

  return (
    <div className="bg-slate-50 pt-8 pb-32 min-h-[calc(100vh-80px)]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-10 items-start relative">
          
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden animate-fadeIn"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Mobile Toggle */}
          <button 
            className="lg:hidden sticky top-[82px] z-50 w-full flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm shadow-lg active:scale-95 transition-all mb-4"
            onClick={() => setIsSidebarOpen(true)}
          >
            <div className="flex items-center gap-2">
              <span className="text-emerald-500">☰</span>
              <span>Dashboard Menu</span>
            </div>
            <span className="text-[10px] uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">Tabs</span>
          </button>

          {/* Sidebar */}
          <aside className={`fixed inset-y-0 left-0 z-[70] w-72 bg-white transform transition-transform duration-300 lg:static lg:translate-x-0 lg:flex lg:flex-col lg:w-72 shrink-0 lg:sticky lg:top-[100px] self-start ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="bg-white border border-slate-200 h-[100vh] rounded-r-[1rem] lg:rounded-[1rem] overflow-hidden shadow-xl lg:shadow-sm p-4">
              <nav className="flex flex-col gap-1.5 h-full">
                {/* Close Button for Mobile Sidebar */}
                <div className="flex items-center justify-between mb-6 px-2 lg:hidden">
                   <span className="text-xs font-black uppercase tracking-widest text-slate-400">Navigation</span>
                   <button onClick={() => setIsSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all border-none cursor-pointer">✕</button>
                </div>

                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm transition-all group border-l-4 border-transparent ${
                      activeTab === tab.id 
                        ? activeTabClass 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium'
                    }`}
                  >
                    <span className={`text-xl transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`}>
                      {tab.icon}
                    </span>
                    <span className="tracking-tight">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Header Section */}
            <div className="mb-10 lg:pl-4">
              <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">{title}</h2>
              {subtitle && <p className="text-slate-400 font-black text-[10px] mt-2 uppercase tracking-[0.25em]">{subtitle}</p>}
            </div>

            {/* Dynamic Page Content */}
            <div className="bg-white border border-slate-200 rounded-[3rem] p-8 lg:p-12 shadow-xl shadow-slate-200/40 min-h-[600px] animate-fadeIn">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
