/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    // 👇 This list explicitly allows all modern Expo ESM packages
    'node_modules/(?!(?:' +
      [
        'react-native',
        '@react-native',
        '@react-navigation',
        'expo',
        '@expo',
        'expo-asset',
        'expo-constants',
        'expo-file-system',
        'expo-modules-core',
        'expo-sqlite',
      ].join('|') +
      ')/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
};
