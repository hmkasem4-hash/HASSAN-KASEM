import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Scale, 
  Gavel, 
  Building2, 
  Calendar, 
  UserCheck, 
  Search, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  ArrowRightLeft,
  FileType,
  FileSpreadsheet,
  SlidersHorizontal,
  Eye,
  EyeOff,
  RotateCcw,
  CheckSquare,
  Square,
  Stamp,
  Coins,
  Banknote,
  Wallet,
  ShieldCheck,
  Receipt,
  FileSignature,
  Briefcase,
  Users,
  User
} from 'lucide-react';
import { CourtCase, ReportType } from '../types';
import { formatArabicDate, formatArabicTime, formatHijriDate, getTodayString } from '../utils/dateUtils';
import { AppLogo } from './AppLogo';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CourtCase[];
  onOpenCaseDetails: (c: CourtCase) => void;
}

// Columns / Fields visibility configuration
export interface ColumnVisibilityState {
  index: boolean;          // م (الرقم التسلسلي)
  caseNumber: boolean;     // رقم الدعوى / طلب التنفيذ
  courtCircuit: boolean;   // المحكمة والدائرة / نوع السند
  titleDemands: boolean;   // موضوع القضية والطلبات / الملاحظات
  clientName: boolean;     // اسم الشركة / الموكل / طالب التنفيذ
  clientRole: boolean;     // صفة الشركة / الموكل
  opponent: boolean;       // الخصم / المنفذ ضده
  status: boolean;         // حالة القضية / حالة التنفيذ
  sessionDate: boolean;    // تاريخ الجلسة / تاريخ طلب التنفيذ
  enforcementAmounts: boolean; // المبالغ المالية (الأصلي، المسدد، المتبقي)
  lawyerVerdict: boolean;  // المحامي الحاضر / منطوق الحكم
  statsSummary: boolean;   // شريط الإحصائيات بالأعلى
}

const DEFAULT_COLUMN_VISIBILITY: ColumnVisibilityState = {
  index: true,
  caseNumber: true,
  courtCircuit: true,
  titleDemands: true,
  clientName: true,
  clientRole: true,
  opponent: true,
  status: true,
  sessionDate: true,
  enforcementAmounts: true,
  lawyerVerdict: true,
  statsSummary: true,
};

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  cases,
  onOpenCaseDetails,
}) => {
  const [activeReportType, setActiveReportType] = useState<ReportType>('comprehensive');
  const [selectedLawyer, setSelectedLawyer] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [officeName, setOfficeName] = useState('مكتب الأستاذ / صقر ناصر - للمحاماة والاستشارات القانونية');
  const [copied, setCopied] = useState(false);

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibilityState>(DEFAULT_COLUMN_VISIBILITY);
  const [showVisibilityPanel, setShowVisibilityPanel] = useState<boolean>(false);

  // Helper to check if a case is closed/judged
  const isCaseClosed = (c: CourtCase): boolean => {
    return Boolean(c.isClosed || c.status === 'judged' || c.sessionStage === 'نطق بالحكم' || c.verdictText);
  };

  // Helper to check if a case is related to enforcement
  const isEnforcementCase = (c: CourtCase): boolean => {
    return Boolean(
      (c.enforcement && c.enforcement.isEnforcement) ||
      c.court === 'محكمة التنفيذ' ||
      (c.enforcement && (c.enforcement.amount || c.enforcement.enforcementNumber || c.enforcement.applicantName || c.enforcement.respondentName))
    );
  };

  // Helper to check if a case is a pure standalone enforcement request with no hearing sessions
  const isPureEnforcementOnly = (c: CourtCase): boolean => {
    return Boolean(
      c.court === 'محكمة التنفيذ' && 
      !c.isClosed && 
      c.status !== 'judged' && 
      !c.verdictText && 
      !c.sessionDate
    );
  };

  // Helper to check if a case is active enforcement
  const isActiveEnforcement = (c: CourtCase): boolean => {
    if (!isEnforcementCase(c)) return false;
    const status = c.enforcement?.enforcementStatus || (c.court === 'محكمة التنفيذ' && c.status !== 'judged' ? 'نشط' : (c.status === 'judged' ? 'نشط' : 'نشط'));
    return status === 'نشط';
  };

  // Helper to check if Saaed is plaintiff
  const isSaaedPlaintiff = (c: CourtCase): boolean => {
    const term = 'ساعد';
    const isClientSaaed = (c.clientName || '').toLowerCase().includes(term);
    const isOpponentSaaed = (c.opponentName || '').toLowerCase().includes(term);

    if (isClientSaaed && (c.clientRole === 'مدعي' || c.clientRole === 'طاعن' || c.clientRole === 'مستأنف')) {
      return true;
    }
    if (isOpponentSaaed && (c.clientRole === 'مدعى عليه' || c.clientRole === 'مطعون ضده' || c.clientRole === 'مستأنف ضده')) {
      return true;
    }
    return isClientSaaed && c.clientRole !== 'مدعى عليه';
  };

  // Helper to check if Saaed is defendant
  const isSaaedDefendant = (c: CourtCase): boolean => {
    const term = 'ساعد';
    const isClientSaaed = (c.clientName || '').toLowerCase().includes(term);
    const isOpponentSaaed = (c.opponentName || '').toLowerCase().includes(term);

    if (isClientSaaed && (c.clientRole === 'مدعى عليه' || c.clientRole === 'مطعون ضده' || c.clientRole === 'مستأنف ضده')) {
      return true;
    }
    if (isOpponentSaaed && (c.clientRole === 'مدعي' || c.clientRole === 'طاعن' || c.clientRole === 'مستأنف')) {
      return true;
    }
    return isOpponentSaaed && c.clientRole !== 'مدعى عليه';
  };

  // List of all unique lawyers representing clients
  const allLawyers = useMemo(() => {
    const lawyerMap = new Map<string, { count: number; activeCount: number; closedCount: number }>();

    cases.forEach((c) => {
      if (isPureEnforcementOnly(c)) return;
      const closed = isCaseClosed(c);

      // Check assignedLawyer
      if (c.assignedLawyer && c.assignedLawyer.trim()) {
        const name = c.assignedLawyer.trim();
        if (!lawyerMap.has(name)) {
          lawyerMap.set(name, { count: 0, activeCount: 0, closedCount: 0 });
        }
        const item = lawyerMap.get(name)!;
        item.count += 1;
        if (closed) item.closedCount += 1;
        else item.activeCount += 1;
      }

      // Also check session history lawyers if any
      if (c.history && Array.isArray(c.history)) {
        c.history.forEach((h) => {
          if (h.lawyer && h.lawyer.trim()) {
            const hName = h.lawyer.trim();
            if (!lawyerMap.has(hName)) {
              lawyerMap.set(hName, { count: 0, activeCount: 0, closedCount: 0 });
            }
          }
        });
      }
    });

    return Array.from(lawyerMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        activeCount: data.activeCount,
        closedCount: data.closedCount,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ar'));
  }, [cases]);

  // Total count of cases with an assigned lawyer
  const lawyerCasesTotalCount = useMemo(() => {
    return cases.filter((c) => !isPureEnforcementOnly(c) && Boolean(c.assignedLawyer && c.assignedLawyer.trim())).length;
  }, [cases]);

  // Determine if active report is an enforcement report
  const isEnforcementReport = activeReportType.startsWith('enforcement');

  // Filtered cases based on report type & search
  const reportCases = useMemo(() => {
    let filtered: CourtCase[] = [];

    switch (activeReportType) {
      case 'active':
        filtered = cases.filter((c) => !isPureEnforcementOnly(c) && !isCaseClosed(c) && !(c.enforcement?.isEnforcement && c.court === 'محكمة التنفيذ'));
        break;
      case 'inactive':
        filtered = cases.filter((c) => isCaseClosed(c));
        break;
      case 'lawyer_cases':
        if (selectedLawyer) {
          filtered = cases.filter((c) => 
            !isPureEnforcementOnly(c) && 
            (
              (c.assignedLawyer && c.assignedLawyer.trim().toLowerCase() === selectedLawyer.trim().toLowerCase()) ||
              (c.history && c.history.some(h => h.lawyer && h.lawyer.trim().toLowerCase() === selectedLawyer.trim().toLowerCase()))
            )
          );
        } else {
          filtered = cases.filter((c) => !isPureEnforcementOnly(c) && Boolean(c.assignedLawyer && c.assignedLawyer.trim()));
        }
        break;
      case 'saaed_plaintiff':
        filtered = cases.filter((c) => !isPureEnforcementOnly(c) && isSaaedPlaintiff(c));
        break;
      case 'saaed_defendant':
        filtered = cases.filter((c) => !isPureEnforcementOnly(c) && isSaaedDefendant(c));
        break;
      case 'enforcement_financial':
        filtered = cases.filter((c) => isEnforcementCase(c));
        break;
      case 'enforcement_active':
        filtered = cases.filter((c) => isActiveEnforcement(c));
        break;
      case 'enforcement_inactive':
        filtered = cases.filter((c) => isEnforcementCase(c) && !isActiveEnforcement(c));
        break;
      case 'comprehensive':
      default:
        filtered = cases.filter((c) => !isPureEnforcementOnly(c));
        break;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((c) => {
        const enf = c.enforcement;
        return (
          c.caseNumber.toLowerCase().includes(q) ||
          c.caseYear.includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.court.toLowerCase().includes(q) ||
          c.circuit.toLowerCase().includes(q) ||
          c.clientName.toLowerCase().includes(q) ||
          c.clientRole.toLowerCase().includes(q) ||
          c.opponentName.toLowerCase().includes(q) ||
          (c.assignedLawyer || '').toLowerCase().includes(q) ||
          (c.verdictText || '').toLowerCase().includes(q) ||
          (c.demands || '').toLowerCase().includes(q) ||
          (enf?.deedType || '').toLowerCase().includes(q) ||
          (enf?.customDeedType || '').toLowerCase().includes(q) ||
          (enf?.amount || '').toLowerCase().includes(q) ||
          (enf?.paidAmount || '').toLowerCase().includes(q) ||
          (enf?.remainingAmount || '').toLowerCase().includes(q) ||
          (enf?.paymentStatus || '').toLowerCase().includes(q) ||
          (enf?.enforcementStatus || '').toLowerCase().includes(q) ||
          (enf?.applicantName || '').toLowerCase().includes(q) ||
          (enf?.respondentName || '').toLowerCase().includes(q) ||
          (enf?.enforcementNumber || '').toLowerCase().includes(q)
        );
      });
    }

    return filtered;
  }, [cases, activeReportType, selectedLawyer, searchTerm]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const litigationCases = cases.filter((c) => !isPureEnforcementOnly(c));
    const totalLitigation = litigationCases.length;
    const activeCount = litigationCases.filter((c) => !isCaseClosed(c) && !(c.enforcement?.isEnforcement && c.court === 'محكمة التنفيذ')).length;
    const inactiveCount = cases.filter((c) => isCaseClosed(c)).length;
    const finalJudgments = cases.filter((c) => c.judgmentType === 'final' || (isCaseClosed(c) && !c.judgmentType)).length;
    const appealableJudgments = cases.filter((c) => c.judgmentType === 'appealable').length;
    const saaedPlaintiffCount = litigationCases.filter((c) => isSaaedPlaintiff(c)).length;
    const saaedDefendantCount = litigationCases.filter((c) => isSaaedDefendant(c)).length;

    // Financial Enforcement Statistics
    const enforcementAllCases = cases.filter(isEnforcementCase);
    const enforcementCount = enforcementAllCases.length;
    const enforcementActiveCount = enforcementAllCases.filter(isActiveEnforcement).length;
    const enforcementInactiveCount = enforcementCount - enforcementActiveCount;

    let enforcementTotalAmount = 0;
    let enforcementPaidAmount = 0;
    let enforcementRemainingAmount = 0;
    let fullPaymentCount = 0;
    let partialPaymentCount = 0;

    enforcementAllCases.forEach((c) => {
      const enf = c.enforcement;
      const totalNum = parseFloat(String(enf?.amount || '').replace(/[^0-9.]/g, '')) || 0;
      enforcementTotalAmount += totalNum;

      if (enf?.paymentStatus === 'سداد كلي') {
        fullPaymentCount++;
        enforcementPaidAmount += totalNum;
      } else {
        partialPaymentCount++;
        const paidNum = parseFloat(String(enf?.paidAmount || '').replace(/[^0-9.]/g, '')) || 0;
        const remainingNum = enf?.remainingAmount
          ? (parseFloat(String(enf.remainingAmount).replace(/[^0-9.]/g, '')) || 0)
          : Math.max(0, totalNum - paidNum);
        enforcementPaidAmount += paidNum;
        enforcementRemainingAmount += remainingNum;
      }
    });

    return {
      totalLitigation,
      activeCount,
      inactiveCount,
      finalJudgments,
      appealableJudgments,
      saaedPlaintiffCount,
      saaedDefendantCount,
      enforcementCount,
      enforcementActiveCount,
      enforcementInactiveCount,
      enforcementTotalAmount,
      enforcementPaidAmount,
      enforcementRemainingAmount,
      fullPaymentCount,
      partialPaymentCount,
    };
  }, [cases]);

  // Toggle individual column visibility
  const toggleColumn = (key: keyof ColumnVisibilityState) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Show all columns
  const handleSelectAllColumns = () => {
    setVisibleColumns({
      index: true,
      caseNumber: true,
      courtCircuit: true,
      titleDemands: true,
      clientName: true,
      clientRole: true,
      opponent: true,
      status: true,
      sessionDate: true,
      enforcementAmounts: true,
      lawyerVerdict: true,
      statsSummary: true,
    });
  };

  // Reset to default
  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_COLUMN_VISIBILITY);
  };

  // Count active columns
  const activeColumnCount = useMemo(() => {
    const cols = [
      visibleColumns.index,
      visibleColumns.caseNumber,
      visibleColumns.courtCircuit,
      visibleColumns.titleDemands,
      visibleColumns.clientName,
      visibleColumns.clientRole,
      visibleColumns.opponent,
      visibleColumns.status,
      visibleColumns.sessionDate,
      visibleColumns.enforcementAmounts,
      visibleColumns.lawyerVerdict,
    ];
    return cols.filter(Boolean).length;
  }, [visibleColumns]);

  if (!isOpen) return null;

  const getReportTitle = (): string => {
    switch (activeReportType) {
      case 'active':
        return 'تقرير القضايا الموضوعية النشطة (المتداولة)';
      case 'inactive':
        return 'تقرير القضايا الموضوعية غير النشطة (المنتهية والمحكوم فيها)';
      case 'lawyer_cases':
        return selectedLawyer 
          ? `تقرير قضايا المحامي / ${selectedLawyer} (المترافع فيها عن الموكل)` 
          : 'تقرير قضايا المحامين (المترافعين عن الموكلين)';
      case 'saaed_plaintiff':
        return 'تقرير القضايا التي تكون فيها شركة ساعد مدعياً (طرف مدعي)';
      case 'saaed_defendant':
        return 'تقرير القضايا التي تكون فيها شركة ساعد مدعى عليها (طرف مدعى عليه)';
      case 'enforcement_financial':
        return 'تقرير قضايا وطلبات التنفيذ المالي والسندات التنفيذية (الكل)';
      case 'enforcement_active':
        return 'تقرير قضايا وطلبات التنفيذ المالي النشطة (السارية)';
      case 'enforcement_inactive':
        return 'تقرير قضايا وطلبات التنفيذ المالي غير النشطة (المنتهية / المسددة)';
      case 'comprehensive':
      default:
        return 'التقرير الشامل لكافة القضايا الموضوعية وجلسات المحاكم';
    }
  };

  // Helper to format currency
  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 2 }).format(val);
  };

  // Helper to get formatted Role badge text & style for Word / Print
  const getCompanyRoleBadgeHtml = (role: string) => {
    const isPlaintiff = role === 'مدعي' || role === 'طاعن' || role === 'مستأنف' || role === 'طالب تنفيذ';
    const bgColor = isPlaintiff ? '#dcfce7' : '#fee2e2';
    const textColor = isPlaintiff ? '#166534' : '#991b1b';
    const borderColor = isPlaintiff ? '#86efac' : '#fca5a5';
    return `<span style="background-color: ${bgColor}; color: ${textColor}; border: 1px solid ${borderColor}; padding: 3px 7px; border-radius: 4px; font-weight: bold; font-size: 8.5pt; display: inline-block;">${role}</span>`;
  };

  // 1. Print / Save as PDF (in formatted Table layout)
  const handlePrint = () => {
    window.print();
  };

  // 2. Export Report as structured Table in Microsoft Word (.doc) with Selective Column Visibility
  const handleExportWordTable = () => {
    if (reportCases.length === 0) return;

    const todayStr = getTodayString();
    const gregorianDate = formatArabicDate(todayStr);
    const hijriDate = formatHijriDate(todayStr, { includeWeekday: true });

    let headersHtml = '<tr>';
    if (visibleColumns.index) headersHtml += '<th style="width: 25px;">م</th>';

    if (isEnforcementReport) {
      if (visibleColumns.caseNumber) headersHtml += '<th style="width: 90px;">رقم طلب التنفيذ</th>';
      if (visibleColumns.courtCircuit) headersHtml += '<th style="width: 100px;">نوع السند التنفيذي</th>';
      if (visibleColumns.clientName) headersHtml += '<th style="width: 110px;">طالب التنفيذ</th>';
      if (visibleColumns.opponent) headersHtml += '<th style="width: 110px;">المنفذ ضده</th>';
      if (visibleColumns.enforcementAmounts) {
        headersHtml += '<th style="width: 85px;">مبلغ التنفيذ</th>';
        headersHtml += '<th style="width: 85px;">المسدد</th>';
        headersHtml += '<th style="width: 85px;">المتبقي</th>';
      }
      if (visibleColumns.status) headersHtml += '<th style="width: 85px;">حالة السداد والتنفيذ</th>';
      if (visibleColumns.sessionDate) headersHtml += '<th style="width: 80px;">تاريخ الطلب</th>';
      if (visibleColumns.titleDemands) headersHtml += '<th>الملاحظات وموضوع التنفيذ</th>';
    } else {
      if (visibleColumns.caseNumber) headersHtml += '<th style="width: 85px;">رقم الدعوى والسنة</th>';
      if (visibleColumns.courtCircuit) headersHtml += '<th style="width: 110px;">المحكمة والدائرة</th>';
      if (visibleColumns.titleDemands) headersHtml += '<th>موضوع القضية والطلبات</th>';
      if (visibleColumns.clientName) headersHtml += '<th style="width: 110px;">اسم الشركة / الموكل</th>';
      if (visibleColumns.clientRole) headersHtml += '<th style="width: 80px; text-align: center;">صفة الشركة</th>';
      if (visibleColumns.opponent) headersHtml += '<th style="width: 105px;">الخصم ومحاميه</th>';
      if (visibleColumns.status) headersHtml += '<th style="width: 95px; text-align: center;">حالة القضية والحكم</th>';
      if (visibleColumns.sessionDate) headersHtml += '<th style="width: 95px; text-align: center;">تاريخ الجلسة / الحكم</th>';
      if (visibleColumns.lawyerVerdict) headersHtml += '<th style="width: 130px;">المحامي ومنطوق الحكم</th>';
    }
    headersHtml += '</tr>';

    const rowsHtml = reportCases.map((c, index) => {
      const closed = isCaseClosed(c);
      const enf = c.enforcement;
      let rowHtml = '<tr style="border-bottom: 1px solid #999;">';

      if (visibleColumns.index) {
        rowHtml += `<td style="border: 1px solid #333; padding: 6px 4px; text-align: center; font-weight: bold;">${index + 1}</td>`;
      }

      if (isEnforcementReport) {
        const enfNum = enf?.enforcementNumber || c.caseNumber || '-';
        const deedType = enf?.deedType === 'أخرى' && enf.customDeedType ? enf.customDeedType : (enf?.deedType || 'صك حكم');
        const applicant = enf?.applicantName || c.clientName;
        const respondent = enf?.respondentName || c.opponentName;
        const totalAmt = enf?.amount || '-';
        const paidAmt = enf?.paidAmount || (enf?.paymentStatus === 'سداد كلي' ? totalAmt : '0');
        const remAmt = enf?.remainingAmount || (enf?.paymentStatus === 'سداد كلي' ? '0' : '-');
        const payStatus = enf?.paymentStatus || 'سداد جزئي';
        const enfStatus = enf?.enforcementStatus || (c.status === 'judged' ? 'منتهي' : 'نشط');

        if (visibleColumns.caseNumber) {
          rowHtml += `<td style="border: 1px solid #333; padding: 6px 4px; text-align: center; font-family: monospace; font-weight: bold; color: #1e3a8a;">${enfNum}</td>`;
        }
        if (visibleColumns.courtCircuit) {
          rowHtml += `<td style="border: 1px solid #333; padding: 6px 4px; font-weight: bold; color: #0f172a;">${deedType}</td>`;
        }
        if (visibleColumns.clientName) {
          rowHtml += `<td style="border: 1px solid #333; padding: 6px 4px; font-weight: bold;">${applicant}</td>`;
        }
        if (visibleColumns.opponent) {
          rowHtml += `<td style="border: 1px solid #333; padding: 6px 4px;">${respondent}</td>`;
        }
        if (visibleColumns.enforcementAmounts) {
          rowHtml += `<td style="border: 1px solid #333; padding: 6px 4px; text-align: center; font-weight: bold; color: #047857;">${totalAmt}</td>`;
          rowHtml += `<td style="border: 1px solid #333; padding: 6px 4px; text-align: center; color: #0284c7;">${paidAmt}</td>`;
          rowHtml += `<td style="border: 1px solid #333; padding: 6px 4px; text-align: center; color: #b91c1c; font-weight: bold;">${remAmt}</td>`;
        }
        if (visibleColumns.status) {
          rowHtml += `
            <td style="border: 1px solid #333; padding: 6px 4px; text-align: center;">
              <div style="font-weight: bold; font-size: 8.5pt; color: ${enfStatus === 'نشط' ? '#047857' : '#64748b'};">${enfStatus}</div>
              <div style="font-size: 8pt; color: #b45309;">${payStatus}</div>
            </td>
          `;
        }
        if (visibleColumns.sessionDate) {
          rowHtml += `<td style="border: 1px solid #333; padding: 6px 4px; text-align: center; font-size: 8.5pt;">${enf?.requestDate ? formatArabicDate(enf.requestDate) : '-'}</td>`;
        }
        if (visibleColumns.titleDemands) {
          rowHtml += `<td style="border: 1px solid #333; padding: 6px 4px; font-size: 8.5pt;">${enf?.notes || c.demands || c.title || '-'}</td>`;
        }
      } else {
        let statusBadge = '<span style="color: #b45309; font-weight: bold;">نشطة متداولة</span>';
        if (closed) {
          if (c.judgmentType === 'final') {
            statusBadge = '<span style="color: #047857; font-weight: bold; background-color: #d1fae5; padding: 2px 5px; border-radius: 3px;">حكم نهائي (بات)</span>';
          } else if (c.judgmentType === 'appealable') {
            statusBadge = '<span style="color: #0284c7; font-weight: bold; background-color: #e0f2fe; padding: 2px 5px; border-radius: 3px;">حكم قابل للاستئناف</span>';
          } else {
            statusBadge = '<span style="color: #047857; font-weight: bold; background-color: #d1fae5; padding: 2px 5px; border-radius: 3px;">منتهية</span>';
          }
        }

        const verdictHtml = c.verdictText 
          ? `<div style="font-size: 8.5pt; color: #065f46; background-color: #ecfdf5; padding: 4px; border: 1px solid #a7f3d0; margin-top: 3px; border-radius: 3px;"><strong>منطوق الحكم:</strong> ${c.verdictText}</div>`
          : (c.previousDecision ? `<div style="font-size: 8pt; color: #64748b; margin-top: 2px;">القرار السابق: ${c.previousDecision}</div>` : '');

        if (visibleColumns.caseNumber) {
          rowHtml += `
            <td style="border: 1px solid #333; padding: 6px 4px; text-align: center; font-family: monospace; font-weight: bold;">
              <div style="font-size: 10.5pt; color: #111;">${c.caseNumber}</div>
              <div style="font-size: 8.5pt; color: #555;">لسنة ${c.caseYear}</div>
              ${c.judge ? `<div style="font-size: 7.5pt; color: #777;">القاضي: ${c.judge}</div>` : ''}
            </td>
          `;
        }
        if (visibleColumns.courtCircuit) {
          rowHtml += `
            <td style="border: 1px solid #333; padding: 6px 4px;">
              <strong style="font-size: 9.5pt; color: #000;">${c.court}</strong>
              <div style="font-size: 8.5pt; color: #444;">${c.circuit}</div>
            </td>
          `;
        }
        if (visibleColumns.titleDemands) {
          rowHtml += `
            <td style="border: 1px solid #333; padding: 6px 4px;">
              <strong style="font-size: 9.5pt; color: #0f172a;">${c.title}</strong>
              ${c.demands ? `<div style="font-size: 8.5pt; color: #475569; margin-top: 2px;"><strong>المطلوب:</strong> ${c.demands}</div>` : ''}
            </td>
          `;
        }
        if (visibleColumns.clientName) {
          rowHtml += `
            <td style="border: 1px solid #333; padding: 6px 4px;">
              <strong style="font-size: 9.5pt; color: #000;">${c.clientName}</strong>
            </td>
          `;
        }
        if (visibleColumns.clientRole) {
          rowHtml += `
            <td style="border: 1px solid #333; padding: 6px 4px; text-align: center;">
              ${getCompanyRoleBadgeHtml(c.clientRole)}
            </td>
          `;
        }
        if (visibleColumns.opponent) {
          rowHtml += `
            <td style="border: 1px solid #333; padding: 6px 4px;">
              <strong style="font-size: 9.5pt; color: #000;">${c.opponentName}</strong>
              ${c.opponentLawyer ? `<div style="font-size: 8pt; color: #64748b;">محامي الخصم: ${c.opponentLawyer}</div>` : ''}
            </td>
          `;
        }
        if (visibleColumns.status) {
          rowHtml += `
            <td style="border: 1px solid #333; padding: 6px 4px; text-align: center;">
              ${statusBadge}
              <div style="font-size: 8pt; color: #64748b; margin-top: 2px;">${c.sessionStage}</div>
            </td>
          `;
        }
        if (visibleColumns.sessionDate) {
          rowHtml += `
            <td style="border: 1px solid #333; padding: 6px 4px; text-align: center;">
              <div style="font-size: 9pt; font-weight: bold; color: #0f172a;">${formatArabicDate(c.sessionDate)}</div>
              <div style="font-size: 7.5pt; color: #065f46;">${formatHijriDate(c.sessionDate)}</div>
              <div style="font-size: 8pt; color: #b45309; font-weight: bold;">${formatArabicTime(c.sessionTime)}</div>
            </td>
          `;
        }
        if (visibleColumns.lawyerVerdict) {
          rowHtml += `
            <td style="border: 1px solid #333; padding: 6px 4px;">
              ${c.assignedLawyer ? `<div style="font-size: 8.5pt; font-weight: bold; color: #1e293b; margin-bottom: 2px;">المحامي: ${c.assignedLawyer}</div>` : ''}
              ${verdictHtml}
            </td>
          `;
        }
      }

      rowHtml += '</tr>';
      return rowHtml;
    }).join('');

    const statsSummaryHtml = visibleColumns.statsSummary ? (
      isEnforcementReport ? `
        <!-- Summary Statistics Table for Enforcement in Word -->
        <table class="summary-box">
          <tr>
            <td style="background-color: #f1f5f9;"><strong>إجمالي طلبات التنفيذ</strong><br/><span style="font-size: 11pt; color: #0f172a; font-weight: bold;">${stats.enforcementCount}</span></td>
            <td style="background-color: #ecfdf5;"><strong>تنفيذ نشط (سارٍ)</strong><br/><span style="font-size: 11pt; color: #047857; font-weight: bold;">${stats.enforcementActiveCount}</span></td>
            <td style="background-color: #f8fafc;"><strong>تنفيذ منتهٍ / مسدد</strong><br/><span style="font-size: 11pt; color: #475569; font-weight: bold;">${stats.enforcementInactiveCount}</span></td>
            <td style="background-color: #fef3c7;"><strong>إجمالي المبالغ المطلوبة</strong><br/><span style="font-size: 11pt; color: #92400e; font-weight: bold;">${formatCurrency(stats.enforcementTotalAmount)} ريال</span></td>
            <td style="background-color: #e0f2fe;"><strong>المبالغ المسددة</strong><br/><span style="font-size: 11pt; color: #0369a1; font-weight: bold;">${formatCurrency(stats.enforcementPaidAmount)} ريال</span></td>
            <td style="background-color: #ffe4e6;"><strong>المبالغ المتبقية</strong><br/><span style="font-size: 11pt; color: #be123c; font-weight: bold;">${formatCurrency(stats.enforcementRemainingAmount)} ريال</span></td>
          </tr>
        </table>
      ` : activeReportType === 'lawyer_cases' ? `
        <!-- Summary Statistics Table for Lawyer Cases in Word -->
        <table class="summary-box">
          <tr>
            <td style="background-color: #f1f5f9;"><strong>المحامي المترافع</strong><br/><span style="font-size: 11pt; color: #1e1b4b; font-weight: bold;">${selectedLawyer || 'كافة المحامين'}</span></td>
            <td style="background-color: #e0e7ff;"><strong>إجمالي القضايا</strong><br/><span style="font-size: 11pt; color: #3730a3; font-weight: bold;">${reportCases.length}</span></td>
            <td style="background-color: #fef3c7;"><strong>قضايا نشطة (متداولة)</strong><br/><span style="font-size: 11pt; color: #92400e; font-weight: bold;">${reportCases.filter(c => !isCaseClosed(c)).length}</span></td>
            <td style="background-color: #d1fae5;"><strong>قضايا منتهية (محكوم فيها)</strong><br/><span style="font-size: 11pt; color: #065f46; font-weight: bold;">${reportCases.filter(c => isCaseClosed(c)).length}</span></td>
            <td style="background-color: #f0fdf4;"><strong>عدد الموكلين</strong><br/><span style="font-size: 11pt; color: #15803d; font-weight: bold;">${Array.from(new Set(reportCases.map(c => c.clientName).filter(Boolean))).length}</span></td>
          </tr>
        </table>
      ` : `
        <!-- Summary Statistics Table for Litigation in Word -->
        <table class="summary-box">
          <tr>
            <td style="background-color: #f1f5f9;"><strong>إجمالي القضايا</strong><br/><span style="font-size: 11pt; color: #0f172a; font-weight: bold;">${stats.totalLitigation}</span></td>
            <td style="background-color: #fef3c7;"><strong>قضايا نشطة (متداولة)</strong><br/><span style="font-size: 11pt; color: #92400e; font-weight: bold;">${stats.activeCount}</span></td>
            <td style="background-color: #d1fae5;"><strong>قضايا غير نشطة (منتهية)</strong><br/><span style="font-size: 11pt; color: #065f46; font-weight: bold;">${stats.inactiveCount}</span></td>
            <td style="background-color: #ecfdf5;"><strong>أحكام نهائية (باتة)</strong><br/><span style="font-size: 11pt; color: #047857; font-weight: bold;">${stats.finalJudgments}</span></td>
            <td style="background-color: #e0f2fe;"><strong>أحكام قابلة للاستئناف</strong><br/><span style="font-size: 11pt; color: #0369a1; font-weight: bold;">${stats.appealableJudgments}</span></td>
            <td style="background-color: #f0fdf4;"><strong>ساعد (مدعي)</strong><br/><span style="font-size: 11pt; color: #15803d; font-weight: bold;">${stats.saaedPlaintiffCount}</span></td>
            <td style="background-color: #ffe4e6;"><strong>ساعد (مدعى عليه)</strong><br/><span style="font-size: 11pt; color: #be123c; font-weight: bold;">${stats.saaedDefendantCount}</span></td>
          </tr>
        </table>
      `
    ) : '';

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir='rtl'>
      <head>
        <meta charset='utf-8'>
        <title>${getReportTitle()}</title>
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
            margin: 1cm 0.8cm 1cm 0.8cm;
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
          table.report-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          table.report-table th {
            background-color: #0f172a;
            color: #ffffff;
            border: 1.5px solid #000;
            padding: 6px 4px;
            font-size: 9.5pt;
            font-weight: bold;
            text-align: center;
          }
          table.report-table td {
            font-size: 9pt;
            vertical-align: top;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            border-bottom: 2px solid #000;
          }
          .header-table td {
            border: none;
            padding: 4px;
          }
          .summary-box {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
          }
          .summary-box td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            text-align: center;
            font-size: 9pt;
          }
          .title {
            text-align: center;
            font-size: 15pt;
            font-weight: bold;
            color: #0f172a;
            margin: 4px 0 2px 0;
          }
          .subtitle {
            text-align: center;
            font-size: 10pt;
            color: #334155;
            margin-bottom: 8px;
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 35%; text-align: right;">
              <div style="font-size: 12pt; font-weight: bold; color: #0f172a;">${officeName}</div>
              <div style="font-size: 8.5pt; color: #475569;">مركز التقارير والإحصاءات القضائية وإدارة الجلسات والتنفيذ</div>
            </td>
            <td style="width: 30%; text-align: center;">
              <div style="font-size: 20pt;">⚖️</div>
              <div style="font-size: 9pt; font-weight: bold; color: #0f172a;">المملكة العربية السعودية</div>
            </td>
            <td style="width: 35%; text-align: left; direction: ltr;">
              <div style="font-size: 9pt;"><strong>تاريخ التقرير:</strong> ${gregorianDate}</div>
              <div style="font-size: 8.5pt; color: #065f46;"><strong>الموافق:</strong> ${hijriDate}</div>
              <div style="font-size: 8.5pt; color: #475569;"><strong>إجمالي البنود بالتقرير:</strong> ${reportCases.length} بند</div>
            </td>
          </tr>
        </table>

        <div class="title">${getReportTitle()}</div>
        <div class="subtitle">
          تاريخ الاستخراج: ${gregorianDate} (الموافق: ${hijriDate}) • تصنيف التقرير: ${getReportTitle()}
        </div>

        ${statsSummaryHtml}

        <!-- Main Report Table -->
        <table class="report-table">
          <thead>
            ${headersHtml}
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="margin-top: 25px; border-top: 1px solid #94a3b8; padding-top: 8px; font-size: 8.5pt; color: #64748b; display: flex; justify-content: space-between;">
          <span>تم استخراج التقرير في صورة جدول رسمي عبر نظام إدارة ومتابعة القضايا الذكي</span>
          <span>المكتب: ${officeName}</span>
          <span>صفحة 1 من 1</span>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + wordHtml], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_${activeReportType}_${todayStr}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Export CSV Table with Selective Column Visibility
  const handleExportCSV = () => {
    if (reportCases.length === 0) return;

    const headers: string[] = [];
    if (visibleColumns.index) headers.push('م');

    if (isEnforcementReport) {
      if (visibleColumns.caseNumber) headers.push('رقم طلب التنفيذ');
      if (visibleColumns.courtCircuit) headers.push('نوع السند التنفيذي');
      if (visibleColumns.clientName) headers.push('طالب التنفيذ');
      if (visibleColumns.opponent) headers.push('المنفذ ضده');
      if (visibleColumns.enforcementAmounts) {
        headers.push('مبلغ التنفيذ المطلوب', 'المبلغ المسدد', 'المبلغ المتبقي');
      }
      if (visibleColumns.status) headers.push('حالة السداد', 'حالة التنفيذ');
      if (visibleColumns.sessionDate) headers.push('تاريخ تقديم الطلب');
      if (visibleColumns.titleDemands) headers.push('ملاحظات وموضوع التنفيذ');
    } else {
      if (visibleColumns.caseNumber) headers.push('رقم الدعوى', 'السنة', 'القاضي');
      if (visibleColumns.courtCircuit) headers.push('المحكمة', 'الدائرة');
      if (visibleColumns.titleDemands) headers.push('موضوع الدعوى', 'المطلوب');
      if (visibleColumns.clientName) headers.push('اسم الشركة / الموكل');
      if (visibleColumns.clientRole) headers.push('صفة الشركة');
      if (visibleColumns.opponent) headers.push('الخصم', 'محامي الخصم');
      if (visibleColumns.status) headers.push('حالة القضية', 'نوع الحكم', 'المرحلة');
      if (visibleColumns.sessionDate) headers.push('تاريخ الجلسة / الحكم', 'ساعة الجلسة');
      if (visibleColumns.lawyerVerdict) headers.push('المحامي الحاضر', 'منطوق الحكم', 'القرار السابق');
    }

    const rows = reportCases.map((c, index) => {
      const rowData: (string | number)[] = [];
      const enf = c.enforcement;

      if (visibleColumns.index) rowData.push(index + 1);

      if (isEnforcementReport) {
        if (visibleColumns.caseNumber) rowData.push(`"${enf?.enforcementNumber || c.caseNumber || ''}"`);
        if (visibleColumns.courtCircuit) rowData.push(`"${enf?.deedType || 'صك حكم'}"`);
        if (visibleColumns.clientName) rowData.push(`"${(enf?.applicantName || c.clientName || '').replace(/"/g, '""')}"`);
        if (visibleColumns.opponent) rowData.push(`"${(enf?.respondentName || c.opponentName || '').replace(/"/g, '""')}"`);
        if (visibleColumns.enforcementAmounts) {
          rowData.push(
            `"${enf?.amount || ''}"`,
            `"${enf?.paidAmount || (enf?.paymentStatus === 'سداد كلي' ? enf?.amount || '' : '')}"`,
            `"${enf?.remainingAmount || (enf?.paymentStatus === 'سداد كلي' ? '0' : '')}"`
          );
        }
        if (visibleColumns.status) {
          rowData.push(`"${enf?.paymentStatus || 'سداد جزئي'}"`, `"${enf?.enforcementStatus || (c.status === 'judged' ? 'منتهي' : 'نشط')}"`);
        }
        if (visibleColumns.sessionDate) rowData.push(`"${enf?.requestDate || ''}"`);
        if (visibleColumns.titleDemands) rowData.push(`"${(enf?.notes || c.demands || c.title || '').replace(/"/g, '""')}"`);
      } else {
        if (visibleColumns.caseNumber) {
          rowData.push(c.caseNumber, c.caseYear, `"${c.judge || ''}"`);
        }
        if (visibleColumns.courtCircuit) {
          rowData.push(`"${c.court}"`, `"${c.circuit}"`);
        }
        if (visibleColumns.titleDemands) {
          rowData.push(`"${(c.title || '').replace(/"/g, '""')}"`, `"${(c.demands || '').replace(/"/g, '""')}"`);
        }
        if (visibleColumns.clientName) {
          rowData.push(`"${(c.clientName || '').replace(/"/g, '""')}"`);
        }
        if (visibleColumns.clientRole) {
          rowData.push(`"${c.clientRole}"`);
        }
        if (visibleColumns.opponent) {
          rowData.push(`"${(c.opponentName || '').replace(/"/g, '""')}"`, `"${(c.opponentLawyer || '').replace(/"/g, '""')}"`);
        }
        if (visibleColumns.status) {
          rowData.push(
            `"${isCaseClosed(c) ? 'منتهية (محكوم فيها)' : 'نشطة (متداولة)'}"`,
            `"${c.judgmentType === 'final' ? 'حكم نهائي' : c.judgmentType === 'appealable' ? 'حكم قابل للاستئناف' : '-'}"`,
            `"${c.sessionStage}"`
          );
        }
        if (visibleColumns.sessionDate) {
          rowData.push(`"${c.sessionDate}"`, `"${formatArabicTime(c.sessionTime)}"`);
        }
        if (visibleColumns.lawyerVerdict) {
          rowData.push(
            `"${(c.assignedLawyer || '').replace(/"/g, '""')}"`,
            `"${(c.verdictText || '').replace(/"/g, '""')}"`,
            `"${(c.previousDecision || '').replace(/"/g, '""')}"`
          );
        }
      }

      return rowData;
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_${activeReportType}_${getTodayString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 4. Copy Report Summary to Clipboard
  const handleCopyReport = () => {
    let text = `📋 ${getReportTitle()}\n`;
    text += `المكتب: ${officeName}\n`;
    text += `تاريخ التقرير: ${formatArabicDate(getTodayString())}\n`;
    text += `إجمالي البنود: ${reportCases.length}\n`;
    text += `------------------------------------\n\n`;

    reportCases.forEach((c, idx) => {
      const enf = c.enforcement;
      const parts: string[] = [];

      if (isEnforcementReport) {
        let headerLine = `${idx + 1}. `;
        headerLine += `طلب تنفيذ رقم: ${enf?.enforcementNumber || c.caseNumber || '-'} `;
        headerLine += `[السند: ${enf?.deedType || 'صك حكم'}]`;
        parts.push(headerLine);
        parts.push(`   طالب التنفيذ: ${enf?.applicantName || c.clientName} | المنفذ ضده: ${enf?.respondentName || c.opponentName}`);
        parts.push(`   المبلغ: ${enf?.amount || '-'} ريال | المسدد: ${enf?.paidAmount || '0'} | المتبقي: ${enf?.remainingAmount || '-'}`);
        parts.push(`   حالة التنفيذ: ${enf?.enforcementStatus || (c.status === 'judged' ? 'منتهي' : 'نشط')} | حالة السداد: ${enf?.paymentStatus || 'سداد جزئي'}`);
        if (enf?.requestDate) parts.push(`   تاريخ القيد: ${formatArabicDate(enf.requestDate)}`);
        if (enf?.notes) parts.push(`   ملاحظات: ${enf.notes}`);
      } else {
        let headerLine = '';
        if (visibleColumns.index) headerLine += `${idx + 1}. `;
        if (visibleColumns.caseNumber) headerLine += `دعوى رقم ${c.caseNumber}/${c.caseYear} `;
        if (visibleColumns.courtCircuit) headerLine += `- ${c.court} (${c.circuit})`;
        if (headerLine.trim()) parts.push(headerLine.trim());

        if (visibleColumns.titleDemands && c.title) {
          parts.push(`   الموضوع: ${c.title}${c.demands ? ` | المطلوب: ${c.demands}` : ''}`);
        }

        const clientOpponentParts: string[] = [];
        if (visibleColumns.clientName) clientOpponentParts.push(`الموكل: ${c.clientName}`);
        if (visibleColumns.clientRole) clientOpponentParts.push(`صفة الشركة: [${c.clientRole}]`);
        if (visibleColumns.opponent) clientOpponentParts.push(`الخصم: ${c.opponentName}${c.opponentLawyer ? ` (محاميه: ${c.opponentLawyer})` : ''}`);
        if (clientOpponentParts.length > 0) parts.push(`   ${clientOpponentParts.join(' | ')}`);

        const statusDateParts: string[] = [];
        if (visibleColumns.status) {
          const statusText = isCaseClosed(c) 
            ? (c.judgmentType === 'final' ? 'منتهية (حكم نهائي)' : c.judgmentType === 'appealable' ? 'منتهية (حكم قابل للاستئناف)' : 'منتهية')
            : 'نشطة متداولة';
          statusDateParts.push(`الحالة: ${statusText} (${c.sessionStage})`);
        }
        if (visibleColumns.sessionDate) {
          statusDateParts.push(`الجلسة: ${formatArabicDate(c.sessionDate)} - ${formatArabicTime(c.sessionTime)}`);
        }
        if (statusDateParts.length > 0) parts.push(`   ${statusDateParts.join(' | ')}`);

        if (visibleColumns.lawyerVerdict) {
          if (c.assignedLawyer) parts.push(`   المحامي الحاضر: ${c.assignedLawyer}`);
          if (c.verdictText) parts.push(`   منطوق الحكم: ${c.verdictText}`);
          else if (c.previousDecision) parts.push(`   القرار السابق: ${c.previousDecision}`);
        }
      }

      text += parts.join('\n') + '\n\n';
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-7xl w-full max-h-[96vh] flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <AppLogo size="md" withGlow />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold">
                  مركز التقارير والإحصاءات القضائية والتنفيذ
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {reportCases.length} بند مستخرج
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-1">
                {getReportTitle()}
              </h2>
            </div>
          </div>

          {/* Action & Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Toggle Visibility Settings Button */}
            <button
              onClick={() => setShowVisibilityPanel(!showVisibilityPanel)}
              title="تخصيص وإخفاء بعض الأعمدة والمعلومات قبل الطباعة أو التصدير أو النسخ"
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                showVisibilityPanel 
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300' 
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>إخفاء / إظهار الأعمدة ({activeColumnCount}/11)</span>
            </button>

            {/* Word Table Export Button */}
            <button
              onClick={handleExportWordTable}
              title="تصدير نسخة التقرير كجدول منسق في ملف Word (.doc) وفق الأعمدة المحددة"
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
            >
              <FileType className="w-4 h-4 text-blue-200" />
              <span>تصدير Word كجدول (.doc)</span>
            </button>

            {/* Print / Save PDF Table Button */}
            <button
              onClick={handlePrint}
              title="طباعة التقرير أو حفظه كملف PDF على شكل جدول رسمي"
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md ring-2 ring-amber-400/40"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ PDF كجدول</span>
            </button>

            {/* Excel (CSV) Table Export */}
            <button
              onClick={handleExportCSV}
              title="تصدير جدول بيانات إكسل CSV وفق الأعمدة المحددة"
              className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span className="hidden sm:inline">Excel (CSV)</span>
            </button>

            {/* Copy Report */}
            <button
              onClick={handleCopyReport}
              title="نسخ ملخص التقرير لمشاركته وفق الأعمدة المحددة"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
              <span className="hidden md:inline">{copied ? 'تم النسخ!' : 'نسخ التقرير'}</span>
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dual Category Tabs (Litigation Reports & Dedicated Financial Enforcement Reports) */}
        <div className="bg-slate-100 p-3 border-b border-slate-200 shrink-0 no-print space-y-2.5">
          
          {/* Section 1: Litigation & Court Hearings Reports */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs font-black text-slate-700">
              <Scale className="w-3.5 h-3.5 text-amber-700" />
              <span>تقارير القضايا الموضوعية وجلسات المحاكم:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              
              {/* 1. Comprehensive Litigation */}
              <button
                onClick={() => setActiveReportType('comprehensive')}
                className={`p-2 rounded-xl text-right transition cursor-pointer border flex flex-col justify-between ${
                  activeReportType === 'comprehensive'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-500/50'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <FileText className={`w-4 h-4 ${activeReportType === 'comprehensive' ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className={`text-[11px] font-black px-1.5 py-0.2 rounded font-mono ${
                    activeReportType === 'comprehensive' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {stats.totalLitigation}
                  </span>
                </div>
                <span className="text-xs font-black mt-1.5 leading-tight">
                  التقرير الشامل للقضايا
                </span>
              </button>

              {/* 2. Active Litigation Cases */}
              <button
                onClick={() => setActiveReportType('active')}
                className={`p-2 rounded-xl text-right transition cursor-pointer border flex flex-col justify-between ${
                  activeReportType === 'active'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/50'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Clock className={`w-4 h-4 ${activeReportType === 'active' ? 'text-white' : 'text-amber-600'}`} />
                  <span className={`text-[11px] font-black px-1.5 py-0.2 rounded font-mono ${
                    activeReportType === 'active' ? 'bg-white text-amber-900' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {stats.activeCount}
                  </span>
                </div>
                <span className="text-xs font-black mt-1.5 leading-tight">
                  القضايا النشطة (المتداولة)
                </span>
              </button>

              {/* 3. Inactive Litigation Cases */}
              <button
                onClick={() => setActiveReportType('inactive')}
                className={`p-2 rounded-xl text-right transition cursor-pointer border flex flex-col justify-between ${
                  activeReportType === 'inactive'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/50'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Gavel className={`w-4 h-4 ${activeReportType === 'inactive' ? 'text-emerald-200' : 'text-emerald-600'}`} />
                  <span className={`text-[11px] font-black px-1.5 py-0.2 rounded font-mono ${
                    activeReportType === 'inactive' ? 'bg-white text-emerald-900' : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {stats.inactiveCount}
                  </span>
                </div>
                <span className="text-xs font-black mt-1.5 leading-tight">
                  القضايا غير النشطة (المنتهية)
                </span>
              </button>

              {/* 4. Lawyer Cases - قضايا باسم محامي */}
              <button
                onClick={() => setActiveReportType('lawyer_cases')}
                className={`p-2 rounded-xl text-right transition cursor-pointer border flex flex-col justify-between ${
                  activeReportType === 'lawyer_cases'
                    ? 'bg-indigo-900 text-white border-indigo-900 shadow-md ring-2 ring-indigo-500/50'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <UserCheck className={`w-4 h-4 ${activeReportType === 'lawyer_cases' ? 'text-amber-300' : 'text-indigo-600'}`} />
                  <span className={`text-[11px] font-black px-1.5 py-0.2 rounded font-mono ${
                    activeReportType === 'lawyer_cases' ? 'bg-amber-400 text-slate-950' : 'bg-indigo-100 text-indigo-900'
                  }`}>
                    {selectedLawyer ? reportCases.length : lawyerCasesTotalCount}
                  </span>
                </div>
                <span className="text-xs font-black mt-1.5 leading-tight">
                  قضايا باسم محامي
                </span>
              </button>

              {/* 5. Saaed Plaintiff */}
              <button
                onClick={() => setActiveReportType('saaed_plaintiff')}
                className={`p-2 rounded-xl text-right transition cursor-pointer border flex flex-col justify-between ${
                  activeReportType === 'saaed_plaintiff'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-500/50'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Scale className={`w-4 h-4 ${activeReportType === 'saaed_plaintiff' ? 'text-teal-200' : 'text-teal-600'}`} />
                  <span className={`text-[11px] font-black px-1.5 py-0.2 rounded font-mono ${
                    activeReportType === 'saaed_plaintiff' ? 'bg-white text-teal-900' : 'bg-teal-100 text-teal-900'
                  }`}>
                    {stats.saaedPlaintiffCount}
                  </span>
                </div>
                <span className="text-xs font-black mt-1.5 leading-tight">
                  المدعي: شركة ساعد
                </span>
              </button>

              {/* 6. Saaed Defendant */}
              <button
                onClick={() => setActiveReportType('saaed_defendant')}
                className={`p-2 rounded-xl text-right transition cursor-pointer border flex flex-col justify-between ${
                  activeReportType === 'saaed_defendant'
                    ? 'bg-rose-700 text-white border-rose-700 shadow-md ring-2 ring-rose-500/50'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <ArrowRightLeft className={`w-4 h-4 ${activeReportType === 'saaed_defendant' ? 'text-rose-200' : 'text-rose-600'}`} />
                  <span className={`text-[11px] font-black px-1.5 py-0.2 rounded font-mono ${
                    activeReportType === 'saaed_defendant' ? 'bg-white text-rose-900' : 'bg-rose-100 text-rose-900'
                  }`}>
                    {stats.saaedDefendantCount}
                  </span>
                </div>
                <span className="text-xs font-black mt-1.5 leading-tight">
                  المدعى عليها: شركة ساعد
                </span>
              </button>

            </div>
          </div>

          {/* Section 2: Dedicated Financial Enforcement Reports (قضايا التنفيذ المالي في تقرير مستقل) */}
          <div className="pt-2 border-t border-slate-300">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-black text-blue-900">
              <Banknote className="w-3.5 h-3.5 text-blue-700" />
              <span>تقارير قضايا وطلبات التنفيذ المالي والسندات (مستقلة عن باقي القضايا):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              
              {/* Enforcement All */}
              <button
                onClick={() => setActiveReportType('enforcement_financial')}
                className={`p-2.5 rounded-xl text-right transition cursor-pointer border flex flex-col justify-between ${
                  activeReportType === 'enforcement_financial'
                    ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-500/50'
                    : 'bg-white text-blue-950 border-blue-200 hover:bg-blue-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Stamp className={`w-4 h-4 ${activeReportType === 'enforcement_financial' ? 'text-blue-300' : 'text-blue-600'}`} />
                    <span className="text-xs font-black">قضايا التنفيذ المالي (الكل)</span>
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 rounded font-mono ${
                    activeReportType === 'enforcement_financial' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-900'
                  }`}>
                    {stats.enforcementCount}
                  </span>
                </div>
                <span className="text-[11px] text-blue-300/90 mt-1">
                  شامل كافة طلبات التنفيذ والسندات التنفيذية
                </span>
              </button>

              {/* Active Enforcement */}
              <button
                onClick={() => setActiveReportType('enforcement_active')}
                className={`p-2.5 rounded-xl text-right transition cursor-pointer border flex flex-col justify-between ${
                  activeReportType === 'enforcement_active'
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500/50'
                    : 'bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Coins className={`w-4 h-4 ${activeReportType === 'enforcement_active' ? 'text-emerald-300' : 'text-emerald-600'}`} />
                    <span className="text-xs font-black">التنفيذ المالي النشط (الساري)</span>
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 rounded font-mono ${
                    activeReportType === 'enforcement_active' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {stats.enforcementActiveCount}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-300/90 mt-1">
                  الطلبات الجارية وغير المنتهية قيد المتابعة والسداد
                </span>
              </button>

              {/* Inactive / Completed Enforcement */}
              <button
                onClick={() => setActiveReportType('enforcement_inactive')}
                className={`p-2.5 rounded-xl text-right transition cursor-pointer border flex flex-col justify-between ${
                  activeReportType === 'enforcement_inactive'
                    ? 'bg-slate-700 text-white border-slate-700 shadow-md ring-2 ring-slate-400/50'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className={`w-4 h-4 ${activeReportType === 'enforcement_inactive' ? 'text-slate-300' : 'text-slate-600'}`} />
                    <span className="text-xs font-black">التنفيذ المالي غير النشط (المنتهي)</span>
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 rounded font-mono ${
                    activeReportType === 'enforcement_inactive' ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {stats.enforcementInactiveCount}
                  </span>
                </div>
                <span className="text-[11px] text-slate-300/90 mt-1">
                  الطلبات المنتهية والمسددة بالكامل
                </span>
              </button>

            </div>
          </div>

        </div>

        {/* Dedicated Lawyer Selection Card when activeReportType is 'lawyer_cases' */}
        {activeReportType === 'lawyer_cases' && (
          <div className="bg-indigo-50/80 border-b border-indigo-200 p-4 shrink-0 no-print animate-in slide-in-from-top-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Left / Top Info */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-900 text-amber-300 flex items-center justify-center font-black shadow-sm shrink-0 ring-2 ring-indigo-300">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>قضايا باسم محامي (المترافع فيها عن الموكل)</span>
                    {selectedLawyer ? (
                      <span className="px-2.5 py-0.5 bg-indigo-900 text-white rounded-lg text-xs font-black ring-1 ring-amber-400">
                        {selectedLawyer}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">
                        كافة المحامين ({allLawyers.length} محامٍ)
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-600">
                    عند اختيار اسم المحامي يظهر لك فوراً جميع القضايا التي يترافع فيها عن الموكل مع إمكانية طباعتها أو تصديرها
                  </p>
                </div>
              </div>

              {/* Selector Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="lawyer-select-box" className="text-xs font-bold text-slate-700 whitespace-nowrap">
                  اسم المحامي:
                </label>
                <select
                  id="lawyer-select-box"
                  value={selectedLawyer}
                  onChange={(e) => setSelectedLawyer(e.target.value)}
                  className="bg-white border-2 border-indigo-400 font-bold text-slate-900 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm min-w-[240px]"
                >
                  <option value="">-- كافة المحامين ({lawyerCasesTotalCount} قضية) --</option>
                  {allLawyers.map((lawyer) => (
                    <option key={lawyer.name} value={lawyer.name}>
                      {lawyer.name} ({lawyer.count} قضايا {lawyer.activeCount > 0 ? `• ${lawyer.activeCount} نشطة` : ''})
                    </option>
                  ))}
                </select>
                
                {selectedLawyer && (
                  <button
                    onClick={() => setSelectedLawyer('')}
                    className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    title="إلغاء التحديد وعرض الكل"
                  >
                    عرض الكل
                  </button>
                )}
              </div>

            </div>

            {/* Quick Chips of all available lawyers */}
            {allLawyers.length > 0 && (
              <div className="mt-3 pt-3 border-t border-indigo-200/80 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-600 ml-1">اختر بنقرة واحدة:</span>
                <button
                  onClick={() => setSelectedLawyer('')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    selectedLawyer === ''
                      ? 'bg-indigo-900 text-white shadow-sm ring-2 ring-amber-400'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>كافة المحامين</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-bold">
                    {lawyerCasesTotalCount}
                  </span>
                </button>

                {allLawyers.map((lawyer) => {
                  const isSelected = selectedLawyer === lawyer.name;
                  return (
                    <button
                      key={lawyer.name}
                      onClick={() => setSelectedLawyer(lawyer.name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-900 text-amber-300 shadow-md ring-2 ring-amber-400'
                          : 'bg-white text-slate-800 border border-slate-300 hover:bg-indigo-50 hover:border-indigo-400'
                      }`}
                    >
                      <UserCheck className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-indigo-600'}`} />
                      <span>{lawyer.name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        isSelected ? 'bg-indigo-950 text-amber-300' : 'bg-indigo-100 text-indigo-900'
                      }`}>
                        {lawyer.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* Collapsible Column & Field Visibility Settings Panel */}
        {showVisibilityPanel && (
          <div className="bg-amber-50/70 border-b border-amber-200 p-4 shrink-0 no-print animate-in slide-in-from-top-2">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-700" />
                <span className="font-black text-slate-900 text-xs sm:text-sm">
                  تخصيص وإخفاء معلومات التقرير قبل الطباعة أو التصدير أو النسخ
                </span>
                <span className="text-[11px] text-slate-600">
                  (حدد الأعمدة التي تريد إظهارها أو إخفاءها في النسخة المطبوعة والمصدرة)
                </span>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={handleSelectAllColumns}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>إظهار الكل</span>
                </button>
                <button
                  onClick={handleResetColumns}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>إعادة ضبط للافتراضي</span>
                </button>
              </div>
            </div>

            {/* Checkbox Chips Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
              
              {/* Index Column */}
              <button
                type="button"
                onClick={() => toggleColumn('index')}
                className={`p-2 rounded-xl border text-right font-bold transition flex items-center justify-between cursor-pointer ${
                  visibleColumns.index
                    ? 'bg-white border-amber-400 text-slate-900 shadow-xs'
                    : 'bg-slate-100/80 border-slate-200 text-slate-400 line-through'
                }`}
              >
                <span>م (الترقيم)</span>
                {visibleColumns.index ? <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {/* Case / Enforcement Number */}
              <button
                type="button"
                onClick={() => toggleColumn('caseNumber')}
                className={`p-2 rounded-xl border text-right font-bold transition flex items-center justify-between cursor-pointer ${
                  visibleColumns.caseNumber
                    ? 'bg-white border-amber-400 text-slate-900 shadow-xs'
                    : 'bg-slate-100/80 border-slate-200 text-slate-400 line-through'
                }`}
              >
                <span>رقم الدعوى / طلب التنفيذ</span>
                {visibleColumns.caseNumber ? <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {/* Court / Deed Type */}
              <button
                type="button"
                onClick={() => toggleColumn('courtCircuit')}
                className={`p-2 rounded-xl border text-right font-bold transition flex items-center justify-between cursor-pointer ${
                  visibleColumns.courtCircuit
                    ? 'bg-white border-amber-400 text-slate-900 shadow-xs'
                    : 'bg-slate-100/80 border-slate-200 text-slate-400 line-through'
                }`}
              >
                <span>المحكمة / نوع السند</span>
                {visibleColumns.courtCircuit ? <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {/* Title & Demands / Notes */}
              <button
                type="button"
                onClick={() => toggleColumn('titleDemands')}
                className={`p-2 rounded-xl border text-right font-bold transition flex items-center justify-between cursor-pointer ${
                  visibleColumns.titleDemands
                    ? 'bg-white border-amber-400 text-slate-900 shadow-xs'
                    : 'bg-slate-100/80 border-slate-200 text-slate-400 line-through'
                }`}
              >
                <span>موضوع الدعوى / الملاحظات</span>
                {visibleColumns.titleDemands ? <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {/* Company / Client / Applicant */}
              <button
                type="button"
                onClick={() => toggleColumn('clientName')}
                className={`p-2 rounded-xl border text-right font-bold transition flex items-center justify-between cursor-pointer ${
                  visibleColumns.clientName
                    ? 'bg-white border-amber-400 text-slate-900 shadow-xs'
                    : 'bg-slate-100/80 border-slate-200 text-slate-400 line-through'
                }`}
              >
                <span>الموكل / طالب التنفيذ</span>
                {visibleColumns.clientName ? <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {/* Company Role */}
              <button
                type="button"
                onClick={() => toggleColumn('clientRole')}
                className={`p-2 rounded-xl border text-right font-bold transition flex items-center justify-between cursor-pointer ring-1 ring-amber-500/50 ${
                  visibleColumns.clientRole
                    ? 'bg-amber-100 border-amber-500 text-amber-950 shadow-xs'
                    : 'bg-slate-100/80 border-slate-200 text-slate-400 line-through'
                }`}
              >
                <span>صفة الشركة</span>
                {visibleColumns.clientRole ? <CheckSquare className="w-4 h-4 text-amber-700 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {/* Opponent / Respondent */}
              <button
                type="button"
                onClick={() => toggleColumn('opponent')}
                className={`p-2 rounded-xl border text-right font-bold transition flex items-center justify-between cursor-pointer ${
                  visibleColumns.opponent
                    ? 'bg-white border-amber-400 text-slate-900 shadow-xs'
                    : 'bg-slate-100/80 border-slate-200 text-slate-400 line-through'
                }`}
              >
                <span>الخصم / المنفذ ضده</span>
                {visibleColumns.opponent ? <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {/* Case / Enforcement Status */}
              <button
                type="button"
                onClick={() => toggleColumn('status')}
                className={`p-2 rounded-xl border text-right font-bold transition flex items-center justify-between cursor-pointer ${
                  visibleColumns.status
                    ? 'bg-white border-amber-400 text-slate-900 shadow-xs'
                    : 'bg-slate-100/80 border-slate-200 text-slate-400 line-through'
                }`}
              >
                <span>حالة القضية / حالة التنفيذ</span>
                {visibleColumns.status ? <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {/* Enforcement Amounts */}
              <button
                type="button"
                onClick={() => toggleColumn('enforcementAmounts')}
                className={`p-2 rounded-xl border text-right font-bold transition flex items-center justify-between cursor-pointer ${
                  visibleColumns.enforcementAmounts
                    ? 'bg-white border-amber-400 text-slate-900 shadow-xs'
                    : 'bg-slate-100/80 border-slate-200 text-slate-400 line-through'
                }`}
              >
                <span>مبالغ وسندات التنفيذ</span>
                {visibleColumns.enforcementAmounts ? <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {/* Session Date & Time */}
              <button
                type="button"
                onClick={() => toggleColumn('sessionDate')}
                className={`p-2 rounded-xl border text-right font-bold transition flex items-center justify-between cursor-pointer ${
                  visibleColumns.sessionDate
                    ? 'bg-white border-amber-400 text-slate-900 shadow-xs'
                    : 'bg-slate-100/80 border-slate-200 text-slate-400 line-through'
                }`}
              >
                <span>تاريخ الجلسة / القيد</span>
                {visibleColumns.sessionDate ? <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {/* Lawyer & Verdict Text */}
              <button
                type="button"
                onClick={() => toggleColumn('lawyerVerdict')}
                className={`p-2 rounded-xl border text-right font-bold transition flex items-center justify-between cursor-pointer ${
                  visibleColumns.lawyerVerdict
                    ? 'bg-white border-amber-400 text-slate-900 shadow-xs'
                    : 'bg-slate-100/80 border-slate-200 text-slate-400 line-through'
                }`}
              >
                <span>المحامي ومنطوق الحكم</span>
                {visibleColumns.lawyerVerdict ? <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {/* Top Summary Stats */}
              <button
                type="button"
                onClick={() => toggleColumn('statsSummary')}
                className={`p-2 rounded-xl border text-right font-bold transition flex items-center justify-between cursor-pointer ${
                  visibleColumns.statsSummary
                    ? 'bg-white border-amber-400 text-slate-900 shadow-xs'
                    : 'bg-slate-100/80 border-slate-200 text-slate-400 line-through'
                }`}
              >
                <span>شريط ملخص الإحصاءات</span>
                {visibleColumns.statsSummary ? <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

            </div>
          </div>
        )}

        {/* Options & Search Bar */}
        <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print text-xs">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isEnforcementReport 
                  ? "بحث برقم طلب التنفيذ، طالب التنفيذ، المنفذ ضده، السند، المبلغ أو الملاحظات..." 
                  : activeReportType === 'lawyer_cases'
                  ? "بحث في قضايا المحامي برقم القضية، الموكل، المحكمة، منطوق الحكم، الإجراءات..."
                  : "بحث برقم الدعوى، المحكمة، الموكل، صفة الشركة، الخصم، أو منطوق الحكم..."
              }
              className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />
          </div>

          {/* Office Name Customizer */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[240px] max-w-sm">
            <span className="font-bold text-slate-700 shrink-0">اسم الترويسة:</span>
            <input
              type="text"
              value={officeName}
              onChange={(e) => setOfficeName(e.target.value)}
              placeholder="اسم المكتب أو المحامي للطباعة والتصدير..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-semibold text-slate-800 focus:bg-white transition"
            />
          </div>

          {/* Quick Metrics Badges */}
          {isEnforcementReport ? (
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <span className="bg-blue-50 text-blue-900 px-3 py-1.5 rounded-xl border border-blue-200">
                إجمالي المبالغ: <span className="text-blue-950 font-black font-mono">{formatCurrency(stats.enforcementTotalAmount)}</span> ريال
              </span>
              <span className="bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-200">
                المسدد: <span className="text-emerald-950 font-black font-mono">{formatCurrency(stats.enforcementPaidAmount)}</span> ريال
              </span>
            </div>
          ) : activeReportType === 'lawyer_cases' ? (
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <span className="bg-indigo-50 text-indigo-950 px-3 py-1.5 rounded-xl border border-indigo-200">
                المحامي: <span className="text-indigo-900 font-black">{selectedLawyer || 'كافة المحامين'}</span>
              </span>
              <span className="bg-amber-50 text-amber-950 px-3 py-1.5 rounded-xl border border-amber-200">
                قضايا نشطة: <span className="text-amber-700 font-black font-mono">{reportCases.filter(c => !isCaseClosed(c)).length}</span>
              </span>
              <span className="bg-emerald-50 text-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-200">
                منتهية: <span className="text-emerald-700 font-black font-mono">{reportCases.filter(c => isCaseClosed(c)).length}</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <span className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                أحكام نهائية: <span className="text-emerald-700 font-black font-mono">{stats.finalJudgments}</span>
              </span>
              <span className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                أحكام قابلة للاستئناف: <span className="text-sky-700 font-black font-mono">{stats.appealableJudgments}</span>
              </span>
            </div>
          )}

        </div>

        {/* Printable & Scrollable Table Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60 print:p-0 print:bg-white">
          
          {/* Printable Official Header (A4 Landscape Formatted Table Header) */}
          <div className="hidden print:block mb-5 border-b-2 border-slate-900 pb-3 print-break-inside-avoid">
            <div className="flex items-center justify-between mb-2">
              <div className="text-right">
                <span className="font-extrabold text-base block text-slate-950">{officeName}</span>
                <span className="text-xs text-slate-600 block">مركز التقارير والإحصاءات القضائية وإدارة القضايا والجلسات والتنفيذ</span>
              </div>

              <div className="flex flex-col items-center justify-center">
                <AppLogo size="lg" showRing={true} className="mb-1 print:w-14 print:h-14" />
                <span className="text-[10px] font-black text-slate-900">
                  {isEnforcementReport ? 'تقرير قضايا التنفيذ المالي' : activeReportType === 'lawyer_cases' ? 'تقرير قضايا المحامين' : 'تقرير جدول القضايا'}
                </span>
              </div>

              <div className="text-left text-xs text-slate-800 space-y-0.5">
                <div>تاريخ التقرير: <strong className="font-mono font-bold text-slate-950">{formatArabicDate(getTodayString())}</strong></div>
                <div className="text-[11px] text-emerald-800 font-bold">الموافق: {formatHijriDate(getTodayString())}</div>
                <div className="text-[11px] text-slate-600">إجمالي البنود بالتقرير: <strong className="font-mono">{reportCases.length}</strong></div>
              </div>
            </div>

            <div className="text-center pt-2">
              <h1 className="text-xl font-black text-slate-950">
                {getReportTitle()}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                تاريخ الاستخراج: {formatArabicDate(getTodayString())} (الموافق: {formatHijriDate(getTodayString(), { includeWeekday: true })})
              </p>
            </div>

            {/* Printable Summary Mini Table */}
            {visibleColumns.statsSummary && (
              isEnforcementReport ? (
                <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[10px] font-bold border border-slate-400 rounded-lg overflow-hidden bg-slate-50">
                  <div className="p-1.5 border-l border-slate-400">
                    <span className="text-slate-600 block">إجمالي طلبات التنفيذ</span>
                    <span className="text-slate-950 font-black text-xs font-mono">{stats.enforcementCount}</span>
                  </div>
                  <div className="p-1.5 border-l border-slate-400 bg-emerald-50">
                    <span className="text-emerald-900 block">تنفيذ نشط</span>
                    <span className="text-emerald-950 font-black text-xs font-mono">{stats.enforcementActiveCount}</span>
                  </div>
                  <div className="p-1.5 border-l border-slate-400 bg-amber-50">
                    <span className="text-amber-900 block">إجمالي مبالغ التنفيذ</span>
                    <span className="text-amber-950 font-black text-xs font-mono">{formatCurrency(stats.enforcementTotalAmount)} ريال</span>
                  </div>
                  <div className="p-1.5 border-l border-slate-400 bg-sky-50">
                    <span className="text-sky-900 block">المبالغ المسددة</span>
                    <span className="text-sky-950 font-black text-xs font-mono">{formatCurrency(stats.enforcementPaidAmount)} ريال</span>
                  </div>
                  <div className="p-1.5 bg-rose-50">
                    <span className="text-rose-900 block">المبالغ المتبقية</span>
                    <span className="text-rose-950 font-black text-xs font-mono">{formatCurrency(stats.enforcementRemainingAmount)} ريال</span>
                  </div>
                </div>
              ) : activeReportType === 'lawyer_cases' ? (
                <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[10px] font-bold border border-slate-400 rounded-lg overflow-hidden bg-slate-50">
                  <div className="p-1.5 border-l border-slate-400 bg-indigo-50">
                    <span className="text-indigo-900 block">المحامي المترافع</span>
                    <span className="text-indigo-950 font-black text-xs">{selectedLawyer || 'كافة المحامين'}</span>
                  </div>
                  <div className="p-1.5 border-l border-slate-400">
                    <span className="text-slate-600 block">إجمالي القضايا</span>
                    <span className="text-slate-950 font-black text-xs font-mono">{reportCases.length}</span>
                  </div>
                  <div className="p-1.5 border-l border-slate-400 bg-amber-50">
                    <span className="text-amber-900 block">قضايا نشطة</span>
                    <span className="text-amber-950 font-black text-xs font-mono">{reportCases.filter(c => !isCaseClosed(c)).length}</span>
                  </div>
                  <div className="p-1.5 border-l border-slate-400 bg-emerald-50">
                    <span className="text-emerald-900 block">قضايا منتهية</span>
                    <span className="text-emerald-950 font-black text-xs font-mono">{reportCases.filter(c => isCaseClosed(c)).length}</span>
                  </div>
                  <div className="p-1.5 bg-teal-50">
                    <span className="text-teal-900 block">الموكلين المترافع عنهم</span>
                    <span className="text-teal-950 font-black text-xs font-mono">{Array.from(new Set(reportCases.map(c => c.clientName).filter(Boolean))).length} موكل</span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-6 gap-1 text-center text-[10px] font-bold border border-slate-400 rounded-lg overflow-hidden bg-slate-50">
                  <div className="p-1.5 border-l border-slate-400">
                    <span className="text-slate-600 block">إجمالي القضايا</span>
                    <span className="text-slate-950 font-black text-xs font-mono">{stats.totalLitigation}</span>
                  </div>
                  <div className="p-1.5 border-l border-slate-400 bg-amber-50">
                    <span className="text-amber-900 block">قضايا نشطة</span>
                    <span className="text-amber-950 font-black text-xs font-mono">{stats.activeCount}</span>
                  </div>
                  <div className="p-1.5 border-l border-slate-400 bg-emerald-50">
                    <span className="text-emerald-900 block">قضايا منتهية</span>
                    <span className="text-emerald-950 font-black text-xs font-mono">{stats.inactiveCount}</span>
                  </div>
                  <div className="p-1.5 border-l border-slate-400 bg-emerald-100/60">
                    <span className="text-emerald-950 block">أحكام نهائية</span>
                    <span className="text-emerald-950 font-black text-xs font-mono">{stats.finalJudgments}</span>
                  </div>
                  <div className="p-1.5 border-l border-slate-400 bg-sky-50">
                    <span className="text-sky-900 block">أحكام قابلة للاستئناف</span>
                    <span className="text-sky-950 font-black text-xs font-mono">{stats.appealableJudgments}</span>
                  </div>
                  <div className="p-1.5 bg-teal-50">
                    <span className="text-teal-900 block">ساعد (مدعي / مدعى عليه)</span>
                    <span className="text-teal-950 font-black text-xs font-mono">{stats.saaedPlaintiffCount} / {stats.saaedDefendantCount}</span>
                  </div>
                </div>
              )
            )}
          </div>

          {reportCases.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">لا توجد بيانات تطابق محددات هذا التقرير</p>
              <p className="text-xs text-slate-500">جرب تغيير فئة التقرير أو إفراغ خانة البحث</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-2 print:border-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs sm:text-sm print:text-[9.5pt]">
                  <thead>
                    <tr className="bg-slate-900 text-slate-200 border-b border-slate-800 text-[11px] sm:text-xs print:bg-slate-100 print:text-slate-950 print:border-slate-900 print:border-b-2 font-black">
                      {visibleColumns.index && (
                        <th className="p-2.5 w-8 text-center border-l border-slate-800 print:border-slate-400">م</th>
                      )}
                      
                      {isEnforcementReport ? (
                        <>
                          {visibleColumns.caseNumber && (
                            <th className="p-2.5 w-28 text-center whitespace-nowrap border-l border-slate-800 print:border-slate-400">رقم طلب التنفيذ</th>
                          )}
                          {visibleColumns.courtCircuit && (
                            <th className="p-2.5 w-32 whitespace-nowrap border-l border-slate-800 print:border-slate-400">نوع السند التنفيذي</th>
                          )}
                          {visibleColumns.clientName && (
                            <th className="p-2.5 w-36 whitespace-nowrap border-l border-slate-800 print:border-slate-400">طالب التنفيذ</th>
                          )}
                          {visibleColumns.opponent && (
                            <th className="p-2.5 w-36 whitespace-nowrap border-l border-slate-800 print:border-slate-400">المنفذ ضده</th>
                          )}
                          {visibleColumns.enforcementAmounts && (
                            <>
                              <th className="p-2.5 w-28 text-center whitespace-nowrap border-l border-slate-800 print:border-slate-400">مبلغ التنفيذ</th>
                              <th className="p-2.5 w-24 text-center whitespace-nowrap border-l border-slate-800 print:border-slate-400">المسدد</th>
                              <th className="p-2.5 w-24 text-center whitespace-nowrap border-l border-slate-800 print:border-slate-400">المتبقي</th>
                            </>
                          )}
                          {visibleColumns.status && (
                            <th className="p-2.5 w-28 text-center whitespace-nowrap border-l border-slate-800 print:border-slate-400">حالة السداد والتنفيذ</th>
                          )}
                          {visibleColumns.sessionDate && (
                            <th className="p-2.5 w-24 text-center whitespace-nowrap border-l border-slate-800 print:border-slate-400">تاريخ القيد</th>
                          )}
                          {visibleColumns.titleDemands && (
                            <th className="p-2.5 border-l border-slate-800 print:border-slate-400">ملاحظات وموضوع التنفيذ</th>
                          )}
                        </>
                      ) : (
                        <>
                          {visibleColumns.caseNumber && (
                            <th className="p-2.5 w-24 text-center whitespace-nowrap border-l border-slate-800 print:border-slate-400">رقم الدعوى والسنة</th>
                          )}
                          {visibleColumns.courtCircuit && (
                            <th className="p-2.5 w-32 whitespace-nowrap border-l border-slate-800 print:border-slate-400">المحكمة والدائرة</th>
                          )}
                          {visibleColumns.titleDemands && (
                            <th className="p-2.5 border-l border-slate-800 print:border-slate-400">موضوع القضية والمطلوب</th>
                          )}
                          {visibleColumns.clientName && (
                            <th className="p-2.5 w-32 whitespace-nowrap border-l border-slate-800 print:border-slate-400">اسم الشركة / الموكل</th>
                          )}
                          {visibleColumns.clientRole && (
                            <th className="p-2.5 w-24 text-center whitespace-nowrap border-l border-slate-800 print:border-slate-400 bg-slate-800/80 text-amber-300 print:bg-slate-200 print:text-slate-950">
                              صفة الشركة
                            </th>
                          )}
                          {visibleColumns.opponent && (
                            <th className="p-2.5 w-32 whitespace-nowrap border-l border-slate-800 print:border-slate-400">الخصم ومحاميه</th>
                          )}
                          {visibleColumns.status && (
                            <th className="p-2.5 w-32 text-center whitespace-nowrap border-l border-slate-800 print:border-slate-400">حالة القضية والإنهاء</th>
                          )}
                          {visibleColumns.sessionDate && (
                            <th className="p-2.5 w-28 text-center whitespace-nowrap border-l border-slate-800 print:border-slate-400">تاريخ الجلسة / الحكم</th>
                          )}
                          {visibleColumns.lawyerVerdict && (
                            <th className="p-2.5 w-36">المحامي الحاضر / المنطوق</th>
                          )}
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 print:divide-slate-400">
                    {reportCases.map((c, index) => {
                      const enf = c.enforcement;
                      const closed = isCaseClosed(c);
                      const isPlaintiff = c.clientRole === 'مدعي' || c.clientRole === 'طاعن' || c.clientRole === 'مستأنف' || c.clientRole === 'طالب تنفيذ';

                      return (
                        <tr 
                          key={c.id}
                          onClick={() => onOpenCaseDetails(c)}
                          className="hover:bg-amber-50/50 transition cursor-pointer group print:break-inside-avoid print:border-b print:border-slate-400"
                        >
                          {/* 1. Index */}
                          {visibleColumns.index && (
                            <td className="p-2.5 text-slate-400 print:text-slate-900 font-mono text-xs align-top font-bold text-center border-l border-slate-100 print:border-slate-400">
                              {index + 1}
                            </td>
                          )}

                          {isEnforcementReport ? (
                            <>
                              {/* Enforcement Number */}
                              {visibleColumns.caseNumber && (
                                <td className="p-2.5 whitespace-nowrap align-top text-center border-l border-slate-100 print:border-slate-400 font-mono font-bold text-blue-900 text-xs">
                                  {enf?.enforcementNumber || c.caseNumber || '-'}
                                </td>
                              )}

                              {/* Deed Type */}
                              {visibleColumns.courtCircuit && (
                                <td className="p-2.5 align-top border-l border-slate-100 print:border-slate-400">
                                  <span className="font-bold text-slate-900 block text-xs">
                                    {enf?.deedType === 'أخرى' && enf.customDeedType ? enf.customDeedType : (enf?.deedType || 'صك حكم')}
                                  </span>
                                </td>
                              )}

                              {/* Applicant */}
                              {visibleColumns.clientName && (
                                <td className="p-2.5 align-top border-l border-slate-100 print:border-slate-400">
                                  <span className="font-bold text-slate-900 block text-xs">
                                    {enf?.applicantName || c.clientName}
                                  </span>
                                </td>
                              )}

                              {/* Respondent */}
                              {visibleColumns.opponent && (
                                <td className="p-2.5 align-top border-l border-slate-100 print:border-slate-400">
                                  <span className="text-slate-900 font-semibold block text-xs">
                                    {enf?.respondentName || c.opponentName}
                                  </span>
                                </td>
                              )}

                              {/* Amounts */}
                              {visibleColumns.enforcementAmounts && (
                                <>
                                  <td className="p-2.5 whitespace-nowrap align-top text-center border-l border-slate-100 print:border-slate-400 font-mono font-bold text-emerald-900 text-xs">
                                    {enf?.amount ? `${enf.amount} ريال` : '-'}
                                  </td>
                                  <td className="p-2.5 whitespace-nowrap align-top text-center border-l border-slate-100 print:border-slate-400 font-mono font-semibold text-sky-800 text-xs">
                                    {enf?.paymentStatus === 'سداد كلي' ? `${enf.amount} ريال` : (enf?.paidAmount ? `${enf.paidAmount} ريال` : '0')}
                                  </td>
                                  <td className="p-2.5 whitespace-nowrap align-top text-center border-l border-slate-100 print:border-slate-400 font-mono font-bold text-rose-800 text-xs">
                                    {enf?.paymentStatus === 'سداد كلي' ? '0' : (enf?.remainingAmount ? `${enf.remainingAmount} ريال` : '-')}
                                  </td>
                                </>
                              )}

                              {/* Status */}
                              {visibleColumns.status && (
                                <td className="p-2.5 align-top text-center border-l border-slate-100 print:border-slate-400">
                                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black block text-center mb-1 ${
                                    (enf?.enforcementStatus || 'نشط') === 'نشط'
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                                  }`}>
                                    {enf?.enforcementStatus || (c.status === 'judged' ? 'منتهي' : 'نشط')}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    enf?.paymentStatus === 'سداد كلي' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                                  }`}>
                                    {enf?.paymentStatus || 'سداد جزئي'}
                                  </span>
                                </td>
                              )}

                              {/* Request Date */}
                              {visibleColumns.sessionDate && (
                                <td className="p-2.5 whitespace-nowrap align-top text-center border-l border-slate-100 print:border-slate-400 text-xs font-semibold text-slate-700">
                                  {enf?.requestDate ? formatArabicDate(enf.requestDate) : '-'}
                                </td>
                              )}

                              {/* Notes */}
                              {visibleColumns.titleDemands && (
                                <td className="p-2.5 align-top border-l border-slate-100 print:border-slate-400 text-xs text-slate-600">
                                  {enf?.notes || c.demands || c.title || '-'}
                                </td>
                              )}
                            </>
                          ) : (
                            <>
                              {/* 2. Case Number */}
                              {visibleColumns.caseNumber && (
                                <td className="p-2.5 whitespace-nowrap align-top text-center border-l border-slate-100 print:border-slate-400">
                                  <span className="font-black font-mono text-slate-900 text-xs sm:text-sm block">
                                    {c.caseNumber}
                                  </span>
                                  <span className="text-[10px] text-slate-600 font-bold block">
                                    لسنة {c.caseYear}
                                  </span>
                                  {c.judge && (
                                    <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">
                                      القاضي: {c.judge}
                                    </span>
                                  )}
                                </td>
                              )}

                              {/* 3. Court & Circuit */}
                              {visibleColumns.courtCircuit && (
                                <td className="p-2.5 align-top border-l border-slate-100 print:border-slate-400">
                                  <span className="font-bold text-slate-900 block text-xs">
                                    {c.court}
                                  </span>
                                  <span className="text-slate-600 text-[11px] block mt-0.5">
                                    {c.circuit}
                                  </span>
                                </td>
                              )}

                              {/* 4. Title & Demands */}
                              {visibleColumns.titleDemands && (
                                <td className="p-2.5 align-top max-w-xs border-l border-slate-100 print:border-slate-400">
                                  <span className="font-bold text-slate-900 group-hover:text-amber-700 transition line-clamp-2 block text-xs">
                                    {c.title}
                                  </span>
                                  {c.demands && (
                                    <span className="text-slate-600 text-[11px] block mt-1 line-clamp-2 bg-slate-50 print:bg-transparent p-1 rounded border border-slate-200 print:border-0">
                                      <strong>المطلوب:</strong> {c.demands}
                                    </span>
                                  )}
                                </td>
                              )}

                              {/* 5. Company / Client Name */}
                              {visibleColumns.clientName && (
                                <td className="p-2.5 align-top border-l border-slate-100 print:border-slate-400">
                                  <span className="font-bold text-slate-900 block text-xs">
                                    {c.clientName}
                                  </span>
                                </td>
                              )}

                              {/* 6. Company Role */}
                              {visibleColumns.clientRole && (
                                <td className="p-2.5 align-top text-center border-l border-slate-100 print:border-slate-400">
                                  <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-black border ${
                                    isPlaintiff
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30'
                                      : 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400/30'
                                  }`}>
                                    {c.clientRole}
                                  </span>
                                </td>
                              )}

                              {/* 7. Opponent */}
                              {visibleColumns.opponent && (
                                <td className="p-2.5 align-top border-l border-slate-100 print:border-slate-400">
                                  <span className="text-slate-900 font-semibold block text-xs">
                                    {c.opponentName}
                                  </span>
                                  {c.opponentLawyer ? (
                                    <span className="text-slate-500 text-[10px] block mt-0.5">
                                      محامي الخصم: <strong className="text-slate-700">{c.opponentLawyer}</strong>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px] block mt-0.5">
                                      بدون محامٍ
                                    </span>
                                  )}
                                </td>
                              )}

                              {/* 8. Status & Judgment Type */}
                              {visibleColumns.status && (
                                <td className="p-2.5 align-top text-center border-l border-slate-100 print:border-slate-400">
                                  {closed ? (
                                    <div>
                                      {c.judgmentType === 'final' ? (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[11px] font-bold block text-center mb-1">
                                          ⚖️ حكم نهائي (بات)
                                        </span>
                                      ) : c.judgmentType === 'appealable' ? (
                                        <span className="px-2 py-0.5 bg-sky-100 text-sky-900 border border-sky-300 rounded-lg text-[11px] font-bold block text-center mb-1">
                                          ⏳ حكم قابل للاستئناف
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[11px] font-bold block text-center mb-1">
                                          ⚖️ قضية منتهية
                                        </span>
                                      )}
                                      <span className="text-[9px] text-slate-500 block text-center">
                                        {c.sessionStage}
                                      </span>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold block text-center mb-1">
                                        🟢 قضية متداولة (نشطة)
                                      </span>
                                      <span className="text-[10px] text-slate-600 block text-center font-medium">
                                        المرحلة: {c.sessionStage}
                                      </span>
                                    </div>
                                  )}
                                </td>
                              )}

                              {/* 9. Session Date */}
                              {visibleColumns.sessionDate && (
                                <td className="p-2.5 whitespace-nowrap align-top text-center border-l border-slate-100 print:border-slate-400">
                                  <div className="font-bold text-slate-900 text-xs">
                                    {formatArabicDate(c.sessionDate)}
                                  </div>
                                  <div className="text-[10px] text-emerald-800 font-medium">
                                    {formatHijriDate(c.sessionDate)}
                                  </div>
                                  <div className="font-mono text-[11px] text-amber-800 font-bold mt-0.5">
                                    {formatArabicTime(c.sessionTime)}
                                  </div>
                                </td>
                              )}

                              {/* 10. Lawyer & Verdict */}
                              {visibleColumns.lawyerVerdict && (
                                <td className="p-2.5 align-top max-w-xs">
                                  {c.assignedLawyer && (
                                    <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1 mb-1">
                                      <UserCheck className="w-3 h-3 text-amber-700 shrink-0" />
                                      <span>{c.assignedLawyer}</span>
                                    </div>
                                  )}
                                  {c.verdictText ? (
                                    <div className="bg-emerald-50 text-emerald-950 p-1.5 rounded-lg border border-emerald-200 text-[10px] leading-relaxed font-semibold">
                                      <span className="font-black text-emerald-950 block mb-0.5">منطوق الحكم:</span>
                                      <p className="line-clamp-2">{c.verdictText}</p>
                                    </div>
                                  ) : c.previousDecision ? (
                                    <span className="text-[10px] text-slate-600 block">
                                      القرار السابق: {c.previousDecision}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 block">-</span>
                                  )}
                                </td>
                              )}
                            </>
                          )}

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Printable Official Footer */}
          <div className="hidden print:flex mt-6 pt-3 border-t-2 border-slate-900 text-slate-700 text-xs items-center justify-between print-break-inside-avoid">
            <div>
              <span className="font-bold block">نظام إدارة ومتابعة القضايا والتقارير القضائية والتنفيذ الذكي</span>
              <span className="text-[10px] text-slate-500">تم استخراج التقرير رسمياً بتاريخ: {formatArabicDate(getTodayString())}</span>
            </div>

            <div className="text-center font-bold">
              <span>المكتب: {officeName}</span>
            </div>

            <div className="text-left font-bold font-mono text-[11px]">
              <span>اعتماد وتوقيع المستشار: ........................</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 no-print">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>انقر على أي صف في الجدول لعرض التفاصيل الكاملة والمستندات ومذكرات الدفاع</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
          >
            إغلاق نافذة التقارير
          </button>
        </div>

      </div>
    </div>
  );
};
