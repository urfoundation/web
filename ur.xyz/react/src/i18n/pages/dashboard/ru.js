// /dashboard ("UR Stats") in Russian: the translation of en.js beside it (same keys).
// Terms: data carried переданные данные; providers online провайдеры онлайн; payout выплата; epoch эпоха;
// hotkey хоткей; conviction stays in Latin (Bittensor's mechanism), its locks are блокировки; "Alpha" is
// written alpha, as the site's dictionary writes it; the name Network Capacity Reserve stays in English.
// The period buttons follow /reserve («7Д», «30Д», «Всё»).
export default {
    meta: {
        title: 'Статистика UR',
        description: 'Текущая статистика URnetwork и SN25: пользователи, провайдеры онлайн, переданные данные, эпохи, выплаты и Network Capacity Reserve — из Grafana и основной сети Bittensor.',
    },

    heading: 'Статистика UR',

    rail: {
        brandTitle: 'Вернуться на ur.xyz',
        brandAria: 'UR, вернуться на ur.xyz',
        navAria: 'Разделы',
        sources: 'Источники: grafana.bringyour.com и основная сеть Bittensor.',
    },

    nav: {
        overview: 'Обзор',
        network: 'Сеть',
        providers: 'Провайдеры',
        // «Прочие показатели» does not begin with «Ещё», so wide screens show the one and phones the other
        more: 'Прочие показатели',
        moreShort: 'Ещё',
        method: 'Как мы считаем',
    },

    ledes: {
        network: 'Трафик, пользователи и рост в URnetwork.',
        providers: 'Устройства, которые делятся своим подключением, в разбивке по странам и городам — но никогда по местоположению отдельного устройства.',
        subnet: 'Выплаты, conviction и Network Capacity Reserve — по данным основной сети Bittensor.',
        more: 'Другие данные мониторинга сети.',
        method: 'Что означает каждый показатель и откуда он берётся.',
    },

    periods: {
        label: 'Период',
        d1: '1Д',
        d3: '3Д',
        d7: '7Д',
        d30: '30Д',
        d90: '90Д',
        all: 'Всё',
    },

    org: {
        label: 'Орг.',
        aria: 'Организация на GitHub',
        all: 'Все',
    },

    live: {
        sinceOpened: '{value}передано с момента открытия страницы',
        stripAria: 'Текущие значения',
        usersDay: 'Пользователи (24 часа)',
        dataDay: 'Переданные данные (24 часа)',
        dataSinceOpened: 'Передано с момента открытия страницы',
        rightNow: 'Прямо сейчас',
    },

    route: {
        usersNote: 'за последние 24 часа',
        operator: 'Сетевой оператор',
        exits: 'Выходы',
        // under the number: a caption that agrees with any count («112 стран», but «101 страна»)
        exitsNote: 'число стран',
    },

    titles: {
        dailyUsers: 'Пользователи за сутки',
        providersOnline: 'Провайдеры онлайн',
        dataCarried: 'Переданные данные',
        totalNetworks: 'Всего сетей',
        thisEpoch: 'Текущая эпоха',
        totalDataCarried: 'Всего передано данных',
        coverage: 'Охват',
        countries: 'Страны',
        cities: 'Города',
        byContinent: 'По континентам',
        sn25Subnet: 'Подсеть SN25',
        alphaPrice: 'Цена alpha',
        // the reserve's name, kept in English as the site's translations write it
        reserve: 'Network Capacity Reserve',
        alphaLocked: 'Alpha в блокировках conviction',
        traffic: 'Трафик',
        whenTrafficFlows: 'Когда идёт трафик',
        runningTotal: 'Нарастающий итог',
        users: 'Пользователи',
        growth: 'Рост',
        signups: 'Регистрации',
        providers: 'Провайдеры',
        providersByCountry: 'Провайдеры по странам',
        details: 'Подробности',
        allCountries: 'Все страны',
        becomeProvider: 'Стать провайдером',
        payouts: 'Выплаты',
        earned: 'Заработано провайдерами',
        conviction: 'Conviction',
        convictionLocks: 'Блокировки conviction',
        totalLocked: 'Всего заблокировано',
        // figure labels and the locks table's type column
        perpetual: 'Бессрочно',
        decaying: 'С убыванием',
        reserveBalance: 'Баланс резерва',
        reserveShort: 'Резерв',
        walletAndHotkeys: 'Кошелёк и хоткеи',
        throughput: 'Скорость передачи',
        connectedDevices: 'Подключённые устройства',
        newConnections: 'Новые подключения',
        extendersOnline: 'Экстендеры онлайн',
        whereExtenders: 'Где находятся экстендеры',
        ipFamily: 'Версии IP',
        extenders: 'Экстендеры',
    },

    common: {
        allTime: 'за всё время',
        onlineNow: 'онлайн сейчас',
        onAverage: 'в среднем',
        aDayOnAverage: 'в среднем в день',
        online: 'онлайн',
        allTimeChip: 'За всё время',
        networkIsAccount: 'Сеть — это аккаунт. Один аккаунт может подключать несколько устройств.',
        searchCountry: 'Поиск страны',
    },

    expand: {
        users: 'Развернуть график пользователей за сутки',
        providers: 'Развернуть график провайдеров онлайн',
        data: 'Развернуть график переданных данных',
        networks: 'Развернуть график общего числа сетей',
        total: 'Развернуть график общего объёма переданных данных',
    },

    more: {
        network: 'Подробная статистика сети →',
        providers: 'Подробная статистика провайдеров →',
        subnet: 'Подробная статистика SN25 →',
        other: 'Прочие показатели: устройства, подключения, экстендеры →',
    },

    globeAria: 'Глобус со странами провайдеров. Перетаскивайте, чтобы вращать; нажмите на страну, чтобы увидеть её показатели.',
    mapAria: 'Карта провайдеров по странам. Все страны перечислены в таблице ниже.',

    network: {
        showTable: 'Показать таблицей',
        styleAria: 'Вид графика',
        clock: 'Циферблат',
        bars: 'Столбцы',
    },

    providers: {
        liveCount: 'Текущее число устройств, которые делятся своим подключением.',
        becomeText: 'Делиться своим подключением может любой — через приложение URnetwork. Вознаграждение зависит от трафика, который вы передаёте, и выплачивается через SN25.',
        install: 'Установить приложение ↗',
        rewards: 'Как рассчитывается вознаграждение ↗',
    },

    subnet: {
        payoutsLede: 'SN25 платит провайдерам каждые 7 дней.',
        convictionLede: 'Alpha, заблокированная в поддержку SN25 по механизму conviction в Bittensor.',
        reserveLede: 'Резерв финансирует ёмкость сети. {link}',
        reserveLink: 'Подробнее ↗',
        reservePeriodAria: 'Период баланса резерва',
    },

    notes: {
        throughput: 'Учитывает каждый переход маршрута, поэтому значение выше объёма переданных данных.',
        devices: 'Уникальные устройства с активным подключением, включая переподключения.',
        connections: 'Новые клиентские сессии, включая переподключения.',
        extenders: 'Ретрансляторы, которые помогают людям подключиться там, где прямые маршруты заблокированы.',
    },

    close: 'Закрыть',

    footer: {
        method: 'Как мы считаем →',
        home: '← Вернуться на ur.xyz',
        // {time} is time.local of dashboard/script: «чт, 12 нояб., 14:05 по местному времени»
        updated: 'Обновлено: {time}.',
    },
};
