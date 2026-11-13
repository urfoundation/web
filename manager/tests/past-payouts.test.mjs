// The past USDC payouts (src/services/pastPayouts.ts, shown by
// PayoutStatsSection): USDC provider payouts ended on November 12, 2026, so a
// payment is paid or not paid. Before, a payment neither completed nor
// canceled read "Pending" with an estimated amount, and the totals counted
// payments that were never paid.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { pastPayoutStatus, pastPayoutTotals } from "../src/services/pastPayouts.ts";

const payment = (fields) => ({
	payment_id: "synthetic",
	token_type: "USDC",
	blockchain: "SOL",
	tx_hash: "",
	payment_time: "",
	token_amount: 0,
	payout_byte_count: 0,
	completed: false,
	canceled: false,
	...fields,
});

test("a payment is paid only when it completed; closed or unsent ones are not paid", () => {
	assert.equal(pastPayoutStatus(payment({ completed: true, token_amount: 1.5 })), "paid");
	// closed when USDC payouts ended
	assert.equal(pastPayoutStatus(payment({ canceled: true, payout_nano_cents: 35_827_119_000 })), "not_paid");
	// never completed nor canceled: still not pending, there is no payout run
	assert.equal(pastPayoutStatus(payment({ payout_nano_cents: 3_870_000_000 })), "not_paid");
});

test("the totals count only the paid payouts", () => {
	const totals = pastPayoutTotals([
		payment({ completed: true, token_amount: 12.4, payout_byte_count: 2_000 }),
		payment({ canceled: true, token_amount: 0, payout_byte_count: 9_000, payout_nano_cents: 35_827_119_000 }),
		payment({ payout_byte_count: 4_000, payout_nano_cents: 3_870_000_000 }),
		payment({ completed: true, token_amount: 0.56, payout_byte_count: 1_000 }),
	]);
	assert.equal(totals.paidCount, 2);
	assert.equal(totals.totalCount, 4);
	assert.equal(totals.paidBytes, 3_000);
	assert.ok(Math.abs(totals.paidUsdc - 12.96) < 1e-9, `paid ${totals.paidUsdc}`);
	assert.deepEqual(pastPayoutTotals([]), { paidUsdc: 0, paidBytes: 0, paidCount: 0, totalCount: 0 });
});

test("the payout history shows no pending state and no estimate", () => {
	const source = fs.readFileSync(new URL("../src/components/PayoutStatsSection.tsx", import.meta.url), "utf8");
	assert.match(source, /Past USDC Payouts/);
	assert.match(source, /pastPayoutStatus\(payment\)/);
	assert.doesNotMatch(source, /Pending|Estimated|estimateFor|settlementFee/);
});
