/**
 * The data the network served, by epoch (GET /account/epochs), as the Data
 * Stats tab shows it.
 *
 * GET /transfer/stats reports unpaid_bytes_provided as 0 for every network
 * since the USDC close-out: it counted the bytes owed a USDC payout, and none
 * are any more (urnetwork/server#451). The replacement is /account/epochs: the
 * bytes served behind each finalized epoch's points, and running figures for
 * the open epoch and the open weekly operator block (urfoundation/web#88).
 *
 * An epoch counts the operator blocks that end in its window. So the open
 * block's bytes are already part of the open epoch's figure when the block
 * counts in the open epoch, and count toward a later epoch otherwise: nothing
 * here adds the block to an epoch.
 *
 * The api sends JSON numbers. An entry whose epoch number or window isn't a
 * number is left out rather than shown wrong, and a missing byte count reads 0,
 * as from a server that predates the field.
 */
import type {
	AccountCurrentBlock,
	AccountCurrentEpoch,
	AccountEpoch,
	AccountEpochsResponse,
} from "./types";

export interface ServedEpochRow {
	epoch: number;
	startMillis: number;
	/** projected while the epoch is open */
	endMillis: number;
	servedBytes: number;
	/** the open epoch: its bytes are a running figure */
	open: boolean;
	/** the open epoch's traffic is counted through this time */
	asOfMillis?: number;
	/** a finalized epoch's points */
	points?: number;
}

export interface ServedBlock {
	blockNumber: number;
	startMillis: number;
	endMillis: number;
	servedBytes: number;
	/** the traffic is counted through this time */
	asOfMillis: number;
	/** the epoch the block counts in once it ends */
	epoch: number;
	/** the block counts in the open epoch, whose figure already holds these bytes */
	inOpenEpoch: boolean;
}

const isNumber = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value);

/** a byte count or points value: a number, else 0 */
const numberOrZero = (value: unknown): number => (isNumber(value) ? value : 0);

const finalizedRow = (epoch: Partial<AccountEpoch>): ServedEpochRow | null => {
	if (!isNumber(epoch.epoch) || !isNumber(epoch.start_millis) || !isNumber(epoch.end_millis)) {
		return null;
	}
	return {
		epoch: epoch.epoch,
		startMillis: epoch.start_millis,
		endMillis: epoch.end_millis,
		servedBytes: numberOrZero(epoch.served_byte_count),
		open: false,
		points: numberOrZero(epoch.points),
	};
};

const openRow = (current: Partial<AccountCurrentEpoch> | undefined): ServedEpochRow | null => {
	if (
		!current ||
		!isNumber(current.epoch) ||
		!isNumber(current.start_millis) ||
		!isNumber(current.end_millis)
	) {
		return null;
	}
	return {
		epoch: current.epoch,
		startMillis: current.start_millis,
		endMillis: current.end_millis,
		servedBytes: numberOrZero(current.served_byte_count),
		open: true,
		asOfMillis: isNumber(current.as_of_millis) ? current.as_of_millis : undefined,
	};
};

/**
 * The open epoch first, then the finalized epochs newest first, each with its
 * own bytes. An open epoch that is no newer than a finalized one (an answer
 * read while the epoch finalized) is left out: the finalized row has its
 * figure.
 */
export const servedEpochRows = (result: AccountEpochsResponse | null): ServedEpochRow[] => {
	if (!result) {
		return [];
	}
	const finalized = (Array.isArray(result.epochs) ? result.epochs : [])
		.map((epoch) => finalizedRow(epoch ?? {}))
		.filter((row): row is ServedEpochRow => row !== null)
		.sort((a, b) => b.epoch - a.epoch);
	const open = openRow(result.current_epoch);
	if (open && (finalized.length === 0 || finalized[0].epoch < open.epoch)) {
		return [open, ...finalized];
	}
	return finalized;
};

/**
 * The open weekly operator block, or null when the answer has none. Its bytes
 * are part of the open epoch's figure when it counts in that epoch.
 */
export const servedThisBlock = (result: AccountEpochsResponse | null): ServedBlock | null => {
	const block: Partial<AccountCurrentBlock> | undefined = result?.current_block;
	if (
		!block ||
		!isNumber(block.block_number) ||
		!isNumber(block.start_millis) ||
		!isNumber(block.end_millis) ||
		!isNumber(block.epoch)
	) {
		return null;
	}
	const open = openRow(result?.current_epoch);
	return {
		blockNumber: block.block_number,
		startMillis: block.start_millis,
		endMillis: block.end_millis,
		servedBytes: numberOrZero(block.served_byte_count),
		asOfMillis: isNumber(block.as_of_millis) ? block.as_of_millis : block.start_millis,
		epoch: block.epoch,
		inOpenEpoch: open !== null && open.epoch === block.epoch,
	};
};

/**
 * Whether the epochs are due another read: never read, read at least
 * minIntervalMillis ago, or read at a time the clock has since gone back
 * before. The server moves the running figures about once an hour, so a fast
 * auto refresh needn't read them each time.
 */
export const accountEpochsRefreshDue = (
	lastReadMillis: number | null,
	nowMillis: number,
	minIntervalMillis: number,
): boolean =>
	lastReadMillis === null ||
	nowMillis < lastReadMillis ||
	minIntervalMillis <= nowMillis - lastReadMillis;
