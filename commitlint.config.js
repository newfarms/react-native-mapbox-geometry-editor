module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-case': [2, 'always', 'sentence-case'],
    'type-enum': [
      2,
      'always',
      [
        'Chore',
        'Documentation',
        'Feature',
        'Fix',
        'Refactor',
        'Style',
        'Test',
        'Cleanup',
      ],
    ],
  },
};
