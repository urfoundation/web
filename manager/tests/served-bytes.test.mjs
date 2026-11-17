// The Data Stats tab and the data a network served (urfoundation/web#88).
//
// Since the USDC close-out, GET /transfer/stats reports unpaid_bytes_provided as
// 0 for every network (urnetwork/server#451), and its replacement is GET
// /account/epochs: the bytes served behind each finalized epoch's points, and
// running figures for the open epoch and the open weekly operator block. The
// manager read only /transfer/stats, so a provider saw no figure for the data
// their network served after the cutoff. Now api.ts reads /account/epochs
// (fetchAccountEpochs), src/services/servedBytes.ts turns its answer into the
// rows the tab shows, and WalletStatsSection shows them.
//
// An epoch counts the operator blocks that end in its window, so the open
// block's bytes are already in the open epoch's figure when the block counts in
// that epoch: the rows never add the block to an epoch.
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
	accountEpochsRefreshDue,
	servedEpochRows,
	servedThisBlock,
} from "../src/services/servedBytes.ts";

const require = createRequire(import.meta.url);

// synthetic windows: epoch n runs from day 7n to day 7(n+1) after a fixed origin
const dayMillis = 24 * 60 * 60 * 1000;
const origin = Date.UTC(2030, 0, 6);
const windowOf = (epoch) => ({
	start_millis: origin + epoch * 7 * dayMillis,
	end_millis: origin + (epoch + 1) * 7 * dayMillis,
});

const finalized = (epoch, served_byte_count, points = 0) => ({
	epoch,
	...windowOf(epoch),
	points,
	share_bps: 0,
	served_byte_count,
});

const answer = (fields) => ({ epochs: [], ...fields });

test("the open epoch comes first, then the finalized epochs newest first, each with its own bytes", () => {
	const rows = servedEpochRows(
		answer({
			// out of order on purpose: the rows sort newest first
			epochs: [finalized(1, 2_000_000, 10.5), finalized(2, 7_000_000, 31.25), finalized(0, 0, 0)],
			current_epoch: { epoch: 3, ...windowOf(3), served_byte_count: 5_000_000, as_of_millis: origin + 22 * dayMillis },
			current_block: {
				block_number: 9,
				start_millis: origin + 21 * dayMillis,
				end_millis: origin + 28 * dayMillis,
				served_byte_count: 4_000_000,
				as_of_millis: origin + 22 * dayMillis,
				epoch: 3,
			},
		}),
	);
	assert.deepEqual(
		rows.map((row) => [row.epoch, row.open, row.servedBytes, row.points]),
		[
			[3, true, 5_000_000, undefined],
			[2, false, 7_000_000, 31.25],
			[1, false, 2_000_000, 10.5],
			[0, false, 0, 0],
		],
	);
	assert.equal(rows[0].asOfMillis, origin + 22 * dayMillis);
	assert.equal(rows[0].endMillis, windowOf(3).end_millis);
});

test("the open block's bytes are never added to an epoch", () => {
	const inOpenEpoch = answer({
		epochs: [finalized(4, 1_000)],
		current_epoch: { epoch: 5, ...windowOf(5), served_byte_count: 300, as_of_millis: origin },
		current_block: { block_number: 11, ...windowOf(5), served_byte_count: 200, as_of_millis: origin, epoch: 5 },
	});
	assert.equal(servedEpochRows(inOpenEpoch)[0].servedBytes, 300);
	assert.deepEqual(servedThisBlock(inOpenEpoch), {
		blockNumber: 11,
		startMillis: windowOf(5).start_millis,
		endMillis: windowOf(5).end_millis,
		servedBytes: 200,
		asOfMillis: origin,
		epoch: 5,
		inOpenEpoch: true,
	});

	// a block that ends after the open epoch's window counts toward the next one
	const laterEpoch = answer({
		current_epoch: { epoch: 5, ...windowOf(5), served_byte_count: 300, as_of_millis: origin },
		current_block: { block_number: 12, ...windowOf(6), served_byte_count: 900, as_of_millis: origin, epoch: 6 },
	});
	assert.deepEqual(
		servedEpochRows(laterEpoch).map((row) => [row.epoch, row.servedBytes]),
		[[5, 300]],
	);
	const block = servedThisBlock(laterEpoch);
	assert.equal(block.inOpenEpoch, false);
	assert.equal(block.epoch, 6);
	assert.equal(block.servedBytes, 900);
});

test("an answer read while the open epoch finalized shows the finalized row only", () => {
	const rows = servedEpochRows(
		answer({
			epochs: [finalized(6, 8_000, 2)],
			current_epoch: { epoch: 6, ...windowOf(6), served_byte_count: 7_500, as_of_millis: origin },
		}),
	);
	assert.deepEqual(
		rows.map((row) => [row.epoch, row.open, row.servedBytes]),
		[[6, false, 8_000]],
	);
});

test("malformed entries drop out, and a missing byte count reads 0", () => {
	const rows = servedEpochRows(
		answer({
			epochs: [
				null,
				7,
				{ epoch: "8", ...windowOf(8), served_byte_count: 1 },
				{ epoch: 9, start_millis: null, end_millis: 1, served_byte_count: 1 },
				// a server that predates the field: no served_byte_count
				{ epoch: 2, ...windowOf(2), points: 3 },
				{ epoch: 1, ...windowOf(1), points: "x", served_byte_count: Number.NaN },
			],
			current_epoch: { epoch: "3", ...windowOf(3), served_byte_count: 5 },
			current_block: { block_number: 4, ...windowOf(3), served_byte_count: 5 },
		}),
	);
	assert.deepEqual(
		rows.map((row) => [row.epoch, row.servedBytes, row.points]),
		[
			[2, 0, 3],
			[1, 0, 0],
		],
	);
	assert.equal(
		servedThisBlock(answer({ current_block: { block_number: 4, ...windowOf(3), served_byte_count: 5 } })),
		null,
		"a block with no epoch can't be placed",
	);
	assert.deepEqual(servedEpochRows(null), []);
	assert.deepEqual(servedEpochRows(answer({ epochs: undefined })), []);
	assert.equal(servedThisBlock(null), null);
	assert.equal(servedThisBlock(answer({})), null);
});

test("an automatic read waits out the minimum interval; a clock gone back reads again", () => {
	const minute = 60 * 1000;
	assert.equal(accountEpochsRefreshDue(null, 1_000, minute), true);
	assert.equal(accountEpochsRefreshDue(1_000, 1_000, minute), false);
	assert.equal(accountEpochsRefreshDue(1_000, 1_000 + minute - 1, minute), false);
	assert.equal(accountEpochsRefreshDue(1_000, 1_000 + minute, minute), true);
	assert.equal(accountEpochsRefreshDue(1_000 + minute, 1_000, minute), true);
});

/** api.ts compiled for node, run against a fake fetch (it is Vite code: import.meta.env) */
function loadApi(responses) {
	const ts = require("typescript");
	const raw = fs.readFileSync(new URL("../src/services/api.ts", import.meta.url), "utf8");
	assert.ok(raw.includes("import.meta.env.VITE_API_BASE"));
	const source = raw.replace("import.meta.env.VITE_API_BASE", "undefined");
	const { outputText } = ts.transpileModule(source, {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
	});
	const requests = [];
	const fakeFetch = async (url, init) => {
		requests.push({ url, init });
		const next = responses.shift();
		if (next instanceof Error) throw next;
		const body = typeof next.body === "string" ? next.body : JSON.stringify(next.body);
		return {
			ok: 200 <= next.status && next.status < 300,
			status: next.status,
			headers: { get: (name) => (name.toLowerCase() === "content-type" ? (next.type ?? "application/json") : null) },
			text: async () => body,
		};
	};
	const fakeStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
	const quietConsole = { log: () => {}, warn: () => {}, error: () => {}, info: () => {} };
	const module = { exports: {} };
	new Function("require", "module", "exports", "fetch", "localStorage", "console", outputText)(
		(name) => {
			throw new Error(`unexpected import ${name}`);
		},
		module,
		module.exports,
		fakeFetch,
		fakeStorage,
		quietConsole,
	);
	return { api: module.exports, requests };
}

test("fetchAccountEpochs reads GET /account/epochs with the network's token", async () => {
	const body = {
		epochs: [finalized(2, 7_000_000, 31.25)],
		current_epoch: { epoch: 3, ...windowOf(3), served_byte_count: 5_000_000, as_of_millis: origin },
		current_block: { block_number: 9, ...windowOf(3), served_byte_count: 4_000_000, as_of_millis: origin, epoch: 3 },
	};
	const { api, requests } = loadApi([{ status: 200, body }]);
	assert.equal(typeof api.fetchAccountEpochs, "function");
	assert.deepEqual(await api.fetchAccountEpochs("synthetic-token"), { ...body, error: undefined });
	assert.equal(requests.length, 1);
	assert.equal(requests[0].url, "https://api.bringyour.com/account/epochs");
	assert.equal(requests[0].init.method, "GET");
	assert.equal(requests[0].init.headers.Authorization, "Bearer synthetic-token");
});

test("fetchAccountEpochs answers an empty list with the error when the read fails", async () => {
	{
		const { api } = loadApi([{ status: 503, body: "busy", type: "text/plain" }]);
		assert.deepEqual(await api.fetchAccountEpochs("t"), {
			epochs: [],
			error: { message: "HTTP error! status: 503" },
		});
	}
	{
		const { api } = loadApi([new Error("offline")]);
		assert.deepEqual(await api.fetchAccountEpochs("t"), { epochs: [], error: { message: "offline" } });
	}
	{
		// the shape is checked: a non-list and non-objects read as absent
		const { api } = loadApi([{ status: 200, body: { epochs: {}, current_epoch: [], current_block: 5 } }]);
		assert.deepEqual(await api.fetchAccountEpochs("t"), {
			epochs: [],
			current_epoch: undefined,
			current_block: undefined,
			error: undefined,
		});
	}
	{
		const { api } = loadApi([{ status: 200, body: { epochs: [], error: { message: "not allowed" } } }]);
		assert.deepEqual((await api.fetchAccountEpochs("t")).error, { message: "not allowed" });
	}
});

test("the data tab reads /account/epochs and shows the data served by epoch", () => {
	const source = fs.readFileSync(new URL("../src/components/WalletStatsSection.tsx", import.meta.url), "utf8");
	assert.match(source, /fetchAccountEpochs\(token\)/);
	assert.match(source, /servedEpochRows\(accountEpochs\)/);
	assert.match(source, /servedThisBlock\(accountEpochs\)/);
	assert.match(source, /Data Served, by Epoch/);
	// the past USDC history stays, and still no unpaid data
	assert.match(source, /Data Paid in USDC/);
	assert.doesNotMatch(source, /Unpaid|unpaid_mb|Total Data/);
	// an automatic read is rate-limited; Refresh forces one
	assert.match(source, /accountEpochsRefreshDue\(/);
	assert.match(source, /loadAccountEpochs\(true\)/);
});

test("the files of this change have no TypeScript diagnostics", () => {
	// vite build doesn't type-check, and nothing here renders the tab
	const ts = require("typescript");
	const managerRoot = fileURLToPath(new URL("../", import.meta.url));
	const read = ts.readConfigFile(path.join(managerRoot, "tsconfig.app.json"), ts.sys.readFile);
	assert.equal(read.error, undefined);
	const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, managerRoot);
	const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options });
	const normal = (file) => path.resolve(file).replace(/\\/g, "/").toLowerCase();
	const checked = new Set(
		[
			"src/services/servedBytes.ts",
			"src/services/api.ts",
			"src/services/types.ts",
			"src/components/WalletStatsSection.tsx",
		].map((file) => normal(path.join(managerRoot, file))),
	);
	const inProgram = new Set(program.getSourceFiles().map((f) => normal(f.fileName)));
	for (const file of checked) {
		assert.ok(inProgram.has(file), `${file} is part of the program`);
	}
	const problems = ts
		.getPreEmitDiagnostics(program)
		.filter((d) => d.file && checked.has(normal(d.file.fileName)))
		.map((d) => `${path.relative(managerRoot, d.file.fileName)}: TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`);
	assert.deepEqual(problems, []);
});
