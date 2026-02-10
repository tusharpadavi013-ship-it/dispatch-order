
import React, { useState, useMemo } from 'react';
import { SubmissionPayload, DashboardFilters, UnitKey, TimeFilter } from '../types';
import { UNITS } from '../constants';

interface DashboardViewProps {
  data: SubmissionPayload[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
  isSyncing: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const DashboardView: React.FC<DashboardViewProps> = ({ data, onDelete, onRefresh, isSyncing }) => {
  const [filters, setFilters] = useState<DashboardFilters>({ 
    unit: 'ALL', 
    range: 'all',
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear()
  });

  const filteredData = useMemo(() => {
    let result = [...data];

    if (filters.range !== 'all') {
      result = result.filter(item => {
        const itemDate = new Date(item.date);
        
        if (filters.range === 'month') {
          return itemDate.getMonth() === filters.selectedMonth && itemDate.getFullYear() === filters.selectedYear;
        }
        if (filters.range === 'year') {
          return itemDate.getFullYear() === filters.selectedYear;
        }
        return true;
      });
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, filters]);

  const stats = useMemo(() => {
    const totals = { order: 0, dispatch: 0 };
    const unitBreakdown = UNITS.reduce((acc, unit) => {
      acc[unit] = { order: 0, dispatch: 0 };
      return acc;
    }, {} as Record<string, { order: number; dispatch: number }>);

    filteredData.forEach(entry => {
      UNITS.forEach(u => {
        const order = (entry.units[u]?.orderValue || 0);
        const dispatch = (entry.units[u]?.dispatchValue || 0);
        
        unitBreakdown[u].order += order;
        unitBreakdown[u].dispatch += dispatch;

        if (filters.unit === 'ALL' || filters.unit === u) {
          totals.order += order;
          totals.dispatch += dispatch;
        }
      });
    });
    return { totals, unitBreakdown };
  }, [filteredData, filters.unit]);

  const maxChartValue = useMemo(() => {
    const values = Object.values(stats.unitBreakdown).flatMap(u => [u.order, u.dispatch]);
    const max = Math.max(...values, 1000);
    return max * 1.1;
  }, [stats.unitBreakdown]);

  return (
    <div className="space-y-10 pb-20">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-2">Temporal View</label>
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl">
              {(['month', 'year', 'all'] as TimeFilter[]).map(t => (
                <button 
                  key={t} 
                  onClick={() => setFilters(f => ({ ...f, range: t }))} 
                  className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filters.range === t ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-2">Focus Unit</label>
            <select 
              value={filters.unit} 
              onChange={e => setFilters(f => ({ ...f, unit: e.target.value as any }))} 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-6 text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-[#E11D48]/20"
            >
              <option value="ALL">Aggregate View</option>
              {UNITS.map(u => <option key={u} value={u}>{u} Facility</option>)}
            </select>
          </div>
        </div>

        {filters.range !== 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <div className="flex flex-col">
              <label className="text-[9px] font-bold text-slate-400 mb-2 px-2">SELECT YEAR</label>
              <select 
                value={filters.selectedYear} 
                onChange={e => setFilters(f => ({ ...f, selectedYear: parseInt(e.target.value) }))}
                className="bg-slate-100 border-none rounded-xl py-2 px-4 text-[10px] font-black"
              >
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y} Fiscal</option>)}
              </select>
            </div>

            {filters.range === 'month' && (
              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-slate-400 mb-2 px-2">SELECT MONTH</label>
                <select 
                  value={filters.selectedMonth} 
                  onChange={e => setFilters(f => ({ ...f, selectedMonth: parseInt(e.target.value) }))}
                  className="bg-slate-100 border-none rounded-xl py-2 px-4 text-[10px] font-black"
                >
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Orders</p>
          <h4 className="text-3xl font-black text-slate-900">₹{stats.totals.order.toLocaleString()}</h4>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Dispatches</p>
          <h4 className="text-3xl font-black text-[#E11D48]">₹{stats.totals.dispatch.toLocaleString()}</h4>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Efficiency</p>
          <h4 className="text-3xl font-black text-slate-800">{stats.totals.order > 0 ? ((stats.totals.dispatch / stats.totals.order) * 100).toFixed(1) : 0}%</h4>
        </div>
      </div>

      {/* Unit Wise Performance Chart */}
      <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl overflow-hidden">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Unit Performance Chart</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Order vs Dispatch Breakdown</p>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-900 rounded-sm"></div>
              <span className="text-[9px] font-black text-slate-600 uppercase">Order</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#E11D48] rounded-sm"></div>
              <span className="text-[9px] font-black text-slate-600 uppercase">Dispatch</span>
            </div>
          </div>
        </div>

        <div className="h-[400px] flex items-end justify-between gap-4 px-4 border-b border-slate-100 pb-4 relative">
            <div className="absolute inset-x-0 bottom-4 top-0 flex flex-col justify-between pointer-events-none opacity-5">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="border-t border-slate-900 w-full h-0"></div>
                ))}
            </div>

            {UNITS.map(u => {
                const uData = stats.unitBreakdown[u];
                const orderHeight = (uData.order / maxChartValue) * 100;
                const dispatchHeight = (uData.dispatch / maxChartValue) * 100;

                return (
                    <div key={u} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        <div className="flex items-end gap-1 w-full max-w-[80px] h-full justify-center">
                            <div 
                                className="w-6 md:w-8 bg-slate-900 rounded-t-lg transition-all duration-700 ease-out hover:brightness-110 relative"
                                style={{ height: `${Math.max(orderHeight, 1)}%` }}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[8px] font-black py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                                    ₹{uData.order.toLocaleString()}
                                </div>
                            </div>
                            <div 
                                className="w-6 md:w-8 bg-[#E11D48] rounded-t-lg transition-all duration-700 ease-out hover:brightness-110 relative"
                                style={{ height: `${Math.max(dispatchHeight, 1)}%` }}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#E11D48] text-white text-[8px] font-black py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                                    ₹{uData.dispatch.toLocaleString()}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 text-[10px] font-black text-slate-800 tracking-widest">{u}</div>
                    </div>
                );
            })}
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase">Master Operational Log</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Detailed Cloud Record History</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onRefresh}
              disabled={isSyncing}
              className="bg-white border border-slate-200 p-4 rounded-2xl text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-all flex items-center gap-2 text-[10px] font-black uppercase"
            >
              <i className={`fas fa-sync-alt ${isSyncing ? 'animate-spin' : ''}`}></i>
              {isSyncing ? 'Syncing...' : 'Sync Cloud'}
            </button>
            <span className="text-[10px] font-black bg-slate-900 text-white px-5 py-2 rounded-full flex items-center">{filteredData.length} Entries</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="bg-[#1F2937] text-white">
              <tr className="text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                <th rowSpan={2} className="py-8 px-8 bg-black border-r border-slate-800 sticky left-0 z-20 w-32">Date</th>
                {UNITS.map(u => (
                  <th key={u} colSpan={2} className="py-4 text-center border-r border-slate-800">{u}</th>
                ))}
                <th colSpan={2} className="py-4 text-center bg-slate-800 border-r border-slate-800">AGGREGATE</th>
                <th rowSpan={2} className="py-8 px-2 text-center bg-[#E11D48] w-16">DEL</th>
              </tr>
              <tr className="bg-slate-800 text-[8px] font-black text-white/50">
                {UNITS.map(u => (
                  <React.Fragment key={`${u}-sub`}>
                    <th className="py-3 text-center border-r border-slate-700">ORD</th>
                    <th className="py-3 text-center border-r border-slate-800">DISP</th>
                  </React.Fragment>
                ))}
                <th className="py-3 text-center border-r border-slate-700">T-ORD</th>
                <th className="py-3 text-center border-r border-slate-800">T-DISP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map(row => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-6 px-8 text-xs font-black text-slate-800 bg-white border-r border-slate-50 sticky left-0 z-10">
                    {(() => {
                        const d = new Date(row.date);
                        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                    })()}
                  </td>
                  {UNITS.map(u => (
                    <React.Fragment key={`${row.id}-${u}`}>
                      <td className="py-6 text-center text-[10px] text-slate-400 border-r border-slate-50">
                        {row.units[u]?.orderValue ? `₹${row.units[u].orderValue.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-6 text-center text-[10px] text-slate-800 font-black border-r border-slate-100">
                        {row.units[u]?.dispatchValue ? `₹${row.units[u].dispatchValue.toLocaleString()}` : '—'}
                      </td>
                    </React.Fragment>
                  ))}
                  <td className="py-6 text-center text-[11px] font-black text-slate-500 bg-slate-50/50 border-r border-slate-100">
                    ₹{row.totalOrder.toLocaleString()}
                  </td>
                  <td className="py-6 text-center text-[11px] font-black text-[#E11D48] bg-rose-50/20 border-r border-slate-100">
                    ₹{row.totalDispatch.toLocaleString()}
                  </td>
                  <td className="py-6 px-2 text-center">
                    <button 
                      onClick={() => onDelete(row.id)}
                      className="p-2 text-slate-300 hover:text-[#E11D48] hover:bg-rose-50 rounded-lg transition-all"
                      title="Delete Record"
                    >
                      <i className="fas fa-trash-alt text-sm"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={14} className="py-20 text-center text-slate-400 font-black uppercase text-xs tracking-widest">
                    No matching records for selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
