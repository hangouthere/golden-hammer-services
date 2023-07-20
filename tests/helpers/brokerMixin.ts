module.exports = {
  broker: {
    emit: vitest.fn(),
    call: vitest.fn(),

    cacher: {
      get: vitest.fn(),
      set: vitest.fn(),
      client: vitest.fn()
    }
  }
};
