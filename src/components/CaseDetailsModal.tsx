import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Calendar, 
  Clock, 
  User, 
  Users, 
  UserCheck,
  FileText, 
  CheckCircle2, 
  Circle, 
  Send, 
  Phone, 
  Printer, 
  ArrowRightLeft, 
  Edit3, 
  History, 
  Plus, 
  Check, 
  Copy,
  AlertTriangle,
  Scale,
  FileCheck,
  CalendarPlus,
  Sparkles,
  Trash2,
  Gavel,
  BookOpen,
  FolderOpen,
  Download,
  Stamp,
  Receipt,
  Banknote,
  FileSignature,
  Coins,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import { CourtCase, CaseAttachment } from '../types';
import { 
  formatArabicDate, 
  formatArabicTime, 
  formatHijriDate,
  getCountdownBadge, 
  isWithin24Hours,
  getTodayString,
  addDaysToDate,
  getDeed30DayAppealInfo
} from '../utils/dateUtils';

interface CaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: CourtCase | null;
  onEdit: (c: CourtCase) => void;
  onDelete: (id: string) => void;
  onPostpone: (c: CourtCase) => void;
  onUpdateNextSession?: (
    caseId: string,
    data: {
      nextDate: string;
      nextTime: string;
      nextDemands?: string;
      decisionNote?: string;
      assignedLawyer?: string;
    }
  ) => void;
  onToggleChecklist: (caseId: string, itemId: string) => void;
  onAddChecklistItem: (caseId: string, text: string) => void;
}

export const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({
  isOpen,
  onClose,
  caseItem,
  onEdit,
  onDelete,
  onPostpone,
  onUpdateNextSession,
  onToggleChecklist,
  onAddChecklistItem,
}) => {
  const [newItemText, setNewItemText] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedVerdict, setCopiedVerdict] = useState(false);
  const [successSaved, setSuccessSaved] = useState(false);

  // Next session form fields
  const [nextDate, setNextDate] = useState('');
  const [nextTime, setNextTime] = useState('09:30');
  const [nextLawyer, setNextLawyer] = useState('');
  const [nextDemands, setNextDemands] = useState('');
  const [decisionNote, setDecisionNote] = useState('');

  useEffect(() => {
    if (caseItem) {
      setNextDate(addDaysToDate(caseItem.sessionDate, 14));
      setNextTime(caseItem.sessionTime || '09:30');
      setNextLawyer(caseItem.assignedLawyer || '');
      setNextDemands(caseItem.demands || '');
      setDecisionNote('');
      setSuccessSaved(false);
    }
  }, [caseItem?.id, caseItem?.sessionDate, caseItem?.sessionTime, caseItem?.assignedLawyer]);

  if (!isOpen || !caseItem) return null;

  const today = getTodayString();
  const isJudged = caseItem.status === 'judged' || caseItem.sessionStage === 'نطق بالحكم' || Boolean(caseItem.verdictText);
  const countdown = getCountdownBadge(caseItem.sessionDate, caseItem.sessionTime);
  const urgent24h = !isJudged && isWithin24Hours(caseItem);

  const handleCopySummary = () => {
    const lawyerInfo = caseItem.assignedLawyer ? `\nالمحامي الحاضر عن الموكل: ${caseItem.assignedLawyer}` : '';
    const verdictInfo = caseItem.verdictText ? `\nمنطوق الحكم: ${caseItem.verdictText}` : '';
    const text = `ملخص القضية:\nرقم: ${caseItem.caseNumber} لسنة ${caseItem.caseYear}\nالمحكمة: ${caseItem.court} (${caseItem.circuit})\nالموضوع: ${caseItem.title}\nالموكل: ${caseItem.clientName} (${caseItem.clientRole})${lawyerInfo}\nالخصم: ${caseItem.opponentName}\nالجلسة: ${formatArabicDate(caseItem.sessionDate)} (${formatHijriDate(caseItem.sessionDate)}) الساعة ${formatArabicTime(caseItem.sessionTime)}\nالمطلوب: ${caseItem.demands || 'مرافعة'}${verdictInfo}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySubject = () => {
    if (!caseItem.subjectDetails) return;
    navigator.clipboard.writeText(caseItem.subjectDetails);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleCopyVerdict = () => {
    if (!caseItem.verdictText) return;
    navigator.clipboard.writeText(caseItem.verdictText);
    setCopiedVerdict(true);
    setTimeout(() => setCopiedVerdict(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!caseItem.clientPhone) return;
    const cleanPhone = caseItem.clientPhone.replace(/[^0-9]/g, '');
    const lawyerLine = caseItem.assignedLawyer ? `\nالمحامي الحاضر عن الموكل بالجلسة: ${caseItem.assignedLawyer}` : '';
    const message = encodeURIComponent(
      `السلام عليكم أستاذ/ة ${caseItem.clientName}،\nنحيطكم علماً بأن موعد الجلسة القادمة في القضية رقم (${caseItem.caseNumber} لسنة ${caseItem.caseYear})\nالمحكمة: ${caseItem.court} - ${caseItem.circuit}${lawyerLine}\nالتاريخ: ${formatArabicDate(caseItem.sessionDate)} الموافق هجرياً (${formatHijriDate(caseItem.sessionDate)} تقويم أم القرى) الساعة ${formatArabicTime(caseItem.sessionTime)}\nالمطلوب: ${caseItem.demands || 'الحضور لمقر المحكمة'}\nشاكرين تعاونكم.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    onAddChecklistItem(caseItem.id, newItemText.trim());
    setNewItemText('');
  };

  const handlePrintCase = () => {
    window.print();
  };

  const handleDeleteCase = () => {
    onDelete(caseItem.id);
  };

  const handleSaveNextSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextDate) {
      alert('يرجى تحديد تاريخ الجلسة القادمة');
      return;
    }

    if (onUpdateNextSession) {
      onUpdateNextSession(caseItem.id, {
        nextDate,
        nextTime: nextTime || '09:30',
        nextDemands,
        decisionNote: decisionNote.trim() || `تأجيل وتحديد موعد الجلسة القادمة ليوم ${formatArabicDate(nextDate)}`,
        assignedLawyer: nextLawyer.trim(),
      });
    }

    setSuccessSaved(true);
    setTimeout(() => {
      setSuccessSaved(false);
    }, 4000);
  };

  const downloadFile = (file: CaseAttachment) => {
    if (!file.dataUrl) return;
    const a = document.createElement('a');
    a.href = file.dataUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isEnforcement = Boolean((caseItem.enforcement && caseItem.enforcement.isEnforcement) || caseItem.court === 'محكمة التنفيذ');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 no-print animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl font-bold ${
              isEnforcement 
                ? 'bg-amber-400 text-slate-950' 
                : isJudged 
                ? 'bg-emerald-500 text-slate-950' 
                : 'bg-amber-500 text-slate-950'
            }`}>
              {isEnforcement ? <Stamp className="w-6 h-6" /> : isJudged ? <Gavel className="w-6 h-6" /> : <Scale className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-bold">
                  {isEnforcement ? 'طلب تنفيذ' : 'دعوى'} {caseItem.caseNumber} / {caseItem.caseYear}
                </span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-lg text-xs">
                  {caseItem.court}
                </span>
                {isJudged && (
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 border ${
                    caseItem.judgmentType === 'final'
                      ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                      : caseItem.judgmentType === 'appealable'
                      ? 'bg-sky-500/30 text-sky-300 border-sky-500/50'
                      : 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                  }`}>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>
                      {caseItem.judgmentType === 'final'
                        ? 'قضية منتهية - حكم نهائي'
                        : caseItem.judgmentType === 'appealable'
                        ? 'قضية منتهية - حكم قابل للاستئناف'
                        : 'قضية منتهية - محكوم فيها'}
                    </span>
                  </span>
                )}

                {isEnforcement && (
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 border ${
                    caseItem.enforcement?.enforcementStatus === 'منتهي'
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                  }`}>
                    <Stamp className="w-3 h-3 text-amber-400" />
                    <span>{caseItem.enforcement?.enforcementStatus === 'منتهي' ? 'طلب تنفيذ منتهي' : 'طلب تنفيذ ساري (نشط)'}</span>
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white mt-1">
                {caseItem.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintCase}
              title="طباعة تقرير القضية"
              className="p-2 hover:bg-slate-800 text-slate-300 rounded-xl transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteCase}
              title="حذف القضية نهائياً من التطبيق"
              className="p-2 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 rounded-xl transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Pronouncement of Judgment (منطوق الحكم) Banner if judged */}
          {isJudged && caseItem.verdictText && (
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white border-2 border-emerald-500/80 rounded-2xl p-5 shadow-lg space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-400 text-slate-950 rounded-xl font-bold">
                    <Gavel className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-amber-300">
                        منطوق الحكم الصادر في الدعوى
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        caseItem.judgmentType === 'final'
                          ? 'bg-emerald-800 text-emerald-200 border border-emerald-600'
                          : 'bg-sky-900 text-sky-200 border border-sky-600'
                      }`}>
                        {caseItem.judgmentType === 'final' ? 'حكم نهائي (بات)' : caseItem.judgmentType === 'appealable' ? 'حكم قابل للاستئناف' : 'حكم منهي للخصومة'}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-300 mt-1 flex items-center gap-2 flex-wrap">
                      <span>
                        تاريخ صدور الحكم: <strong className="text-white font-mono">{formatArabicDate(caseItem.verdictDate || caseItem.sessionDate)}</strong>
                      </span>
                      <span className="text-amber-300 font-medium">
                        (الموافق: <strong className="font-mono text-amber-200">{formatHijriDate(caseItem.verdictDate || caseItem.sessionDate)}</strong> تقويم أم القرى)
                      </span>
                      <span className="px-1.5 py-0.2 bg-emerald-900/80 border border-emerald-500/50 rounded text-[10px] text-emerald-200">
                        قضية منتهية
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCopyVerdict}
                  className="px-3 py-1.5 bg-emerald-800/60 hover:bg-emerald-700 text-emerald-200 border border-emerald-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedVerdict ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedVerdict ? 'تم نسخ المنطوق' : 'نسخ المنطوق'}</span>
                </button>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-700/60 leading-relaxed font-serif text-sm sm:text-base text-amber-100/95 font-medium whitespace-pre-wrap">
                {caseItem.verdictText}
              </div>
            </div>
          )}

          {/* DEDICATED JUDGMENT DEED & 30-DAY APPEAL TRACKING SECTION */}
          {(() => {
            const deedInfo = getDeed30DayAppealInfo(caseItem);
            const hasDeedData = Boolean(caseItem.deedDate || caseItem.primaryJudgmentDeedFile || caseItem.appealJudgmentDeedFile || isJudged);
            if (!hasDeedData) return null;

            return (
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 text-white rounded-2xl p-5 border-2 border-amber-400/70 shadow-xl space-y-4 animate-in fade-in">
                {/* Section Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-black text-amber-300">
                          صك الحكم القضائي ومهلة الاستئناف (30 يوماً)
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${deedInfo.statusBadgeColor}`}>
                          {deedInfo.statusBadgeText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        حالة الدعوى تظل نشطة لمدة 30 يوماً من تاريخ الصك (لإتاحة الاستئناف والطعن)، وتتحول تلقائياً إلى منتهية بعد انقضاء المهلة.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onEdit(caseItem)}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل الصك والمرفقات</span>
                  </button>
                </div>

                {/* Date Breakdown & 30-Day Progress Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {/* Deed Issuance Date */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-bold block">
                      تاريخ صدور الصك القضائي:
                    </span>
                    <span className="font-extrabold text-sm text-white font-mono block">
                      {formatArabicDate(deedInfo.deedDate)}
                    </span>
                    <span className="text-[11px] text-amber-300 font-medium block">
                      {formatHijriDate(deedInfo.deedDate)} (أم القرى)
                    </span>
                  </div>

                  {/* 30-Day Expiry Date */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-bold block">
                      تاريخ نهاية مهلة الاستئناف (30 يوماً):
                    </span>
                    <span className="font-extrabold text-sm text-emerald-400 font-mono block">
                      {formatArabicDate(deedInfo.expiryDate)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium block">
                      {formatHijriDate(deedInfo.expiryDate)}
                    </span>
                  </div>

                  {/* Status & Countdown Card */}
                  <div className={`p-3 rounded-xl border sm:col-span-2 lg:col-span-1 space-y-1 ${
                    deedInfo.isWithin30Days 
                      ? 'bg-amber-950/50 border-amber-400/60 text-amber-200' 
                      : 'bg-slate-950/80 border-slate-800 text-slate-300'
                  }`}>
                    <span className="text-[11px] font-bold block">
                      {deedInfo.isWithin30Days ? 'المهلة النظامية سارية:' : 'الحالة النهائية:'}
                    </span>
                    <div className="font-extrabold text-xs sm:text-sm">
                      {deedInfo.isWithin30Days ? (
                        <span className="text-amber-300 font-black">
                          متبقي {deedInfo.remainingDays} يوم (الدعوى نشطة)
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold">
                          انقضت المهلة (الدعوى منتهية)
                        </span>
                      )}
                    </div>
                    {/* Progress indicator */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5">
                      <div
                        className={`h-full transition-all duration-500 ${
                          deedInfo.isWithin30Days ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${deedInfo.progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Primary & Appeal Deeds Download Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  
                  {/* Primary Judgment Deed Box */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-sky-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-sky-300 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-sky-400" />
                        <span>صك الحكم الابتدائي</span>
                      </span>
                      <span className="px-2 py-0.5 bg-sky-950 text-sky-300 text-[10px] font-bold rounded border border-sky-800">
                        الدرجة الأولى
                      </span>
                    </div>

                    {caseItem.primaryJudgmentDeedFile ? (
                      <div className="flex items-center justify-between bg-slate-900/90 p-2.5 rounded-lg border border-sky-800/60 text-xs">
                        <div className="overflow-hidden flex-1 pl-2">
                          <span className="font-bold text-white truncate block text-xs" title={caseItem.primaryJudgmentDeedFile.name}>
                            {caseItem.primaryJudgmentDeedFile.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {caseItem.primaryJudgmentDeedFile.size ? `${Math.round(caseItem.primaryJudgmentDeedFile.size / 1024)} KB` : 'مستند صك رقمي'}
                          </span>
                        </div>
                        {caseItem.primaryJudgmentDeedFile.dataUrl && (
                          <button
                            type="button"
                            onClick={() => downloadFile(caseItem.primaryJudgmentDeedFile!)}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تحميل</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div 
                        onClick={() => onEdit(caseItem)}
                        className="bg-slate-900/50 p-2.5 rounded-lg border border-dashed border-slate-700 text-center cursor-pointer hover:border-sky-500 transition text-[11px] text-slate-400"
                      >
                        لم يتم رفع صك الحكم الابتدائي بعد • اضغط للتعديل والرفع
                      </div>
                    )}
                  </div>

                  {/* Appeal Judgment Deed Box */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-indigo-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-indigo-400" />
                        <span>صك حكم الاستئناف</span>
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 text-[10px] font-bold rounded border border-indigo-800">
                        محكمة الاستئناف
                      </span>
                    </div>

                    {caseItem.appealJudgmentDeedFile ? (
                      <div className="flex items-center justify-between bg-slate-900/90 p-2.5 rounded-lg border border-indigo-800/60 text-xs">
                        <div className="overflow-hidden flex-1 pl-2">
                          <span className="font-bold text-white truncate block text-xs" title={caseItem.appealJudgmentDeedFile.name}>
                            {caseItem.appealJudgmentDeedFile.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {caseItem.appealJudgmentDeedFile.size ? `${Math.round(caseItem.appealJudgmentDeedFile.size / 1024)} KB` : 'مستند صك رقمي'}
                          </span>
                        </div>
                        {caseItem.appealJudgmentDeedFile.dataUrl && (
                          <button
                            type="button"
                            onClick={() => downloadFile(caseItem.appealJudgmentDeedFile!)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تحميل</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div 
                        onClick={() => onEdit(caseItem)}
                        className="bg-slate-900/50 p-2.5 rounded-lg border border-dashed border-slate-700 text-center cursor-pointer hover:border-indigo-500 transition text-[11px] text-slate-400"
                      >
                        لم يتم رفع صك حكم الاستئناف بعد • اضغط للتعديل والرفع
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })()}

          {/* DEDICATED ENFORCEMENT DETAILS CARD (بيانات التنفيذ القضائي) */}
          {caseItem.enforcement && (caseItem.enforcement.isEnforcement || caseItem.court === 'محكمة التنفيذ') && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl p-5 border-2 border-amber-500/70 shadow-xl space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
                    <Stamp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-amber-300">
                        بيانات وقرارات التنفيذ القضائي
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                        caseItem.enforcement.enforcementStatus === 'نشط'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {caseItem.enforcement.enforcementStatus === 'نشط' ? '🟢 طلب تنفيذ نشط (ساري)' : '⚪ طلب تنفيذ منتهي'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                        caseItem.enforcement.paymentStatus === 'سداد كلي'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : 'bg-amber-950 text-amber-300 border-amber-700'
                      }`}>
                        {caseItem.enforcement.paymentStatus === 'سداد كلي' ? 'سداد كلي' : 'سداد جزئي'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      تفاصيل المطالبة التنفيذية، أطراف السند، ومبالغ الاستيفاء المحصلة.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onEdit(caseItem)}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل بيانات التنفيذ</span>
                </button>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. اسم طالب التنفيذ */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold block flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>طالب التنفيذ:</span>
                  </span>
                  <span className="font-extrabold text-sm text-white block">
                    {caseItem.enforcement.applicantName || caseItem.clientName}
                  </span>
                </div>

                {/* 2. اسم المنفذ ضده */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold block flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-rose-400" />
                    <span>المنفذ ضده:</span>
                  </span>
                  <span className="font-extrabold text-sm text-white block">
                    {caseItem.enforcement.respondentName || caseItem.opponentName}
                  </span>
                </div>

                {/* 3. المبلغ المطلوب سداده */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/40 space-y-1">
                  <span className="text-[11px] text-amber-400 font-bold block flex items-center gap-1">
                    <Banknote className="w-3.5 h-3.5 text-amber-400" />
                    <span>المبلغ المطلوب سداده (الإجمالي):</span>
                  </span>
                  <span className="font-black text-sm text-amber-300 font-mono block">
                    {caseItem.enforcement.amount ? `${caseItem.enforcement.amount} ر.س` : 'غير محدد'}
                  </span>
                </div>

                {/* 4. نوع السند */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold block flex items-center gap-1">
                    <FileSignature className="w-3.5 h-3.5 text-sky-400" />
                    <span>نوع السند التنفيذي:</span>
                  </span>
                  <span className="font-extrabold text-sm text-sky-300 block">
                    {caseItem.enforcement.deedType === 'أخرى' && caseItem.enforcement.customDeedType
                      ? caseItem.enforcement.customDeedType
                      : (caseItem.enforcement.deedType || 'صك حكم')}
                  </span>
                </div>
              </div>

              {/* تفاصيل السداد الجزئي والمبالغ المستوفاة */}
              {caseItem.enforcement.paymentStatus === 'سداد جزئي' && (caseItem.enforcement.paidAmount || caseItem.enforcement.remainingAmount) && (
                <div className="bg-amber-950/20 p-3.5 rounded-xl border border-amber-500/40 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold border-b border-amber-500/20 pb-1.5">
                    <span className="text-amber-300 flex items-center gap-1.5 font-black">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span>بيانات استيفاء السداد الجزئي:</span>
                    </span>
                    <span className="text-[10px] text-amber-400 bg-amber-950 px-2 py-0.5 rounded font-mono border border-amber-800">
                      أقساط ومستوفيات
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950/90 p-2.5 rounded-lg border border-emerald-500/30 flex items-center justify-between">
                      <span className="text-slate-400 font-bold flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>المبلغ الذي تم سداده:</span>
                      </span>
                      <span className="font-black text-sm text-emerald-400 font-mono">
                        {caseItem.enforcement.paidAmount ? `${caseItem.enforcement.paidAmount} ر.س` : '0 ر.س'}
                      </span>
                    </div>

                    <div className="bg-slate-950/90 p-2.5 rounded-lg border border-rose-500/30 flex items-center justify-between">
                      <span className="text-slate-400 font-bold flex items-center gap-1">
                        <Banknote className="w-3.5 h-3.5 text-rose-400" />
                        <span>المبلغ المتبقي:</span>
                      </span>
                      <span className="font-black text-sm text-rose-400 font-mono">
                        {caseItem.enforcement.remainingAmount ? `${caseItem.enforcement.remainingAmount} ر.س` : 'غير محدد'}
                      </span>
                    </div>
                  </div>

                  {/* شريط نسبة التحصيل */}
                  {(() => {
                    const totalNum = parseFloat(String(caseItem.enforcement.amount || '0').replace(/[^0-9.]/g, '')) || 0;
                    const paidNum = parseFloat(String(caseItem.enforcement.paidAmount || '0').replace(/[^0-9.]/g, '')) || 0;
                    const pct = totalNum > 0 ? Math.min(100, Math.round((paidNum / totalNum) * 100)) : 0;
                    return (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-bold">نسبة الاستيفاء والمحصل:</span>
                          <span className="text-amber-300 font-bold font-mono">{pct}% من إجمالي السند</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {caseItem.enforcement.paymentStatus === 'سداد كلي' && (
                <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>تم استيفاء وسداد كامل المبلغ المطلوب بنجاح (100%)</span>
                  </span>
                  <span className="font-mono text-emerald-200 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700">
                    مستوفى بالكامل
                  </span>
                </div>
              )}

              {/* Extra details & notes */}
              {(caseItem.enforcement.enforcementNumber || caseItem.enforcement.notes) && (
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row gap-3 text-xs justify-between">
                  {caseItem.enforcement.enforcementNumber && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">رقم طلب التنفيذ:</span>
                      <span className="font-mono text-amber-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                        {caseItem.enforcement.enforcementNumber}
                      </span>
                    </div>
                  )}
                  {caseItem.enforcement.notes && (
                    <div className="flex-1 text-slate-300 leading-relaxed font-sans">
                      <strong className="text-amber-400 ml-1">ملاحظات:</strong>
                      {caseItem.enforcement.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Urgent 24h Banner if applicable (Sessions only) */}
          {!isEnforcement && urgent24h && (
            <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-3 flex items-center justify-between gap-3 text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse shrink-0" />
                <span className="text-xs sm:text-sm font-bold">
                  تنبيه عاجل: الجلسة منعقدة خلال أقل من 24 ساعة!
                </span>
              </div>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${countdown.colorClass}`}>
                {countdown.text}
              </span>
            </div>
          )}

          {/* Session Date & Circuit Banner OR Execution Court & Circuit Banner */}
          {!isEnforcement ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[11px] text-slate-400 block font-bold">
                      {isJudged ? 'تاريخ جلسة صدور الحكم' : 'تاريخ انعقاد الجلسة الحالي'}
                    </span>
                    <span className="font-extrabold text-sm sm:text-base text-white block">
                      {caseItem.sessionDate ? formatArabicDate(caseItem.sessionDate) : caseItem.verdictDate ? formatArabicDate(caseItem.verdictDate) : 'غير محدد'}
                    </span>
                    {(caseItem.sessionDate || caseItem.verdictDate) && (
                      <span className="text-xs text-amber-300 font-medium">
                        {formatHijriDate(caseItem.sessionDate || caseItem.verdictDate)} (تقويم أم القرى)
                      </span>
                    )}
                  </div>
                </div>
                <div className="font-mono font-bold text-amber-400 bg-slate-800 px-2.5 py-1 rounded-xl text-xs sm:text-sm border border-slate-700 text-center">
                  <span className="block">{formatArabicTime(caseItem.sessionTime)}</span>
                  {caseItem.sessionTime && (
                    <span className="text-[10px] text-slate-400 font-mono">({caseItem.sessionTime})</span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-slate-700" />
                  <div>
                    <span className="text-[11px] text-slate-500 block font-bold">المحكمة والدائرة</span>
                    <span className="font-bold text-sm text-slate-900">{caseItem.court}</span>
                    <span className="text-xs text-slate-600 block">{caseItem.circuit}</span>
                  </div>
                </div>
                {caseItem.judge && (
                  <span className="text-[11px] text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200">
                    {caseItem.judge}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block font-bold">المحكمة التنفيذية والدائرة</span>
                  <span className="font-bold text-sm sm:text-base text-slate-900">{caseItem.court}</span>
                  <span className="text-xs text-slate-600 block">{caseItem.circuit}</span>
                </div>
              </div>
              {caseItem.enforcement?.requestDate && (
                <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-right sm:text-left shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold block">تاريخ قيد وتوثيق الطلب</span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-amber-700">
                    {formatArabicDate(caseItem.enforcement.requestDate)}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium block">
                    ({formatHijriDate(caseItem.enforcement.requestDate)} هـ)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* DEDICATED NEXT SESSION SCHEDULER SECTION (Only for active hearing cases, not enforcement) */}
          {!isJudged && !isEnforcement && (
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
                    <CalendarPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      تحديد وإضافة الموعد القادم للجلسة (تلقائياً)
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      عند إدخال التاريخ القادم يُضاف ويُجدول فوراً في قسم "الجلسات القادمة" والتقويم ورول المحكمة
                    </p>
                  </div>
                </div>

                {successSaved && (
                  <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تمت الإضافة بنجاح للجلسات القادمة!</span>
                  </span>
                )}
              </div>

              {/* Quick Date Presets */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
                <span className="text-slate-700 font-bold ml-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>خيارات سريعة للموعد القادم:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setNextDate(addDaysToDate(caseItem.sessionDate || today, 7))}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100/60 text-slate-800 border border-slate-300 font-bold transition cursor-pointer"
                >
                  + أسبوع
                </button>
                <button
                  type="button"
                  onClick={() => setNextDate(addDaysToDate(caseItem.sessionDate || today, 14))}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100/60 text-slate-800 border border-slate-300 font-bold transition cursor-pointer"
                >
                  + أسبوعين
                </button>
                <button
                  type="button"
                  onClick={() => setNextDate(addDaysToDate(caseItem.sessionDate || today, 21))}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100/60 text-slate-800 border border-slate-300 font-bold transition cursor-pointer"
                >
                  + 3 أسابيع
                </button>
                <button
                  type="button"
                  onClick={() => setNextDate(addDaysToDate(caseItem.sessionDate || today, 30))}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100/60 text-slate-800 border border-slate-300 font-bold transition cursor-pointer"
                >
                  + شهر (30 يوماً)
                </button>
              </div>

              {/* Next Schedule Form */}
              <form onSubmit={handleSaveNextSchedule} className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      تاريخ الجلسة القادمة <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                    />
                    {nextDate && (
                      <div className="text-[10px] text-emerald-800 font-bold mt-1 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200">
                        الموافق: {formatHijriDate(nextDate)} (أم القرى)
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      ساعة وموعد الجلسة
                    </label>
                    <input
                      type="time"
                      value={nextTime}
                      onChange={(e) => setNextTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                    />
                    {nextTime && (
                      <div className="text-[10px] text-slate-600 font-bold mt-1">
                        التوقيت: {formatArabicTime(nextTime)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      المحامي الحاضر عن الموكل بالجلسة القادمة
                    </label>
                    <input
                      type="text"
                      value={nextLawyer}
                      onChange={(e) => setNextLawyer(e.target.value)}
                      placeholder="اسم المحامي المكلف بالحضور..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      المطلوب في الجلسة القادمة
                    </label>
                    <input
                      type="text"
                      value={nextDemands}
                      onChange={(e) => setNextDemands(e.target.value)}
                      placeholder="مرافعة، تقديم مذكرات، سماع شهود، إلخ..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      سبب التأجيل / قرار الجلسة السابقة للتوثيق
                    </label>
                    <input
                      type="text"
                      value={decisionNote}
                      onChange={(e) => setDecisionNote(e.target.value)}
                      placeholder="مثال: تأجيل لتقديم مستندات رسمية أو لإعادة الإعلان..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow transition cursor-pointer"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    <span>تثبيت وإضافة الموعد القادم تلقائياً إلى الجلسات القادمة</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Parties Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Client Card */}
            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-900 uppercase">الموكل</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                  {caseItem.clientRole}
                </span>
              </div>
              <div className="text-base font-extrabold text-slate-900">{caseItem.clientName}</div>
              
              {caseItem.clientPhone && (
                <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60 text-xs">
                  <span className="font-mono text-slate-700">{caseItem.clientPhone}</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${caseItem.clientPhone}`}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      اتصال
                    </a>
                    <button
                      onClick={handleSendWhatsApp}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      واتساب
                    </button>
                  </div>
                </div>
              )}

              {caseItem.assignedLawyer && (
                <div className="text-xs text-emerald-950 pt-2 border-t border-emerald-200/60 bg-emerald-100/60 p-2.5 rounded-xl flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>المحامي الحاضر عن الموكل بالجلسة:</span>
                    </span>
                    <strong className="text-slate-900 font-extrabold text-xs block mt-0.5">{caseItem.assignedLawyer}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Opponent Card */}
            <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-900 uppercase">الخصم</span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md">
                  الطرف الثاني
                </span>
              </div>
              <div className="text-base font-extrabold text-slate-900">{caseItem.opponentName}</div>
              {caseItem.opponentLawyer && (
                <div className="text-xs text-slate-600 pt-2 border-t border-rose-200/60">
                  <span>محامي الخصم: </span>
                  <strong className="text-slate-800">{caseItem.opponentLawyer}</strong>
                </div>
              )}
            </div>

          </div>

          {/* DEDICATED SUBJECT & FACTS SECTION (موضوع ووقائع الدعوى التفصيلية والمرفقات) */}
          {(caseItem.subjectDetails || (caseItem.subjectFiles && caseItem.subjectFiles.length > 0)) && (
            <div className="bg-amber-50/40 border-2 border-amber-300/80 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      موضوع ووقائع الدعوى التفصيلية
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      الوقائع، الأسانيد القانونية، والمستندات المودعة بالدعوى
                    </p>
                  </div>
                </div>

                {caseItem.subjectDetails && (
                  <button
                    onClick={handleCopySubject}
                    className="px-3 py-1.5 bg-white hover:bg-amber-100/60 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSubject ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSubject ? 'تم النسخ' : 'نسخ الموضوع'}</span>
                  </button>
                )}
              </div>

              {/* Text content */}
              {caseItem.subjectDetails && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans max-h-96 overflow-y-auto shadow-inner">
                  {caseItem.subjectDetails}
                </div>
              )}

              {/* Uploaded Word / PDF Files */}
              {caseItem.subjectFiles && caseItem.subjectFiles.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-slate-700 block">
                    الملفات والمستندات المرفقة بموضوع الدعوى ({caseItem.subjectFiles.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {caseItem.subjectFiles.map((file) => {
                      const isPdf = file.type === 'pdf' || file.name.toLowerCase().endsWith('.pdf');
                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs hover:border-slate-300 transition"
                        >
                          <div className="flex items-center gap-2 overflow-hidden flex-1 pl-2">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold ${
                                isPdf ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                              }`}
                            >
                              <span className="text-[10px] font-black">{isPdf ? 'PDF' : 'DOC'}</span>
                            </div>
                            <div className="overflow-hidden">
                              <span className="font-bold text-slate-900 truncate block text-xs" title={file.name}>
                                {file.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {file.size ? (file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`) : 'مستند'}
                              </span>
                            </div>
                          </div>

                          {file.dataUrl && (
                            <button
                              type="button"
                              onClick={() => downloadFile(file)}
                              title="تحميل الملف"
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            >
                              <Download className="w-3.5 h-3.5 text-amber-600" />
                              <span>تحميل</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DEDICATED LEGAL MEMORANDA SECTION (مذكرات الدفاع: الموكل والخصم) */}
          {(caseItem.clientMemo || caseItem.opponentMemo) && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                <div className="p-2 bg-sky-500 text-white rounded-xl font-bold">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    مذكرات الدفاع المتبادلة في الدعوى
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    مذكرات الموكل والخصم القانونية ومرفقاتها (Word / PDF)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Client Memo Box */}
                {caseItem.clientMemo && (
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>مذكرة دفاع الموكل</span>
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                        طرفنا
                      </span>
                    </div>

                    {caseItem.clientMemo.text && (
                      <p className="text-xs sm:text-sm text-slate-800 bg-white p-3 rounded-lg border border-emerald-200 leading-relaxed font-sans whitespace-pre-wrap shadow-inner">
                        {caseItem.clientMemo.text}
                      </p>
                    )}

                    {caseItem.clientMemo.files && caseItem.clientMemo.files.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-emerald-900 block">
                          مرفقات المذكرة ({caseItem.clientMemo.files.length}):
                        </span>
                        {caseItem.clientMemo.files.map((f) => (
                          <div key={f.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-200 text-xs">
                            <span className="font-bold text-slate-800 truncate block text-xs">{f.name}</span>
                            {f.dataUrl && (
                              <button
                                onClick={() => downloadFile(f)}
                                className="px-2 py-1 bg-emerald-600 text-white rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                                تحميل
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Opponent Memo Box */}
                {caseItem.opponentMemo && (
                  <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-rose-600" />
                        <span>مذكرة دفاع الخصم</span>
                      </span>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded">
                        الطرف الآخر
                      </span>
                    </div>

                    {caseItem.opponentMemo.text && (
                      <p className="text-xs sm:text-sm text-slate-800 bg-white p-3 rounded-lg border border-rose-200 leading-relaxed font-sans whitespace-pre-wrap shadow-inner">
                        {caseItem.opponentMemo.text}
                      </p>
                    )}

                    {caseItem.opponentMemo.files && caseItem.opponentMemo.files.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-rose-900 block">
                          مرفقات مذكرة الخصم ({caseItem.opponentMemo.files.length}):
                        </span>
                        {caseItem.opponentMemo.files.map((f) => (
                          <div key={f.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-rose-200 text-xs">
                            <span className="font-bold text-slate-800 truncate block text-xs">{f.name}</span>
                            {f.dataUrl && (
                              <button
                                onClick={() => downloadFile(f)}
                                className="px-2 py-1 bg-rose-600 text-white rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                                تحميل
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Demands & Previous Decisions / Enforcement Actions */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {isEnforcement ? 'تصنيف الطلب:' : 'مرحلة ونوع الجلسة:'}
              </span>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-extrabold rounded-lg text-xs">
                {isEnforcement ? 'إجراءات تنفيذ قضائي' : (caseItem.sessionStage || 'مرافعة')}
              </span>
            </div>

            {caseItem.demands && (
              <div>
                <span className="text-xs font-bold text-amber-900 block mb-1">
                  {isEnforcement ? '📌 المطلوب في إجراءات التنفيذ:' : '📌 المطلوب في الجلسة:'}
                </span>
                <p className="text-xs sm:text-sm text-slate-800 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-medium">
                  {caseItem.demands}
                </p>
              </div>
            )}

            {caseItem.previousDecision && (
              <div>
                <span className="text-xs font-bold text-slate-600 block mb-1">
                  {isEnforcement ? '⚖️ القرار التنفيذي السابق:' : '⚖️ قرار الجلسة السابقة:'}
                </span>
                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {caseItem.previousDecision}
                </p>
              </div>
            )}

            {caseItem.notes && (
              <div>
                <span className="text-xs font-bold text-slate-600 block mb-1">
                  📝 ملاحظات وتوجيهات خاصة:
                </span>
                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {caseItem.notes}
                </p>
              </div>
            )}
          </div>

          {/* Interactive Preparation Checklist */}
          {!isJudged && caseItem.checklist && caseItem.checklist.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-amber-600" />
                  <span>قائمة تجهيزات ومستندات الجلسة</span>
                </h3>
                <span className="text-xs text-slate-500 font-bold">
                  {caseItem.checklist.filter((i) => i.completed).length} من {caseItem.checklist.length} مكتملة
                </span>
              </div>

              <div className="space-y-2">
                {caseItem.checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onToggleChecklist(caseItem.id, item.id)}
                    className="w-full flex items-center gap-2.5 text-right p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition cursor-pointer text-xs sm:text-sm"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={item.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-semibold'}>
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>

              {/* Add item inline */}
              <form onSubmit={handleAddItem} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="أضف مهمة تجهيز أو مستند مطلوب..."
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                >
                  + إضافة
                </button>
              </form>
            </div>
          )}

          {/* Historic Decisions Log */}
          {caseItem.history && caseItem.history.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-sky-600" />
                <span>السجل التاريخي للقرارات السابقة للدعوى ({caseItem.history.length})</span>
              </h3>

              <div className="space-y-2.5">
                {caseItem.history.map((h, idx) => (
                  <div key={h.id || idx} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 font-mono">
                      <span>جلسة تاريخ: {formatArabicDate(h.date)}</span>
                      {h.lawyer && (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-sans font-bold border border-amber-200/60">
                          المحامي الحاضر: {h.lawyer}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-900">{h.decision}</p>
                    {h.notes && <p className="text-slate-600 text-[11px]">{h.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-2 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم نسخ الملخص' : 'نسخ ملخص الدعوى'}</span>
            </button>

            <button
              onClick={handleDeleteCase}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="حذف القضية نهائياً من التطبيق"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>حذف القضية نهائياً</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isJudged && (
              <button
                onClick={() => {
                  onClose();
                  onPostpone(caseItem);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>إثبات قرار / تأجيل الجلسة</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onEdit(caseItem);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>تعديل البيانات</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
