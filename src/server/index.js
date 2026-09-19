import Express from "express";
import compression from "compression";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import chalk from "../server/chalk";
import cors from "cors";
import session from "express-session";
import serverConfig from "../server/config";
import mainRoutes from "../server/routes/main.routes";
import userRoutes from "../server/routes/user.routes";
import authRoutes from "../server/routes/auth.routes";
import otpRoutes from "../server/routes/otp.routes";
import adminRoutes from "../server/routes/admin.routes";
import menuRoutes from "../server/routes/menu.routes";
import orderRoutes from "../server/routes/order.routes";
import billRoutes from "../server/routes/bill.routes";

const app = new Express();
const http = require("http").Server(app);

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  credentials: true,
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Access-Control-Allow-Credentials",
  ],
};

const swaggerUi = require("swagger-ui-express");
const swaggerDoc = require("../../swagger/swagger-output.json");

mongoose.Promise = global.Promise;

const dbOptions = {
  maxPoolSize: 5,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
  w: "majority",
  bufferCommands: false,
  maxIdleTimeMS: 60000,
};

// Cache the mongoose connection across serverless invocations.
// On Vercel, the module is reused while a lambda instance is warm; without
// this cache every invocation would open a fresh connection.
let cached = global.__mongooseConn;
if (!cached) {
  cached = global.__mongooseConn = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(serverConfig.mongoURL, dbOptions)
      .then((m) => m)
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

mongoose.set("debug", false);

const swaggerOptions = {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Restaurant App Docs",
};

app.use(cors(corsOptions));
app.use(compression());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: false }));
app.use(cookieParser());
app.enable("trust proxy");

// Ensure DB is connected before any route handler runs. Critical on Vercel
// where the first request after a cold start would otherwise race the
// mongoose.connect() promise and trigger buffering timeouts.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection failed:", err && err.message);
    res.status(503).json({ error: "Database unavailable" });
  }
});

app.use("*", (req, res, next) => {
  const { hostname, originalUrl, protocol, method } = req;
  console.log(
    `${
      method === "GET" ? chalk.getReq(method) : chalk.postReq(method)
    }  ${protocol}://${hostname}:${serverConfig.PORT}${originalUrl}`
  );
  next();
});

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https: data:;"
  );
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});

app.use(
  session({
    secret: serverConfig.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use("/", mainRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/otp", otpRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/menu", menuRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/bill", billRoutes);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDoc, swaggerOptions)
);

// Vercel imports `app` directly and runs it as a serverless handler — it
// ignores http.listen(). Only bind the port when running outside Vercel
// (local dev / traditional Node host).
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      http.listen(serverConfig.PORT, (error) => {
        if (error) {
          console.error("Failed to start server:", error);
          return;
        }
        console.log(`Restaurant API is running on port: ${serverConfig.PORT}`);
      });
    })
    .catch((error) => {
      console.error("Startup failed:", error);
    });
}

export default app;
