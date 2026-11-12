// /reserve's head and hero in Russian: the translation of en.js beside it (same keys).
// Terms: momentum stays in Latin (the defined share; agreement goes through «доля» or «значение»);
// miner emissions эмиссия майнеров; the reserve резерв; the name Network Capacity Reserve stays in English.
export default {
    meta: {
        title: 'Network Capacity Reserve — резерв ёмкости сети | UR',
        description: 'Резерв для постоянной оптимизации ёмкости: эмиссия майнеров SN25, которую оставляет momentum, оплачивает провайдерам проверенную ёмкость сети. Данные из Bittensor онлайн.',
        breadcrumb: 'Network Capacity Reserve',
    },

    hero: {
        eyebrow: 'SN25 · Эмиссия майнеров',
        name: 'Network Capacity Reserve',
        tagline: 'Резерв для постоянной оптимизации ёмкости.',
        lede: 'Эмиссия майнеров SN25 делится на две части: доля momentum, которая выплачивается провайдерам сейчас, и резерв, куда поступает остальное. Резерв платит провайдерам за проверенную ёмкость сети: более широкое покрытие, более надёжные маршруты и ёмкость для новых сетевых операторов.',
    },

    perDay: '{amount} α в день',

    formula: {
        label: 'Формула',
        reserve: 'Резерв',
        minerEmissions: 'эмиссия майнеров',
        momentum: 'momentum',
        atLaunch: 'При запуске:',
        atBlock: 'В блоке {block}:',
        atCurrent: 'При текущем momentum:',
        burned: '{share} на сжигание',
        definition: '{term} — доля эмиссии майнеров, которая сейчас обеспечивает работу сети: она выплачивается провайдерам как вознаграждение. Резерв — не фиксированная доля. Он получает всё, что не использует momentum, поэтому с ростом momentum получает меньше.',
        term: 'Momentum',
        noMomentumYet: 'Блокчейн пока не показывает momentum: в блоке {block} остаток доли майнеров поступает получателям резерва, а страница перейдёт на значение momentum из блокчейна, как только оно составит не менее {min}.',
    },

    wallet: {
        label: 'Кошелёк резерва',
        copy: 'Копировать',
        copied: 'Скопировано',
        copyTarget: '— адрес кошелька',
        copiedStatus: 'Скопировано в буфер обмена',
        viewOnTaostats: 'Открыть в Taostats',
    },

    status: {
        reading: 'Чтение основной сети Bittensor…',
        unavailable: 'Чтение блокчейна недоступно',
        retrying: 'повторная попытка',
        live: 'Онлайн',
        liveDetail: 'основная сеть Bittensor · финализировано',
        preLaunch: 'До запуска',
        awaiting: 'Ожидание первого поступления',
        preDetail: 'прогноз по ончейн-эмиссии',
        block: 'блок {block}',
    },

    stats: {
        balance: 'Баланс резерва',
        balanceReading: 'чтение основной сети Bittensor…',
        balanceNothing: 'поступлений пока нет',
        balanceFlows: '{received} поступило · {spent} выплачено',
        balanceReadingHistory: 'чтение истории баланса…',
        inflow: 'Приток за месяц',
        inflowObserved: {
            one: '{amount} α в день по факту за {count} последний день',
            few: '{amount} α в день по факту за {count} последних дня',
            many: '{amount} α в день по факту за {count} последних дней',
            other: '{amount} α в день по факту за {count} последнего дня',
        },
        inflowProjected: '{amount} α в день по прогнозу · эмиссия майнеров × (1 − momentum)',
        committed: 'Выделено на программы',
    },

    price: {
        unitAria: 'Единица отображения',
        // in the genitive: each follows «по данным» in price.note and in the fine print's valuation
        sources: {
            operators: 'фидов статистики сетевых операторов',
            gecko: 'фида пула GeckoTerminal от CoinGecko',
        },
        note: 'USD по текущей цене α: {price} за α по данным {source} на {time}. Это спотовая оценка, а не стоимость реализации.',
        unavailable: 'Цена α недоступна: суммы остаются в α, пока не ответит ценовой фид.',
    },

    verify: 'Проверьте сами: эти цифры читаются из основной сети Bittensor в вашем браузере. Резерв хранится на колдкее {address}; посмотреть его можно в {explorer}.',
};
