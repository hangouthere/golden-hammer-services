module.exports = class ProxyNormalizer {
  _ts = Date.now();

  normalize = (...args) => {
    const meta = {
      timestamp: this._ts
    };

    return { ...args[0], ...meta };
  };
};
