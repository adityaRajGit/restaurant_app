import replaceall from "replaceall";
import _ from "lodash";
import nodemailer from "nodemailer";
import configVariables from "../../server/config";
import otpHelper from "../helpers/otp.helper";

export function sanitizeCountryCode(text) {
  if (text) {
    return replaceall("+", "", text);
  }
  return "";
}

export function getUserInfo(user) {
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    profile_image: user.profile_image,
    email_verified: user.email_verified,
    created_at: user.created_at,
  };
}

export function getAdminInfo(user) {
  return {
    _id: user._id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    role: user.role,
  };
}

export function generateOtp(range) {
  const add = 1;
  const max = Math.pow(10, range + add);
  const min = max / 10;
  const number = Math.floor(Math.random() * (max - min + 1)) + min;
  return ("" + number).substring(add);
}

export function generateOtpExpireDate() {
  const date = new Date();
  const otpExpiry = new Date(date);
  otpExpiry.setMinutes(date.getMinutes() + 40);
  return otpExpiry;
}

export function getDateMinutesDifference(date) {
  const countDownDate = new Date(date).getTime();
  const currentDate = new Date().getTime();
  const diff = Math.abs(currentDate - countDownDate);
  return Math.floor(diff / 1000 / 60);
}

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: configVariables.EMAIL_USER,
      pass: configVariables.EMAIL_PASS,
    },
  });
}

function emailLayout(title, bodyHtml) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
  <body style="margin:0;padding:0;font-family:Segoe UI,Tahoma,Verdana,sans-serif;background-color:#fff7ed;color:#333;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(194,65,12,0.15);">
      <div style="background:linear-gradient(135deg,#ea580c 0%,#f97316 100%);padding:32px 30px;text-align:center;">
        <span style="color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Restaurant App</span>
      </div>
      <div style="padding:32px 30px;">${bodyHtml}</div>
      <div style="padding:20px 30px;background:#fff7ed;text-align:center;color:#9a3412;font-size:12px;">
        You are receiving this email because you have an account with Restaurant App.
      </div>
    </div>
  </body>
  </html>`;
}

export async function verifyEmailOTP(email, otp) {
  try {
    const otpRecord = await otpHelper.getObjectByQuery({ query: { email, otp } });

    if (!otpRecord) {
      throw "Invalid OTP";
    }

    if (new Date() > otpRecord.expiresAt) {
      await otpHelper.deleteObjectByQuery({ email, otp });
      throw "OTP has expired";
    }

    await otpHelper.deleteObjectByQuery({ email });

    return { success: true, message: "OTP verified successfully" };
  } catch (error) {
    console.log("Error verifying email:", error);
    throw error;
  }
}

export async function sendEmailNotification(email, subject, message) {
  try {
    await getTransporter().sendMail({
      from: configVariables.EMAIL_USER,
      to: email,
      subject,
      text: message,
    });
  } catch (error) {
    console.log("Error sending email:", error);
  }
}

export async function sendVerificationEmail(email, subject) {
  try {
    const otp = generateOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await otpHelper.deleteManyByQuery({ email });
    await otpHelper.addObject({ email, otp, expiresAt });

    const html = emailLayout(
      subject,
      `<h2 style="color:#ea580c;margin:0 0 16px 0;font-size:22px;">Verify your email</h2>
       <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 24px 0;">Use the code below to verify your email address. It expires in 10 minutes.</p>
       <div style="background:#fff7ed;border:2px solid #ea580c;border-radius:12px;padding:24px;text-align:center;">
         <span style="font-size:34px;font-weight:700;letter-spacing:8px;color:#ea580c;">${otp}</span>
       </div>
       <p style="color:#6b7280;font-size:13px;margin:24px 0 0 0;">If you did not request this, you can safely ignore this email.</p>`
    );

    await getTransporter().sendMail({
      from: configVariables.EMAIL_USER,
      to: email,
      subject,
      html,
    });

    return { success: true, message: "Verification email sent successfully" };
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

export async function sendWelcomeEmail(email, userName) {
  try {
    const html = emailLayout(
      "Welcome",
      `<h2 style="color:#ea580c;margin:0 0 16px 0;font-size:22px;">Welcome, ${userName}!</h2>
       <p style="color:#4b5563;font-size:15px;line-height:1.6;">Your account is ready. Browse the menu, place an order, and track it right from your phone.</p>`
    );

    await getTransporter().sendMail({
      from: configVariables.EMAIL_USER,
      to: email,
      subject: "Welcome to Restaurant App",
      html,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}

export async function sendOrderConfirmationEmail(email, { userName, orderNumber, items, total }) {
  try {
    const rows = (items || [])
      .map(
        (i) =>
          `<tr>
            <td style="padding:8px 0;color:#4b5563;font-size:14px;">${i.name} x ${i.quantity}</td>
            <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;">${(i.price * i.quantity).toFixed(2)}</td>
          </tr>`
      )
      .join("");

    const html = emailLayout(
      "Order confirmed",
      `<h2 style="color:#ea580c;margin:0 0 16px 0;font-size:22px;">Order confirmed, ${userName}!</h2>
       <p style="color:#4b5563;font-size:15px;line-height:1.6;">Order <strong>#${orderNumber}</strong> is in the kitchen.</p>
       <table style="width:100%;border-collapse:collapse;margin:20px 0;">${rows}
         <tr><td style="padding-top:12px;border-top:1px solid #fed7aa;font-weight:600;">Total</td>
             <td style="padding-top:12px;border-top:1px solid #fed7aa;font-weight:600;text-align:right;">${Number(total).toFixed(2)}</td></tr>
       </table>`
    );

    await getTransporter().sendMail({
      from: configVariables.EMAIL_USER,
      to: email,
      subject: `Your order #${orderNumber} is confirmed`,
      html,
    });
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
  }
}

export async function sendOrderStatusEmail(email, { userName, orderNumber, status }) {
  try {
    const readable = String(status).replace(/_/g, " ");
    const html = emailLayout(
      "Order update",
      `<h2 style="color:#ea580c;margin:0 0 16px 0;font-size:22px;">Hi ${userName}, an update on your order</h2>
       <p style="color:#4b5563;font-size:15px;line-height:1.6;">Order <strong>#${orderNumber}</strong> is now <strong>${readable}</strong>.</p>`
    );

    await getTransporter().sendMail({
      from: configVariables.EMAIL_USER,
      to: email,
      subject: `Order #${orderNumber}: ${readable}`,
      html,
    });
  } catch (error) {
    console.error("Error sending order status email:", error);
  }
}

export async function sendContactSupportEmail({ name, email, phone, message }) {
  try {
    await getTransporter().sendMail({
      from: configVariables.EMAIL_USER,
      to: configVariables.SUPPORT_EMAIL || configVariables.EMAIL_USER,
      subject: "New Contact/Support Request",
      replyTo: email,
      text: `
        New Contact/Support Request

        Name: ${name}
        Email: ${email}
        Phone: ${phone}
        Message: ${message}`.trim(),
    });
    return { success: true, message: "Contact/support email sent successfully" };
  } catch (error) {
    console.error("Error sending contact/support email:", error);
    throw error;
  }
}
