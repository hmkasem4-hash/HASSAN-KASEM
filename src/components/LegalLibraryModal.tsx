import React, { useState, useMemo } from 'react';
import { 
  X, 
  BookOpen, 
  Upload, 
  Search, 
  Filter, 
  FileText, 
  Scale, 
  Sparkles, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Eye, 
  FileType, 
  Gavel, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Bookmark, 
  Send, 
  Loader2, 
  Zap, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { LegalDocument, LegalDocumentCategory, DraftDocumentType, DraftedLegalDocument, ArchivedJudgment, CourtCase } from '../types';
import { formatArabicDate, formatHijriDate, getTodayString } from '../utils/dateUtils';

interface LegalLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: LegalDocument[];
  onAddDocument: (doc: LegalDocument) => void;
  onDeleteDocument: (id: string) => void;
  judgments: ArchivedJudgment[];
  cases: CourtCase[];
  initialDraftingJudgment?: ArchivedJudgment | null;
}

export const LegalLibraryModal: React.FC<LegalLibraryModalProps> = ({
  isOpen,
  onClose,
  documents,
  onAddDocument,
  onDeleteDocument,
  judgments,
  cases,
  initialDraftingJudgment = null,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload_law' | 'drafter' | 'draft_result'>('library');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);

  // New Law Upload Form State
  const [newLawTitle, setNewLawTitle] = useState('');
  const [newLawCategory, setNewLawCategory] = useState<LegalDocumentCategory>('law');
  const [newLawNumber, setNewLawNumber] = useState('');
  const [newLawDescription, setNewLawDescription] = useState('');
  const [newLawContent, setNewLawContent] = useState('');
  const [newLawTopics, setNewLawTopics] = useState('');
  const [isUploadingLaw, setIsUploadingLaw] = useState(false);

  // AI Legal Drafting Studio State
  const [draftDocType, setDraftDocType] = useState<DraftDocumentType>('appeal_memo');
  const [selectedJudgmentId, setSelectedJudgmentId] = useState<string>(initialDraftingJudgment?.id || '');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [selectedLibraryDocIds, setSelectedLibraryDocIds] = useState<string[]>(['law-1', 'law-2', 'precedent-1']);
  const [lawyerDemands, setLawyerDemands] = useState('');
  const [opponentArguments, setOpponentArguments] = useState('');
  const [firmName, setFirmName] = useState('مكتب الأستاذ / صقر ناصر - للمحاماة والاستشارات القانونية');
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  // Draft Result State
  const [draftResult, setDraftResult] = useState<DraftedLegalDocument | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Sync initial judgment if provided
  React.useEffect(() => {
    if (initialDraftingJudgment) {
      setSelectedJudgmentId(initialDraftingJudgment.id);
      setActiveTab('drafter');
      setLawyerDemands(
        initialDraftingJudgment.analysis?.appealGrounds?.join('\n') || 
        'طلب نقض الحكم المستأنف والقضاء مجدداً بالطلبات الأصلية مع إلزام الخصم بالمصاريف وأتعاب المحاماة.'
      );
    }
  }, [initialDraftingJudgment]);

  // Unique Topics for Filter
  const allTopics = useMemo(() => {
    const set = new Set<string>();
    documents.forEach(d => { (d.keyTopics || []).forEach(t => set.add(t)); });
    return Array.from(set);
  }, [documents]);

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((d) => {
      const matchesSearch = 
        !searchTerm.trim() ||
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.keyTopics || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = selectedCategory === 'all' || d.category === selectedCategory;
      const matchesTopic = selectedTopic === 'all' || (d.keyTopics || []).includes(selectedTopic);

      return matchesSearch && matchesCat && matchesTopic;
    });
  }, [documents, searchTerm, selectedCategory, selectedTopic]);

  if (!isOpen) return null;

  // Handle Uploading a new Legal Document / Regulation / Precedent
  const handleSaveNewLaw = () => {
    if (!newLawTitle.trim() || !newLawContent.trim()) {
      alert('الرجاء إدخال عنوان النظام أو المذكرة والنص الخاص بها');
      return;
    }

    const topicsArray = newLawTopics.split(',').map(t => t.trim()).filter(Boolean);
    const todayStr = getTodayString();

    const newDoc: LegalDocument = {
      id: 'law-' + Date.now(),
      title: newLawTitle,
      category: newLawCategory,
      jurisdiction: 'saudi',
      lawNumber: newLawNumber || undefined,
      description: newLawDescription || newLawTitle,
      content: newLawContent,
      keyTopics: topicsArray.length > 0 ? topicsArray : ['أنظمة عامة'],
      createdAt: todayStr,
      updatedAt: todayStr
    };

    onAddDocument(newDoc);
    setSelectedDocument(newDoc);
    setActiveTab('library');

    // Reset
    setNewLawTitle('');
    setNewLawNumber('');
    setNewLawDescription('');
    setNewLawContent('');
    setNewLawTopics('');
  };

  // Toggle selection of library documents for drafting
  const toggleLibrarySelection = (id: string) => {
    if (selectedLibraryDocIds.includes(id)) {
      setSelectedLibraryDocIds(selectedLibraryDocIds.filter(item => item !== id));
    } else {
      setSelectedLibraryDocIds([...selectedLibraryDocIds, id]);
    }
  };

  // Run AI Legal Drafting Engine
  const handleGenerateDraft = async () => {
    setIsDrafting(true);
    setDraftError(null);

    try {
      // Find context judgment or case
      const linkedJudgment = judgments.find(j => j.id === selectedJudgmentId);
      const linkedCase = cases.find(c => c.id === selectedCaseId);

      const caseOrJudgmentContext = linkedJudgment ? {
        title: linkedJudgment.title,
        deedNumber: linkedJudgment.deedNumber,
        caseNumber: linkedJudgment.caseNumber,
        court: linkedJudgment.court,
        circuit: linkedJudgment.circuit,
        judge: linkedJudgment.judge,
        clientName: linkedJudgment.clientName,
        clientRole: linkedJudgment.clientRole,
        opponentName: linkedJudgment.opponentName,
        verdictText: linkedJudgment.verdictText,
        factsAndMerits: linkedJudgment.factsAndMerits,
        legalReasons: linkedJudgment.legalReasons,
        flawAnalysis: linkedJudgment.analysis
      } : (linkedCase ? {
        title: linkedCase.title,
        caseNumber: linkedCase.caseNumber,
        caseYear: linkedCase.caseYear,
        court: linkedCase.court,
        circuit: linkedCase.circuit,
        clientName: linkedCase.clientName,
        clientRole: linkedCase.clientRole,
        opponentName: linkedCase.opponentName,
        demands: linkedCase.demands,
        subjectDetails: linkedCase.subjectDetails
      } : {
        title: 'دعوى قضائية عامة',
        demands: lawyerDemands
      });

      // Gather selected library references
      const selectedReferences = documents
        .filter(d => selectedLibraryDocIds.includes(d.id))
        .map(d => ({
          title: d.title,
          category: d.category,
          content: d.content,
          description: d.description
        }));

      const response = await fetch('/api/ai/draft-legal-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: draftDocType,
          caseOrJudgmentContext,
          selectedLibraryReferences: selectedReferences,
          lawyerDemands,
          opponentArguments,
          firmName
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'فشلت عملية الصياغة الذكية');
      }

      const generated = result.data;
      const todayStr = getTodayString();

      const newDraftedDoc: DraftedLegalDocument = {
        id: 'draft-' + Date.now(),
        title: generated.title || 'مذكرة قضائية',
        type: draftDocType,
        courtHeader: generated.courtHeader || '',
        parties: generated.parties || '',
        subjectAndFacts: generated.subjectAndFacts || '',
        defensesAndGrounds: generated.defensesAndGrounds || '',
        legalReferencesAndArticles: generated.legalReferencesAndArticles || '',
        finalDemands: generated.finalDemands || '',
        fullDocumentText: generated.fullDocumentText || '',
        summaryNotes: generated.summaryNotes || '',
        linkedJudgmentId: selectedJudgmentId || undefined,
        referencedLibraryDocIds: selectedLibraryDocIds,
        createdAt: todayStr
      };

      setDraftResult(newDraftedDoc);
      setActiveTab('draft_result');
    } catch (err: any) {
      console.error(err);
      setDraftError(err.message || 'حدث خطأ أثناء صياغة المذكرة القانونية.');
    } finally {
      setIsDrafting(false);
    }
  };

  // Export Draft to Microsoft Word (.doc)
  const handleExportDraftToWord = (doc: DraftedLegalDocument) => {
    const todayStr = getTodayString();
    const gregorianDate = formatArabicDate(todayStr);
    const hijriDate = formatHijriDate(todayStr, { includeWeekday: true });

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir='rtl'>
      <head>
        <meta charset='utf-8'>
        <title>${doc.title}</title>
        <style>
          @page { size: A4 portrait; margin: 2cm 2cm 2cm 2cm; }
          body { font-family: 'Traditional Arabic', 'Arial', sans-serif; direction: rtl; text-align: justify; font-size: 14pt; line-height: 1.8; color: #000; }
          .header-box { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 20px; }
          .firm-name { font-size: 16pt; font-weight: bold; }
          .doc-title { font-size: 18pt; font-weight: bold; text-align: center; margin: 15px 0; text-decoration: underline; }
          .court-header { font-size: 15pt; font-weight: bold; text-align: right; margin-bottom: 15px; }
          .section-title { font-size: 15pt; font-weight: bold; color: #0f172a; margin-top: 15px; margin-bottom: 5px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
          .demands-box { border: 1.5px solid #000; background-color: #f8fafc; padding: 12px; margin-top: 15px; }
          .footer-sign { margin-top: 40px; text-align: left; font-size: 13pt; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="firm-name">${firmName}</div>
          <div style="font-size: 11pt; color: #555;">المملكة العربية السعودية • التاريخ: ${gregorianDate} (الموافق: ${hijriDate})</div>
        </div>

        <div class="doc-title">${doc.title}</div>
        
        <div class="court-header">${doc.courtHeader}</div>
        
        <div style="margin-bottom: 15px; font-weight: bold;">
          ${doc.parties}
        </div>

        <div class="section-title">أولاً: الوقائع وموضوع النزاع</div>
        <p>${doc.subjectAndFacts.replace(/\n/g, '<br/>')}</p>

        <div class="section-title">ثانياً: أوجه الطعن والدفوع الجوهرية وعوار الحكم المستأنف</div>
        <p>${doc.defensesAndGrounds.replace(/\n/g, '<br/>')}</p>

        <div class="section-title">ثالثاً: الأسانيد الشرعية والنظامية والمبادئ القضائية المستند إليها</div>
        <p>${doc.legalReferencesAndArticles.replace(/\n/g, '<br/>')}</p>

        <div class="section-title">رابعاً: الطلبات الختامية الجازمة</div>
        <div class="demands-box">
          <p>${doc.finalDemands.replace(/\n/g, '<br/>')}</p>
        </div>

        <div class="footer-sign">
          <div>وتفضلوا بقبول فائق الاحترام والتقدير،،،</div>
          <div style="margin-top: 15px;">وكيل الموكل / المستشار القانوني: ........................</div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + wordHtml], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/\s+/g, '_')}_${todayStr}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCategoryLabel = (cat: LegalDocumentCategory): string => {
    switch (cat) {
      case 'law': return 'نظام أساسي';
      case 'regulation': return 'لائحة تنفيذية';
      case 'precedent': return 'سابقة ومبدأ قضائي';
      case 'lawsuit_template': return 'صحيفة دعوى نموذجية';
      case 'defense_memo': return 'مذكرة دفاع جوابية';
      case 'appeal_memo': return 'لائحة استئناف ونقض';
      case 'general_study': default: return 'بحث ودراسة قانونية';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-6xl w-full max-h-[96vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl font-black shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-bold">
                  المكتبة القانونية واستوديو الصياغة الذكي
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {documents.length} أنظمة ومذكرات مرجعية
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-1">
                الأنظمة واللوائح وصياغة صحف الدعاوى والمذكرات والطعون بالذكاء الاصطناعي
              </h2>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'library'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>المكتبة والأنظمة ({documents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('drafter')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'drafter'
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>استوديو صياغة المذكرات والطعون</span>
            </button>

            <button
              onClick={() => setActiveTab('upload_law')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'upload_law'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>إضافة نظام / مذكرة</span>
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
        {/* TAB 1: BROWSE LEGAL LIBRARY */}
        {/* ========================================================================= */}
        {activeTab === 'library' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Search and Filters */}
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث في الأنظمة، اللوائح، مواد القوانين، السوابق، وصحف الدعاوى النموذجية..."
                  className="w-full pl-3 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
              >
                <option value="all">كافة التصنيفات ({documents.length})</option>
                <option value="law">أنظمة وقوانين أساسية</option>
                <option value="regulation">لوائح تنفيذية</option>
                <option value="precedent">مبادئ وسوابق المحكمة العليا</option>
                <option value="appeal_memo">لوائح استئناف ونقض</option>
                <option value="defense_memo">مذكرات دفاع جوابية</option>
                <option value="lawsuit_template">صحف دعاوى نموذجية</option>
              </select>

              {/* Topic Filter */}
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
              >
                <option value="all">كافة الموضوعات القانونية</option>
                {allTopics.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Content List & Detail View */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60">
              {selectedDocument ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold rounded-lg">
                          {getCategoryLabel(selectedDocument.category)}
                        </span>
                        {selectedDocument.lawNumber && (
                          <span className="text-xs text-slate-500 font-mono font-bold">
                            رقم: {selectedDocument.lawNumber}
                          </span>
                        )}
                        {selectedDocument.promulgationYear && (
                          <span className="text-xs text-slate-400">
                            ({selectedDocument.promulgationYear})
                          </span>
                        )}
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        {selectedDocument.title}
                      </h2>
                    </div>

                    <button
                      onClick={() => setSelectedDocument(null)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      إغلاق العرض
                    </button>
                  </div>

                  {/* Summary / Relevance */}
                  <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl space-y-2 text-xs">
                    <p className="text-slate-800 leading-relaxed font-semibold">
                      {selectedDocument.description}
                    </p>
                    {selectedDocument.practicalRelevance && (
                      <div className="pt-2 border-t border-indigo-100/60 text-indigo-950 font-bold">
                        📌 كيفية الاستناد في الصياغة: {selectedDocument.practicalRelevance}
                      </div>
                    )}
                  </div>

                  {/* Articles summary if present */}
                  {selectedDocument.articlesSummary && selectedDocument.articlesSummary.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-slate-900">أبرز المواد والأحكام النظامية المفهرسة:</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedDocument.articlesSummary.map((art, i) => (
                          <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                            <span className="font-black text-indigo-900 block mb-1">{art.article}</span>
                            <p className="text-slate-700 leading-relaxed">{art.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full Text Content */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-slate-900">النص الكامل للمستند:</h3>
                    <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-sans text-xs sm:text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {selectedDocument.content}
                    </div>
                  </div>

                  {/* Bottom Action for Drafting with this law */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedLibraryDocIds([selectedDocument.id]);
                        setActiveTab('drafter');
                      }}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>صياغة مذكرة بالاستناد إلى هذا النظام</span>
                    </button>

                    <button
                      onClick={() => onDeleteDocument(selectedDocument.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-bold p-2 cursor-pointer"
                    >
                      حذف من المكتبة
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group border-t-4 border-t-indigo-600"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 text-[10px] font-bold rounded-md border border-indigo-100">
                            {getCategoryLabel(doc.category)}
                          </span>
                          {doc.promulgationYear && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {doc.promulgationYear}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-indigo-700 transition mb-2">
                          {doc.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                          {doc.description}
                        </p>

                        {/* Topics tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {(doc.keyTopics || []).slice(0, 3).map((t, idx) => (
                            <span key={idx} className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] rounded font-medium">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedDocument(doc)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-300" />
                          <span>عرض المواد</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedLibraryDocIds([doc.id]);
                            setActiveTab('drafter');
                          }}
                          title="صياغة مذكرة بالاستناد لهذا النظام"
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: UPLOAD / ADD NEW LEGAL DOCUMENT / REGULATION / PRECEDENT */}
        {/* ========================================================================= */}
        {activeTab === 'upload_law' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
              
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    إضافة نظام أو لائحة أو سابقة قضائية أو مذكرة نموذجية إلى المكتبة
                  </h3>
                  <p className="text-xs text-slate-500">
                    يمكنك رفع وتخزين نصوص القوانين ومذكرات الدفاع ليعتمد عليها الذكاء الاصطناعي في صياغة الدعاوى والطعون
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                
                {/* Title & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      عنوان النظام / اللائحة / المذكرة *:
                    </label>
                    <input
                      type="text"
                      value={newLawTitle}
                      onChange={(e) => setNewLawTitle(e.target.value)}
                      placeholder="مثال: نظام الشركات الجديد (المرسوم الملكي م/132)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      التصنيف *:
                    </label>
                    <select
                      value={newLawCategory}
                      onChange={(e) => setNewLawCategory(e.target.value as LegalDocumentCategory)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="law">نظام وقانون أساسي</option>
                      <option value="regulation">لائحة تنفيذية</option>
                      <option value="precedent">مبدأ وسابقة قضائية</option>
                      <option value="appeal_memo">لائحة استئناف ونقض</option>
                      <option value="defense_memo">مذكرة دفاع جوابية</option>
                      <option value="lawsuit_template">صحيفة دعوى نموذجية</option>
                      <option value="general_study">دراسة وبحث قانوني</option>
                    </select>
                  </div>
                </div>

                {/* Law Number & Topics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      رقم المرسوم / القرار أو سنة الإصدار:
                    </label>
                    <input
                      type="text"
                      value={newLawNumber}
                      onChange={(e) => setNewLawNumber(e.target.value)}
                      placeholder="مثال: م/132 لسنة 1443 هـ"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      الكلمات المفتاحية والموضوعات (مفصولة بفاصلة):
                    </label>
                    <input
                      type="text"
                      value={newLawTopics}
                      onChange={(e) => setNewLawTopics(e.target.value)}
                      placeholder="مثال: الشركات, مجلس الإدارة, بطلان القرارات"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Brief description */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    نبذة موجزة ومجال انطباق النظام / المذكرة:
                  </label>
                  <input
                    type="text"
                    value={newLawDescription}
                    onChange={(e) => setNewLawDescription(e.target.value)}
                    placeholder="ملخص موجز لمحتوى النظام وأهميته العملية..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                {/* Content Textarea */}
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5">
                    نص مواد النظام أو صيغة المذكرة / السابقة القضائية *:
                  </label>
                  <textarea
                    rows={10}
                    value={newLawContent}
                    onChange={(e) => setNewLawContent(e.target.value)}
                    placeholder="الصق هنا النص الكامل لمواد النظام أو اللائحة، أو صيغة المذكرة النموذجية والمبدأ القضائي..."
                    className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition leading-relaxed font-sans"
                  />
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab('library')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    إلغاء
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveNewLaw}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>حفظ المستند في المكتبة القانونية</span>
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: AI LEGAL DRAFTING STUDIO */}
        {/* ========================================================================= */}
        {activeTab === 'drafter' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              
              {/* Studio Banner */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 rounded-2xl font-black shadow-md">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    استوديو الصياغة القضائية الذكي (صحف الدعاوى، لوائح الاستئناف، والطعون)
                  </h3>
                  <p className="text-xs text-slate-500">
                    توليد مذكرات ولوائح قضائية رفيعة الصياغة، مسببة ومدعومة بأحدث مواد الأنظمة السعودية ومبادئ المحكمة العليا وعوار الأحكام.
                  </p>
                </div>
              </div>

              {draftError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{draftError}</span>
                </div>
              )}

              <div className="space-y-5">
                
                {/* 1. Document Type Selection */}
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-2">
                    1. نوع الوثيقة القضائية المراد صياغتها:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'appeal_memo', label: 'لائحة استئناف وطعن', desc: 'الطعن على حكم ابتدائي لعوار التسبيب وتطبيق القانون' },
                      { id: 'cassation_petition', label: 'صحيفة طعن بالنقض', desc: 'أمام المحكمة العليا لبطلان الحكم ومخالفة النظام' },
                      { id: 'lawsuit_statement', label: 'صحيفة افتتاح دعوى', desc: 'تحرير الطلبات والأسانيد والوقائع بصفة مبتدأة' },
                      { id: 'defense_memo', label: 'مذكرة دفاع جوابية', desc: 'دحض مزاعم الخصم والدفوع الشكلية والموضوعية' },
                      { id: 'reconsideration_petition', label: 'لائحة التماس إعادة نظر', desc: 'لظهور أوراق قاطعة أو وقوع غش وتدليس' },
                      { id: 'legal_consultation', label: 'رأي واستشارة قانونية', desc: 'مذكرة رأي قانوني مسببة للموكل أو الشركة' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDraftDocType(item.id as DraftDocumentType)}
                        className={`p-3 rounded-2xl text-right transition cursor-pointer border flex flex-col justify-between ${
                          draftDocType === item.id
                            ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-400 text-slate-950 font-black shadow-sm'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold">{item.label}</span>
                        <span className="text-[10px] text-slate-500 mt-1 line-clamp-2">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Judgment or Case Source */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Archived Judgment Selection */}
                  <div>
                    <label className="block text-xs font-black text-slate-900 mb-1.5">
                      2. الاستناد إلى صك حكم من الأرشيف (اختياري):
                    </label>
                    <select
                      value={selectedJudgmentId}
                      onChange={(e) => {
                        setSelectedJudgmentId(e.target.value);
                        if (e.target.value) {
                          const j = judgments.find(item => item.id === e.target.value);
                          if (j?.analysis?.appealGrounds?.length) {
                            setLawyerDemands(j.analysis.appealGrounds.join('\n'));
                          }
                        }
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="">بدون ربط بصك حكم محدد</option>
                      {judgments.map((j) => (
                        <option key={j.id} value={j.id}>
                          صك #{j.deedNumber} - {j.court} ({j.title})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Active Case Selection */}
                  <div>
                    <label className="block text-xs font-black text-slate-900 mb-1.5">
                      أو الاستناد إلى قضية مسجلة بالنظام:
                    </label>
                    <select
                      value={selectedCaseId}
                      onChange={(e) => setSelectedCaseId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="">بدون ربط بقضية محددة</option>
                      {cases.map((c) => (
                        <option key={c.id} value={c.id}>
                          دعوى {c.caseNumber}/{c.caseYear} - {c.court} ({c.title})
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* 3. Reference Laws from Library */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-slate-900">
                      3. اختر الأنظمة والسوابق المرجعية المراد الاستناد إليها وتضمينها بالمذكرة:
                    </label>
                    <span className="text-xs text-indigo-700 font-bold">
                      {selectedLibraryDocIds.length} مستندات مختارة
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                    {documents.map((doc) => {
                      const isSelected = selectedLibraryDocIds.includes(doc.id);
                      return (
                        <div
                          key={doc.id}
                          onClick={() => toggleLibrarySelection(doc.id)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2 ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold'
                              : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className={`p-1 rounded-md shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            <Check className="w-3 h-3" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] block line-clamp-1 leading-tight">{doc.title}</span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">{getCategoryLabel(doc.category)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Lawyer Demands & Opponent Claims */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-black text-slate-900 mb-1.5">
                      4. طلبات الموكل والمحامي وأوجه الدفاع المراد التركيز عليها *:
                    </label>
                    <textarea
                      rows={3}
                      value={lawyerDemands}
                      onChange={(e) => setLawyerDemands(e.target.value)}
                      placeholder="اكتب هنا طلبات الموكل، مثل: نقض الحكم وإلغائه، إلزام الخصم بالتعويض والشرط الجزائي، ندب خبير هندسي، أو رفض دعوى الخصم لبطلان الإجراءات..."
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      مزاعم أو دفوع الخصم المراد تفنيدها ودحضها (اختياري):
                    </label>
                    <input
                      type="text"
                      value={opponentArguments}
                      onChange={(e) => setOpponentArguments(e.target.value)}
                      placeholder="مثال: يدعي الخصم سقوط الحق بالتقادم أو عدم استحقاق التعويض..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* 5. Firm Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    اسم المكتب / المحامي للترويسة الرسمية:
                  </label>
                  <input
                    type="text"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                {/* Submit & Generate Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('library')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    إلغاء
                  </button>

                  <button
                    type="button"
                    disabled={isDrafting}
                    onClick={handleGenerateDraft}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isDrafting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>جاري صياغة المذكرة القضائية واستنباط الأسانيد...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>توليد وصياغة المذكرة القضائية بالذكاء الاصطناعي</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: DRAFT RESULT & EXPORT TO WORD / PDF */}
        {/* ========================================================================= */}
        {activeTab === 'draft_result' && draftResult && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
              
              {/* Draft Result Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-black">
                      تمت الصياغة بنجاح
                    </span>
                    <span className="text-xs text-slate-500">
                      {draftResult.title}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    {draftResult.title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Export Word Button */}
                  <button
                    onClick={() => handleExportDraftToWord(draftResult)}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <FileType className="w-4 h-4" />
                    <span>تصدير Word (.doc)</span>
                  </button>

                  {/* Print to PDF */}
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة / حفظ PDF</span>
                  </button>

                  {/* Copy Text */}
                  <button
                    onClick={() => {
                      const text = `${draftResult.courtHeader}\n\n${draftResult.parties}\n\nأولاً: الوقائع:\n${draftResult.subjectAndFacts}\n\nثانياً: أوجه الطعن والدفوع:\n${draftResult.defensesAndGrounds}\n\nثالثاً: الأسانيد النظامية:\n${draftResult.legalReferencesAndArticles}\n\nرابعاً: الطلبات:\n${draftResult.finalDemands}`;
                      navigator.clipboard.writeText(text);
                      setCopiedDraft(true);
                      setTimeout(() => setCopiedDraft(false), 2000);
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedDraft ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
                    <span>{copiedDraft ? 'تم النسخ!' : 'نسخ النص'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('drafter')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    تعديل المدخلات
                  </button>
                </div>
              </div>

              {/* Procedural Advice / Summary Notes */}
              {draftResult.summaryNotes && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-950 font-black">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>توجيهات إجرائية للمحامي قبل التقديم:</span>
                  </div>
                  <p className="text-amber-900 leading-relaxed font-medium">
                    {draftResult.summaryNotes}
                  </p>
                </div>
              )}

              {/* Structured Visual Document Display */}
              <div className="bg-slate-50 border border-slate-300 rounded-3xl p-6 sm:p-8 space-y-6 text-slate-900 font-sans leading-relaxed">
                
                {/* Court Header */}
                <div className="text-center sm:text-right border-b border-slate-200 pb-4">
                  <span className="text-xs text-slate-500 font-bold block">{firmName}</span>
                  <h3 className="text-base font-black text-slate-950 mt-1">{draftResult.courtHeader}</h3>
                </div>

                {/* Parties */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 font-bold text-xs sm:text-sm text-slate-900">
                  {draftResult.parties}
                </div>

                {/* Section 1: Facts */}
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-slate-950 border-r-4 border-r-amber-500 pr-2">
                    أولاً: الوقائع وموضوع النزاع:
                  </h4>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {draftResult.subjectAndFacts}
                  </div>
                </div>

                {/* Section 2: Defenses & Flaw Analysis */}
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-slate-950 border-r-4 border-r-red-600 pr-2">
                    ثانياً: أوجه الطعن والدفوع الجوهرية وعوار الحكم المستأنف:
                  </h4>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {draftResult.defensesAndGrounds}
                  </div>
                </div>

                {/* Section 3: Legal Articles and References */}
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-slate-950 border-r-4 border-r-indigo-600 pr-2">
                    ثالثاً: الأسانيد الشرعية والنظامية والمبادئ القضائية المستند إليها:
                  </h4>
                  <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-200 text-xs sm:text-sm text-indigo-950 whitespace-pre-wrap leading-relaxed font-semibold">
                    {draftResult.legalReferencesAndArticles}
                  </div>
                </div>

                {/* Section 4: Final Demands */}
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-slate-950 border-r-4 border-r-emerald-600 pr-2">
                    رابعاً: الطلبات الختامية الجازمة:
                  </h4>
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-300 text-xs sm:text-sm text-emerald-950 font-bold whitespace-pre-wrap leading-relaxed">
                    {draftResult.finalDemands}
                  </div>
                </div>

                {/* Signature Placeholder */}
                <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>تم تحرير المذكرة وتدقيق أسانيدها النظامية</span>
                  <span>المستشار / المحامي الوكيل: ........................</span>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>المكتبة القانونية تدعم الربط التلقائي بمواد الأنظمة السعودية وصحف الاستئناف والنقض</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
          >
            إغلاق نافذة المكتبة
          </button>
        </div>

      </div>
    </div>
  );
};
