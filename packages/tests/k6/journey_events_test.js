import { sleep, fail } from "k6";
import { uuidv4 } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";
import http from "k6/http";
import { Httpx } from "https://jslib.k6.io/httpx/0.1.0/index.js";
import { Counter } from "k6/metrics";
import { createAccount } from "./utils/accounts.js";
import { Reporter, HttpxWrapper, failOnError } from "./utils/common.js";

export const options = {
  scenarios: {
    account_and_upload: {
      executor: "per-vu-iterations",
      vus: 1,
      iterations: 1,
      maxDuration: "2h",
    },
  },
};

const customersImported = new Counter("customers_imported");
const customersImportedTime = new Counter("customers_imported_time");
const customersMessaged = new Counter("customers_messaged");
const customersMessagedTime = new Counter("customers_messaged_time");

// Test config
const EMAIL =
  __ENV.EMAIL || `perf${String(Math.random()).substring(2, 7)}@test.com`;
const UPLOAD_FILE = open(__ENV.CSV_FILEPATH, "b");
const POLLING_MINUTES = parseFloat(__ENV.POLLING_MINUTES) || 1;
const PRIMARY_KEY_HEADER = "user_id";
const NUM_CUSTOMERS = __ENV.NUM_CUSTOMERS || fail("NUM_CUSTOMERS required");
let BASE_URL = __ENV.BASE_URL || fail("BASE_URL required");
if (BASE_URL.at(-1) === "/") {
  BASE_URL = BASE_URL.substring(0, BASE_URL.length - 1);
}

const session = new Httpx({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // 60s timeout.
});

export default function main() {
  let response;
  let UPLOADED_FILE_KEY;
  let httpxWrapper = new HttpxWrapper(session);

  let reporter = new Reporter("SETUP");
  reporter.addTimer("totalElapsed", "Total elapsed time of k6 test");
  reporter.report(
    `Started script with email: ${EMAIL} and file ${__ENV.CSV_FILEPATH}. Testing ${NUM_CUSTOMERS} customers.`
  );

  reporter.setStep("CREATE_ACCOUNT");
  reporter.addTimer("createAccount", "Elapsed time of create account");
  reporter.log(`Creating account and organization`);

  // CREATE ACCOUNT and set Auth header
  let { authorization, email, password, apiKey } = createAccount(
    EMAIL,
    httpxWrapper
  );
  console.log(authorization, email, password, apiKey);

  reporter.report(`Finished creating account and organization.`);
  reporter.log(`Email: ${email}`);
  reporter.log(`Authorization header: ${authorization}`);
  reporter.removeTimer("createAccount");

  reporter.setStep("CUSTOMER_IMPORT");
  reporter.report(`Starting customer import`);
  reporter.addTimer("customerImport", "Total elapsed time of customer import");
  reporter.addTimer("csvUpload", "Total elapsed time of csv upload");

  // NOT USING httpx because file uploads not working
  response = http.post(
    `${BASE_URL}/api/customers/uploadCSV`,
    { file: http.file(UPLOAD_FILE, "upload.csv", "text/csv") },
    {
      timeout: "600s",
      headers: {
        authorization,
      },
    }
  );

  failOnError(response);

  response = httpxWrapper.getOrFail("/api/customers/getLastImportCSV");

  UPLOADED_FILE_KEY = response.json("fileKey");
  reporter.report(`CSV upload finished with fileKey: ${UPLOADED_FILE_KEY}`);
  reporter.removeTimer("csvUpload");

  reporter.log(`Creating customer attributes`);
  response = httpxWrapper.postOrFail(
    "/api/customers/attributes/create",
    `{"name":"${PRIMARY_KEY_HEADER}","type":"String"}`
  );

  // // TODO fix this endpoint and then use this as the num expected customers
  // response = httpxWrapper.postOrFail(
  //   "/api/customers/attributes/count-import-preview",
  //   `{ "mapping": { "${PRIMARY_KEY_HEADER}": { "head": "${PRIMARY_KEY_HEADER}", "asAttribute": { "key": "${PRIMARY_KEY_HEADER}", "type": "String", "skip": false }, "isPrimary": true, "doNotOverwrite": true } }, "importOption": "NEW", "fileKey": "${UPLOADED_FILE_KEY}" }`,
  // );

  reporter.log(`New customers: ${NUM_CUSTOMERS}`);

  reporter.report(`Starting import for fileKey: ${UPLOADED_FILE_KEY}`);
  reporter.addTimer(
    "startImport",
    "Time elapsed of import process (not including csv upload)"
  );
  response = httpxWrapper.postOrFail(
    "/api/customers/attributes/start-import",
    `{"mapping":{"dsr":{"head":"dsr","isPrimary":false,"doNotOverwrite":false},"is_apt":{"head":"is_apt","isPrimary":false,"doNotOverwrite":false},"source":{"head":"source","isPrimary":false,"doNotOverwrite":false},"user_id":{"head":"user_id","asAttribute":{"key":"user_id","type":"String","skip":false},"isPrimary":true,"doNotOverwrite":true},"is_delete":{"head":"is_delete","isPrimary":false,"doNotOverwrite":false},"mkt_agree":{"head":"mkt_agree","isPrimary":false,"doNotOverwrite":false},"dsr_source":{"head":"dsr_source","isPrimary":false,"doNotOverwrite":false},"is_own_car":{"head":"is_own_car","isPrimary":false,"doNotOverwrite":false},"loan_count":{"head":"loan_count","isPrimary":false,"doNotOverwrite":false},"income_type":{"head":"income_type","isPrimary":false,"doNotOverwrite":false},"is_kcb_link":{"head":"is_kcb_link","isPrimary":false,"doNotOverwrite":false},"company_name":{"head":"company_name","isPrimary":false,"doNotOverwrite":false},"credit_score":{"head":"credit_score","isPrimary":false,"doNotOverwrite":false},"is_d7_review":{"head":"is_d7_review","isPrimary":false,"doNotOverwrite":false},"is_donotcall":{"head":"is_donotcall","isPrimary":false,"doNotOverwrite":false},"add_org_agree":{"head":"add_org_agree","isPrimary":false,"doNotOverwrite":false},"bill_org_name":{"head":"bill_org_name","isPrimary":false,"doNotOverwrite":false},"houseown_type":{"head":"houseown_type","isPrimary":false,"doNotOverwrite":false},"is_ln_bal_chg":{"head":"is_ln_bal_chg","isPrimary":false,"doNotOverwrite":false},"ovd_prv_agree":{"head":"ovd_prv_agree","isPrimary":false,"doNotOverwrite":false},"revolving_amt":{"head":"revolving_amt","isPrimary":false,"doNotOverwrite":false},"var_loan_rate":{"head":"var_loan_rate","isPrimary":false,"doNotOverwrite":false},"card_bill_date":{"head":"card_bill_date","isPrimary":false,"doNotOverwrite":false},"is_ln_acct_cls":{"head":"is_ln_acct_cls","isPrimary":false,"doNotOverwrite":false},"is_ln_acct_opn":{"head":"is_ln_acct_opn","isPrimary":false,"doNotOverwrite":false},"is_mydata_link":{"head":"is_mydata_link","isPrimary":false,"doNotOverwrite":false},"recent_1m_appl":{"head":"recent_1m_appl","isPrimary":false,"doNotOverwrite":false},"recent_3m_appl":{"head":"recent_3m_appl","isPrimary":false,"doNotOverwrite":false},"recent_7d_appl":{"head":"recent_7d_appl","isPrimary":false,"doNotOverwrite":false},"is_crd_card_cxl":{"head":"is_crd_card_cxl","isPrimary":false,"doNotOverwrite":false},"is_crd_card_del":{"head":"is_crd_card_del","isPrimary":false,"doNotOverwrite":false},"is_crd_card_reg":{"head":"is_crd_card_reg","isPrimary":false,"doNotOverwrite":false},"kcb_change_date":{"head":"kcb_change_date","isPrimary":false,"doNotOverwrite":false},"overdue_bal_amt":{"head":"overdue_bal_amt","isPrimary":false,"doNotOverwrite":false},"recent_exp_date":{"head":"recent_exp_date","isPrimary":false,"doNotOverwrite":false},"recent_kcb_date":{"head":"recent_kcb_date","isPrimary":false,"doNotOverwrite":false},"is_repay_account":{"head":"is_repay_account","isPrimary":false,"doNotOverwrite":false},"my_ln_info_agree":{"head":"my_ln_info_agree","isPrimary":false,"doNotOverwrite":false},"recent_appl_date":{"head":"recent_appl_date","isPrimary":false,"doNotOverwrite":false},"recent_repay_amt":{"head":"recent_repay_amt","isPrimary":false,"doNotOverwrite":false},"credit_score_date":{"head":"credit_score_date","isPrimary":false,"doNotOverwrite":false},"is_ln_overdue_cls":{"head":"is_ln_overdue_cls","isPrimary":false,"doNotOverwrite":false},"is_ln_overdue_del":{"head":"is_ln_overdue_del","isPrimary":false,"doNotOverwrite":false},"is_ln_overdue_reg":{"head":"is_ln_overdue_reg","isPrimary":false,"doNotOverwrite":false},"is_nextweek_repay":{"head":"is_nextweek_repay","isPrimary":false,"doNotOverwrite":false},"recent_repay_date":{"head":"recent_repay_date","isPrimary":false,"doNotOverwrite":false},"is_exp_1_week_left":{"head":"is_exp_1_week_left","isPrimary":false,"doNotOverwrite":false},"is_exp_2_week_left":{"head":"is_exp_2_week_left","isPrimary":false,"doNotOverwrite":false},"recent_1m_contract":{"head":"recent_1m_contract","isPrimary":false,"doNotOverwrite":false},"recent_3m_contract":{"head":"recent_3m_contract","isPrimary":false,"doNotOverwrite":false},"recent_7d_contract":{"head":"recent_7d_contract","isPrimary":false,"doNotOverwrite":false},"recent_mydata_date":{"head":"recent_mydata_date","isPrimary":false,"doNotOverwrite":false},"recent_repay_count":{"head":"recent_repay_count","isPrimary":false,"doNotOverwrite":false},"recent_review_date":{"head":"recent_review_date","isPrimary":false,"doNotOverwrite":false},"company_enter_month":{"head":"company_enter_month","isPrimary":false,"doNotOverwrite":false},"is_card_overdue_cls":{"head":"is_card_overdue_cls","isPrimary":false,"doNotOverwrite":false},"is_card_overdue_del":{"head":"is_card_overdue_del","isPrimary":false,"doNotOverwrite":false},"is_card_overdue_reg":{"head":"is_card_overdue_reg","isPrimary":false,"doNotOverwrite":false},"is_exp_1_month_left":{"head":"is_exp_1_month_left","isPrimary":false,"doNotOverwrite":false},"is_exp_2_month_left":{"head":"is_exp_2_month_left","isPrimary":false,"doNotOverwrite":false},"is_mydata_incomplete":{"head":"is_mydata_incomplete","isPrimary":false,"doNotOverwrite":false},"member_register_time":{"head":"member_register_time","isPrimary":false,"doNotOverwrite":false},"recent_contract_date":{"head":"recent_contract_date","isPrimary":false,"doNotOverwrite":false},"next_savings_exp_date":{"head":"next_savings_exp_date","isPrimary":false,"doNotOverwrite":false},"nextweek_repay_amount":{"head":"nextweek_repay_amount","isPrimary":false,"doNotOverwrite":false},"prev_savings_exp_date":{"head":"prev_savings_exp_date","isPrimary":false,"doNotOverwrite":false},"is_kcb_more_than_mydata":{"head":"is_kcb_more_than_mydata","isPrimary":false,"doNotOverwrite":false},"mydata_consent_end_date":{"head":"mydata_consent_end_date","isPrimary":false,"doNotOverwrite":false},"int_rate_increase_org_name":{"head":"int_rate_increase_org_name","isPrimary":false,"doNotOverwrite":false},"recent_refinance_appl_date":{"head":"recent_refinance_appl_date","isPrimary":false,"doNotOverwrite":false},"count_refinancing_condition":{"head":"count_refinancing_condition","isPrimary":false,"doNotOverwrite":false},"int_rate_increase_prod_name":{"head":"int_rate_increase_prod_name","isPrimary":false,"doNotOverwrite":false},"yesterday_diff_credit_score":{"head":"yesterday_diff_credit_score","isPrimary":false,"doNotOverwrite":false},"is_direct_refinancing_target":{"head":"is_direct_refinancing_target","isPrimary":false,"doNotOverwrite":false},"recent_refinance_contract_date":{"head":"recent_refinance_contract_date","isPrimary":false,"doNotOverwrite":false},"count_direct_refinancing_condition":{"head":"count_direct_refinancing_condition","isPrimary":false,"doNotOverwrite":false},"recent_direct_refinance_contract_date":{"head":"recent_direct_refinance_contract_date","isPrimary":false,"doNotOverwrite":false},"is_direct_refinancing_contract_before_15days":{"head":"is_direct_refinancing_contract_before_15days","isPrimary":false,"doNotOverwrite":false},"is_direct_refinancing_contract_before_6months":{"head":"is_direct_refinancing_contract_before_6months","isPrimary":false,"doNotOverwrite":false},"is_direct_refinancing_repayday_account_yesterday":{"head":"is_direct_refinancing_repayday_account_yesterday","isPrimary":false,"doNotOverwrite":false}},"importOption":"NEW","fileKey":"${UPLOADED_FILE_KEY}"}`
  );

  // Verify upload finished
  let numPages = 0;
  let expectedPages = Math.floor(NUM_CUSTOMERS / 10);
  let prevNumPages = 0;
  let pageRetries = 0;

  while (numPages < expectedPages) {
    sleep(POLLING_MINUTES * 60);
    response = httpxWrapper.getOrFail(
      "/api/customers?take=10&skip=0&searchKey=&searchValue=&orderBy=createdAt&orderType=desc"
    );
    numPages = parseInt(response.json("totalPages"));

    let deltaPages = numPages - prevNumPages;
    customersImported.add(deltaPages * 10);
    customersImportedTime.add(POLLING_MINUTES * 60);

    if (prevNumPages === numPages) {
      reporter.log(
        `Customer page count hasn't increased since last poll. Current pages: ${numPages}. number of retries: ${pageRetries}`
      );
      if (pageRetries > 5) {
        reporter.report(
          `Sent count hasn't increased in 5 retries. Failing test...`
        );
        fail(
          `Import customers has failed after ${numPages} imported, but ${expectedPages} pages expected.`
        );
      }
      pageRetries = pageRetries + 1;
    } else {
      pageRetries = 0;
    }
    reporter.report(
      `Checking status of customer import. ${numPages} pages imported. ${expectedPages} pages expected.`
    );
    if (numPages < expectedPages) sleep(30);
  }
  reporter.report(
    `Customer import process completed. ${numPages} customer pages loaded.`
  );
  reporter.removeTimer("startImport");
  reporter.removeTimer("customerImport");

  // STEP 3 CREATE JOURNEY

  reporter.setStep("JOURNEY_CREATION");
  reporter.log(`Starting journey creation`);
  reporter.addTimer(
    "journeyCreation",
    "Time elapsed to create a simple journey"
  );
  reporter.log(`Posting new journey`);
  response = httpxWrapper.postOrFail("/api/journeys", '{"name":"test"}');
  let visualLayout = response.json("visualLayout");
  const JOURNEY_ID = response.json("id");

  reporter.log(`Journey created with id: ${JOURNEY_ID}`);

  response = httpxWrapper.postOrFail(
    "/api/steps",
    `{"type":"message","journeyID":"${JOURNEY_ID}"}`
  );

  const START_STEP_NODE = visualLayout.nodes[0];
  const START_STEP_EDGE = visualLayout.edges[0];
  const MESSAGE_STEP_ID = response.json("id");

  response = httpxWrapper.getOrFail("/api/templates", {});
  const TEMPLATE_ONE = response.json("data")[0];
  let messageStepNode = visualLayout.nodes[1];
  messageStepNode.type = "message";
  messageStepNode.data = {
    stepId: MESSAGE_STEP_ID,
    type: "message",
    customName: "Email 1",
    template: {
      type: "email",
      selected: { id: TEMPLATE_ONE.id, name: TEMPLATE_ONE.name },
    },
  };

  response = httpxWrapper.postOrFail(
    "/api/steps",
    `{"type":"exit","journeyID":"${JOURNEY_ID}"}`
  );

  const EXIT_STEP_ID = response.json("id");
  const EXIT_STEP_NODE_ID = uuidv4();
  const EXIT_STEP_NODE = {
    id: EXIT_STEP_NODE_ID,
    type: "exit",
    data: {
      stepId: EXIT_STEP_ID,
    },
    position: {
      x: 0,
      y: 228,
    },
    selected: false,
  };

  const EXIT_STEP_EDGE = {
    id: `${messageStepNode.id}-${EXIT_STEP_NODE_ID}`,
    type: "primary",
    source: messageStepNode.id,
    target: EXIT_STEP_NODE_ID,
  };

  let visualLayoutBody = JSON.stringify({
    id: JOURNEY_ID,
    nodes: [START_STEP_NODE, messageStepNode, EXIT_STEP_NODE],
    edges: [START_STEP_EDGE, EXIT_STEP_EDGE],
  });

  response = httpxWrapper.patchOrFail(
    "/api/journeys/visual-layout",
    visualLayoutBody
  );

  response = httpxWrapper.patchOrFail(
    "/api/journeys",
    `{"id":"${JOURNEY_ID}","name":"test","inclusionCriteria":{"type":"allCustomers"},"isDynamic":true,"journeyEntrySettings":{"entryTiming":{"type":"WhenPublished"},"enrollmentType":"CurrentAndFutureUsers"},"journeySettings":{"tags":[],"maxEntries":{"enabled":false,"limitOnEverySchedule":false,"maxEntries":"500000"},"quietHours":{"enabled":false,"startTime":"00:00","endTime":"08:00","fallbackBehavior":"NextAvailableTime"},"maxMessageSends":{"enabled":false}}}`
  );
  reporter.report(`Journey creation completed.`);
  reporter.removeTimer("journeyCreation");

  reporter.setStep("CUSTOMER_MESSAGING");
  reporter.log(`Starting journey.`);
  reporter.addTimer(
    "journeyMessaging",
    "Time elapsed since journey started triggering customer messages."
  );

  response = httpxWrapper.patchOrFail(
    `/api/journeys/start/${JOURNEY_ID}`,
    "{}"
  );
  reporter.report(`Journey started.`);

  reporter.log(`Check stats: /api/steps/stats/${MESSAGE_STEP_ID}`);

  let sentCount = 0;
  let eventsSent = 0;
  let retries = 0; // kill stat checking early if sent count not increasing
  let prevSentCount = 0;
  while (sentCount < NUM_CUSTOMERS || eventsSent < NUM_CUSTOMERS) {
    sleep(POLLING_MINUTES * 60);
    response = httpxWrapper.getOrFail(`/api/steps/stats/${MESSAGE_STEP_ID}`);
    prevSentCount = sentCount;
    sentCount = parseInt(response.json("sent"));
    reporter.report(`Current sent messages: ${sentCount} of ${NUM_CUSTOMERS}`);
    let deltaSent = sentCount - prevSentCount;
    customersMessaged.add(deltaSent);
    customersMessagedTime.add(POLLING_MINUTES * 60);
    if (eventsSent < NUM_CUSTOMERS) {
      let eventsToSend = __ENV.EVENTS_PER_ITERATION;
      if (eventsSent + eventsToSend > NUM_CUSTOMERS) {
        // This is when we don't need to send full events value because we're at the end of the customer list
        eventsToSend = NUM_CUSTOMERS - eventsSent;
      }
      reporter.report(`Triggering ${eventsToSend} events`);
      sendEvents("send", apiKey, 10000000 + sentCount, eventsToSend);
      eventsSent += eventsSent;
    }
    if (prevSentCount === sentCount) {
      reporter.log(
        `Sent count hasn't increased since last poll. Current count: ${sentCount}. number of retries: ${retries}`
      );
      if (retries > 5) {
        reporter.report(
          `Sent count hasn't increased in 5 retries. Failing test...`
        );
        fail(
          `Message customers has failed after ${sentCount} messages sent, but ${NUM_CUSTOMERS} messages expected.`
        );
      }
      retries = retries + 1;
    } else {
      retries = 0;
    }
  }
  reporter.report(`Test successfully finished.`);
  reporter.log(`Final sentCount: ${sentCount}.`);
  reporter.removeTimer("journeyMessaging");

  reporter.setStep(`CLEANUP`);
  reporter.log(`Deleting account ${email}`);
  response = httpxWrapper.deleteOrFail(
    `/api/accounts`,
    `{"password":"${password}"}`
  );
  reporter.log(`Account deleted.`);
}

export function handleSummary(data) {
  console.log(JSON.stringify(data));
  const imported = data.metrics["customers_imported"]
    ? data.metrics["customers_imported"].values.count
    : undefined;
  const importedTime = data.metrics["customers_imported_time"]
    ? data.metrics["customers_imported_time"].values.count
    : undefined; //seconds
  const messaged = data.metrics["customers_messaged"]
    ? data.metrics["customers_messaged"].values.count
    : undefined;
  const messagedTime = data.metrics["customers_messaged_time"]
    ? data.metrics["customers_messaged_time"].values.count
    : undefined; //seconds

  let summary = "SUMMARY:\n\n\n";
  summary += `Customers Imported: ${imported}\n`;
  summary += `Customers Imported Time (seconds): ${importedTime} seconds\n`;
  summary += `Customers Messaged: ${messaged}\n`;
  summary += `Customers Messaged Time (seconds): ${messagedTime} seconds\n\n`;

  if (imported && importedTime) {
    summary += `Import Rate (per second): ${
      imported / importedTime
    } customers per second\n`;
    summary += `Import Rate (per minute): ${
      imported / (importedTime / 60)
    } customers per minute\n\n`;
  } else {
    summary += `Import Rate: unkown due to error\n\n`;
  }

  if (messaged && messagedTime) {
    summary += `Message Send Rate (per second): ${
      messaged / messagedTime
    } customers per second\n`;
    summary += `Message Send Rate (per minute): ${
      messaged / (messagedTime / 60)
    } customers per minute\n`;
  } else {
    summary += `Import Rate: unknown due to error\n`;
  }

  return {
    stdout: summary,
  };
}

function sendEvents(eventName, apiKey, startId, numberEvents) {
  return;
  numberEvents = 1;
  let userId = startId;
  let promises = [];
  while (userId < startId + numberEvents) {
    console.log(
      JSON.stringify({
        correlationKey: "user_id",
        correlationValue: String(userId),
        event: eventName,
        source: "custom",
      })
    );
    let asyncReq = http.asyncRequest(
      "POST",
      `${__ENV.BASE_URL}/api/events`,
      JSON.stringify({
        correlationKey: "user_id",
        correlationValue: String(userId),
        event: eventName,
        source: "custom",
      }),
      {
        headers: {
          authorization: `Api-Key ${apiKey}`,
          "content-type": "application/json",
        },
        tags: {
          laudspeaker_request: "eventPost",
        },
      }
    );
    promises.push(asyncReq);
    userId++;
  }
}
