import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Scale, 
  Building2, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  FileText, 
  Sparkles,
  Download,
  Upload
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { CourtCase, CourtType, ViewMode, DateFilterType, PreparationChecklistItem, ArchivedJudgment, LegalDocument } from './types';
import { INITIAL_CASES } from './data/initialCases';
import { INITIAL_JUDGMENTS } from './data/initialJudgments';
import { INITIAL_LEGAL_LIBRARY } from './data/initialLegalLibrary';
import { 
  isWithin24Hours, 
  isToday, 
  isTomorrow, 
  getTodayString, 
  addDaysToDate,
  formatArabicDate,
  compareCasesByNearest
} from './utils/dateUtils';
import { 
  playAlertChime, 
  requestNotificationPermission, 
  sendDesktopNotification 
} from './utils/audioAlert';

import { Navbar } from './components/Navbar';
import { AlertsBanner } from './components/AlertsBanner';
import { StatsOverview } from './components/StatsOverview';
import { CourtFilterTabs } from './components/CourtFilterTabs';
import { CaseCard } from './components/CaseCard';
import { CaseTableView } from './components/CaseTableView';
import { CaseTimelineView } from './components/CaseTimelineView';
import { CalendarMonthView } from './components/CalendarMonthView';
import { CaseModal } from './components/CaseModal';
import { PostponeModal } from './components/PostponeModal';
import { CaseDetailsModal } from './components/CaseDetailsModal';
import { CourtRollPrintModal } from './components/CourtRollPrintModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ReportsModal } from './components/ReportsModal';
import { JudgmentsArchiveModal } from './components/JudgmentsArchiveModal';
import { LegalLibraryModal } from './components/LegalLibraryModal';
import { EnforcementModal } from './components/EnforcementModal';
import { AppLogo } from './components/AppLogo';
import { 
  saveJudgmentsToStorage, 
  loadJudgmentsFromStorage, 
  saveCasesToStorage, 
  loadCasesFromStorage, 
  saveLegalDocsToStorage, 
  loadLegalDocsFromStorage,
  isSystemInitialized 
} from './utils/persistentStorage';

const STORAGE_KEY = 'court_hearings_cases_v2';
const SOUND_KEY = 'court_sound_enabled';
const JUDGMENTS_STORAGE_KEY = 'court_archived_judgments_v1';
const LEGAL_LIBRARY_STORAGE_KEY = 'court_legal_library_v1';

export default function App() {
  // Load saved cases from localStorage or fallback to realistic initial cases only on first boot
  const [cases, setCases] = useState<CourtCase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read saved cases:', e);
    }
    return isSystemInitialized() ? [] : INITIAL_CASES;
  });

  // Load saved Judgments Archive
  const [judgments, setJudgments] = useState<ArchivedJudgment[]>(() => {
    try {
      const saved = localStorage.getItem(JUDGMENTS_STORAGE_KEY);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read saved judgments:', e);
    }
    return isSystemInitialized() ? [] : INITIAL_JUDGMENTS;
  });

  // Load saved Legal Library
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>(() => {
    try {
      const saved = localStorage.getItem(LEGAL_LIBRARY_STORAGE_KEY);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read saved legal documents:', e);
    }
    return isSystemInitialized() ? [] : INITIAL_LEGAL_LIBRARY;
  });

  // Asynchronous re-hydration from IndexedDB on startup to ensure full attachment fidelity and authoritative state
  useEffect(() => {
    let isMounted = true;

    loadCasesFromStorage().then((storedCases) => {
      if (isMounted && Array.isArray(storedCases)) {
        setCases(storedCases);
      }
    }).catch(err => console.warn('Could not hydrate cases from IndexedDB:', err));

    loadJudgmentsFromStorage().then((storedJudgments) => {
      if (isMounted && Array.isArray(storedJudgments)) {
        setJudgments(storedJudgments);
      }
    }).catch(err => console.warn('Could not hydrate judgments from IndexedDB:', err));

    loadLegalDocsFromStorage().then((storedDocs) => {
      if (isMounted && Array.isArray(storedDocs)) {
        setLegalDocuments(storedDocs);
      }
    }).catch(err => console.warn('Could not hydrate legal library from IndexedDB:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(SOUND_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  // Filter & View State
  const [selectedCourt, setSelectedCourt] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Modal State
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isJudgmentsModalOpen, setIsJudgmentsModalOpen] = useState(false);
  const [isLegalLibraryModalOpen, setIsLegalLibraryModalOpen] = useState(false);
  const [isEnforcementModalOpen, setIsEnforcementModalOpen] = useState(false);
  const [draftingTargetJudgment, setDraftingTargetJudgment] = useState<ArchivedJudgment | null>(null);

  const [editingCase, setEditingCase] = useState<CourtCase | null>(null);
  const [detailsCase, setDetailsCase] = useState<CourtCase | null>(null);
  const [postponeTargetCase, setPostponeTargetCase] = useState<CourtCase | null>(null);
  const [caseToDelete, setCaseToDelete] = useState<CourtCase | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPrintRollOpen, setIsPrintRollOpen] = useState(false);
  const [presetModalDate, setPresetModalDate] = useState<string | null>(null);
  const [presetIsEnforcement, setPresetIsEnforcement] = useState<boolean>(false);

  // Save cases to storage on changes
  useEffect(() => {
    saveCasesToStorage(cases).catch(e => console.warn('Save cases error:', e));
  }, [cases]);

  // Save Judgments Archive to storage
  useEffect(() => {
    saveJudgmentsToStorage(judgments).catch(e => console.warn('Save judgments error:', e));
  }, [judgments]);

  // Save Legal Library to storage
  useEffect(() => {
    saveLegalDocsToStorage(legalDocuments).catch(e => console.warn('Save legal documents error:', e));
  }, [legalDocuments]);

  // Save sound setting
  useEffect(() => {
    localStorage.setItem(SOUND_KEY, String(soundEnabled));
  }, [soundEnabled]);

  // Check 24-hour alerts & play gentle reminder upon startup if urgent cases exist
  const hasAlertedRef = useRef(false);
  useEffect(() => {
    const urgentCount = cases.filter(isWithin24Hours).length;
    if (urgentCount > 0 && soundEnabled && !hasAlertedRef.current) {
      playAlertChime();
      hasAlertedRef.current = true;
      if (hasNotificationPermission) {
        sendDesktopNotification(
          'تنبيه جلسات القضايا (أقل من 24 ساعة)',
          `لديك ${urgentCount} جلسات منعقدة خلال الـ 24 ساعة القادمة. يرجى مراجعة تجهيزات الرول.`
        );
      }
    }
  }, [cases, soundEnabled, hasNotificationPermission]);

  // Helper to identify enforcement cases
  const isEnforcementCase = (c: CourtCase): boolean => {
    return Boolean(
      (c.enforcement && c.enforcement.isEnforcement) || 
      c.court === 'محكمة التنفيذ' ||
      (c.enforcement && (c.enforcement.enforcementNumber || c.enforcement.amount || c.enforcement.applicantName || c.enforcement.respondentName))
    );
  };

  // Helper to identify pure standalone enforcement requests with no hearing sessions
  const isPureEnforcementOnly = (c: CourtCase): boolean => {
    return Boolean(
      c.court === 'محكمة التنفيذ' && 
      !c.isClosed && 
      c.status !== 'judged' && 
      !c.verdictText && 
      !c.sessionDate
    );
  };

  // Helper to check if a case is closed/judged
  const isCaseClosed = (c: CourtCase): boolean => {
    return Boolean(c.isClosed || c.status === 'judged' || c.status === 'struck_off' || Boolean(c.verdictText));
  };

  // Dedicated Session-Only & Substantive Cases (excluding pure standalone execution requests)
  const sessionCases = useMemo(() => {
    return cases.filter((c) => !isPureEnforcementOnly(c));
  }, [cases]);

  // Pre-ordered standard courts list as requested
  const allCourts = useMemo(() => [
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
  ], []);

  // Helper function to match cases to the requested court categories
  const matchCaseToCourt = (caseCourt: string, targetCourt: string): boolean => {
    if (targetCourt === 'all') return true;
    if (!caseCourt) return targetCourt === 'أخرى';
    if (caseCourt === targetCourt) return true;

    if (targetCourt === 'المحكمة العامة') {
      return caseCourt === 'المحكمة العامة' || caseCourt === 'المحكمة الابتدائية' || caseCourt === 'المحكمة الابتدائية المدنية' || caseCourt === 'المحكمة المدنية';
    }

    if (targetCourt === 'المحكمة التجارية') {
      return caseCourt === 'المحكمة التجارية' || caseCourt.includes('تجاري');
    }

    if (targetCourt === 'المحكمة العمالية') {
      return caseCourt === 'المحكمة العمالية' || (caseCourt.includes('عمال') && !caseCourt.includes('تسوية') && !caseCourt.includes('ودية'));
    }

    if (targetCourt === 'التسوية الودية') {
      return caseCourt === 'التسوية الودية' || caseCourt.includes('تسوية') || caseCourt.includes('التسوية') || caseCourt.includes('ودية') || caseCourt.includes('الودية');
    }

    if (targetCourt === 'محكمة التنفيذ') {
      return caseCourt === 'محكمة التنفيذ' || caseCourt.includes('التنفيذ');
    }

    if (targetCourt === 'محكمة القضاء الإداري') {
      return caseCourt === 'محكمة القضاء الإداري' || caseCourt === 'مجلس الدولة / القضاء الإداري' || caseCourt.includes('القضاء الإداري') || caseCourt.includes('مجلس الدولة') || caseCourt.includes('ديوان المظالم');
    }

    if (targetCourt === 'المحكمة الاقتصادية') {
      return caseCourt === 'المحكمة الاقتصادية' || caseCourt.includes('اقتصاد');
    }

    if (targetCourt === 'محكمة الأسرة') {
      return caseCourt === 'محكمة الأسرة' || caseCourt.includes('أسرة') || caseCourt.includes('أحوال شخصية');
    }

    if (targetCourt === 'محكمة الجنح / الجنايات') {
      return caseCourt === 'محكمة الجنح / الجنايات' || caseCourt === 'محكمة الجنح/ الجنايات' || caseCourt === 'محكمة الجنايات' || caseCourt === 'محكمة الجنح' || caseCourt.includes('الجنايات') || caseCourt.includes('الجنح');
    }

    if (targetCourt === 'محكمة النقض / العليا') {
      return caseCourt === 'محكمة النقض / العليا' || caseCourt === 'محكمة النقض/العليا' || caseCourt === 'محكمة النقض' || caseCourt === 'المحكمة العليا' || caseCourt === 'محكمة الاستئناف' || caseCourt.includes('النقض') || caseCourt.includes('العليا') || caseCourt.includes('الاستئناف');
    }

    if (targetCourt === 'أخرى') {
      const knownCourts = [
        'المحكمة العامة', 'المحكمة التجارية', 'المحكمة العمالية', 
        'التسوية الودية', 'محكمة التنفيذ', 'محكمة القضاء الإداري', 'المحكمة الاقتصادية', 
        'محكمة الأسرة', 'محكمة الجنح / الجنايات', 'محكمة النقض / العليا'
      ];
      return !knownCourts.some(kc => matchCaseToCourt(caseCourt, kc));
    }

    return caseCourt === targetCourt;
  };

  // Urgent 24h cases list (sorted from nearest to furthest, sessions only)
  const urgent24hCases = useMemo(() => {
    return sessionCases.filter(isWithin24Hours).sort(compareCasesByNearest);
  }, [sessionCases]);

  // Filtered cases list based on search, court, and date filter (sorted from nearest to furthest, sessions only)
  const filteredCases = useMemo(() => {
    return sessionCases
      .filter((c) => {
        // 1. Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchNumber = c.caseNumber.toLowerCase().includes(q);
          const matchYear = c.caseYear.toLowerCase().includes(q);
          const matchTitle = c.title.toLowerCase().includes(q);
          const matchClient = c.clientName.toLowerCase().includes(q);
          const matchOpponent = c.opponentName.toLowerCase().includes(q);
          const matchCircuit = c.circuit.toLowerCase().includes(q);
          const matchCourt = c.court.toLowerCase().includes(q);
          const matchLawyer = (c.assignedLawyer || '').toLowerCase().includes(q);
          const matchDemands = (c.demands || '').toLowerCase().includes(q);
          const matchSubject = (c.subjectDetails || '').toLowerCase().includes(q);
          const matchVerdict = (c.verdictText || '').toLowerCase().includes(q);
          const matchEnforcement = c.enforcement ? (
            (c.enforcement.enforcementNumber || '').toLowerCase().includes(q) ||
            (c.enforcement.applicantName || '').toLowerCase().includes(q) ||
            (c.enforcement.respondentName || '').toLowerCase().includes(q)
          ) : false;

          if (!(matchNumber || matchYear || matchTitle || matchClient || matchOpponent || matchCircuit || matchCourt || matchLawyer || matchDemands || matchSubject || matchVerdict || matchEnforcement)) {
            return false;
          }
        }

        // 2. Court Filter
        if (selectedCourt !== 'all' && !matchCaseToCourt(c.court, selectedCourt)) {
          return false;
        }

        // 3. Date Filter
        if (selectedDateFilter === '24h') {
          return isWithin24Hours(c);
        }
        if (selectedDateFilter === 'today') {
          return isToday(c.sessionDate) && !isCaseClosed(c);
        }
        if (selectedDateFilter === 'tomorrow') {
          return isTomorrow(c.sessionDate) && !isCaseClosed(c);
        }
        if (selectedDateFilter === 'this_week') {
          const todayStr = getTodayString();
          const next7Days = addDaysToDate(todayStr, 7);
          return Boolean(c.sessionDate && c.sessionDate >= todayStr && c.sessionDate <= next7Days && !isCaseClosed(c));
        }
        if (selectedDateFilter === 'past') {
          // All closed / judged cases (including those with active or ended enforcement)
          return isCaseClosed(c);
        }

        return true;
      })
      .sort(compareCasesByNearest);
  }, [sessionCases, searchQuery, selectedCourt, selectedDateFilter]);

  // Calculate court case counts (sessions only)
  const courtCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sessionCases.length };
    
    allCourts.forEach((court) => {
      counts[court] = sessionCases.filter((c) => matchCaseToCourt(c.court, court)).length;
    });

    return counts;
  }, [sessionCases, allCourts]);

  // Calculate date filter counts (sessions only)
  const dateFilterCounts = useMemo(() => {
    const todayStr = getTodayString();
    const next7Days = addDaysToDate(todayStr, 7);

    return {
      all: sessionCases.length,
      '24h': sessionCases.filter(isWithin24Hours).length,
      today: sessionCases.filter((c) => isToday(c.sessionDate) && !isCaseClosed(c)).length,
      tomorrow: sessionCases.filter((c) => isTomorrow(c.sessionDate) && !isCaseClosed(c)).length,
      this_week: sessionCases.filter((c) => Boolean(c.sessionDate && c.sessionDate >= todayStr && c.sessionDate <= next7Days && !isCaseClosed(c))).length,
      this_month: sessionCases.length,
      past: sessionCases.filter((c) => isCaseClosed(c)).length,
      custom: 0,
    };
  }, [sessionCases]);

  // Calculate active enforcement count
  const enforcementActiveCount = useMemo(() => {
    return cases.filter((c) => {
      const hasEnf = isEnforcementCase(c);
      if (!hasEnf) return false;
      const status = c.enforcement?.enforcementStatus || (c.court === 'محكمة التنفيذ' && c.status !== 'judged' ? 'نشط' : (c.status === 'judged' ? 'نشط' : 'نشط'));
      return status === 'نشط';
    }).length;
  }, [cases]);

  // Handlers for Case CRUD
  const handleAddNewCase = (customDate?: string, isEnforcement = false) => {
    setEditingCase(null);
    setPresetModalDate(customDate || null);
    setPresetIsEnforcement(isEnforcement);
    setIsCaseModalOpen(true);
  };

  const handleEditCase = (c: CourtCase) => {
    setEditingCase(c);
    setPresetModalDate(null);
    setPresetIsEnforcement(isEnforcementCase(c));
    setIsCaseModalOpen(true);
  };

  const handleDeleteCase = (id: string) => {
    const target = cases.find((c) => c.id === id);
    if (target) {
      setCaseToDelete(target);
    } else {
      setCases((prev) => prev.filter((c) => c.id !== id));
      if (detailsCase?.id === id) setDetailsCase(null);
    }
  };

  const handleConfirmDelete = (id: string) => {
    setCases((prev) => prev.filter((c) => c.id !== id));
    if (detailsCase?.id === id) setDetailsCase(null);
    if (editingCase?.id === id) {
      setEditingCase(null);
      setIsCaseModalOpen(false);
    }
    setCaseToDelete(null);
    setToastMessage('تم حذف القضية بجميع بياناتها وسجلاتها بنجاح');
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSaveCase = (caseData: Partial<CourtCase>) => {
    const now = new Date().toISOString();
    const isJudged = Boolean(caseData.isClosed) || caseData.sessionStage === 'نطق بالحكم' || Boolean(caseData.verdictText) || caseData.status === 'judged';
    const computedStatus = isJudged ? 'judged' : (caseData.status || 'active');

    if (editingCase) {
      // Update
      setCases((prev) =>
        prev.map((c) =>
          c.id === editingCase.id
            ? ({ 
                ...c, 
                ...caseData, 
                isClosed: isJudged,
                judgmentType: isJudged ? (caseData.judgmentType || c.judgmentType || 'final') : undefined,
                status: computedStatus, 
                remind24h: isJudged ? false : (caseData.remind24h ?? c.remind24h ?? true),
                updatedAt: now 
              } as CourtCase)
            : c
        )
      );
      if (detailsCase?.id === editingCase.id) {
        setDetailsCase((prev) => prev ? ({ 
          ...prev, 
          ...caseData, 
          isClosed: isJudged,
          judgmentType: isJudged ? (caseData.judgmentType || prev.judgmentType || 'final') : undefined,
          status: computedStatus, 
          remind24h: isJudged ? false : (caseData.remind24h ?? prev.remind24h ?? true),
          updatedAt: now 
        } as CourtCase) : null);
      }
    } else {
      // Create new
      const newCase: CourtCase = {
        id: `case-${Date.now()}`,
        caseNumber: caseData.caseNumber || '',
        caseYear: caseData.caseYear || new Date().getFullYear().toString(),
        court: caseData.court || 'المحكمة الابتدائية',
        circuit: caseData.circuit || 'الدائرة الأولى',
        judge: caseData.judge || '',
        title: caseData.title || '',
        clientName: caseData.clientName || '',
        clientRole: caseData.clientRole || 'مدعي',
        clientPhone: caseData.clientPhone || '',
        opponentName: caseData.opponentName || '',
        opponentLawyer: caseData.opponentLawyer || '',
        assignedLawyer: caseData.assignedLawyer || '',
        sessionDate: caseData.sessionDate || getTodayString(),
        sessionTime: caseData.sessionTime || '09:30',
        sessionStage: caseData.sessionStage || 'مرافعة',
        isClosed: isJudged,
        judgmentType: isJudged ? (caseData.judgmentType || 'final') : undefined,
        status: computedStatus,
        previousDecision: caseData.previousDecision || '',
        demands: caseData.demands || '',
        notes: caseData.notes || '',
        checklist: caseData.checklist || [],
        remind24h: isJudged ? false : (caseData.remind24h ?? true),
        subjectDetails: caseData.subjectDetails || '',
        subjectFiles: caseData.subjectFiles || [],
        clientMemo: caseData.clientMemo,
        opponentMemo: caseData.opponentMemo,
        verdictText: caseData.verdictText || '',
        verdictDate: caseData.verdictDate || '',
        deedDate: caseData.deedDate,
        primaryJudgmentDeedFile: caseData.primaryJudgmentDeedFile,
        appealJudgmentDeedFile: caseData.appealJudgmentDeedFile,
        enforcement: caseData.enforcement,
        history: [],
        createdAt: now,
        updatedAt: now,
      };

      setCases((prev) => [newCase, ...prev]);
    }
  };

  // Postpone / Log Decision handler
  const handlePostponeSubmit = (
    caseId: string,
    decision: string,
    nextDate: string,
    nextTime: string,
    nextDemands: string,
    reason?: string,
    nextLawyer?: string
  ) => {
    const now = new Date().toISOString();

    setCases((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          const historyEntry = {
            id: `hist-${Date.now()}`,
            date: c.sessionDate,
            decision: decision,
            lawyer: c.assignedLawyer || '',
            reason: reason || '',
            notes: c.demands || '',
            createdAt: now,
          };

          const isJudged = decision.includes('حكمت المحكمة') || decision.includes('انقضاء') || decision.includes('رفض الدعوى');

          return {
            ...c,
            previousDecision: decision,
            sessionDate: nextDate,
            sessionTime: nextTime || c.sessionTime,
            demands: nextDemands,
            assignedLawyer: nextLawyer !== undefined && nextLawyer !== '' ? nextLawyer : c.assignedLawyer,
            status: isJudged ? 'judged' : 'postponed',
            history: [historyEntry, ...(c.history || [])],
            updatedAt: now,
          };
        }
        return c;
      })
    );

    // If judgment achieved, trigger celebration
    if (decision.includes('حكمت المحكمة') || decision.includes('لصالحنا')) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  // Quick Next Session Scheduler from Case Details
  const handleUpdateNextSession = (
    caseId: string,
    data: {
      nextDate: string;
      nextTime: string;
      nextDemands?: string;
      decisionNote?: string;
      assignedLawyer?: string;
    }
  ) => {
    const now = new Date().toISOString();

    setCases((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          const historyEntry = {
            id: `hist-${Date.now()}`,
            date: c.sessionDate,
            decision: data.decisionNote || `تأجيل وتحديد موعد الجلسة القادمة ليوم ${formatArabicDate(data.nextDate)}`,
            lawyer: c.assignedLawyer || '',
            reason: data.decisionNote || '',
            notes: c.demands || '',
            createdAt: now,
          };

          return {
            ...c,
            previousDecision: data.decisionNote || c.previousDecision,
            sessionDate: data.nextDate,
            sessionTime: data.nextTime || c.sessionTime,
            demands: data.nextDemands !== undefined && data.nextDemands.trim() !== '' ? data.nextDemands : c.demands,
            assignedLawyer:
              data.assignedLawyer !== undefined && data.assignedLawyer.trim() !== ''
                ? data.assignedLawyer
                : c.assignedLawyer,
            status: 'postponed',
            history: [historyEntry, ...(c.history || [])],
            updatedAt: now,
          };
        }
        return c;
      })
    );
  };

  // Checklist item toggle
  const handleToggleChecklist = (caseId: string, itemId: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          const updatedChecklist = c.checklist.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          );
          return { ...c, checklist: updatedChecklist };
        }
        return c;
      })
    );

    if (detailsCase && detailsCase.id === caseId) {
      setDetailsCase((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          checklist: prev.checklist.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        };
      });
    }
  };

  // Add item to checklist
  const handleAddChecklistItem = (caseId: string, text: string) => {
    const newItem: PreparationChecklistItem = {
      id: `chk-${Date.now()}`,
      text,
      completed: false,
    };

    setCases((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          return { ...c, checklist: [...c.checklist, newItem] };
        }
        return c;
      })
    );

    if (detailsCase && detailsCase.id === caseId) {
      setDetailsCase((prev) => {
        if (!prev) return null;
        return { ...prev, checklist: [...prev.checklist, newItem] };
      });
    }
  };

  // Sound toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) playAlertChime();
  };

  // Request browser notification permissions
  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission();
    setHasNotificationPermission(granted);
    if (granted) {
      sendDesktopNotification('تم تفعيل التنبيهات الذكية', 'ستصلك إشعارات قبل مواعيد جلسات المحاكم بـ 24 ساعة.');
    }
  };

  // Export JSON Backup
  const handleExportData = () => {
    const dataStr = JSON.stringify(cases, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `قضايا_وجلسات_المحاكم_${getTodayString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON Backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setCases(imported);
          alert(`تم استيراد ${imported.length} قضية بنجاح!`);
        } else {
          alert('الملف غير متطابق مع نسق بيانات القضايا.');
        }
      } catch (err) {
        alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      
      {/* Top Navbar */}
      <Navbar
        urgentCount={urgent24hCases.length}
        enforcementCount={enforcementActiveCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddNewCase={() => handleAddNewCase()}
        onOpenPrintRoll={() => setIsPrintRollOpen(true)}
        onOpenReports={() => setIsReportsOpen(true)}
        onOpenJudgmentsArchive={() => setIsJudgmentsModalOpen(true)}
        onOpenLegalLibrary={() => {
          setDraftingTargetJudgment(null);
          setIsLegalLibraryModalOpen(true);
        }}
        onOpenEnforcement={() => setIsEnforcementModalOpen(true)}
        onToggleUrgentPanel={() => {
          setSelectedDateFilter('24h');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onRequestNotifications={handleRequestNotifications}
        hasNotificationPermission={hasNotificationPermission}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* 24-Hour Urgent Alerts Accordion Banner */}
        <AlertsBanner
          urgentCases={urgent24hCases}
          onOpenCaseDetails={(c) => setDetailsCase(c)}
          onPostponeCase={(c) => setPostponeTargetCase(c)}
          onToggleChecklist={handleToggleChecklist}
        />

        {/* Stats Metrics Overview */}
        <StatsOverview
          cases={sessionCases}
          onSelectFilter={(filter) => setSelectedDateFilter(filter)}
        />

        {/* Filters & View Switcher */}
        <CourtFilterTabs
          selectedCourt={selectedCourt}
          onSelectCourt={setSelectedCourt}
          courtCounts={courtCounts}
          selectedDateFilter={selectedDateFilter}
          onSelectDateFilter={setSelectedDateFilter}
          dateFilterCounts={dateFilterCounts}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          allCourts={allCourts}
        />

        {/* Views Rendering */}
        {viewMode === 'cards' && (
          <div>
            {filteredCases.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                <AppLogo size="xl" showRing={true} withGlow={true} className="mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
                  لا توجد قضايا أو جلسات مطابقة
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5">
                  جرب تغيير خيارات التصفية أو البحث، أو أضف جلسة جديدة برول اليوم.
                </p>
                <button
                  onClick={() => handleAddNewCase()}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer"
                >
                  + إضافة جلسة جديدة الآن
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredCases.map((c) => (
                  <CaseCard
                    key={c.id}
                    caseItem={c}
                    onOpenDetails={(item) => setDetailsCase(item)}
                    onEdit={(item) => handleEditCase(item)}
                    onDelete={handleDeleteCase}
                    onPostpone={(item) => setPostponeTargetCase(item)}
                    onToggleChecklist={handleToggleChecklist}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'table' && (
          <CaseTableView
            cases={filteredCases}
            onOpenDetails={(c) => setDetailsCase(c)}
            onEdit={(c) => handleEditCase(c)}
            onDelete={handleDeleteCase}
            onPostpone={(c) => setPostponeTargetCase(c)}
            onOpenPrintRoll={() => setIsPrintRollOpen(true)}
          />
        )}

        {viewMode === 'timeline' && (
          <CaseTimelineView
            cases={filteredCases}
            onOpenDetails={(c) => setDetailsCase(c)}
            onPostpone={(c) => setPostponeTargetCase(c)}
            onDelete={handleDeleteCase}
          />
        )}

        {viewMode === 'calendar' && (
          <CalendarMonthView
            cases={sessionCases}
            onOpenDetails={(c) => setDetailsCase(c)}
            onPostpone={(c) => setPostponeTargetCase(c)}
            onAddNewCaseOnDate={(dateStr) => handleAddNewCase(dateStr)}
          />
        )}

      </main>

      {/* Case Create / Edit Modal */}
      <CaseModal
        isOpen={isCaseModalOpen}
        onClose={() => {
          setIsCaseModalOpen(false);
          setEditingCase(null);
          setPresetModalDate(null);
          setPresetIsEnforcement(false);
        }}
        onSave={handleSaveCase}
        onDelete={handleDeleteCase}
        initialData={
          editingCase || 
          (presetIsEnforcement 
            ? ({ 
                court: 'محكمة التنفيذ', 
                circuit: 'دائرة التنفيذ الأولى',
                enforcement: {
                  isEnforcement: true,
                  paymentStatus: 'سداد جزئي',
                  enforcementStatus: 'نشط',
                  deedType: 'صك حكم',
                  requestDate: presetModalDate || getTodayString(),
                }
              } as any)
            : (presetModalDate ? ({ sessionDate: presetModalDate } as any) : null))
        }
        allCourts={allCourts}
      />

      {/* Postpone Session / Log Decision Modal */}
      <PostponeModal
        isOpen={!!postponeTargetCase}
        onClose={() => setPostponeTargetCase(null)}
        caseItem={postponeTargetCase}
        onPostponeSubmit={handlePostponeSubmit}
      />

      {/* Full Case Details Dossier Modal */}
      <CaseDetailsModal
        isOpen={!!detailsCase}
        onClose={() => setDetailsCase(null)}
        caseItem={detailsCase ? (cases.find((c) => c.id === detailsCase.id) || detailsCase) : null}
        onEdit={(c) => handleEditCase(c)}
        onDelete={handleDeleteCase}
        onPostpone={(c) => setPostponeTargetCase(c)}
        onUpdateNextSession={handleUpdateNextSession}
        onToggleChecklist={handleToggleChecklist}
        onAddChecklistItem={handleAddChecklistItem}
      />

      {/* Printable Court Roll Sheet Modal */}
      <CourtRollPrintModal
        isOpen={isPrintRollOpen}
        onClose={() => setIsPrintRollOpen(false)}
        cases={sessionCases}
        allCourts={allCourts}
      />

      {/* Reports & Legal Analytics Modal */}
      <ReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        cases={cases}
        onOpenCaseDetails={(c) => setDetailsCase(c)}
      />

      {/* Judgments Archive & Flaw Analysis Modal */}
      <JudgmentsArchiveModal
        isOpen={isJudgmentsModalOpen}
        onClose={() => setIsJudgmentsModalOpen(false)}
        judgments={judgments}
        onAddJudgment={(j) => {
          setJudgments(prev => [j, ...prev]);
          setToastMessage(`تمت أرشفة صك الحكم ${j.deedNumber} وتحليله بنجاح!`);
          setTimeout(() => setToastMessage(null), 3000);
        }}
        onUpdateJudgment={(updated) => {
          setJudgments(prev => prev.map(j => j.id === updated.id ? updated : j));
        }}
        onDeleteJudgment={(id) => {
          setJudgments(prev => prev.filter(j => j.id !== id));
          setToastMessage('تم حذف صك الحكم من الأرشيف.');
          setTimeout(() => setToastMessage(null), 3000);
        }}
        onOpenDraftingWithJudgment={(j) => {
          setIsJudgmentsModalOpen(false);
          setDraftingTargetJudgment(j);
          setIsLegalLibraryModalOpen(true);
        }}
        cases={cases}
      />

      {/* Legal Library & Smart AI Drafting Studio Modal */}
      <LegalLibraryModal
        isOpen={isLegalLibraryModalOpen}
        onClose={() => {
          setIsLegalLibraryModalOpen(false);
          setDraftingTargetJudgment(null);
        }}
        documents={legalDocuments}
        onAddDocument={(doc) => {
          setLegalDocuments(prev => [doc, ...prev]);
          setToastMessage(`تمت إضافة "${doc.title}" إلى المكتبة القانونية بنجاح!`);
          setTimeout(() => setToastMessage(null), 3000);
        }}
        onDeleteDocument={(id) => {
          setLegalDocuments(prev => prev.filter(d => d.id !== id));
          setToastMessage('تم حذف المستند من المكتبة.');
          setTimeout(() => setToastMessage(null), 3000);
        }}
        judgments={judgments}
        cases={cases}
        initialDraftingJudgment={draftingTargetJudgment}
      />

      {/* Enforcement & Execution Cases Management Modal (لوحة إدارة ومتابعة طلبات وسندات التنفيذ) */}
      <EnforcementModal
        isOpen={isEnforcementModalOpen}
        onClose={() => setIsEnforcementModalOpen(false)}
        cases={cases}
        onOpenCaseDetails={(c) => {
          setIsEnforcementModalOpen(false);
          setDetailsCase(c);
        }}
        onEditCase={(c) => {
          setIsEnforcementModalOpen(false);
          handleEditCase(c);
        }}
        onAddNewEnforcementCase={() => {
          setIsEnforcementModalOpen(false);
          handleAddNewCase(undefined, true);
        }}
      />

      {/* In-App Confirmation Modal for Permanent Delete */}
      <ConfirmDeleteModal
        isOpen={!!caseToDelete}
        caseItem={caseToDelete}
        onClose={() => setCaseToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer (No Print) */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 text-slate-300 font-bold">
            <AppLogo size="xs" showRing={false} />
            <span>نظام إدارة المكتب القانوني ومتابعة جلسات المحاكم ورول القضايا (HK Law)</span>
          </div>
          <p className="text-slate-400">
            تنبيهات ذكية قبل 24 ساعة • تصنيف شامل حسب المحاكم • سجل القرارات وتوثيق الأحكام
          </p>
        </div>
      </footer>

    </div>
  );
}
