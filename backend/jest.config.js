export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.+)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        moduleResolution: 'NodeNext',
        strict: false,              // ✅ Desabilita strict
        noImplicitAny: false,       // ✅ Permite any implícito
        strictNullChecks: false,    // ✅ Desabilita null checks
        skipLibCheck: true,
      },
      diagnostics: false,           // ✅ Remove avisos de tipo
    }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};