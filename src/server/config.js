const configVariables = {
  stage: process.env.STAGE || "QA",
  mongoURL: process.env.MONGO_URL,
  PORT: Number(process.env.PORT) || 8080,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  JWT_SECRET: process.env.JWT_SECRET || "r3st@ur@nt",
  JWT_EXPIRATION: "7d",
  EMAIL_USER: process.env.EMAIL_USER || "",
  EMAIL_PASS: process.env.EMAIL_PASS || "",
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "",
  SESSION_SECRET: process.env.SESSION_SECRET || "restaurantapp-session",
};
export default configVariables;
