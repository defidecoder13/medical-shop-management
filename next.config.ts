import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
};

export default withSentryConfig(withPWA(nextConfig), {
  silent: true,
  org: "medisathi",
  project: "medisathi-admin",
});
