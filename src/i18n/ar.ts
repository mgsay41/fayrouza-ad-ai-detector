// Arabic translations
export const ar = {
  // Language and direction
  language: {
    name: 'العربية',
    code: 'ar',
    direction: 'rtl',
  },

  // Layout
  layout: {
    title: 'كاشف إعلانات فيروزة بالذكاء الاصطناعي',
    subtitle: 'اختبار moderation الإعلانات بالذكاء الاصطناعي',
    footer: 'كاشف إعلانات فيروزة بالذكاء الاصطناعي © {year}',
    switchToArabic: 'التبديل إلى العربية',
    switchToEnglish: 'Switch to English',
  },

  // View modes
  view: {
    form: {
      title: 'إرسال إعلان للتحليل بالذكاء الاصطناعي',
      subtitle: 'املأ التفاصيل أدناه لاختبار نظام moderation الإعلانات بالذكاء الاصطناعي.',
    },
    history: {
      title: 'سجل العمليات',
      subtitle: 'عرض عملياتك السابقة ({count} {submission}).',
      subtitleSingular: 'عملية',
      subtitlePlural: 'عمليات',
      noHistory: 'لا يوجد سجل بعد',
      noHistoryDesc: 'أرسل إعلاناً للتحليل وسيظهر هنا. يمكنك عرض العمليات السابقة ونتائجها.',
      noFilterMatch: 'لا توجد عمليات تطابق الفلتر الحالي.',
      viewHistory: 'عرض السجل ({count})',
      backToForm: 'العودة إلى النموذج',
    },
  },

  // Form
  form: {
    fields: {
      title: {
        label: 'عنوان الإعلان',
        placeholder: 'أدخل عنواناً وصفياً لإعلانك',
        required: 'يجب أن يكون العنوان 5 أحرف على الأقل',
        help: 'الحد الأدنى 5 أحرف',
        charCount: '{count}/100',
      },
      description: {
        label: 'الوصف',
        placeholder: 'قدم وصفاً مفصلاً لما تقدمه...',
        required: 'يجب أن يكون الوصف 20 حرفاً على الأقل',
        help: 'الحد الأدنى 20 حرف',
        charCount: '{count}/1000',
      },
      price: {
        label: 'السعر',
        placeholder: '0.00',
        currency: '$',
      },
      category: {
        label: 'الفئة',
        placeholder: 'اختر فئة',
        required: 'الرجاء اختيار فئة',
        // Categories
        electronics: 'الإلكترونيات',
        vehicles: 'المركبات',
        realEstate: 'العقارات',
        clothing: 'الملابس',
        homeGarden: 'المنزل والحديقة',
        services: 'الخدمات',
        other: 'أخرى',
      },
      image: {
        label: 'صورة الإعلان',
        uploadText: 'انقر للرفع أو السحب والإفلات',
        uploadHint: 'JPEG, PNG, GIF, أو WebP (حد أقصى 5 ميجابايت)',
        sizeError: 'يجب أن يكون حجم الصورة أقل من 5 ميجابايت',
        typeError: 'مسموح فقط بصور JPEG و PNG و GIF و WebP',
      },
    },

    actions: {
      submit: 'إرسال للتحليل',
      submitting: 'جارٍ التحليل...',
      clearForm: 'مسح النموذج',
      loadSample: {
        clean: 'تحميل نموذج إعلان نظيف',
        violating: 'تحميل نموذج إعلان مخالف',
        suspicious: 'تحميل نموذج إعلان مشبوه',
      },
    },

    infoBox: {
      title: 'كيف يعمل:',
      steps: [
        'املأ جميع الحقول المطلوبة (المميزة بـ *)',
        'ارفع صورة للإعلان اختيارياً',
        'انقر "إرسال للتحليل" لإرسال إلى الذكاء الاصطناعي',
        'عرض قرار الذكاء الاصطناعي ودرجة الثقة والتوصيات',
      ],
      note: 'ملاحظة: يتم حالياً استخدام بيانات وهمية. قم بتعيين VITE_N8N_WEBHOOK_URL لاستخدام التحليل الحقيقي بالذكاء الاصطناعي.',
    },

    required: '*',
  },

  // Validation errors
  validation: {
    title: {
      min: 'يجب أن يكون العنوان 5 أحرف على الأقل',
      max: 'يجب أن يكون العنوان أقل من 100 حرف',
    },
    description: {
      min: 'يجب أن يكون الوصف 20 حرفاً على الأقل',
      max: 'يجب أن يكون الوصف أقل من 1000 حرف',
    },
    price: {
      nan: 'يجب أن يكون السعر رقماً',
      negative: 'لا يمكن أن يكون السعر سالباً',
      tooHigh: 'السعر مرتفع جداً',
    },
    category: {
      required: 'الرجاء اختيار فئة',
    },
    image: {
      size: 'يجب أن يكون حجم الصورة أقل من 5 ميجابايت',
      type: 'مسموح فقط بصور JPEG و PNG و GIF و WebP',
    },
  },

  // Results
  results: {
    title: 'اكتمل التحليل بالذكاء الاصطناعي',
    subtitle: 'تم تحليل إعلانك بواسطة نظام moderation بالذكاء الاصطناعي',
    submitAnother: 'إرسال إعلان آخر',

    confidence: 'درجة الثقة',
    reasoning: 'التفكير',
    violations: 'انتهاكات مكتشفة',
    recommendations: 'التوصيات',
    responseTime: 'وقت الاستجابة: {time}',

    // Decisions
    decision: {
      approve: 'موافقة',
      review: 'مراجعة',
      reject: 'رفض',
    },

    // JSON Viewer
    jsonViewer: {
      title: 'الاستجابة الكاملة للذكاء الاصطناعي (JSON)',
      copy: 'نسخ',
      copied: 'تم النسخ إلى الحافظة',
      copiedDesc: 'تم نسخ استجابة JSON إلى الحافظة الخاصة بك.',
      copyFailed: 'فشل النسخ',
      copyFailedDesc: 'فشل النسخ إلى الحافظة. الرجاء المحاولة مرة أخرى.',
    },
  },

  // History
  history: {
    confidence: 'الثقة:',
    viewDetails: 'عرض التفاصيل',
    delete: 'حذف',
    clearAll: 'مسح الكل',
    clearAllConfirm: 'هل أنت متأكد من أنك تريد مسح السجل بالكامل؟ لا يمكن التراجع عن هذا الإجراء.',
    cleared: 'تم مسح السجل',
    clearedDesc: 'تمت إزالة سجل جميع العمليات.',
    deleted: 'تم حذف العنصر',
    deletedDesc: 'تمت إزالة عنصر السجل.',
    export: 'تصدير',

    // Filters
    filter: {
      all: 'الكل',
      approve: 'موافقة',
      review: 'مراجعة',
      reject: 'رفض',
    },

    // Detail modal
    detail: {
      submittedOn: 'تم الإرسال في {date}',
      adDetails: 'تفاصيل الإعلان',
      image: 'صورة',
      aiResult: 'نتيجة التحليل بالذكاء الاصطناعي',
      aiResultDesc: 'قرار moderation لهذا الإعلان',
      fullResponse: 'الاستجابة الكاملة للواجهة البرمجية',
    },
  },

  // Toast notifications
  toast: {
    analysisComplete: 'اكتمل التحليل',
    analysisDesc: 'قرار الذكاء الاصطناعي: {decision} بثقة {confidence}٪',

    approved: 'تمت الموافقة على الإعلان',
    rejected: 'تم رفض الإعلان',
    review: 'الإعلان يحتاج مراجعة',

    submissionFailed: 'فشل الإرسال',
  },

  // Sample data
  sampleData: {
    clean: {
      title: 'آيفون 15 برو ماكس - حالة ممتازة',
      description: 'أبيع آيفون 15 برو ماكس 256 جيجابايت بحالة ممتازة. تم دائماً الاحتفاظ به في حقيبة مع واقي شاشة. صحة البطارية 96٪. يأتي مع العلبة الأصلية والشاحن. لا توجد خدوش أو انبعاجات.',
      price: 899,
      category: 'الإلكترونيات',
    },
    violating: {
      title: 'اثرى بسرعة - عرض لفترة محدودة!!!',
      description: 'اكسب 10000 دولار في الأسبوع بالعمل من المنزل! لا حاجة للخبرة. التصرف الآن قبل أن تختفي هذه الفرصة إلى الأبد! اتصل بنا فوراً!!!',
      price: 99,
      category: 'الخدمات',
    },
    suspicious: {
      title: 'شقة فاخرة للإيجار - وسط المدينة',
      description: 'شقة بغرفتين نوم جميلة في قلب وسط المدينة. تشطيبات حديثة وإطلالة رائعة. اتصل لمزيد من التفاصيل ولتحديد موعد للمشاهدة.',
      price: 2500,
      category: 'العقارات',
    },
  },

  // Common
  common: {
    error: 'خطأ',
    loading: 'جارٍ التحميل...',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    close: 'إغلاق',
  },
} as const

export type ArabicTranslations = typeof ar
