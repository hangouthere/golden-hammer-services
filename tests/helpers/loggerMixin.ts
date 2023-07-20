module.exports = {
  logger: {
    debug: vitest.fn(),
    error: vitest.fn(),
    info: vitest.fn(),
    trace: vitest.fn(),
    warn: vitest.fn()
  }
};
