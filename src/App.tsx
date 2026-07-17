/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter,
  ChevronRight,
  Download,
  Send,
  MessageSquare,
  History,
  LayoutDashboard,
  LogOut,
  User,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn, generateId } from './lib/utils';
import { Report, ReportStatus, TEMPLATES, InspectionItem } from './types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Components
const StatusBadge = ({ status }: { status: ReportStatus }) => {
  const styles = {
    DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
    PENDING: "bg-blue-100 text-blue-600 border-blue-100",
    REJECTED: "bg-orange-100 text-orange-600 border-orange-100",
    APPROVED: "bg-emerald-100 text-emerald-600 border-emerald-100",
  };
  
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest", styles[status])}>
      {status === 'REJECTED' ? 'Revision Req' : status}
    </span>
  );
};

export default function App() {
  const [reports, setReports] = useState<Report[]>([]);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [userRole, setUserRole] = useState<'INSPECTOR' | 'SUPERVISOR'>('INSPECTOR');
  const [searchQuery, setSearchQuery] = useState('');

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('smart_ir_reports');
    if (saved) {
      try {
        setReports(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse reports", e);
      }
    }
  }, []);

  useEffect(() => {
    if (reports.length > 0) {
      localStorage.setItem('smart_ir_reports', JSON.stringify(reports));
    }
  }, [reports]);

  const createNewReport = (type: keyof typeof TEMPLATES) => {
    const newReport: Report = {
      id: `PGM-${format(new Date(), 'yyyy')}-IR-${generateId().substring(0, 4).toUpperCase()}`,
      title: `${type} Equipment Assembly`,
      type,
      inspector: 'K. Gil-dong',
      date: format(new Date(), 'yyyy-MM-dd'),
      items: TEMPLATES[type].map((t, idx) => ({
        id: `item-${idx}`,
        category: t.category,
        item: t.item,
        result: 'PASS',
        observation: '',
      })),
      status: 'DRAFT',
      comments: [],
      version: 1,
    };
    setReports([newReport, ...reports]);
    setEditingReport(newReport);
  };

  const updateReport = (updated: Report) => {
    setReports(reports.map(r => r.id === updated.id ? updated : r));
  };

  const handleStatusChange = (reportId: string, newStatus: ReportStatus, comment?: string) => {
    setReports(reports.map(r => {
      if (r.id === reportId) {
        const newComments = comment ? [...r.comments, `[${userRole}] ${comment} (${format(new Date(), 'MM/dd HH:mm')})`] : r.comments;
        return {
          ...r,
          status: newStatus,
          comments: newComments,
          version: newStatus === 'REJECTED' ? r.version + 1 : r.version
        };
      }
      return r;
    }));
    setEditingReport(prev => prev?.id === reportId ? { ...prev, status: newStatus } : prev);
  };

  const exportToPDF = (report: Report) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); 
    doc.text('Smart-IR: Inspection Report', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Hanwha Aerospace PGM Division - Internal Use Only`, 14, 30);
    
    autoTable(doc, {
      startY: 35,
      head: [['Field', 'Value']],
      body: [
        ['Report ID', report.id],
        ['Equipment Type', report.type],
        ['Date', report.date],
        ['Inspector', report.inspector],
        ['Status', report.status],
        ['Version', `v${report.version}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Category', 'Inspection Item', 'Result', 'Observation']],
      body: report.items.map(item => [
        item.category,
        item.item,
        item.result,
        item.observation
      ]),
      headStyles: { fillColor: [0, 43, 91] }, 
      columnStyles: {
        2: { fontStyle: 'bold', halign: 'center' }
      }
    });

    if (report.comments.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Comments & Feedback History:', 14, (doc as any).lastAutoTable.finalY + 10);
      doc.setFontSize(9);
      doc.setTextColor(50);
      report.comments.forEach((c, i) => {
        doc.text(`• ${c}`, 14, (doc as any).lastAutoTable.finalY + 18 + (i * 6));
      });
    }

    doc.save(`SmartIR_${report.id}_${report.date}.pdf`);
  };

  const filteredReports = reports.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full flex-row bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Icon Sidebar (w-16) */}
      <aside className="flex w-16 flex-col items-center bg-[#002B5B] py-6 text-white shadow-2xl z-30">
        <div className="mb-10">
          <div className="h-10 w-10 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-xl italic shadow-lg shadow-orange-600/20">H</div>
        </div>
        <nav className="flex flex-col gap-8 flex-1">
          <button 
            onClick={() => setEditingReport(null)}
            className={cn(
              "p-2 rounded-md transition-all cursor-pointer",
              !editingReport ? "bg-white/10 text-orange-400" : "text-white/50 hover:text-white"
            )}
          >
            <LayoutDashboard size={24} />
          </button>
          <button className="p-2 text-white/50 hover:text-white transition-all">
            <History size={24} />
          </button>
          <button className="p-2 text-white/50 hover:text-white transition-all">
            <Filter size={24} />
          </button>
        </nav>
        
        <div className="mt-auto flex flex-col gap-6 items-center">
          <button 
            onClick={() => setUserRole(userRole === 'INSPECTOR' ? 'SUPERVISOR' : 'INSPECTOR')}
            className="p-2 text-white/50 hover:text-orange-400 transition-all relative group"
            title="Switch Persona"
          >
            <ShieldCheck size={24} className={cn(userRole === 'SUPERVISOR' && "text-orange-500")} />
            <span className="absolute left-14 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold uppercase tracking-widest pointer-events-none">
              {userRole}
            </span>
          </button>
          <div className="h-8 w-8 rounded-full bg-slate-400 border-2 border-white/20 overflow-hidden flex items-center justify-center">
            <User size={20} className="text-white/80" />
          </div>
        </div>
      </aside>

      {/* List Panel (w-80) */}
      <div className="flex w-80 flex-col border-r border-slate-200 bg-white shadow-sm z-20">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">PGM Division</h2>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">Smart-IR System</h1>
        </div>
        
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 py-2 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
            Recent Reports
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filteredReports.map((r) => (
              <div 
                key={r.id} 
                onClick={() => setEditingReport(r)}
                className={cn(
                  "p-4 cursor-pointer transition-all hover:bg-slate-50 group border-l-4",
                  editingReport?.id === r.id ? "bg-orange-50/50 border-orange-500 shadow-inner" : "border-transparent"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <StatusBadge status={r.status} />
                  <span className="text-[10px] text-slate-400 italic font-medium">{format(new Date(), 'HH:mm')}</span>
                </div>
                <div className="text-sm font-bold text-slate-800 truncate group-hover:text-orange-600 transition-colors">{r.title}</div>
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 mt-1">
                  <span>{r.inspector}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="font-mono text-[9px] uppercase">{r.id.split('-').pop()}</span>
                </div>
              </div>
            ))}
            {filteredReports.length === 0 && (
              <div className="p-8 text-center text-slate-400 italic text-xs">No records matching search</div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          {userRole === 'INSPECTOR' && (
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => createNewReport('Mechanical')}
                className="w-full py-2.5 bg-slate-900 text-white rounded text-[11px] font-bold hover:bg-black transition-all shadow-lg shadow-black/5 active:scale-95 uppercase tracking-wider"
              >
                + NEW MECHANICAL
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <AnimatePresence mode="wait">
          {!editingReport ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col p-12 overflow-y-auto"
            >
              <header className="mb-12">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Division Metrics</h2>
                <h1 className="text-4xl font-black italic tracking-tighter text-slate-900">Performance Dashboard</h1>
              </header>

              <div className="grid grid-cols-3 gap-8 mb-12">
                {[
                  { label: 'Total Inspection Volume', value: reports.length, icon: FileText, color: 'text-slate-900' },
                  { label: 'Awaiting Validation', value: reports.filter(r => r.status === 'PENDING').length, icon: Clock, color: 'text-orange-600' },
                  { label: 'Validated Compliance', value: reports.filter(r => r.status === 'APPROVED').length, icon: CheckCircle2, color: 'text-emerald-600' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-40 group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100", stat.color)}>
                        <stat.icon size={20} strokeWidth={2.5} />
                      </div>
                      <div className="text-4xl font-black tracking-tighter text-slate-900 group-hover:scale-110 transition-transform">{stat.value}</div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center gap-4">
                  <div className="w-1 h-4 bg-orange-600 rounded"></div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Active Operation Log</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-12">
                  <LayoutDashboard size={48} className="mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest italic">Select a report unit to view details</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <ReportEditor 
              report={editingReport}
              userRole={userRole}
              onBack={() => setEditingReport(null)}
              onSave={(updated) => {
                updateReport(updated);
                setEditingReport(updated);
              }}
              onSubmit={(updated) => handleStatusChange(updated.id, 'PENDING')}
              onApprove={(updated, comment) => handleStatusChange(updated.id, 'APPROVED', comment)}
              onReject={(updated, comment) => handleStatusChange(updated.id, 'REJECTED', comment)}
              onExport={() => exportToPDF(editingReport)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

interface EditorProps {
  report: Report;
  userRole: 'INSPECTOR' | 'SUPERVISOR';
  onBack: () => void;
  onSave: (report: Report) => void;
  onSubmit: (report: Report) => void;
  onApprove: (report: Report, comment: string) => void;
  onReject: (report: Report, comment: string) => void;
  onExport: () => void;
}

function ReportEditor({ report, userRole, onBack, onSave, onSubmit, onApprove, onReject, onExport }: EditorProps) {
  const [localReport, setLocalReport] = useState<Report>(report);
  const [approvalComment, setApprovalComment] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    setLocalReport(report);
  }, [report]);

  const updateItem = (itemId: string, field: keyof InspectionItem, value: any) => {
    if (userRole !== 'INSPECTOR' || report.status === 'APPROVED' || report.status === 'PENDING') return;
    
    const newItems = localReport.items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    );
    const updated = { ...localReport, items: newItems };
    setLocalReport(updated);
    onSave(updated);
  };

  const isReadOnly = userRole !== 'INSPECTOR' || report.status === 'APPROVED' || report.status === 'PENDING';

  return (
    <motion.div 
      key={localReport.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col"
    >
      {/* Toolbar */}
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Report ID: <strong className="text-slate-900 font-mono tracking-normal">{localReport.id}</strong></span>
          <div className="h-4 w-px bg-slate-200"></div>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black uppercase tracking-tight">V{localReport.version}.01</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onExport}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded border border-slate-200 transition-all uppercase tracking-tight"
          >
            Draft Save
          </button>
          {userRole === 'INSPECTOR' && (localReport.status === 'DRAFT' || localReport.status === 'REJECTED') && (
            <button 
              onClick={() => onSubmit(localReport)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded transition-all active:scale-95 shadow-lg shadow-orange-600/10 uppercase tracking-tight"
            >
              Submit for Review
            </button>
          )}
          {userRole === 'SUPERVISOR' && localReport.status === 'PENDING' && (
            <button 
              onClick={() => setShowApprovalModal(true)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded transition-all active:scale-95 uppercase tracking-tight"
            >
              Process Review
            </button>
          )}
        </div>
      </header>

      {/* Content View */}
      <div className="flex-1 p-8 flex gap-8 overflow-y-auto">
        {/* Input Section */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-tight">
              <span className="w-1 h-4 bg-orange-600 rounded"></span>
              Primary Equipment Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset Name</label>
                <input 
                  type="text" 
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-semibold text-slate-700 focus:outline-none" 
                  value={localReport.title} 
                  readOnly 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                <div className="mt-1 px-3 py-2 bg-white border border-slate-200 rounded text-sm font-semibold text-slate-700">
                  {localReport.type} Precision Assembly
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1 min-h-[400px]">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center justify-between uppercase tracking-tight">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-orange-600 rounded"></span>
                Inspection Checklist
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Grid Input Mode Enabled</span>
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item</th>
                  <th className="pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Criteria</th>
                  <th className="pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24 text-center">Status</th>
                  <th className="pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action Required</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {localReport.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 font-semibold text-slate-800 text-xs">{item.item}</td>
                    <td className="py-3 text-slate-500 italic text-[11px] uppercase tracking-tight">{item.category} Validation</td>
                    <td className="py-3 px-2">
                      <select 
                        disabled={isReadOnly}
                        value={item.result}
                        onChange={(e) => updateItem(item.id, 'result', e.target.value as any)}
                        className={cn(
                          "w-full text-[10px] font-bold py-1 px-2 rounded border appearance-none cursor-pointer focus:outline-none transition-all text-center",
                          item.result === 'PASS' ? "bg-emerald-100 text-emerald-600 border-emerald-100" :
                          item.result === 'FAIL' ? "bg-orange-100 text-orange-600 border-orange-100" :
                          "bg-slate-100 text-slate-500 border-slate-200",
                          isReadOnly && "cursor-default opacity-80"
                        )}
                      >
                        <option value="PASS">NOMINAL</option>
                        <option value="FAIL">OUT OF TOL</option>
                        <option value="N/A">SKIPPED</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <input 
                        disabled={isReadOnly}
                        type="text" 
                        value={item.observation}
                        onChange={(e) => updateItem(item.id, 'observation', e.target.value)}
                        placeholder={isReadOnly ? "—" : "Input recalibration data..."}
                        className="w-full bg-slate-50 px-2 py-1 border border-slate-100 rounded text-[11px] font-medium focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all placeholder:text-slate-300"
                      />
                    </td>
                  </tr>
                ))}
                {!isReadOnly && (
                  <tr>
                    <td className="py-4 font-medium text-slate-400 italic text-xs hover:text-orange-500 cursor-pointer transition-colors">
                      + Add custom check row...
                    </td>
                    <td></td><td></td><td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feedback & History Section */}
        <div className="w-72 flex flex-col gap-6 shrink-0">
          <div className="bg-[#1E293B] text-white p-6 rounded-xl shadow-xl flex flex-col">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-6">Approval Feedback</h3>
            <div className="space-y-6 flex-1 overflow-y-auto max-h-[300px]">
              {localReport.comments.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">Historical data stream empty...</p>
              ) : (
                localReport.comments.map((c, i) => {
                  const isInspector = c.includes('INSPECTOR');
                  return (
                    <div key={i} className={cn("flex items-start gap-3", !isInspector && "pb-4 border-b border-slate-700")}>
                      <div className={cn("h-8 w-8 shrink-0 rounded flex items-center justify-center font-bold text-[10px] uppercase", isInspector ? "bg-slate-700" : "bg-orange-600")}>
                        {isInspector ? 'KY' : 'PK'}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-200">{isInspector ? 'Kim Young-hoon' : 'Park Sun-bae'} <span className="text-slate-500 font-normal uppercase text-[9px] tracking-widest ml-1">• {isInspector ? 'Drafter' : 'Part Leader'}</span></div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed italic">
                          "{c.split(') ').pop()}"
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 flex-1 flex flex-col shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4 tracking-widest">Version Control</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-800 uppercase tracking-tight">V{localReport.version}.01 (Current)</span>
                <span className="text-emerald-500 font-bold text-[9px] uppercase tracking-widest">Active</span>
              </div>
              {[...Array(Math.max(0, localReport.version - 1))].map((_, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer group transition-colors">
                  <span className="font-medium italic">V{localReport.version - i - 1}.03 (Archived)</span>
                  <span className="underline group-hover:text-orange-500 transition-colors uppercase font-bold text-[9px]">Compare</span>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-4">
               <button 
                 onClick={onExport}
                 className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 border border-slate-200 transition-all active:scale-95 group"
               >
                 <Download className="h-3 w-3 group-hover:scale-110 transition-transform" />
                 GENERATE PDF
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      <AnimatePresence>
        {showApprovalModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
            >
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase tracking-[0.1em]">Approval Evaluation</h3>
                <p className="text-slate-400 text-[10px] font-black tracking-[0.2em] uppercase mt-1">PGM-IR-PROTOCOL-02</p>
              </div>
              <div className="p-8 space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Executive Feedback</label>
                <textarea 
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Insert specific spec requirements or corrective actions..."
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-orange-500 outline-none transition-all resize-none shadow-inner"
                />
              </div>
              <div className="p-8 bg-slate-50/50 flex gap-3">
                <button 
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 py-2 rounded border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
                >
                  Defer
                </button>
                <button 
                  onClick={() => {
                    onReject(localReport, approvalComment);
                    setShowApprovalModal(false);
                  }}
                  className="flex-1 py-2 bg-white text-orange-600 border border-orange-100 rounded text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all shadow-sm"
                >
                  Reject
                </button>
                <button 
                  onClick={() => {
                    onApprove(localReport, approvalComment);
                    setShowApprovalModal(false);
                  }}
                  className="flex-1 py-2 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10"
                >
                  Approve
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
