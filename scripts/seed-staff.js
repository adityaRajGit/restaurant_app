/**
 * Seeds back-office logins for local testing.
 *
 *   node scripts/seed-staff.js
 *
 * Idempotent: re-running updates the existing rows rather than duplicating
 * them. Passwords come from the environment so this file never has to hold a
 * real one; the defaults below are for local development only.
 *
 *   SEED_MANAGER_PASSWORD=... SEED_STAFF_PASSWORD=... node scripts/seed-staff.js
 */
require("dotenv").config();
require("@babel/register");

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../src/common/models/user").default;
const { MANAGER, STAFF } = require("../src/common/constants/enum");

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/restaurantapp";

const seeds = [
  {
    name: "Test Manager",
    email: "manager@restaurantapp.test",
    phone: "9000000001",
    username: "testmanager",
    type: MANAGER,
    password: process.env.SEED_MANAGER_PASSWORD || "Manager@123",
  },
  {
    name: "Test Staff",
    email: "staff@restaurantapp.test",
    phone: "9000000002",
    username: "teststaff",
    type: STAFF,
    password: process.env.SEED_STAFF_PASSWORD || "Staff@123",
  },
];

async function run() {
  await mongoose.connect(MONGO_URL);
  console.log(`connected to ${MONGO_URL}\n`);

  for (const seed of seeds) {
    const { password, ...fields } = seed;
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.findOneAndUpdate(
      { email: fields.email },
      { ...fields, password: hashed, email_verified: true, status: "active" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`  ${user.type.padEnd(8)} ${user.email}  (_id ${user._id})`);
  }

  console.log("\nlogin: POST /api/v1/auth/login  { email, password }");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
