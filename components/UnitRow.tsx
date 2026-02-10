
import React from 'react';
import { UnitKey, UnitData } from '../types';

interface UnitRowProps {
  unit: UnitKey;
  data: UnitData;
  onChange: (unit: UnitKey, field: keyof UnitData, value: number) => void;
}

export const UnitRow: React.FC<UnitRowProps> = ({ unit, data, onChange }) => {
  return (
    <tr className="group hover:bg-slate-50/50 transition-colors">
      <td className="py-6 px-10">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-black group-hover:bg-[#E11D48] group-hover:text-white transition-colors">
            {unit}
          </div>
          <span className="font-black text-slate-800 tracking-tight">{unit} FACILITY</span>
        </div>
      </td>
      <td className="py-6 px-10">
        <div className="relative max-w-[240px] mx-auto">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">₹</span>
          <input
            type="number"
            value={data.orderValue || ''}
            onChange={(e) => onChange(unit, 'orderValue', parseFloat(e.target.value) || 0)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-4 focus:ring-slate-100 focus:bg-white outline-none transition-all text-right"
            placeholder="0"
          />
        </div>
      </td>
      <td className="py-6 px-10">
        <div className="relative max-w-[240px] mx-auto">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">₹</span>
          <input
            type="number"
            value={data.dispatchValue || ''}
            onChange={(e) => onChange(unit, 'dispatchValue', parseFloat(e.target.value) || 0)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#E11D48] focus:ring-4 focus:ring-rose-50 focus:bg-white outline-none transition-all text-right"
            placeholder="0"
          />
        </div>
      </td>
    </tr>
  );
};
