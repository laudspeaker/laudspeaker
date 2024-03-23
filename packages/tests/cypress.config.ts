import { defineConfig } from "cypress";
import dotenv from "dotenv";

dotenv.config();

module.exports = defineConfig({
  e2e: {
    retries: {
      runMode: 2,
    },
    screenshotOnRunFailure: false,
    baseUrl: process.env.TESTS_BASE_URL || "http://localhost:3000",
    defaultCommandTimeout: 20000,
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
      process.env.TESTS_API_BASE_URL || "http://localhost:3001",
    TESTS_SMS_TO: process.env.TESTS_SMS_TO,
    TESTS_SMS_SID: process.env.TESTS_SMS_SID,
    TESTS_SMS_AUTH_TOKEN: process.env.TESTS_SMS_AUTH_TOKEN,
    TESTS_SMS_FROM: process.env.TESTS_SMS_FROM,
    TESTS_DATABRICKS_HOST: process.env.TESTS_DATABRICKS_HOST,
    TESTS_DATABRICKS_PATH: process.env.TESTS_DATABRICKS_PATH,
    TESTS_DATABRICKS_TOKEN: process.env.TESTS_DATABRICKS_TOKEN,
    TESTS_POSTGRESQL_HOST: process.env.TESTS_POSTGRESQL_HOST,
    TESTS_POSTGRESQL_PORT: process.env.TESTS_POSTGRESQL_PORT,
    TESTS_POSTGRESQL_USERNAME: process.env.TESTS_POSTGRESQL_USERNAME,
    TESTS_POSTGRESQL_PASSWORD: process.env.TESTS_POSTGRESQL_PASSWORD,
    TESTS_POSTGRESQL_DATABASE: process.env.TESTS_POSTGRESQL_DATABASE,
    TESTS_MYSQL_URL: process.env.TESTS_MYSQL_URL,
    TESTS_MYSQL_QUERY: process.env.TESTS_MYSQL_QUERY,
  },
  port: 5111,
});
