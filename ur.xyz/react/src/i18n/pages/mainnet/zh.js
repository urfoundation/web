// /mainnet in Chinese: the translation of en.js beside it (the page's own copy). Same keys as en.js; after
// changing a translation, run `node tests/i18n-staleness.mjs --unit mainnet --accept zh <key> ...` from react/.
// The terms of all three units (this one, data/ and timeline/): epoch 周期 (a subscription's cycle is 计费周期);
// settlement v2 结算 v2; version 1 版本 1; network operator 网络运营商; subnet owner 子网所有者; payout root 支付根;
// commit 提交; challenge period 质疑期; claim 领取; payout wallet 收款钱包; governance Safe 治理 Safe; timelock
// 时间锁; vault 金库; capture the flag 夺旗 (the apps' name); draw 抽签 (never 抽奖, 彩票 or 奖池: it is not a
// lottery); entry 参与者; slot 槽位; pot 累积池; carry forward 结转; relay 中继. Figures keep the English digits
// and separators (9,240,028; 1,076.26 α); dates as 11月27日, times as 18:25 UTC.
export default {
    meta: {
        title: 'SN25 主网上线时间线 | UR',
        description: 'SN25 主网按支付周期的上线历程：10月8日起为版本 1，自周期 4（10月30日）起为结算 v2，首次领取于 11月8日开放。',
        breadcrumb: '主网',
    },

    intro: {
        eyebrow: 'SN25 · Bittensor 主网',
        title: '主网上线时间线',
        lede: 'UR 的子网 SN25 于 2026年10月8日在 Bittensor 主网上线。本时间线按支付周期记录上线过程，从版本 1 的合约到结算 v2 的首次领取。',
        note: '标记为 {scheduled} 或 {planned} 的里程碑尚未发生，其日期可能变动。所有时间均为 UTC，标有 ≈ 的时间为近似值：大多数是根据区块号推算的。',
    },

    settlement: {
        eyebrow: '结算',
        title: '先是版本 1，然后是结算 v2',
        paragraphs: [
            'SN25 按支付周期向提供者付款。这些是 UR 的结算周期，而不是链上 72 分钟的 tempo：周期 0 持续一天，之后每个周期持续 7 天（50,400 个区块）。',
            '版本 1 于 10月8日上线，结算周期 1 至 3。它只向验证者测量过的提供者付款，而这一测量每个周期上限约为 1,500 个提供者，因此大多数矿工得不到版本 1 的份额。',
            '结算 v2 按用量付款，并取消了这一上限。原计划由它从周期 3 起接手，但它的池没能在周期 3 于 10月23日开始之前注册，因此周期 3 也由版本 1 结算。它的池于 10月29日注册，自周期 4 起，结算 v2 已为每个周期付款；周期 4 约于 10月30日 18:25 UTC 开始。第一个 v2 周期约于 11月6日结束，其领取于 11月8日开放，此前它的根已提交，质疑期也已结束。',
        ],
        epochsAria: '支付周期',
    },

    milestones: {
        eyebrow: '时间线',
        title: '里程碑',
        fine: '已排定或计划中的里程碑的时间是推算值，依据其区块号按每块 12 秒推算，或依据计划；除非已定为确切时间，否则标有 ≈。如果出块变快或变慢，推算时间会略有变动。自周期 1 起，每个周期在结束后 120 个区块内关闭，其支付根应在结束后 1,200 个区块内提交，其领取在此后 14,400 个区块（约两天）开放。已排定和计划中的里程碑可能变动。',
        updated: '更新于 {date}。',
    },

    noticeDate: '通知 · {date}',

    labels: {
        status: { done: '已完成', in_progress: '进行中', scheduled: '已排定', planned: '计划中' },
        settlement: { v1: '版本 1', v2: '结算 v2' },
        view: { transaction: '查看交易', contract: '查看合约', block: '查看区块' },
        sourceAria: '{action}：{label}',
        sourcesAria: '{title} 的来源',
        transactionsAria: '{title} 的交易',
        transactions: { other: '{count} 笔交易' },
        epoch: '周期 {number}',
        beforeLaunch: '上线之前',
        afterEpoch: '周期 {number} 之后',
        epochBlocks: '区块 {start} → {end} · {blocks}，{length}',
        blocks: { other: '{count} 个区块' },
        days: { other: '{count} 天' },
        aboutDays: { other: '约 {count} 天' },
        arrow: '→',
    },

    dates: {
        weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
        months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        monthsLong: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        day: '{month}{date}日{weekday}',
        monthDay: '{month}{date}日',
        sameMonth: '{month}{start}日–{end}日',
        twoMonths: '{start}–{end}',
        long: '{year}年{month}{date}日',
    },

    summary: {
        title: '概览',
        figureAria: '支付周期与关键里程碑',
        epochShort: '{number}期',
        afterShort: '之后',
        from: '自 {days} 起',
        settledBy: { v1: '由版本 1 结算', v2: '由结算 v2 结算' },
        mark: '{number}. {title}，{when}，{status}',
        span: '{title}，{when}，{status}',
        now: '现在',
        nowAt: '{time}',
        nowIn: '{time}，周期 {number} 已过 {percent}%',
        bandsAria: '区段',
        markersAria: '标记',
        either: '{first}或{second}',
        lower: { done: '已完成', in_progress: '进行中', scheduled: '已排定', planned: '计划中' },
        legendSpan: '{title}，{days}',
        datesAria: '关键日期',
    },
};
