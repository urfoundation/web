/**
 * The network's past USDC payouts (GET /account/payments), as read-only history.
 *
 * USDC provider payouts ended on November 12, 2026: the unsent payouts were
 * closed and no USDC payout will be sent again, and provider earnings are paid
 * through SN25. So a payment is either paid (completed, with its token amount)
 * or not paid. Nothing is pending, and no amount is estimated for a payment
 * that was not paid: before, an unsettled payment read "Pending" with an
 * estimate, and a closed one was taken for a payout still on its way.
 */
import type { AccountPayment } from "./types";

export type PastPayoutStatus = "paid" | "not_paid";

/** Paid when the payment completed; anything else was not paid. */
export const pastPayoutStatus = (
	payment: Pick<AccountPayment, "completed">,
): PastPayoutStatus => (payment.completed ? "paid" : "not_paid");

export interface PastPayoutTotals {
	/** USDC that reached the network's wallets */
	paidUsdc: number;
	/** bytes the paid payouts covered */
	paidBytes: number;
	paidCount: number;
	totalCount: number;
}

/** Totals over the paid payouts only: a payment that was not paid adds nothing. */
export const pastPayoutTotals = (
	payments: Pick<AccountPayment, "completed" | "token_amount" | "payout_byte_count">[],
): PastPayoutTotals =>
	payments.reduce<PastPayoutTotals>(
		(acc, payment) =>
			pastPayoutStatus(payment) === "paid"
				? {
						paidUsdc: acc.paidUsdc + (payment.token_amount || 0),
						paidBytes: acc.paidBytes + (payment.payout_byte_count || 0),
						paidCount: acc.paidCount + 1,
						totalCount: acc.totalCount + 1,
					}
				: { ...acc, totalCount: acc.totalCount + 1 },
		{ paidUsdc: 0, paidBytes: 0, paidCount: 0, totalCount: 0 },
	);
