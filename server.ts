import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parser with generous limit for PDF/doc base64 data
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Helper to lazily get Google GenAI client
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in server environment');
    }
    return new GoogleGenAI({ apiKey });
  };

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString() 
    });
  });

  // 1. Analyze and extract judicial judgment & detect legal flaws / errors
  app.post('/api/ai/analyze-judgment', async (req, res) => {
    try {
      const { text, fileName, fileDataUrl, additionalNotes } = req.body;

      if (!text && !fileDataUrl) {
        return res.status(400).json({ error: 'الرجاء تزويد نص صك الحكم أو ملف القضية للتحليل' });
      }

      const ai = getAiClient();

      const prompt = `
أنت مستشار قضائي وخبير رفيع المستوى في القانون وأعمال المحاكم ونقض الأحكام والاستئناف (متخصص في الأنظمة القضائية واللوائح التنفيذية ومبادئ المحكمة العليا).
المطلوب منك تحليل صك / وثيقة الحكم القضائي المرفقة أدناه تحليلاً دقيقاً وشاملاً، واستخلاص كافة البيانات الإلزامية واكتشاف العوار القانوني وعيوب الحكم ومواطن الطعن.

النص المرفق لصك / وقائع الحكم:
"""
${text || 'مرفق محتوى الحكم'}
"""
${additionalNotes ? `ملاحظات إضافية من المحامي: ${additionalNotes}` : ''}
${fileName ? `اسم الملف الأصلي: ${fileName}` : ''}

قم بإرجاع النتيجة بتنسيق JSON حصراً (بدون أي علامات markdown إضافية خارج الـ JSON أو مع وضعها داخل \`\`\`json) بالهيكل التالي بدقة:
{
  "title": "عنوان وصفي مختصر للحكم (مثل: حكم تجاري بإلزام شركة...)",
  "category": "تصنيف ودرجة الحكم: supreme_cassation (أحكام المحكمة العليا/النقض) أو appeal (أحكام الاستئناف) أو first_instance (أحكام أول درجة الابتدائية) أو labor (الأحكام العمالية) أو administrative (الأحكام الإدارية وديوان المظالم) أو other",
  "deedNumber": "رقم صك الحكم إن وجد أو رقم القرار",
  "deedDate": "تاريخ صدور الصك بالهجري والميلادي إن وجد",
  "caseNumber": "رقم الدعوى / القضية",
  "caseYear": "السنة القضائية",
  "court": "اسم المحكمة (مثل: المحكمة التجارية، المحكمة العامة، محكمة الاستئناف...)",
  "circuit": "الدائرة القضائية (مثل: الدائرة التجارية الثالثة)",
  "judge": "اسم رئيس الدائرة أو الهيئة القضائية",
  "clientName": "اسم الطرف الرئيسي / الموكل",
  "clientRole": "صفته (مدعي، مدعى عليه، مستأنف، مستأنف ضده، طاعن)",
  "opponentName": "اسم الخصم",
  "opponentLawyer": "محامي الخصم إن وجد أو لا يوجد",
  "judgmentDate": "تاريخ الحكم بتنسيق YYYY-MM-DD إن أمكن تحديده",
  "judgmentType": "final أو appealable",
  "verdictText": "المنطوق الكامل الدقيق للحكم",
  "factsAndMerits": "ملخص شامل ومفصل لوقائع وحيثيات الدعوى وطلبات الخصوم وما دار بالجلسات",
  "legalReasons": "أسباب الحكم القانونية والشرعية التي بنت عليها المحكمة قضاءها",
  "analysis": {
    "executiveSummary": "خلاصة تقييم الحكم من الناحية القانونية والشرعية",
    "overallFlawSeverity": "درجة العوار ومواطن الضعف في الحكم: low أو medium أو high أو critical",
    "errorsInLaw": [
      "الخطأ في تطبيق النظام أو تأويله ومخالفة النصوص النظامية واللوائح"
    ],
    "inferenceFlaws": [
      "أوجه الفساد في الاستدلال وفساد الاستنباط وعدم ملاءمة النتيجة للمقدمات"
    ],
    "reasoningDeficiency": [
      "أوجه القصور في التسبيب والإجمال المعيب وعدم كفاية أسباب الحكم"
    ],
    "unansweredDefenses": [
      "الإخلال بحق الدفاع أو إغفال الرد على الدفوع الجوهرية والمستندات المقدمة من الخصم"
    ],
    "appealGrounds": [
      "أبرز أسباب وأسانيد الطعن المقترحة للائحة الاستئناف أو النقض أو التماس إعادة النظر"
    ],
    "keyPrecedents": [
      "المبادئ القضائية والأنظمة المستند إليها أو الواجبة التطبيق"
    ],
    "recommendedAction": "التوصية الإجرائية القانونية للمحامي (مثل: قيد لائحة استئناف عاجلة، تقديم التماس إعادة نظر، أو البدء في التنفيذ)"
  },
  "tags": ["وسوم تصنيفية مثل: تجاري, بطلان عقد, استئناف, تعويض"]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text || '{}';
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (e) {
        // Fallback cleanup if model wrapped in markdown
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      }

      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error('Error analyzing judgment with Gemini:', error);
      res.status(500).json({ 
        error: error.message || 'حدث خطأ أثناء تحليل صك الحكم عبر الذكاء الاصطناعي' 
      });
    }
  });

  // 2. Draft Legal Memoranda, Lawsuit Statements, and Appeal Briefs based on Judgments and Library references
  app.post('/api/ai/draft-legal-document', async (req, res) => {
    try {
      const { 
        documentType, 
        caseOrJudgmentContext, 
        selectedLibraryReferences, 
        lawyerDemands, 
        firmName,
        opponentArguments 
      } = req.body;

      const ai = getAiClient();

      const docTypeLabels: Record<string, string> = {
        'appeal_memo': 'لائحة استئناف ونقض قضائي',
        'cassation_petition': 'صحيفة طعن بالنقض أمام المحكمة العليا',
        'lawsuit_statement': 'صحيفة افتتاح دعوى قضائية',
        'defense_memo': 'مذكرة دفاع جوابية ورد موضوعي',
        'reconsideration_petition': 'لائحة التماس إعادة نظر',
        'legal_consultation': 'استشارة ورأي قانوني مسبب'
      };

      const typeLabel = docTypeLabels[documentType] || 'مذكرة قانونية قضائية';

      const prompt = `
أنت مستشار قضائي ومحامٍ خبير في الصياغة القانونية الرفيعة والمحكمة وفق أصول المرافعات والأنظمة واللوائح والقرارات القضائية.
المطلوب منك صياغة وتحرير: [ ${typeLabel} ] صياغة متقنة وشاملة وقوية الحجة والأسانيد.

بيانات ومحددات العمل:
1. نوع الوثيقة: ${typeLabel}
2. اسم المكتب / المحامي: ${firmName || 'مكتب المحاماة والاستشارات القانونية'}
3. بيانات الحكم أو القضية الأساسية:
"""
${JSON.stringify(caseOrJudgmentContext || {}, null, 2)}
"""

4. الأنظمة واللوائح والمذكرات المستند عليها من المكتبة القانونية:
"""
${(selectedLibraryReferences || []).map((r: any, idx: number) => `المستند ${idx + 1}: ${r.title}\nالمحتوى والبنود: ${r.content || r.description}`).join('\n\n')}
"""

5. طلبات ودفاع الموكل والمحامي المحددة:
"""
${lawyerDemands || 'طلب نقض الحكم وإلغائه والقضاء مجدداً بالطلبات الأصلية مع إلزام الخصم بالرسوم والمصاريف وأتعاب المحاماة.'}
"""

${opponentArguments ? `6. دفوع ومزاعم الخصم المراد دحضها:\n${opponentArguments}` : ''}

التعليمات الصارمة للصياغة:
- اكتب بصياغة قانونية رفيعة وأسلوب قضائي عربي بليغ ومحكم.
- قسّم المذكرة إلى أبواب واضحة: الترويسة القضائية، الوقائع، الأسباب وأوجه النعي ومخالفة النظام والفساد في الاستدلال، الدفوع الجوهرية والأسانيد النظامية، والطلبات الختامية الجازمة.
- اذكر مواد الأنظمة ذات الصلة واستند إليها بوضوح ودقة.

قم بإرجاع النتيجة بتنسيق JSON حصراً:
{
  "title": "${typeLabel} - ${caseOrJudgmentContext?.title || 'دعوى قضائية'}",
  "type": "${documentType}",
  "courtHeader": "إلى محكمة ... الموقرة / الدائرة ...",
  "parties": "المستأنف/المدعي: ... ضد المستأنف ضده/المدعى عليه: ...",
  "subjectAndFacts": "موضوع الدعوى ووقائعها بإيجاز دقيق ومحكم",
  "defensesAndGrounds": "أوجه الطعن والدفاع (الخطأ في تطبيق القانون، القصور في التسبيب، الفساد في الاستدلال، والإخلال بحق الدفاع)",
  "legalReferencesAndArticles": "الأسانيد النظامية والشرعية والمبادئ القضائية المستند إليها",
  "finalDemands": "الطلبات الختامية الجازمة",
  "fullDocumentText": "النص الكامل الجاهز للطباعة والتقديم للمحكمة متضمناً كافة الأقسام بتنسيق محكم ومهني",
  "summaryNotes": "نصائح إجرائية للمحامي قبل تقديم المذكرة ومواعيد الطعن النظامية"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text || '{}';
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (e) {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      }

      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error('Error drafting legal document with Gemini:', error);
      res.status(500).json({ 
        error: error.message || 'حدث خطأ أثناء صياغة المذكرة القانونية عبر الذكاء الاصطناعي' 
      });
    }
  });

  // 3. Analyze Law or Legal Article for Legal Library
  app.post('/api/ai/analyze-law', async (req, res) => {
    try {
      const { text, title, category } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'الرجاء تزويد نص النظام أو اللائحة' });
      }

      const ai = getAiClient();

      const prompt = `
أنت باحث قانوني متخصص. قم بتحليل نص النظام أو المذكرة المرفقة وفهرستها للمكتبة القانونية:
العنوان: ${title || 'نظام قانوني'}
الفئة: ${category || 'نظام'}

النص:
"""
${text}
"""

قم بإرجاع JSON بالهيكل التالي:
{
  "title": "${title || 'نظام'}",
  "description": "ملخص موجز للنظام وأهدافه ومجال تطبيقه",
  "keyTopics": ["موضوعات رئيسية مثل: الإثبات, العقود, التعويض, المرافعات"],
  "articlesSummary": [
    { "article": "المادة ...", "summary": "موجز حكم المادة وما تقرره" }
  ],
  "practicalRelevance": "كيف يمكن الاستناد إلى هذا النظام في صياغة الدعاوى والطعون"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text || '{}';
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (e) {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      }

      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error('Error analyzing law text:', error);
      res.status(500).json({ 
        error: error.message || 'حدث خطأ أثناء فهرسة النظام القانوني' 
      });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Judicial Management Server running on port ${PORT}`);
  });
}

startServer();
