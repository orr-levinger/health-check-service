module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@functions/(.*)$': '<rootDir>/src/functions/$1',
    '^@model/(.*)$': '<rootDir>/src/model/$1',
    '^@service/(.*)$': '<rootDir>/src/service/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@static/(.*)$': '<rootDir>/src/static/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@type/(.*)$': '<rootDir>/src/types/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};
