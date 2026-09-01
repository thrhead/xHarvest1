/**
 * Soft-guard against React 19 / RN-web assigning numeric indexes onto CSSStyleDeclaration
 * ("Failed to set an indexed property [0] on 'CSSStyleDeclaration'").
 */
if (typeof window !== 'undefined') {
  try {
    const patchElementStyleGetter = (TargetClass: any) => {
      if (!TargetClass || !TargetClass.prototype) return;
      const desc = Object.getOwnPropertyDescriptor(TargetClass.prototype, 'style');
      if (desc && desc.get && !(desc.get as any).__ekimHasatPatched) {
        const origGet = desc.get;
        const proxyMap = new WeakMap();

        const patchedGet = function (this: any) {
          const rawStyle = origGet.call(this);
          if (!rawStyle || typeof rawStyle !== 'object') return rawStyle;

          let proxied = proxyMap.get(rawStyle);
          if (!proxied) {
            proxied = new Proxy(rawStyle, {
              set(target, prop, value, receiver) {
                if (
                  typeof prop === 'number' ||
                  (typeof prop === 'string' && /^\d+$/.test(prop))
                ) {
                  return true;
                }
                return Reflect.set(target, prop, value, receiver);
              },
              get(target, prop, receiver) {
                const val = Reflect.get(target, prop, receiver);
                if (typeof val === 'function') {
                  return val.bind(target);
                }
                return val;
              },
            });
            proxyMap.set(rawStyle, proxied);
          }
          return proxied;
        };

        (patchedGet as any).__ekimHasatPatched = true;

        Object.defineProperty(TargetClass.prototype, 'style', {
          configurable: true,
          enumerable: desc.enumerable ?? true,
          get: patchedGet,
          set: desc.set,
        });
      }
    };

    if (typeof HTMLElement !== 'undefined') patchElementStyleGetter(HTMLElement);
    if (typeof Element !== 'undefined') patchElementStyleGetter(Element);
    if (typeof SVGElement !== 'undefined') patchElementStyleGetter(SVGElement);
  } catch {
    /* ignore */
  }
}

export {};

