// The Account Settings "Open Subscription Portal" button.
//
// It linked every account to the billing portal's email sign-in page
// (pay.ur.io/p/login/...). That page answers "a link was sent" for any address
// and mails the link only to an address that is already a customer of the
// portal, so an account that never bought through Stripe, or one that bought
// with another address, waits for an email that never comes. The server
// already makes a portal session for the signed-in network's own Stripe
// customer (POST /stripe/customer-portal, the way ur.io and the apps open it)
// and says when the network has none (`no_customer`). The button now asks for
// that session on each press and opens it, and says so when there is no
// Stripe subscription to manage.
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
	SUBSCRIPTION_PORTAL_FAILED_MESSAGE,
	SUBSCRIPTION_PORTAL_NO_CUSTOMER_MESSAGE,
	subscriptionPortalOutcome,
} from "../src/services/subscriptionPortal.ts";

const require = createRequire(import.meta.url);

// a made-up session link; the server makes the real one per press
const sessionUrl = "https://billing.example.test/p/session/test_synthetic";

test("the subscription button asks for the network's own portal session, not the portal's email sign-in page", () => {
	const source = fs.readFileSync(new URL("../src/components/AccountSettingsSection.tsx", import.meta.url), "utf8");
	// the sign-in page mails a link only to an address that is already a customer
	assert.doesNotMatch(source, /\/p\/login\//);
	assert.doesNotMatch(source, /pay\.ur\.io/);
	// a session is made on each press (it expires minutes after it is made)
	assert.match(source, /createCustomerPortal\(token\)/);
	assert.match(source, /subscriptionPortalOutcome\(/);
	assert.match(source, /Open Subscription Portal/);
});

test("a session link opens; no Stripe customer and failures say why instead", () => {
	assert.deepEqual(subscriptionPortalOutcome({ url: sessionUrl }), { kind: "open", url: sessionUrl });

	const noCustomer = subscriptionPortalOutcome({ error: { code: "no_customer", message: "No stripe customer found" } });
	assert.equal(noCustomer.kind, "no_customer");
	assert.equal(noCustomer.message, SUBSCRIPTION_PORTAL_NO_CUSTOMER_MESSAGE);
	assert.match(noCustomer.message, /no Stripe subscription/);
	assert.match(noCustomer.message, /App Store or Google Play/);

	// the server's own words for any other refusal
	assert.deepEqual(
		subscriptionPortalOutcome({ error: { code: "store_unavailable", message: "Could not open the billing portal. Please try again." } }),
		{ kind: "error", message: "Could not open the billing portal. Please try again." },
	);
	assert.deepEqual(subscriptionPortalOutcome({ error: { message: "HTTP error! status: 503" } }), {
		kind: "error",
		message: "HTTP error! status: 503",
	});

	// nothing to open: no answer, no link, or a link that isn't https
	for (const answer of [null, undefined, {}, { url: "" }, { url: "http://billing.example.test/p/session/x" }, { url: "javascript:alert(1)" }, { url: "not a url" }]) {
		assert.deepEqual(subscriptionPortalOutcome(answer), { kind: "error", message: SUBSCRIPTION_PORTAL_FAILED_MESSAGE }, JSON.stringify(answer));
	}
	// an error without a message still says something
	assert.deepEqual(subscriptionPortalOutcome({ error: { code: "store_unavailable", message: "" } }), {
		kind: "error",
		message: SUBSCRIPTION_PORTAL_FAILED_MESSAGE,
	});
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
	const logged = [];
	const fakeFetch = async (url, init) => {
		requests.push({ url, init });
		const next = responses.shift();
		if (next instanceof Error) throw next;
		const body = typeof next.body === "string" ? next.body : JSON.stringify(next.body);
		return {
			ok: 200 <= next.status && next.status < 300,
			status: next.status,
			statusText: "",
			headers: { get: (name) => (name.toLowerCase() === "content-type" ? (next.type ?? "application/json") : null) },
			text: async () => body,
		};
	};
	const fakeStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
	const record = (...args) => logged.push(args.map(String).join(" "));
	const recordingConsole = { log: record, warn: record, error: record, info: record };
	const module = { exports: {} };
	new Function("require", "module", "exports", "fetch", "localStorage", "console", outputText)(
		(name) => {
			throw new Error(`unexpected import ${name}`);
		},
		module,
		module.exports,
		fakeFetch,
		fakeStorage,
		recordingConsole,
	);
	return { api: module.exports, requests, logged };
}

test("createCustomerPortal posts to /stripe/customer-portal with the network's token", async () => {
	const { api, requests, logged } = loadApi([{ status: 200, body: { url: sessionUrl } }]);
	assert.equal(typeof api.createCustomerPortal, "function");
	assert.deepEqual(await api.createCustomerPortal("synthetic-token"), { url: sessionUrl, error: undefined });
	assert.equal(requests.length, 1);
	assert.equal(requests[0].url, "https://api.bringyour.com/stripe/customer-portal");
	assert.equal(requests[0].init.method, "POST");
	assert.equal(requests[0].init.headers.Authorization, "Bearer synthetic-token");
	assert.deepEqual(JSON.parse(requests[0].init.body), {});
	// the session link signs the customer in: it never reaches a log line
	assert.ok(!logged.some((line) => line.includes("test_synthetic")), logged.join("\n"));
});

test("createCustomerPortal returns the server's refusal and reports failures without the answer", async () => {
	{
		const { api } = loadApi([{ status: 200, body: { error: { code: "no_customer", message: "No stripe customer found" } } }]);
		assert.deepEqual(await api.createCustomerPortal("t"), {
			url: undefined,
			error: { code: "no_customer", message: "No stripe customer found" },
		});
	}
	{
		const { api } = loadApi([{ status: 503, body: "busy", type: "text/plain" }]);
		assert.deepEqual(await api.createCustomerPortal("t"), { error: { message: "HTTP error! status: 503" } });
	}
	{
		const { api } = loadApi([new Error("offline")]);
		assert.deepEqual(await api.createCustomerPortal("t"), { error: { message: "offline" } });
	}
	{
		// an answer that is not JSON is a failure whose message quotes none of it
		const { api, logged } = loadApi([{ status: 200, body: `{"url":"${sessionUrl}"`, type: "text/plain" }]);
		const answer = await api.createCustomerPortal("t");
		assert.equal(answer.url, undefined);
		assert.equal(typeof answer.error?.message, "string");
		assert.ok(!answer.error.message.includes("test_synthetic"));
		assert.ok(!logged.some((line) => line.includes("test_synthetic")), logged.join("\n"));
	}
	{
		// a non-string url reads as absent
		const { api } = loadApi([{ status: 200, body: { url: 5 } }]);
		assert.deepEqual(await api.createCustomerPortal("t"), { url: undefined, error: undefined });
	}
});

test("the files of this change have no TypeScript diagnostics", () => {
	// vite build doesn't type-check, and nothing here renders the section
	const ts = require("typescript");
	const managerRoot = fileURLToPath(new URL("../", import.meta.url));
	const read = ts.readConfigFile(path.join(managerRoot, "tsconfig.app.json"), ts.sys.readFile);
	assert.equal(read.error, undefined);
	const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, managerRoot);
	const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options });
	const normal = (file) => path.resolve(file).replace(/\\/g, "/").toLowerCase();
	const checked = new Set(
		[
			"src/services/subscriptionPortal.ts",
			"src/services/api.ts",
			"src/services/types.ts",
			"src/components/AccountSettingsSection.tsx",
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
