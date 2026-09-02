import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Building2, 
  Calendar, 
  Download, 
  Scale, 
  FileText,
  FileSpreadsheet,
  UserCheck,
  User,
  Sparkles,
  Check,
  Copy,
  FileType,
  Gavel
} from 'lucide-react';
import { CourtCase } from '../types';
import { 
  formatArabicDate, 
  formatArabicTime, 
  formatHijriDate, 
  getTodayString, 
  addDaysToDate,
  compareCasesByNearest 
} from '../utils/dateUtils';
import { AppLogo } from './AppLogo';

interface CourtRollPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CourtCase[];
  allCourts: string[];
}

export const CourtRollPrintModal: React.FC<CourtRollPrintModalProps> = ({
  isOpen,
  onClose,
  cases,
  allCourts,
}) => {
  const today = getTodayString();
  const tomorrow = addDaysToDate(today, 1);

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedCourt, setSelectedCourt] = useState('all');
  const [selectedLawyer, setSelectedLawyer] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'judged'>('all');
  const [lawyerName, setLawyerName] = useState('مكتب الأستاذ / المحامي');
  const [showDecisionColumn, setShowDecisionColumn] = useState(true);
  const [showDemands, setShowDemands] = useState(true);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Extract unique assigned lawyers
  const allLawyers = useMemo(() => {
    const set = new Set<string>();
    cases.forEach((c) => {
      if (c.assignedLawyer && c.assignedLawyer.trim()) {
        set.add(c.assignedLawyer.trim());
      }
    });
    return Array.from(set);
  }, [cases]);

  // Filter and sort cases for the roll (sorted chronologically by session time)
  const filteredCases = useMemo(() => {
    return cases
      .filter((c) => {
        const matchDate = selectedDate ? c.sessionDate === selectedDate : true;
        const matchCourt = selectedCourt === 'all' ? true : c.court === selectedCourt;
        const matchLawyer = selectedLawyer === 'all' ? true : (c.assignedLawyer === selectedLawyer);
        const isJudged = c.status === 'judged' || c.sessionStage === 'نطق بالحكم' || Boolean(c.isClosed) || Boolean(c.verdictText);
        const matchStatus = 
          selectedStatus === 'all' 
            ? true 
            : selectedStatus === 'active' 
            ? !isJudged 
            : isJudged;

        return matchDate && matchCourt && matchLawyer && matchStatus;
      })
      .sort(compareCasesByNearest);
  }, [cases, selectedDate, selectedCourt, selectedLawyer, selectedStatus]);

  if (!isOpen) return null;

  // Print Dialog (Browser native Print / Save as PDF)
  const handlePrint = () => {
    window.print();
  };

  // Export to Microsoft Word (.doc)
  const handleExportWord = () => {
    const gregorianStr = selectedDate ? formatArabicDate(selectedDate) : 'كافة المواعيد والجلسات';
    const hijriStr = selectedDate ? formatHijriDate(selectedDate, { includeWeekday: true }) : '';

    const tableRows = filteredCases.map((c, index) => {
      const isJudged = c.status === 'judged' || Boolean(c.isClosed) || Boolean(c.verdictText);
      const verdictHtml = c.verdictText 
        ? `<div style="font-size: 8.5pt; color: #065f46; background-color: #ecfdf5; padding: 4px; border: 1px solid #a7f3d0; margin-top: 3px; border-radius: 4px;"><strong>منطوق الحكم:</strong> ${c.verdictText}</div>` 
        : '';
      
      return `
        <tr style="border-bottom: 1px solid #777;">
          <td style="border: 1px solid #333; padding: 6px 4px; text-align: center; font-weight: bold;">${index + 1}</td>
          <td style="border: 1px solid #333; padding: 6px 4px; text-align: center; font-weight: bold; font-family: monospace;">
            <div style="font-size: 11pt; color: #111;">${c.caseNumber}</div>
            <div style="font-size: 9pt; color: #555;">لسنة ${c.caseYear}</div>
            ${isJudged ? '<span style="font-size: 8pt; color: #047857; font-weight: bold;">[محكوم فيها]</span>' : ''}
          </td>
          <td style="border: 1px solid #333; padding: 6px 4px; text-align: center; background-color: #fef3c7; font-weight: bold;">
            <div style="font-size: 10pt; color: #78350f;">${formatArabicTime(c.sessionTime)}</div>
            <div style="font-size: 8.5pt; color: #92400e; font-family: monospace;">(${c.sessionTime})</div>
          </td>
          <td style="border: 1px solid #333; padding: 6px 4px;">
            <strong style="font-size: 10pt; color: #000;">${c.court}</strong>
          </td>
          <td style="border: 1px solid #333; padding: 6px 4px;">
            <div style="font-size: 9pt; color: #000; font-weight: bold;">${c.circuit}</div>
            ${c.judge ? `<div style="font-size: 8pt; color: #666;">رئيس الدائرة: ${c.judge}</div>` : ''}
          </td>
          <td style="border: 1px solid #333; padding: 6px 4px;">
            <strong style="font-size: 10pt; color: #000;">${c.clientName}</strong>
          </td>
          <td style="border: 1px solid #333; padding: 6px 4px; text-align: center;">
            <span style="font-size: 8.5pt; font-weight: bold; background-color: ${c.clientRole === 'مدعي' || c.clientRole === 'طاعن' || c.clientRole === 'مستأنف' ? '#dcfce7' : '#fee2e2'}; color: ${c.clientRole === 'مدعي' || c.clientRole === 'طاعن' || c.clientRole === 'مستأنف' ? '#166534' : '#991b1b'}; border: 1px solid #999; padding: 2px 6px; border-radius: 4px;">${c.clientRole}</span>
          </td>
          <td style="border: 1px solid #333; padding: 6px 4px; background-color: #fffdf5;">
            <strong style="font-size: 9.5pt; color: #1e293b;">${c.assignedLawyer || lawyerName}</strong>
          </td>
          <td style="border: 1px solid #333; padding: 6px 4px;">
            <strong style="font-size: 9.5pt; color: #000;">${c.opponentName}</strong>
          </td>
          <td style="border: 1px solid #333; padding: 6px 4px;">
            <strong style="font-size: 9.5pt; color: #000;">${c.sessionStage}</strong>
            ${showDemands && c.demands ? `<div style="font-size: 8.5pt; color: #333; margin-top: 3px;"><strong>المطلوب:</strong> ${c.demands}</div>` : ''}
            ${verdictHtml}
          </td>
          ${showDecisionColumn ? `
            <td style="border: 1px solid #333; padding: 6px 4px; width: 130px; background-color: #fafafa;">
              <!-- مساحة تدوين قرار المحكمة يدوياً -->
            </td>
          ` : ''}
        </tr>
      `;
    }).join('');

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir='rtl'>
      <head>
        <meta charset='utf-8'>
        <title>رول جلسات المحكمة - ${selectedDate || 'شامل'}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: A4 landscape;
            margin: 1.2cm 0.8cm 1.2cm 0.8cm;
            mso-page-orientation: landscape;
          }
          body {
            font-family: 'Traditional Arabic', 'Arial', 'Tahoma', sans-serif;
            direction: rtl;
            text-align: right;
            color: #000;
            margin: 0;
            padding: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #f1f5f9;
            border: 1.5px solid #000;
            padding: 6px 4px;
            font-size: 10pt;
            font-weight: bold;
            text-align: center;
          }
          td {
            font-size: 9.5pt;
            vertical-align: top;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            border-bottom: 2px solid #000;
          }
          .header-table td {
            border: none;
            padding: 4px;
          }
          .title {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            margin: 6px 0 2px 0;
          }
          .subtitle {
            text-align: center;
            font-size: 11pt;
            color: #222;
            margin-bottom: 8px;
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 35%; text-align: right;">
              <div style="font-size: 13pt; font-weight: bold;">${lawyerName}</div>
              <div style="font-size: 9pt; color: #475569;">للمحاماة والاستشارات القانونية</div>
              ${selectedLawyer !== 'all' ? `<div style="font-size: 9.5pt; color: #b45309; font-weight: bold; margin-top: 2px;">رول المحامي الحاضر: ${selectedLawyer}</div>` : ''}
            </td>
            <td style="width: 30%; text-align: center;">
              <div style="font-size: 22pt;">⚖️</div>
              <div style="font-size: 10pt; font-weight: bold; color: #1e293b;">رول الجلسات القضائية</div>
            </td>
            <td style="width: 35%; text-align: left; direction: ltr;">
              <div style="font-size: 9.5pt;"><strong>تاريخ الرول (ميلادي):</strong> ${selectedDate || 'شامل'}</div>
              ${hijriStr ? `<div style="font-size: 9pt; color: #475569;"><strong>الموافق (أم القرى):</strong> ${hijriStr}</div>` : ''}
              <div style="font-size: 9pt; color: #334155;"><strong>عدد القضايا:</strong> ${filteredCases.length} قضية</div>
            </td>
          </tr>
        </table>

        <div class="title">رول جلسات يوم ${gregorianStr}</div>
        <div class="subtitle">
          ${hijriStr ? `الموافق: ${hijriStr} (تقويم أم القرى) • ` : ''}
          ${selectedCourt === 'all' ? 'كافة المحاكم' : `محكمة: ${selectedCourt}`} • 
          ${selectedLawyer === 'all' ? 'كافة المحامين' : `المحامي: ${selectedLawyer}`}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px;">م</th>
              <th style="width: 90px;">رقم الدعوى والسنة</th>
              <th style="width: 80px; background-color: #fef3c7;">ساعة الجلسة</th>
              <th style="width: 110px;">المحكمة</th>
              <th style="width: 90px;">الدائرة</th>
              <th style="width: 110px;">الموكل / الشركة</th>
              <th style="width: 75px; text-align: center;">الصفة</th>
              <th style="width: 105px; background-color: #fffbeb;">المحامي الحاضر</th>
              <th style="width: 110px;">الخصم</th>
              <th>نوع الجلسة والمطلوب</th>
              ${showDecisionColumn ? '<th style="width: 130px;">القرار الصادر بالجلسة</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div style="margin-top: 25px; border-top: 1px solid #94a3b8; padding-top: 8px; font-size: 8.5pt; color: #64748b; display: flex; justify-content: space-between;">
          <span>تم استخراج الرول عبر نظام إدارة الجلسات ومواعيد القضايا الذكي</span>
          <span>المكتب: ${lawyerName}</span>
          <span>صفحة 1 من 1</span>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + wordHtml], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `رول_جلسات_${selectedDate || 'شامل'}_${selectedLawyer !== 'all' ? selectedLawyer : 'المكتب'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to Excel (CSV with UTF-8 BOM)
  const handleExportCSV = () => {
    const headers = [
      'م',
      'رقم القضية',
      'السنة',
      'ساعة وموعد الجلسة',
      'المحكمة',
      'الدائرة',
      'القاضي',
      'الموكل',
      'الصفة',
      'المحامي الحاضر عن الموكل',
      'الخصم',
      'نوع ومرحلة الجلسة',
      'المطلوب بالجلسة',
      'منطوق الحكم (إن وجد)',
      'القرار الصادر'
    ];

    const rows = filteredCases.map((c, index) => [
      index + 1,
      c.caseNumber,
      c.caseYear,
      `"${formatArabicTime(c.sessionTime)} (${c.sessionTime})"`,
      `"${c.court}"`,
      `"${c.circuit}"`,
      `"${c.judge || ''}"`,
      `"${c.clientName}"`,
      `"${c.clientRole}"`,
      `"${c.assignedLawyer || lawyerName}"`,
      `"${c.opponentName}"`,
      `"${c.sessionStage}"`,
      `"${(c.demands || '').replace(/"/g, '""')}"`,
      `"${(c.verdictText || '').replace(/"/g, '""')}"`,
      `"${(c.previousDecision || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `رول_جلسات_${selectedDate || 'شامل'}_${selectedLawyer !== 'all' ? selectedLawyer : 'شامل'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy Summary text to Clipboard
  const handleCopySummary = () => {
    const gregorianStr = selectedDate ? formatArabicDate(selectedDate) : 'كافة المواعيد';
    const lines = [
      `📋 رول جلسات يوم: ${gregorianStr} (${selectedDate})`,
      `🏛️ المحكمة: ${selectedCourt === 'all' ? 'كافة المحاكم' : selectedCourt}`,
      `👤 المحامي الحاضر: ${selectedLawyer === 'all' ? 'كافة المحامين' : selectedLawyer}`,
      `📊 إجمالي القضايا: ${filteredCases.length}`,
      '----------------------------------------',
      ...filteredCases.map((c, i) => 
        `${i + 1}. دعوى رقم ${c.caseNumber}/${c.caseYear} - ${c.court} (${c.circuit})\n   • الساعة: ${formatArabicTime(c.sessionTime)}\n   • الموكل: ${c.clientName} (${c.clientRole}) | الحاضر: ${c.assignedLawyer || lawyerName}\n   • الخصم: ${c.opponentName}\n   • المطلوب: ${c.demands || c.sessionStage}`
      )
    ];

    navigator.clipboard.writeText(lines.join('\n\n'));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-6xl w-full max-h-[96vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Action Bar (No Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-800 no-print">
          <div className="flex items-center gap-3">
            <AppLogo size="sm" withGlow />
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span>رول الجلسات وقضايا المحاكم</span>
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold">
                  طباعة وتصدير جاهز
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                استخراج جدول رول الجلسات الرسمي اليومي للطباعة الورقية أو التصدير بصيغة PDF و Word و Excel
              </p>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Word Export Button */}
            <button
              onClick={handleExportWord}
              title="تنزيل نسخة منسقة لبرنامج Microsoft Word (.doc)"
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
            >
              <FileType className="w-4 h-4 text-blue-200" />
              <span>تصدير Word (.doc)</span>
            </button>

            {/* Excel CSV Export Button */}
            <button
              onClick={handleExportCSV}
              title="تصدير جدول بيانات Excel (CSV)"
              className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Excel (CSV)</span>
            </button>

            {/* Copy Summary Text */}
            <button
              onClick={handleCopySummary}
              title="نسخ ملخص الرول كنص لمشاركته عبر واتساب أو البريد"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              {copiedNotification ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
              <span>{copiedNotification ? 'تم النسخ!' : 'نسخ النص'}</span>
            </button>

            {/* Primary Print / PDF Button */}
            <button
              onClick={handlePrint}
              title="طباعة الرول فوراً أو حفظه كملف PDF عبر الطابعة الافتراضية"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg ring-2 ring-amber-400/40"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الرول / حفظ PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Row (No Print) */}
        <div className="bg-slate-100/90 p-4 border-b border-slate-200 space-y-3 shrink-0 no-print text-xs">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Quick Date Selectors */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-slate-700 flex items-center gap-1 ml-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>الموعد:</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                  selectedDate === today
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                اليوم
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(tomorrow)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                  selectedDate === tomorrow
                    ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                غداً
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                  selectedDate === ''
                    ? 'bg-slate-900 text-white border-slate-950 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                كافة الجلسات
              </button>

              {/* Custom Date Picker */}
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-2 py-1">
                <span className="text-[11px] text-slate-500 font-bold">تحديد:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">الحالة:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-semibold text-slate-800 cursor-pointer shadow-2xs"
              >
                <option value="all">كافة الحالات ({cases.length})</option>
                <option value="active">الجلسات المتداولة (النشطة فقط)</option>
                <option value="judged">المنتهية والمحكوم فيها فقط</option>
              </select>
            </div>

          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200">
            
            {/* Court Filter */}
            <div className="flex items-center gap-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                <span>المحكمة:</span>
              </label>
              <select
                value={selectedCourt}
                onChange={(e) => setSelectedCourt(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-medium text-slate-800 cursor-pointer shadow-2xs"
              >
                <option value="all">كافة المحاكم ({cases.length})</option>
                {allCourts.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Lawyer Filter */}
            <div className="flex items-center gap-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>المحامي الحاضر:</span>
              </label>
              <select
                value={selectedLawyer}
                onChange={(e) => setSelectedLawyer(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-medium text-slate-800 cursor-pointer shadow-2xs"
              >
                <option value="all">كافة المحامين ({allLawyers.length || 'الكل'})</option>
                {allLawyers.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Firm Header */}
            <div className="flex items-center gap-1.5 flex-1 min-w-[220px] max-w-xs">
              <label className="font-bold text-slate-700 shrink-0">اسم المكتب:</label>
              <input
                type="text"
                value={lawyerName}
                onChange={(e) => setLawyerName(e.target.value)}
                placeholder="اسم المحامي أو المكتب بالترويسة..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-semibold text-slate-800 shadow-2xs"
              >
              </input>
            </div>

            {/* Table Display Options */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={showDecisionColumn}
                  onChange={(e) => setShowDecisionColumn(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>خانة القرار اليدوي</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={showDemands}
                  onChange={(e) => setShowDemands(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>تفاصيل المطلوب</span>
              </label>
            </div>

            <div className="font-bold text-slate-600">
              القضايا المعروضة: <strong className="text-amber-700 font-mono text-sm">{filteredCases.length}</strong>
            </div>

          </div>

        </div>

        {/* Printable Official Judicial Sheet */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-900 font-sans print:p-0">
          
          {/* Printable Official Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5 print-break-inside-avoid">
            <div className="flex items-center justify-between mb-2">
              <div className="text-right">
                <span className="font-extrabold text-base block text-slate-950">{lawyerName}</span>
                <span className="text-xs text-slate-600 block">للمحاماة والاستشارات القانونية وأعمال القضاء</span>
                {selectedLawyer !== 'all' && (
                  <span className="text-xs text-amber-900 font-bold block mt-1 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 inline-block">
                    رول المحامي الحاضر بالجلسة: {selectedLawyer}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col items-center justify-center">
                <AppLogo size="lg" showRing={true} className="mb-1 print:w-14 print:h-14" />
                <span className="text-[11px] font-black text-slate-900">رول الجلسات القضائية</span>
              </div>

              <div className="text-left text-xs text-slate-800 space-y-0.5">
                <div>تاريخ الرول (ميلادي): <strong className="font-mono font-bold text-slate-950">{selectedDate || 'كافة المواعيد'}</strong></div>
                {selectedDate && (
                  <div className="text-[11px] text-emerald-800 font-bold">الموافق (أم القرى): {formatHijriDate(selectedDate)}</div>
                )}
                <div className="text-[11px] text-slate-600">إجمالي الرول: <strong className="font-mono">{filteredCases.length}</strong> قضية</div>
              </div>
            </div>

            <div className="text-center pt-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                رول جلسات يوم {selectedDate ? formatArabicDate(selectedDate) : 'كافة المواعيد المجدولة'}
              </h1>
              {selectedDate && (
                <div className="text-xs font-bold text-emerald-900 mt-0.5">
                  الموافق: {formatHijriDate(selectedDate, { includeWeekday: true })} (تقويم أم القرى المعتمد)
                </div>
              )}
              <div className="flex items-center justify-center gap-3 text-xs font-bold text-slate-600 mt-1 flex-wrap">
                <span>{selectedCourt === 'all' ? 'كافة المحاكم والدوائر' : `محكمة: ${selectedCourt}`}</span>
                <span>•</span>
                <span>{selectedLawyer === 'all' ? 'جميع محامي المكتب' : `المحامي: ${selectedLawyer}`}</span>
                <span>•</span>
                <span>{selectedStatus === 'all' ? 'جميع القضايا' : selectedStatus === 'active' ? 'القضايا المتداولة' : 'المحكوم فيها'}</span>
              </div>
            </div>
          </div>

          {/* Printable Table */}
          {filteredCases.length === 0 ? (
            <div className="p-12 text-center text-slate-500 border-2 border-dashed border-slate-300 rounded-2xl my-6">
              <Scale className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-base text-slate-700">لا توجد جلسات مسجلة في هذا التاريخ المحدد ({selectedDate || 'المحدد'})</p>
              <p className="text-xs text-slate-500 mt-1">
                {selectedLawyer !== 'all' ? `للمحامي الحاضر: ${selectedLawyer}` : 'يمكنك تعديل خيارات التصفية أو اختيار موعد آخر.'}
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse border-2 border-slate-900 text-xs text-right">
              <thead>
                <tr className="bg-slate-100 text-slate-950 font-black border-b-2 border-slate-900">
                  <th className="border border-slate-800 p-2 w-8 text-center">م</th>
                  <th className="border border-slate-800 p-2 w-28 text-center">رقم الدعوى والسنة</th>
                  <th className="border border-slate-800 p-2 w-24 text-center bg-amber-100/70 text-amber-950 font-black">
                    ساعة الجلسة
                  </th>
                  <th className="border border-slate-800 p-2 w-28">المحكمة</th>
                  <th className="border border-slate-800 p-2 w-24">الدائرة</th>
                  <th className="border border-slate-800 p-2 w-32">الموكل / الشركة</th>
                  <th className="border border-slate-800 p-2 w-20 text-center bg-slate-200">صفة الشركة</th>
                  <th className="border border-slate-800 p-2 w-32 bg-amber-50 text-amber-950">المحامي الحاضر عن الموكل</th>
                  <th className="border border-slate-800 p-2 w-28">الخصم</th>
                  <th className="border border-slate-800 p-2">نوع الجلسة والمطلوب</th>
                  {showDecisionColumn && (
                    <th className="border border-slate-800 p-2 w-40 text-center bg-slate-50">
                      القرار الصادر بالجلسة (يدوياً)
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c, index) => {
                  const isJudged = c.status === 'judged' || Boolean(c.isClosed) || Boolean(c.verdictText);

                  return (
                    <tr key={c.id} className="border-b border-slate-400 print-break-inside-avoid hover:bg-slate-50/50">
                      {/* Index */}
                      <td className="border border-slate-400 p-2 text-center font-bold font-mono">
                        {index + 1}
                      </td>

                      {/* Case Number & Year */}
                      <td className="border border-slate-400 p-2 text-center font-mono font-bold">
                        <div className="text-slate-950 text-sm font-extrabold">{c.caseNumber}</div>
                        <div className="text-[10px] text-slate-600">لسنة {c.caseYear}</div>
                        {isJudged && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[9px] font-bold">
                            محكوم فيها
                          </span>
                        )}
                      </td>

                      {/* Session Time Column */}
                      <td className="border border-slate-400 p-2 text-center bg-amber-50/50">
                        <div className="font-extrabold text-slate-900 text-xs font-sans">
                          {formatArabicTime(c.sessionTime)}
                        </div>
                        <div className="text-[10px] text-amber-800 font-mono font-bold mt-0.5">
                          {c.sessionTime}
                        </div>
                      </td>

                      {/* Court */}
                      <td className="border border-slate-400 p-2">
                        <strong className="block text-slate-950 text-xs">{c.court}</strong>
                      </td>

                      {/* Circuit (Separate Column) */}
                      <td className="border border-slate-400 p-2">
                        <span className="text-slate-900 font-bold text-xs block">{c.circuit}</span>
                        {c.judge && <span className="text-slate-500 text-[10px] block">رئيس الدائرة: {c.judge}</span>}
                      </td>

                      {/* Client Name */}
                      <td className="border border-slate-400 p-2">
                        <strong className="text-slate-950 block text-xs">{c.clientName}</strong>
                      </td>

                      {/* Client Role (Separate Column) */}
                      <td className="border border-slate-400 p-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border ${
                          c.clientRole === 'مدعي' || c.clientRole === 'طاعن' || c.clientRole === 'مستأنف'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}>
                          {c.clientRole}
                        </span>
                      </td>

                      {/* Assigned Lawyer */}
                      <td className="border border-slate-400 p-2 bg-amber-50/40">
                        <strong className="text-slate-950 font-bold block text-xs">
                          {c.assignedLawyer || lawyerName}
                        </strong>
                      </td>

                      {/* Opponent (Only without lawyer) */}
                      <td className="border border-slate-400 p-2">
                        <span className="text-slate-950 block font-bold text-xs">{c.opponentName}</span>
                      </td>

                      {/* Stage & Demands & Verdict */}
                      <td className="border border-slate-400 p-2 leading-relaxed">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-slate-950 text-xs">{c.sessionStage}</span>
                          {c.priority === 'urgent' && (
                            <span className="px-1 py-0.2 bg-rose-100 text-rose-800 text-[9px] font-bold rounded">
                              عاجلة
                            </span>
                          )}
                        </div>

                        {showDemands && c.demands && (
                          <p className="text-slate-800 text-[11px] mt-1 bg-amber-50/60 p-1 rounded border border-amber-100">
                            <strong>المطلوب:</strong> {c.demands}
                          </p>
                        )}

                        {c.verdictText && (
                          <div className="mt-1 bg-emerald-50 text-emerald-950 p-1 rounded border border-emerald-200 text-[10px]">
                            <strong>منطوق الحكم:</strong> {c.verdictText}
                          </div>
                        )}
                      </td>

                      {/* Empty Handwriting Decision Box */}
                      {showDecisionColumn && (
                        <td className="border border-slate-400 p-2 bg-slate-50/40 min-h-[50px] align-top">
                          {/* Blank space specifically designed for the lawyer to handwrite the court decision during session */}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Printable Official Footer */}
          <div className="mt-8 pt-4 border-t-2 border-slate-900 text-slate-700 text-xs flex items-center justify-between print-break-inside-avoid">
            <div className="space-y-0.5">
              <span className="font-bold block">نظام إدارة ومتابعة جلسات المحاكم ورول القضايا</span>
              <span className="text-[10px] text-slate-500">تم استخراج هذا الرول رسمياً بتاريخ: {formatArabicDate(today)}</span>
            </div>

            <div className="text-center font-bold">
              <span>المكتب: {lawyerName}</span>
            </div>

            <div className="text-left font-bold font-mono text-[11px]">
              <span>توقيع المحامي الحاضر: ........................</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
