/**
 * Soft-guard against React 19 / RN-web assigning numeric indexes onto CSSStyleDeclaration
 * ("Failed to set an indexed property [0] on 'CSSStyleDeclaration'").
 */
if (typeof window !== 'undefined') {
  try {
    // 1. Direct CSSStyleDeclaration Prototype Index Patch (Highly effective for React 19 array style assign)
    if (typeof CSSStyleDeclaration !== 'undefined' && CSSStyleDeclaration.prototype) {
      const proto = CSSStyleDeclaration.prototype;
      for (let i = 0; i < 300; i++) {
        try {
          const propStr = String(i);
          const desc = Object.getOwnPropertyDescriptor(proto, propStr);
          if (!desc || desc.configurable) {
            Object.defineProperty(proto, propStr, {
              configurable: true,
              enumerable: true,
              get() {
                return undefined;
              },
              set(val) {
                // Ignore index writes to prevent read-only throws
              }
            });
          }
        } catch (e) {
          // Ignore individual index failures (e.g. non-redefinable on mobile browsers)
        }
      }
    }

    // Note: Element style getter proxy removed as Proxying CSSStyleDeclaration
    // broke WebKit / Safari method calls on native elements. The prototype index patch above
    // handles React 19 array style assignments cleanly without breaking WebKit receivers.
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

