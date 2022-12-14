import { defineConfig } from "cypress";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
  },
  env: {
    TESTS_POSTHOG_PROJECT_ID: process.env.TESTS_POSTHOG_PROJECT_ID,
    TESTS_POSTHOG_API_KEY: process.env.TESTS_POSTHOG_API_KEY,
    TESTS_POSTHOG_HOST_URL: process.env.TESTS_POSTHOG_HOST_URL,
    TESTS_MAILGUN_API_KEY: process.env.TESTS_MAILGUN_API_KEY,
    TESTS_SENDGRID_API_KEY: process.env.TESTS_SENDGRID_API_KEY,
    TESTS_SENDGRID_FROM_EMAIL: process.env.TESTS_SENDGRID_FROM_EMAIL,
  },
  port: 5111,
});
