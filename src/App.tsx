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
  ShieldCheck,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn, generateId } from './lib/utils';
import { Report, ReportStatus, TEMPLATES, InspectionItem } from './types';
import html2pdf from 'html2pdf.js';

// Components
const StatusBadge = ({ status }: { status: ReportStatus }) => {
  const styles = {
    DRAFT: "bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]",
    PENDING: "bg-[#eff6ff] text-[#2563eb] border-[#dbeafe]",
    REJECTED: "bg-[#fff7ed] text-[#F37321] border-[#ffedd5]",
    APPROVED: "bg-[#ecfdf5] text-[#059669] border-[#d1fae5]",
  };
  
  const labels = {
    DRAFT: '작성 중',
    PENDING: '검토 대기',
    REJECTED: '보완 필요',
    APPROVED: '승인 완료'
  };
  
  return (
    <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-tight", styles[status])}>
      {labels[status]}
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
    const typeLabels = {
      Mechanical: '기계 장치',
      Hydraulic: '유압 시스템',
      Automation: '자동화 설비'
    };
    const newReport: Report = {
      id: `PGM-${format(new Date(), 'yyyy')}-IR-${generateId().substring(0, 4).toUpperCase()}`,
      title: `${typeLabels[type]} 조립 점검 보고서`,
      type,
      inspector: '김철수',
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
    const element = document.getElementById(`print-report-content`);
    if (!element || !report) return;

    // Force visibility and reset position for capture
    const originalCss = element.style.cssText;
    element.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: 210mm;
      background-color: white;
      opacity: 1;
      visibility: visible;
      z-index: 9999;
      pointer-events: none;
    `;

    const opt = {
      margin: 10,
      filename: `한화에어로_점검보고서_${report.id}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    // Small delay to allow the DOM to reflow if needed
    setTimeout(() => {
      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          // Restore original state
          element.style.cssText = originalCss;
        })
        .catch((err: any) => {
          console.error('PDF Export Error:', err);
          element.style.cssText = originalCss;
        });
    }, 500);
  };

  const filteredReports = reports.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full flex-row bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Hidden Print Content for html2pdf - improved visibility for capture */}
      <div 
        id="print-report-content" 
        style={{ 
          position: 'fixed',
          left: '-10000px',
          top: '0',
          width: '210mm',
          backgroundColor: 'white',
          opacity: '0',
          visibility: 'hidden',
          pointerEvents: 'none'
        }}
      >
        {editingReport && <PrintTemplate report={editingReport} />}
      </div>

      {/* Icon Sidebar (w-16) */}
      <aside className="flex w-16 flex-col items-center bg-[#222222] py-6 text-white shadow-2xl z-30 border-r border-white/5">
        <div className="mb-10">
          <div className="h-10 w-10 rounded-lg bg-[#F37321] flex items-center justify-center font-bold text-xl italic shadow-lg shadow-[#F37321]/20">H</div>
        </div>
        <nav className="flex flex-col gap-8 flex-1">
          <button 
            onClick={() => setEditingReport(null)}
            className={cn(
              "p-2 rounded-md transition-all cursor-pointer",
              !editingReport ? "bg-white/10 text-[#F37321]" : "text-white/50 hover:text-white"
            )}
            title="대시보드"
          >
            <LayoutDashboard size={24} />
          </button>
          <button className="p-2 text-white/50 hover:text-white transition-all" title="이력 관리">
            <History size={24} />
          </button>
          <button className="p-2 text-white/50 hover:text-white transition-all" title="필터">
            <Filter size={24} />
          </button>
        </nav>
        
        <div className="mt-auto flex flex-col gap-6 items-center">
          <button 
            onClick={() => setUserRole(userRole === 'INSPECTOR' ? 'SUPERVISOR' : 'INSPECTOR')}
            className="p-2 text-white/50 hover:text-[#F37321] transition-all relative group"
            title="역할 전환"
          >
            <ShieldCheck size={24} className={cn(userRole === 'SUPERVISOR' && "text-[#F37321]")} />
            <span className="absolute left-14 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold uppercase tracking-widest pointer-events-none z-50">
              {userRole === 'INSPECTOR' ? '점검자 모드' : '승인자 모드'}
            </span>
          </button>
          <div className="h-8 w-8 rounded-full bg-slate-600 border-2 border-white/20 overflow-hidden flex items-center justify-center">
            <User size={20} className="text-white/80" />
          </div>
        </div>
      </aside>

      {/* List Panel (w-80) */}
      <div className="flex w-80 flex-col border-r border-slate-200 bg-white shadow-sm z-20">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Hanwha Aerospace</h2>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">Smart-IR 시스템</h1>
        </div>
        
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F37321] transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="보고서 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#F37321] focus:border-[#F37321] transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 py-2 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
            최근 보고서 목록
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filteredReports.map((r) => (
              <div 
                key={r.id} 
                onClick={() => setEditingReport(r)}
                className={cn(
                  "p-4 cursor-pointer transition-all hover:bg-slate-50 group border-l-4",
                  editingReport?.id === r.id ? "bg-orange-50/30 border-[#F37321] shadow-inner" : "border-transparent"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <StatusBadge status={r.status} />
                  <span className="text-[10px] text-slate-400 italic font-medium">{format(new Date(), 'HH:mm')}</span>
                </div>
                <div className="text-sm font-bold text-slate-800 truncate group-hover:text-[#F37321] transition-colors">{r.title}</div>
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 mt-1">
                  <span>{r.inspector}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="font-mono text-[9px] uppercase">{r.id.split('-').pop()}</span>
                </div>
              </div>
            ))}
            {filteredReports.length === 0 && (
              <div className="p-8 text-center text-slate-400 italic text-xs">검색 결과가 없습니다.</div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          {userRole === 'INSPECTOR' && (
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => createNewReport('Mechanical')}
                className="w-full py-2.5 bg-[#222222] text-white rounded text-[11px] font-bold hover:bg-black transition-all shadow-lg shadow-black/5 active:scale-95 uppercase tracking-wider"
              >
                + 새 점검 보고서 작성
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
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Operation Metrics</h2>
                <h1 className="text-4xl font-black italic tracking-tighter text-slate-900">현황 대시보드</h1>
              </header>

              <div className="grid grid-cols-3 gap-8 mb-12">
                {[
                  { label: '누적 점검 건수', value: reports.length, icon: FileText, color: 'text-slate-900' },
                  { label: '검토 대기 항목', value: reports.filter(r => r.status === 'PENDING').length, icon: Clock, color: 'text-[#F37321]' },
                  { label: '최종 승인 완료', value: reports.filter(r => r.status === 'APPROVED').length, icon: CheckCircle2, color: 'text-emerald-600' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-40 group hover:shadow-md transition-all">
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

              <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center gap-4">
                  <div className="w-1 h-4 bg-[#F37321] rounded"></div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">작업 이력 로그</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-12">
                  <LayoutDashboard size={48} className="mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest italic">점검 보고서를 선택하여 상세 내용을 확인하세요</p>
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
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">보고서 번호: <strong className="text-slate-900 font-mono tracking-normal">{localReport.id}</strong></span>
          <div className="h-4 w-px bg-slate-200"></div>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black uppercase tracking-tight">VER {localReport.version}.01</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onExport}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded border border-slate-200 transition-all uppercase tracking-tight"
          >
            임시 저장
          </button>
          {userRole === 'INSPECTOR' && (localReport.status === 'DRAFT' || localReport.status === 'REJECTED') && (
            <button 
              onClick={() => onSubmit(localReport)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-[#F37321] hover:bg-orange-600 rounded transition-all active:scale-95 shadow-lg shadow-orange-600/10 uppercase tracking-tight"
            >
              검토 요청
            </button>
          )}
          {userRole === 'SUPERVISOR' && localReport.status === 'PENDING' && (
            <button 
              onClick={() => setShowApprovalModal(true)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-[#F37321] hover:bg-orange-600 rounded transition-all active:scale-95 uppercase tracking-tight"
            >
              승인 처리
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
              <span className="w-1 h-4 bg-[#F37321] rounded"></span>
              주요 장비 정보
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">장비명</label>
                <input 
                  type="text" 
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-semibold text-slate-700 focus:outline-none" 
                  value={localReport.title} 
                  readOnly 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">장비 구분</label>
                <div className="mt-1 px-3 py-2 bg-white border border-slate-200 rounded text-sm font-semibold text-slate-700">
                  {localReport.type === 'Mechanical' ? '기계 장치' : localReport.type === 'Hydraulic' ? '유압 시스템' : '자동화 설비'} 정밀 조립
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1 min-h-[400px]">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center justify-between uppercase tracking-tight">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[#F37321] rounded"></span>
                점검 체크리스트
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">실시간 입력 모드 활성화</span>
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">항목</th>
                  <th className="pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">판정 기준</th>
                  <th className="pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24 text-center">결과</th>
                  <th className="pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">비고 및 조치사항</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {localReport.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 font-semibold text-slate-800 text-xs">{item.item}</td>
                    <td className="py-3 text-slate-500 italic text-[11px] uppercase tracking-tight">{item.category} 유효성 검사</td>
                    <td className="py-3 px-2">
                      <select 
                        disabled={isReadOnly}
                        value={item.result}
                        onChange={(e) => updateItem(item.id, 'result', e.target.value as any)}
                        className={cn(
                          "w-full text-[10px] font-bold py-1 px-2 rounded border appearance-none cursor-pointer focus:outline-none transition-all text-center",
                          item.result === 'PASS' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          item.result === 'FAIL' ? "bg-orange-50 text-[#F37321] border-orange-100" :
                          "bg-slate-50 text-slate-400 border-slate-200",
                          isReadOnly && "cursor-default opacity-80"
                        )}
                      >
                        <option value="PASS">정상 (PASS)</option>
                        <option value="FAIL">불합격 (FAIL)</option>
                        <option value="N/A">해당없음</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <input 
                        disabled={isReadOnly}
                        type="text" 
                        value={item.observation}
                        onChange={(e) => updateItem(item.id, 'observation', e.target.value)}
                        placeholder={isReadOnly ? "—" : "교정 데이터 또는 특이사항 입력..."}
                        className="w-full bg-slate-50 px-2 py-1 border border-slate-100 rounded text-[11px] font-medium focus:ring-1 focus:ring-[#F37321] focus:border-[#F37321] focus:outline-none transition-all placeholder:text-slate-300"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feedback & History Section */}
        <div className="w-72 flex flex-col gap-6 shrink-0">
          <div className="bg-[#222222] text-white p-6 rounded-xl shadow-xl flex flex-col">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-6">검토 및 승인 피드백</h3>
            <div className="space-y-6 flex-1 overflow-y-auto max-h-[300px]">
              {localReport.comments.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">등록된 피드백이 없습니다.</p>
              ) : (
                localReport.comments.map((c, i) => {
                  const isInspector = c.includes('INSPECTOR');
                  return (
                    <div key={i} className={cn("flex items-start gap-3", !isInspector && "pb-4 border-b border-slate-700")}>
                      <div className={cn("h-8 w-8 shrink-0 rounded flex items-center justify-center font-bold text-[10px] uppercase", isInspector ? "bg-slate-700" : "bg-[#F37321]")}>
                        {isInspector ? '작성' : '승인'}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-200">{isInspector ? '점검자' : '승인권자'} <span className="text-slate-500 font-normal uppercase text-[9px] tracking-widest ml-1">• {isInspector ? '기안' : '검토'}</span></div>
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
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4 tracking-widest">버전 및 이력 관리</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-800 uppercase tracking-tight">VER {localReport.version}.01 (최신)</span>
                <span className="text-emerald-500 font-bold text-[9px] uppercase tracking-widest">활성</span>
              </div>
              {[...Array(Math.max(0, localReport.version - 1))].map((_, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer group transition-colors">
                  <span className="font-medium italic">VER {localReport.version - i - 1}.00 (아카이브)</span>
                  <span className="underline group-hover:text-[#F37321] transition-colors uppercase font-bold text-[9px]">비교</span>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-4">
               <button 
                 onClick={onExport}
                 className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 border border-slate-200 transition-all active:scale-95 group"
               >
                 <Download className="h-3 w-3 group-hover:scale-110 transition-transform" />
                 PDF 보고서 출력
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
                <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase tracking-[0.1em]">승인 평가 및 검토</h3>
                <p className="text-slate-400 text-[10px] font-black tracking-[0.2em] uppercase mt-1">PGM-IR-PROTOCOL-02</p>
              </div>
              <div className="p-8 space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">검토 의견 입력</label>
                <textarea 
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="보정 사항이나 승인 관련 지시 사항을 입력하세요..."
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-[#F37321] outline-none transition-all resize-none shadow-inner"
                />
              </div>
              <div className="p-8 bg-slate-50/50 flex gap-3">
                <button 
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 py-2 rounded border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
                >
                  취소
                </button>
                <button 
                  onClick={() => {
                    onReject(localReport, approvalComment);
                    setShowApprovalModal(false);
                  }}
                  className="flex-1 py-2 bg-white text-[#F37321] border border-orange-100 rounded text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all shadow-sm"
                >
                  반려
                </button>
                <button 
                  onClick={() => {
                    onApprove(localReport, approvalComment);
                    setShowApprovalModal(false);
                  }}
                  className="flex-1 py-2 bg-[#222222] text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10"
                >
                  최종 승인
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// PDF Export Template Component
const PrintTemplate = ({ report }: { report: Report }) => {
  return (
    <div className="p-10" style={{ fontFamily: 'sans-serif', color: '#0f172a', backgroundColor: '#ffffff', minHeight: '297mm' }}>
      <div className="flex justify-between items-start mb-8 pb-6" style={{ borderBottom: '2px solid #F37321' }}>
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#F37321' }}>Smart-IR 점검 결과 보고서</h1>
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>한화에어로스페이스 PGM 사업부</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold mb-1 uppercase tracking-tighter" style={{ color: '#94a3b8' }}>문서 관리 번호</div>
          <div className="text-lg font-mono font-bold" style={{ color: '#1e293b' }}>{report.id}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest pb-1" style={{ color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>기본 정보</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 font-medium w-24" style={{ color: '#64748b' }}>장비 명칭</td>
                <td className="py-1 font-bold" style={{ color: '#1e293b' }}>{report.title}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium" style={{ color: '#64748b' }}>장비 구분</td>
                <td className="py-1 font-bold" style={{ color: '#1e293b' }}>
                  {report.type === 'Mechanical' ? '기계 장치' : report.type === 'Hydraulic' ? '유압 시스템' : '자동화 설비'}
                </td>
              </tr>
              <tr>
                <td className="py-1 font-medium" style={{ color: '#64748b' }}>보고서 버전</td>
                <td className="py-1 font-bold" style={{ color: '#1e293b' }}>V{report.version}.00</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest pb-1" style={{ color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>수행 정보</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 font-medium w-24" style={{ color: '#64748b' }}>점검 일자</td>
                <td className="py-1 font-bold" style={{ color: '#1e293b' }}>{report.date}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium" style={{ color: '#64748b' }}>책임 점검자</td>
                <td className="py-1 font-bold" style={{ color: '#1e293b' }}>{report.inspector}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium" style={{ color: '#64748b' }}>최종 상태</td>
                <td className="py-1 font-bold" style={{ color: '#1e293b' }}>
                   {report.status === 'APPROVED' ? '최종 승인 완료' : report.status === 'PENDING' ? '검토 대기 중' : '작성 중'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-1" style={{ color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>상세 점검 내역</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
              <th className="py-3 px-4 text-left text-[11px] font-bold uppercase tracking-tight" style={{ color: '#475569' }}>점검 항목</th>
              <th className="py-3 px-4 text-left text-[11px] font-bold uppercase tracking-tight" style={{ color: '#475569' }}>판정 기준</th>
              <th className="py-3 px-4 text-center text-[11px] font-bold uppercase tracking-tight w-24" style={{ color: '#475569' }}>결과</th>
              <th className="py-3 px-4 text-left text-[11px] font-bold uppercase tracking-tight" style={{ color: '#475569' }}>비고</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {report.items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td className="py-3 px-4 font-bold" style={{ color: '#1e293b' }}>{item.item}</td>
                <td className="py-3 px-4" style={{ color: '#64748b' }}>{item.category} 정밀 검사</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ 
                    backgroundColor: item.result === 'PASS' ? '#ecfdf5' : item.result === 'FAIL' ? '#fff7ed' : '#f8fafc',
                    color: item.result === 'PASS' ? '#059669' : item.result === 'FAIL' ? '#F37321' : '#94a3b8'
                  }}>
                    {item.result === 'PASS' ? '정상' : item.result === 'FAIL' ? '이상' : 'N/A'}
                  </span>
                </td>
                <td className="py-3 px-4 italic" style={{ color: '#475569' }}>{item.observation || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {report.comments.length > 0 && (
        <div className="mb-10">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-1" style={{ color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>검토 및 지시 사항</h3>
          <div className="p-6 rounded-lg border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
            {report.comments.map((comment, i) => (
              <p key={i} className="text-xs leading-relaxed font-medium mb-3 last:mb-0" style={{ color: '#334155' }}>
                • {comment}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-20 flex justify-end gap-16 px-10">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase mb-8 tracking-widest" style={{ color: '#94a3b8' }}>점검자 확인</p>
          <div className="w-24 border-b pb-1 font-bold text-sm" style={{ borderColor: '#94a3b8', color: '#1e293b' }}>{report.inspector} (인)</div>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase mb-8 tracking-widest" style={{ color: '#94a3b8' }}>승인권자 확인</p>
          <div className="w-24 border-b pb-1 font-bold text-sm italic" style={{ borderColor: '#94a3b8', color: '#cbd5e1' }}>서명 대기</div>
        </div>
      </div>
      
      <div className="mt-20 pt-8 border-t text-center" style={{ borderColor: '#f1f5f9' }}>
        <p className="text-[9px] font-bold uppercase tracking-[0.4em]" style={{ color: '#94a3b8' }}>HANWHA AEROSPACE CONFIDENTIAL - INTERNAL USE ONLY</p>
      </div>
    </div>
  );
};
