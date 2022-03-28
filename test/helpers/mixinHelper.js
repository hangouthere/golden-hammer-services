module.exports = (base, mixinModule) => {
  for (let prop in mixinModule) {
    base[prop] = mixinModule[prop];
  }
};
