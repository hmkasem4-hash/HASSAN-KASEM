import React from 'react';
import { 
  Building2, 
  Calendar, 
  Clock, 
  User, 
  Users, 
  UserCheck, 
  FileText, 
  AlertCircle, 
  ArrowRightLeft, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Phone, 
  Send, 
  Copy, 
  Check, 
  Scale, 
  MoreVertical, 
  ExternalLink, 
  Tag,
  Stamp,
  Receipt
} from 'lucide-react';
import { CourtCase } from '../types';
import { 
  formatArabicDate, 
  formatArabicTime, 
  formatHijriDate,
  getCountdownBadge, 
  isWithin24Hours,
  getDeed30DayAppealInfo
} from '../utils/dateUtils';

interface CaseCardProps {
  caseItem: CourtCase;
  onOpenDetails: (c: CourtCase) => void;
  onEdit: (c: CourtCase) => void;
  onDelete: (id: string) => void;
  onPostpone: (c: CourtCase) => void;
  onToggleChecklist: (caseId: string, itemId: string) => void;
}

export const CaseCard: React.FC<CaseCardProps> = ({
  caseItem,
  onOpenDetails,
  onEdit,
  onDelete,
  onPostpone,
  onToggleChecklist,
}) => {
  const [copied, setCopied] = React.useState(false);
  const countdown = getCountdownBadge(caseItem.sessionDate, caseItem.sessionTime);
  const urgent24h = isWithin24Hours(caseItem);

  const handleCopyCaseNumber = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `دعوى رقم ${caseItem.caseNumber} لسنة ${caseItem.caseYear} - ${caseItem.court} (${caseItem.circuit})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!caseItem.clientPhone) return;
    const cleanPhone = caseItem.clientPhone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `السلام عليكم أستاذ/ة ${caseItem.clientName}،\nنود تذكيركم بموعد جلسة قضيتكم رقم (${caseItem.caseNumber} لسنة ${caseItem.caseYear})\nالمحكمة: ${caseItem.court} - ${caseItem.circuit}\nتاريخ الجلسة: ${formatArabicDate(caseItem.sessionDate)} الساعة ${formatArabicTime(caseItem.sessionTime)}\nالمطلوب: ${caseItem.demands || 'الحضور لمقر المحكمة'}\nشاكرين تعاونكم.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // Determine court color theme
  const getCourtBadgeColor = (court: string) => {
    if (court.includes('عامة')) return 'bg-teal-100 text-teal-900 border-teal-300';
    if (court.includes('نقض')) return 'bg-purple-100 text-purple-900 border-purple-300';
    if (court.includes('استئناف')) return 'bg-indigo-100 text-indigo-900 border-indigo-300';
    if (court.includes('اقتصادية')) return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    if (court.includes('أسرة')) return 'bg-pink-100 text-pink-900 border-pink-300';
    if (court.includes('مجلس الدولة') || court.includes('إداري')) return 'bg-amber-100 text-amber-900 border-amber-300';
    if (court.includes('جنايات') || court.includes('جنح')) return 'bg-rose-100 text-rose-900 border-rose-300';
    if (court.includes('عمالية')) return 'bg-cyan-100 text-cyan-900 border-cyan-300';
    return 'bg-slate-100 text-slate-900 border-slate-300';
  };

  const totalChecklist = caseItem.checklist.length;
  const completedChecklist = caseItem.checklist.filter((i) => i.completed).length;

  return (
    <article 
      className={`relative bg-white rounded-2xl border transition-all duration-200 hover:shadow-xl flex flex-col justify-between overflow-hidden group ${
        urgent24h
          ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-md shadow-amber-100'
          : 'border-slate-200 shadow-sm'
      }`}
    >
      {/* Top Urgent Strip if < 24 Hours */}
      {urgent24h && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 px-4 py-1 text-xs font-black flex items-center justify-between">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
            تنبيه 24 ساعة: اقترب موعد الجلسة!
          </span>
          <span>{formatArabicTime(caseItem.sessionTime)}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 sm:p-5">
        
        {/* Header: Court + Case Number + Countdown */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getCourtBadgeColor(caseItem.court)}`}>
              <Building2 className="w-3.5 h-3.5 inline ml-1" />
              {caseItem.court}
            </span>
            
            <button
              onClick={handleCopyCaseNumber}
              title="نسخ رقم وبيانات الدعوى"
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition cursor-pointer border border-slate-200"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-500" />
                  <span>رقم {caseItem.caseNumber} / {caseItem.caseYear}</span>
                </>
              )}
            </button>
          </div>

          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border whitespace-nowrap ${countdown.colorClass}`}>
            <Clock className="w-3 h-3 inline ml-1" />
            {countdown.text}
          </span>
        </div>

        {/* Case Title */}
        <h3 
          onClick={() => onOpenDetails(caseItem)}
          className="text-base font-extrabold text-slate-900 hover:text-amber-700 transition cursor-pointer line-clamp-2 mb-3 leading-snug"
        >
          {caseItem.title}
        </h3>

        {/* Circuit & Stage Tag & Deed Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="px-2 py-0.5 bg-slate-50 text-slate-700 rounded-md text-xs font-medium border border-slate-200/80">
            🏛️ {caseItem.circuit}
          </span>
          
          {(() => {
            const deedInfo = getDeed30DayAppealInfo(caseItem);
            if (deedInfo.hasDeedOrVerdict) {
              if (deedInfo.isWithin30Days) {
                return (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-950 rounded-md text-xs font-extrabold border border-amber-300 flex items-center gap-1">
                    <Scale className="w-3 h-3 text-amber-700" />
                    <span>نشطة (مهلة الاستئناف: {deedInfo.remainingDays} يوم)</span>
                  </span>
                );
              } else {
                return (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-bold border border-slate-300">
                    ⚖️ قضية منتهية (انقضاء مهلة الصك)
                  </span>
                );
              }
            }

            if (caseItem.status === 'judged' || caseItem.isClosed) {
              return (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-bold border border-slate-300">
                  ⚖️ قضية منتهية
                </span>
              );
            }

            return (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-900 rounded-md text-xs font-semibold border border-amber-200/80">
                ⚖️ {caseItem.sessionStage}
              </span>
            );
          })()}

          {/* Enforcement Badge */}
          {caseItem.enforcement && (caseItem.enforcement.isEnforcement || caseItem.court === 'محكمة التنفيذ') && (
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-900 rounded-md text-xs font-bold border border-amber-300 flex items-center gap-1">
              <Stamp className="w-3 h-3 text-amber-600" />
              <span>تنفيذ: {caseItem.enforcement.deedType || 'سند تنفيذي'}</span>
              {caseItem.enforcement.amount && (
                <span className="text-[11px] font-mono text-emerald-700">({caseItem.enforcement.amount} ر.س)</span>
              )}
            </span>
          )}

          {/* Deed Attachment Indicators */}
          {caseItem.primaryJudgmentDeedFile && (
            <span className="px-1.5 py-0.5 bg-sky-50 text-sky-800 rounded text-[11px] font-bold border border-sky-200 flex items-center gap-0.5" title="مرفق صك الحكم الابتدائي">
              <FileText className="w-3 h-3 text-sky-600" />
              <span>صك ابتدائي</span>
            </span>
          )}
          {caseItem.appealJudgmentDeedFile && (
            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-800 rounded text-[11px] font-bold border border-indigo-200 flex items-center gap-0.5" title="مرفق صك حكم الاستئناف">
              <FileText className="w-3 h-3 text-indigo-600" />
              <span>صك استئناف</span>
            </span>
          )}
        </div>

        {/* Parties Box (Client vs Opponent) */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 mb-3 space-y-2 text-xs">
          
          {/* Client */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] shrink-0">
                {caseItem.clientRole}
              </span>
              <span className="font-bold text-slate-800 truncate" title={caseItem.clientName}>
                {caseItem.clientName}
              </span>
            </div>
            
            {caseItem.clientPhone && (
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={`tel:${caseItem.clientPhone}`}
                  title="اتصال بالموكل"
                  className="p-1 hover:bg-slate-200 text-slate-600 rounded transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={handleSendWhatsApp}
                  title="تذكير الموكل عبر واتساب"
                  className="p-1 hover:bg-emerald-100 text-emerald-600 rounded transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Opponent */}
          <div className="flex items-center gap-1.5 text-slate-600 pt-1.5 border-t border-slate-200/60">
            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px] shrink-0">
              الخصم
            </span>
            <span className="font-medium text-slate-700 truncate" title={caseItem.opponentName}>
              {caseItem.opponentName}
            </span>
            {caseItem.opponentLawyer && (
              <span className="text-[11px] text-slate-400 truncate">
                (دفاع: {caseItem.opponentLawyer})
              </span>
            )}
          </div>

          {/* Assigned Lawyer */}
          {caseItem.assignedLawyer && (
            <div className="flex items-center gap-1.5 text-slate-700 pt-1.5 border-t border-slate-200/60 text-xs">
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-950 rounded font-bold text-[10px] shrink-0 flex items-center gap-1 border border-amber-300/60">
                <UserCheck className="w-3 h-3 text-amber-700" />
                <span>المحامي الحاضر عن الموكل</span>
              </span>
              <span className="font-bold text-slate-900 truncate">
                {caseItem.assignedLawyer}
              </span>
            </div>
          )}

        </div>

        {/* Date & Time Big Card */}
        {caseItem.sessionDate ? (
          <div className="flex items-center justify-between bg-slate-900 text-slate-100 rounded-xl px-3 py-2 text-xs mb-3 shadow-inner">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="block font-bold text-white text-[13px] leading-tight">
                  {formatArabicDate(caseItem.sessionDate)}
                </span>
                <span className="text-[11px] text-amber-300/90 font-medium">
                  {formatHijriDate(caseItem.sessionDate)} (أم القرى)
                </span>
              </div>
            </div>
            <div className="text-left font-mono font-bold text-amber-400 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
              {formatArabicTime(caseItem.sessionTime)}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-slate-100 text-slate-800 rounded-xl px-3 py-2 text-xs mb-3 border border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <span className="block font-bold text-slate-800 text-xs leading-tight">
                  {caseItem.verdictDate ? `تاريخ الحكم: ${formatArabicDate(caseItem.verdictDate)}` : 'لا توجد جلسات محددة'}
                </span>
                {caseItem.verdictDate && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    ({formatHijriDate(caseItem.verdictDate)})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Next Demands or Previous Decision */}
        {caseItem.demands && (
          <div className="text-xs text-slate-700 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 mb-3">
            <span className="font-bold text-amber-900 block text-[11px] mb-0.5">
              📌 المطلوب في الجلسة:
            </span>
            <p className="text-slate-800 line-clamp-2 leading-relaxed">
              {caseItem.demands}
            </p>
          </div>
        )}

        {/* Checklist Progress */}
        {totalChecklist > 0 && (
          <div className="space-y-1.5 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600 font-bold">
                مهام التجهيز ({completedChecklist}/{totalChecklist})
              </span>
              <span className="text-slate-500 font-semibold">
                {Math.round((completedChecklist / totalChecklist) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-amber-600 h-full rounded-full transition-all"
                style={{ width: `${(completedChecklist / totalChecklist) * 100}%` }}
              ></div>
            </div>
            
            <div className="space-y-1 pt-1">
              {caseItem.checklist.slice(0, 2).map((item) => (
                <button
                  key={item.id}
                  onClick={() => onToggleChecklist(caseItem.id, item.id)}
                  className="w-full flex items-center gap-1.5 text-right text-[11px] text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className={`truncate ${item.completed ? 'line-through text-slate-400' : ''}`}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Card Footer Actions */}
      <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {/* Postpone / Log Decision */}
          <button
            onClick={() => onPostpone(caseItem)}
            title="تأجيل الجلسة وتدوين القرار الجديد"
            className="px-2.5 py-1.5 bg-white hover:bg-sky-50 text-sky-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>تأجيل / قرار</span>
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(caseItem)}
            title="تعديل بيانات القضية"
            className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(caseItem.id)}
            title="حذف القضية"
            className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* View Full Details Button */}
        <button
          onClick={() => onOpenDetails(caseItem)}
          className="px-3 py-1.5 bg-slate-900 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
        >
          <span>التفاصيل</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

    </article>
  );
};
