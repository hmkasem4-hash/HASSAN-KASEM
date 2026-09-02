import React, { useState, useMemo, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Scale, 
  Gavel, 
  CheckCircle2, 
  Search, 
  Filter, 
  Printer, 
  Plus, 
  Trash2, 
  Eye, 
  BookOpen, 
  Building2, 
  FileType,
  Loader2,
  FileCheck,
  Copy,
  Check,
  HelpCircle,
  Briefcase,
  Landmark,
  RotateCcw,
  Download,
  AlertTriangle,
  FolderArchive,
  Calendar,
  User,
  ShieldCheck,
  FileUp,
  ExternalLink,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ArchivedJudgment, CaseAttachment, CourtCase, JudgmentCategory } from '../types';
import { formatArabicDate, formatHijriDate, getTodayString } from '../utils/dateUtils';
import { AppLogo } from './AppLogo';

interface JudgmentsArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  judgments: ArchivedJudgment[];
  onAddJudgment: (j: ArchivedJudgment) => void;
  onUpdateJudgment: (j: ArchivedJudgment) => void;
  onDeleteJudgment: (id: string) => void;
  onOpenDraftingWithJudgment?: (j: ArchivedJudgment) => void;
  cases?: CourtCase[];
}

// Visual category metadata definition
export interface CategoryMeta {
  id: JudgmentCategory;
  label: string;
  shortLabel: string;
  degreeName: string;
  icon: string;
  themeColor: string;
  badgeClass: string;
  activeClass: string;
  borderClass: string;
  bgLightClass: string;
  uploadButtonClass: string;
  description: string;
  examples: string;
}

export const JUDGMENT_CATEGORIES: CategoryMeta[] = [
  {
    id: 'first_instance',
    label: 'أحكام أول درجة (المحاكم الابتدائية)',
    shortLabel: 'أول درجة',
    degreeName: 'الدرجة الأولى (المحاكم الابتدائية)',
    icon: '🏛️',
    themeColor: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    activeClass: 'bg-emerald-800 text-white shadow-md ring-2 ring-emerald-400',
    borderClass: 'border-emerald-500',
    bgLightClass: 'bg-emerald-50/70',
    uploadButtonClass: 'bg-emerald-700 hover:bg-emerald-600 text-white',
    description: 'أحكام المحاكم العامة، التجارية، الجزائية، والأحوال الشخصية الابتدائية',
    examples: 'صكوك الدوائر العامة، الدوائر التجارية الابتدائية، دوائر الأحوال'
  },
  {
    id: 'supreme_cassation',
    label: 'أحكام المحكمة العليا / النقض',
    shortLabel: 'العليا / النقض',
    degreeName: 'المحكمة العليا وهيئات النقض',
    icon: '👑',
    themeColor: 'purple',
    badgeClass: 'bg-purple-50 text-purple-900 border-purple-300',
    activeClass: 'bg-purple-800 text-white shadow-md ring-2 ring-purple-400',
    borderClass: 'border-purple-500',
    bgLightClass: 'bg-purple-50/70',
    uploadButtonClass: 'bg-purple-700 hover:bg-purple-600 text-white',
    description: 'قرارات ومبادئ المحكمة العليا وهيئات النقض وإرساء السوابق القضائية',
    examples: 'قرارات الهيئة العامة للمحكمة العليا، دوائر النقض التجارية والجزائية'
  },
  {
    id: 'labor',
    label: 'الأحكام العمالية',
    shortLabel: 'العمالية',
    degreeName: 'المحاكم والدوائر العمالية',
    icon: '💼',
    themeColor: 'teal',
    badgeClass: 'bg-teal-50 text-teal-900 border-teal-300',
    activeClass: 'bg-teal-800 text-white shadow-md ring-2 ring-teal-400',
    borderClass: 'border-teal-500',
    bgLightClass: 'bg-teal-50/70',
    uploadButtonClass: 'bg-teal-700 hover:bg-teal-600 text-white',
    description: 'أحكام المحاكم العمالية: إنهاء العقود، الأجور، والتعويضات ومكافأة نهاية الخدمة',
    examples: 'دعاوى المادة 77 و80، مطالبات الأجور المتأخرة، بدلات التذاكر والإجازات'
  },
  {
    id: 'appeal',
    label: 'أحكام محاكم الاستئناف',
    shortLabel: 'الاستئناف',
    degreeName: 'محاكم ودوائر الاستئناف',
    icon: '📜',
    themeColor: 'blue',
    badgeClass: 'bg-blue-50 text-blue-900 border-blue-300',
    activeClass: 'bg-blue-800 text-white shadow-md ring-2 ring-blue-400',
    borderClass: 'border-blue-500',
    bgLightClass: 'bg-blue-50/70',
    uploadButtonClass: 'bg-blue-700 hover:bg-blue-600 text-white',
    description: 'أحكام دوائر الاستئناف بتأييد أو تعديل أو إلغاء الأحكام الابتدائية',
    examples: 'صكوك تأييد الأحكام، أحكام نقض أو تعديل منطوق الدرجة الأولى'
  },
  {
    id: 'administrative',
    label: 'الأحكام الإدارية (ديوان المظالم)',
    shortLabel: 'الإدارية (ديوان المظالم)',
    degreeName: 'المحاكم الإدارية بديوان المظالم',
    icon: '🏢',
    themeColor: 'indigo',
    badgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-300',
    activeClass: 'bg-indigo-800 text-white shadow-md ring-2 ring-indigo-400',
    borderClass: 'border-indigo-500',
    bgLightClass: 'bg-indigo-50/70',
    uploadButtonClass: 'bg-indigo-700 hover:bg-indigo-600 text-white',
    description: 'أحكام قضاء الإلغاء والتعويض والعقود الإدارية ومنازعات الأجهزة الحكومية',
    examples: 'إلغاء قرارات وزارية، دعاوى التعويض الإداري، منازعات العقود الحكومية'
  },
  {
    id: 'other',
    label: 'أحكام ولجان أخرى',
    shortLabel: 'أخرى ولجان',
    degreeName: 'اللجان شبه القضائية والهيئات التحكيمية',
    icon: '⚖️',
    themeColor: 'amber',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
    activeClass: 'bg-amber-800 text-white shadow-md ring-2 ring-amber-400',
    borderClass: 'border-amber-500',
    bgLightClass: 'bg-amber-50/70',
    uploadButtonClass: 'bg-amber-700 hover:bg-amber-600 text-white',
    description: 'قرارات اللجان شبه القضائية والمصرفية والتأمينية والجمركية والتحكيم',
    examples: 'لجنة منازعات الأوراق المالية، اللجان المصرفية، لجان التأمين'
  }
];

export const JudgmentsArchiveModal: React.FC<JudgmentsArchiveModalProps> = ({
  isOpen,
  onClose,
  judgments,
  onAddJudgment,
  onUpdateJudgment,
  onDeleteJudgment,
  onOpenDraftingWithJudgment,
  cases = [],
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'archive' | 'inspect' | 'guide'>('archive');
  
  // Selected category filter: 'all' or specific JudgmentCategory
  const [selectedCategory, setSelectedCategory] = useState<JudgmentCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourt, setSelectedCourt] = useState<string>('all');

  // Selected Judgment for Inspection / Reading
  const [inspectingJudgment, setInspectingJudgment] = useState<ArchivedJudgment | null>(null);

  // Quick Category Upload Modal state (when clicking upload from a specific degree)
  const [activeUploadCategory, setActiveUploadCategory] = useState<JudgmentCategory | null>(null);
  const [uploadCustomTitle, setUploadCustomTitle] = useState('');
  const [uploadCustomNotes, setUploadCustomNotes] = useState('');
  const [uploadLinkedCaseId, setUploadLinkedCaseId] = useState('');
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<CaseAttachment | null>(null);
  const [rawTextExtracted, setRawTextExtracted] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Copy Feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: judgments.length,
      first_instance: 0,
      supreme_cassation: 0,
      labor: 0,
      appeal: 0,
      administrative: 0,
      other: 0
    };

    judgments.forEach(j => {
      const cat = j.category || 'first_instance';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return counts;
  }, [judgments]);

  // Filtered Judgments List
  const filteredJudgments = useMemo(() => {
    return judgments.filter((j) => {
      const jCat = j.category || 'first_instance';
      
      // 1. Category Filter
      if (selectedCategory !== 'all' && jCat !== selectedCategory) {
        return false;
      }

      // 2. Search Query Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchTitle = (j.title || '').toLowerCase().includes(q);
        const matchDeed = (j.deedNumber || '').toLowerCase().includes(q);
        const matchCase = (j.caseNumber || '').toLowerCase().includes(q);
        const matchCourt = (j.court || '').toLowerCase().includes(q);
        const matchNotes = (j.notes || '').toLowerCase().includes(q);
        const matchVerdict = (j.verdictText || '').toLowerCase().includes(q);
        const matchClient = (j.clientName || '').toLowerCase().includes(q);
        const matchOpponent = (j.opponentName || '').toLowerCase().includes(q);
        const matchFile = (j.fileAttachment?.name || '').toLowerCase().includes(q);

        if (!(matchTitle || matchDeed || matchCase || matchCourt || matchNotes || matchVerdict || matchClient || matchOpponent || matchFile)) {
          return false;
        }
      }

      // 3. Court Filter
      if (selectedCourt !== 'all' && j.court !== selectedCourt) {
        return false;
      }

      return true;
    });
  }, [judgments, selectedCategory, searchTerm, selectedCourt]);

  // Unique Courts for filter dropdown
  const courtsList = useMemo(() => {
    const set = new Set<string>();
    judgments.forEach(j => { if (j.court) set.add(j.court); });
    return Array.from(set);
  }, [judgments]);

  if (!isOpen) return null;

  // Helper to create & process a file into a direct Archived Judgment
  const processAndArchiveFile = (
    file: File, 
    category: JudgmentCategory, 
    customTitle?: string, 
    notes?: string,
    linkedCaseId?: string
  ) => {
    setIsUploading(true);

    const fileType = file.name.endsWith('.pdf') 
      ? 'pdf' 
      : (file.name.endsWith('.doc') || file.name.endsWith('.docx') ? 'word' : 'other');

    const cleanFileName = file.name.replace(/\.[^/.]+$/, "");
    const deedNum = `${Math.floor(100000 + Math.random() * 900000)}`;
    const todayStr = getTodayString();
    const deedDate = formatArabicDate(todayStr);

    const categoryMeta = JUDGMENT_CATEGORIES.find(c => c.id === category) || JUDGMENT_CATEGORIES[0];
    const finalTitle = customTitle?.trim() || `صك ${categoryMeta.shortLabel} - ${cleanFileName}`;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      const attachment: CaseAttachment = {
        id: 'att-' + Date.now(),
        name: file.name,
        size: file.size,
        type: fileType,
        dataUrl,
        uploadedAt: new Date().toISOString()
      };

      // Create streamlined judgment with zero friction
      const newJudgment: ArchivedJudgment = {
        id: 'jdg-' + Date.now(),
        title: finalTitle,
        category,
        deedNumber: deedNum,
        deedDate,
        caseNumber: 'مرفق بالصك',
        caseYear: new Date().getFullYear().toString(),
        court: categoryMeta.degreeName,
        circuit: 'الدائرة المختصة',
        judge: 'الهيئة القضائية بالصك',
        clientName: 'الموكل',
        clientRole: 'مدعي / مستأنف',
        opponentName: 'الخصم',
        judgmentDate: todayStr,
        judgmentType: category === 'supreme_cassation' ? 'final' : 'appealable',
        verdictText: `صك حكم رسمي تم رفعه وأرشفته مباشرة في خانة (${categoryMeta.label}) - انظر الملف المرفق للاطلاع الكامل.`,
        factsAndMerits: 'مضمنة في ملف صك الحكم المرفق',
        legalReasons: 'مضمنة في ملف صك الحكم المرفق',
        fileAttachment: attachment,
        rawText: cleanFileName,
        tags: [categoryMeta.shortLabel, 'صك مرفوع', 'أرشيف مباشر'],
        notes: notes?.trim() || undefined,
        linkedCaseId: linkedCaseId || undefined,
        createdAt: todayStr,
        updatedAt: todayStr
      };

      onAddJudgment(newJudgment);
      setIsUploading(false);
      setActiveUploadCategory(null);
      setSelectedFileForUpload(null);
      setUploadCustomTitle('');
      setUploadCustomNotes('');
      setUploadLinkedCaseId('');
      showToast(`تم رفع وأرشفة صك الحكم في خانة [${categoryMeta.label}] بنجاح!`);
    };

    reader.readAsDataURL(file);
  };

  // Direct file input handler from a specific category box
  const handleDirectCategoryFileChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    category: JudgmentCategory
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAndArchiveFile(file, category);
    // Reset file input value
    e.target.value = '';
  };

  // Copy Full Judgment Info to Clipboard
  const handleCopyJudgmentInfo = (j: ArchivedJudgment) => {
    const catLabel = JUDGMENT_CATEGORIES.find(c => c.id === j.category)?.label || 'صك حكم قضائي';
    const textToCopy = `المملكة العربية السعودية - وزارة العدل
${catLabel}
==================================================
عنوان الصك: ${j.title}
رقم الصك: ${j.deedNumber}
تاريخ الصك والأرشفة: ${j.deedDate}
الجهة / الدرجة: ${j.court}
الملف الأصلي المرفق: ${j.fileAttachment ? j.fileAttachment.name : 'لا يوجد ملف'}
${j.notes ? `ملاحظات: ${j.notes}` : ''}
==================================================
تم النسخ من أرشيف وتوثيق صكوك الأحكام القضائية (HK Law)`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(j.id);
    showToast(`تم نسخ بيانات صك الحكم #${j.deedNumber} بنجاح!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Official Print Function
  const handlePrintJudgment = (j: ArchivedJudgment) => {
    const todayStr = getTodayString();
    const gregorianDate = formatArabicDate(todayStr);
    const hijriDate = formatHijriDate(todayStr, { includeWeekday: true });
    const catMeta = JUDGMENT_CATEGORIES.find(c => c.id === j.category) || JUDGMENT_CATEGORIES[0];

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('يرجى السماح بالنوافذ المنبثقة لطباعة صك الحكم');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>صك حكم قضائي - ${j.deedNumber}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body {
            font-family: 'Traditional Arabic', 'Amiri', 'Segoe UI', Tahoma, sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.65;
            color: #0f172a;
            background: #fff;
            margin: 0;
            padding: 10px;
          }
          .header {
            text-align: center;
            border-bottom: 2px double #0f172a;
            padding-bottom: 12px;
            margin-bottom: 15px;
          }
          .bismillah {
            font-size: 14pt;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 6px;
          }
          .doc-title {
            font-size: 16pt;
            font-weight: 900;
            color: #0f172a;
          }
          .doc-sub {
            font-size: 11pt;
            color: #475569;
            margin-top: 4px;
          }
          table.meta-table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
          }
          table.meta-table th, table.meta-table td {
            border: 1px solid #94a3b8;
            padding: 8px 12px;
            font-size: 11pt;
          }
          table.meta-table th {
            background-color: #f8fafc;
            width: 25%;
            font-weight: bold;
            color: #1e293b;
          }
          .file-box {
            border: 2px solid #0284c7;
            background: #f0f9ff;
            border-radius: 8px;
            padding: 14px;
            margin: 15px 0;
          }
          .notes-box {
            border: 1px solid #cbd5e1;
            background: #fafafa;
            border-radius: 6px;
            padding: 12px;
            margin-top: 14px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #cbd5e1;
            text-align: center;
            font-size: 9.5pt;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <div class="doc-title">${catMeta.label}</div>
          <div class="doc-sub">صك حكم رقم: (${j.deedNumber}) • تاريخ الأرشفة: ${j.deedDate}</div>
          <div style="margin-top: 5px; font-size: 9pt; color: #64748b;">
            تاريخ استخراج الوثيقة: ${gregorianDate} (الموافق: ${hijriDate})
          </div>
        </div>

        <table class="meta-table">
          <tr>
            <th>عنوان وموضوع الصك</th>
            <td colspan="3"><strong>${j.title}</strong></td>
          </tr>
          <tr>
            <th>الدرجة القضائية</th>
            <td>${catMeta.degreeName}</td>
            <th>رقم الصك</th>
            <td><strong style="font-family: monospace;">${j.deedNumber}</strong></td>
          </tr>
          <tr>
            <th>تاريخ الصك</th>
            <td>${j.deedDate}</td>
            <th>نوع الحكم</th>
            <td>${j.judgmentType === 'final' ? 'حكم نهائي واجب النفاذ' : 'حكم قابل للاستئناف'}</td>
          </tr>
        </table>

        ${j.fileAttachment ? `
          <div class="file-box">
            <div style="font-weight: bold; color: #0369a1; margin-bottom: 4px;">الملف الأصلي المرفوع والمؤرشف:</div>
            <div><strong>اسم الملف:</strong> ${j.fileAttachment.name} (${(j.fileAttachment.size / 1024).toFixed(1)} ك.ب)</div>
            <div style="font-size: 9pt; color: #64748b; margin-top: 4px;">الصك محفوظ وموثق إلكترونياً بكامل صفحاته وحيثياته.</div>
          </div>
        ` : ''}

        ${j.notes ? `
          <div class="notes-box">
            <div style="font-weight: bold; margin-bottom: 4px;">ملاحظات الصك:</div>
            <div>${j.notes}</div>
          </div>
        ` : ''}

        <div class="footer">
          المملكة العربية السعودية - نظام إدارة وأرشفة الأحكام القضائية المتخصص (HK Law) • تم استخراج الوثيقة إلكترونياً
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Export to Microsoft Word (.doc)
  const handleExportWord = (j: ArchivedJudgment) => {
    const todayStr = getTodayString();
    const gregorianDate = formatArabicDate(todayStr);
    const catMeta = JUDGMENT_CATEGORIES.find(c => c.id === j.category) || JUDGMENT_CATEGORIES[0];

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>صك حكم قضائي - ${j.deedNumber}</title>
        <style>
          body { font-family: 'Traditional Arabic', Arial, sans-serif; direction: rtl; text-align: right; line-height: 1.6; }
          h1 { text-align: center; color: #0f172a; font-size: 16pt; }
          .bismillah { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th, td { border: 1px solid #000; padding: 8px 12px; font-size: 11pt; }
          th { background-color: #f1f5f9; text-align: right; }
          .section { margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <h1>المملكة العربية السعودية - ${catMeta.label}</h1>
        <p style="text-align: center; font-weight: bold; font-size: 11pt;">صك حكم رقم: (${j.deedNumber}) | تاريخ الاستخراج: ${gregorianDate}</p>

        <table>
          <tr>
            <th>عنوان الصك</th>
            <td>${j.title}</td>
          </tr>
          <tr>
            <th>الدرجة القضائية</th>
            <td>${catMeta.degreeName}</td>
          </tr>
          <tr>
            <th>تاريخ الصك</th>
            <td>${j.deedDate}</td>
          </tr>
          <tr>
            <th>الملف المرفوع</th>
            <td>${j.fileAttachment ? j.fileAttachment.name : 'لا يوجد'}</td>
          </tr>
        </table>

        ${j.notes ? `
          <div class="section">
            <h3>ملاحظات:</h3>
            <p>${j.notes}</p>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + wordHtml], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `صك_${j.deedNumber}_${todayStr}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`تم تصدير ملف Word لصك الحكم #${j.deedNumber} بنجاح`);
  };

  // Category Badge for individual card/inspector
  const renderCategoryBadge = (category: JudgmentCategory) => {
    const meta = JUDGMENT_CATEGORIES.find(c => c.id === category) || JUDGMENT_CATEGORIES[0];
    return (
      <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md border flex items-center gap-1 ${meta.badgeClass}`}>
        <span>{meta.icon}</span>
        <span>{meta.shortLabel}</span>
      </span>
    );
  };

  // Active Category Meta
  const activeSelectedMeta = selectedCategory !== 'all' 
    ? JUDGMENT_CATEGORIES.find(c => c.id === selectedCategory) 
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-6xl w-full max-h-[96vh] flex flex-col overflow-hidden relative">
        
        {/* Floating Toast inside modal */}
        {toastMessage && (
          <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-amber-300 px-5 py-2.5 rounded-2xl shadow-2xl border border-amber-500/40 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <AppLogo size="md" withGlow />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1">
                  <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                  <span>أرشيف وتوثيق صكوك الأحكام القضائية</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {judgments.length} صكوك محفوظة
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white mt-0.5">
                رفع وأرشفة الصكوك مباشرة من خانة كل درجة قضائية (أول درجة، العليا والنقض، العمالية، الاستئناف، والإدارية)
              </h2>
            </div>
          </div>

          {/* Top Actions & Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('archive');
                setInspectingJudgment(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'archive'
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>الأرشيف ({judgments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="دليل استرجاع وفهرسة الأحكام"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">دليل الخانات</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN ARCHIVE TAB WITH DIRECT PER-CATEGORY UPLOAD MECHANISMS */}
        {/* ========================================================================= */}
        {activeTab === 'archive' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Category Filter Tabs Bar */}
            <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[11px] font-bold text-slate-400 shrink-0 ml-1">تصفية خانات درجات التقاضي:</span>
              
              {/* All Categories Button */}
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-slate-800 text-amber-400 shadow-md ring-2 ring-amber-400/40 border border-slate-700'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                <span>⚖️</span>
                <span>كافة الخانات</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full font-mono font-black bg-black/30 text-amber-300">
                  {categoryCounts.all}
                </span>
              </button>

              {/* Individual Judicial Degrees Buttons */}
              {JUDGMENT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const count = categoryCounts[cat.id] || 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isSelected
                        ? cat.activeClass
                        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.shortLabel}</span>
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-black ${
                      isSelected ? 'bg-black/30 text-white' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div className="p-3.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث سريع برقم الصك، اسم الملف المرفوع، عنوان الحكم، أو الملاحظات..."
                  className="w-full pl-3 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 transition shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                  >
                    مسح
                  </button>
                )}
              </div>

              {(selectedCategory !== 'all' || searchTerm) && (
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchTerm('');
                  }}
                  className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="إعادة ضبط الفلاتر"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">عرض كافة الخانات</span>
                </button>
              )}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60 space-y-6">
              
              {/* ========================================================================= */}
              {/* IF 'ALL' VIEW IS SELECTED: SHOW 6 INTERACTIVE DEGREE UPLOAD CARDS */}
              {/* ========================================================================= */}
              {selectedCategory === 'all' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <span>خانات رفع وأرشفة الصكوك حسب درجات وأنواع التقاضي</span>
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-bold">
                          رفع فوري مباشر
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        اسحب ملف الصك (PDF أو Word أو صورة) وأفلته في خانة الدرجة المخصصة أو اضغط للرفع المباشر دون الحاجة لتعبئة بيانات
                      </p>
                    </div>
                  </div>

                  {/* 6 Degree Interactive Upload Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {JUDGMENT_CATEGORIES.map((cat) => {
                      const count = categoryCounts[cat.id] || 0;
                      return (
                        <div
                          key={cat.id}
                          className="bg-white rounded-2xl border-2 border-slate-200 hover:border-amber-400 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between group relative overflow-hidden"
                        >
                          <div>
                            {/* Card Top Title & Count */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl p-2 bg-slate-100 rounded-xl group-hover:scale-110 transition shrink-0">
                                  {cat.icon}
                                </span>
                                <div>
                                  <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-amber-700 transition">
                                    {cat.label}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 line-clamp-1">
                                    {cat.examples}
                                  </p>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 bg-slate-900 text-amber-400 font-mono font-bold text-xs rounded-lg shrink-0">
                                {count} صكوك
                              </span>
                            </div>

                            {/* Direct Dropzone for this degree */}
                            <div className="my-2 border-2 border-dashed border-slate-300 group-hover:border-emerald-500 rounded-xl p-3 text-center bg-slate-50/70 group-hover:bg-emerald-50/30 transition relative cursor-pointer">
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                                onChange={(e) => handleDirectCategoryFileChange(e, cat.id)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                title={`رفع صك حكم في خانة ${cat.label}`}
                              />
                              <div className="flex items-center justify-center gap-2 text-slate-700 group-hover:text-emerald-800">
                                <FileUp className="w-5 h-5 text-emerald-600 shrink-0 group-hover:bounce" />
                                <div className="text-right">
                                  <span className="text-xs font-black block">
                                    اسحب أو اختر صك الحكم هنا
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">
                                    أرشفة فورية كـ ({cat.shortLabel})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                            <button
                              onClick={() => setSelectedCategory(cat.id)}
                              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                            >
                              <span>استعراض أحكام الخانة ({count})</span>
                              <ArrowRight className="w-3 h-3 text-slate-400 rotate-180" />
                            </button>

                            <button
                              onClick={() => {
                                setActiveUploadCategory(cat.id);
                                setUploadCustomTitle('');
                                setUploadCustomNotes('');
                              }}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>رفع مخصص</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* IF A SPECIFIC JUDICIAL DEGREE IS SELECTED: SHOW DEDICATED DIRECT UPLOAD BOX */}
              {/* ========================================================================= */}
              {activeSelectedMeta && (
                <div className={`p-5 rounded-3xl border-2 ${activeSelectedMeta.borderClass} ${activeSelectedMeta.bgLightClass} shadow-sm space-y-4`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200">
                        {activeSelectedMeta.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-slate-900">
                            خانة: {activeSelectedMeta.label}
                          </h3>
                          <span className="px-2.5 py-0.5 bg-slate-900 text-amber-400 text-xs font-mono font-bold rounded-lg">
                            {categoryCounts[activeSelectedMeta.id] || 0} صكوك مؤرشفة
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {activeSelectedMeta.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <span>عرض كافة الخانات</span>
                    </button>
                  </div>

                  {/* Direct Per-Degree Drag & Drop Banner */}
                  <div className="border-2 border-dashed border-slate-400/80 hover:border-emerald-600 bg-white rounded-2xl p-6 text-center transition cursor-pointer relative shadow-sm group">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                      onChange={(e) => handleDirectCategoryFileChange(e, activeSelectedMeta.id)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      title={`رفع صك حكم في خانة ${activeSelectedMeta.label}`}
                    />
                    <div className="space-y-2">
                      <div className="p-3 bg-emerald-100 text-emerald-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto group-hover:scale-110 transition">
                        <Upload className="w-6 h-6 text-emerald-700" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900">
                        اسحب صك الحكم هنا أو اضغط للاختيار من جهازك (رفع فوري في خانة {activeSelectedMeta.shortLabel})
                      </h4>
                      <p className="text-xs text-slate-500">
                        يتم حفظ وأرشفة الصك تلقائياً وبشكل فوري بمجرد اختيار الملف (PDF، Word، صور الصكوك)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* ARCHIVED JUDGMENTS LIST / GRID */}
              {/* ========================================================================= */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>
                      {selectedCategory === 'all' 
                        ? `سجل كافة الصكوك المؤرشفة (${filteredJudgments.length})` 
                        : `صكوك ${activeSelectedMeta?.label} (${filteredJudgments.length})`
                      }
                    </span>
                  </h3>
                </div>

                {filteredJudgments.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500 max-w-lg mx-auto space-y-3 shadow-sm">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-full w-14 h-14 flex items-center justify-center mx-auto">
                      <Gavel className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">
                      لا توجد صكوك مؤرشفة في هذه الخانة بعد
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      اسحب ملف الصك وأفلته في المربع أعلاه لرفعه وأرشفته مباشرة دون أي حقول إضافية.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredJudgments.map((j) => {
                      const cat = j.category || 'first_instance';
                      const isCopied = copiedId === j.id;
                      const catMeta = JUDGMENT_CATEGORIES.find(c => c.id === cat) || JUDGMENT_CATEGORIES[0];

                      return (
                        <div
                          key={j.id}
                          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between group border-r-4 border-r-amber-500"
                        >
                          <div>
                            {/* Card Top Header */}
                            <div className="flex items-start justify-between gap-2 mb-2.5">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {renderCategoryBadge(cat)}
                                  <span className="px-2 py-0.5 bg-slate-900 text-amber-400 font-mono font-bold text-[11px] rounded-md">
                                    صك #{j.deedNumber}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-bold font-mono">
                                    تاريخ: {j.deedDate}
                                  </span>
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-amber-800 transition">
                                  {j.title}
                                </h3>
                              </div>

                              {j.fileAttachment && (
                                <span className="px-2 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0" title={j.fileAttachment.name}>
                                  <FileType className="w-3 h-3 text-blue-600" />
                                  <span>مرفق صك أصلي</span>
                                </span>
                              )}
                            </div>

                            {/* File and Metadata Preview Box */}
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-2.5 text-xs space-y-1.5">
                              {j.fileAttachment ? (
                                <div className="flex items-center justify-between text-slate-700">
                                  <div className="flex items-center gap-1.5 font-bold line-clamp-1 text-slate-800">
                                    <FileType className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>الملف: {j.fileAttachment.name}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 shrink-0">
                                    ({(j.fileAttachment.size / 1024).toFixed(1)} ك.ب)
                                  </span>
                                </div>
                              ) : (
                                <div className="text-slate-500 text-[11px]">
                                  الجهة: {catMeta.degreeName}
                                </div>
                              )}

                              {j.notes && (
                                <div className="text-[11px] text-slate-600 line-clamp-1 border-t border-slate-200/60 pt-1">
                                  <strong>ملاحظة:</strong> {j.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Bottom Actions (Read, Download, Print, Copy, Word, Delete) */}
                          <div className="border-t border-slate-100 pt-2.5 flex flex-wrap items-center justify-between gap-2 mt-1">
                            <button
                              onClick={() => {
                                setInspectingJudgment(j);
                                setActiveTab('inspect');
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              <span>مطالعة الصك</span>
                            </button>

                            <div className="flex items-center gap-1">
                              {/* Direct Download File Attachment */}
                              {j.fileAttachment && (
                                <a
                                  href={j.fileAttachment.dataUrl}
                                  download={j.fileAttachment.name}
                                  title="تحميل ملف الصك الأصلي"
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {/* Copy Info Button */}
                              <button
                                onClick={() => handleCopyJudgmentInfo(j)}
                                title="نسخ بيانات صك الحكم"
                                className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                                  isCopied
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                }`}
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>

                              {/* Print Button */}
                              <button
                                onClick={() => handlePrintJudgment(j)}
                                title="طباعة رسمية منسقة لصك الحكم"
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer border border-slate-200"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Export Word Button */}
                              <button
                                onClick={() => handleExportWord(j)}
                                title="تصدير صك الحكم لملف Word"
                                className="p-1.5 bg-slate-100 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-bold transition cursor-pointer border border-slate-200"
                              >
                                <FileType className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Judgment Button */}
                              <button
                                onClick={() => {
                                  if (window.confirm(`هل أنت متأكد من حذف صك الحكم رقم (${j.deedNumber}) نهائياً من الأرشيف؟`)) {
                                    onDeleteJudgment(j.id);
                                    showToast('تم حذف صك الحكم من الأرشيف');
                                  }
                                }}
                                title="حذف صك الحكم من الأرشيف"
                                className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg text-xs font-bold transition cursor-pointer border border-slate-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* CUSTOM MODAL: OPTIONAL TITLE/NOTES FOR DEDICATED CATEGORY UPLOAD */}
        {/* ========================================================================= */}
        {activeUploadCategory && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
              
              {(() => {
                const catMeta = JUDGMENT_CATEGORIES.find(c => c.id === activeUploadCategory) || JUDGMENT_CATEGORIES[0];
                return (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-2 bg-slate-100 rounded-xl">{catMeta.icon}</span>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">
                            رفع صك حكم في خانة: {catMeta.label}
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            أرشفة سريعة ومباشرة
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveUploadCategory(null)}
                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* File Drop Area */}
                    <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-5 text-center bg-slate-50 relative cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const cleanName = f.name.replace(/\.[^/.]+$/, "");
                            if (!uploadCustomTitle) setUploadCustomTitle(cleanName);
                            processAndArchiveFile(f, activeUploadCategory, uploadCustomTitle, uploadCustomNotes, uploadLinkedCaseId);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="space-y-1 text-slate-600">
                        <Upload className="w-7 h-7 text-emerald-600 mx-auto" />
                        <span className="text-xs font-bold block text-slate-800">
                          اضغط هنا لاختيار ملف الصك (PDF أو Word أو صورة)
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          سيتم رفعه وأرشفته مباشرة في خانة {catMeta.shortLabel}
                        </span>
                      </div>
                    </div>

                    {/* Optional Label / Notes */}
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          عنوان أو وصف الصك (اختياري - يملأ تلقائياً من اسم الملف):
                        </label>
                        <input
                          type="text"
                          value={uploadCustomTitle}
                          onChange={(e) => setUploadCustomTitle(e.target.value)}
                          placeholder="مثال: حكم تجاري بإلزام التعويض"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          ملاحظات سريعة على الصك (اختياري):
                        </label>
                        <textarea
                          rows={2}
                          value={uploadCustomNotes}
                          onChange={(e) => setUploadCustomNotes(e.target.value)}
                          placeholder="أي ملحوظات قانونية أو أرقام قيود..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {cases.length > 0 && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            ربط بقضية في رول الجلسات (اختياري):
                          </label>
                          <select
                            value={uploadLinkedCaseId}
                            onChange={(e) => setUploadLinkedCaseId(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                          >
                            <option value="">بدون ربط (صك حكم مستقل)</option>
                            {cases.map((c) => (
                              <option key={c.id} value={c.id}>
                                دعوى {c.caseNumber}/{c.caseYear} - {c.court} ({c.title})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setActiveUploadCategory(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                      >
                        إلغاء
                      </button>
                    </div>
                  </>
                );
              })()}

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: IN-DEPTH JUDGMENT INSPECTION, READING, PRINTING & COPYING */}
        {/* ========================================================================= */}
        {activeTab === 'inspect' && inspectingJudgment && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60">
            <div className="max-w-4xl mx-auto space-y-5">
              
              {/* Inspection Header Banner */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-wrap items-start justify-between gap-4 border border-slate-800">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {renderCategoryBadge(inspectingJudgment.category || 'first_instance')}
                    <span className="px-3 py-0.5 bg-amber-500 text-slate-950 font-black font-mono text-xs rounded-lg">
                      صك #{inspectingJudgment.deedNumber}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      تاريخ الصك: {inspectingJudgment.deedDate}
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-white">
                    {inspectingJudgment.title}
                  </h1>
                </div>

                {/* Top Action Bar (Print, Copy, Word, Download, Back) */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Copy Info Button */}
                  <button
                    onClick={() => handleCopyJudgmentInfo(inspectingJudgment)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>نسخ بيانات الصك</span>
                  </button>

                  {/* Print Button */}
                  <button
                    onClick={() => handlePrintJudgment(inspectingJudgment)}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-950" />
                    <span>طباعة رسمية</span>
                  </button>

                  {/* Export Word (.doc) Button */}
                  <button
                    onClick={() => handleExportWord(inspectingJudgment)}
                    className="px-3.5 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileType className="w-4 h-4" />
                    <span>تصدير Word</span>
                  </button>

                  {inspectingJudgment.fileAttachment && (
                    <a
                      href={inspectingJudgment.fileAttachment.dataUrl}
                      download={inspectingJudgment.fileAttachment.name}
                      className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      title="تحميل ملف الصك الأصلي المرفوع"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل المرفق</span>
                    </a>
                  )}

                  {onOpenDraftingWithJudgment && (
                    <button
                      onClick={() => onOpenDraftingWithJudgment(inspectingJudgment)}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-amber-300" />
                      <span>صياغة لائحة</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('archive')}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    عودة للأرشيف
                  </button>
                </div>
              </div>

              {/* File Attachment Viewer Card */}
              {inspectingJudgment.fileAttachment && (
                <div className="bg-white p-6 rounded-3xl border-2 border-blue-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                        <FileType className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">
                          الملف الأصلي لصك الحكم المرفوع
                        </h3>
                        <p className="text-xs text-slate-500">
                          اسم الملف: <span className="font-bold text-blue-900">{inspectingJudgment.fileAttachment.name}</span> • الحجم: {(inspectingJudgment.fileAttachment.size / 1024).toFixed(1)} ك.ب
                        </p>
                      </div>
                    </div>

                    <a
                      href={inspectingJudgment.fileAttachment.dataUrl}
                      download={inspectingJudgment.fileAttachment.name}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل الصك الأصلي</span>
                    </a>
                  </div>

                  {/* If image or embeddable preview */}
                  {inspectingJudgment.fileAttachment.dataUrl.startsWith('data:image/') && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[500px] flex items-center justify-center bg-slate-950/5 p-2">
                      <img 
                        src={inspectingJudgment.fileAttachment.dataUrl} 
                        alt={inspectingJudgment.title}
                        className="max-h-[480px] object-contain rounded-xl"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {inspectingJudgment.notes && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2">
                    ملاحظات الصك:
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap select-text">
                    {inspectingJudgment.notes}
                  </p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: RETRIEVAL & DEGREE GUIDE (دليل خانات درجات التقاضي) */}
        {/* ========================================================================= */}
        {activeTab === 'guide' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60">
            <div className="max-w-4xl mx-auto space-y-6">
              
              <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white">
                      دليل خانات وتصنيفات صكوك الأحكام القضائية
                    </h2>
                    <p className="text-xs text-slate-300">
                      كيفية رفع وأرشفة الصكوك مباشرة في كل خانة قضائية دون ملء بيانات معقدة
                    </p>
                  </div>
                </div>
              </div>

              {/* 6 Court Types Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {JUDGMENT_CATEGORIES.map((cat, idx) => (
                  <div key={cat.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{cat.icon}</span>
                      <h3 className="font-black text-sm text-slate-900">{idx + 1}. {cat.label}</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {cat.description}
                    </p>
                    <div className="text-[11px] bg-slate-50 p-2.5 rounded-xl text-slate-800 font-semibold border border-slate-200">
                      💡 <strong>أمثلة:</strong> {cat.examples}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setActiveTab('archive')}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
                >
                  العودة إلى أرشيف الأحكام
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>نظام أرشفة وتوثيق فوري لصكوك الأحكام مصنف حسب درجات وأنواع التقاضي</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
            >
              إغلاق نافذة الأرشيف
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
