/**
 * Entry Script
 */
require("dotenv").config();

if (process.env.NODE_ENV === "production") {
  // In production, serve the transpiled src file.
  require("./dist/server/index.js");
} else {
  // Babel register to convert ES6 code at runtime
  require("@babel/register");
  require("./src/server/index.js");
}
