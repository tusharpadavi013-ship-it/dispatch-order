
import React, { useState, useMemo, useEffect } from 'react';
import { UNITS, INITIAL_FORM_STATE } from './constants';
import { FormDataState, UnitKey, UnitData, SubmissionPayload } from './types';
import { UnitRow } from './components/UnitRow';
import { DashboardView } from './components/DashboardView';

const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyyM6m7LOuWzW5qUg8b9ynxP3EzMfE9zrz71eld3-r1U2pROK9-GwZ8sNBQSx-MnDe6/exec";

const GinzaLogo = () => (
  <div className="flex items-center justify-center bg-white p-2 rounded-xl shadow-sm border border-slate-100">
    <img 
      src="https://www.ginzalimited.com/cdn/shop/files/Ginza_logo.jpg?v=1668509673&width=500" 
      alt="Ginza Industries Limited" 
      className="h-10 md:h-14 w-auto object-contain"
    />
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'form' | 'dashboard'>('form');
  const [formData, setFormData] = useState<FormDataState>(INITIAL_FORM_STATE);
  const [currentDate, setCurrentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState<SubmissionPayload[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [scriptUrl, setScriptUrl] = useState<string>(() => {
    try { 
      return localStorage.getItem('gas_url') || DEFAULT_SCRIPT_URL; 
    } catch { 
      return DEFAULT_SCRIPT_URL; 
    }
  });

  useEffect(() => {
    // Initial fetch from cloud on mount
    fetchFromCloud();
    
    try {
      const saved = localStorage.getItem('dispatch_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('gas_url', scriptUrl);
      localStorage.setItem('dispatch_history', JSON.stringify(history));
    } catch (e) {}
  }, [scriptUrl, history]);

  const fetchFromCloud = async () => {
    if (!scriptUrl || scriptUrl === DEFAULT_SCRIPT_URL) return;
    setIsSyncing(true);
    try {
      const response = await fetch(scriptUrl);
      const data = await response.json();
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const totals = useMemo(() => {
    return UNITS.reduce((acc, unit) => ({
      order: acc.order + (formData[unit]?.orderValue || 0),
      dispatch: acc.dispatch + (formData[unit]?.dispatchValue || 0),
    }), { order: 0, dispatch: 0 });
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptUrl) return alert("Please set your Google Script URL.");

    setIsSubmitting(true);
    const payload: SubmissionPayload = {
      id: Date.now().toString(),
      date: currentDate,
      units: { ...formData },
      totalOrder: totals.order,
      totalDispatch: totals.dispatch,
    };

    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...payload, action: 'SAVE' }),
      });

      setHistory(prev => [payload, ...prev]);
      setFormData(INITIAL_FORM_STATE);
      alert("Transaction committed successfully.");
    } catch (err) {
      alert("Sync failed. Record saved locally only.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanent delete from Cloud?")) return;

    const originalHistory = [...history];
    setHistory(prev => prev.filter(item => item.id !== id));

    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'DELETE', id: id }),
      });
    } catch (err) {
      console.error("Delete Error:", err);
      setHistory(originalHistory);
      alert("Cloud sync failed. Deletion reverted.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto w-full px-4 pt-6 md:pt-10 flex-1">
        <header className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-10 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all duration-300">
          <div className="flex items-center gap-5">
            <GinzaLogo />
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
                GINZA <span className="text-[#E11D48]">INDUSTRIES</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Operational Core • v2.0</p>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1 md:gap-2 w-full lg:w-auto">
            <button 
              onClick={() => setActiveTab('form')} 
              className={`flex-1 md:flex-none px-6 md:px-10 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'form' ? 'bg-white text-[#E11D48] shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <i className="fas fa-edit mr-2"></i> Entry
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`flex-1 md:flex-none px-6 md:px-10 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-white text-[#E11D48] shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <i className="fas fa-chart-pie mr-2"></i> Analysis
            </button>
            <button 
              onClick={() => { const url = prompt("Update Cloud URL:", scriptUrl); if(url) setScriptUrl(url); }} 
              className="p-3.5 text-slate-400 hover:text-slate-900 transition-colors"
              title="Configuration"
            >
              <i className="fas fa-cog"></i>
            </button>
          </div>
        </header>

        <main className="animate-fade-in">
          {activeTab === 'form' ? (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-[#E11D48] shadow-inner">
                    <i className="fas fa-calendar-check text-2xl"></i>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Posting Date</label>
                    <input 
                      type="date" 
                      value={currentDate} 
                      onChange={e => setCurrentDate(e.target.value)} 
                      className="text-2xl font-black text-slate-900 bg-transparent border-none focus:ring-0 p-0 cursor-pointer hover:text-[#E11D48] transition-colors" 
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                  <div className={`w-2 h-2 rounded-full ${scriptUrl && scriptUrl !== DEFAULT_SCRIPT_URL ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    {scriptUrl && scriptUrl !== DEFAULT_SCRIPT_URL ? 'Cloud Link Established' : 'System Default Mode'}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:border-[#E11D48]/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-white">
                      <tr>
                        <th className="py-8 px-10 text-[10px] font-black uppercase tracking-widest">Plant Location</th>
                        <th className="py-8 px-10 text-center text-[10px] font-black uppercase tracking-widest">Order Intake (₹)</th>
                        <th className="py-8 px-10 text-center text-[10px] font-black uppercase tracking-widest">Dispatch Out (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {UNITS.map(unit => (
                        <UnitRow 
                          key={unit} 
                          unit={unit} 
                          data={formData[unit]} 
                          onChange={(u, f, v) => setFormData(prev => ({ ...prev, [u]: { ...prev[u], [f]: v } }))} 
                        />
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/50">
                      <tr className="font-black">
                        <td className="py-14 px-10 text-slate-400 text-[11px] uppercase tracking-widest font-black">Consolidated Total</td>
                        <td className="py-14 px-10 text-center text-4xl md:text-5xl text-slate-900 tracking-tight">₹{totals.order.toLocaleString()}</td>
                        <td className="py-14 px-10 text-center text-4xl md:text-5xl text-[#E11D48] tracking-tight">₹{totals.dispatch.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting || totals.order === 0} 
                className="w-full py-7 bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.4em] rounded-[2rem] shadow-2xl hover:bg-[#E11D48] transition-all duration-300 transform active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-4 group"
              >
                {isSubmitting ? (
                  <><i className="fas fa-circle-notch fa-spin"></i> Synchronizing...</>
                ) : (
                  <>
                    <i className="fas fa-lock text-[10px] opacity-50 group-hover:opacity-100"></i>
                    Commit Daily Records
                    <i className="fas fa-chevron-right text-[10px] opacity-50 group-hover:opacity-100"></i>
                  </>
                )}
              </button>
            </div>
          ) : (
            <DashboardView 
              data={history} 
              onDelete={handleDelete} 
              onRefresh={fetchFromCloud} 
              isSyncing={isSyncing} 
            />
          )}
        </main>
      </div>
      <footer className="py-12 text-center">
        <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.6em]">Ginza Industries Limited • Internal Systems</p>
      </footer>
    </div>
  );
};

export default App;
