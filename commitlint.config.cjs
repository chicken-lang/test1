// commitlint: 强制 Conventional Commits 规范
// 类型: feat/fix/docs/chore/refactor/test/perf/style/build/ci/revert
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 类型枚举(对应实施计划 12.1 约定)
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'chore',
        'refactor',
        'test',
        'perf',
        'style',
        'build',
        'ci',
        'revert',
      ],
    ],
    // header 长度限制
    'header-max-length': [2, 'always', 120],
    'subject-case': [0],
  },
}
