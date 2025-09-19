export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      transpilation: true,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: false,
        noImplicitAny: false,
      },
    }],
  },
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    '\\.css$': 'identity-obj-proxy',
    // Handle path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock missing dependencies
    '^zustand$': '<rootDir>/src/__mocks__/zustand.js',
    '^zustand/middleware$': '<rootDir>/src/__mocks__/zustand-middleware.js',
    // Mock components that have complex dependencies
    '^@/components/WorkerManagementPanel$': '<rootDir>/src/__mocks__/WorkerManagementPanel.tsx',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)']
};