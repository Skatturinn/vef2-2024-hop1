/** @type {import('ts-jest').JestConfigWithTsJest} */
// eslint-disable-next-line no-undef
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  resolver: "jest-ts-webcompat-resolver", // Thank you dpogue https://github.com/kulshekhar/ts-jest/issues/1057 https://github.com/dpogue
};
