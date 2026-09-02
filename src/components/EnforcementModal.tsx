import React, { useState, useMemo } from 'react';
import { 
  X, 
  Stamp, 
  Search, 
  Plus, 
  Filter, 
  Banknote, 
  Coins, 
  CheckCircle2, 
  Clock, 
  FileSignature, 
  Scale, 
  ShieldCheck, 
  Receipt, 
  FolderOpen, 
  ExternalLink, 
  Edit3, 
  Printer, 
  User, 
  Users, 
  Check, 
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  Wallet
} from 'lucide-react';
import { CourtCase, EnforcementDeedType, EnforcementPaymentStatus, EnforcementStatus } from '../types';
import { AppLogo } from './AppLogo';
import { formatArabicDate } from '../utils/dateUtils';

interface EnforcementModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CourtCase[];
  onOpenCaseDetails: (c: CourtCase) => void;
  onEditCase: (c: CourtCase) => void;
  onAddNewEnforcementCase: () => void;
}

export const EnforcementModal: React.FC<EnforcementModalProps> = ({
  isOpen,
  onClose,
  cases,
  onOpenCaseDetails,
  onEditCase,
  onAddNewEnforcementCase,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeedType, setSelectedDeedType] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Filter all cases that are marked as enforcement or court is 'محكمة التنفيذ'
  const enforcementCases = useMemo(() => {
    return cases.filter((c) => {
      const isEnf = (c.enforcement && c.enforcement.isEnforcement) || c.court === 'محكمة التنفيذ';
      return isEnf;
    });
  }, [cases]);

  // Apply search and sub-filters
  const filteredEnforcementCases = useMemo(() => {
    return enforcementCases.filter((c) => {
      const enf = c.enforcement;
      const applicant = (enf?.applicantName || c.clientName || '').toLowerCase();
      const respondent = (enf?.respondentName || c.opponentName || '').toLowerCase();
      const num = (enf?.enforcementNumber || c.caseNumber || '').toLowerCase();
      const deed = (enf?.deedType || 'صك حكم').toLowerCase();
      const customDeed = (enf?.customDeedType || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || 
        applicant.includes(q) || 
        respondent.includes(q) || 
        num.includes(q) || 
        deed.includes(q) || 
        customDeed.includes(q) ||
        c.title.toLowerCase().includes(q);

      const deedTypeVal = enf?.deedType || (c.court === 'محكمة التنفيذ' ? 'صك حكم' : 'صك حكم');
      const matchesDeed = selectedDeedType === 'all' || deedTypeVal === selectedDeedType;

      const paymentVal = enf?.paymentStatus || 'سداد جزئي';
      const matchesPayment = selectedPaymentStatus === 'all' || paymentVal === selectedPaymentStatus;

      const statusVal = enf?.enforcementStatus || (c.court === 'محكمة التنفيذ' && c.status !== 'judged' ? 'نشط' : (c.status === 'judged' ? (enf?.enforcementStatus || 'نشط') : 'نشط'));
      const matchesStatus = selectedStatus === 'all' || statusVal === selectedStatus;

      return matchesSearch && matchesDeed && matchesPayment && matchesStatus;
    });
  }, [enforcementCases, searchQuery, selectedDeedType, selectedPaymentStatus, selectedStatus]);

  // Calculate statistics
  const stats = useMemo(() => {
    let totalAmount = 0;
    let totalPaidAmount = 0;
    let totalRemainingAmount = 0;
    let activeCount = 0;
    let completedCount = 0;
    let fullPaymentCount = 0;
    let partialPaymentCount = 0;

    const deedCounts: Record<string, number> = {
      'صك حكم': 0,
      'وثيقة صلح تراضي': 0,
      'سند لأمر': 0,
      'أخرى': 0,
    };

    enforcementCases.forEach((c) => {
      const enf = c.enforcement;
      const status = enf?.enforcementStatus || 'نشط';
      if (status === 'نشط') activeCount++;
      else completedCount++;

      const pay = enf?.paymentStatus || 'سداد جزئي';
      if (pay === 'سداد كلي') fullPaymentCount++;
      else partialPaymentCount++;

      const deed = enf?.deedType || 'صك حكم';
      if (deedCounts[deed] !== undefined) {
        deedCounts[deed]++;
      } else {
        deedCounts['أخرى'] = (deedCounts['أخرى'] || 0) + 1;
      }

      // Parse amounts
      const totalNum = parseFloat(String(enf?.amount || '').replace(/[^0-9.]/g, '')) || 0;
      totalAmount += totalNum;

      if (pay === 'سداد كلي') {
        totalPaidAmount += totalNum;
      } else if (pay === 'سداد جزئي') {
        const paidNum = parseFloat(String(enf?.paidAmount || '').replace(/[^0-9.]/g, '')) || 0;
        const remainingNum = enf?.remainingAmount 
          ? (parseFloat(String(enf.remainingAmount).replace(/[^0-9.]/g, '')) || 0)
          : Math.max(0, totalNum - paidNum);
        
        totalPaidAmount += paidNum;
        totalRemainingAmount += remainingNum;
      }
    });

    return {
      total: enforcementCases.length,
      activeCount,
      completedCount,
      fullPaymentCount,
      partialPaymentCount,
      totalAmount,
      totalPaidAmount,
      totalRemainingAmount,
      deedCounts,
    };
  }, [enforcementCases]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-6xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <AppLogo size="md" showRing withGlow />
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500 text-slate-950 rounded-xl">
                  <Stamp className="w-5 h-5" />
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-amber-300">
                  لوحة إدارة ومتابعة طلبات وسندات التنفيذ القضائي
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                توثيق السندات التنفيذية (صكوك أحكام، وثائق صلح تراضي، سندات لأمر)، تحصيل المبالغ، ومتابعة المنفذ ضدهم.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAddNewEnforcementCase}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة طلب تنفيذ جديد</span>
            </button>

            <button
              onClick={handlePrint}
              title="طباعة كشف طلبات التنفيذ"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">طباعة الكشف</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top KPI Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800 text-xs shrink-0">
          
          {/* Total Cases */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-bold block">إجمالي طلبات التنفيذ</span>
              <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-0.5 block">
                {stats.total}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                سارية: {stats.activeCount} • منتهية: {stats.completedCount}
              </span>
            </div>
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
              <Stamp className="w-5 h-5" />
            </div>
          </div>

          {/* Total Required Amount */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-bold block">المبالغ المطلوب سدادها</span>
              <span className="text-base sm:text-lg font-black text-amber-400 font-mono mt-0.5 block">
                {stats.totalAmount > 0 ? stats.totalAmount.toLocaleString('en-US') : '0'} <span className="text-xs text-amber-300">ر.س</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                إجمالي السندات التنفيذية
              </span>
            </div>
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
              <Banknote className="w-5 h-5" />
            </div>
          </div>

          {/* Collected / Paid Amount */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-bold block">المبالغ المسددة والمحصلة</span>
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-0.5 block">
                {stats.totalPaidAmount > 0 ? stats.totalPaidAmount.toLocaleString('en-US') : '0'} <span className="text-xs text-emerald-300">ر.س</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">
                كلي: {stats.fullPaymentCount} • جزئي: {stats.partialPaymentCount}
              </span>
            </div>
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          {/* Remaining Amount */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-bold block">المبالغ المتبقية تحت التحصيل</span>
              <span className="text-base sm:text-lg font-black text-rose-400 font-mono mt-0.5 block">
                {stats.totalRemainingAmount > 0 ? stats.totalRemainingAmount.toLocaleString('en-US') : '0'} <span className="text-xs text-rose-300">ر.س</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                متبقي السداد الجزئي
              </span>
            </div>
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-900/95 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم طالب التنفيذ، المنفذ ضده، رقم الطلب، أو نوع السند..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            
            {/* Deed Type Filter */}
            <select
              value={selectedDeedType}
              onChange={(e) => setSelectedDeedType(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer"
            >
              <option value="all">كل أنواع السندات ({stats.total})</option>
              <option value="صك حكم">صك حكم ({stats.deedCounts['صك حكم'] || 0})</option>
              <option value="وثيقة صلح تراضي">وثيقة صلح تراضي ({stats.deedCounts['وثيقة صلح تراضي'] || 0})</option>
              <option value="سند لأمر">سند لأمر ({stats.deedCounts['سند لأمر'] || 0})</option>
              <option value="أخرى">أخرى ({stats.deedCounts['أخرى'] || 0})</option>
            </select>

            {/* Payment Filter */}
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer"
            >
              <option value="all">كل حالات السداد</option>
              <option value="سداد جزئي">سداد جزئي ({stats.partialPaymentCount})</option>
              <option value="سداد كلي">سداد كلي ({stats.fullPaymentCount})</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer"
            >
              <option value="all">كل الحالات</option>
              <option value="نشط">نشط (ساري) ({stats.activeCount})</option>
              <option value="منتهي">منتهي ({stats.completedCount})</option>
            </select>

          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {filteredEnforcementCases.length === 0 ? (
            <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
                <Stamp className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                  لا توجد طلبات تنفيذ مطابقة للبحث
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  يمكنك البدء بإضافة سند أو طلب تنفيذ جديد، وتوثيق أطراف التنفيذ ومبالغ المطالبات.
                </p>
              </div>
              <button
                onClick={onAddNewEnforcementCase}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>إضافة أول طلب تنفيذ</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredEnforcementCases.map((c) => {
                const enf = c.enforcement || {
                  isEnforcement: true,
                  applicantName: c.clientName,
                  respondentName: c.opponentName,
                  deedType: 'صك حكم',
                  paymentStatus: 'سداد جزئي',
                  enforcementStatus: 'نشط',
                };

                const isCompleted = enf.enforcementStatus === 'منتهي';
                const isFullPayment = enf.paymentStatus === 'سداد كلي';

                return (
                  <div
                    key={c.id}
                    className="bg-slate-950 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-4 sm:p-5 transition-all shadow-md flex flex-col justify-between space-y-4 group"
                  >
                    {/* Top Row: Deed Type & Status Badges */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Deed Badge */}
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border ${
                          enf.deedType === 'وثيقة صلح تراضي'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : enf.deedType === 'سند لأمر'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : enf.deedType === 'أخرى'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {enf.deedType === 'وثيقة صلح تراضي' ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : enf.deedType === 'سند لأمر' ? (
                            <Receipt className="w-3.5 h-3.5" />
                          ) : (
                            <Scale className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {enf.deedType === 'أخرى' && enf.customDeedType ? enf.customDeedType : (enf.deedType || 'صك حكم')}
                          </span>
                        </span>

                        {/* Status */}
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                          isCompleted
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}>
                          {isCompleted ? 'منتهي ومغلق' : '🟢 طلب نشط'}
                        </span>

                        {/* Payment */}
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                          isFullPayment
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}>
                          {isFullPayment ? 'سداد كلي' : 'سداد جزئي'}
                        </span>
                      </div>

                      {/* Number or NAJIZ code */}
                      {(enf.enforcementNumber || c.caseNumber) && (
                        <span className="font-mono text-xs text-amber-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {enf.enforcementNumber ? `طلب: ${enf.enforcementNumber}` : `قضية #${c.caseNumber}`}
                        </span>
                      )}
                    </div>

                    {/* Parties Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {/* Applicant */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mb-1">
                          <User className="w-3.5 h-3.5 text-amber-400" />
                          <span>طالب التنفيذ (الدائن):</span>
                        </span>
                        <span className="text-sm font-extrabold text-white block">
                          {enf.applicantName || c.clientName}
                        </span>
                      </div>

                      {/* Respondent */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mb-1">
                          <Users className="w-3.5 h-3.5 text-rose-400" />
                          <span>المنفذ ضده (المدين):</span>
                        </span>
                        <span className="text-sm font-extrabold text-white block">
                          {enf.respondentName || c.opponentName}
                        </span>
                      </div>
                    </div>

                    {/* Amount & Date / Court Info */}
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400 block font-semibold">المبلغ المطلوب سداده:</span>
                          <span className="text-base font-black text-amber-300 font-mono mt-0.5 block">
                            {enf.amount ? `${enf.amount} ر.س` : 'غير محدد'}
                          </span>
                        </div>

                        <div className="text-left">
                          <span className="text-[11px] text-slate-400 block font-semibold">المحكمة / الدائرة:</span>
                          <span className="text-xs text-slate-200 font-bold block mt-0.5">
                            {c.court} {c.circuit ? `• ${c.circuit}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* إذا كان سداد جزئي */}
                      {enf.paymentStatus === 'سداد جزئي' && (enf.paidAmount || enf.remainingAmount) && (
                        <div className="bg-slate-950/90 p-2.5 rounded-lg border border-amber-500/30 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Wallet className="w-3 h-3" />
                              <span>المسدد: {enf.paidAmount || '0'} ر.س</span>
                            </span>
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              <Coins className="w-3 h-3" />
                              <span>المتبقي: {enf.remainingAmount || '0'} ر.س</span>
                            </span>
                          </div>
                          {(() => {
                            const totalNum = parseFloat(String(enf.amount || '0').replace(/[^0-9.]/g, '')) || 0;
                            const paidNum = parseFloat(String(enf.paidAmount || '0').replace(/[^0-9.]/g, '')) || 0;
                            const pct = totalNum > 0 ? Math.min(100, Math.round((paidNum / totalNum) * 100)) : 0;
                            return (
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {enf.paymentStatus === 'سداد كلي' && (
                        <div className="bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center justify-between">
                          <span>✓ استيفاء كامل المبلغ المطلوب (100%)</span>
                          <span className="font-mono text-[10px] bg-emerald-900/60 px-1.5 py-0.5 rounded">مكتمل</span>
                        </div>
                      )}
                    </div>

                    {/* Notes if any */}
                    {enf.notes && (
                      <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed font-sans">
                        <strong className="text-amber-400 ml-1">ملاحظات وإجراءات:</strong>
                        {enf.notes}
                      </p>
                    )}

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>تاريخ قيد الطلب: {enf.requestDate ? formatArabicDate(enf.requestDate) : 'موثق بالنظام'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditCase(c)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition flex items-center gap-1 font-bold border border-slate-700 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>تعديل</span>
                        </button>

                        <button
                          onClick={() => onOpenCaseDetails(c)}
                          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl transition flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>فتح الملف الكامل</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <AppLogo size="xs" />
            <span>نظام إدارة ومتابعة طلبات وسندات التنفيذ القضائي • HK Law</span>
          </div>
          <p className="text-slate-500">
            صكوك الأحكام • وثائق صلح تراضي • السندات لأمر • استيفاء المبالغ والقرارات التنفيذية
          </p>
        </div>

      </div>
    </div>
  );
};
