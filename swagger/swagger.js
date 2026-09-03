const swaggerAutogen = require("swagger-autogen");
const swaggerConfig = require("./swagger.json");

const outputFile = "./swagger/swagger-output.json";

const endpointFiles = ["../src/server/index.js"];

swaggerAutogen(outputFile, endpointFiles, swaggerConfig);
