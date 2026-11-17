// /dashboard ("UR Stats") in Arabic: the head and the markup's words, the translation of en.js beside it (same keys).
// Arrows that point along the line are turned for right-to-left reading (→ ←, ← →, ↗ ↖).
export default {
    meta: {
        title: "إحصاءات UR",
        description: "إحصاءات URnetwork وSN25 المباشرة: المستخدمون والمزوّدون المتصلون والبيانات المنقولة والحقب والدفعات وNetwork Capacity Reserve، مقروءة من Grafana والشبكة الرئيسية لـ Bittensor.",
    },

    heading: "إحصاءات UR",

    rail: {
        brandTitle: "العودة إلى ur.xyz",
        brandAria: "UR، العودة إلى ur.xyz",
        navAria: "الأقسام",
        sources: "المصادر: grafana.bringyour.com والشبكة الرئيسية لـ Bittensor.",
    },

    nav: {
        overview: "نظرة عامة",
        network: "الشبكة",
        providers: "المزوّدون",
        // begins with moreShort, so phones show «المزيد» and wide screens the whole
        more: "المزيد من الإحصاءات",
        moreShort: "المزيد",
        method: "كيف نحسب",
    },

    ledes: {
        network: "حركة المرور والمستخدمون والنمو على URnetwork.",
        providers: "الأجهزة التي تشارك اتصالها، مُحصاةً حسب الدولة والمدينة، لا حسب الموقع الفردي أبدًا.",
        subnet: "الدفعات وconviction وNetwork Capacity Reserve، مقروءة من الشبكة الرئيسية لـ Bittensor.",
        more: "أرقام أخرى من نظام مراقبة الشبكة.",
        method: "ما يعنيه كل رقم ومن أين يأتي.",
    },

    periods: {
        label: "الفترة",
        // ي is يوم, as in the site's countdowns ({d}ي {h}س)
        d1: "1ي",
        d3: "3ي",
        d7: "7ي",
        d30: "30ي",
        d90: "90ي",
        all: "الكل",
    },

    org: {
        label: "المؤسسة",
        aria: "مؤسسة GitHub",
        all: "الكل",
    },

    live: {
        sinceOpened: "{value}نُقلت منذ أن فتحت هذه الصفحة",
        stripAria: "القيم المباشرة",
        usersDay: "المستخدمون (24 ساعة)",
        dataDay: "البيانات المنقولة (24 ساعة)",
        dataSinceOpened: "البيانات المنقولة منذ أن فتحت هذه الصفحة",
        rightNow: "الآن",
    },

    route: {
        usersNote: "خلال آخر 24 ساعة",
        operator: "مشغّل الشبكة",
        exits: "المخارج",
        exitsNote: "دولة",
    },

    titles: {
        dailyUsers: "المستخدمون اليوميون",
        providersOnline: "المزوّدون المتصلون",
        dataCarried: "البيانات المنقولة",
        totalNetworks: "إجمالي الشبكات",
        thisEpoch: "هذه الحقبة",
        totalDataCarried: "إجمالي البيانات المنقولة",
        coverage: "التغطية",
        countries: "الدول",
        cities: "المدن",
        byContinent: "حسب القارة",
        sn25Subnet: "الشبكة الفرعية SN25",
        alphaPrice: "سعر alpha",
        // the reserve's name stays in English
        reserve: "Network Capacity Reserve",
        alphaLocked: "alpha المقفل في conviction",
        traffic: "حركة المرور",
        whenTrafficFlows: "متى تتدفق حركة المرور",
        runningTotal: "المجموع التراكمي",
        users: "المستخدمون",
        growth: "النمو",
        signups: "التسجيلات",
        providers: "المزوّدون",
        providersByCountry: "المزوّدون حسب الدولة",
        details: "التفاصيل",
        allCountries: "جميع الدول",
        becomeProvider: "كن مزوّدًا",
        payouts: "الدفعات",
        earned: "مكاسب المزوّدين",
        conviction: "آلية conviction",
        convictionLocks: "أقفال conviction",
        totalLocked: "إجمالي المقفل",
        perpetual: "دائم",
        decaying: "متناقص",
        reserveBalance: "رصيد الاحتياطي",
        reserveShort: "الاحتياطي",
        walletAndHotkeys: "المحفظة ومفاتيح hotkeys",
        throughput: "معدل النقل",
        connectedDevices: "الأجهزة المتصلة",
        newConnections: "الاتصالات الجديدة",
        extendersOnline: "الموسّعون المتصلون",
        whereExtenders: "أين يوجد الموسّعون",
        ipFamily: "عائلة IP",
        extenders: "الموسّعون",
    },

    common: {
        allTime: "منذ البداية",
        onlineNow: "متصل الآن",
        onAverage: "في المتوسط",
        aDayOnAverage: "يوميًا في المتوسط",
        online: "متصل",
        allTimeChip: "منذ البداية",
        networkIsAccount: "الشبكة حساب. ويمكن لحساب واحد أن يربط عدة أجهزة.",
        searchCountry: "ابحث عن دولة",
    },

    expand: {
        users: "توسيع الرسم البياني للمستخدمين اليوميين",
        providers: "توسيع الرسم البياني للمزوّدين المتصلين",
        data: "توسيع الرسم البياني للبيانات المنقولة",
        networks: "توسيع الرسم البياني لإجمالي الشبكات",
        total: "توسيع الرسم البياني لإجمالي البيانات المنقولة",
    },

    more: {
        network: "المزيد من إحصاءات الشبكة ←",
        providers: "المزيد من إحصاءات المزوّدين ←",
        subnet: "المزيد من إحصاءات SN25 ←",
        other: "المزيد من الإحصاءات: الأجهزة والاتصالات والموسّعون ←",
    },

    globeAria: "كرة أرضية تُظهر دول المزوّدين. اسحب لتدويرها، وانقر على دولة لرؤية أرقامها.",
    mapAria: "خريطة المزوّدين حسب الدولة. جميع الدول مدرجة في الجدول أدناه.",

    network: {
        showTable: "اعرض كجدول",
        styleAria: "نمط الرسم البياني",
        clock: "ساعة",
        bars: "أعمدة",
    },

    providers: {
        liveCount: "عدد مباشر للأجهزة التي تشارك اتصالها.",
        becomeText: "يمكن لأي شخص مشاركة اتصاله من تطبيق URnetwork. وتعتمد المكافآت على حركة المرور التي تنقلها، وتُدفع عبر SN25.",
        install: "ثبّت التطبيق ↖",
        rewards: "كيف تُحسب المكافآت ↖",
    },

    subnet: {
        payoutsLede: "تدفع SN25 للمزوّدين كل 7 أيام.",
        convictionLede: "alpha المقفل لدعم SN25 بموجب آلية conviction في Bittensor.",
        reserveLede: "يموّل الاحتياطي سعة الشبكة. {link}",
        reserveLink: "التفاصيل ↖",
        reservePeriodAria: "فترة رصيد الاحتياطي",
    },

    notes: {
        throughput: "يحتسب كل قفزة في المسار، لذا تكون قيمته أعلى من البيانات المنقولة.",
        devices: "الأجهزة الفريدة ذات الاتصال النشط، بما في ذلك عمليات إعادة الاتصال.",
        connections: "جلسات العملاء الجديدة، بما في ذلك عمليات إعادة الاتصال.",
        extenders: "عُقد ترحيل تساعد الناس على الاتصال حيث تُحجب المسارات المباشرة.",
    },

    close: "إغلاق",

    footer: {
        method: "كيف نحسب ←",
        home: "→ العودة إلى ur.xyz",
        updated: "آخر تحديث: {time}.",
    },
};
