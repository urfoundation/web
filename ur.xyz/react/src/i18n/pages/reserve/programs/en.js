// /reserve, sections 02 and 03: the kinds of program the reserve pays for, and the
// programs themselves, with the filter by status and the program table
// (react/src/components/pages/Reserve.jsx). The program types, the statuses and
// the programs are derived from react/src/data/reserve.js, which stays their
// source: types.list, statuses and programs.list are in the data's order. A
// program's type is shown with its type's title (types.list), so it is not
// repeated here.
//
// Placeholders: {count} is a number of programs, {amount} a formatted figure in α
// or USD ("40K α"), {share} a percentage, {paid} and {ceiling} numbers of α.
import { reserve } from '../../../../data/reserve.js';

export default {
    types: {
        // the section's number and name, shown in capitals
        kicker: '02 / Program types',
        title: 'What the reserve pays for.',
        sub: 'Programs buy services from providers, not equipment.',
        // the two labels of each type's details (shown in capitals)
        verifiedBy: 'Verified by',
        paidAs: 'Paid as',
        // each type: its tag (shown in capitals), title, summary, how it is verified and how it is paid
        list: reserve.programTypes.map((type) => ({
            tag: type.tag,
            title: type.title,
            summary: type.summary,
            verifiedBy: type.verifiedBy,
            paidAs: type.paidAs,
        })),
    },

    // a program's status, by its id in the data: the status pill and the filter's buttons
    // (shown in capitals; keep them short)
    statuses: { ...reserve.programStatus },

    // how many programs there are of a kind
    counts: {
        // "1 in preparation", "3 indicative": how many programs have each status that is not yet
        // active, listed after noneActive under "Committed to programs"
        // ("none active · 1 in preparation · 3 indicative")
        byStatus: {
            preparing: { one: '{count} in preparation', other: '{count} in preparation' },
            indicative: { one: '{count} indicative', other: '{count} indicative' },
        },
        noneActive: 'none active',
        // the active programs, in the programs bar ("40K α committed · 1 active")
        active: { one: '{count} active', other: '{count} active' },
        // under "Committed to programs" while programs are active: {share} is the committed amount's
        // share of a year's inflow
        committedShare: {
            one: '{share} of 12-month inflow · {count} active program',
            other: '{share} of 12-month inflow · {count} active programs',
        },
    },

    programs: {
        // the section's number and name, shown in capitals
        kicker: '03 / Programs',
        title: 'Current programs.',
        sub: 'Programs are published here before they are paid. One in preparation is having its terms prepared; an indicative one is expected but not yet approved. A program is active only once its terms are published and providers have accepted them, and its size and payments appear with it.',
        // follows sub while no program is active
        noneActiveYet: 'None is active yet.',
        // the filter: its accessible name, its label (shown in capitals) and the button showing every
        // program ("All · 4"; the status buttons are statuses above)
        filterAria: 'Filter programs by status',
        label: 'Programs',
        all: 'All',
        // the programs bar's summary, shown in capitals, with the active count after " · "
        // ({amount}: the amount committed)
        committed: '{amount} committed',
        nothingCommitted: 'Nothing committed yet',
        // the table's column headers, shown in capitals
        head: {
            program: 'Program',
            type: 'Type',
            pays: 'Pays',
            size: 'Size',
            paid: 'Paid',
            status: 'Status',
        },
        // what a program pays while its terms are not published
        termsTbd: 'Terms to be published',
        // on a phone, a program's figures in its one line of details: its ceiling and the share paid
        ceiling: '{amount} ceiling',
        paidShare: '{share} paid',
        // not shown: the accessible name of a program's paid bar
        paidAria: '{paid} α paid of a {ceiling} α ceiling',
        // the table's one row when no program has the status filtered for
        empty: 'No program has this status.',
        // each program: its title and summary, and how it pays once its terms are published
        // (payRule, lowercase in the table; absent while the terms are to be published)
        list: reserve.programs.map((program) => ({
            title: program.title,
            summary: program.summary,
            ...(program.payRule ? { payRule: program.payRule } : {}),
        })),
    },
};
