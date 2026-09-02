export type CourtType =
  | 'المحكمة العامة'
  | 'المحكمة التجارية'
  | 'المحكمة العمالية'
  | 'التسوية الودية'
  | 'محكمة التنفيذ'
  | 'محكمة القضاء الإداري'
  | 'المحكمة الاقتصادية'
  | 'محكمة الأسرة'
  | 'محكمة الجنح / الجنايات'
  | 'محكمة النقض / العليا'
  | 'المحكمة الابتدائية'
  | 'محكمة الاستئناف'
  | 'مجلس الدولة / القضاء الإداري'
  | 'محكمة الجنايات'
  | 'محكمة الجنح'
  | 'محكمة النقض'
  | 'أخرى';

export type EnforcementDeedType = 'صك حكم' | 'وثيقة صلح تراضي' | 'سند لأمر' | 'أخرى';
export type EnforcementPaymentStatus = 'سداد كلي' | 'سداد جزئي';
export type EnforcementStatus = 'نشط' | 'منتهي';

export interface EnforcementDetails {
  isEnforcement: boolean;                   // تفعيل خانة وبيانات التنفيذ
  applicantName?: string;                   // اسم طالب التنفيذ
  respondentName?: string;                  // اسم المنفذ ضده
  amount?: string;                          // مبلغ التنفيذ المطلوب سداده
  paidAmount?: string;                      // المبلغ الذي تم سداده
  remainingAmount?: string;                 // المبلغ المتبقي
  paymentStatus?: EnforcementPaymentStatus; // سداد كلي | سداد جزئي
  enforcementStatus?: EnforcementStatus;   // نشط | منتهي
  deedType?: EnforcementDeedType;           // نوع السند (صك حكم، وثيقة صلح تراضي، سند لأمر، أخرى)
  customDeedType?: string;                  // نوع السند المخصص في حال اختيار أخرى
  enforcementNumber?: string;               // رقم طلب التنفيذ
  requestDate?: string;                     // تاريخ تقديم / قيد طلب التنفيذ
  notes?: string;                           // ملاحظات التنفيذ
}

export type SessionStage =
  | 'مرافعة'
  | 'تقديم مستندات ومذكرات'
  | 'استجواب وسماع شهود'
  | 'حجز للحكم'
  | 'نطق بالحكم'
  | 'تقرير الخبير'
  | 'الصلح والتسوية'
  | 'تجديد حبس'
  | 'إعادة إعلان'
  | 'أخرى';

export type CaseStatus =
  | 'active'      // سارية / قادمة
  | 'postponed'   // مؤجلة
  | 'judged'      // محكوم فيها / منتهية
  | 'struck_off'; // مشطوبة

export type JudgmentType = 'final' | 'appealable'; // حكم نهائي | حكم قابل للاستئناف

export type ClientRole =
  | 'مدعي'
  | 'مدعى عليه'
  | 'مجني عليه'
  | 'متهم'
  | 'مستأنف'
  | 'مستأنف ضده'
  | 'طاعن'
  | 'مطعون ضده'
  | 'طالب تنفيذ'
  | 'منفذ ضده'
  | 'شاهد'
  | 'أخرى';

export interface CaseAttachment {
  id: string;
  name: string;
  size: number;            // in bytes
  type: 'pdf' | 'word' | 'other';
  dataUrl?: string;        // base64 data for download and preview
  uploadedAt: string;
}

export interface CaseMemorandum {
  text?: string;
  files: CaseAttachment[];
  updatedAt?: string;
}

export interface PreparationChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface SessionHistoryItem {
  id: string;
  date: string;
  decision: string;
  lawyer?: string;
  reason?: string;
  notes?: string;
  createdAt: string;
}

export interface CourtCase {
  id: string;
  caseNumber: string;         // رقم الدعوى / القضية
  caseYear: string;           // السنة القضائية
  court: CourtType | string;  // اسم المحكمة
  circuit: string;            // الدائرة / القاعة
  judge?: string;             // رئيس الدائرة / القاضي
  title: string;              // عنوان الدعوى / تصنيفها
  subjectDetails?: string;    // موضوع ووقائع الدعوى (إدخال أو لصق نصي)
  subjectFiles?: CaseAttachment[]; // ملفات موضوع الدعوى (PDF / Word)
  clientMemo?: CaseMemorandum;     // مذكرة الموكل (نص + ملفات PDF / Word)
  opponentMemo?: CaseMemorandum;   // مذكرة الخصم (نص + ملفات PDF / Word)
  clientName: string;         // اسم الموكل
  clientRole: ClientRole;     // صفة الموكل
  clientPhone?: string;       // رقم هاتف الموكل
  opponentName: string;       // اسم الخصم
  opponentLawyer?: string;    // محامي الخصم
  assignedLawyer?: string;    // اسم المحامي الحاضر عن الموكل في الجلسة
  sessionDate?: string;       // YYYY-MM-DD (خاصة بجلسات المرافعات والمحاكم، مستبعدة من طلبات التنفيذ)
  sessionTime?: string;       // HH:mm (خاصة بجلسات المرافعات والمحاكم، مستبعدة من طلبات التنفيذ)
  sessionStage?: SessionStage | string; // نوع أو مرحلة الجلسة (خاصة بجلسات المرافعات والمحاكم)
  status: CaseStatus;
  isClosed?: boolean;         // قضية منتهية
  judgmentType?: JudgmentType; // نوع الحكم: 'final' (حكم نهائي) | 'appealable' (حكم قابل للاستئناف)
  verdictText?: string;       // منطوق الحكم الصادر (في حال نطق بالحكم / انتهاء الدعوى)
  verdictDate?: string;       // تاريخ صدور الحكم (الميلادي وما يوافقه بتقويم أم القرى)
  deedDate?: string;          // تاريخ صدور صك الحكم (تبقى الدعوى نشطة لمدة 30 يوماً من تاريخ الصك ثم تتحول لمنتهية)
  primaryJudgmentDeedFile?: CaseAttachment; // ملف صك الحكم الابتدائي (PDF / Word / صورة)
  appealJudgmentDeedFile?: CaseAttachment;  // ملف صك حكم الاستئناف (PDF / Word / صورة)
  enforcement?: EnforcementDetails;         // خانة وبيانات التنفيذ القضائي
  previousDecision?: string;  // القرار السابق
  demands?: string;           // المطلوب في الجلسة
  notes?: string;             // ملاحظات المحامي
  checklist: PreparationChecklistItem[]; // مهام وتجهيزات الجلسة
  remind24h: boolean;         // تنبيه قبل 24 ساعة
  history: SessionHistoryItem[]; // سجل الجلسات السابقة
  priority?: 'normal' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'cards' | 'table' | 'calendar' | 'timeline';

export type DateFilterType = 'all' | '24h' | 'today' | 'tomorrow' | 'this_week' | 'this_month' | 'past' | 'custom';

export type ReportType =
  | 'comprehensive'          // التقرير الشامل لقضايا وجلسات المحاكم
  | 'active'                 // القضايا النشطة (المتداولة)
  | 'inactive'               // القضايا غير النشطة (المنتهية)
  | 'lawyer_cases'           // قضايا باسم محامي (المترافع فيها عن الموكل)
  | 'enforcement_financial'  // تقرير قضايا التنفيذ المالي (الكل)
  | 'enforcement_active'     // قضايا التنفيذ المالي النشطة
  | 'enforcement_inactive'   // قضايا التنفيذ المالي غير النشطة / المنتهية
  | 'saaed_plaintiff'        // القضايا المدعي فيها شركة ساعد
  | 'saaed_defendant';       // القضايا المدعى عليها شركة ساعد


// ==========================================
// أرشيف الأحكام القضائية والتحليل الذكي للعوار
// ==========================================

export type JudgmentCategory = 
  | 'supreme_cassation'   // أحكام المحكمة العليا / النقض
  | 'appeal'              // أحكام الاستئناف
  | 'first_instance'      // أحكام أول درجة (الابتدائية / العامة / التجارية / الجزائية)
  | 'labor'               // الأحكام العمالية
  | 'administrative'      // الأحكام الإدارية (ديوان المظالم)
  | 'other';              // أحكام وقرارات قضائية أخرى

export interface JudgmentAnalysis {
  executiveSummary: string; // خلاصة تقييم الحكم
  overallFlawSeverity: 'low' | 'medium' | 'high' | 'critical'; // درجة العوار ومواطن الضعف
  errorsInLaw: string[]; // الخطأ في تطبيق القانون أو تأويله ومخالفة النصوص والأنظمة
  inferenceFlaws: string[]; // الفساد في الاستدلال وفساد الاستنباط
  reasoningDeficiency: string[]; // القصور في التسبيب والإجمال المعيب
  unansweredDefenses: string[]; // الإخلال بحق الدفاع وعدم الرد على الدفوع الجوهرية
  appealGrounds: string[]; // أسباب وأسانيد الطعن بالاستئناف أو النقض أو التماس إعادة النظر المقترحة
  keyPrecedents: string[]; // المبادئ القضائية المستخلصة والأنظمة الواجبة الإعمال
  recommendedAction: string; // التوصية الإجرائية القانونية
}

export interface ArchivedJudgment {
  id: string;
  title: string;              // عنوان وصفي للحكم
  category: JudgmentCategory; // تصنيف ودرجة الحكم (عليا/نقض، استئناف، أول درجة، عمالي، إداري)
  deedNumber: string;         // رقم صك الحكم
  deedDate: string;           // تاريخ صك الحكم هجري وميلادي
  caseNumber: string;         // رقم الدعوى الأصلية
  caseYear: string;           // السنة القضائية
  court: string;              // المحكمة
  circuit: string;            // الدائرة القضائية
  judge?: string;             // رئيس الدائرة / القضاة
  clientName: string;         // اسم الموكل / المستأنف / المدعي
  clientRole: string;         // صفته
  opponentName: string;       // اسم الخصم / المستأنف ضده / المدعى عليه
  opponentLawyer?: string;    // محامي الخصم
  judgmentDate: string;       // تاريخ صدور الحكم YYYY-MM-DD
  judgmentType: 'final' | 'appealable'; // حكم نهائي بات | حكم قابل للاستئناف
  verdictText: string;        // منطوق الحكم
  factsAndMerits: string;     // وقائع وحيثيات الدعوى
  legalReasons: string;       // أسباب الحكم وتسبيبه
  fileAttachment?: CaseAttachment; // ملف صك الحكم PDF / Word / صورة
  rawText?: string;           // النص المستخلص لصك الحكم
  analysis?: JudgmentAnalysis;// التحليل القانوني المستنبط
  tags: string[];             // تصنيفات
  notes?: string;             // ملاحظات المحامي
  linkedCaseId?: string;      // ربط بقضية مسجلة في النظام إن وجدت
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// المكتبة القانونية والأنظمة والسوابق
// ==========================================

export type LegalDocumentCategory =
  | 'law'               // نظام أو قانون أساسي
  | 'regulation'        // لائحة تنفيذية أو تنظيمية
  | 'precedent'         // مبدأ أو سابقة قضائية (المحكمة العليا / ديوان المظالم)
  | 'lawsuit_template'  // صحيفة دعوى نموذجية
  | 'defense_memo'      // مذكرة دفاع جوابية نموذجية
  | 'appeal_memo'       // لائحة استئناف وطعن بالنقض
  | 'general_study';    // بحث أو دراسة قانونية متخصصة

export interface LegalDocument {
  id: string;
  title: string;              // اسم النظام / اللائحة / المذكرة
  category: LegalDocumentCategory;
  jurisdiction: 'saudi' | 'general_arab' | 'international';
  lawNumber?: string;         // رقم المرسوم الملكي / القرار الوزاري
  promulgationYear?: string;  // سنة الإصدار
  description: string;        // نبذة عن النظام ومجال انطباقه
  content: string;            // نص النظام أو المذكرة أو المواد
  fileAttachment?: CaseAttachment; // ملف PDF / Word المرفوع
  keyTopics: string[];        // موضوعات رئيسية (الشركات، العمل، الإثبات، العقود، التعويض)
  articlesSummary?: Array<{ article: string; summary: string }>;
  practicalRelevance?: string;// كيفية الاستناد عليه في صياغة الدعاوى والطعون
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// استوديو صياغة المذكرات وصحف الدعاوى والطعون
// ==========================================

export type DraftDocumentType =
  | 'appeal_memo'               // لائحة استئناف
  | 'cassation_petition'         // صحيفة طعن بالنقض
  | 'lawsuit_statement'          // صحيفة افتتاح دعوى
  | 'defense_memo'              // مذكرة دفاع جوابية
  | 'reconsideration_petition'   // التماس إعادة نظر
  | 'legal_consultation';        // رأي واستشارة قانونية

export interface DraftedLegalDocument {
  id: string;
  title: string;
  type: DraftDocumentType;
  courtHeader: string;
  parties: string;
  subjectAndFacts: string;
  defensesAndGrounds: string;
  legalReferencesAndArticles: string;
  finalDemands: string;
  fullDocumentText: string;
  summaryNotes?: string;
  linkedJudgmentId?: string;
  referencedLibraryDocIds?: string[];
  createdAt: string;
}


