// /mainnet in Arabic: the translation of en.js beside it (the page's own copy). Same keys as en.js; after
// changing a translation, run `node tests/i18n-staleness.mjs --unit mainnet --accept ar <key> ...` from react/.
// Figures keep Western digits and the English separators (9,240,028; 1,076.26 α); the arrows point right to
// left (←). The terms of all three units (this one, data/ and timeline/): epoch حقبة; settlement v2 التسوية v2;
// version 1 النسخة 1 (the site's «إصدار» is emission, so a software release is «تحديث»); network operator مشغّل
// الشبكة; subnet owner مالك الشبكة الفرعية; pool مجمّع; payout root جذر المدفوعات; commit تثبيت (not الالتزام بـ, which reads as bound by);
// challenge period فترة الاعتراض; claim مطالبة; claim batcher عقد تجميع المطالبات (مُجمِّع reads as a pool);
// earnings مستحقات (not أرباح, profits); presence الحضور; recovered (done) استُرِدّ; payout wallet محفظة الدفع; governance Safe محفظة Safe للحوكمة;
// timelock القفل الزمني; vault خزنة; capture the flag «الاستيلاء على العلم» (the apps' name); draw الاختيار العشوائي,
// to draw اختار عشوائيًا (a public, verifiable random selection: never القرعة, a drawing of lots, and never يانصيب,
// رهان or مقامرة: it is not a lottery); entry مشارك; slot خانة; pot الرصيد المتراكم; carry forward
// يُرحَّل; relay تمرير; an IP address block نطاق, a chain block كتلة.
// A token that starts or ends with a slash (/29, /48, /64, 1/n) is wrapped in the isolates \u2066…\u2069, so
// it reads left to right inside the Arabic; "IPv6 /64" needs none.
export default {
    meta: {
        title: 'الجدول الزمني لإطلاق SN25 على الشبكة الرئيسية | UR',
        description: 'إطلاق SN25 على الشبكة الرئيسية حسب حقب الدفع: النسخة 1 منذ 8 أكتوبر، والتسوية v2 منذ الحقبة 4 (30 أكتوبر)، و«الاستيلاء على العلم» ابتداءً من الحقبة 8 (27 نوفمبر).',
        breadcrumb: 'الشبكة الرئيسية',
    },

    intro: {
        eyebrow: 'SN25 · الشبكة الرئيسية لـ Bittensor',
        title: 'الجدول الزمني لإطلاق الشبكة الرئيسية',
        lede: 'انطلقت الشبكة الفرعية لـ UR، وهي SN25، على الشبكة الرئيسية لـ Bittensor في 8 أكتوبر 2026. يتتبّع هذا الجدول الزمني الإطلاق حسب حقب الدفع، من عقود النسخة 1 مرورًا بالتسوية v2 وصولًا إلى «الاستيلاء على العلم» الذي يبدأ مع الحقبة 8.',
        note: 'المعالم الموسومة بـ {scheduled} أو {planned} لم تحدث بعد، وقد تتغير مواعيدها. جميع الأوقات بتوقيت UTC، والوقت الموسوم بـ ≈ تقريبي: معظمها مُقدَّر من أرقام الكتل.',
    },

    settlement: {
        eyebrow: 'التسوية',
        title: 'النسخة 1، ثم التسوية v2',
        paragraphs: [
            'تدفع SN25 للمزوّدين حسب حقبة الدفع. هذه هي حقب التسوية الخاصة بـ UR، وليست إيقاع السلسلة (tempo) البالغ 72 دقيقة: استمرت الحقبة 0 يومًا واحدًا، وتستمر كل حقبة لاحقة 7 أيام (50,400 كتلة).',
            'انطلقت النسخة 1 في 8 أكتوبر وتسوّي الحقب من 1 إلى 3. وهي لا تدفع إلا للمزوّدين الذين قاسهم المُصادِق، وهذا القياس محدود بنحو 1,500 مزوّد في كل حقبة، لذا لا يتلقى معظم المُعدِّنين أي حصة من النسخة 1.',
            'تدفع التسوية v2 حسب الاستخدام وتُزيل هذا الحد. كان من المقرر أن تتولى المهمة ابتداءً من الحقبة 3، لكن مجمّعها لم يُسجَّل قبل بدء الحقبة 3 في 23 أكتوبر، لذا تسوّي النسخة 1 الحقبة 3 أيضًا. سُجِّل مجمّعها في 29 أكتوبر، ودفعت التسوية v2 كل حقبة منذ الحقبة 4 التي بدأت في 30 أكتوبر نحو الساعة 18:25 UTC. انتهت أول حقبة v2 نحو 6 نوفمبر، وفُتحت مطالباتها في 8 نوفمبر، بعد تثبيت جذرها وانتهاء فترة الاعتراض الخاصة بها.',
            'ابتداءً من الحقبة 8، التي تبدأ نحو الساعة 18:25 UTC في 27 نوفمبر، يملك كل مشغّل شبكة مجمّعًا ثانيًا إلى جانب مجمّع المزوّدين الخاص به: «الاستيلاء على العلم»، الذي تدفعه التسوية v2 في مسار المطالبة نفسه. يدفع مجمّع المزوّدين مقابل الاستخدام، ويدفع «الاستيلاء على العلم» مقابل الحضور في بلد ما، بعشر خانات في كل بلد في كل حقبة.',
        ],
        epochsAria: 'حقب الدفع',
    },

    milestones: {
        eyebrow: 'الجدول الزمني',
        title: 'المعالم',
        fine: 'وقت المَعلَم المُجدول أو المُخطط تقدير محسوب، من رقم كتلته بمعدل 12 ثانية لكل كتلة أو من الخطة، ويُوسم بـ ≈ ما لم يُحدَّد لوقت دقيق. يتحرك الوقت المُقدَّر قليلًا إذا جاءت الكتل أسرع أو أبطأ. ابتداءً من الحقبة 1، تُغلق كل حقبة خلال 120 كتلة من نهايتها، ويحين موعد تثبيت جذر مدفوعاتها خلال 1,200 كتلة من نهايتها، وتُفتح مطالباتها بعد 14,400 كتلة (نحو يومين) منه. قد تتغير المعالم المُجدولة والمُخططة.',
        updated: 'آخر تحديث {date}.',
    },

    noticeDate: 'إشعار · {date}',
    noticeToggle: { expand: 'توسيع', collapse: 'طيّ' },

    labels: {
        status: { done: 'مكتمل', in_progress: 'قيد التنفيذ', scheduled: 'مُجدول', planned: 'مُخطط' },
        settlement: { v1: 'النسخة 1', v2: 'التسوية v2' },
        captureTheFlag: 'الاستيلاء على العلم',
        view: { transaction: 'عرض المعاملة', contract: 'عرض العقد', block: 'عرض الكتلة' },
        sourceAria: '{action}: {label}',
        sourcesAria: 'مصادر {title}',
        transactionsAria: 'معاملات {title}',
        transactions: { zero: '{count} معاملة', one: '{count} معاملة', two: '{count} معاملة', few: '{count} معاملات', many: '{count} معاملة', other: '{count} معاملة' },
        epoch: 'الحقبة {number}',
        beforeLaunch: 'قبل الإطلاق',
        afterEpoch: 'بعد الحقبة {number}',
        epochBlocks: 'الكتل {start} ← {end} · {blocks}، {length}',
        blocks: { zero: '{count} كتلة', one: '{count} كتلة', two: '{count} كتلة', few: '{count} كتل', many: '{count} كتلة', other: '{count} كتلة' },
        days: { zero: '{count} يوم', one: '{count} يوم', two: '{count} يوم', few: '{count} أيام', many: '{count} يومًا', other: '{count} يوم' },
        aboutDays: { zero: 'نحو {count} يوم', one: 'نحو {count} يوم', two: 'نحو {count} يوم', few: 'نحو {count} أيام', many: 'نحو {count} يومًا', other: 'نحو {count} يوم' },
        arrow: '←',
    },

    dates: {
        weekdays: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
        months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
        monthsLong: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
        day: '{weekday}، {date} {month}',
        monthDay: '{date} {month}',
        sameMonth: '{start}–{end} {month}',
        twoMonths: '{start} – {end}',
        long: '{date} {month} {year}',
    },

    summary: {
        title: 'نظرة سريعة',
        figureAria: 'حقب الدفع والمعالم الرئيسية',
        epochShort: 'ح{number}',
        afterShort: 'بعدها',
        from: 'من {days}',
        settledBy: { v1: 'تسوّيها النسخة 1', v2: 'تسوّيها التسوية v2' },
        mark: '{number}. {title}، {when}، {status}',
        span: '{title}، {when}، {status}',
        now: 'الآن',
        nowAt: '{time}',
        nowIn: '{time}، مضى {percent}% من الحقبة {number}',
        bandsAria: 'الأشرطة',
        markersAria: 'العلامات',
        either: '{first} أو {second}',
        lower: { done: 'مكتمل', in_progress: 'قيد التنفيذ', scheduled: 'مُجدول', planned: 'مُخطط' },
        legendSpan: '{title}، {days}',
        datesAria: 'التواريخ الرئيسية',
    },
};
