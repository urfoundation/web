// /reserve sections 02 and 03 in Simplified Chinese: the translation of en.js beside it (same keys,
// the lists in the order of data/reserve.js).
export default {
    types: {
        kicker: '02 / 项目类型',
        title: '储备为哪些服务付费。',
        sub: '项目向提供者购买的是服务，而不是设备。',
        verifiedBy: '验证方式',
        paidAs: '支付方式',
        list: [
            {
                tag: '类型 01',
                title: '网络覆盖',
                summary: '在运营商的需求超过供给的地方增加容量：在客户需要的地方提供更多出口位置和路由。',
                verifiedBy: '由来自多个观测点的验证方进行重叠与路由检查',
                paidAs: '每周支付，按经验证的覆盖单位计',
            },
            {
                tag: '类型 02',
                title: '路由可靠性',
                summary: '提高运营商已在使用的路由的成功率、降低延迟，让客户遇到更少的失败会话。',
                verifiedBy: '按约定的可用性和延迟阈值进行随机探测',
                paidAs: '向在服务期内达到阈值的提供者发放奖金',
            },
            {
                tag: '类型 03',
                title: '运营商接入',
                summary: '为新的网络运营商资助提供者容量，使第二个产品能够在共享供给上推出。',
                verifiedBy: '对可用路由和持续可用性进行签核',
                paidAs: '按里程碑支付给服务提供者，绝不作为给运营商的注册补贴',
            },
        ],
    },

    statuses: {
        preparing: '筹备中',
        indicative: '意向',
        active: '进行中',
        complete: '已完成',
    },

    counts: {
        byStatus: {
            preparing: { other: '{count} 个筹备中' },
            indicative: { other: '{count} 个意向' },
        },
        noneActive: '无进行中项目',
        active: { other: '{count} 个进行中' },
        committedShare: {
            other: '占 12 个月流入的 {share} · {count} 个进行中的项目',
        },
    },

    programs: {
        kicker: '03 / 项目',
        title: '当前项目。',
        sub: '项目会先在这里公布，再进行支付。处于筹备中的项目正在拟定条款；意向项目已在预期之中，但尚未获批。只有在条款公布且提供者接受之后，项目才会进入进行中状态，其规模和支付也会随之显示。',
        noneActiveYet: '目前还没有进行中的项目。',
        filterAria: '按状态筛选项目',
        label: '项目',
        all: '全部',
        committed: '已承诺 {amount}',
        nothingCommitted: '尚无承诺',
        head: {
            program: '项目',
            type: '类型',
            pays: '支付',
            size: '规模',
            paid: '已付',
            status: '状态',
        },
        termsTbd: '条款待公布',
        ceiling: '上限 {amount}',
        paidShare: '已付 {share}',
        paidAria: '已付 {paid} α，上限 {ceiling} α',
        empty: '没有处于此状态的项目。',
        list: [
            {
                title: '区域预装',
                summary: '将在特定地区扩大网络覆盖的合作伙伴。',
            },
            {
                title: '为现有运营商增加出口覆盖',
                summary: '在固定服务期内维持的新增合格出口位置。',
                payRule: '按经验证的出口天数支付',
            },
            {
                title: '现有运营商路由的可靠性',
                summary: '在一组固定的可比探测中提高路由成功率。',
                payRule: '阈值奖金',
            },
            {
                title: '为第二个运营商提供的提供者容量',
                summary: '为新加入网络的运营商提供可用且经验证的提供者连接。',
                payRule: '里程碑付款',
            },
        ],
    },
};
