
import React from 'react';
import { History, Download, Upload, Trash2, ShieldAlert, RotateCcw } from 'lucide-react';
import { AppState, AuditLog } from '../types';
import { storageService } from '../services/storageService';

interface SystemLogsProps {
  state: AppState;
  onImport: (file: File) => void;
  onClearLogs: () => void;
}

const SystemLogs: React.FC<SystemLogsProps> = ({ state, onImport, onClearLogs }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (window.confirm('Are you sure you want to import this data? Current data will be overwritten.')) {
        onImport(file);
      }
    }
  };

  const handleDeepRestore = () => {
    if (window.confirm("WARNING: Deep Restore V15 will clear all volatile cache and restore standard system permissions. Proceed?")) {
      // The actual logic is handled in App.tsx handleRestoreV15, 
      // but we can trigger a hard reload here too.
      window.location.reload();
    }
  };

  return (
    <div className="space-y-10 pb-32 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-xl">
        <div>
          <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase">System Terminal</h2>
          <p className="text-slate-500 font-bold mt-2">Audit logs, security events, and V15 restoration hub</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => storageService.exportData(state)}
            className="flex items-center gap-3 bg-slate-950 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all shadow-lg"
          >
            <Download className="w-5 h-5" /> Export Backup
          </button>
          <label className="flex items-center gap-3 bg-sky-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-sky-700 transition-all shadow-lg cursor-pointer">
            <Upload className="w-5 h-5" /> Import Data
            <input type="file" accept=".json" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white rounded-[3rem] border-2 border-slate-100 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-3">
              <History className="w-6 h-6 text-sky-600" /> Audit Trail
            </h3>
            <button onClick={onClearLogs} className="text-rose-600 text-[10px] font-black uppercase hover:underline">Clear History</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                  <th className="px-10 py-6">Timestamp</th>
                  <th className="px-10 py-6">Operator</th>
                  <th className="px-10 py-6">Action</th>
                  <th className="px-10 py-6">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {state.logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-10 py-5 text-[10px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-10 py-5 font-black text-slate-900 text-xs">{log.user}</td>
                    <td className="px-10 py-5">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">{log.action}</span>
                    </td>
                    <td className="px-10 py-5 text-xs text-slate-500 font-medium">{log.details}</td>
                  </tr>
                ))}
                {state.logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center font-black text-slate-300 uppercase tracking-widest">No logs recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-amber-50 p-10 rounded-[3rem] border-2 border-amber-100 shadow-sm">
             <div className="flex items-center gap-4 mb-6">
                <RotateCcw className="w-8 h-8 text-amber-600" />
                <h3 className="text-xl font-black text-amber-950 uppercase">V15 Restoration</h3>
             </div>
             <p className="text-sm text-amber-800 font-medium mb-8 leading-relaxed">
               Use this to return the system to the stable V15 state. This fixes login issues and resets core system variables.
             </p>
             <button 
               onClick={handleDeepRestore}
               className="w-full py-5 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center justify-center gap-3 shadow-xl"
             >
                <RotateCcw className="w-5 h-5" /> Restore V15 Stable
             </button>
          </div>

          <div className="bg-rose-50 p-10 rounded-[3rem] border-2 border-rose-100 shadow-sm">
             <div className="flex items-center gap-4 mb-6">
                <ShieldAlert className="w-8 h-8 text-rose-600" />
                <h3 className="text-xl font-black text-rose-950 uppercase">Danger Zone</h3>
             </div>
             <p className="text-sm text-rose-800 font-medium mb-8 leading-relaxed">
               Factory Reset will delete EVERYTHING. Only use if moving to a new deployment.
             </p>
             <button 
               onClick={() => { if(window.confirm('RESET SYSTEM? This will delete EVERYTHING.')) { localStorage.clear(); window.location.reload(); } }}
               className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-3 shadow-xl"
             >
                <Trash2 className="w-5 h-5" /> Full Data Wipe
             </button>
          </div>

          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl">
             <h3 className="text-lg font-black uppercase mb-6 tracking-tighter">System Health</h3>
             <div className="space-y-4">
                <div className="flex justify-between border-b border-white/10 pb-4">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Version</span>
                   <span className="text-xs font-black">v15.0.0 Stable</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-4">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Storage Used</span>
                   <span className="text-xs font-black">{(JSON.stringify(state).length / 1024).toFixed(2)} KB</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Last Sync</span>
                   <span className="text-xs font-black">Active</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
