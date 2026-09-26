// Better Auth — LOCKED auth system. pg Pool (local Docker DB), phone OTP (console in dev).
import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL || "postgres://food:food@localhost:5432/fooddb",
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000",
  secret: process.env.BETTER_AUTH_SECRET || "change-me-dev-only",
  plugins: [
    phoneNumber({
      sendOTP: ({ phoneNumber, code }) => {
        // Dev: console. Pilot: wire SMS provider here. ZeptoMail handles email separately.
        console.log(`[BetterAuth OTP] ${phoneNumber} -> ${code}`);
      },
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => `${phoneNumber.replace(/\+/g, "")}@food.local`,
        getTempName: (phoneNumber) => phoneNumber,
      },
    }),
  ],
});
