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

if (typeof window !== 'undefined' && window.history) {
  try {
    const origPushState = window.history.pushState;
    const origReplaceState = window.history.replaceState;

    const stripKey = (urlStr: string | URL | null | undefined): string | URL | null | undefined => {
      if (!urlStr) return urlStr;
      try {
        const u = new URL(typeof urlStr === 'string' ? urlStr : urlStr.toString(), window.location.origin);
        if (u.searchParams.has('__EXPO_ROUTER_key')) {
          u.searchParams.delete('__EXPO_ROUTER_key');
          const cleanSearch = u.searchParams.toString();
          return u.pathname + (cleanSearch ? `?${cleanSearch}` : '') + u.hash;
        }
      } catch {}
      return urlStr;
    };

    window.history.pushState = function (data, unused, url) {
      return origPushState.call(this, data, unused, stripKey(url));
    };

    window.history.replaceState = function (data, unused, url) {
      return origReplaceState.call(this, data, unused, stripKey(url));
    };
  } catch {}
}

export {};

