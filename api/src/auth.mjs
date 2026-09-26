// Better Auth — LOCKED auth system. pg Pool (local Docker DB), phone OTP (console in dev).
import { betterAuth } from "better-auth";
import { phoneNumber, emailOTP } from "better-auth/plugins";
import { Pool } from "pg";

async function sendEmail({ to, subject, html }) {
  const key = process.env.ZEPTOMAIL_API_KEY;
  if (!key) {
    console.log(`[ZeptoMail:console] to=${to} subject=${subject}`);
    return;
  }
  const res = await fetch("https://api.zeptomail.com/v1.1/email", {
    method: "POST",
    headers: { Authorization: `Zoho-enczapikey ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: { address: process.env.ZEPTOMAIL_FROM || "noreply@food.local" },
      to: [{ email_address: { address: to } }],
      subject,
      htmlbody: html,
    }),
  });
  if (!res.ok) console.error("[ZeptoMail] failed:", res.status, await res.text());
}

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL || "postgres://food:food@localhost:5432/fooddb",
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000",
  secret: process.env.BETTER_AUTH_SECRET || "change-me-dev-only",
  emailAndPassword: { enabled: true },
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
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendEmail({
          to: email,
          subject: type === "sign-in" ? "Your login code" : type === "email-verification" ? "Verify your email" : "Reset your password",
          html: `<p>Your code is <b>${otp}</b>. It expires in 5 minutes.</p>`,
        });
      },
    }),
  ],
});
