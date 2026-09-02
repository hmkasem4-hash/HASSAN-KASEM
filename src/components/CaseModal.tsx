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
  Bell, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Check, 
  Scale, 
  Moon, 
  Gavel, 
  BookOpen, 
  FolderOpen, 
  FileCheck2, 
  AlertCircle,
  Receipt,
  Banknote,
  Stamp,
  FileSignature,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Coins,
  Wallet,
  Calculator
} from 'lucide-react';
import { 
  CourtCase, 
  CourtType, 
  SessionStage, 
  ClientRole, 
  CaseStatus,
  PreparationChecklistItem,
  CaseAttachment,
  CaseMemorandum,
  JudgmentType,
  EnforcementDetails,
  EnforcementDeedType,
  EnforcementPaymentStatus,
  EnforcementStatus
} from '../types';
import { getTodayString, addDaysToDate, formatArabicDate, formatHijriDate, getDeed30DayAppealInfo } from '../utils/dateUtils';
import { AttachmentUploader } from './AttachmentUploader';
import { SingleDeedUploader } from './SingleDeedUploader';
import { HijriDatePicker } from './HijriDatePicker';

interface CaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (caseData: Partial<CourtCase>) => void;
  onDelete?: (id: string) => void;
  initialData?: CourtCase | null;
  allCourts: string[];
}

const DEFAULT_COURTS: CourtType[] = [
  'المحكمة العامة',
  'المحكمة التجارية',
  'المحكمة العمالية',
  'التسوية الودية',
  'محكمة التنفيذ',
  'محكمة القضاء الإداري',
  'المحكمة الاقتصادية',
  'محكمة الأسرة',
  'محكمة الجنح / الجنايات',
  'محكمة النقض / العليا',
  'أخرى',
];

const STAGES: SessionStage[] = [
  'مرافعة',
  'تقديم مستندات ومذكرات',
  'استجواب وسماع شهود',
  'تقرير الخبير',
  'حجز للحكم',
  'نطق بالحكم',
  'إعادة إعلان',
  'الصلح والتسوية',
  'تجديد حبس',
  'أخرى',
];

const ROLES: ClientRole[] = [
  'مدعي',
  'مدعى عليه',
  'مستأنف',
  'مستأنف ضده',
  'طاعن',
  'مطعون ضده',
  'مجني عليه',
  'متهم',
  'أخرى',
];

const QUICK_CHECKLIST_PRESETS = [
  'إعداد وطباعة مذكرة الدفاع',
  'تجهيز حافظة المستندات',
  'أصل التوكيل وصورة الكارنيه',
  'سداد أمانة الخبير أو الرسوم',
  'التأكيد على حضور الموكل / الشهود',
  'إعلان الخصم بأصل الصحيفة',
  'استخراج شهادة من الجدول',
];

const QUICK_ENFORCEMENT_CHECKLIST_PRESETS = [
  'مطابقة أصل السند التنفيذي',
  'إشعار المنفذ ضده بالقرار 34',
  'طلب تطبيق المادة 46 للحجز والمنع',
  'استخراج أمر دفع / حوالة سداد',
  'مراجعة قسم التحصيل ومأمور التنفيذ',
];

export const CaseModal: React.FC<CaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  allCourts,
}) => {
  const today = getTodayString();

  const [caseNumber, setCaseNumber] = useState('');
  const [caseYear, setCaseYear] = useState(new Date().getFullYear().toString());
  const [court, setCourt] = useState<string>('المحكمة الابتدائية');
  const [customCourt, setCustomCourt] = useState('');
  const [circuit, setCircuit] = useState('');
  const [judge, setJudge] = useState('');
  const [title, setTitle] = useState('');
  
  // New: Detailed Lawsuit Subject & Files (Word / PDF)
  const [subjectDetails, setSubjectDetails] = useState('');
  const [subjectFiles, setSubjectFiles] = useState<CaseAttachment[]>([]);

  // New: Client & Opponent Memoranda
  const [clientMemoText, setClientMemoText] = useState('');
  const [clientMemoFiles, setClientMemoFiles] = useState<CaseAttachment[]>([]);
  const [opponentMemoText, setOpponentMemoText] = useState('');
  const [opponentMemoFiles, setOpponentMemoFiles] = useState<CaseAttachment[]>([]);

  // Closed Case / Judgment & Deed fields
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [judgmentType, setJudgmentType] = useState<JudgmentType>('final');
  const [verdictText, setVerdictText] = useState('');
  const [verdictDate, setVerdictDate] = useState('');
  const [deedDate, setDeedDate] = useState('');
  const [primaryJudgmentDeedFile, setPrimaryJudgmentDeedFile] = useState<CaseAttachment | undefined>(undefined);
  const [appealJudgmentDeedFile, setAppealJudgmentDeedFile] = useState<CaseAttachment | undefined>(undefined);
  const [status, setStatus] = useState<CaseStatus>('active');

  // Enforcement / التنفيذ fields
  const [isEnforcement, setIsEnforcement] = useState<boolean>(false);
  const [applicantName, setApplicantName] = useState('');
  const [respondentName, setRespondentName] = useState('');
  const [enforcementAmount, setEnforcementAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<EnforcementPaymentStatus>('سداد جزئي');
  const [enforcementStatus, setEnforcementStatus] = useState<EnforcementStatus>('نشط');
  const [deedType, setDeedType] = useState<EnforcementDeedType>('صك حكم');
  const [customDeedType, setCustomDeedType] = useState('');
  const [enforcementNumber, setEnforcementNumber] = useState('');
  const [enforcementRequestDate, setEnforcementRequestDate] = useState(today);
  const [enforcementNotes, setEnforcementNotes] = useState('');

  const [clientName, setClientName] = useState('');
  const [clientRole, setClientRole] = useState<ClientRole>('مدعي');
  const [clientPhone, setClientPhone] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [opponentLawyer, setOpponentLawyer] = useState('');
  const [assignedLawyer, setAssignedLawyer] = useState('الأستاذ / المحامي');
  const [sessionDate, setSessionDate] = useState(today);
  const [sessionTime, setSessionTime] = useState('09:30');
  const [sessionStage, setSessionStage] = useState<string>('مرافعة');
  const [previousDecision, setPreviousDecision] = useState('');
  const [demands, setDemands] = useState('');
  const [notes, setNotes] = useState('');
  const [remind24h, setRemind24h] = useState(true);
  const [checklist, setChecklist] = useState<PreparationChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Helper numeric calculations for Enforcement
  const cleanNumber = (val: string): number => {
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const formatNumber = (num: number): string => {
    if (num <= 0) return '0';
    return num.toLocaleString('en-US');
  };

  const handleEnforcementAmountChange = (val: string) => {
    setEnforcementAmount(val);
    const total = cleanNumber(val);
    const paid = cleanNumber(paidAmount);
    if (paymentStatus === 'سداد جزئي') {
      if (total > 0) {
        const rem = Math.max(0, total - paid);
        setRemainingAmount(rem > 0 ? formatNumber(rem) : '0');
      } else {
        setRemainingAmount('');
      }
    } else if (paymentStatus === 'سداد كلي') {
      setPaidAmount(val);
      setRemainingAmount('0');
    }
  };

  const handlePaidAmountChange = (val: string) => {
    setPaidAmount(val);
    const total = cleanNumber(enforcementAmount);
    const paid = cleanNumber(val);
    if (total > 0) {
      const rem = Math.max(0, total - paid);
      setRemainingAmount(rem > 0 ? formatNumber(rem) : '0');
    }
  };

  const handleRemainingAmountChange = (val: string) => {
    setRemainingAmount(val);
  };

  const handleSelectPaymentStatus = (newStatus: EnforcementPaymentStatus) => {
    setPaymentStatus(newStatus);
    const total = cleanNumber(enforcementAmount);
    if (newStatus === 'سداد كلي') {
      setPaidAmount(enforcementAmount);
      setRemainingAmount('0');
    } else {
      // سداد جزئي
      const paid = cleanNumber(paidAmount);
      if (paid === total && total > 0) {
        setPaidAmount('');
        setRemainingAmount(enforcementAmount);
      } else if (total > 0) {
        const rem = Math.max(0, total - paid);
        setRemainingAmount(rem > 0 ? formatNumber(rem) : '0');
      }
    }
  };

  useEffect(() => {
    if (initialData) {
      setCaseNumber(initialData.caseNumber || '');
      setCaseYear(initialData.caseYear || new Date().getFullYear().toString());
      if (DEFAULT_COURTS.includes(initialData.court as CourtType)) {
        setCourt(initialData.court);
        setCustomCourt('');
      } else {
        setCourt('أخرى');
        setCustomCourt(initialData.court);
      }
      setCircuit(initialData.circuit || '');
      setJudge(initialData.judge || '');
      setTitle(initialData.title || '');
      
      // Subject & files
      setSubjectDetails(initialData.subjectDetails || '');
      setSubjectFiles(initialData.subjectFiles || []);

      // Memos
      setClientMemoText(initialData.clientMemo?.text || '');
      setClientMemoFiles(initialData.clientMemo?.files || []);
      setOpponentMemoText(initialData.opponentMemo?.text || '');
      setOpponentMemoFiles(initialData.opponentMemo?.files || []);

      // Verdict & Closed status & Deed fields
      const closed = initialData.isClosed ?? (initialData.status === 'judged' || initialData.sessionStage === 'نطق بالحكم' || Boolean(initialData.verdictText));
      setIsClosed(Boolean(closed));
      setJudgmentType(initialData.judgmentType || 'final');
      setVerdictText(initialData.verdictText || '');
      setVerdictDate(initialData.verdictDate || '');
      setDeedDate(initialData.deedDate || initialData.verdictDate || '');
      setPrimaryJudgmentDeedFile(initialData.primaryJudgmentDeedFile);
      setAppealJudgmentDeedFile(initialData.appealJudgmentDeedFile);
      setStatus(closed ? 'judged' : (initialData.status || 'active'));

      // Enforcement fields
      if (initialData.enforcement && (initialData.enforcement.isEnforcement || initialData.court === 'محكمة التنفيذ')) {
        setIsEnforcement(true);
        setApplicantName(initialData.enforcement.applicantName || initialData.clientName || '');
        setRespondentName(initialData.enforcement.respondentName || initialData.opponentName || '');
        setEnforcementAmount(initialData.enforcement.amount ? String(initialData.enforcement.amount) : '');
        setPaidAmount(initialData.enforcement.paidAmount ? String(initialData.enforcement.paidAmount) : '');
        setRemainingAmount(initialData.enforcement.remainingAmount ? String(initialData.enforcement.remainingAmount) : '');
        setPaymentStatus(initialData.enforcement.paymentStatus || 'سداد جزئي');
        setEnforcementStatus(initialData.enforcement.enforcementStatus || 'نشط');
        setDeedType(initialData.enforcement.deedType || 'صك حكم');
        setCustomDeedType(initialData.enforcement.customDeedType || '');
        setEnforcementNumber(initialData.enforcement.enforcementNumber || '');
        setEnforcementRequestDate(initialData.enforcement.requestDate || today);
        setEnforcementNotes(initialData.enforcement.notes || '');
      } else {
        setIsEnforcement(false);
        setApplicantName(initialData.clientName || '');
        setRespondentName(initialData.opponentName || '');
        setEnforcementAmount('');
        setPaidAmount('');
        setRemainingAmount('');
        setPaymentStatus('سداد جزئي');
        setEnforcementStatus('نشط');
        setDeedType('صك حكم');
        setCustomDeedType('');
        setEnforcementNumber('');
        setEnforcementRequestDate(today);
        setEnforcementNotes('');
      }

      setClientName(initialData.clientName || '');
      setClientRole(initialData.clientRole || 'مدعي');
      setClientPhone(initialData.clientPhone || '');
      setOpponentName(initialData.opponentName || '');
      setOpponentLawyer(initialData.opponentLawyer || '');
      setAssignedLawyer(initialData.assignedLawyer || 'الأستاذ / المحامي');
      setSessionDate(initialData.sessionDate || today);
      setSessionTime(initialData.sessionTime || '09:30');
      setSessionStage(initialData.sessionStage || 'مرافعة');
      setPreviousDecision(initialData.previousDecision || '');
      setDemands(initialData.demands || '');
      setNotes(initialData.notes || '');
      setRemind24h(initialData.remind24h ?? true);
      setChecklist(initialData.checklist || []);
    } else {
      // Reset defaults
      setCaseNumber('');
      setCaseYear(new Date().getFullYear().toString());
      setCourt('المحكمة الابتدائية');
      setCustomCourt('');
      setCircuit('الدائرة الأولى مدني');
      setJudge('');
      setTitle('');
      setSubjectDetails('');
      setSubjectFiles([]);
      setClientMemoText('');
      setClientMemoFiles([]);
      setOpponentMemoText('');
      setOpponentMemoFiles([]);
      setIsClosed(false);
      setJudgmentType('final');
      setVerdictText('');
      setVerdictDate('');
      setDeedDate('');
      setPrimaryJudgmentDeedFile(undefined);
      setAppealJudgmentDeedFile(undefined);
      setStatus('active');

      // Reset enforcement
      setIsEnforcement(false);
      setApplicantName('');
      setRespondentName('');
      setEnforcementAmount('');
      setPaymentStatus('سداد جزئي');
      setEnforcementStatus('نشط');
      setDeedType('صك حكم');
      setCustomDeedType('');
      setEnforcementNumber('');
      setEnforcementRequestDate(today);
      setEnforcementNotes('');

      setClientName('');
      setClientRole('مدعي');
      setClientPhone('');
      setOpponentName('');
      setOpponentLawyer('');
      setAssignedLawyer('الأستاذ / المحامي');
      setSessionDate(today);
      setSessionTime('09:30');
      setSessionStage('مرافعة');
      setPreviousDecision('');
      setDemands('');
      setNotes('');
      setRemind24h(true);
      setChecklist([
        { id: '1', text: 'إعداد وطباعة مذكرة الدفاع', completed: false },
        { id: '2', text: 'تجهيز حافظة المستندات والتوكيل', completed: false }
      ]);
    }
  }, [initialData, isOpen, today]);

  // Handle stage change to 'نطق بالحكم'
  const handleStageChange = (newStage: string) => {
    setSessionStage(newStage);
    if (newStage === 'نطق بالحكم') {
      setIsClosed(true);
      setStatus('judged');
      if (!verdictDate) {
        setVerdictDate(sessionDate || today);
      }
    }
  };

  const handleToggleClosed = (closed: boolean) => {
    setIsClosed(closed);
    if (closed) {
      setStatus('judged');
      if (!verdictDate) {
        setVerdictDate(sessionDate || today);
      }
    } else {
      setStatus('active');
      if (sessionStage === 'نطق بالحكم') {
        setSessionStage('مرافعة');
      }
    }
  };

  if (!isOpen) return null;

  const handleAddChecklistItem = (text: string) => {
    if (!text.trim()) return;
    setChecklist([
      ...checklist,
      { id: Date.now().toString(), text: text.trim(), completed: false },
    ]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNumber.trim() || !title.trim() || !clientName.trim()) {
      alert('يرجى ملء الحقول الإلزامية: رقم القضية، موضوع الدعوى، واسم الموكل.');
      return;
    }

    if (!isEnforcement && sessionStage === 'نطق بالحكم' && !verdictText.trim()) {
      alert('يرجى كتابة منطوق الحكم الصادر في الدعوى.');
      return;
    }

    const finalCourt = court === 'أخرى' && customCourt.trim() ? customCourt.trim() : court;
    const isJudged = Boolean(isClosed || sessionStage === 'نطق بالحكم' || Boolean(verdictText.trim()) || status === 'judged');

    const clientMemo: CaseMemorandum | undefined = (clientMemoText.trim() || clientMemoFiles.length > 0) ? {
      text: clientMemoText.trim(),
      files: clientMemoFiles,
      updatedAt: new Date().toISOString(),
    } : undefined;

    const opponentMemo: CaseMemorandum | undefined = (opponentMemoText.trim() || opponentMemoFiles.length > 0) ? {
      text: opponentMemoText.trim(),
      files: opponentMemoFiles,
      updatedAt: new Date().toISOString(),
    } : undefined;

    const finalDeedDate = deedDate.trim() || (isJudged ? (verdictDate || sessionDate || today) : undefined);
    
    // Check 30-day appeal status
    const appealCheck = finalDeedDate ? getDeed30DayAppealInfo({
      ...({} as CourtCase),
      deedDate: finalDeedDate,
      status: 'judged',
    }) : null;

    const enforcementData: EnforcementDetails | undefined = isEnforcement ? {
      isEnforcement: true,
      applicantName: applicantName.trim() || clientName.trim(),
      respondentName: respondentName.trim() || opponentName.trim(),
      amount: enforcementAmount.trim() || undefined,
      paidAmount: paymentStatus === 'سداد جزئي' 
        ? (paidAmount.trim() || undefined) 
        : (paymentStatus === 'سداد كلي' ? (enforcementAmount.trim() || undefined) : undefined),
      remainingAmount: paymentStatus === 'سداد جزئي' 
        ? (remainingAmount.trim() || undefined) 
        : (paymentStatus === 'سداد كلي' ? '0' : undefined),
      paymentStatus,
      enforcementStatus,
      deedType,
      customDeedType: deedType === 'أخرى' ? customDeedType.trim() : undefined,
      enforcementNumber: enforcementNumber.trim() || undefined,
      requestDate: enforcementRequestDate || today,
      notes: enforcementNotes.trim() || undefined,
    } : undefined;

    onSave({
      caseNumber: caseNumber.trim(),
      caseYear: caseYear.trim(),
      court: finalCourt,
      circuit: circuit.trim() || (isEnforcement && court === 'محكمة التنفيذ' ? 'دائرة التنفيذ الأولى' : 'الدائرة الأولى'),
      judge: judge.trim(),
      title: title.trim(),
      subjectDetails: subjectDetails.trim(),
      subjectFiles,
      clientMemo,
      opponentMemo,
      isClosed: isJudged,
      judgmentType: isJudged ? judgmentType : undefined,
      verdictText: isJudged ? verdictText.trim() : '',
      verdictDate: isJudged ? (verdictDate || sessionDate || today) : undefined,
      deedDate: finalDeedDate || undefined,
      primaryJudgmentDeedFile: primaryJudgmentDeedFile,
      appealJudgmentDeedFile: appealJudgmentDeedFile,
      enforcement: enforcementData,
      clientName: clientName.trim(),
      clientRole,
      clientPhone: clientPhone.trim(),
      opponentName: opponentName.trim() || 'غير محدد',
      opponentLawyer: opponentLawyer.trim(),
      assignedLawyer: assignedLawyer.trim(),
      sessionDate: (court === 'محكمة التنفيذ' && !isJudged) ? undefined : sessionDate,
      sessionTime: (court === 'محكمة التنفيذ' && !isJudged) ? undefined : sessionTime,
      sessionStage: (court === 'محكمة التنفيذ' && !isJudged) ? undefined : sessionStage,
      previousDecision: previousDecision.trim(),
      demands: demands.trim(),
      notes: notes.trim(),
      remind24h: isJudged ? false : remind24h,
      checklist,
      status: isJudged 
        ? (appealCheck?.isWithin30Days ? 'active' : 'judged') 
        : (initialData?.status === 'judged' ? 'active' : (initialData?.status || 'active')),
    });

    onClose();
  };

  const isJudgmentStage = isClosed || sessionStage === 'نطق بالحكم' || status === 'judged';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 no-print animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                {initialData ? 'تعديل بيانات وملف القضية' : 'إضافة قضية / جلسة جديدة'}
              </h2>
              <p className="text-xs text-slate-400">
                إدخال وقائع الدعوى، المذكرات، ومرفقات Word و PDF، وتوثيق الأحكام
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Court & Case Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-amber-700 tracking-wider flex items-center gap-2 border-b border-amber-100 pb-1">
              <Building2 className="w-4 h-4" />
              <span>بيانات المحكمة ورقم الدعوى</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم القضية / الدعوى <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="مثال: 1428"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  السنة القضائية
                </label>
                <input
                  type="text"
                  value={caseYear}
                  onChange={(e) => setCaseYear(e.target.value)}
                  placeholder="2026"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المحكمة المختصة <span className="text-rose-500">*</span>
                </label>
                <select
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white transition cursor-pointer"
                >
                  {DEFAULT_COURTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {court === 'أخرى' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المحكمة المخصصة
                </label>
                <input
                  type="text"
                  value={customCourt}
                  onChange={(e) => setCustomCourt(e.target.value)}
                  placeholder="مثال: محكمة أسوان الابتدائية - مأمورية نصر النوبة"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الدائرة / القاعة
                </label>
                <input
                  type="text"
                  value={circuit}
                  onChange={(e) => setCircuit(e.target.value)}
                  placeholder="مثال: الدائرة 3 استئنافي عالي / قاعة 4"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رئيس الدائرة / القاضي (اختياري)
                </label>
                <input
                  type="text"
                  value={judge}
                  onChange={(e) => setJudge(e.target.value)}
                  placeholder="المستشار / ..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان / تصنيف الدعوى <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: دعوى صحة ونفاذ عقد بيع عقار / دعوى بطلان قرار إداري"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
              />
            </div>

          </div>

          {/* Section 2: Detailed Subject & Lawsuit Facts + Word/PDF Uploads */}
          <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>موضوع ووقائع الدعوى التفصيلية (إدخال ولصق نصي + رفع ملفات Word / PDF)</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نص موضوع الدعوى ووقائعها (يمكنك الكتابة أو اللصق والنسخ بحرية):
              </label>
              <textarea
                rows={4}
                value={subjectDetails}
                onChange={(e) => setSubjectDetails(e.target.value)}
                placeholder="الصق أو اكتب هنا تفاصيل ووقائع الدعوى، طلبات صحيفة الافتتاح، الأسانيد القانونية، والمستندات المؤيدة..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-amber-500 transition font-normal"
              />
            </div>

            {/* Subject Files Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                مرفقات ملف موضوع الدعوى (Word / PDF):
              </label>
              <AttachmentUploader
                files={subjectFiles}
                onChange={setSubjectFiles}
                label="رفع صحيفة الدعوى أو ملخص الوقائع (Word أو PDF)"
              />
            </div>
          </div>

          {/* Section 3: Legal Memoranda (Client Memo & Opponent Memo) */}
          <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <FolderOpen className="w-4 h-4 text-sky-600" />
              <span>مذكرات الدفاع القانونية (مذكرة الموكل ومذكرة الخصم - كتابة ورفع Word / PDF)</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Client Memo */}
              <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>مذكرة دفاع الموكل</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    طرفنا
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={clientMemoText}
                  onChange={(e) => setClientMemoText(e.target.value)}
                  placeholder="اكتب أو الصق نص مذكرة الدفاع أو الردود والدفوع الخاصة بالموكل..."
                  className="w-full bg-white border border-emerald-300/80 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 transition"
                />

                <AttachmentUploader
                  files={clientMemoFiles}
                  onChange={setClientMemoFiles}
                  label="رفع مذكرة الموكل (Word / PDF)"
                />
              </div>

              {/* Opponent Memo */}
              <div className="bg-rose-50/40 p-3.5 rounded-xl border border-rose-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-rose-600" />
                    <span>مذكرة دفاع الخصم</span>
                  </span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                    الطرف الآخر
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={opponentMemoText}
                  onChange={(e) => setOpponentMemoText(e.target.value)}
                  placeholder="اكتب أو الصق ما جاء بمذكرة دفاع الخصم لتفنيدها والرد عليها..."
                  className="w-full bg-white border border-rose-300/80 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-rose-500 transition"
                />

                <AttachmentUploader
                  files={opponentMemoFiles}
                  onChange={setOpponentMemoFiles}
                  label="رفع مذكرة الخصم (Word / PDF)"
                />
              </div>

            </div>
          </div>

          {/* Section 4: Parties (Client & Opponent) */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-amber-700 tracking-wider flex items-center gap-2 border-b border-amber-100 pb-1">
              <Users className="w-4 h-4" />
              <span>أطراف الخصومة (الموكل والخصم)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الموكل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="مثال: أحمد محمد علي"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  صفة الموكل
                </label>
                <select
                  value={clientRole}
                  onChange={(e) => setClientRole(e.target.value as ClientRole)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white transition cursor-pointer"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم هاتف الموكل (لإرسال تذكير واتساب)
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الخصم / الشركة المشكو في حقها
                </label>
                <input
                  type="text"
                  value={opponentName}
                  onChange={(e) => setOpponentName(e.target.value)}
                  placeholder="مثال: شركة المقاولات الحديثة"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>اسم المحامي الحاضر عن الموكل</span>
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded font-semibold">
                    بالجلسة
                  </span>
                </label>
                <input
                  type="text"
                  value={assignedLawyer}
                  onChange={(e) => setAssignedLawyer(e.target.value)}
                  placeholder="الأستاذ / ... (محامي الحضور والدفاع)"
                  className="w-full bg-amber-50/40 border border-amber-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  محامي الخصم (اختياري)
                </label>
                <input
                  type="text"
                  value={opponentLawyer}
                  onChange={(e) => setOpponentLawyer(e.target.value)}
                  placeholder="الأستاذ / ..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>
            </div>

          </div>

          {/* Section 4.5: خانة التنفيذ (Enforcement Execution Section) */}
          <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
            isEnforcement 
              ? 'bg-slate-900 text-white border-amber-500/80 shadow-xl ring-2 ring-amber-500/20' 
              : 'bg-gradient-to-r from-amber-50/70 via-amber-100/40 to-slate-50 border-amber-300 shadow-sm hover:border-amber-400'
          }`}>
            {/* Clickable Header / Toggle Bar */}
            <div 
              onClick={() => {
                const nextState = !isEnforcement;
                setIsEnforcement(nextState);
                if (nextState) {
                  if (!applicantName) setApplicantName(clientName);
                  if (!respondentName) setRespondentName(opponentName);
                }
              }}
              className="p-4 flex items-center justify-between cursor-pointer select-none transition hover:opacity-95"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl transition ${
                  isEnforcement 
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30' 
                    : 'bg-amber-500 text-slate-950'
                }`}>
                  <Stamp className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm sm:text-base font-extrabold ${
                      isEnforcement ? 'text-amber-300' : 'text-slate-900'
                    }`}>
                      ⚖️ خانة التنفيذ القضائي
                    </h3>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold border ${
                      isEnforcement 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' 
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {isEnforcement ? 'الخانة مفعلة ومفتوحة' : 'اضغط للفتح وتحديد خيارات التنفيذ'}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${
                    isEnforcement ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    توثيق طالب التنفيذ، المنفذ ضده، المبلغ، حالة السداد، نوع السند، وحالة الإجراء.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs ${
                    isEnforcement
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
                  }`}
                >
                  {isEnforcement ? (
                    <>
                      <span>إخفاء الخيارات</span>
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>فتح خيارات التنفيذ</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Enforcement Options */}
            {isEnforcement && (
              <div className="p-4 sm:p-5 border-t border-slate-800 space-y-5 animate-in fade-in">
                
                {/* 1. أطراف التنفيذ (طالب التنفيذ والمنفذ ضده) */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>أطراف طلب التنفيذ:</span>
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* طالب التنفيذ */}
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-200">
                          اسم طالب التنفيذ <span className="text-rose-400">*</span>
                        </label>
                        {clientName && (
                          <button
                            type="button"
                            onClick={() => setApplicantName(clientName)}
                            className="text-[10px] text-amber-300 hover:text-amber-200 underline font-semibold cursor-pointer"
                          >
                            نسخ من الموكل ({clientName})
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="مثال: شركة ساعد / فلان بن فلان"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition font-semibold"
                      />
                    </div>

                    {/* المنفذ ضده */}
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-200">
                          اسم المنفذ ضده <span className="text-rose-400">*</span>
                        </label>
                        {opponentName && (
                          <button
                            type="button"
                            onClick={() => setRespondentName(opponentName)}
                            className="text-[10px] text-amber-300 hover:text-amber-200 underline font-semibold cursor-pointer"
                          >
                            نسخ من الخصم ({opponentName})
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={respondentName}
                        onChange={(e) => setRespondentName(e.target.value)}
                        placeholder="مثال: شركة المقاولات / فلان بن فلان"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. مبلغ التنفيذ المطلوب + رقم الطلب + تاريخ قيد الطلب */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950/90 p-3.5 rounded-xl border-2 border-amber-500/50 shadow-inner space-y-1.5">
                    <label className="block text-xs font-bold text-amber-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-400" />
                        <span>المبلغ المطلوب سداده <span className="text-rose-400">*</span></span>
                      </span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-mono font-bold">
                        إجمالي التنفيذ
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={enforcementAmount}
                        onChange={(e) => handleEnforcementAmountChange(e.target.value)}
                        placeholder="مثال: 250,000"
                        className="w-full bg-slate-900 border border-amber-500/70 rounded-xl px-3 py-2 text-sm text-amber-200 font-mono font-black focus:ring-2 focus:ring-amber-400 focus:bg-slate-950 transition text-left dir-ltr pl-14 shadow-xs"
                      />
                      <span className="absolute left-3 top-2 text-xs font-black text-amber-400 pointer-events-none">
                        ر.س
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      المبلغ الإجمالي للسند التنفيذي
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-sky-400" />
                      <span>رقم طلب التنفيذ (إن وجد)</span>
                    </label>
                    <input
                      type="text"
                      value={enforcementNumber}
                      onChange={(e) => setEnforcementNumber(e.target.value)}
                      placeholder="مثال: 451098234 / ناجز"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono focus:ring-2 focus:ring-amber-400 transition"
                    />
                    <p className="text-[10px] text-slate-400">
                      رقم الطلب على بوابة ناجز أو المحكمة
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span>تاريخ قيد وتوثيق الطلب</span>
                    </label>
                    <input
                      type="date"
                      value={enforcementRequestDate}
                      onChange={(e) => setEnforcementRequestDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono focus:ring-2 focus:ring-amber-400 transition font-bold"
                    />
                    <div className="text-[10px] text-amber-400/90 font-mono">
                      أم القرى: {formatHijriDate(enforcementRequestDate || today)} هـ
                    </div>
                  </div>
                </div>

                {/* 3. نوع السند (صك حكم / وثيقة صلح تراضي / سند لأمر / أخرى) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <FileSignature className="w-4 h-4 text-amber-400" />
                    <span>نوع السند التنفيذي <span className="text-rose-400">*</span>:</span>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* خيار 1: صك حكم */}
                    <div
                      onClick={() => setDeedType('صك حكم')}
                      className={`p-3 rounded-xl border-2 transition cursor-pointer flex flex-col items-center text-center justify-center gap-1.5 ${
                        deedType === 'صك حكم'
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/20'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Scale className={`w-5 h-5 ${deedType === 'صك حكم' ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-extrabold">صك حكم</span>
                      <span className="text-[10px] text-slate-400 leading-tight">حكم قضائي صادر</span>
                    </div>

                    {/* خيار 2: وثيقة صلح تراضي */}
                    <div
                      onClick={() => setDeedType('وثيقة صلح تراضي')}
                      className={`p-3 rounded-xl border-2 transition cursor-pointer flex flex-col items-center text-center justify-center gap-1.5 ${
                        deedType === 'وثيقة صلح تراضي'
                          ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <ShieldCheck className={`w-5 h-5 ${deedType === 'وثيقة صلح تراضي' ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-extrabold">وثيقة صلح تراضي</span>
                      <span className="text-[10px] text-slate-400 leading-tight">معتمدة من تراضي</span>
                    </div>

                    {/* خيار 3: سند لأمر */}
                    <div
                      onClick={() => setDeedType('سند لأمر')}
                      className={`p-3 rounded-xl border-2 transition cursor-pointer flex flex-col items-center text-center justify-center gap-1.5 ${
                        deedType === 'سند لأمر'
                          ? 'bg-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/20'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Receipt className={`w-5 h-5 ${deedType === 'سند لأمر' ? 'text-sky-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-extrabold">سند لأمر</span>
                      <span className="text-[10px] text-slate-400 leading-tight">ورقة تجارية تنفيذية</span>
                    </div>

                    {/* خيار 4: أخرى */}
                    <div
                      onClick={() => setDeedType('أخرى')}
                      className={`p-3 rounded-xl border-2 transition cursor-pointer flex flex-col items-center text-center justify-center gap-1.5 ${
                        deedType === 'أخرى'
                          ? 'bg-purple-500/20 border-purple-400 text-white shadow-md shadow-purple-500/20'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <FolderOpen className={`w-5 h-5 ${deedType === 'أخرى' ? 'text-purple-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-extrabold">أخرى</span>
                      <span className="text-[10px] text-slate-400 leading-tight">عقد إيجار / شيك / مخصص</span>
                    </div>
                  </div>

                  {/* في حال اختيار أخرى */}
                  {deedType === 'أخرى' && (
                    <div className="pt-2 animate-in fade-in">
                      <input
                        type="text"
                        value={customDeedType}
                        onChange={(e) => setCustomDeedType(e.target.value)}
                        placeholder="حدد نوع السند التنفيذي (مثال: عقد إيجار موثق، قرار تحكيمي، شيك بنكي...)"
                        className="w-full bg-slate-950 border border-purple-400/60 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:ring-2 focus:ring-purple-400 transition"
                      />
                    </div>
                  )}
                </div>

                {/* 4. حالة السداد (سداد كلي / سداد جزئي) + 5. حالة طلب التنفيذ (نشط / منتهي) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  
                  {/* حالة السداد */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <label className="block text-xs font-bold text-amber-300">
                      حالة السداد والاستيفاء:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectPaymentStatus('سداد جزئي')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                          paymentStatus === 'سداد جزئي'
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-black'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>سداد جزئي</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPaymentStatus('سداد كلي')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                          paymentStatus === 'سداد كلي'
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm font-black'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>سداد كلي</span>
                      </button>
                    </div>
                  </div>

                  {/* حالة طلب التنفيذ */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <label className="block text-xs font-bold text-amber-300">
                      حالة طلب التنفيذ:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEnforcementStatus('نشط')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                          enforcementStatus === 'نشط'
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm font-black'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping ml-0.5"></span>
                        <span>نشط (ساري)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEnforcementStatus('منتهي')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                          enforcementStatus === 'منتهي'
                            ? 'bg-slate-700 text-white border-slate-500 shadow-sm font-black'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>منتهي (مغلق)</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* تفاصيل السداد الجزئي (تظهر عند اختيار سداد جزئي فقط) */}
                {paymentStatus === 'سداد جزئي' && (
                  <div className="bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-950 p-4 rounded-2xl border-2 border-amber-500/60 shadow-lg space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black text-amber-300">
                          تفاصيل وبيانات السداد الجزئي:
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800/80 font-mono">
                        احتساب ومتابعة الأقساط
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* خانة المبلغ الذي تم سداده */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-amber-400/40 space-y-1.5">
                        <label className="block text-xs font-black text-amber-300 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                            <span>المبلغ الذي تم سداده (المسدد)</span>
                          </span>
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                            تم تحصيله
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={paidAmount}
                            onChange={(e) => handlePaidAmountChange(e.target.value)}
                            placeholder="مثال: 50,000"
                            className="w-full bg-slate-950 border border-emerald-500/60 rounded-xl px-3 py-2 text-sm text-emerald-300 font-mono font-black focus:ring-2 focus:ring-emerald-400 transition text-left dir-ltr pl-14"
                          />
                          <span className="absolute left-3 top-2 text-xs font-black text-emerald-400 pointer-events-none">
                            ر.س
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          إجمالي المبالغ المستوفاة والمسددة حتى الآن
                        </p>
                      </div>

                      {/* خانة المبلغ المتبقي */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-amber-400/40 space-y-1.5">
                        <label className="block text-xs font-black text-amber-300 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Banknote className="w-3.5 h-3.5 text-rose-400" />
                            <span>المبلغ المتبقي</span>
                          </span>
                          <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800 font-mono">
                            تحت الاستيفاء
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={remainingAmount}
                            onChange={(e) => handleRemainingAmountChange(e.target.value)}
                            placeholder="مثال: 200,000"
                            className="w-full bg-slate-950 border border-rose-500/60 rounded-xl px-3 py-2 text-sm text-rose-300 font-mono font-black focus:ring-2 focus:ring-rose-400 transition text-left dir-ltr pl-14"
                          />
                          <span className="absolute left-3 top-2 text-xs font-black text-rose-400 pointer-events-none">
                            ر.س
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          المبلغ المتبقي على المنفذ ضده لصالح الطالب
                        </p>
                      </div>
                    </div>

                    {/* شريط ومؤشر نسبة التحصيل والاستيفاء */}
                    {(() => {
                      const totalNum = cleanNumber(enforcementAmount);
                      const paidNum = cleanNumber(paidAmount);
                      const pct = totalNum > 0 ? Math.min(100, Math.round((paidNum / totalNum) * 100)) : 0;
                      return (
                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1.5 text-xs">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-300 flex items-center gap-1">
                              <Calculator className="w-3.5 h-3.5 text-amber-400" />
                              <span>نسبة الإنجاز والتحصيل:</span>
                            </span>
                            <span className="text-amber-300 font-black font-mono">
                              {pct}% (محصل: {paidNum > 0 ? paidNum.toLocaleString() : 0} ر.س • متبقي: {Math.max(0, totalNum - paidNum).toLocaleString()} ر.س)
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
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

                {/* ملاحظات التنفيذ */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ملاحظات وإجراءات التنفيذ الميدانية / الإلكترونية:
                  </label>
                  <textarea
                    rows={2}
                    value={enforcementNotes}
                    onChange={(e) => setEnforcementNotes(e.target.value)}
                    placeholder="مثال: تم قيد الطلب بناجز، إشعار المنفذ ضده بالمادة 34، أو الحجز على الحسابات بالمادة 46..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-amber-400 transition"
                  />
                </div>

              </div>
            )}
          </div>

          {/* Section 5: Case Status, Session Stage & Closed Case (Verdict) Settings */}
          <div className="space-y-4 bg-amber-50/40 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2 flex-wrap gap-2">
              <h3 className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>حالة القضية، الموعد، والإنهاء</span>
              </h3>

              {/* Closed Case Toggle Switch */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-sm">
                <input
                  type="checkbox"
                  id="closedCaseToggle"
                  checked={isClosed}
                  onChange={(e) => handleToggleClosed(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                />
                <label htmlFor="closedCaseToggle" className="text-xs font-bold text-slate-800 cursor-pointer select-none flex items-center gap-1.5">
                  <Gavel className={`w-3.5 h-3.5 ${isClosed ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>قضية منتهية (صدور حكم)</span>
                </label>
              </div>
            </div>

            {isJudgmentStage ? (
              /* Judgment Stage Layout: Stage -> تاريخ النطق -> تاريخ صدور الصك (بالميلادي وبتقويم أم القرى) */
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  {/* الخانة الأولى: نوع / مرحلة الجلسة */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <Gavel className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>نوع / مرحلة الجلسة</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={sessionStage}
                      onChange={(e) => handleStageChange(e.target.value)}
                      className="w-full bg-white border-2 border-amber-500/80 rounded-xl px-3 py-2 text-sm font-black text-amber-950 focus:ring-2 focus:ring-amber-500 transition cursor-pointer shadow-xs"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* الخانة المجاورة: تاريخ النطق */}
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>تاريخ النطق</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={sessionDate}
                      onChange={(e) => {
                        setSessionDate(e.target.value);
                        setVerdictDate(e.target.value);
                      }}
                      className="w-full bg-white border-2 border-amber-500/80 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 transition font-bold font-mono text-slate-900 shadow-xs"
                    />
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-950 font-medium">
                      <Moon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>أم القرى:</span>
                      <span className="font-extrabold text-amber-900 font-mono">
                        {formatHijriDate(sessionDate || verdictDate || today)} هـ
                      </span>
                    </div>
                  </div>

                  {/* الخانة التالية: تاريخ صدور الصك (بالميلادي وأيضاً بتقويم أم القرى) */}
                  <div className="md:col-span-6 bg-white p-3 rounded-xl border-2 border-amber-400/80 shadow-xs">
                    <HijriDatePicker
                      label="تاريخ صدور الصك"
                      value={deedDate || verdictDate || sessionDate || today}
                      onChange={(newIso) => setDeedDate(newIso)}
                      required
                      theme="light"
                      showGregorianInput={true}
                      helpText="يتم احتساب مهلة الـ 30 يوماً للاستئناف والاعتراض تلقائياً بناءً على تاريخ الصك"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Standard Active Session Layout */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نوع / مرحلة الجلسة <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={sessionStage}
                    onChange={(e) => handleStageChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-amber-500 transition cursor-pointer"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاريخ الجلسة <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 transition font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    توقيت انعقاد الجلسة
                  </label>
                  <input
                    type="time"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>
              </div>
            )}

            {/* Special Pronouncement of Judgment (منطوق الحكم) & Judgment Type Box */}
            {isJudgmentStage && (
              <div className="bg-slate-900 text-white p-4 rounded-2xl border-2 border-emerald-500/60 shadow-lg space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Gavel className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="font-extrabold text-sm text-amber-300">
                        بيانات إنهاء الدعوى ومنطوق الحكم الصادر
                      </span>
                      <span className="text-[11px] text-slate-300 block">
                        هذه القضية مصنفة كـ "قضية منتهية" ومستبعدة من الرول النشط وتنبيهات الجلسات المتداولة.
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-black rounded-lg">
                    قضية منتهية
                  </span>
                </div>

                {/* 2 Judgment Options: حكم نهائي vs حكم قابل للاستئناف */}
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-2">
                    نوع وحالة الحكم الصادر في الدعوى <span className="text-rose-400">*</span>:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Option 1: Final Judgment */}
                    <div
                      onClick={() => setJudgmentType('final')}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        judgmentType === 'final'
                          ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-md shadow-emerald-950'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="judgmentTypeRadio"
                        checked={judgmentType === 'final'}
                        onChange={() => setJudgmentType('final')}
                        className="mt-1 accent-emerald-500 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs sm:text-sm text-emerald-300">
                            ⚖️ حكم نهائي (بات)
                          </span>
                          {judgmentType === 'final' && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-400/40">
                              محدد
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                          حكم منهي للخصومة تماماً وبات وغير قابل للطعن بالاستئناف.
                        </p>
                      </div>
                    </div>

                    {/* Option 2: Appealable Judgment */}
                    <div
                      onClick={() => setJudgmentType('appealable')}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        judgmentType === 'appealable'
                          ? 'bg-sky-950/80 border-sky-400 text-white shadow-md shadow-sky-950'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="judgmentTypeRadio"
                        checked={judgmentType === 'appealable'}
                        onChange={() => setJudgmentType('appealable')}
                        className="mt-1 accent-sky-500 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs sm:text-sm text-sky-300">
                            ⏳ حكم قابل للاستئناف
                          </span>
                          {judgmentType === 'appealable' && (
                            <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded border border-sky-400/40">
                              محدد
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                          حكم أول درجة / ابتدائي قابل للطعن بالاستئناف خلال المواعيد النظامية.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Verdict Text */}
                <div>
                  <label className="block text-xs font-bold text-amber-200 mb-1">
                    نص منطوق الحكم بدقة <span className="text-rose-400">*</span>:
                  </label>
                  <textarea
                    rows={3}
                    required={isJudgmentStage}
                    value={verdictText}
                    onChange={(e) => setVerdictText(e.target.value)}
                    placeholder="مثال: حكمت المحكمة حضورياً بقبول الدعوى شكلاً، وفي الموضوع بإلزام المدعى عليه بأن يؤدي للمدعي مبلغ 500,000 ريال والمصاريف وأتعاب المحاماة..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:ring-2 focus:ring-amber-400 font-semibold leading-relaxed"
                  />
                </div>

                {/* 30-Day Appeal Rule Info Banner */}
                {(() => {
                  const effectiveDate = deedDate || verdictDate || sessionDate || today;
                  const appealInfo = getDeed30DayAppealInfo({
                    ...({} as CourtCase),
                    deedDate: effectiveDate,
                    status: 'judged',
                  });
                  return (
                    <div className="bg-slate-950/90 rounded-xl p-3 border border-amber-500/40 text-xs space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 font-bold text-amber-300">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>قاعدة مهلة الاستئناف (30 يوماً من تاريخ الصك):</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${appealInfo.statusBadgeColor}`}>
                          {appealInfo.statusBadgeText}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        وفقاً للنظام: <strong className="text-amber-200">تظل حالة الدعوى نشطة لمدة 30 يوماً</strong> من تاريخ صدور الصك ({formatArabicDate(effectiveDate)} الموافق {formatHijriDate(effectiveDate)}) حتى تاريخ انتهاء مهلة الاستئناف ({formatArabicDate(appealInfo.expiryDate)}) ثم تتحول تلقائياً إلى حالة <strong className="text-emerald-300">منتهية</strong>.
                      </p>
                    </div>
                  );
                })()}

                {/* Dedicated Deed Upload Fields: Primary Deed & Appeal Deed */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <span className="block text-xs font-black text-amber-300">
                    📂 مرفقات صكوك الأحكام القضائية:
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Primary Judgment Deed Upload */}
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                      <SingleDeedUploader
                        label="صك الحكم الابتدائي"
                        sublabel="رفع صك حكم الدرجة الأولى (PDF / Word / صورة)"
                        file={primaryJudgmentDeedFile}
                        onChange={setPrimaryJudgmentDeedFile}
                        badgeText="الابتدائي"
                        badgeColorClass="bg-sky-500/20 text-sky-300 border-sky-400/30"
                        accentBorderColor="border-sky-500/60"
                      />
                    </div>

                    {/* Appeal Judgment Deed Upload */}
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                      <SingleDeedUploader
                        label="صك حكم الاستئناف"
                        sublabel="رفع صك حكم محكمة الاستئناف (PDF / Word / صورة)"
                        file={appealJudgmentDeedFile}
                        onChange={setAppealJudgmentDeedFile}
                        badgeText="الاستئناف"
                        badgeColorClass="bg-indigo-500/20 text-indigo-300 border-indigo-400/30"
                        accentBorderColor="border-indigo-500/60"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Date Presets if not judged */}
            {!isJudgmentStage && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-600 font-bold ml-1">تحديد سريع للموعد:</span>
                <button
                  type="button"
                  onClick={() => setSessionDate(today)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border ${
                    sessionDate === today ? 'bg-amber-500 text-slate-950 border-amber-600' : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  اليوم
                </button>
                <button
                  type="button"
                  onClick={() => setSessionDate(addDaysToDate(today, 1))}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border ${
                    sessionDate === addDaysToDate(today, 1) ? 'bg-amber-500 text-slate-950 border-amber-600' : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  غداً
                </button>
                <button
                  type="button"
                  onClick={() => setSessionDate(addDaysToDate(today, 7))}
                  className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
                >
                  بعد أسبوع
                </button>
                <button
                  type="button"
                  onClick={() => setSessionDate(addDaysToDate(today, 14))}
                  className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
                >
                  بعد أسبوعين
                </button>
                <button
                  type="button"
                  onClick={() => setSessionDate(addDaysToDate(today, 30))}
                  className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
                >
                  بعد شهر
                </button>
              </div>
            )}

            {/* Live Dual Date Display */}
            {sessionDate && (
              <div className="bg-white p-2.5 rounded-xl border border-amber-300 flex items-center justify-between gap-2 flex-wrap text-xs shadow-2xs">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>الميلادي: {formatArabicDate(sessionDate, { includeWeekday: true })}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Moon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تقويم أم القرى: {formatHijriDate(sessionDate, { includeWeekday: false })}</span>
                </div>
              </div>
            )}

            {/* Smart 24h Alert Checkbox (only for active/ongoing cases) */}
            {!isJudgmentStage && (
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-amber-300 shadow-xs">
                <input
                  type="checkbox"
                  id="remind24h"
                  checked={remind24h}
                  onChange={(e) => setRemind24h(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="remind24h" className="text-xs text-slate-800 font-bold flex items-center gap-1.5 cursor-pointer">
                  <Bell className="w-4 h-4 text-amber-600" />
                  <span>تفعيل التنبيه الذكي قبل موعد الجلسة بـ 24 ساعة (إشعار مرئي وصوتي وتذكير فوري)</span>
                </label>
              </div>
            )}

          </div>

          {/* Section 6: Decisions & Demands */}
          {!isJudgmentStage && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-amber-700 tracking-wider flex items-center gap-2 border-b border-amber-100 pb-1">
                <FileText className="w-4 h-4" />
                <span>{isEnforcement ? 'القرارات والإجراءات والمطلوب في التنفيذ' : 'القرارات والطلبات وملاحظات الدفاع'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEnforcement ? 'المطلوب في إجراءات التنفيذ' : 'المطلوب في الجلسة القادمة'}
                  </label>
                  <textarea
                    rows={2}
                    value={demands}
                    onChange={(e) => setDemands(e.target.value)}
                    placeholder={isEnforcement ? "مثال: مراجعة الدائرة، إشعار المنفذ ضده، الحجز على الأموال..." : "مثال: تقديم مذكرة بالرد على الدفوع وسماع الشهود..."}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEnforcement ? 'القرار التنفيذي السابق (إن وجد)' : 'قرار الجلسة السابقة (إن وجد)'}
                  </label>
                  <textarea
                    rows={2}
                    value={previousDecision}
                    onChange={(e) => setPreviousDecision(e.target.value)}
                    placeholder={isEnforcement ? "مثال: صدور قرار 34، أو إشعار البنك المركزي..." : "مثال: التأجيل لجلسة اليوم لإعلان الخصم بالطلبات العارضة"}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات وتوجيهات خاصة
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isEnforcement ? "أي ملاحظات إضافية حول المنفذ ضده، الحسابات، أو المأمور..." : "أي ملاحظات إضافية حول القاعة، الرسوم، الموكل، أو السكرتير..."}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          {/* Section 7: Preparation Checklist */}
          {!isJudgmentStage && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-amber-700 tracking-wider flex items-center gap-2 border-b border-amber-100 pb-1">
                <CheckSquare className="w-4 h-4" />
                <span>{isEnforcement ? 'قائمة مهام ومتابعة إجراءات التنفيذ' : 'قائمة تجهيزات ومهام الجلسة'}</span>
              </h3>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 text-xs mb-2">
                <span className="text-slate-500 font-semibold ml-1">إضافة سريعة:</span>
                {(isEnforcement ? QUICK_ENFORCEMENT_CHECKLIST_PRESETS : QUICK_CHECKLIST_PRESETS).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddChecklistItem(preset)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition cursor-pointer border border-slate-200"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              {/* Checklist items */}
              <div className="space-y-2">
                {checklist.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleChecklist(item.id)}
                      className="flex items-center gap-2 text-right flex-1 cursor-pointer font-medium text-slate-800"
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                        item.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {item.completed && <Check className="w-3 h-3" />}
                      </div>
                      <span className={item.completed ? 'line-through text-slate-400' : ''}>
                        {item.text}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Item */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  placeholder="أضف مهمة تجهيز خاصة..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklistItem(newChecklistText);
                    }
                  }}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleAddChecklistItem(newChecklistText)}
                  className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                >
                  إضافة
                </button>
              </div>

            </div>
          )}

        </form>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            {initialData?.id && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialData.id);
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف القضية نهائياً</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              {initialData ? 'حفظ التعديلات' : 'حفظ القضية والجدولة'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
