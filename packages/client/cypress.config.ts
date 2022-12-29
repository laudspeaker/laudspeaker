const { defineConfig } = require("cypress");
const dotenv = require("dotenv");

dotenv.config();

module.exports = defineConfig({
  e2e: {
    retries: {
      runMode: 2,
    },
    screenshotOnRunFailure: false,
    baseUrl: process.env.TESTS_BASE_URL || "http://project_frontend_1:3000",
  },
  env: {
    TESTS_POSTHOG_PROJECT_ID: process.env.TESTS_POSTHOG_PROJECT_ID,
    TESTS_POSTHOG_API_KEY: process.env.TESTS_POSTHOG_API_KEY,
    TESTS_POSTHOG_HOST_URL: process.env.TESTS_POSTHOG_HOST_URL,
    TESTS_MAILGUN_API_KEY: process.env.TESTS_MAILGUN_API_KEY,
    TESTS_SENDGRID_API_KEY: process.env.TESTS_SENDGRID_API_KEY,
    TESTS_SENDGRID_FROM_EMAIL: process.env.TESTS_SENDGRID_FROM_EMAIL,
    TESTS_BASE_URL: process.env.TESTS_BASE_URL,
    TESTS_API_BASE_URL:
      process.env.TESTS_API_BASE_URL || "http://laudspeaker_backend_1:3001",
    TESTS_SMS_TO: process.env.TESTS_SMS_TO,
  },
  port: 5111,
});
