module.exports = {
    preset: "ts-jest", // Enables Jest to work with TypeScript
    testEnvironment: "node", // Sets the testing environment to Node.js
    transform: {
      "^.+\\.ts?$": "ts-jest", // Transforms TypeScript files using ts-jest
    },
    moduleFileExtensions: ["js", "ts"], // Supports both TypeScript (.ts) and JavaScript (.js) files
  };
  