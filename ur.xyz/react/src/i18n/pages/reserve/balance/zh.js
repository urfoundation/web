// /reserve section 01 in Simplified Chinese: the translation of en.js beside it (same keys).
export default {
    kicker: '01 / 储备',
    title: '储备余额。',
    sub: {
        live: {
            onChain: '余额及其按月的流动，读取自链上已最终确认的状态，并按 momentum 的链上值推算至 {date}。',
            launch: '余额及其按月的流动，读取自链上已最终确认的状态，并按 momentum 的启动值推算至 {date}。',
        },
        projected: {
            onChain: '在储备收到发行之前，按政策推算的结果：矿工发行 × (1 − momentum)，momentum 取链上值，且不支付任何项目。',
            launch: '在储备收到发行之前，按政策推算的结果：矿工发行 × (1 − momentum)，momentum 取启动值，且不支付任何项目。',
        },
    },

    controls: {
        windowAria: '图表时间范围',
        last7: '7天',
        last30: '30天',
        all: '全部',
        expand: '展开',
        collapse: '收起',
        balanceChart: '余额图表',
        flowsChart: '流入图表',
    },

    series: {
        live: '实时余额',
        projected: '预测',
        received: '收入',
        spent: '支出',
        projectedInflow: '预计流入',
    },
    today: '今天',
    nothingThisPeriod: '本期无数据',
    nothingToChart: '暂无可绘制的数据：储备尚未收到任何发行。',
    unitUsd: '按 α 实时价格折算的 USD',

    balance: {
        label: {
            liveProjected: '储备余额 · 实时，预测至 {date}',
            live: '储备余额 · 实时',
            projected: '储备余额 · 预测至 {date}',
            plain: '储备余额',
            window: {
                other: '储备余额 · 最近 {count} 天',
            },
        },
        projectedTo: '→ {date}前达到 {amount}',
        windowChange: {
            other: '最近 {count} 天变化 {change}',
        },
        note: {
            live: {
                onChain: '实时余额每天从链上已最终确认的状态采样；按矿工发行 × (1 − momentum) 预测，momentum 取链上值，且不计项目支付。',
                launch: '实时余额每天从链上已最终确认的状态采样；按矿工发行 × (1 − momentum) 预测，momentum 取启动值，且不计项目支付。',
            },
            projected: {
                onChain: '按矿工发行 × (1 − momentum) 预测，momentum 取链上值，且不支付任何项目。储备收到发行后即改为显示实时余额。',
                launch: '按矿工发行 × (1 − momentum) 预测，momentum 取启动值，且不支付任何项目。储备收到发行后即改为显示实时余额。',
            },
            window: '实时余额每天从链上已最终确认的状态采样。',
            readingHistory: '正在读取余额历史…',
        },
        aria: {
            liveProjected: '储备余额，{unit}：实时数据至 {liveDate}，之后预测在 {date} 前达到 {amount}。使用方向键逐日读取。',
            live: '储备余额，{unit}：实时数据至 {liveDate}。使用方向键逐日读取。',
            projected: '储备余额，{unit}：预测在 {date} 前达到 {amount}。使用方向键逐日读取。',
            window: {
                other: '储备余额，{unit}，最近 {count} 天，读取自链上。使用方向键逐日读取。',
            },
        },
    },

    flows: {
        label: '月流入 · 项目支出',
        windowLabel: '日流入 · 项目支出',
        received: '收入 {amount}',
        toPrograms: '→ 迄今支付给项目 {amount}',
        toProgramsWindow: {
            other: '→ 最近 {count} 天支付给项目 {amount}',
        },
        readingHistory: '正在读取余额历史…',
        perMonth: '每月 {amount}',
        projectedNoPrograms: '预测 · 不支付任何项目',
        note: {
            live: '收入和支付是链上每日采样之间的上升与下降；最后一次采样之后的流入，按与余额相同的 momentum 预测。',
            projected: '在储备收到发行之前，每个月都是预测值。',
            window: '收入和支付是链上每日采样之间的上升与下降。',
        },
        aria: {
            live: {
                other: '月流入与项目支出，{unit}：从 {from} 到 {to} 共 {count} 个月，先为链上的收支，之后为预测。使用方向键逐月读取。',
            },
            projected: {
                other: '月流入与项目支出，{unit}：从 {from} 到 {to} 共 {count} 个月，全部为预测。使用方向键逐月读取。',
            },
            window: {
                other: '日流入与项目支出，{unit}，最近 {count} 天，读取自链上。使用方向键逐日读取。',
            },
        },
    },

    table: {
        show: '以表格显示',
        day: '日期',
        month: '月份',
        balance: '余额',
        change: '变化',
        basis: '依据',
        received: '收入',
        spent: '支出',
        projected: '预测',
        chain: '链上',
        basisProjected: '预测',
    },

    splits: {
        received: {
            title: '储备收到的全部款项',
            spent: '已支出',
            committed: '已承诺',
            unallocated: '未分配',
        },
        heading: '矿工分配的去向',
        emission: {
            title: 'SN25 发行',
            owner: '子网所有者',
            validators: '验证者',
            miners: '矿工分配',
            note: '所有者份额为 {share}；其余部分由验证者和矿工平分。',
        },
        onChain: {
            title: '矿工分配（当前链上）',
            momentum: 'Momentum，给提供者',
            reserve: '储备',
            burned: '所有者指定，已销毁',
            noteLive: '储备获得 momentum 之外的部分：1 − momentum。',
            noteOnChain: 'momentum 现已在链上：每天 {momentum} α 付给提供者。储备获得其余部分，即 1 − momentum（每天 {reserve} α），在其 hotkey 获得支付后到账。',
            notePreLaunch: '自 {date}起，momentum 付给提供者（每天 {momentum} α），储备获得其余部分，即 1 − momentum（每天 {reserve} α）。在此之前，链会销毁所有者指定的份额。',
        },
        planned: {
            title: '自 {date}起的矿工分配',
            momentum: 'Momentum，给提供者',
            reserve: '储备，1 − momentum',
            note: '链上响应后即显示实时分配。',
        },
        bar: {
            summary: '{title}：{segments}',
            segment: '{label} {value}',
            tip: '{label}：{value}',
            tipShare: '{label}：{value}（{share}）',
        },
    },
};
