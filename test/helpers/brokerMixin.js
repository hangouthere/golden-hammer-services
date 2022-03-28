module.exports = {
  broker: {
    emit: jest.fn(),
    call: jest.fn(),

    cacher: {
      get: jest.fn(),
      set: jest.fn(),
      client: jest.fn()
    }
  }
};
