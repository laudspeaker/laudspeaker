import { sleep, fail } from "k6";
import { uuidv4 } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";
import http from "k6/http";
import { Httpx } from "https://jslib.k6.io/httpx/0.1.0/index.js";
import { Counter } from "k6/metrics";
import { createAccount } from "./utils/accounts.js";
import { Reporter, HttpxWrapper, failOnError } from "./utils/common.js";

export const options = {
  vus: 1000,
  duration: "1h",
  // scenarios: {
  //   upload_and_send: {
  //     executor: "per-vu-iterations",
  //     vus: 1,
  //     iterations: 1,
  //     maxDuration: "2h",
  //   },
  // },
};

const accountsCreated = new Counter("accounts_created");

const NUM_ACCOUNTS = __ENV.NUM_ACCOUNTS || fail("NUM_ACCOUNTS required");
let BASE_URL = __ENV.BASE_URL || fail("BASE_URL required");
if (BASE_URL.at(-1) === "/") {
  BASE_URL = BASE_URL.substring(0, BASE_URL.length - 1);
}

const session = new Httpx({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 300000, // 5 minute timeout.
});

export default function main() {
  let response;
  let httpxWrapper = new HttpxWrapper(session);

  let reporter = new Reporter("SETUP");
  reporter.addTimer("totalElapsed", "Total elapsed time of k6 test");

  for(let i = 1; i <= NUM_ACCOUNTS; i++) {

    let email_address = `perf${String(Math.random()).substring(2)}@test.com`;
    reporter.report(
      `Creating account and organization for ${email_address}`
    );

    // CREATE ACCOUNT and set Auth header
    let { authorization, email, password } = createAccount(email_address, httpxWrapper, `${BASE_URL}`);

    reporter.report(
      `Account created for ${email_address}`
    );
    accountsCreated.add(1);
    reporter.removeTimer("createAccount");
  }

  reporter.report(`Test successfully finished.`);
}

export function handleSummary(data) {
  const created = data.metrics["accounts_created"]
    ? data.metrics["accounts_created"].values.count
    : undefined;

  let summary = "SUMMARY:\n\n\n";
  summary += `Accounts created: ${created}\n`;

  return {
    stdout: summary,
  };
}
