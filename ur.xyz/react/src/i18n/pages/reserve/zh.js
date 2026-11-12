// /reserve's head and hero in Simplified Chinese: the translation of en.js beside it (same keys).
export default {
    meta: {
        title: 'Network Capacity Reserve：网络容量储备 | UR',
        description: '用于持续优化网络容量的储备：SN25 矿工发行中 momentum 之外的部分，用于为经验证的网络容量向提供者付费。数据实时读取自 Bittensor。',
        breadcrumb: 'Network Capacity Reserve',
    },

    hero: {
        eyebrow: 'SN25 · 矿工发行',
        name: 'Network Capacity Reserve',
        tagline: '用于持续优化网络容量的储备。',
        lede: 'SN25 的矿工发行分为两部分：momentum，即现在支付给提供者的部分；以及储备，它获得其余部分。储备为经验证的网络容量向提供者付费：更广的覆盖、更可靠的路由，以及为新的网络运营商提供容量。',
    },

    perDay: '每天 {amount} α',

    formula: {
        label: '公式',
        reserve: '储备',
        minerEmissions: '矿工发行',
        momentum: 'momentum',
        atLaunch: '启动时：',
        atBlock: '在区块 {block}：',
        atCurrent: '按当前 momentum：',
        burned: '{share} 已销毁',
        definition: '{term} 是矿工发行中现在用于驱动网络、作为奖励付给提供者的份额。储备并不是固定份额：它获得 momentum 未使用的全部部分，因此 momentum 越大，储备获得的越少。',
        term: 'Momentum',
        noMomentumYet: '链上尚未显示 momentum：在区块 {block}，储备的接收方获得矿工分配的其余部分；一旦链上的 momentum 至少达到 {min}，页面就会改为跟随链上的值。',
    },

    wallet: {
        label: '储备钱包',
        copy: '复制',
        copied: '已复制',
        copyTarget: '钱包地址',
        copiedStatus: '已复制到剪贴板',
        viewOnTaostats: '在 Taostats 上查看',
    },

    status: {
        reading: '正在读取 Bittensor 主网…',
        unavailable: '无法读取链上数据',
        retrying: '正在重试',
        live: '实时',
        liveDetail: 'Bittensor 主网 · 已最终确认',
        preLaunch: '启动前',
        awaiting: '等待首笔收入',
        preDetail: '根据链上发行推算',
        block: '区块 {block}',
    },

    stats: {
        balance: '储备余额',
        balanceReading: '正在读取 Bittensor 主网…',
        balanceNothing: '尚未收到任何款项',
        balanceFlows: '收入 {received} · 支出 {spent}',
        balanceReadingHistory: '正在读取余额历史…',
        inflow: '月流入',
        inflowObserved: {
            other: '观测到每天 {amount} α，最近 {count} 天',
        },
        inflowProjected: '预计每天 {amount} α · 矿工发行 × (1 − momentum)',
        committed: '已承诺给项目',
    },

    price: {
        unitAria: '显示单位',
        sources: {
            operators: '网络运营商的统计数据源',
            gecko: 'CoinGecko 的 GeckoTerminal 资金池数据源',
        },
        note: '按 α 实时价格折算的 USD：每 α {price}，来自{source}，{time}。这只是即时参考价，并非可实现的价值。',
        unavailable: '无法获取 α 价格：在价格数据源响应之前，数字以 α 显示。',
    },

    verify: '你可以自行核实：这些数字由你的浏览器从 Bittensor 主网读取。储备由 coldkey {address} 持有；可在 {explorer} 上查看。',
};
