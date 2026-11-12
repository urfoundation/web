// /reserve section 04 and the fine print in Simplified Chinese: the translation of en.js beside it
// (same keys, the lists in the order of data/reserve.js).
export default {
    process: {
        kicker: '04 / 项目如何启动',
        title: '先公布，后支付。',
        steps: [
            { title: '公布条款', detail: '缺口、资格、支付规则、验证方。' },
            { title: '提供者接受', detail: '只有在接受之后才预留预算。' },
            { title: '每周测量', detail: '验证方对观测结果签名。' },
            { title: '公开清单', detail: '接收方、金额和证据。' },
            { title: '48 小时审查', detail: '签署前公布以供审查。' },
            { title: '3 个签名中的 2 个', detail: '对照编码后的交易进行核对。' },
        ],
    },

    custody: {
        heading: '托管',
        threshold: '2/3',
        accountLabel: '储备账户 · 多签（{threshold}）',
        onChain: '已上链',
        awaitingFunds: '等待资金',
        modeNote: '储备账户是一个原生多签（2/3）账户。它只为注册自己的接收方而签名，并用自身余额支付它们在 SN25 的注册销毁费用。',
        holds: '在区块 {block}，它持有 {tao} TAO 可用余额。',
        recipients: '接收方 hotkey',
        notRegistered: '尚未注册',
        registeredAt: '注册于区块 {block}',
        signersLabel: '签名人 · {threshold}',
        signers: [
            { label: '签名人 1' },
            { label: '签名人 2' },
            { label: '签名人 3' },
        ],
        thresholdNote: '项目付款由同一个多签签署：3 位签名人中的任意 2 位。',
        derives: {
            other: '这 {count} 把密钥按阈值 {threshold} 推导出上面的储备账户。',
        },
        notDerived: '这些密钥推导不出上面的储备账户：请核对公布的签名人。',
        identities: '签名人的身份不公开。',
    },

    ctas: {
        talk: '联系 UR 团队',
        guide: '阅读矿工指南',
        policy: 'GitHub 上的发行政策',
    },

    fine: {
        aria: '方法说明',
        mechanism: {
            label: '机制。',
            body: 'SN25 每天发行 {emission} α：{ownerShare} 归子网所有者，其余由验证者和矿工平分，因此矿工分配为每天 {minerAllocation} α。自 {date}起，momentum，即现在用于驱动网络的份额，作为奖励付给提供者。储备的接收方 hotkey 获得其余部分，即矿工发行 × (1 − momentum)，因此储备的份额并不固定，会随 momentum 的增长而下降。在链上显示的 momentum 至少达到 {min} 之前，页面将 momentum 保持在启动值，之后跟随链上的值。',
        },
        beforeLaunch: {
            label: '启动前。',
            labelOverdue: '首笔收入之前。',
            body: {
                onChain: '在已最终确认的区块 {block}（{time}），矿工分配的 {share} 被指向子网所有者的 hotkey 并由链销毁，储备账户没有任何余额。预测将 momentum 保持在其当前的链上值，且不计项目支付。',
                launch: '在已最终确认的区块 {block}（{time}），矿工分配的 {share} 被指向子网所有者的 hotkey 并由链销毁，储备账户没有任何余额。预测将 momentum 保持在其启动值，且不计项目支付。',
            },
        },
        balance: {
            label: '余额。',
            held: '储备是以其接收方 hotkey 质押在 SN25 上的 α，归 coldkey {coldkey} 所有，读取自链上已最终确认的状态（区块 {block}，{time}）；任何可用 TAO 单独显示。',
            flows: {
                onChain: '收入和支付是每日采样之间的上升与下降，自接收方在区块 {registered} 注册起计算；预测从最新余额出发，按 momentum 的链上值进行，且不计项目支付。',
                launch: '收入和支付是每日采样之间的上升与下降，自接收方在区块 {registered} 注册起计算；预测从最新余额出发，按 momentum 的启动值进行，且不计项目支付。',
                onChainNoBlock: '收入和支付是每日采样之间的上升与下降，自接收方注册起计算；预测从最新余额出发，按 momentum 的链上值进行，且不计项目支付。',
                launchNoBlock: '收入和支付是每日采样之间的上升与下降，自接收方注册起计算；预测从最新余额出发，按 momentum 的启动值进行，且不计项目支付。',
            },
        },
        valuation: {
            label: '估值。',
            tao: 'TAO 数字只是即时参考价，并非可实现的价值：α 按 {price} TAO 计，即该区块 SN25 资金池中投入的 TAO 与 α 之比。',
            usd: 'USD 数字为 α 乘以 α 的实时价格（{price}，来源：{source}，{time}）：同样只是即时参考价。',
            noPrice: '尚未读取到任何 α 价格，因此不显示 USD 数字。',
            inAlpha: '显示单位为 α 时，不显示 USD 数字。',
        },
        sources: {
            label: '数据来源。',
            body: '链上数字由你的浏览器通过 Bittensor 主网的公共 RPC 端点读取（{rpcHosts}；历史数据使用 {archiveHosts}），因此这些主机能看到请求。选择 USD 时，α 价格读取自网络运营商的统计数据源或 CoinGecko 的 GeckoTerminal 数据源（{priceHosts}）。不会联系其他任何服务。账户 {account}。',
        },
    },
};
