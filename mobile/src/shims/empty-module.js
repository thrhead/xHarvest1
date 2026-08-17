function DummyComponent() {
  return null;
}

const createProxyHandler = () => ({
  get(_target, prop) {
    if (prop === '__esModule') return true;
    if (prop === 'StyleSheet') return { create: (s) => s, flatten: (s) => s };
    if (prop === 'Symbol.toStringTag' || prop === 'valueOf' || prop === 'toString') {
      return () => '';
    }
    return DummyProxy;
  },
  apply() {
    return DummyComponent;
  },
  construct() {
    return DummyComponent;
  },
});

const DummyProxy = new Proxy(DummyComponent, createProxyHandler());

module.exports = DummyProxy;
module.exports.default = DummyProxy;
