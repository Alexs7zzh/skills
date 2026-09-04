#!/usr/bin/env -S node --no-warnings
var __defProp = Object.defineProperty;
var __export = (target, all3) => {
  for (var name in all3)
    __defProp(target, name, { get: all3[name], enumerable: true });
};

// node_modules/effect/dist/Pipeable.js
var pipeArguments = (self, args2) => {
  switch (args2.length) {
    case 0:
      return self;
    case 1:
      return args2[0](self);
    case 2:
      return args2[1](args2[0](self));
    case 3:
      return args2[2](args2[1](args2[0](self)));
    case 4:
      return args2[3](args2[2](args2[1](args2[0](self))));
    case 5:
      return args2[4](args2[3](args2[2](args2[1](args2[0](self)))));
    case 6:
      return args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self))))));
    case 7:
      return args2[6](args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self)))))));
    case 8:
      return args2[7](args2[6](args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self))))))));
    case 9:
      return args2[8](args2[7](args2[6](args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self)))))))));
    default: {
      let ret = self;
      for (let i = 0, len = args2.length; i < len; i++) {
        ret = args2[i](ret);
      }
      return ret;
    }
  }
};
var Prototype = {
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var Class = /* @__PURE__ */ (function() {
  function PipeableBase() {
  }
  PipeableBase.prototype = Prototype;
  return PipeableBase;
})();

// node_modules/effect/dist/Function.js
var dual = function(arity, body) {
  if (typeof arity === "function") {
    return function() {
      return arity(arguments) ? body.apply(this, arguments) : (self) => body(self, ...arguments);
    };
  }
  switch (arity) {
    case 0:
    case 1:
      throw new RangeError(`Invalid arity ${arity}`);
    case 2:
      return function(a, b) {
        if (arguments.length >= 2) {
          return body(a, b);
        }
        return function(self) {
          return body(self, a);
        };
      };
    case 3:
      return function(a, b, c) {
        if (arguments.length >= 3) {
          return body(a, b, c);
        }
        return function(self) {
          return body(self, a, b);
        };
      };
    default:
      return function() {
        if (arguments.length >= arity) {
          return body.apply(this, arguments);
        }
        const args2 = arguments;
        return function(self) {
          return body(self, ...args2);
        };
      };
  }
};
var identity = (a) => a;
var constant = (value3) => () => value3;
var constTrue = /* @__PURE__ */ constant(true);
var constFalse = /* @__PURE__ */ constant(false);
var constUndefined = /* @__PURE__ */ constant(void 0);
var constVoid = constUndefined;
function pipe(a, ...args2) {
  return pipeArguments(a, args2);
}
function flow(ab, bc, cd, de, ef, fg, gh, hi, ij) {
  switch (arguments.length) {
    case 1:
      return ab;
    case 2:
      return function() {
        return bc(ab.apply(this, arguments));
      };
    case 3:
      return function() {
        return cd(bc(ab.apply(this, arguments)));
      };
    case 4:
      return function() {
        return de(cd(bc(ab.apply(this, arguments))));
      };
    case 5:
      return function() {
        return ef(de(cd(bc(ab.apply(this, arguments)))));
      };
    case 6:
      return function() {
        return fg(ef(de(cd(bc(ab.apply(this, arguments))))));
      };
    case 7:
      return function() {
        return gh(fg(ef(de(cd(bc(ab.apply(this, arguments)))))));
      };
    case 8:
      return function() {
        return hi(gh(fg(ef(de(cd(bc(ab.apply(this, arguments))))))));
      };
    case 9:
      return function() {
        return ij(hi(gh(fg(ef(de(cd(bc(ab.apply(this, arguments)))))))));
      };
  }
  return;
}
function memoize(f) {
  const cache = /* @__PURE__ */ new WeakMap();
  return (a) => {
    const cached3 = cache.get(a);
    if (cached3 !== void 0) return cached3;
    const result3 = f(a);
    cache.set(a, result3);
    return result3;
  };
}
function memoizeIdempotent(f) {
  const cache = /* @__PURE__ */ new WeakMap();
  return (a) => {
    const cached3 = cache.get(a);
    if (cached3 !== void 0) return cached3;
    const result3 = f(a);
    cache.set(a, result3);
    cache.set(result3, result3);
    return result3;
  };
}

// node_modules/effect/dist/internal/equal.js
var getAllObjectKeys = (obj) => {
  const keys = new Set(Reflect.ownKeys(obj));
  if (obj.constructor === Object) return keys;
  if (obj instanceof Error) {
    keys.delete("stack");
  }
  const proto2 = Object.getPrototypeOf(obj);
  let current = proto2;
  while (current !== null && current !== Object.prototype) {
    const ownKeys = Reflect.ownKeys(current);
    for (let i = 0; i < ownKeys.length; i++) {
      keys.add(ownKeys[i]);
    }
    current = Object.getPrototypeOf(current);
  }
  if (keys.has("constructor") && typeof obj.constructor === "function" && proto2 === obj.constructor.prototype) {
    keys.delete("constructor");
  }
  return keys;
};
var byReferenceInstances = /* @__PURE__ */ new WeakSet();

// node_modules/effect/dist/Predicate.js
function isString(input) {
  return typeof input === "string";
}
function isNumber(input) {
  return typeof input === "number";
}
function isBoolean(input) {
  return typeof input === "boolean";
}
function isFunction(input) {
  return typeof input === "function";
}
function isUndefined(input) {
  return input === void 0;
}
function isNotUndefined(input) {
  return input !== void 0;
}
function isNotNull(input) {
  return input !== null;
}
function isNullish(input) {
  return input === null || input === void 0;
}
function isNotNullish(input) {
  return input != null;
}
function isUnknown(_) {
  return true;
}
function isObject(input) {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
function isObjectKeyword(input) {
  return typeof input === "object" && input !== null || isFunction(input);
}
var hasProperty = /* @__PURE__ */ dual(2, (self, property) => isObjectKeyword(self) && property in self);
var isTagged = /* @__PURE__ */ dual(2, (self, tag2) => hasProperty(self, "_tag") && self["_tag"] === tag2);
function isError(input) {
  return input instanceof Error;
}
function isIterable(input) {
  return hasProperty(input, Symbol.iterator) || isString(input);
}

// node_modules/effect/dist/Hash.js
var symbol = "~effect/interfaces/Hash";
var hash = (self) => {
  switch (typeof self) {
    case "number":
      return number(self);
    case "bigint":
      return string(self.toString(10));
    case "boolean":
      return string(String(self));
    case "symbol":
      return string(String(self));
    case "string":
      return string(self);
    case "undefined":
      return string("undefined");
    case "function":
    case "object": {
      if (self === null) {
        return string("null");
      } else if (self instanceof Date) {
        if (Number.isNaN(self.getTime())) {
          return string("Invalid Date");
        }
        return string(self.toISOString());
      } else if (self instanceof RegExp) {
        return string(self.toString());
      } else {
        if (byReferenceInstances.has(self)) {
          return random(self);
        }
        if (hashCache.has(self)) {
          return hashCache.get(self);
        }
        const h = withVisitedTracking(self, () => {
          if (isHash(self)) {
            return self[symbol]();
          } else if (typeof self === "function") {
            return random(self);
          } else if (self instanceof DataView) {
            return array(new Uint8Array(self.buffer, self.byteOffset, self.byteLength));
          } else if (Array.isArray(self) || ArrayBuffer.isView(self)) {
            return array(self);
          } else if (self instanceof Map) {
            return hashMap(self);
          } else if (self instanceof Set) {
            return hashSet(self);
          }
          return structure(self);
        });
        hashCache.set(self, h);
        return h;
      }
    }
    default:
      throw new Error(`BUG: unhandled typeof ${typeof self} - please report an issue at https://github.com/Effect-TS/effect/issues`);
  }
};
var random = (self) => {
  if (!randomHashCache.has(self)) {
    randomHashCache.set(self, number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)));
  }
  return randomHashCache.get(self);
};
var combine = /* @__PURE__ */ dual(2, (self, b) => self * 53 ^ b);
var optimize = (n) => n & 3221225471 | n >>> 1 & 1073741824;
var isHash = (u) => hasProperty(u, symbol);
var number = (n) => {
  if (n !== n) {
    return string("NaN");
  }
  if (n === Infinity) {
    return string("Infinity");
  }
  if (n === -Infinity) {
    return string("-Infinity");
  }
  let h = n | 0;
  if (h !== n) {
    h ^= n * 4294967295;
  }
  while (n > 4294967295) {
    h ^= n /= 4294967295;
  }
  return optimize(h);
};
var string = (str) => {
  let h = 5381, i = str.length;
  while (i) {
    h = h * 33 ^ str.charCodeAt(--i);
  }
  return optimize(h);
};
var structureKeys = (o, keys) => {
  let h = 12289;
  for (const key of keys) {
    h ^= combine(hash(key), hash(o[key]));
  }
  return optimize(h);
};
var structure = (o) => structureKeys(o, getAllObjectKeys(o));
var iterableWith = (seed, f) => (iter) => {
  let h = seed;
  for (const element of iter) {
    h ^= f(element);
  }
  return optimize(h);
};
var array = /* @__PURE__ */ iterableWith(6151, hash);
var hashMap = /* @__PURE__ */ iterableWith(/* @__PURE__ */ string("Map"), ([k, v]) => combine(hash(k), hash(v)));
var hashSet = /* @__PURE__ */ iterableWith(/* @__PURE__ */ string("Set"), hash);
var randomHashCache = /* @__PURE__ */ new WeakMap();
var hashCache = /* @__PURE__ */ new WeakMap();
var visitedObjects = /* @__PURE__ */ new WeakSet();
function withVisitedTracking(obj, fn3) {
  if (visitedObjects.has(obj)) {
    return string("[Circular]");
  }
  visitedObjects.add(obj);
  const result3 = fn3();
  visitedObjects.delete(obj);
  return result3;
}

// node_modules/effect/dist/Equal.js
var symbol2 = "~effect/interfaces/Equal";
function equals() {
  if (arguments.length === 1) {
    return (self) => compareBoth(self, arguments[0]);
  }
  return compareBoth(arguments[0], arguments[1]);
}
function compareBoth(self, that) {
  if (self === that) return true;
  if (self == null || that == null) return false;
  const selfType = typeof self;
  if (selfType !== typeof that) {
    return false;
  }
  if (selfType === "number" && self !== self && that !== that) {
    return true;
  }
  if (selfType !== "object" && selfType !== "function") {
    return false;
  }
  if (byReferenceInstances.has(self) || byReferenceInstances.has(that)) {
    return false;
  }
  return withCache(self, that, compareObjects);
}
function withVisitedTracking2(self, that, fn3) {
  const hasLeft = visitedLeft.has(self);
  const hasRight = visitedRight.has(that);
  if (hasLeft && hasRight) {
    return true;
  }
  if (hasLeft || hasRight) {
    return false;
  }
  visitedLeft.add(self);
  visitedRight.add(that);
  const result3 = fn3();
  visitedLeft.delete(self);
  visitedRight.delete(that);
  return result3;
}
var visitedLeft = /* @__PURE__ */ new WeakSet();
var visitedRight = /* @__PURE__ */ new WeakSet();
function compareObjects(self, that) {
  if (hash(self) !== hash(that)) {
    return false;
  } else if (self instanceof Date) {
    if (!(that instanceof Date)) return false;
    const selfTime = self.getTime();
    const thatTime = that.getTime();
    return selfTime === thatTime || Number.isNaN(selfTime) && Number.isNaN(thatTime);
  } else if (self instanceof RegExp) {
    if (!(that instanceof RegExp)) return false;
    return self.toString() === that.toString();
  }
  const selfIsEqual = isEqual(self);
  const thatIsEqual = isEqual(that);
  if (selfIsEqual !== thatIsEqual) return false;
  const bothEquals = selfIsEqual && thatIsEqual;
  if (typeof self === "function" && !bothEquals) {
    return false;
  }
  return withVisitedTracking2(self, that, () => {
    if (bothEquals) {
      return self[symbol2](that);
    } else if (Array.isArray(self)) {
      if (!Array.isArray(that) || self.length !== that.length) {
        return false;
      }
      return compareArrays(self, that);
    } else if (ArrayBuffer.isView(self)) {
      const selfIsDataView = self instanceof DataView;
      if (!ArrayBuffer.isView(that) || self.byteLength !== that.byteLength || selfIsDataView !== that instanceof DataView) {
        return false;
      }
      if (selfIsDataView) {
        const thatDataView = that;
        return compareTypedArrays(new Uint8Array(self.buffer, self.byteOffset, self.byteLength), new Uint8Array(thatDataView.buffer, thatDataView.byteOffset, thatDataView.byteLength));
      }
      return compareTypedArrays(self, that);
    } else if (self instanceof Map) {
      if (!(that instanceof Map) || self.size !== that.size) {
        return false;
      }
      return compareMaps(self, that);
    } else if (self instanceof Set) {
      if (!(that instanceof Set) || self.size !== that.size) {
        return false;
      }
      return compareSets(self, that);
    }
    return compareRecords(self, that);
  });
}
function withCache(self, that, f) {
  let selfMap = equalityCache.get(self);
  if (!selfMap) {
    selfMap = /* @__PURE__ */ new WeakMap();
    equalityCache.set(self, selfMap);
  } else if (selfMap.has(that)) {
    return selfMap.get(that);
  }
  const result3 = f(self, that);
  selfMap.set(that, result3);
  let thatMap = equalityCache.get(that);
  if (!thatMap) {
    thatMap = /* @__PURE__ */ new WeakMap();
    equalityCache.set(that, thatMap);
  }
  thatMap.set(self, result3);
  return result3;
}
var equalityCache = /* @__PURE__ */ new WeakMap();
function compareArrays(self, that) {
  for (let i = 0; i < self.length; i++) {
    if (!compareBoth(self[i], that[i])) {
      return false;
    }
  }
  return true;
}
function compareTypedArrays(self, that) {
  if (self.length !== that.length) {
    return false;
  }
  for (let i = 0; i < self.length; i++) {
    if (self[i] !== that[i]) {
      return false;
    }
  }
  return true;
}
function compareRecords(self, that) {
  const selfKeys = getAllObjectKeys(self);
  const thatKeys = getAllObjectKeys(that);
  if (selfKeys.size !== thatKeys.size) {
    return false;
  }
  for (const key of selfKeys) {
    if (!thatKeys.has(key) || !compareBoth(self[key], that[key])) {
      return false;
    }
  }
  return true;
}
function makeCompareMap(keyEquivalence, valueEquivalence) {
  return function compareMaps2(self, that) {
    const thatEntries = Array.from(that);
    for (const [selfKey, selfValue] of self) {
      let found = false;
      for (let i = 0; i < thatEntries.length; i++) {
        const [thatKey, thatValue] = thatEntries[i];
        if (keyEquivalence(selfKey, thatKey) && valueEquivalence(selfValue, thatValue)) {
          thatEntries[i] = thatEntries[thatEntries.length - 1];
          thatEntries.pop();
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  };
}
var compareMaps = /* @__PURE__ */ makeCompareMap(compareBoth, compareBoth);
function makeCompareSet(equivalence) {
  return function compareSets2(self, that) {
    const thatValues = Array.from(that);
    for (const selfValue of self) {
      let found = false;
      for (let i = 0; i < thatValues.length; i++) {
        const thatValue = thatValues[i];
        if (equivalence(selfValue, thatValue)) {
          thatValues[i] = thatValues[thatValues.length - 1];
          thatValues.pop();
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  };
}
var compareSets = /* @__PURE__ */ makeCompareSet(compareBoth);
var isEqual = (u) => hasProperty(u, symbol2);
var byReferenceUnsafe = (obj) => {
  byReferenceInstances.add(obj);
  return obj;
};

// node_modules/effect/dist/Redactable.js
var symbolRedactable = /* @__PURE__ */ Symbol.for("~effect/Redactable");
var isRedactable = (u) => hasProperty(u, symbolRedactable);
function redact(u) {
  if (isRedactable(u)) return getRedacted(u);
  return u;
}
function getRedacted(redactable) {
  return redactable[symbolRedactable](globalThis[currentFiberTypeId]?.context ?? emptyContext);
}
var currentFiberTypeId = "~effect/Fiber/currentFiber";
var emptyMap = /* @__PURE__ */ new Map();
var emptyContext = {
  "~effect/Context": {},
  base: emptyMap,
  depth: 0,
  mapUnsafe: emptyMap,
  pipe() {
    return pipeArguments(this, arguments);
  }
};

// node_modules/effect/dist/Formatter.js
function format(input, options) {
  const space = options?.space ?? 0;
  const ancestors = /* @__PURE__ */ new WeakSet();
  const gap = !space ? "" : typeof space === "number" ? " ".repeat(space) : space;
  const ind = (d) => gap.repeat(d);
  const wrap = (v, body) => {
    const ctor = v?.constructor;
    return ctor && ctor !== Object.prototype.constructor && ctor.name ? `${ctor.name}(${body})` : body;
  };
  const ownKeys = (o) => {
    try {
      return Reflect.ownKeys(o);
    } catch {
      return ["[ownKeys threw]"];
    }
  };
  function recur(v, d = 0) {
    if (typeof v === "string") return JSON.stringify(v);
    if (typeof v === "number" || v == null || typeof v === "boolean" || typeof v === "symbol") return String(v);
    if (typeof v === "bigint") return String(v) + "n";
    if (typeof v === "object" || typeof v === "function") {
      if (ancestors.has(v)) return CIRCULAR;
      ancestors.add(v);
      let output;
      if (symbolRedactable in v) {
        output = recur(getRedacted(v), d);
      } else if (Array.isArray(v)) {
        output = !gap || v.length <= 1 ? `[${v.map((x) => recur(x, d)).join(",")}]` : `[
${ind(d + 1)}${v.map((x) => recur(x, d + 1)).join(",\n" + ind(d + 1))}
${ind(d)}]`;
      } else if (v instanceof Date) {
        output = formatDate(v);
      } else if (!options?.ignoreToString && hasProperty(v, "toString") && typeof v["toString"] === "function" && v["toString"] !== Object.prototype.toString && v["toString"] !== Array.prototype.toString) {
        const s = safeToString(v);
        output = v instanceof Error && v.cause ? `${s} (cause: ${recur(v.cause, d)})` : s;
      } else if (Symbol.iterator in v) {
        output = `${v.constructor.name}(${recur(Array.from(v), d)})`;
      } else {
        const keys = ownKeys(v);
        if (!gap || keys.length <= 1) {
          const body = `{${keys.map((k) => `${formatPropertyKey(k)}:${recur(v[k], d)}`).join(",")}}`;
          output = wrap(v, body);
        } else {
          const body = `{
${keys.map((k) => `${ind(d + 1)}${formatPropertyKey(k)}: ${recur(v[k], d + 1)}`).join(",\n")}
${ind(d)}}`;
          output = wrap(v, body);
        }
      }
      ancestors.delete(v);
      return output;
    }
    return String(v);
  }
  return recur(input, 0);
}
var CIRCULAR = "[Circular]";
function formatPropertyKey(name) {
  return typeof name === "string" ? JSON.stringify(name) : String(name);
}
function formatPath(path5) {
  return path5.map((key) => `[${formatPropertyKey(key)}]`).join("");
}
function formatDate(date6) {
  try {
    return date6.toISOString();
  } catch {
    return "Invalid Date";
  }
}
function safeToString(input) {
  try {
    const s = input.toString();
    return typeof s === "string" ? s : String(s);
  } catch {
    return "[toString threw]";
  }
}
function formatJson(input, options) {
  const ancestors = [];
  return JSON.stringify(input, function(key, value3) {
    const original = Object.getOwnPropertyDescriptor(this, key)?.value;
    const redacted5 = hasProperty(original, symbolRedactable) ? redact(original) : redact(value3);
    if (typeof redacted5 === "bigint") {
      return format(redacted5);
    }
    if (typeof redacted5 !== "object" || redacted5 === null) {
      return redacted5;
    }
    while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) {
      ancestors.pop();
    }
    if (ancestors.includes(redacted5)) {
      return void 0;
    }
    ancestors.push(redacted5);
    return redacted5;
  }, options?.space) ?? "null";
}

// node_modules/effect/dist/Inspectable.js
var NodeInspectSymbol = /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
var toJson = (input) => {
  try {
    input = redact(input);
    if (hasProperty(input, "toJSON") && isFunction(input["toJSON"]) && input["toJSON"].length === 0) {
      return input.toJSON();
    } else if (Array.isArray(input)) {
      return input.map(toJson);
    }
    return input;
  } catch {
    return "[toJSON threw]";
  }
};
var toStringUnknown = (u, whitespace = 2) => {
  if (typeof u === "string") {
    return u;
  }
  try {
    return typeof u === "object" ? formatJson(u, {
      space: whitespace
    }) : format(u, {
      space: whitespace
    });
  } catch {
    return String(u);
  }
};
var BaseProto = {
  toJSON() {
    return toJson(this);
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  toString() {
    return format(this.toJSON());
  }
};
var Class2 = class {
  /**
   * Node.js custom inspection method.
   *
   * **When to use**
   *
   * Use to expose the class JSON representation to Node.js inspection.
   *
   * @since 2.0.0
   */
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  /**
   * Returns a formatted string representation of this object.
   *
   * **When to use**
   *
   * Use to format the class JSON representation as a string.
   *
   * @since 2.0.0
   */
  toString() {
    return format(this.toJSON());
  }
};

// node_modules/effect/dist/Utils.js
var SingleShotGen = class _SingleShotGen {
  called = false;
  self;
  constructor(self) {
    this.self = self;
  }
  /**
   * Yields the stored value once, then completes with the value sent back in.
   *
   * **When to use**
   *
   * Use to advance a `SingleShotGen` through its single yield and completion
   * step.
   *
   * @since 2.0.0
   */
  next(a) {
    return this.called ? {
      value: a,
      done: true
    } : (this.called = true, {
      value: this.self,
      done: false
    });
  }
  /**
   * Creates a fresh single-shot iterator over the stored value.
   *
   * **When to use**
   *
   * Use to iterate the wrapped value again without reusing the consumed
   * iterator state.
   *
   * @since 2.0.0
   */
  [Symbol.iterator]() {
    return new _SingleShotGen(this.self);
  }
};
var pickInternalCall = () => {
  const InternalTypeId = "~effect/Utils/internal";
  const standard = {
    [InternalTypeId]: (body) => {
      return body();
    }
  };
  const forced = {
    [InternalTypeId]: (body) => {
      try {
        return body();
      } finally {
      }
    }
  };
  const isNotOptimizedAway = standard[InternalTypeId](() => new Error().stack)?.includes(InternalTypeId) === true;
  return isNotOptimizedAway ? standard[InternalTypeId] : forced[InternalTypeId];
};
var internalCall = /* @__PURE__ */ pickInternalCall();

// node_modules/effect/dist/internal/record.js
function assignProperty(self, key, value3) {
  if (key === "__proto__") {
    Object.defineProperty(self, key, {
      value: value3,
      writable: true,
      enumerable: true,
      configurable: true
    });
  } else {
    ;
    self[key] = value3;
  }
}
function assignProperties(self, source) {
  for (const key of Reflect.ownKeys(source)) {
    if (Object.prototype.propertyIsEnumerable.call(source, key)) {
      assignProperty(self, key, source[key]);
    }
  }
}

// node_modules/effect/dist/internal/core.js
var EffectTypeId = `~effect/Effect`;
var ExitTypeId = `~effect/Exit`;
var effectVariance = {
  _A: identity,
  _E: identity,
  _R: identity
};
var identifier = `${EffectTypeId}/identifier`;
var args = `${EffectTypeId}/args`;
var evaluate = `${EffectTypeId}/evaluate`;
var contA = `${EffectTypeId}/successCont`;
var contE = `${EffectTypeId}/failureCont`;
var contAll = `${EffectTypeId}/ensureCont`;
var Yield = /* @__PURE__ */ Symbol.for("effect/Effect/Yield");
var PipeInspectableProto = {
  pipe() {
    return pipeArguments(this, arguments);
  },
  toJSON() {
    return {
      ...this
    };
  },
  toString() {
    return format(this.toJSON(), {
      ignoreToString: true,
      space: 2
    });
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
};
var StructuralProto = {
  [symbol]() {
    return structureKeys(this, Object.keys(this));
  },
  [symbol2](that) {
    const selfKeys = Object.keys(this);
    const thatKeys = Object.keys(that);
    if (selfKeys.length !== thatKeys.length) return false;
    for (let i = 0; i < selfKeys.length; i++) {
      if (selfKeys[i] !== thatKeys[i] || !equals(this[selfKeys[i]], that[selfKeys[i]])) {
        return false;
      }
    }
    return true;
  }
};
var EffectProto = {
  [EffectTypeId]: effectVariance,
  ...PipeInspectableProto,
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  },
  toJSON() {
    return {
      _id: "Effect",
      op: this[identifier],
      ...args in this ? {
        args: this[args]
      } : void 0
    };
  }
};
var isEffect = (u) => hasProperty(u, EffectTypeId);
var isExit = (u) => hasProperty(u, ExitTypeId);
var CauseTypeId = "~effect/Cause";
var CauseReasonTypeId = "~effect/Cause/Reason";
var isCause = (self) => hasProperty(self, CauseTypeId);
var CauseImpl = class {
  [CauseTypeId];
  reasons;
  constructor(failures) {
    this[CauseTypeId] = CauseTypeId;
    this.reasons = failures;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toJSON() {
    return {
      _id: "Cause",
      failures: this.reasons.map((f) => f.toJSON())
    };
  }
  toString() {
    return `Cause(${format(this.reasons)})`;
  }
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  [symbol2](that) {
    return isCause(that) && this.reasons.length === that.reasons.length && this.reasons.every((e, i) => equals(e, that.reasons[i]));
  }
  [symbol]() {
    return array(this.reasons);
  }
};
var annotationsMap = /* @__PURE__ */ new WeakMap();
var ReasonBase = class {
  [CauseReasonTypeId];
  annotations;
  _tag;
  constructor(_tag, annotations, originalError) {
    this[CauseReasonTypeId] = CauseReasonTypeId;
    this._tag = _tag;
    if (annotations !== constEmptyAnnotations && typeof originalError === "object" && originalError !== null && annotations.size > 0) {
      const prevAnnotations = annotationsMap.get(originalError);
      if (prevAnnotations) {
        annotations = new Map([...prevAnnotations, ...annotations]);
      }
      annotationsMap.set(originalError, annotations);
    }
    this.annotations = annotations;
  }
  annotate(annotations, options) {
    if (annotations.mapUnsafe.size === 0) return this;
    const newAnnotations = new Map(this.annotations);
    annotations.mapUnsafe.forEach((value3, key) => {
      if (options?.overwrite !== true && newAnnotations.has(key)) return;
      newAnnotations.set(key, value3);
    });
    const self = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    self.annotations = newAnnotations;
    return self;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toString() {
    return format(this);
  }
  [NodeInspectSymbol]() {
    return this.toString();
  }
};
var constEmptyAnnotations = /* @__PURE__ */ new Map();
var Fail = class extends ReasonBase {
  error;
  constructor(error2, annotations = constEmptyAnnotations) {
    super("Fail", annotations, error2);
    this.error = error2;
  }
  toString() {
    return `Fail(${format(this.error)})`;
  }
  toJSON() {
    return {
      _tag: "Fail",
      error: this.error
    };
  }
  [symbol2](that) {
    return isFailReason(that) && equals(this.error, that.error) && equals(this.annotations, that.annotations);
  }
  [symbol]() {
    return combine(string(this._tag))(combine(hash(this.error))(hash(this.annotations)));
  }
};
var causeFromReasons = (reasons) => new CauseImpl(reasons);
var causeEmpty = /* @__PURE__ */ new CauseImpl([]);
var causeFail = (error2) => new CauseImpl([new Fail(error2)]);
var Die = class extends ReasonBase {
  defect;
  constructor(defect, annotations = constEmptyAnnotations) {
    super("Die", annotations, defect);
    this.defect = defect;
  }
  toString() {
    return `Die(${format(this.defect)})`;
  }
  toJSON() {
    return {
      _tag: "Die",
      defect: this.defect
    };
  }
  [symbol2](that) {
    return isDieReason(that) && equals(this.defect, that.defect) && equals(this.annotations, that.annotations);
  }
  [symbol]() {
    return combine(string(this._tag))(combine(hash(this.defect))(hash(this.annotations)));
  }
};
var causeDie = (defect) => new CauseImpl([new Die(defect)]);
var causeAnnotate = /* @__PURE__ */ dual((args2) => isCause(args2[0]), (self, annotations, options) => {
  if (annotations.mapUnsafe.size === 0) return self;
  return new CauseImpl(self.reasons.map((f) => f.annotate(annotations, options)));
});
var isFailReason = (self) => self._tag === "Fail";
var isDieReason = (self) => self._tag === "Die";
var isInterruptReason = (self) => self._tag === "Interrupt";
function defaultEvaluate(_fiber) {
  return exitDie(`Effect.evaluate: Not implemented`);
}
var makePrimitiveProto = (options) => ({
  ...EffectProto,
  [identifier]: options.op,
  [evaluate]: options[evaluate] ?? defaultEvaluate,
  [contA]: options[contA],
  [contE]: options[contE],
  [contAll]: options[contAll]
});
var makePrimitive = (options) => {
  const Proto11 = makePrimitiveProto(options);
  return function() {
    const self = Object.create(Proto11);
    self[args] = options.single === false ? arguments : arguments[0];
    return self;
  };
};
var makeExit = (options) => {
  const Proto11 = {
    [ExitTypeId]: ExitTypeId,
    _tag: options.op,
    get [options.prop]() {
      return this[args];
    },
    ...makePrimitiveProto(options),
    toString() {
      return `${options.op}(${format(this[args])})`;
    },
    toJSON() {
      return {
        _id: "Exit",
        _tag: options.op,
        [options.prop]: this[args]
      };
    },
    [symbol2](that) {
      return isExit(that) && that._tag === this._tag && equals(this[args], that[args]);
    },
    [symbol]() {
      return combine(string(options.op), hash(this[args]));
    }
  };
  return function(value3) {
    const self = Object.create(Proto11);
    self[args] = value3;
    return self;
  };
};
var exitSucceed = /* @__PURE__ */ makeExit({
  op: "Success",
  prop: "value",
  [evaluate](fiber3) {
    const cont = fiber3.getCont(contA);
    return cont ? cont[contA](this[args], fiber3, this) : fiber3.yieldWith(this);
  }
});
var StackTraceKey = {
  key: "effect/Cause/StackTrace"
};
var InterruptorStackTrace = {
  key: "effect/Cause/InterruptorStackTrace"
};
var exitFailCause = /* @__PURE__ */ makeExit({
  op: "Failure",
  prop: "cause",
  [evaluate](fiber3) {
    let cause = this[args];
    let annotated = false;
    if (fiber3.currentStackFrame) {
      cause = causeAnnotate(cause, {
        mapUnsafe: /* @__PURE__ */ new Map([[StackTraceKey.key, fiber3.currentStackFrame]])
      });
      annotated = true;
    }
    let cont = fiber3.getCont(contE);
    while (fiber3.interruptible && fiber3._interruptedCause && cont) {
      cont = fiber3.getCont(contE);
    }
    return cont ? cont[contE](cause, fiber3, annotated ? void 0 : this) : fiber3.yieldWith(annotated ? exitFailCause(cause) : this);
  }
});
var exitFail = (e) => exitFailCause(causeFail(e));
var exitDie = (defect) => exitFailCause(causeDie(defect));
var withFiber = /* @__PURE__ */ makePrimitive({
  op: "WithFiber",
  [evaluate](fiber3) {
    return this[args](fiber3);
  }
});
var YieldableError = /* @__PURE__ */ (function() {
  class YieldableError2 extends globalThis.Error {
  }
  const proto2 = /* @__PURE__ */ makePrimitiveProto({
    op: "YieldableError",
    [evaluate]() {
      return exitFail(this);
    }
  });
  delete proto2.toString;
  Object.assign(YieldableError2.prototype, proto2);
  return YieldableError2;
})();
var Error2 = /* @__PURE__ */ (function() {
  const plainArgsSymbol = /* @__PURE__ */ Symbol.for("effect/Data/Error/plainArgs");
  return class Base extends YieldableError {
    constructor(args2) {
      super(args2?.message, args2?.cause ? {
        cause: args2.cause
      } : void 0);
      if (args2) {
        assignProperties(this, args2);
        Object.defineProperty(this, plainArgsSymbol, {
          value: args2,
          enumerable: false
        });
      }
    }
    toJSON() {
      return {
        ...this[plainArgsSymbol],
        ...this
      };
    }
  };
})();
var TaggedError = (tag2) => {
  class Base3 extends Error2 {
    _tag = tag2;
  }
  ;
  Base3.prototype.name = tag2;
  return Base3;
};
var NoSuchElementErrorTypeId = "~effect/Cause/NoSuchElementError";
var isNoSuchElementError = (u) => hasProperty(u, NoSuchElementErrorTypeId);
var NoSuchElementError = class extends (/* @__PURE__ */ TaggedError("NoSuchElementError")) {
  [NoSuchElementErrorTypeId] = NoSuchElementErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
};
var DoneTypeId = "~effect/Cause/Done";
var isDone = (u) => hasProperty(u, DoneTypeId);
var DoneVoid = {
  [DoneTypeId]: DoneTypeId,
  _tag: "Done",
  value: void 0
};
var Done = (value3) => {
  if (value3 === void 0) return DoneVoid;
  return {
    [DoneTypeId]: DoneTypeId,
    _tag: "Done",
    value: value3
  };
};
var doneVoid = /* @__PURE__ */ exitFail(DoneVoid);
var done = (value3) => {
  if (value3 === void 0) return doneVoid;
  return exitFail(Done(value3));
};

// node_modules/effect/dist/Effectable.js
var Prototype2 = (options) => makePrimitiveProto({
  op: options.label,
  [evaluate]: options.evaluate
});

// node_modules/effect/dist/internal/doNotation.js
var let_ = (map14) => dual(3, (self, name, f) => map14(self, (a) => ({
  ...a,
  [name]: f(a)
})));
var bindTo = (map14) => dual(2, (self, name) => map14(self, (a) => ({
  [name]: a
})));
var bind = (map14, flatMap6) => dual(3, (self, name, f) => flatMap6(self, (a) => map14(f(a), (b) => ({
  ...a,
  [name]: b
}))));

// node_modules/effect/dist/internal/option.js
var TypeId = "~effect/data/Option";
var CommonProto = {
  [TypeId]: {
    _A: (_) => _
  },
  ...PipeInspectableProto,
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  }
};
var SomeProto = /* @__PURE__ */ Object.defineProperty(/* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto), {
  _tag: "Some",
  _op: "Some",
  [symbol2](that) {
    return isOption(that) && isSome(that) && equals(this.value, that.value);
  },
  [symbol]() {
    return combine(hash(this._tag))(hash(this.value));
  },
  toString() {
    return `some(${format(this.value)})`;
  },
  toJSON() {
    return {
      _id: "Option",
      _tag: this._tag,
      value: toJson(this.value)
    };
  }
}), "valueOrUndefined", {
  get() {
    return this.value;
  }
});
var NoneHash = /* @__PURE__ */ hash("None");
var NoneProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto), {
  _tag: "None",
  _op: "None",
  valueOrUndefined: void 0,
  [symbol2](that) {
    return isOption(that) && isNone(that);
  },
  [symbol]() {
    return NoneHash;
  },
  toString() {
    return `none()`;
  },
  toJSON() {
    return {
      _id: "Option",
      _tag: this._tag
    };
  }
});
var isOption = (input) => hasProperty(input, TypeId);
var isNone = (fa) => fa._tag === "None";
var isSome = (fa) => fa._tag === "Some";
var none = /* @__PURE__ */ Object.create(NoneProto);
var some = (value3) => {
  const a = Object.create(SomeProto);
  a.value = value3;
  return a;
};

// node_modules/effect/dist/internal/result.js
var TypeId2 = "~effect/data/Result";
var CommonProto2 = {
  [TypeId2]: {
    /* v8 ignore next 2 */
    _A: (_) => _,
    _E: (_) => _
  },
  ...PipeInspectableProto,
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  }
};
var SuccessProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto2), {
  _tag: "Success",
  _op: "Success",
  [symbol2](that) {
    return isResult(that) && isSuccess(that) && equals(this.success, that.success);
  },
  [symbol]() {
    return combine(hash(this._tag))(hash(this.success));
  },
  toString() {
    return `success(${format(this.success)})`;
  },
  toJSON() {
    return {
      _id: "Result",
      _tag: this._tag,
      value: toJson(this.success)
    };
  }
});
var FailureProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto2), {
  _tag: "Failure",
  _op: "Failure",
  [symbol2](that) {
    return isResult(that) && isFailure(that) && equals(this.failure, that.failure);
  },
  [symbol]() {
    return combine(hash(this._tag))(hash(this.failure));
  },
  toString() {
    return `failure(${format(this.failure)})`;
  },
  toJSON() {
    return {
      _id: "Result",
      _tag: this._tag,
      failure: toJson(this.failure)
    };
  }
});
var isResult = (input) => hasProperty(input, TypeId2);
var isFailure = (result3) => result3._tag === "Failure";
var isSuccess = (result3) => result3._tag === "Success";
var fail = (failure) => {
  const a = Object.create(FailureProto);
  a.failure = failure;
  return a;
};
var succeed = (success) => {
  const a = Object.create(SuccessProto);
  a.success = success;
  return a;
};

// node_modules/effect/dist/Order.js
function make(compare) {
  return (self, that) => self === that ? 0 : compare(self, that);
}
var Number2 = /* @__PURE__ */ make((self, that) => {
  if (globalThis.Number.isNaN(self) && globalThis.Number.isNaN(that)) return 0;
  if (globalThis.Number.isNaN(self)) return -1;
  if (globalThis.Number.isNaN(that)) return 1;
  return self < that ? -1 : 1;
});
var mapInput = /* @__PURE__ */ dual(2, (self, f) => make((b1, b2) => self(f(b1), f(b2))));
var Date2 = /* @__PURE__ */ mapInput(Number2, (date6) => date6.getTime());
var isGreaterThan = (O) => dual(2, (self, that) => O(self, that) === 1);

// node_modules/effect/dist/Option.js
var none2 = () => none;
var some2 = some;
var isOption2 = isOption;
var isNone2 = isNone;
var isSome2 = isSome;
var match = /* @__PURE__ */ dual(2, (self, {
  onNone,
  onSome: onSome2
}) => isNone2(self) ? onNone() : onSome2(self.value));
var getOrElse = /* @__PURE__ */ dual(2, (self, onNone) => isNone2(self) ? onNone() : self.value);
var fromNullishOr = (a) => a == null ? none2() : some2(a);
var fromUndefinedOr = (a) => a === void 0 ? none2() : some2(a);
var getOrUndefined = /* @__PURE__ */ getOrElse(constUndefined);
var map = /* @__PURE__ */ dual(2, (self, f) => isNone2(self) ? none2() : some2(f(self.value)));
var flatMap = /* @__PURE__ */ dual(2, (self, f) => isNone2(self) ? none2() : f(self.value));
var filter = /* @__PURE__ */ dual(2, (self, predicate) => isNone2(self) ? none2() : predicate(self.value) ? some2(self.value) : none2());
var liftPredicate = /* @__PURE__ */ dual(2, (b, predicate) => predicate(b) ? some2(b) : none2());
var exists = /* @__PURE__ */ dual(2, (self, refinement) => isNone2(self) ? false : refinement(self.value));

// node_modules/effect/dist/Context.js
var ServiceTypeId = "~effect/Context/Service";
var Service = function() {
  function KeyClass() {
  }
  const self = KeyClass;
  Object.setPrototypeOf(self, ServiceProto);
  const init = (key, options) => {
    self.key = key;
    if (options?.defaultValue) {
      self[ReferenceTypeId] = ReferenceTypeId;
      self.defaultValue = options.defaultValue;
    }
    if (options?.make) {
      ;
      self.make = options.make;
    }
    if (options?.fiberCached) {
      cacheKeys.add(key);
    }
    return self;
  };
  return arguments.length > 0 ? init(arguments[0], arguments[1]) : init;
};
var ServiceProto = {
  [ServiceTypeId]: ServiceTypeId,
  .../* @__PURE__ */ Prototype2({
    label: "Service",
    evaluate(fiber3) {
      return exitSucceed(get(fiber3.context, this));
    }
  }),
  toJSON() {
    return {
      _id: "Service",
      key: this.key
    };
  },
  of(self) {
    return self;
  },
  context(self) {
    return make2(this, self);
  },
  use(f) {
    return withFiber((fiber3) => f(get(fiber3.context, this)));
  },
  useSync(f) {
    return withFiber((fiber3) => exitSucceed(f(get(fiber3.context, this))));
  }
};
var cacheKeys = /* @__PURE__ */ new Set();
var ReferenceTypeId = "~effect/Context/Reference";
var TypeId3 = "~effect/Context";
var MaxDepth = 8;
var FlattenAfterBaseHits = 8;
var makeImpl = (cacheRoot, base, overlay, depth) => {
  const self = Object.create(Proto);
  self.cacheRoot = cacheRoot ?? self;
  self.base = base;
  self.overlay = overlay;
  self.depth = depth;
  self._flat = void 0;
  self.baseHits = 0;
  return self;
};
var applyOverlays = (map14, overlay) => {
  if (!overlay) return;
  applyOverlays(map14, overlay.parent);
  map14.set(overlay.key, overlay.value);
};
var flatten = (self) => {
  if (self._flat) return self._flat;
  if (!self.overlay) return self._flat = self.base;
  const map14 = new Map(self.base);
  applyOverlays(map14, self.overlay);
  return self._flat = map14;
};
var withFlat = (self, f) => {
  const map14 = new Map(self.mapUnsafe);
  f(map14);
  return makeUnsafe(map14);
};
var notFound = /* @__PURE__ */ Symbol();
var lookup = (self, key) => {
  const impl = self;
  for (let overlay = impl.overlay; overlay; overlay = overlay.parent) {
    if (overlay.key === key) return overlay.value;
  }
  const value3 = impl.base.get(key);
  if (value3 === void 0 && !impl.base.has(key)) return notFound;
  if (impl.overlay && ++impl.baseHits >= FlattenAfterBaseHits) {
    impl.base = flatten(impl);
    impl.overlay = void 0;
    impl.depth = 0;
  }
  return value3;
};
var makeUnsafe = (mapUnsafe) => makeImpl(void 0, mapUnsafe, void 0, 0);
var Proto = {
  get mapUnsafe() {
    return flatten(this);
  },
  ...PipeInspectableProto,
  [TypeId3]: {
    _Services: (_) => _
  },
  toJSON() {
    return {
      _id: "Context",
      services: Array.from(this.mapUnsafe).map(([key, value3]) => ({
        key,
        value: value3
      }))
    };
  },
  [symbol2](that) {
    if (!isContext(that)) return false;
    const self = this.mapUnsafe;
    const other = that.mapUnsafe;
    if (self.size !== other.size) return false;
    for (const [key, value3] of self) {
      if (!other.has(key) || !equals(value3, other.get(key))) return false;
    }
    return true;
  },
  [symbol]() {
    return number(this.mapUnsafe.size);
  }
};
var hasSameCache = (self, that) => self.cacheRoot === that.cacheRoot;
var isContext = (u) => hasProperty(u, TypeId3);
var isReference = (u) => !!u[ReferenceTypeId];
var empty = () => emptyContext2;
var emptyContext2 = /* @__PURE__ */ makeUnsafe(/* @__PURE__ */ new Map());
var make2 = (key, service3) => makeUnsafe(/* @__PURE__ */ new Map([[key.key, service3]]));
var add = /* @__PURE__ */ dual(3, (self, key, service3) => addUnsafe(self, key.key, service3));
var addUnsafe = (self, key, service3) => {
  const impl = self;
  const cacheRoot = cacheKeys.has(key) ? void 0 : impl.cacheRoot;
  if (impl.depth >= MaxDepth) {
    const map14 = new Map(impl.mapUnsafe);
    map14.set(key, service3);
    return makeImpl(cacheRoot, map14, void 0, 0);
  }
  return makeImpl(cacheRoot, impl.base, {
    key,
    value: service3,
    parent: impl.overlay
  }, impl.depth + 1);
};
var getOrUndefined2 = /* @__PURE__ */ dual(2, (self, key) => getOrUndefinedUnsafe(self, key.key));
var getOrUndefinedUnsafe = (self, key) => {
  const value3 = lookup(self, key);
  return value3 === notFound ? void 0 : value3;
};
var getUnsafe = /* @__PURE__ */ dual(2, (self, service3) => {
  const value3 = lookup(self, service3.key);
  if (value3 === notFound) {
    if (isReference(service3)) return getDefaultValue(service3);
    throw serviceNotFoundError(service3);
  }
  return value3;
});
var get = getUnsafe;
var defaultValueCacheKey = "~effect/Context/defaultValue";
var getDefaultValue = (ref) => {
  if (defaultValueCacheKey in ref) {
    return ref[defaultValueCacheKey];
  }
  return ref[defaultValueCacheKey] = ref.defaultValue();
};
var serviceNotFoundError = (service3) => {
  const error2 = new Error(`Service not found${service3.key ? `: ${String(service3.key)}` : ""}`);
  if (error2.stack) {
    const lines2 = error2.stack.split("\n");
    lines2.splice(1, 3);
    error2.stack = lines2.join("\n");
  }
  return error2;
};
var getOption = /* @__PURE__ */ dual(2, (self, service3) => {
  const value3 = lookup(self, service3.key);
  if (value3 !== notFound) return some2(value3);
  return isReference(service3) ? some2(getDefaultValue(service3)) : none2();
});
var merge = /* @__PURE__ */ dual(2, (self, that) => {
  if (self.mapUnsafe.size === 0) return that;
  if (that.mapUnsafe.size === 0) return self;
  return withFlat(self, (map14) => that.mapUnsafe.forEach((value3, key) => map14.set(key, value3)));
});
var mergeAll = (...ctxs) => {
  const map14 = /* @__PURE__ */ new Map();
  for (let i = 0; i < ctxs.length; i++) {
    ctxs[i].mapUnsafe.forEach((value3, key) => {
      map14.set(key, value3);
    });
  }
  return makeUnsafe(map14);
};
var Reference = Service;

// node_modules/effect/dist/internal/array.js
var isArrayNonEmpty = (self) => self.length > 0;

// node_modules/effect/dist/Result.js
var succeed2 = succeed;
var fail2 = fail;
var isFailure2 = isFailure;
var isSuccess2 = isSuccess;
var match2 = /* @__PURE__ */ dual(2, (self, {
  onFailure,
  onSuccess
}) => isFailure2(self) ? onFailure(self.failure) : onSuccess(self.success));

// node_modules/effect/dist/Iterable.js
var findFirst = /* @__PURE__ */ dual(2, (self, f) => {
  let i = 0;
  for (const a of self) {
    const o = f(a, i);
    if (isBoolean(o)) {
      if (o) {
        return some2(a);
      }
    } else {
      if (isSome2(o)) {
        return o;
      }
    }
    i++;
  }
  return none2();
});
var filter2 = /* @__PURE__ */ dual(2, (self, predicate) => ({
  [Symbol.iterator]() {
    const iterator = self[Symbol.iterator]();
    let i = 0;
    return {
      next() {
        let result3 = iterator.next();
        while (!result3.done) {
          if (predicate(result3.value, i++)) {
            return {
              done: false,
              value: result3.value
            };
          }
          result3 = iterator.next();
        }
        return {
          done: true,
          value: void 0
        };
      }
    };
  }
}));

// node_modules/effect/dist/Array.js
var Array2 = globalThis.Array;
var fromIterable = (collection) => Array2.isArray(collection) ? collection : Array2.from(collection);
var match3 = /* @__PURE__ */ dual(2, (self, {
  onEmpty,
  onNonEmpty
}) => isReadonlyArrayNonEmpty(self) ? onNonEmpty(self) : onEmpty());
var append = /* @__PURE__ */ dual(2, (self, last) => [...self, last]);
var appendAll = /* @__PURE__ */ dual(2, (self, that) => fromIterable(self).concat(fromIterable(that)));
var isArray = Array2.isArray;
var isArrayNonEmpty2 = isArrayNonEmpty;
var isReadonlyArrayNonEmpty = isArrayNonEmpty;
var findFirstIndex = /* @__PURE__ */ dual(2, (self, predicate) => {
  let i = 0;
  for (const a of self) {
    if (predicate(a, i)) {
      return some2(i);
    }
    i++;
  }
  return none2();
});
var findFirst2 = findFirst;
var findLast = /* @__PURE__ */ dual(2, (self, f) => {
  const input = fromIterable(self);
  for (let i = input.length - 1; i >= 0; i--) {
    const a = input[i];
    const o = f(a, i);
    if (typeof o === "boolean") {
      if (o) {
        return some2(a);
      }
    } else {
      if (isSome2(o)) {
        return o;
      }
    }
  }
  return none2();
});
var hashBucketsAdd = (buckets, value3) => {
  const hash2 = hash(value3);
  const bucket = buckets.get(hash2);
  if (bucket === void 0) {
    buckets.set(hash2, [value3]);
    return true;
  }
  for (const previous of bucket) {
    if (equals(previous, value3)) {
      return false;
    }
  }
  bucket.push(value3);
  return true;
};
var union = /* @__PURE__ */ dual(2, (self, that) => {
  const a = fromIterable(self);
  const b = fromIterable(that);
  if (isReadonlyArrayNonEmpty(a)) {
    return isReadonlyArrayNonEmpty(b) ? dedupe(appendAll(a, b)) : a;
  }
  return b;
});
var empty2 = () => [];
var of = (a) => [a];
var map2 = /* @__PURE__ */ dual(2, (self, f) => self.map(f));
var partition = /* @__PURE__ */ dual(2, (self, f) => {
  const excluded = [];
  const satisfying = [];
  let i = 0;
  for (const a of self) {
    const result3 = f(a, i++);
    if (isSuccess2(result3)) {
      satisfying.push(result3.success);
    } else {
      excluded.push(result3.failure);
    }
  }
  return [excluded, satisfying];
});
var reduce = /* @__PURE__ */ dual(3, (self, b, f) => fromIterable(self).reduce((b2, a, i) => f(b2, a, i), b));
var dedupe = (self) => {
  const input = fromIterable(self);
  if (input.length < 2) {
    return [...input];
  }
  const buckets = /* @__PURE__ */ new Map();
  const out = [];
  for (const value3 of input) {
    if (hashBucketsAdd(buckets, value3)) {
      out.push(value3);
    }
  }
  return out;
};

// node_modules/effect/dist/Duration.js
var TypeId4 = "~effect/time/Duration";
var bigint0 = /* @__PURE__ */ BigInt(0);
var bigint1 = /* @__PURE__ */ BigInt(1);
var bigint2 = /* @__PURE__ */ BigInt(2);
var bigint10 = /* @__PURE__ */ BigInt(10);
var bigint1e3 = /* @__PURE__ */ BigInt(1e3);
var roundTiesAwayFromZero = (input) => BigInt(input < 0 ? Math.ceil(input - 0.5) : Math.floor(input + 0.5));
var roundMillisToNanos = (millis2) => roundTiesAwayFromZero(millis2 * 1e6);
var parseNanos = (input, scale) => {
  const decimalIndex = input.indexOf(".");
  if (decimalIndex === -1) return BigInt(input) * scale;
  const isNegative = input[0] === "-";
  const fractional = input.slice(decimalIndex + 1);
  const fractionalScale = bigint10 ** BigInt(fractional.length);
  const scaled = (BigInt(input.slice(isNegative ? 1 : 0, decimalIndex)) * fractionalScale + BigInt(fractional)) * scale;
  const rounded = scaled / fractionalScale + (scaled % fractionalScale * bigint2 >= fractionalScale ? bigint1 : bigint0);
  return isNegative ? -rounded : rounded;
};
var DURATION_REGEXP = /^(-?\d+(?:\.\d+)?)\s+(nanos?|micros?|millis?|seconds?|minutes?|hours?|days?|weeks?)$/;
var fromInputUnsafe = (input) => {
  switch (typeof input) {
    case "number":
      return millis(input);
    case "bigint":
      return nanos(input);
    case "string": {
      if (input === "Infinity") {
        return infinity;
      }
      if (input === "-Infinity") {
        return negativeInfinity;
      }
      const match7 = DURATION_REGEXP.exec(input);
      if (!match7) break;
      const [_, valueStr, unit] = match7;
      if (unit === "nano" || unit === "nanos") {
        return nanos(parseNanos(valueStr, bigint1));
      }
      if (unit === "micro" || unit === "micros") {
        return nanos(parseNanos(valueStr, bigint1e3));
      }
      const value3 = Number(valueStr);
      switch (unit) {
        case "milli":
        case "millis":
          return millis(value3);
        case "second":
        case "seconds":
          return seconds(value3);
        case "minute":
        case "minutes":
          return minutes(value3);
        case "hour":
        case "hours":
          return hours(value3);
        case "day":
        case "days":
          return days(value3);
        case "week":
        case "weeks":
          return weeks(value3);
      }
      break;
    }
    case "object": {
      if (input === null) break;
      if (TypeId4 in input) return input;
      if (Array.isArray(input)) {
        if (input.length !== 2 || !input.every(isNumber)) {
          return invalid(input);
        }
        if (Number.isNaN(input[0]) || Number.isNaN(input[1])) {
          return zero;
        }
        if (input[0] === -Infinity || input[1] === -Infinity) {
          return negativeInfinity;
        }
        if (input[0] === Infinity || input[1] === Infinity) {
          return infinity;
        }
        return make3(roundTiesAwayFromZero(input[0] * 1e9 + input[1]));
      }
      const obj = input;
      let millis2 = 0;
      if (obj.weeks) millis2 += obj.weeks * 6048e5;
      if (obj.days) millis2 += obj.days * 864e5;
      if (obj.hours) millis2 += obj.hours * 36e5;
      if (obj.minutes) millis2 += obj.minutes * 6e4;
      if (obj.seconds) millis2 += obj.seconds * 1e3;
      if (obj.milliseconds) millis2 += obj.milliseconds;
      if (!obj.microseconds && !obj.nanoseconds) return make3(millis2);
      return make3(roundTiesAwayFromZero(millis2 * 1e6 + (obj.microseconds ?? 0) * 1e3 + (obj.nanoseconds ?? 0)));
    }
  }
  return invalid(input);
};
var invalid = (input) => {
  throw new Error(`Invalid Input: ${input}`);
};
var zeroDurationValue = {
  _tag: "Millis",
  millis: 0
};
var infinityDurationValue = {
  _tag: "Infinity"
};
var negativeInfinityDurationValue = {
  _tag: "NegativeInfinity"
};
var DurationProto = {
  [TypeId4]: TypeId4,
  [symbol]() {
    switch (this.value._tag) {
      case "Millis": {
        const nanos2 = this.value.millis * 1e6;
        return Number.isFinite(nanos2) ? hash(roundTiesAwayFromZero(nanos2)) : number(this.value.millis);
      }
      case "Nanos":
        return hash(this.value.nanos);
      default:
        return structure(this.value);
    }
  },
  [symbol2](that) {
    return isDuration(that) && equals2(this, that);
  },
  toString() {
    switch (this.value._tag) {
      case "Infinity":
        return "Infinity";
      case "NegativeInfinity":
        return "-Infinity";
      case "Nanos":
        return `${this.value.nanos} nanos`;
      case "Millis":
        return `${this.value.millis} millis`;
    }
  },
  toJSON() {
    switch (this.value._tag) {
      case "Millis":
        return {
          _id: "Duration",
          _tag: "Millis",
          millis: this.value.millis
        };
      case "Nanos":
        return {
          _id: "Duration",
          _tag: "Nanos",
          nanos: String(this.value.nanos)
        };
      case "Infinity":
        return {
          _id: "Duration",
          _tag: "Infinity"
        };
      case "NegativeInfinity":
        return {
          _id: "Duration",
          _tag: "NegativeInfinity"
        };
    }
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var make3 = (input) => {
  const duration = Object.create(DurationProto);
  if (typeof input === "number") {
    if (isNaN(input) || input === 0 || Object.is(input, -0)) {
      duration.value = zeroDurationValue;
    } else if (!Number.isFinite(input)) {
      duration.value = input > 0 ? infinityDurationValue : negativeInfinityDurationValue;
    } else if (!Number.isInteger(input)) {
      duration.value = {
        _tag: "Nanos",
        nanos: roundMillisToNanos(input)
      };
    } else {
      duration.value = {
        _tag: "Millis",
        millis: input
      };
    }
  } else if (input === bigint0) {
    duration.value = zeroDurationValue;
  } else {
    duration.value = {
      _tag: "Nanos",
      nanos: input
    };
  }
  return duration;
};
var isDuration = (u) => hasProperty(u, TypeId4);
var isFinite = (self) => self.value._tag !== "Infinity" && self.value._tag !== "NegativeInfinity";
var isZero = (self) => {
  switch (self.value._tag) {
    case "Millis":
      return self.value.millis === 0;
    case "Nanos":
      return self.value.nanos === bigint0;
    case "Infinity":
    case "NegativeInfinity":
      return false;
  }
};
var zero = /* @__PURE__ */ make3(0);
var infinity = /* @__PURE__ */ make3(Infinity);
var negativeInfinity = /* @__PURE__ */ make3(-Infinity);
var nanos = (nanos2) => make3(nanos2);
var millis = (millis2) => make3(millis2);
var seconds = (seconds2) => make3(seconds2 * 1e3);
var minutes = (minutes2) => make3(minutes2 * 6e4);
var hours = (hours2) => make3(hours2 * 36e5);
var days = (days2) => make3(days2 * 864e5);
var weeks = (weeks2) => make3(weeks2 * 6048e5);
var toMillis = (self) => match4(fromInputUnsafe(self), {
  onMillis: identity,
  onNanos: (nanos2) => Number(nanos2) / 1e6,
  onInfinity: () => Infinity,
  onNegativeInfinity: () => -Infinity
});
var toNanosUnsafe = (input) => {
  const self = fromInputUnsafe(input);
  switch (self.value._tag) {
    case "Infinity":
    case "NegativeInfinity":
      throw new Error("Cannot convert infinite duration to nanos");
    case "Nanos":
      return self.value.nanos;
    case "Millis":
      return roundMillisToNanos(self.value.millis);
  }
};
var match4 = /* @__PURE__ */ dual(2, (self, options) => {
  switch (self.value._tag) {
    case "Millis":
      return options.onMillis(self.value.millis);
    case "Nanos":
      return options.onNanos(self.value.nanos);
    case "Infinity":
      return options.onInfinity();
    case "NegativeInfinity":
      return (options.onNegativeInfinity ?? options.onInfinity)();
  }
});
var matchPair = /* @__PURE__ */ dual(3, (self, that, options) => {
  if (self.value._tag === "Infinity" || self.value._tag === "NegativeInfinity" || that.value._tag === "Infinity" || that.value._tag === "NegativeInfinity") return options.onInfinity(self, that);
  if (self.value._tag === "Millis") {
    return that.value._tag === "Millis" ? options.onMillis(self.value.millis, that.value.millis) : options.onNanos(toNanosUnsafe(self), that.value.nanos);
  } else {
    return options.onNanos(self.value.nanos, toNanosUnsafe(that));
  }
});
var Equivalence = (self, that) => matchPair(self, that, {
  onMillis: (self2, that2) => self2 === that2,
  onNanos: (self2, that2) => self2 === that2,
  onInfinity: (self2, that2) => self2.value._tag === that2.value._tag
});
var subtract = /* @__PURE__ */ dual(2, (self, that) => matchPair(self, that, {
  onMillis: (self2, that2) => make3(self2 - that2),
  onNanos: (self2, that2) => make3(self2 - that2),
  onInfinity: (self2, that2) => {
    const s = self2.value._tag;
    const t = that2.value._tag;
    if (s === "Infinity") return t === "Infinity" ? zero : infinity;
    if (s === "NegativeInfinity") return t === "NegativeInfinity" ? zero : negativeInfinity;
    return t === "Infinity" ? negativeInfinity : infinity;
  }
}));
var equals2 = /* @__PURE__ */ dual(2, (self, that) => Equivalence(self, that));

// node_modules/effect/dist/Scheduler.js
var Scheduler = /* @__PURE__ */ Reference("effect/Scheduler", {
  fiberCached: true,
  defaultValue: () => new MixedScheduler()
});
var setImmediate = "setImmediate" in globalThis ? (f) => {
  const timer = globalThis.setImmediate(f);
  return () => globalThis.clearImmediate(timer);
} : (f) => {
  const timer = setTimeout(f, 0);
  return () => clearTimeout(timer);
};
var setMicrotask = (f) => {
  let cancelled = false;
  Promise.resolve().then(() => {
    if (!cancelled) f();
  });
  return () => {
    cancelled = true;
  };
};
var PriorityBuckets = class {
  buckets = [];
  scheduleTask(task, priority) {
    const buckets = this.buckets;
    const len = buckets.length;
    let bucket;
    let index = 0;
    for (; index < len; index++) {
      if (buckets[index][0] > priority) break;
      bucket = buckets[index];
    }
    if (bucket && bucket[0] === priority) {
      bucket[1].push(task);
    } else if (index === len) {
      buckets.push([priority, [task]]);
    } else {
      buckets.splice(index, 0, [priority, [task]]);
    }
  }
  drain() {
    const buckets = this.buckets;
    this.buckets = [];
    return buckets;
  }
};
var MixedScheduler = class {
  executionMode;
  setImmediate;
  constructor(executionMode = "async", setImmediateFn) {
    this.executionMode = executionMode;
    this.setImmediate = setImmediateFn ?? (executionMode === "sync" ? setMicrotask : setImmediate);
  }
  /**
   * Returns whether the fiber has reached its operation budget and should yield.
   *
   * **When to use**
   *
   * Use to decide whether a fiber should yield after consuming its current
   * operation budget.
   *
   * @since 2.0.0
   */
  shouldYield(fiber3) {
    return fiber3.currentOpCount >= fiber3.maxOpsBeforeYield;
  }
  /**
   * Creates a dispatcher that schedules work through this scheduler.
   *
   * **When to use**
   *
   * Use when you need a standalone dispatcher from a scheduler instance, for
   * example in tests that enqueue tasks and then flush them deterministically.
   *
   * @since 4.0.0
   */
  makeDispatcher() {
    return new MixedSchedulerDispatcher(this.setImmediate);
  }
};
var MixedSchedulerDispatcher = class {
  tasks = /* @__PURE__ */ new PriorityBuckets();
  running = void 0;
  setImmediate;
  constructor(setImmediateFn = setImmediate) {
    this.setImmediate = setImmediateFn;
  }
  /**
   * @since 2.0.0
   */
  scheduleTask(task, priority) {
    this.tasks.scheduleTask(task, priority);
    if (this.running === void 0) {
      this.running = this.setImmediate(this.afterScheduled);
    }
  }
  /**
   * @since 2.0.0
   */
  afterScheduled = () => {
    this.running = void 0;
    this.runTasks();
  };
  /**
   * @since 2.0.0
   */
  runTasks() {
    const buckets = this.tasks.drain();
    for (let i = 0; i < buckets.length; i++) {
      const toRun = buckets[i][1];
      for (let j = 0; j < toRun.length; j++) {
        toRun[j]();
      }
    }
  }
  /**
   * @since 2.0.0
   */
  flush() {
    while (this.tasks.buckets.length > 0) {
      if (this.running !== void 0) {
        this.running();
        this.running = void 0;
      }
      this.runTasks();
    }
  }
};
var MaxOpsBeforeYield = /* @__PURE__ */ Reference("effect/Scheduler/MaxOpsBeforeYield", {
  fiberCached: true,
  defaultValue: () => 2048
});
var PreventSchedulerYield = /* @__PURE__ */ Reference("effect/Scheduler/PreventSchedulerYield", {
  fiberCached: true,
  defaultValue: () => false
});

// node_modules/effect/dist/Data.js
var taggedEnum = () => new Proxy({}, {
  get(_target, tag2, _receiver) {
    if (tag2 === "$is") {
      return isTagged;
    } else if (tag2 === "$match") {
      return taggedMatch;
    }
    return (props) => ({
      ...props,
      _tag: tag2
    });
  }
});
function taggedMatch() {
  if (arguments.length === 1) {
    const cases2 = arguments[0];
    return function(value4) {
      return cases2[value4._tag](value4);
    };
  }
  const value3 = arguments[0];
  const cases = arguments[1];
  return cases[value3._tag](value3);
}
var Error3 = Error2;
var TaggedError2 = TaggedError;

// node_modules/effect/dist/Encoding.js
var EncodingErrorTypeId = "~effect/encoding/EncodingError";
var EncodingError = class extends (/* @__PURE__ */ TaggedError2("EncodingError")) {
  /**
   * Marks this value as an encoding or decoding error for runtime guards.
   *
   * **When to use**
   *
   * Use to identify `EncodingError` instances through `isEncodingError`.
   *
   * @since 4.0.0
   */
  [EncodingErrorTypeId] = EncodingErrorTypeId;
};
var encodeBase64 = (input) => typeof input === "string" ? base64EncodeUint8Array(encoder.encode(input)) : base64EncodeUint8Array(input);
var decodeBase64 = (str) => {
  const stripped = stripCrlf(str);
  const length = stripped.length;
  if (length % 4 !== 0) {
    return fail2(new EncodingError({
      kind: "Decode",
      module: "Base64",
      input: stripped,
      message: `Length must be a multiple of 4, but is ${length}`
    }));
  }
  const index = stripped.indexOf("=");
  if (index !== -1 && (index < length - 2 || index === length - 2 && stripped[length - 1] !== "=")) {
    return fail2(new EncodingError({
      kind: "Decode",
      module: "Base64",
      input: stripped,
      message: `Found a '=' character, but it is not at the end`
    }));
  }
  try {
    const missingOctets = stripped.endsWith("==") ? 2 : stripped.endsWith("=") ? 1 : 0;
    const result3 = new Uint8Array(3 * (length / 4) - missingOctets);
    for (let i = 0, j = 0; i < length; i += 4, j += 3) {
      const buffer2 = getBase64Code(stripped.charCodeAt(i)) << 18 | getBase64Code(stripped.charCodeAt(i + 1)) << 12 | getBase64Code(stripped.charCodeAt(i + 2)) << 6 | getBase64Code(stripped.charCodeAt(i + 3));
      result3[j] = buffer2 >> 16;
      result3[j + 1] = buffer2 >> 8 & 255;
      result3[j + 2] = buffer2 & 255;
    }
    return succeed2(result3);
  } catch (e) {
    return fail2(new EncodingError({
      kind: "Decode",
      module: "Base64",
      input: stripped,
      message: e instanceof Error ? e.message : "Invalid input"
    }));
  }
};
var randomHex = (length) => {
  let result3 = "";
  for (let i = length >>> 3; i > 0; i--) {
    const word = Math.random() * 4294967296 >>> 0;
    result3 += byteToHex[word >>> 24] + byteToHex[word >>> 16 & 255] + byteToHex[word >>> 8 & 255] + byteToHex[word & 255];
  }
  return result3;
};
var encoder = /* @__PURE__ */ new TextEncoder();
var stripCrlf = (str) => str.replace(/[\n\r]/g, "");
var base64EncodeUint8Array = (bytes) => {
  const length = bytes.length;
  let result3 = "";
  let i;
  for (i = 2; i < length; i += 3) {
    result3 += base64abc[bytes[i - 2] >> 2];
    result3 += base64abc[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
    result3 += base64abc[(bytes[i - 1] & 15) << 2 | bytes[i] >> 6];
    result3 += base64abc[bytes[i] & 63];
  }
  if (i === length + 1) {
    result3 += base64abc[bytes[i - 2] >> 2];
    result3 += base64abc[(bytes[i - 2] & 3) << 4];
    result3 += "==";
  }
  if (i === length) {
    result3 += base64abc[bytes[i - 2] >> 2];
    result3 += base64abc[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
    result3 += base64abc[(bytes[i - 1] & 15) << 2];
    result3 += "=";
  }
  return result3;
};
function getBase64Code(charCode) {
  if (charCode >= base64codes.length) {
    throw new TypeError(`Invalid character ${String.fromCharCode(charCode)}`);
  }
  const code2 = base64codes[charCode];
  if (code2 === 255) {
    throw new TypeError(`Invalid character ${String.fromCharCode(charCode)}`);
  }
  return code2;
}
var base64abc = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/"];
var base64codes = [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 255, 255, 255, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 0, 255, 255, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255, 255, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];
var byteToHex = [];
for (let i = 0; i < 256; i++) {
  byteToHex.push(i.toString(16).padStart(2, "0"));
}

// node_modules/effect/dist/Tracer.js
var ParentSpanKey = "effect/Tracer/ParentSpan";
var ParentSpan = class extends (/* @__PURE__ */ Service()(ParentSpanKey, {
  fiberCached: true
})) {
};
var make4 = (options) => options;
var DisablePropagation = /* @__PURE__ */ Reference("effect/Tracer/DisablePropagation", {
  defaultValue: constFalse
});
var CurrentTraceLevel = /* @__PURE__ */ Reference("effect/Tracer/CurrentTraceLevel", {
  defaultValue: () => "Info"
});
var MinimumTraceLevel = /* @__PURE__ */ Reference("effect/Tracer/MinimumTraceLevel", {
  defaultValue: () => "All"
});
var TracerKey = "effect/Tracer";
var Tracer = /* @__PURE__ */ Reference(TracerKey, {
  fiberCached: true,
  defaultValue: () => make4({
    span: (options) => new NativeSpan(options)
  })
});
var NativeSpan = class {
  _tag = "Span";
  spanId;
  traceId = "native";
  sampled;
  name;
  parent;
  annotations;
  links;
  startTime;
  kind;
  status;
  attributes;
  events = [];
  constructor(options) {
    this.name = options.name;
    this.parent = options.parent;
    this.annotations = options.annotations;
    this.links = options.links;
    this.startTime = options.startTime;
    this.kind = options.kind;
    this.sampled = options.sampled;
    this.status = {
      _tag: "Started",
      startTime: options.startTime
    };
    this.attributes = /* @__PURE__ */ new Map();
    this.traceId = getOrUndefined(options.parent)?.traceId ?? randomHex(32);
    this.spanId = randomHex(16);
  }
  end(endTime, exit3) {
    this.status = {
      _tag: "Ended",
      endTime,
      exit: exit3,
      startTime: this.status.startTime
    };
  }
  attribute(key, value3) {
    this.attributes.set(key, value3);
  }
  event(name, startTime, attributes) {
    this.events.push([name, startTime, attributes ?? {}]);
  }
  addLinks(links) {
    this.links.push(...links);
  }
};

// node_modules/effect/dist/internal/metric.js
var FiberRuntimeMetricsKey = "effect/observability/Metric/FiberRuntimeMetricsKey";

// node_modules/effect/dist/internal/references.js
var CurrentErrorReporters = /* @__PURE__ */ Reference("effect/ErrorReporter/CurrentErrorReporters", {
  defaultValue: () => /* @__PURE__ */ new Set()
});
var CurrentStackFrame = /* @__PURE__ */ Reference("effect/References/CurrentStackFrame", {
  fiberCached: true,
  defaultValue: constUndefined
});
var TracerEnabled = /* @__PURE__ */ Reference("effect/References/TracerEnabled", {
  defaultValue: constTrue
});
var TracerTimingEnabled = /* @__PURE__ */ Reference("effect/References/TracerTimingEnabled", {
  defaultValue: constTrue
});
var TracerSpanAnnotations = /* @__PURE__ */ Reference("effect/References/TracerSpanAnnotations", {
  defaultValue: () => ({})
});
var TracerSpanLinks = /* @__PURE__ */ Reference("effect/References/TracerSpanLinks", {
  defaultValue: () => []
});
var CurrentLogAnnotations = /* @__PURE__ */ Reference("effect/References/CurrentLogAnnotations", {
  defaultValue: () => ({})
});
var CurrentLogLevel = /* @__PURE__ */ Reference("effect/References/CurrentLogLevel", {
  fiberCached: true,
  defaultValue: () => "Info"
});
var MinimumLogLevel = /* @__PURE__ */ Reference("effect/References/MinimumLogLevel", {
  fiberCached: true,
  defaultValue: () => "Info"
});
var CurrentLogSpans = /* @__PURE__ */ Reference("effect/References/CurrentLogSpans", {
  defaultValue: () => []
});

// node_modules/effect/dist/internal/stackTraceLimit.js
var isStackTraceLimitWritable = () => {
  const desc = Object.getOwnPropertyDescriptor(Error, "stackTraceLimit");
  if (desc === void 0) {
    return Object.isExtensible(Error);
  }
  return Object.hasOwn(desc, "writable") ? desc.writable === true : desc.set !== void 0;
};
var canWriteStackTraceLimit = /* @__PURE__ */ isStackTraceLimitWritable();
var getStackTraceLimit = () => Error.stackTraceLimit;
var setStackTraceLimit = (value3) => {
  if (canWriteStackTraceLimit) {
    ;
    Error.stackTraceLimit = value3;
  }
};

// node_modules/effect/dist/internal/tracer.js
var addSpanStackTrace = (options) => {
  if (options?.captureStackTrace === false) {
    return options;
  } else if (options?.captureStackTrace !== void 0 && typeof options.captureStackTrace !== "boolean") {
    return options;
  }
  const limit = getStackTraceLimit();
  setStackTraceLimit(3);
  const traceError = new Error();
  setStackTraceLimit(limit);
  return {
    ...options,
    captureStackTrace: spanCleaner(() => traceError.stack)
  };
};
var makeStackCleaner = (line) => (stack) => {
  let cache;
  return () => {
    if (cache !== void 0) return cache;
    const trace2 = stack();
    if (!trace2) return void 0;
    const lines2 = trace2.split("\n");
    if (lines2[line] !== void 0) {
      cache = lines2[line].trim();
      return cache;
    }
  };
};
var spanCleaner = /* @__PURE__ */ makeStackCleaner(3);

// node_modules/effect/dist/internal/effect.js
var Interrupt = class extends ReasonBase {
  fiberId;
  constructor(fiberId3, annotations = constEmptyAnnotations) {
    super("Interrupt", annotations, "Interrupted");
    this.fiberId = fiberId3;
  }
  toString() {
    return `Interrupt(${this.fiberId})`;
  }
  toJSON() {
    return {
      _tag: "Interrupt",
      fiberId: this.fiberId
    };
  }
  [symbol2](that) {
    return isInterruptReason(that) && this.fiberId === that.fiberId && this.annotations === that.annotations;
  }
  [symbol]() {
    return combine(string(`${this._tag}:${this.fiberId}`))(random(this.annotations));
  }
};
var causeInterrupt = (fiberId3) => new CauseImpl([new Interrupt(fiberId3)]);
var findFail = (self) => {
  const reason = self.reasons.find(isFailReason);
  return reason ? succeed2(reason) : fail2(self);
};
var findError = (self) => {
  for (let i = 0; i < self.reasons.length; i++) {
    const reason = self.reasons[i];
    if (reason._tag === "Fail") {
      return succeed2(reason.error);
    }
  }
  return fail2(self);
};
var hasDies = (self) => self.reasons.some(isDieReason);
var findDefect = (self) => {
  const reason = self.reasons.find(isDieReason);
  return reason ? succeed2(reason.defect) : fail2(self);
};
var hasInterrupts = (self) => self.reasons.some(isInterruptReason);
var causeFilterInterruptors = (self) => {
  let interruptors;
  for (let i = 0; i < self.reasons.length; i++) {
    const f = self.reasons[i];
    if (f._tag !== "Interrupt") continue;
    interruptors ??= /* @__PURE__ */ new Set();
    if (f.fiberId !== void 0) {
      interruptors.add(f.fiberId);
    }
  }
  return interruptors ? succeed2(interruptors) : fail2(self);
};
var hasInterruptsOnly = (self) => self.reasons.length > 0 && self.reasons.every(isInterruptReason);
var causeCombine = /* @__PURE__ */ dual(2, (self, that) => {
  if (self.reasons.length === 0) {
    return that;
  } else if (that.reasons.length === 0) {
    return self;
  }
  const newCause = new CauseImpl(union(self.reasons, that.reasons));
  return equals(self, newCause) ? self : newCause;
});
var causeMap = /* @__PURE__ */ dual(2, (self, f) => {
  let hasFail = false;
  const failures = self.reasons.map((failure) => {
    if (isFailReason(failure)) {
      hasFail = true;
      return new Fail(f(failure.error), failure.annotations);
    }
    return failure;
  });
  return hasFail ? causeFromReasons(failures) : self;
});
var causePartition = (self) => {
  const obj = {
    Fail: [],
    Die: [],
    Interrupt: []
  };
  for (let i = 0; i < self.reasons.length; i++) {
    obj[self.reasons[i]._tag].push(self.reasons[i]);
  }
  return obj;
};
var causeSquash = (self) => {
  const partitioned = causePartition(self);
  if (partitioned.Fail.length > 0) {
    return partitioned.Fail[0].error;
  } else if (partitioned.Die.length > 0) {
    return partitioned.Die[0].defect;
  } else if (partitioned.Interrupt.length > 0) {
    return new globalThis.Error("All fibers interrupted without error");
  }
  return new globalThis.Error("Empty cause");
};
var causePrettyErrors = (self, options) => {
  const errors = [];
  const interrupts = [];
  if (self.reasons.length === 0) return errors;
  const prevStackLimit = getStackTraceLimit();
  setStackTraceLimit(1);
  for (const failure of self.reasons) {
    if (failure._tag === "Interrupt") {
      interrupts.push(failure);
      continue;
    }
    errors.push(causePrettyError(failure._tag === "Die" ? failure.defect : failure.error, failure.annotations, options));
  }
  if (errors.length === 0) {
    const cause = new Error("The fiber was interrupted by:");
    cause.name = "InterruptCause";
    cause.stack = interruptCauseStack(cause, interrupts);
    const error2 = new globalThis.Error("All fibers interrupted without error", {
      cause
    });
    error2.name = "InterruptError";
    error2.stack = `${error2.name}: ${error2.message}`;
    errors.push(causePrettyError(error2, interrupts[0].annotations, options));
  }
  setStackTraceLimit(prevStackLimit);
  return errors;
};
var causePrettyError = (original, annotations, options) => {
  const kind = typeof original;
  let error2;
  if (original && kind === "object") {
    error2 = new globalThis.Error(causePrettyMessage(original), {
      cause: original.cause ? causePrettyError(original.cause) : void 0
    });
    if (typeof original.name === "string") {
      error2.name = original.name;
    }
    if (typeof original.stack === "string") {
      error2.stack = cleanErrorStack(original.stack, error2, annotations);
    } else {
      const stack = `${error2.name}: ${error2.message}`;
      error2.stack = annotations ? addStackAnnotations(stack, annotations) : stack;
    }
    if (options?.includeCauseInStack) {
      error2.stack = renderPrettyError(error2);
    }
    for (const key of Object.keys(original)) {
      if (!(key in error2)) {
        ;
        error2[key] = original[key];
      }
    }
  } else {
    error2 = new globalThis.Error(!original ? `Unknown error: ${original}` : kind === "string" ? original : formatJson(original));
  }
  return error2;
};
var causePrettyMessage = (u) => {
  if (typeof u.message === "string") {
    return u.message;
  } else if (typeof u.toString === "function" && u.toString !== Object.prototype.toString && u.toString !== Array.prototype.toString) {
    try {
      return u.toString();
    } catch {
    }
  }
  return formatJson(u);
};
var locationRegExp = /\((.*)\)/g;
var cleanErrorStack = (stack, error2, annotations) => {
  const message = `${error2.name}: ${error2.message}`;
  const lines2 = (stack.startsWith(message) ? stack.slice(message.length) : stack).split("\n");
  const out = [message];
  for (let i = 1; i < lines2.length; i++) {
    if (/(?:Generator\.next|~effect\/Effect)/.test(lines2[i])) {
      break;
    }
    out.push(lines2[i]);
  }
  return annotations ? addStackAnnotations(out.join("\n"), annotations) : out.join("\n");
};
var addStackAnnotations = (stack, annotations) => {
  const frame = annotations?.get(StackTraceKey.key);
  if (frame) {
    stack = `${stack}
${currentStackTrace(frame)}`;
  }
  return stack;
};
var interruptCauseStack = (error2, interrupts) => {
  const out = [`${error2.name}: ${error2.message}`];
  for (const current of interrupts) {
    const fiberId3 = current.fiberId !== void 0 ? `#${current.fiberId}` : "unknown";
    const frame = current.annotations.get(InterruptorStackTrace.key);
    out.push(`    at fiber (${fiberId3})`);
    if (frame) out.push(currentStackTrace(frame));
  }
  return out.join("\n");
};
var currentStackTrace = (frame) => {
  const out = [];
  let current = frame;
  let i = 0;
  while (current && i < 10) {
    const stack = current.stack();
    if (stack) {
      const locationMatchAll = stack.matchAll(locationRegExp);
      let match7 = false;
      for (const [, location] of locationMatchAll) {
        match7 = true;
        out.push(`    at ${current.name} (${location})`);
      }
      if (!match7) {
        out.push(`    at ${current.name} (${stack.replace(/^at /, "")})`);
      }
    } else {
      out.push(`    at ${current.name}`);
    }
    current = current.parent;
    i++;
  }
  return out.join("\n");
};
var causePretty = (cause) => causePrettyErrors(cause).map(renderPrettyError).join("\n");
var renderPrettyError = (e) => e.cause ? `${e.stack} {
${renderErrorCause(e.cause, "  ")}
}` : e.stack;
var renderErrorCause = (cause, prefix) => {
  const lines2 = cause.stack.split("\n");
  let stack = `${prefix}[cause]: ${lines2[0]}`;
  for (let i = 1, len = lines2.length; i < len; i++) {
    stack += `
${prefix}${lines2[i]}`;
  }
  if (cause.cause) {
    stack += ` {
${renderErrorCause(cause.cause, `${prefix}  `)}
${prefix}}`;
  }
  return stack;
};
var FiberTypeId = "~effect/Fiber";
var fiberVariance = {
  _A: identity,
  _E: identity
};
var fiberIdStore = {
  id: 0
};
var getCurrentFiber = () => globalThis[currentFiberTypeId];
var FiberImpl = class {
  constructor(context3, interruptible3 = true) {
    this[FiberTypeId] = fiberVariance;
    this.setContext(context3);
    this.id = ++fiberIdStore.id;
    this.currentOpCount = 0;
    this.interruptible = interruptible3;
    this._stack = [];
    this._observers = [];
    this._exit = void 0;
    this._children = void 0;
    this._interruptedCause = void 0;
    this._yielded = void 0;
    this._running = false;
    this._deferredInterrupt = false;
    this.runtimeMetrics?.recordFiberStart(this.context);
  }
  [FiberTypeId];
  id;
  interruptible;
  currentOpCount;
  _stack;
  _observers;
  _exit;
  _children;
  _interruptedCause;
  _yielded;
  _running;
  _deferredInterrupt;
  // set in setContext
  context;
  currentScheduler;
  currentTracerContext;
  currentSpan;
  currentLogLevel;
  minimumLogLevel;
  currentStackFrame;
  runtimeMetrics;
  maxOpsBeforeYield;
  currentPreventYield;
  _dispatcher = void 0;
  get currentDispatcher() {
    return this._dispatcher ??= this.currentScheduler.makeDispatcher();
  }
  getRef(ref) {
    return get(this.context, ref);
  }
  addObserver(cb) {
    if (this._exit) {
      cb(this._exit);
      return constVoid;
    }
    this._observers.push(cb);
    return () => {
      if (this._exit) return;
      const index = this._observers.indexOf(cb);
      if (index >= 0) {
        this._observers.splice(index, 1);
      }
    };
  }
  interruptUnsafe(fiberId3, annotations) {
    if (this._exit) {
      return;
    }
    let cause = causeInterrupt(fiberId3);
    if (this.currentStackFrame) {
      cause = causeAnnotate(cause, make2(StackTraceKey, this.currentStackFrame));
    }
    if (annotations) {
      cause = causeAnnotate(cause, annotations);
    }
    this._interruptedCause = this._interruptedCause ? causeCombine(this._interruptedCause, cause) : cause;
    if (this.interruptible) {
      if (this._running) {
        this._deferredInterrupt = true;
      } else {
        this.evaluate(failCause(this._interruptedCause));
      }
    }
  }
  pollUnsafe() {
    return this._exit;
  }
  evaluate(effect2) {
    if (this._exit) {
      return;
    } else if (this._yielded !== void 0) {
      const yielded = this._yielded;
      this._yielded = void 0;
      yielded();
    }
    const exit3 = this.runLoop(effect2);
    if (exit3 === Yield) {
      return;
    }
    const interruptChildren = fiberMiddleware.interruptChildren && fiberMiddleware.interruptChildren(this);
    if (interruptChildren !== void 0) {
      return this.evaluate(flatMap2(interruptChildren, () => exit3));
    }
    this._exit = exit3;
    this.runtimeMetrics?.recordFiberEnd(this.context, this._exit);
    for (let i = 0; i < this._observers.length; i++) {
      this._observers[i](exit3);
    }
    this._observers.length = 0;
    this._stack.length = 0;
    this._children = void 0;
    this.context = empty();
  }
  runLoop(effect2) {
    const prevFiber = globalThis[currentFiberTypeId];
    globalThis[currentFiberTypeId] = this;
    const prevRunning = this._running;
    this._running = true;
    let yielding = false;
    let current = effect2;
    this.currentOpCount = 0;
    try {
      while (true) {
        if (this._deferredInterrupt) {
          this._deferredInterrupt = false;
          current = failCause(this._interruptedCause);
        }
        this.currentOpCount++;
        if (!yielding && !this.currentPreventYield && this.currentScheduler.shouldYield(this)) {
          yielding = true;
          const prev = current;
          current = flatMap2(yieldNow, () => prev);
        }
        current = this.currentTracerContext ? this.currentTracerContext(current, this) : current[evaluate](this);
        if (current === Yield) {
          const yielded = this._yielded;
          if (ExitTypeId in yielded) {
            this._deferredInterrupt = false;
            this._yielded = void 0;
            return yielded;
          } else if (this._deferredInterrupt) {
            this._yielded = void 0;
            yielded();
            continue;
          }
          return Yield;
        }
      }
    } catch (error2) {
      if (!hasProperty(current, evaluate)) {
        return exitDie(`Fiber.runLoop: Not a valid effect: ${String(current)}`);
      }
      return this.runLoop(exitDie(error2));
    } finally {
      this._running = prevRunning;
      globalThis[currentFiberTypeId] = prevFiber;
    }
  }
  getCont(symbol4) {
    if (this._deferredInterrupt) {
      this._deferredInterrupt = false;
      return deferredInterruptCont;
    }
    while (true) {
      const op = this._stack.pop();
      if (!op) return void 0;
      const cont = op[contAll] && op[contAll](this);
      if (cont) {
        ;
        cont[symbol4] = cont;
        return cont;
      }
      if (op[symbol4]) return op;
    }
  }
  yieldWith(value3) {
    this._yielded = value3;
    return Yield;
  }
  children() {
    return this._children ??= /* @__PURE__ */ new Set();
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  setContext(context3) {
    const previous = this.context;
    this.context = context3;
    if (previous !== void 0 && hasSameCache(previous, context3)) return;
    const scheduler = this.getRef(Scheduler);
    if (scheduler !== this.currentScheduler) {
      this.currentScheduler = scheduler;
      this._dispatcher = void 0;
    }
    this.currentSpan = getOrUndefinedUnsafe(context3, ParentSpanKey);
    this.currentLogLevel = this.getRef(CurrentLogLevel);
    this.minimumLogLevel = this.getRef(MinimumLogLevel);
    this.currentStackFrame = this.getRef(CurrentStackFrame);
    this.maxOpsBeforeYield = this.getRef(MaxOpsBeforeYield);
    this.currentPreventYield = this.getRef(PreventSchedulerYield);
    this.runtimeMetrics = getOrUndefinedUnsafe(context3, FiberRuntimeMetricsKey);
    const currentTracer = getOrUndefinedUnsafe(context3, TracerKey);
    this.currentTracerContext = currentTracer ? currentTracer["context"] : void 0;
  }
  get currentSpanLocal() {
    return this.currentSpan?._tag === "Span" ? this.currentSpan : void 0;
  }
};
var deferredInterruptCont = {
  [contA](_value, fiber3) {
    return failCause(fiber3._interruptedCause);
  },
  [contE](_cause, fiber3) {
    return failCause(fiber3._interruptedCause);
  }
};
var fiberMiddleware = {
  interruptChildren: void 0
};
var fiberStackAnnotations = (fiber3) => {
  if (!fiber3.currentStackFrame) return void 0;
  const annotations = /* @__PURE__ */ new Map();
  annotations.set(InterruptorStackTrace.key, fiber3.currentStackFrame);
  return makeUnsafe(annotations);
};
var fiberInterruptChildren = (fiber3) => {
  if (fiber3._children === void 0 || fiber3._children.size === 0) {
    return void 0;
  }
  return fiberInterruptAll(fiber3._children);
};
var fiberAwait = (self) => {
  const impl = self;
  if (impl._exit) return succeed3(impl._exit);
  return callback((resume) => {
    if (impl._exit) return resume(succeed3(impl._exit));
    return sync(self.addObserver((exit3) => resume(succeed3(exit3))));
  });
};
var fiberAwaitAll = (self) => callback((resume) => {
  const iter = self[Symbol.iterator]();
  const exits = [];
  let cancel = void 0;
  function loop() {
    let result3 = iter.next();
    while (!result3.done) {
      if (result3.value._exit) {
        exits.push(result3.value._exit);
        result3 = iter.next();
        continue;
      }
      cancel = result3.value.addObserver((exit3) => {
        exits.push(exit3);
        loop();
      });
      return;
    }
    resume(succeed3(exits));
  }
  loop();
  return sync(() => cancel?.());
});
var fiberJoin = (self) => {
  const impl = self;
  if (impl._exit) return impl._exit;
  return callback((resume) => {
    if (impl._exit) return resume(impl._exit);
    return sync(self.addObserver(resume));
  });
};
var fiberInterrupt = (self) => withFiber((fiber3) => fiberInterruptAs(self, fiber3.id));
var fiberInterruptAs = /* @__PURE__ */ dual((args2) => hasProperty(args2[0], FiberTypeId), (self, fiberId3, annotations) => withFiber((parent) => {
  let ann = fiberStackAnnotations(parent);
  ann = ann && annotations ? merge(ann, annotations) : ann ?? annotations;
  self.interruptUnsafe(fiberId3, ann);
  return asVoid(fiberAwait(self));
}));
var fiberInterruptAll = (fibers) => withFiber((parent) => {
  const annotations = fiberStackAnnotations(parent);
  let fiberArr = empty2();
  for (const fiber3 of fibers) {
    fiber3.interruptUnsafe(parent.id, annotations);
    fiberArr.push(fiber3);
  }
  return asVoid(fiberAwaitAll(fiberArr));
});
var succeed3 = exitSucceed;
var failCause = exitFailCause;
var fail3 = exitFail;
var sync = /* @__PURE__ */ makePrimitive({
  op: "Sync",
  [evaluate](fiber3) {
    const value3 = this[args]();
    const cont = fiber3.getCont(contA);
    return cont ? cont[contA](value3, fiber3) : fiber3.yieldWith(exitSucceed(value3));
  }
});
var suspend = /* @__PURE__ */ makePrimitive({
  op: "Suspend",
  [evaluate](_fiber) {
    return this[args]();
  }
});
var fromOption2 = /* @__PURE__ */ dual((args2) => args2.length >= 2 || isOption2(args2[0]), (option4, onNone) => isNone2(option4) ? fail3(onNone ? onNone() : new NoSuchElementError("Effect.fromOption: Option.none")) : succeed3(option4.value));
var fromResult = /* @__PURE__ */ match2({
  onFailure: fail3,
  onSuccess: succeed3
});
var fromNullishOr2 = (value3) => value3 == null ? fail3(new NoSuchElementError()) : succeed3(value3);
var yieldNowWith = /* @__PURE__ */ makePrimitive({
  op: "Yield",
  [evaluate](fiber3) {
    let resumed = false;
    fiber3.currentDispatcher.scheduleTask(() => {
      if (resumed) return;
      fiber3.evaluate(exitVoid);
    }, this[args] ?? 0);
    return fiber3.yieldWith(() => {
      resumed = true;
    });
  }
});
var yieldNow = /* @__PURE__ */ yieldNowWith(0);
var succeedSome = (a) => succeed3(some2(a));
var succeedNone = /* @__PURE__ */ succeed3(/* @__PURE__ */ none2());
var transposeOption = (self) => isNone2(self) ? succeedNone : map4(self.value, some2);
var failCauseSync = (evaluate2) => suspend(() => failCause(internalCall(evaluate2)));
var die = (defect) => exitDie(defect);
var failSync = (error2) => suspend(() => fail3(internalCall(error2)));
var void_ = /* @__PURE__ */ succeed3(void 0);
var try_ = (options) => {
  const evaluate2 = typeof options === "function" ? options : options.try;
  const catcher = typeof options === "function" ? (cause) => new UnknownError(cause, "An error occurred in Effect.try") : options.catch;
  return suspend(() => {
    try {
      return succeed3(internalCall(evaluate2));
    } catch (err) {
      return fail3(internalCall(() => catcher(err)));
    }
  });
};
var promise = (evaluate2) => callbackOptions(function(resume, signal) {
  internalCall(() => evaluate2(signal)).then((a) => resume(succeed3(a)), (e) => resume(die(e)));
}, evaluate2.length !== 0);
var tryPromise = (options) => {
  const f = typeof options === "function" ? options : options.try;
  const catcher = typeof options === "function" ? (cause) => new UnknownError(cause, "An error occurred in Effect.tryPromise") : options.catch;
  return callbackOptions(function(resume, signal) {
    const failWithCatch = (cause) => {
      try {
        resume(fail3(internalCall(() => catcher(cause))));
      } catch (err) {
        resume(die(err));
      }
    };
    try {
      internalCall(() => f(signal)).then((a) => resume(succeed3(a)), failWithCatch);
    } catch (err) {
      failWithCatch(err);
    }
  }, f.length !== 0);
};
var withFiberId = (f) => withFiber((fiber3) => f(fiber3.id));
var fiber = /* @__PURE__ */ withFiber(succeed3);
var fiberId = /* @__PURE__ */ withFiberId(succeed3);
var callbackOptions = /* @__PURE__ */ makePrimitive({
  op: "Async",
  single: false,
  [evaluate](fiber3) {
    const register = internalCall(() => this[args][0].bind(fiber3.currentScheduler));
    let resumed = false;
    let yielded = false;
    const controller = this[args][1] ? new AbortController() : void 0;
    const onCancel = register((effect2) => {
      if (resumed) return;
      resumed = true;
      if (yielded) {
        fiber3.evaluate(effect2);
      } else {
        yielded = effect2;
      }
    }, controller?.signal);
    if (yielded !== false) return yielded;
    yielded = true;
    fiber3._yielded = () => {
      resumed = true;
    };
    if (controller === void 0 && onCancel === void 0) {
      return Yield;
    }
    fiber3._stack.push(asyncFinalizer(() => {
      resumed = true;
      controller?.abort();
      return onCancel ?? exitVoid;
    }));
    return Yield;
  }
});
var asyncFinalizer = /* @__PURE__ */ makePrimitive({
  op: "AsyncFinalizer",
  [contAll](fiber3) {
    if (fiber3.interruptible) {
      fiber3.interruptible = false;
      fiber3._stack.push(setInterruptibleTrue);
    }
  },
  [contE](cause, _fiber) {
    return hasInterrupts(cause) ? flatMap2(this[args](), () => failCause(cause)) : failCause(cause);
  }
});
var callback = (register) => callbackOptions(register, register.length >= 2);
var never = /* @__PURE__ */ callback(constVoid);
var gen = (...args2) => suspend(() => fromIteratorUnsafe(args2.length === 1 ? args2[0]() : args2[1].call(args2[0].self)));
var fnUntraced = (body, ...pipeables) => {
  const fn3 = pipeables.length === 0 ? function() {
    return suspend(() => fromIteratorUnsafe(body.apply(this, arguments)));
  } : function() {
    let effect2 = suspend(() => fromIteratorUnsafe(body.apply(this, arguments)));
    for (let i = 0; i < pipeables.length; i++) {
      effect2 = pipeables[i](effect2, ...arguments);
    }
    return effect2;
  };
  return defineFunctionLength(body.length, fn3);
};
var defineFunctionLength = (length, fn3) => Object.defineProperty(fn3, "length", {
  value: length,
  configurable: true
});
var fnStackCleaner = /* @__PURE__ */ makeStackCleaner(2);
var fn = function() {
  const nameFirst = typeof arguments[0] === "string";
  const name = nameFirst ? arguments[0] : "Effect.fn";
  const spanOptions = nameFirst ? arguments[1] : void 0;
  const prevLimit = getStackTraceLimit();
  setStackTraceLimit(2);
  const defError = new globalThis.Error();
  setStackTraceLimit(prevLimit);
  if (nameFirst) {
    return (body, ...pipeables) => makeFn(name, body, defError, pipeables, nameFirst, spanOptions);
  }
  return makeFn(name, arguments[0], defError, Array.prototype.slice.call(arguments, 1), nameFirst, spanOptions);
};
var makeFn = (name, bodyOrOptions, defError, pipeables, addSpan, spanOptions) => {
  const body = typeof bodyOrOptions === "function" ? bodyOrOptions : pipeables.shift().bind(bodyOrOptions.self);
  return defineFunctionLength(body.length, function(...args2) {
    let result3 = suspend(() => {
      const iter = body.apply(this, arguments);
      return isEffect(iter) ? iter : fromIteratorUnsafe(iter);
    });
    for (let i = 0; i < pipeables.length; i++) {
      result3 = pipeables[i](result3, ...args2);
    }
    if (!isEffect(result3)) {
      return result3;
    }
    const prevLimit = getStackTraceLimit();
    setStackTraceLimit(2);
    const callError = new globalThis.Error();
    setStackTraceLimit(prevLimit);
    return updateService(addSpan ? useSpan(name, spanOptions, (span) => provideParentSpan(result3, span)) : result3, CurrentStackFrame, (prev) => ({
      name,
      stack: fnStackCleaner(() => callError.stack),
      parent: {
        name: `${name} (definition)`,
        stack: fnStackCleaner(() => defError.stack),
        parent: prev
      }
    }));
  });
};
var fnUntracedEager = (body, ...pipeables) => defineFunctionLength(body.length, pipeables.length === 0 ? function() {
  return fromIteratorEagerUnsafe(() => body.apply(this, arguments));
} : function() {
  let effect2 = fromIteratorEagerUnsafe(() => body.apply(this, arguments));
  for (const pipeable of pipeables) {
    effect2 = pipeable(effect2);
  }
  return effect2;
});
var fromIteratorEagerUnsafe = (evaluate2) => {
  try {
    const iterator = evaluate2();
    let value3 = void 0;
    while (true) {
      const state = iterator.next(value3);
      if (state.done) {
        return succeed3(state.value);
      }
      const primitive = state.value;
      if (primitive && primitive._tag === "Success") {
        value3 = primitive.value;
        continue;
      } else if (primitive && primitive._tag === "Failure") {
        return state.value;
      } else {
        let isFirstExecution = true;
        return suspend(() => {
          if (isFirstExecution) {
            isFirstExecution = false;
            return flatMap2(state.value, (value4) => fromIteratorUnsafe(iterator, value4));
          } else {
            return suspend(() => fromIteratorUnsafe(evaluate2()));
          }
        });
      }
    }
  } catch (error2) {
    return die(error2);
  }
};
var fromIteratorUnsafe = /* @__PURE__ */ makePrimitive({
  op: "Iterator",
  single: false,
  [contA](value3, fiber3) {
    const iter = this[args][0];
    while (true) {
      const state = iter.next(value3);
      if (state.done) return succeed3(state.value);
      if (!effectIsExit(state.value)) {
        fiber3._stack.push(this);
        return state.value;
      } else if (state.value._tag === "Failure") {
        return state.value;
      }
      value3 = state.value.value;
    }
  },
  [evaluate](fiber3) {
    return this[contA](this[args][1], fiber3);
  }
});
var as = /* @__PURE__ */ dual(2, (self, value3) => {
  const b = succeed3(value3);
  return flatMap2(self, (_) => b);
});
var asSome = (self) => map4(self, some2);
var flip = (self) => matchEffect(self, {
  onFailure: succeed3,
  onSuccess: fail3
});
var andThen = /* @__PURE__ */ dual(2, (self, f) => flatMap2(self, (a) => isEffect(f) ? f : internalCall(() => f(a))));
var tap = /* @__PURE__ */ dual(2, (self, f) => flatMap2(self, (a) => as(isEffect(f) ? f : internalCall(() => f(a)), a)));
var asVoid = (self) => flatMap2(self, (_) => exitVoid);
var sandbox = (self) => catchCause(self, fail3);
var raceAll = (all3, options) => withFiber((parent) => callback((resume) => {
  const effects = fromIterable(all3);
  const len = effects.length;
  let doneCount = 0;
  let done4 = false;
  const fibers = /* @__PURE__ */ new Set();
  const failures = [];
  const onExit4 = (exit3, fiber3, i) => {
    doneCount++;
    if (exit3._tag === "Failure") {
      failures.push(...exit3.cause.reasons);
      if (doneCount >= len) {
        resume(failCause(causeFromReasons(failures)));
      }
      return;
    }
    const isWinner = !done4;
    done4 = true;
    resume(fibers.size === 0 ? exit3 : flatMap2(uninterruptible(fiberInterruptAll(fibers)), () => exit3));
    if (isWinner && options?.onWinner) {
      options.onWinner({
        fiber: fiber3,
        index: i,
        parentFiber: parent
      });
    }
  };
  for (let i = 0; i < len; i++) {
    const fiber3 = forkUnsafe(parent, effects[i], true, true, false);
    fibers.add(fiber3);
    fiber3.addObserver((exit3) => {
      fibers.delete(fiber3);
      onExit4(exit3, fiber3, i);
    });
    if (done4) break;
  }
  return fiberInterruptAll(fibers);
}));
var raceAllFirst = (all3, options) => withFiber((parent) => callback((resume) => {
  let done4 = false;
  const fibers = /* @__PURE__ */ new Set();
  const onExit4 = (exit3) => {
    done4 = true;
    resume(fibers.size === 0 ? exit3 : flatMap2(uninterruptible(fiberInterruptAll(fibers)), () => exit3));
  };
  let i = 0;
  for (const effect2 of all3) {
    if (done4) break;
    const index = i++;
    const fiber3 = forkUnsafe(parent, effect2, true, true, false);
    fibers.add(fiber3);
    fiber3.addObserver((exit3) => {
      fibers.delete(fiber3);
      const isWinner = !done4;
      onExit4(exit3);
      if (isWinner && options?.onWinner) {
        options.onWinner({
          fiber: fiber3,
          index,
          parentFiber: parent
        });
      }
    });
  }
  return fiberInterruptAll(fibers);
}));
var race = /* @__PURE__ */ dual((args2) => isEffect(args2[1]), (self, that, options) => raceAll([self, that], options));
var raceFirst = /* @__PURE__ */ dual((args2) => isEffect(args2[1]), (self, that, options) => raceAllFirst([self, that], options));
var flatMap2 = /* @__PURE__ */ dual(2, (self, f) => {
  const onSuccess = Object.create(OnSuccessProto);
  onSuccess[args] = self;
  onSuccess[contA] = f.length !== 1 ? (a) => f(a) : f;
  return onSuccess;
});
var OnSuccessProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnSuccess",
  [evaluate](fiber3) {
    fiber3._stack.push(this);
    return this[args];
  }
});
var matchCauseEffectEager = /* @__PURE__ */ dual(2, (self, options) => {
  if (effectIsExit(self)) {
    return self._tag === "Success" ? options.onSuccess(self.value) : options.onFailure(self.cause);
  }
  return matchCauseEffect(self, options);
});
var effectIsExit = (effect2) => ExitTypeId in effect2;
var flatMapEager = /* @__PURE__ */ dual(2, (self, f) => {
  if (effectIsExit(self)) {
    return self._tag === "Success" ? f(self.value) : self;
  }
  return flatMap2(self, f);
});
var flatten2 = (self) => flatMap2(self, identity);
var map4 = /* @__PURE__ */ dual(2, (self, f) => flatMap2(self, (a) => succeed3(internalCall(() => f(a)))));
var mapEager = /* @__PURE__ */ dual(2, (self, f) => effectIsExit(self) ? exitMap(self, f) : map4(self, f));
var mapErrorEager = /* @__PURE__ */ dual(2, (self, f) => effectIsExit(self) ? exitMapError(self, f) : mapError(self, f));
var mapBothEager = /* @__PURE__ */ dual(2, (self, options) => effectIsExit(self) ? exitMapBoth(self, options) : mapBoth(self, options));
var catchEager = /* @__PURE__ */ dual(2, (self, f) => {
  if (effectIsExit(self)) {
    if (self._tag === "Success") return self;
    const error2 = findError(self.cause);
    if (isFailure2(error2)) return self;
    return f(error2.success);
  }
  return catch_(self, f);
});
var exitInterrupt = (fiberId3) => exitFailCause(causeInterrupt(fiberId3));
var exitIsSuccess = (self) => self._tag === "Success";
var exitIsFailure = (self) => self._tag === "Failure";
var exitFilterCause = (self) => self._tag === "Failure" ? succeed2(self.cause) : fail2(self);
var exitHasInterrupts = (self) => self._tag === "Failure" && hasInterrupts(self.cause);
var exitVoid = /* @__PURE__ */ exitSucceed(void 0);
var exitMap = /* @__PURE__ */ dual(2, (self, f) => self._tag === "Success" ? exitSucceed(f(self.value)) : self);
var exitMapError = /* @__PURE__ */ dual(2, (self, f) => {
  if (self._tag === "Success") return self;
  const error2 = findError(self.cause);
  if (isFailure2(error2)) return self;
  return exitFail(f(error2.success));
});
var exitMapBoth = /* @__PURE__ */ dual(2, (self, options) => {
  if (self._tag === "Success") return exitSucceed(options.onSuccess(self.value));
  const error2 = findError(self.cause);
  if (isFailure2(error2)) return self;
  return exitFail(options.onFailure(error2.success));
});
var exitZipRight = /* @__PURE__ */ dual(2, (self, that) => exitIsSuccess(self) ? that : self);
var exitAsVoidAll = (exits) => {
  const failures = [];
  for (const exit3 of exits) {
    if (exit3._tag === "Failure") {
      failures.push(...exit3.cause.reasons);
    }
  }
  return failures.length === 0 ? exitVoid : exitFailCause(causeFromReasons(failures));
};
var service = (service3) => service3;
var serviceOption = (service3) => withFiber((fiber3) => succeed3(getOption(fiber3.context, service3)));
var serviceOptional = (service3) => withFiber((fiber3) => fromOption2(getOption(fiber3.context, service3)));
var updateContext = /* @__PURE__ */ dual(2, (self, f) => withFiber((fiber3) => {
  const prevContext = fiber3.context;
  const nextContext = f(prevContext);
  if (prevContext === nextContext) return self;
  fiber3.setContext(nextContext);
  return onExitPrimitive(self, () => {
    fiber3.setContext(prevContext);
    return void 0;
  });
}));
var updateService = /* @__PURE__ */ dual(3, (self, service3, f) => updateContext(self, (s) => {
  const prev = getUnsafe(s, service3);
  const next = f(prev);
  if (prev === next) return s;
  return add(s, service3, next);
}));
var updateServiceScoped = (service3, update2, options) => uninterruptible(withFiber((fiber3) => {
  const original = getUnsafe(fiber3.context, service3);
  const updated = update2(original);
  fiber3.setContext(add(fiber3.context, service3, updated));
  return scopeAddFinalizerExit(getUnsafe(fiber3.context, scopeTag), (_) => {
    const current = getUnsafe(fiber3.context, service3);
    let next;
    if (options?.reset === void 0) {
      if (current !== updated) return void_;
      next = original;
    } else {
      next = options.reset(original, updated, current);
    }
    fiber3.setContext(add(fiber3.context, service3, next));
    return void_;
  });
}));
var context = () => getContext;
var getContext = /* @__PURE__ */ withFiber((fiber3) => succeed3(fiber3.context));
var contextWith = (f) => withFiber((fiber3) => f(fiber3.context));
var setContext = /* @__PURE__ */ dual(2, (self, context3) => updateContext(self, constant(context3)));
var provideContext = /* @__PURE__ */ dual(2, (self, context3) => {
  if (effectIsExit(self)) return self;
  return updateContext(self, merge(context3));
});
var provideService = function() {
  if (arguments.length === 1) {
    return dual(2, (self, impl) => provideServiceImpl(self, arguments[0], impl));
  }
  return dual(3, (self, service3, impl) => provideServiceImpl(self, service3, impl)).apply(this, arguments);
};
var provideServiceImpl = (self, service3, implementation) => updateContext(self, add(service3, implementation));
var provideServiceEffect = /* @__PURE__ */ dual(3, (self, service3, acquire) => flatMap2(acquire, (implementation) => provideService(self, service3, implementation)));
var zip = /* @__PURE__ */ dual((args2) => isEffect(args2[1]), (self, that, options) => zipWith(self, that, (a, a2) => [a, a2], options));
var zipWith = /* @__PURE__ */ dual((args2) => isEffect(args2[1]), (self, that, f, options) => options?.concurrent ? map4(all([self, that], {
  concurrency: 2
}), ([a, a2]) => internalCall(() => f(a, a2))) : flatMap2(self, (a) => map4(that, (a2) => internalCall(() => f(a, a2)))));
var filterOrFail = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, predicate, orFailWith) => filterOrElse(self, predicate, orFailWith ? (a) => fail3(orFailWith(a)) : () => fail3(new NoSuchElementError())));
var when = /* @__PURE__ */ dual(2, (self, condition) => flatMap2(condition, (pass) => pass ? asSome(self) : succeedNone));
var replicate = /* @__PURE__ */ dual(2, (self, n) => Array.from({
  length: n
}, () => self));
var replicateEffect = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, n, options) => all(replicate(self, n), options));
var forever = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, options) => whileLoop({
  while: constTrue,
  body: constant(options?.disableYield ? self : flatMap2(self, (_) => yieldNow)),
  step: constVoid
}));
var catchCause = /* @__PURE__ */ dual(2, (self, f) => {
  const onFailure = Object.create(OnFailureProto);
  onFailure[args] = self;
  onFailure[contE] = f.length !== 1 ? (cause) => f(cause) : f;
  return onFailure;
});
var OnFailureProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnFailure",
  [evaluate](fiber3) {
    fiber3._stack.push(this);
    return this[args];
  }
});
var catchCauseIf = /* @__PURE__ */ dual(3, (self, predicate, f) => catchCause(self, (cause) => {
  if (!predicate(cause)) {
    return failCause(cause);
  }
  return internalCall(() => f(cause));
}));
var catchCauseFilter = /* @__PURE__ */ dual(3, (self, filter10, f) => catchCause(self, (cause) => {
  const eb = filter10(cause);
  return isFailure2(eb) ? failCause(eb.failure) : internalCall(() => f(eb.success, cause));
}));
var catch_ = /* @__PURE__ */ dual(2, (self, f) => catchCauseFilter(self, findError, (e) => f(e)));
var catchNoSuchElement = (self) => matchEffect(self, {
  onFailure: (error2) => isNoSuchElementError(error2) ? succeedNone : fail3(error2),
  onSuccess: succeedSome
});
var catchDefect = /* @__PURE__ */ dual(2, (self, f) => catchCauseFilter(self, findDefect, f));
var tapCause = /* @__PURE__ */ dual(2, (self, f) => catchCause(self, (cause) => andThen(internalCall(() => f(cause)), failCause(cause))));
var tapCauseIf = /* @__PURE__ */ dual(3, (self, predicate, f) => catchCauseIf(self, predicate, (cause) => andThen(internalCall(() => f(cause)), failCause(cause))));
var tapCauseFilter = /* @__PURE__ */ dual(3, (self, filter10, f) => catchCause(self, (cause) => {
  const result3 = filter10(cause);
  if (isFailure2(result3)) {
    return failCause(cause);
  }
  return andThen(internalCall(() => f(result3.success, cause)), failCause(cause));
}));
var tapError = /* @__PURE__ */ dual(2, (self, f) => tapCauseFilter(self, findError, (e) => f(e)));
var tapErrorTag = /* @__PURE__ */ dual(3, (self, k, f) => {
  const predicate = Array.isArray(k) ? (e) => hasProperty(e, "_tag") && k.includes(e._tag) : isTagged(k);
  return tapError(self, (error2) => predicate(error2) ? f(error2) : void_);
});
var tapDefect = /* @__PURE__ */ dual(2, (self, f) => tapCauseFilter(self, findDefect, (_) => f(_)));
var catchIf = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, predicate, f, orElse4) => catchCause(self, (cause) => {
  const error2 = findError(cause);
  if (isFailure2(error2)) return failCause(error2.failure);
  if (!predicate(error2.success)) {
    return orElse4 ? internalCall(() => orElse4(error2.success)) : failCause(cause);
  }
  return internalCall(() => f(error2.success));
}));
var catchFilter = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, filter10, f, orElse4) => catchCause(self, (cause) => {
  const error2 = findError(cause);
  if (isFailure2(error2)) return failCause(error2.failure);
  const result3 = filter10(error2.success);
  if (isFailure2(result3)) {
    return orElse4 ? internalCall(() => orElse4(result3.failure)) : failCause(cause);
  }
  return internalCall(() => f(result3.success));
}));
var catchTag = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, k, f, orElse4) => {
  const pred = Array.isArray(k) ? (e) => hasProperty(e, "_tag") && k.includes(e._tag) : isTagged(k);
  return catchIf(self, pred, f, orElse4);
});
var catchTags = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, cases, orElse4) => {
  let keys;
  return catchFilter(self, (e) => {
    keys ??= Object.keys(cases);
    return hasProperty(e, "_tag") && isString(e["_tag"]) && keys.includes(e["_tag"]) ? succeed2(e) : fail2(e);
  }, (e) => internalCall(() => cases[e["_tag"]](e)), orElse4);
});
var catchReason = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, errorTag, reasonTag, f, orElse4) => catchIf(self, (e) => isTagged(e, errorTag) && hasProperty(e, "reason"), (e) => {
  const reason = e.reason;
  if (isTagged(reason, reasonTag)) return f(reason, e);
  return orElse4 ? internalCall(() => orElse4(reason, e)) : fail3(e);
}));
var catchReasons = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, errorTag, cases, orElse4) => {
  let keys;
  return catchIf(self, (e) => isTagged(e, errorTag) && hasProperty(e, "reason") && hasProperty(e.reason, "_tag") && isString(e.reason._tag), (e) => {
    const reason = e.reason;
    keys ??= Object.keys(cases);
    if (keys.includes(reason._tag)) {
      return internalCall(() => cases[reason._tag](reason, e));
    }
    return orElse4 ? internalCall(() => orElse4(reason, e)) : fail3(e);
  });
});
var unwrapReason = /* @__PURE__ */ dual(2, (self, errorTag) => catchFilter(self, (e) => {
  if (isTagged(e, errorTag) && hasProperty(e, "reason")) {
    return succeed2(e.reason);
  }
  return fail2(e);
}, fail3));
var mapError = /* @__PURE__ */ dual(2, (self, f) => catch_(self, (error2) => failSync(() => f(error2))));
var mapBoth = /* @__PURE__ */ dual(2, (self, options) => matchEffect(self, {
  onFailure: (e) => failSync(() => options.onFailure(e)),
  onSuccess: (a) => sync(() => options.onSuccess(a))
}));
var orDie = (self) => catch_(self, die);
var orElseSucceed = /* @__PURE__ */ dual(2, (self, f) => catch_(self, (_) => sync(f)));
var firstSuccessOf = (effects) => suspend(() => {
  const iterator = effects[Symbol.iterator]();
  let state = iterator.next();
  if (state.done) {
    return die(new Error("Received an empty collection of effects"));
  }
  function loop(current) {
    const next = iterator.next();
    if (next.done) return current.value;
    return catch_(current.value, (_) => loop(next));
  }
  return loop(state);
});
var eventually = (self) => catch_(self, (_) => flatMap2(yieldNow, () => eventually(self)));
var ignore = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, options) => {
  if (!options?.log) {
    return matchEffect(self, {
      onFailure: (_) => void_,
      onSuccess: (_) => void_
    });
  }
  const logEffect = logWithLevel(options.log === true ? void 0 : options.log);
  return matchCauseEffect(self, {
    onFailure(cause) {
      const failure = findFail(cause);
      return isFailure2(failure) ? failCause(failure.failure) : options.message === void 0 ? logEffect(cause) : logEffect(options.message, cause);
    },
    onSuccess: (_) => void_
  });
});
var ignoreCause = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, options) => {
  if (!options?.log) {
    return matchCauseEffect(self, {
      onFailure: (_) => void_,
      onSuccess: (_) => void_
    });
  }
  const logEffect = logWithLevel(options.log === true ? void 0 : options.log);
  return matchCauseEffect(self, {
    onFailure: (cause) => options.message === void 0 ? logEffect(cause) : logEffect(options.message, cause),
    onSuccess: (_) => void_
  });
});
var option = (self) => match5(self, {
  onFailure: none2,
  onSuccess: some2
});
var result = (self) => matchEager(self, {
  onFailure: fail2,
  onSuccess: succeed2
});
var matchCauseEffect = /* @__PURE__ */ dual(2, (self, options) => {
  const primitive = Object.create(OnSuccessAndFailureProto);
  primitive[args] = self;
  primitive[contA] = options.onSuccess.length !== 1 ? (a) => options.onSuccess(a) : options.onSuccess;
  primitive[contE] = options.onFailure.length !== 1 ? (cause) => options.onFailure(cause) : options.onFailure;
  return primitive;
});
var OnSuccessAndFailureProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnSuccessAndFailure",
  [evaluate](fiber3) {
    fiber3._stack.push(this);
    return this[args];
  }
});
var matchCause = /* @__PURE__ */ dual(2, (self, options) => matchCauseEffect(self, {
  onFailure: (cause) => sync(() => options.onFailure(cause)),
  onSuccess: (value3) => sync(() => options.onSuccess(value3))
}));
var matchEffect = /* @__PURE__ */ dual(2, (self, options) => matchCauseEffect(self, {
  onFailure: (cause) => {
    const fail10 = cause.reasons.find(isFailReason);
    return fail10 ? internalCall(() => options.onFailure(fail10.error)) : failCause(cause);
  },
  onSuccess: options.onSuccess
}));
var match5 = /* @__PURE__ */ dual(2, (self, options) => matchEffect(self, {
  onFailure: (error2) => sync(() => options.onFailure(error2)),
  onSuccess: (value3) => sync(() => options.onSuccess(value3))
}));
var matchEager = /* @__PURE__ */ dual(2, (self, options) => {
  if (effectIsExit(self)) {
    if (self._tag === "Success") return exitSucceed(options.onSuccess(self.value));
    const error2 = findError(self.cause);
    if (isFailure2(error2)) return self;
    return exitSucceed(options.onFailure(error2.success));
  }
  return match5(self, options);
});
var matchCauseEager = /* @__PURE__ */ dual(2, (self, options) => {
  if (effectIsExit(self)) {
    if (self._tag === "Success") return exitSucceed(options.onSuccess(self.value));
    return exitSucceed(options.onFailure(self.cause));
  }
  return matchCause(self, options);
});
var exit = (self) => effectIsExit(self) ? exitSucceed(self) : exitPrimitive(self);
var exitPrimitive = /* @__PURE__ */ makePrimitive({
  op: "Exit",
  [evaluate](fiber3) {
    fiber3._stack.push(this);
    return this[args];
  },
  [contA](value3, _, exit3) {
    return succeed3(exit3 ?? exitSucceed(value3));
  },
  [contE](cause, _, exit3) {
    return succeed3(exit3 ?? exitFailCause(cause));
  }
});
var isFailure3 = /* @__PURE__ */ matchEager({
  onFailure: () => true,
  onSuccess: () => false
});
var isSuccess3 = /* @__PURE__ */ matchEager({
  onFailure: () => false,
  onSuccess: () => true
});
var delay = /* @__PURE__ */ dual(2, (self, duration) => andThen(sleep(duration), self));
var timeoutOrElse = /* @__PURE__ */ dual(2, (self, options) => raceFirst(self, flatMap2(sleep(options.duration), options.orElse)));
var timeout = /* @__PURE__ */ dual(2, (self, duration) => timeoutOrElse(self, {
  duration,
  orElse: () => fail3(new TimeoutError())
}));
var timeoutOption = /* @__PURE__ */ dual(2, (self, duration) => raceFirst(asSome(self), as(sleep(duration), none2())));
var timed = (self) => clockWith((clock) => {
  const start = clock.monotonicTimeNanosUnsafe();
  return map4(self, (a) => [nanos(clock.monotonicTimeNanosUnsafe() - start), a]);
});
var ScopeTypeId = "~effect/Scope";
var ScopeCloseableTypeId = "~effect/Scope/Closeable";
var scopeTag = /* @__PURE__ */ Service("effect/Scope");
var scopeClose = (self, exit_) => suspend(() => scopeCloseUnsafe(self, exit_) ?? void_);
var scopeCloseUnsafe = (self, exit_) => {
  if (self.state._tag === "Closed") return;
  const closed = {
    _tag: "Closed",
    exit: exit_
  };
  if (self.state._tag === "Empty") {
    self.state = closed;
    return;
  }
  const state = self.state;
  self.state = closed;
  if (state.finalizer !== void 0) {
    return state.finalizer(exit_);
  }
  const finalizers = state.finalizers;
  if (finalizers === void 0 || finalizers.size === 0) {
    return;
  } else if (finalizers.size === 1) {
    return finalizers.values().next().value(exit_);
  }
  return scopeCloseFinalizers(self, finalizers, exit_);
};
var combineFinalizerCause = (exit_, finalizer) => exitIsSuccess(exit_) ? finalizer : catchCause(finalizer, (cause) => failCause(causeCombine(exit_.cause, cause)));
var scopeCloseFinalizers = /* @__PURE__ */ fnUntraced(function* (self, finalizers, exit_) {
  let exits = [];
  const fibers = [];
  const arr = Array.from(finalizers.values());
  const parent = getCurrentFiber();
  for (let i = arr.length - 1; i >= 0; i--) {
    const finalizer = arr[i];
    if (self.strategy === "sequential") {
      exits.push(yield* exit(finalizer(exit_)));
    } else {
      fibers.push(forkUnsafe(parent, finalizer(exit_), true, true, "inherit"));
    }
  }
  if (fibers.length > 0) {
    exits = yield* fiberAwaitAll(fibers);
  }
  return yield* exitAsVoidAll(exits);
});
var scopeForkUnsafe = (scope3, finalizerStrategy) => {
  const newScope = scopeMakeUnsafe(finalizerStrategy);
  if (scope3.state._tag === "Closed") {
    newScope.state = scope3.state;
    return newScope;
  }
  const key = {};
  scopeAddFinalizerUnsafe(scope3, key, (exit3) => scopeClose(newScope, exit3));
  scopeAddFinalizerUnsafe(newScope, key, (_) => sync(() => scopeRemoveFinalizerUnsafe(scope3, key)));
  return newScope;
};
var scopeAddFinalizerExit = (scope3, finalizer) => {
  return suspend(() => {
    if (scope3.state._tag === "Closed") {
      return finalizer(scope3.state.exit);
    }
    scopeAddFinalizerUnsafe(scope3, {}, finalizer);
    return void_;
  });
};
var scopeAddFinalizer = (scope3, finalizer) => scopeAddFinalizerExit(scope3, constant(finalizer));
var scopeAddFinalizerUnsafe = (scope3, key, finalizer) => {
  if (scope3.state._tag === "Empty") {
    scope3.state = {
      _tag: "Open",
      finalizerKey: key,
      finalizer,
      finalizers: void 0
    };
  } else if (scope3.state._tag === "Open") {
    const state = scope3.state;
    if (state.finalizer !== void 0) {
      state.finalizers = /* @__PURE__ */ new Map([[state.finalizerKey, state.finalizer]]);
      state.finalizerKey = void 0;
      state.finalizer = void 0;
      state.finalizers.set(key, finalizer);
    } else if (state.finalizers === void 0) {
      state.finalizerKey = key;
      state.finalizer = finalizer;
    } else {
      state.finalizers.set(key, finalizer);
    }
  }
};
var scopeRemoveFinalizerUnsafe = (scope3, key) => {
  if (scope3.state._tag === "Open") {
    const state = scope3.state;
    if (state.finalizerKey === key) {
      state.finalizerKey = void 0;
      state.finalizer = void 0;
    } else if (state.finalizers !== void 0) {
      state.finalizers.delete(key);
    }
  }
};
var scopeMakeUnsafe = (finalizerStrategy = "sequential") => ({
  [ScopeCloseableTypeId]: ScopeCloseableTypeId,
  [ScopeTypeId]: ScopeTypeId,
  strategy: finalizerStrategy,
  state: constScopeEmpty
});
var constScopeEmpty = {
  _tag: "Empty"
};
var scopeMake = (finalizerStrategy) => sync(() => scopeMakeUnsafe(finalizerStrategy));
var scope = scopeTag;
var provideScope = /* @__PURE__ */ provideService(scopeTag);
var scoped = (self) => withFiber((fiber3) => {
  const prev = fiber3.context;
  const scope3 = scopeMakeUnsafe();
  fiber3.setContext(add(fiber3.context, scopeTag, scope3));
  return onExitPrimitive(self, (exit3) => {
    fiber3.setContext(prev);
    return scopeCloseUnsafe(scope3, exit3);
  });
});
var scopedWith = (f) => suspend(() => {
  const scope3 = scopeMakeUnsafe();
  return onExit(f(scope3), (exit3) => suspend(() => scopeCloseUnsafe(scope3, exit3) ?? void_));
});
var acquireRelease = (acquire, release, options) => contextWith((context3) => uninterruptibleMask((restore) => flatMap2(scope, (scope3) => tap(options?.interruptible ? restore(acquire) : acquire, (a) => scopeAddFinalizerExit(scope3, (exit3) => provideContext(release(a, exit3), context3))))));
var addFinalizer = (finalizer) => flatMap2(scope, (scope3) => contextWith((context3) => scopeAddFinalizerExit(scope3, (exit3) => provideContext(finalizer(exit3), context3))));
var onExitPrimitive = /* @__PURE__ */ makePrimitive({
  op: "OnExit",
  single: false,
  [evaluate](fiber3) {
    fiber3._stack.push(this);
    return this[args][0];
  },
  [contAll](fiber3) {
    if (fiber3.interruptible && this[args][2] !== true) {
      fiber3._stack.push(setInterruptibleTrue);
      fiber3.interruptible = false;
    }
  },
  [contA](value3, _, exit3) {
    exit3 ??= exitSucceed(value3);
    const eff = this[args][1](exit3);
    return eff ? flatMap2(eff, (_2) => exit3) : exit3;
  },
  [contE](cause, _, exit3) {
    exit3 ??= exitFailCause(cause);
    const eff = this[args][1](exit3);
    return eff ? flatMap2(combineFinalizerCause(exit3, eff), (_2) => exit3) : exit3;
  }
});
var onExit = /* @__PURE__ */ dual(2, onExitPrimitive);
var ensuring = /* @__PURE__ */ dual(2, (self, finalizer) => onExit(self, (_) => finalizer));
var onExitIf = /* @__PURE__ */ dual(3, (self, predicate, f) => onExit(self, (exit3) => {
  if (!predicate(exit3)) {
    return void_;
  }
  return f(exit3);
}));
var onExitFilter = /* @__PURE__ */ dual(3, (self, filter10, f) => onExit(self, (exit3) => {
  const b = filter10(exit3);
  return isFailure2(b) ? void_ : f(b.success, exit3);
}));
var onError = /* @__PURE__ */ dual(2, (self, f) => onExitFilter(self, exitFilterCause, f));
var onErrorIf = /* @__PURE__ */ dual(3, (self, predicate, f) => onExitIf(self, (exit3) => {
  if (exit3._tag !== "Failure") {
    return false;
  }
  return predicate(exit3.cause);
}, (exit3) => f(exit3.cause)));
var onErrorFilter = /* @__PURE__ */ dual(3, (self, filter10, f) => onExit(self, (exit3) => {
  if (exit3._tag !== "Failure") {
    return void_;
  }
  const result3 = filter10(exit3.cause);
  return isFailure2(result3) ? void_ : f(result3.success, exit3.cause);
}));
var onInterrupt = /* @__PURE__ */ dual(2, (self, finalizer) => onErrorFilter(causeFilterInterruptors, finalizer)(self));
var acquireUseRelease = (acquire, use, release) => uninterruptibleMask((restore) => flatMap2(acquire, (a) => onExitPrimitive(restore(use(a)), (exit3) => release(a, exit3), true)));
var acquireDisposable = (acquire) => acquireRelease(acquire, (resource) => hasProperty(resource, Symbol.asyncDispose) ? promise(() => resource[Symbol.asyncDispose]()) : sync(() => resource[Symbol.dispose]()));
var cachedInvalidateWithTTL = /* @__PURE__ */ dual(2, (self, ttl) => sync(() => {
  const ttlMillis = toMillis(fromInputUnsafe(ttl));
  const isFinite3 = Number.isFinite(ttlMillis);
  const latch = makeLatchUnsafe(false);
  let expiresAt = 0;
  let running = false;
  let exit3;
  const wait = flatMap2(latch.await, () => exit3);
  return [withFiber((fiber3) => {
    const clock = fiber3.getRef(ClockRef);
    const now2 = isFinite3 ? clock.currentTimeMillisUnsafe() : 0;
    if (running || now2 < expiresAt) return exit3 ?? wait;
    running = true;
    latch.closeUnsafe();
    exit3 = void 0;
    return onExit(self, (exit_) => sync(() => {
      running = false;
      expiresAt = clock.currentTimeMillisUnsafe() + ttlMillis;
      exit3 = exit_;
      latch.openUnsafe();
    }));
  }), sync(() => {
    expiresAt = 0;
    latch.closeUnsafe();
    exit3 = void 0;
  })];
}));
var cachedWithTTL = /* @__PURE__ */ dual(2, (self, timeToLive) => map4(cachedInvalidateWithTTL(self, timeToLive), (tuple2) => tuple2[0]));
var cached = (self) => cachedWithTTL(self, infinity);
var interrupt = /* @__PURE__ */ withFiber((fiber3) => failCause(causeInterrupt(fiber3.id)));
var uninterruptible = (self) => withFiber((fiber3) => {
  if (!fiber3.interruptible) return self;
  fiber3.interruptible = false;
  fiber3._stack.push(setInterruptibleTrue);
  return self;
});
var setInterruptible = /* @__PURE__ */ makePrimitive({
  op: "SetInterruptible",
  [contAll](fiber3) {
    fiber3.interruptible = this[args];
    if (fiber3._interruptedCause && fiber3.interruptible) {
      return () => failCause(fiber3._interruptedCause);
    }
  }
});
var setInterruptibleTrue = /* @__PURE__ */ setInterruptible(true);
var setInterruptibleFalse = /* @__PURE__ */ setInterruptible(false);
var setFiberInterruptible = (fiber3) => {
  fiber3.interruptible = true;
  fiber3._stack.push(setInterruptibleFalse);
  if (fiber3._interruptedCause) return failCause(fiber3._interruptedCause);
};
var interruptible = (self) => withFiber((fiber3) => {
  if (fiber3.interruptible) return self;
  return setFiberInterruptible(fiber3) ?? self;
});
var uninterruptibleMask = (f) => withFiber((fiber3) => {
  if (!fiber3.interruptible) return f(identity);
  fiber3.interruptible = false;
  fiber3._stack.push(setInterruptibleTrue);
  return f(interruptible);
});
var interruptibleMask = (f) => withFiber((fiber3) => {
  if (fiber3.interruptible) return f(identity);
  const interrupted = setFiberInterruptible(fiber3);
  const effect2 = f(uninterruptible);
  return interrupted ?? effect2;
});
var abortSignal = /* @__PURE__ */ map4(/* @__PURE__ */ acquireRelease(/* @__PURE__ */ sync(() => new AbortController()), (controller) => sync(() => controller.abort())), (_) => _.signal);
var all = (arg, options) => {
  if (isIterable(arg)) {
    return options?.mode === "result" ? forEach(arg, result, options) : forEach(arg, identity, options);
  } else if (options?.discard) {
    return options.mode === "result" ? forEach(Object.values(arg), result, options) : forEach(Object.values(arg), identity, options);
  }
  return suspend(() => {
    const out = {};
    return as(forEach(Object.entries(arg), ([key, effect2]) => map4(options?.mode === "result" ? result(effect2) : effect2, (value3) => {
      assignProperty(out, key, value3);
    }), {
      discard: true,
      concurrency: options?.concurrency
    }), out);
  });
};
var partition2 = /* @__PURE__ */ dual((args2) => isIterable(args2[0]) && !isEffect(args2[0]), (elements, f, options) => map4(forEach(elements, (a, i) => result(f(a, i)), options), (results) => partition(results, identity)));
var reduce2 = /* @__PURE__ */ dual(3, (elements, zero2, f) => {
  const arr = fromIterable(elements);
  if (arr.length === 0) return sync(zero2);
  return suspend(() => {
    let index = 0;
    let state = zero2();
    return map4(whileLoop({
      while: () => index < arr.length,
      body: () => f(state, arr[index], index),
      step(next) {
        state = next;
        index++;
      }
    }), () => state);
  });
});
var validate = /* @__PURE__ */ dual((args2) => isIterable(args2[0]) && !isEffect(args2[0]), (elements, f, options) => flatMap2(partition2(elements, f, {
  concurrency: options?.concurrency
}), ([excluded, satisfying]) => {
  if (isArrayNonEmpty2(excluded)) {
    return fail3(excluded);
  }
  return options?.discard ? void_ : succeed3(satisfying);
}));
var findFirst3 = /* @__PURE__ */ dual((args2) => isIterable(args2[0]) && !isEffect(args2[0]), (elements, predicate) => suspend(() => {
  const iterator = elements[Symbol.iterator]();
  const next = iterator.next();
  if (!next.done) {
    return findFirstLoop(iterator, 0, predicate, next.value);
  }
  return succeed3(none2());
}));
var findFirstLoop = (iterator, index, predicate, value3) => flatMap2(predicate(value3, index), (keep) => {
  if (keep) {
    return succeed3(some2(value3));
  }
  const next = iterator.next();
  if (!next.done) {
    return findFirstLoop(iterator, index + 1, predicate, next.value);
  }
  return succeed3(none2());
});
var findFirstFilter = /* @__PURE__ */ dual((args2) => isIterable(args2[0]) && !isEffect(args2[0]), (elements, filter10) => suspend(() => {
  const iterator = elements[Symbol.iterator]();
  const next = iterator.next();
  if (!next.done) {
    return findFirstFilterLoop(iterator, 0, filter10, next.value);
  }
  return succeed3(none2());
}));
var findFirstFilterLoop = (iterator, index, filter10, value3) => flatMap2(filter10(value3, index), (result3) => {
  if (isSuccess2(result3)) {
    return succeed3(some2(result3.success));
  }
  const next = iterator.next();
  if (!next.done) {
    return findFirstFilterLoop(iterator, index + 1, filter10, next.value);
  }
  return succeed3(none2());
});
var whileLoop = /* @__PURE__ */ makePrimitive({
  op: "While",
  [contA](value3, fiber3) {
    this[args].step(value3);
    if (this[args].while()) {
      fiber3._stack.push(this);
      return this[args].body();
    }
    return exitVoid;
  },
  [evaluate](fiber3) {
    if (this[args].while()) {
      fiber3._stack.push(this);
      return this[args].body();
    }
    return exitVoid;
  }
});
var forEach = /* @__PURE__ */ dual((args2) => typeof args2[1] === "function", (iterable, f, options) => suspend(() => {
  const concurrencyOption = options?.concurrency ?? 1;
  const concurrency = concurrencyOption === "unbounded" ? Number.POSITIVE_INFINITY : Math.max(1, concurrencyOption);
  if (concurrency === 1) {
    return forEachSequential(iterable, f, options);
  }
  const items = fromIterable(iterable);
  let length = items.length;
  if (length === 0) {
    return options?.discard ? void_ : succeed3([]);
  }
  const out = options?.discard ? void 0 : new Array(length);
  const eff = forEachConcurrent({
    f,
    out
  }, items, {
    concurrency
  });
  return eff ? as(eff, out) : succeed3(out);
}));
var head = (self) => flatMap2(self, (elements) => {
  const result3 = elements[Symbol.iterator]().next();
  return result3.done ? fail3(new NoSuchElementError()) : succeed3(result3.value);
});
var forEachSequential = (iterable, f, options) => suspend(() => {
  const out = options?.discard ? void 0 : [];
  const iterator = iterable[Symbol.iterator]();
  let state = iterator.next();
  let index = 0;
  return as(whileLoop({
    while: () => !state.done,
    body: () => f(state.value, index++),
    step: (b) => {
      if (out) out.push(b);
      state = iterator.next();
    }
  }), out);
});
var iterateEagerImpl = (options) => {
  const onItem = options.onItem;
  const step = options.step;
  const runSequential = (state, items, index, end) => {
    for (; index < end; index++) {
      const item = items[index];
      const effect2 = onItem(state, item, index);
      if (!effectIsExit(effect2)) {
        return flatMap2(exit(effect2), (itemExit) => step(state, item, itemExit, index) ?? runSequential(state, items, index + 1, end) ?? void_);
      }
      const terminal = step(state, item, effect2, index);
      if (terminal) return terminal._tag === "Failure" ? terminal : void 0;
    }
  };
  return (state, items, opts) => {
    let index = 0;
    const end = opts?.end ?? items.length;
    const concurrency = opts?.concurrency ?? 1;
    if (concurrency === 1) {
      return runSequential(state, items, 0, end);
    }
    const orderedStep = opts?.orderedStep === true;
    let done4 = false;
    let parentFiber;
    let fibers;
    let resume;
    let interrupted = false;
    let terminal;
    let effect2;
    let nextIndex = index;
    const exits = orderedStep ? new Array(end) : void 0;
    const failDefect = (error2) => {
      const defect = exitDie(error2);
      terminal = defect;
      done4 = true;
      interrupted = true;
      return fibers && fibers.size > 0 ? flatMap2(uninterruptible(fiberInterruptAll(Array.from(fibers))), () => defect) : defect;
    };
    const runStep = (item, exit3, currentIndex) => {
      if (!orderedStep) return step(state, item, exit3, currentIndex);
      if (terminal) return terminal;
      exits[currentIndex] = exit3;
      while (nextIndex < end) {
        const nextExit = exits[nextIndex];
        if (nextExit === void 0) return;
        exits[nextIndex] = void 0;
        const index2 = nextIndex++;
        const result3 = step(state, items[index2], nextExit, index2);
        if (result3) return result3;
      }
    };
    const go = () => {
      let paused = false;
      for (; !terminal && index < end; index++) {
        const item = items[index];
        const eff = effect2 ?? onItem(state, item, index);
        if (effectIsExit(eff)) {
          terminal = runStep(item, eff, index);
          if (terminal) break;
        } else if (!parentFiber) {
          return callback((cb) => {
            parentFiber = getCurrentFiber();
            fibers = /* @__PURE__ */ new Set();
            effect2 = eff;
            resume = cb;
            let result3;
            try {
              result3 = go();
            } catch (error2) {
              return cb(failDefect(error2));
            }
            if (result3) return cb(result3);
            return suspend(() => {
              terminal = exitVoid;
              interrupted = true;
              return fibers ? fiberInterruptAll(fibers) : void_;
            });
          });
        } else {
          effect2 = void 0;
          const fiber3 = forkUnsafe(parentFiber, eff, true, true, "inherit");
          if (fiber3._exit) {
            terminal = runStep(item, fiber3._exit, index);
            if (terminal) break;
            continue;
          }
          fibers.add(fiber3);
          const currentIndex = index;
          fiber3.addObserver((exit3) => {
            fibers.delete(fiber3);
            try {
              if (terminal) {
                if (!interrupted && exit3._tag === "Failure") {
                  for (const reason of exit3.cause.reasons) {
                    if (reason._tag === "Interrupt") continue;
                    else if (terminal._tag === "Failure") {
                      ;
                      terminal.cause.reasons.push(reason);
                    } else {
                      terminal = exitFailCause(causeFromReasons([reason]));
                    }
                  }
                }
              } else {
                const result3 = runStep(item, exit3, currentIndex);
                if (result3) {
                  terminal = result3._tag === "Failure" ? exitFailCause(causeFromReasons(result3.cause.reasons.slice())) : result3;
                  go();
                }
              }
              if (paused) {
                const eff2 = go();
                if (eff2) resume(eff2);
              } else if (done4 && fibers.size === 0) {
                resume(terminal ?? void_);
              }
            } catch (error2) {
              resume(failDefect(error2));
            }
          });
          if (fibers.size < concurrency) continue;
          paused = true;
          index++;
          return;
        }
      }
      done4 = true;
      if (terminal) {
        if (fibers && fibers.size > 0) {
          const annotations = fiberStackAnnotations(parentFiber);
          fibers.forEach((f) => f.interruptUnsafe(parentFiber.id, annotations));
          return;
        }
        if (resume || terminal._tag === "Failure") {
          return terminal;
        }
      } else if (resume) {
        if (!fibers) {
          return exitVoid;
        } else if (fibers.size === 0) {
          resume(void_);
        }
      }
    };
    return go();
  };
};
var iterateEager = () => iterateEagerImpl;
var forEachConcurrent = /* @__PURE__ */ iterateEagerImpl({
  onItem(state, item, index) {
    return state.f(item, index);
  },
  step(state, _, exit3, index) {
    if (exit3._tag === "Failure") return exit3;
    else if (state.out) {
      state.out[index] = exit3.value;
    }
  }
});
var filterOrElse = /* @__PURE__ */ dual(3, (self, predicate, orElse4) => flatMap2(self, (a) => predicate(a) ? succeed3(a) : orElse4(a)));
var filterMapOrElse = /* @__PURE__ */ dual(3, (self, filter10, orElse4) => flatMap2(self, (a) => {
  const result3 = filter10(a);
  return isFailure2(result3) ? orElse4(result3.failure) : succeed3(result3.success);
}));
var filterMapOrFail = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, filter10, orFailWith) => filterMapOrElse(self, filter10, orFailWith ? (x) => fail3(orFailWith(x)) : () => fail3(new NoSuchElementError())));
var filter3 = /* @__PURE__ */ dual((args2) => isIterable(args2[0]) && !isEffect(args2[0]), (elements, predicate, options) => suspend(() => {
  const out = [];
  return as(forEach(elements, (a, i) => {
    const result3 = predicate(a, i);
    if (typeof result3 === "boolean") {
      if (result3) out.push(a);
      return void_;
    }
    return map4(result3, (keep) => {
      if (keep) {
        out.push(a);
      }
    });
  }, {
    discard: true,
    concurrency: options?.concurrency
  }), out);
}));
var filterMap = /* @__PURE__ */ dual((args2) => isIterable(args2[0]) && !isEffect(args2[0]), (elements, filter10) => suspend(() => {
  const out = [];
  for (const a of elements) {
    const result3 = filter10(a);
    if (isSuccess2(result3)) {
      out.push(result3.success);
    }
  }
  return succeed3(out);
}));
var filterMapEffect = /* @__PURE__ */ dual((args2) => isIterable(args2[0]) && !isEffect(args2[0]), (elements, filter10, options) => suspend(() => {
  const out = [];
  return as(forEach(elements, (a) => map4(filter10(a), (result3) => {
    if (isSuccess2(result3)) {
      out.push(result3.success);
    }
  }), {
    discard: true,
    concurrency: options?.concurrency
  }), out);
}));
var Do = /* @__PURE__ */ succeed3({});
var bindTo2 = /* @__PURE__ */ bindTo(map4);
var bind2 = /* @__PURE__ */ bind(map4, flatMap2);
var let_2 = /* @__PURE__ */ let_(map4);
var forkChild = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, options) => withFiber((fiber3) => {
  interruptChildrenPatch();
  return succeed3(forkUnsafe(fiber3, self, options?.startImmediately, false, options?.uninterruptible ?? false));
}));
var forkUnsafe = (parent, effect2, immediate = false, daemon = false, uninterruptible3 = false) => {
  const parentRuntime = parent;
  const interruptible3 = uninterruptible3 === "inherit" ? parentRuntime.interruptible : !uninterruptible3;
  const child = new FiberImpl(parentRuntime.context, interruptible3);
  if (immediate) {
    child.evaluate(effect2);
  } else {
    parentRuntime.currentDispatcher.scheduleTask(() => child.evaluate(effect2), 0);
  }
  if (!daemon && !child._exit) {
    parentRuntime.children().add(child);
    child.addObserver(() => parentRuntime._children.delete(child));
  }
  return child;
};
var forkDetach = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, options) => withFiber((fiber3) => succeed3(forkUnsafe(fiber3, self, options?.startImmediately, true, options?.uninterruptible))));
var awaitAllChildren = (self) => withFiber((fiber3) => {
  const initialChildren = fiber3._children && new Set(fiber3._children);
  return onExit(self, (_) => {
    let children = fiber3._children;
    if (children === void 0 || children.size === 0) {
      return void_;
    } else if (initialChildren) {
      children = filter2(children, (child) => !initialChildren.has(child));
    }
    return asVoid(fiberAwaitAll(children));
  });
});
var forkIn = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, scope3, options) => withFiber((parent) => {
  const fiber3 = forkUnsafe(parent, self, options?.startImmediately, true, options?.uninterruptible);
  if (!fiber3._exit) {
    if (scope3.state._tag !== "Closed") {
      const key = {};
      const finalizer = () => withFiberId((interruptor) => interruptor === fiber3.id ? void_ : fiberInterrupt(fiber3));
      scopeAddFinalizerUnsafe(scope3, key, finalizer);
      fiber3.addObserver(() => scopeRemoveFinalizerUnsafe(scope3, key));
    } else {
      fiber3.interruptUnsafe(parent.id, fiberStackAnnotations(parent));
    }
  }
  return succeed3(fiber3);
}));
var forkScoped = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, options) => flatMap2(scope, (scope3) => forkIn(self, scope3, options)));
var runForkWith = (context3) => (effect2, options) => {
  const fiber3 = new FiberImpl(options?.scheduler ? add(context3, Scheduler, options.scheduler) : context3, options?.uninterruptible !== true);
  fiber3.evaluate(effect2);
  if (fiber3._exit) return fiber3;
  if (options?.signal) {
    if (options.signal.aborted) {
      fiber3.interruptUnsafe();
    } else {
      const abort = () => fiber3.interruptUnsafe();
      options.signal.addEventListener("abort", abort, {
        once: true
      });
      fiber3.addObserver(() => options.signal.removeEventListener("abort", abort));
    }
  }
  if (options?.onFiberStart) {
    options.onFiberStart(fiber3);
  }
  return fiber3;
};
var fiberRunIn = /* @__PURE__ */ dual(2, (self, scope3) => {
  if (self._exit) {
    return self;
  } else if (scope3.state._tag === "Closed") {
    self.interruptUnsafe(self.id);
    return self;
  }
  const key = {};
  scopeAddFinalizerUnsafe(scope3, key, () => fiberInterrupt(self));
  self.addObserver(() => scopeRemoveFinalizerUnsafe(scope3, key));
  return self;
});
var runFork = /* @__PURE__ */ runForkWith(/* @__PURE__ */ empty());
var runCallbackWith = (context3) => {
  const runFork3 = runForkWith(context3);
  return (effect2, options) => {
    const fiber3 = runFork3(effect2, options);
    if (options?.onExit) {
      fiber3.addObserver(options.onExit);
    }
    return (interruptor) => {
      return fiber3.interruptUnsafe(interruptor);
    };
  };
};
var runCallback = /* @__PURE__ */ runCallbackWith(/* @__PURE__ */ empty());
var runPromiseExitWith = (context3) => {
  const runFork3 = runForkWith(context3);
  return (effect2, options) => {
    const fiber3 = runFork3(effect2, options);
    return new Promise((resolve6) => {
      fiber3.addObserver((exit3) => resolve6(exit3));
    });
  };
};
var runPromiseExit = /* @__PURE__ */ runPromiseExitWith(/* @__PURE__ */ empty());
var runPromiseWith = (context3) => {
  const runPromiseExit3 = runPromiseExitWith(context3);
  return (effect2, options) => runPromiseExit3(effect2, options).then((exit3) => {
    if (exit3._tag === "Failure") {
      throw causeSquash(exit3.cause);
    }
    return exit3.value;
  });
};
var runPromise = /* @__PURE__ */ runPromiseWith(/* @__PURE__ */ empty());
var runSyncExitWith = (context3) => {
  const runFork3 = runForkWith(context3);
  return (effect2) => {
    if (effectIsExit(effect2)) return effect2;
    const scheduler = new MixedScheduler("sync");
    const fiber3 = runFork3(effect2, {
      scheduler
    });
    fiber3._dispatcher?.flush();
    return fiber3._exit ?? exitDie(new AsyncFiberError(fiber3));
  };
};
var runSyncExit = /* @__PURE__ */ runSyncExitWith(/* @__PURE__ */ empty());
var runSyncWith = (context3) => {
  const runSyncExit3 = runSyncExitWith(context3);
  return (effect2) => {
    const exit3 = runSyncExit3(effect2);
    if (exit3._tag === "Failure") throw causeSquash(exit3.cause);
    return exit3.value;
  };
};
var runSync = /* @__PURE__ */ runSyncWith(/* @__PURE__ */ empty());
var succeedTrue = /* @__PURE__ */ succeed3(true);
var succeedFalse = /* @__PURE__ */ succeed3(false);
var Latch = class {
  waiters = [];
  scheduled = void 0;
  _isOpen;
  constructor(isOpen) {
    this._isOpen = isOpen;
  }
  scheduleUnsafe(fiber3) {
    if (this.waiters.length === 0) {
      return succeedTrue;
    }
    if (this.scheduled === void 0) {
      this.scheduled = this.waiters;
      fiber3.currentDispatcher.scheduleTask(this.flushScheduled, 0);
    } else {
      for (let i = 0; i < this.waiters.length; i++) {
        this.scheduled.push(this.waiters[i]);
      }
    }
    this.waiters = [];
    return succeedTrue;
  }
  flushScheduled = () => {
    if (this.scheduled === void 0) return;
    const waiters = this.scheduled;
    this.scheduled = void 0;
    for (let i = 0; i < waiters.length; i++) {
      waiters[i](exitVoid);
    }
  };
  flushWaiters() {
    const waiters = this.waiters;
    this.waiters = [];
    this.flushScheduled();
    for (let i = 0; i < waiters.length; i++) {
      waiters[i](exitVoid);
    }
  }
  open = /* @__PURE__ */ withFiber((fiber3) => {
    if (this._isOpen) return succeedFalse;
    this._isOpen = true;
    return this.scheduleUnsafe(fiber3);
  });
  release = /* @__PURE__ */ withFiber((fiber3) => this._isOpen ? succeedFalse : this.scheduleUnsafe(fiber3));
  openUnsafe() {
    if (this._isOpen) return false;
    this._isOpen = true;
    this.flushWaiters();
    return true;
  }
  await = /* @__PURE__ */ callback((resume) => {
    if (this._isOpen) {
      return resume(void_);
    }
    this.waiters.push(resume);
    return sync(() => {
      let index = this.waiters.indexOf(resume);
      if (index !== -1) {
        this.waiters.splice(index, 1);
      } else if (this.scheduled !== void 0) {
        index = this.scheduled.indexOf(resume);
        if (index !== -1) {
          this.scheduled.splice(index, 1);
        }
      }
    });
  });
  closeUnsafe() {
    if (!this._isOpen) return false;
    this._isOpen = false;
    return true;
  }
  close = /* @__PURE__ */ sync(() => this.closeUnsafe());
  whenOpen = (self) => flatMap2(this.await, () => self);
  isOpen() {
    return this._isOpen;
  }
};
var makeLatchUnsafe = (open3) => new Latch(open3 ?? false);
var tracer = /* @__PURE__ */ withFiber((fiber3) => succeed3(fiber3.getRef(Tracer)));
var withTracer = /* @__PURE__ */ dual(2, (effect2, tracer3) => provideService(effect2, Tracer, tracer3));
var withTracerEnabled = /* @__PURE__ */ provideService(TracerEnabled);
var withTracerTiming = /* @__PURE__ */ provideService(TracerTimingEnabled);
var bigint02 = /* @__PURE__ */ BigInt(0);
var NoopSpanProto = {
  _tag: "Span",
  spanId: "noop",
  traceId: "noop",
  sampled: false,
  status: {
    _tag: "Ended",
    startTime: bigint02,
    endTime: bigint02,
    exit: exitVoid
  },
  attributes: /* @__PURE__ */ new Map(),
  links: [],
  kind: "internal",
  attribute() {
  },
  event() {
  },
  end() {
  },
  addLinks() {
  }
};
var noopSpan = (options) => Object.assign(Object.create(NoopSpanProto), options);
var filterDisablePropagation = (span) => {
  if (!span) return none2();
  return get(span.annotations, DisablePropagation) ? span._tag === "Span" ? filterDisablePropagation(getOrUndefined(span.parent)) : none2() : some2(span);
};
var makeSpanUnsafe = (fiber3, name, options) => {
  const disablePropagation = !fiber3.getRef(TracerEnabled) || options?.annotations && get(options.annotations, DisablePropagation);
  const parent = options?.parent !== void 0 ? some2(options.parent) : options?.root ? none2() : filterDisablePropagation(fiber3.currentSpan);
  let span;
  if (disablePropagation) {
    span = noopSpan({
      name,
      parent,
      annotations: add(options?.annotations ?? empty(), DisablePropagation, true)
    });
  } else {
    const tracer3 = fiber3.getRef(Tracer);
    const clock = fiber3.getRef(ClockRef);
    const timingEnabled = fiber3.getRef(TracerTimingEnabled);
    const annotationsFromEnv = fiber3.getRef(TracerSpanAnnotations);
    const linksFromEnv = fiber3.getRef(TracerSpanLinks);
    const level = options?.level ?? fiber3.getRef(CurrentTraceLevel);
    const links = options?.links !== void 0 ? [...linksFromEnv, ...options.links] : linksFromEnv.length === 0 ? [] : linksFromEnv.slice();
    span = tracer3.span({
      name,
      parent,
      annotations: options?.annotations ?? empty(),
      links,
      startTime: timingEnabled ? clock.currentTimeNanosUnsafe() : BigInt(0),
      kind: options?.kind ?? "internal",
      root: options?.root ?? isNone2(parent),
      sampled: options?.sampled ?? (isSome2(parent) && parent.value.sampled === false ? false : !isLogLevelGreaterThan(fiber3.getRef(MinimumTraceLevel), level))
    });
    for (const key in annotationsFromEnv) {
      span.attribute(key, annotationsFromEnv[key]);
    }
    if (options?.attributes !== void 0) {
      for (const key in options.attributes) {
        span.attribute(key, options.attributes[key]);
      }
    }
  }
  return span;
};
var makeSpan = (name, options) => withFiber((fiber3) => succeed3(makeSpanUnsafe(fiber3, name, options)));
var makeSpanScoped = (name, options) => uninterruptible(withFiber((fiber3) => {
  const scope3 = getUnsafe(fiber3.context, scopeTag);
  const span = makeSpanUnsafe(fiber3, name, options ?? {});
  const clock = fiber3.getRef(ClockRef);
  const timingEnabled = fiber3.getRef(TracerTimingEnabled);
  return as(scopeAddFinalizerExit(scope3, (exit3) => endSpan(span, exit3, clock, timingEnabled)), span);
}));
var withSpanScoped = function() {
  const dataFirst = typeof arguments[0] !== "string";
  const name = dataFirst ? arguments[1] : arguments[0];
  const options = addSpanStackTrace(dataFirst ? arguments[2] : arguments[1]);
  if (dataFirst) {
    const self = arguments[0];
    return flatMap2(makeSpanScoped(name, options), (span) => withParentSpan(self, span, options));
  }
  return (self) => flatMap2(makeSpanScoped(name, options), (span) => withParentSpan(self, span, options));
};
var provideSpanStackFrame = (name, stack) => {
  stack = typeof stack === "function" ? stack : constUndefined;
  return updateService(CurrentStackFrame, (parent) => ({
    name,
    stack,
    parent
  }));
};
var spanAnnotations = TracerSpanAnnotations;
var spanLinks = TracerSpanLinks;
var linkSpans = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, span, attributes = {}) => {
  const spans = Array.isArray(span) ? span : [span];
  const links = spans.map((span2) => ({
    span: span2,
    attributes
  }));
  return updateService(self, TracerSpanLinks, (current) => [...current, ...links]);
});
var endSpan = (span, exit3, clock, timingEnabled) => sync(() => {
  if (span.status._tag === "Ended") return;
  span.end(timingEnabled ? clock.currentTimeNanosUnsafe() : bigint02, exit3);
});
var useSpan = (name, ...args2) => {
  const options = args2.length === 1 ? void 0 : args2[0];
  const evaluate2 = args2[args2.length - 1];
  return withFiber((fiber3) => {
    const span = makeSpanUnsafe(fiber3, name, options);
    const clock = fiber3.getRef(ClockRef);
    const timingEnabled = fiber3.getRef(TracerTimingEnabled);
    return onExit(internalCall(() => evaluate2(span)), (exit3) => endSpan(span, exit3, clock, timingEnabled));
  });
};
var provideParentSpan = /* @__PURE__ */ provideService(ParentSpan);
var withParentSpan = function() {
  const dataFirst = isEffect(arguments[0]);
  const span = dataFirst ? arguments[1] : arguments[0];
  let options = dataFirst ? arguments[2] : arguments[1];
  let provideStackFrame = identity;
  if (span._tag === "Span") {
    options = addSpanStackTrace(options);
    provideStackFrame = provideSpanStackFrame(span.name, options?.captureStackTrace);
  }
  if (dataFirst) {
    return provideParentSpan(provideStackFrame(arguments[0]), span);
  }
  return (self) => provideParentSpan(provideStackFrame(self), span);
};
var withSpan = function() {
  const dataFirst = typeof arguments[0] !== "string";
  const name = dataFirst ? arguments[1] : arguments[0];
  const traceOptions = addSpanStackTrace(arguments[2]);
  if (dataFirst) {
    const self = arguments[0];
    return useSpan(name, arguments[2], (span) => withParentSpan(self, span, traceOptions));
  }
  const fnArg = typeof arguments[1] === "function" ? arguments[1] : void 0;
  const options = fnArg ? void 0 : arguments[1];
  return (self, ...args2) => useSpan(name, fnArg ? fnArg(...args2) : options, (span) => withParentSpan(self, span, traceOptions));
};
var annotateSpans = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (effect2, ...args2) => updateService(effect2, TracerSpanAnnotations, (annotations) => {
  const newAnnotations = args2.length === 1 ? {
    ...annotations,
    ...args2[0]
  } : {
    ...annotations
  };
  if (args2.length === 1) {
    return newAnnotations;
  } else {
    assignProperty(newAnnotations, args2[0], args2[1]);
  }
  return newAnnotations;
}));
var annotateCurrentSpan = (...args2) => withFiber((fiber3) => {
  const span = fiber3.currentSpanLocal;
  if (span) {
    if (args2.length === 1) {
      for (const [key, value3] of Object.entries(args2[0])) {
        span.attribute(key, value3);
      }
    } else {
      span.attribute(args2[0], args2[1]);
    }
  }
  return void_;
});
var currentSpan = /* @__PURE__ */ withFiber((fiber3) => {
  const span = fiber3.currentSpanLocal;
  return span ? succeed3(span) : fail3(new NoSuchElementError());
});
var currentParentSpan = /* @__PURE__ */ serviceOptional(ParentSpan);
var ClockRef = /* @__PURE__ */ Reference("effect/Clock", {
  defaultValue: () => new ClockImpl()
});
var MAX_TIMER_MILLIS = 2 ** 31 - 1;
var ClockImpl = class {
  currentTimeMillisUnsafe() {
    return Date.now();
  }
  currentTimeMillis = /* @__PURE__ */ sync(() => this.currentTimeMillisUnsafe());
  currentTimeNanosUnsafe() {
    return wallTimeNanos();
  }
  currentTimeNanos = /* @__PURE__ */ sync(() => this.currentTimeNanosUnsafe());
  monotonicTimeNanosUnsafe() {
    return monotonicNowNanos();
  }
  monotonicTimeNanos = /* @__PURE__ */ sync(() => this.monotonicTimeNanosUnsafe());
  sleep(duration) {
    return this.sleepMillis(toMillis(duration));
  }
  sleepMillis(millis2) {
    if (millis2 <= 0) return yieldNow;
    else if (!Number.isFinite(millis2)) return never;
    return callback((resume) => {
      const continuation = millis2 > MAX_TIMER_MILLIS ? this.sleepMillis(millis2 - MAX_TIMER_MILLIS) : void_;
      const handle = setTimeout(() => resume(continuation), Math.min(millis2, MAX_TIMER_MILLIS));
      return sync(() => clearTimeout(handle));
    });
  }
};
var nanosPerMilli = /* @__PURE__ */ BigInt(1e6);
var monotonicNowNanos = /* @__PURE__ */ (function() {
  const processHrtime = globalThis.process?.hrtime;
  if (typeof processHrtime?.bigint === "function") {
    return () => processHrtime.bigint();
  }
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return () => BigInt(Math.round(performance.now() * 1e6));
  }
  let previous = /* @__PURE__ */ BigInt(0);
  return () => {
    const current = BigInt(Date.now()) * nanosPerMilli;
    if (current > previous) {
      previous = current;
    }
    return previous;
  };
})();
var wallTimeNanos = /* @__PURE__ */ (function() {
  const reanchorThresholdNanos = /* @__PURE__ */ BigInt(1e9);
  let origin;
  return () => {
    const monotonic = monotonicNowNanos();
    const wall = BigInt(Date.now()) * nanosPerMilli;
    if (origin === void 0) {
      origin = wall - monotonic;
    } else {
      const projected = origin + monotonic;
      const skew = wall > projected ? wall - projected : projected - wall;
      if (skew > reanchorThresholdNanos) {
        origin = wall - monotonic;
      }
    }
    return origin + monotonic;
  };
})();
var clockWith = (f) => withFiber((fiber3) => f(fiber3.getRef(ClockRef)));
var sleep = (duration) => clockWith((clock) => clock.sleep(fromInputUnsafe(duration)));
var currentTimeMillis = /* @__PURE__ */ clockWith((clock) => clock.currentTimeMillis);
var TimeoutErrorTypeId = "~effect/Cause/TimeoutError";
var TimeoutError = class extends (/* @__PURE__ */ TaggedError("TimeoutError")) {
  [TimeoutErrorTypeId] = TimeoutErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
};
var IllegalArgumentErrorTypeId = "~effect/Cause/IllegalArgumentError";
var IllegalArgumentError = class extends (/* @__PURE__ */ TaggedError("IllegalArgumentError")) {
  [IllegalArgumentErrorTypeId] = IllegalArgumentErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
};
var ExceededCapacityErrorTypeId = "~effect/Cause/ExceededCapacityError";
var ExceededCapacityError = class extends (/* @__PURE__ */ TaggedError("ExceededCapacityError")) {
  [ExceededCapacityErrorTypeId] = ExceededCapacityErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
};
var AsyncFiberErrorTypeId = "~effect/Cause/AsyncFiberError";
var AsyncFiberError = class extends (/* @__PURE__ */ TaggedError("AsyncFiberError")) {
  [AsyncFiberErrorTypeId] = AsyncFiberErrorTypeId;
  constructor(fiber3) {
    super({
      message: "An asynchronous Effect was executed with Effect.runSync",
      fiber: fiber3
    });
  }
};
var UnknownErrorTypeId = "~effect/Cause/UnknownError";
var UnknownError = class extends (/* @__PURE__ */ TaggedError("UnknownError")) {
  [UnknownErrorTypeId] = UnknownErrorTypeId;
  constructor(cause, message) {
    super({
      message,
      cause
    });
  }
};
var ConsoleRef = /* @__PURE__ */ Reference("effect/Console/CurrentConsole", {
  defaultValue: () => globalThis.console
});
var logLevelToOrder = (level) => {
  switch (level) {
    case "All":
      return Number.MIN_SAFE_INTEGER;
    case "Fatal":
      return 5e4;
    case "Error":
      return 4e4;
    case "Warn":
      return 3e4;
    case "Info":
      return 2e4;
    case "Debug":
      return 1e4;
    case "Trace":
      return 0;
    case "None":
      return Number.MAX_SAFE_INTEGER;
  }
};
var LogLevelOrder = /* @__PURE__ */ mapInput(Number2, logLevelToOrder);
var isLogLevelGreaterThan = /* @__PURE__ */ isGreaterThan(LogLevelOrder);
var CurrentLoggers = /* @__PURE__ */ Reference("effect/Loggers/CurrentLoggers", {
  defaultValue: () => /* @__PURE__ */ new Set([defaultLogger, tracerLogger])
});
var LogToStderr = /* @__PURE__ */ Reference("effect/Logger/LogToStderr", {
  defaultValue: constFalse
});
var annotateLogsScoped = function() {
  const entries = typeof arguments[0] === "string" ? [[arguments[0], arguments[1]]] : Object.entries(arguments[0]);
  return uninterruptible(withFiber((fiber3) => {
    const prev = fiber3.getRef(CurrentLogAnnotations);
    const next = {
      ...prev
    };
    for (let i = 0; i < entries.length; i++) {
      const [key, value3] = entries[i];
      assignProperty(next, key, value3);
    }
    fiber3.setContext(add(fiber3.context, CurrentLogAnnotations, next));
    return scopeAddFinalizerExit(getUnsafe(fiber3.context, scopeTag), (_) => {
      const current = fiber3.getRef(CurrentLogAnnotations);
      const next2 = {
        ...current
      };
      for (let i = 0; i < entries.length; i++) {
        const [key, value3] = entries[i];
        if (current[key] !== value3) continue;
        if (Object.hasOwn(prev, key)) {
          assignProperty(next2, key, prev[key]);
        } else {
          delete next2[key];
        }
      }
      fiber3.setContext(add(fiber3.context, CurrentLogAnnotations, next2));
      return void_;
    });
  }));
};
var LoggerTypeId = "~effect/Logger";
var LoggerProto = {
  [LoggerTypeId]: {
    _Message: identity,
    _Output: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var loggerMake = (log3) => {
  const self = Object.create(LoggerProto);
  self.log = log3;
  return self;
};
var formatLabel = (key) => key.replace(/[\s="]/g, "_");
var formatLogSpan = (self, now2) => {
  const label = formatLabel(self[0]);
  return `${label}=${now2 - self[1]}ms`;
};
var logWithLevel = (level) => (...message) => {
  let cause = void 0;
  for (let i = 0, len = message.length; i < len; i++) {
    const msg = message[i];
    if (isCause(msg)) {
      if (cause) {
        ;
        message.splice(i, 1);
      } else {
        message = message.slice(0, i).concat(message.slice(i + 1));
      }
      cause = cause ? causeFromReasons(cause.reasons.concat(msg.reasons)) : msg;
      i--;
    }
  }
  if (cause === void 0) {
    cause = causeEmpty;
  }
  return withFiber((fiber3) => {
    const logLevel = level ?? fiber3.currentLogLevel;
    if (isLogLevelGreaterThan(fiber3.minimumLogLevel, logLevel)) {
      return void_;
    }
    const clock = fiber3.getRef(ClockRef);
    const loggers = fiber3.getRef(CurrentLoggers);
    if (loggers.size > 0) {
      const date6 = new Date(clock.currentTimeMillisUnsafe());
      for (const logger of loggers) {
        logger.log({
          cause,
          fiber: fiber3,
          date: date6,
          logLevel,
          message
        });
      }
    }
    return void_;
  });
};
var colors = {
  bold: "1",
  red: "31",
  green: "32",
  yellow: "33",
  blue: "34",
  cyan: "36",
  white: "37",
  gray: "90",
  black: "30",
  bgBrightRed: "101"
};
var logLevelColors = {
  None: [],
  All: [],
  Trace: [colors.gray],
  Debug: [colors.blue],
  Info: [colors.green],
  Warn: [colors.yellow],
  Error: [colors.red],
  Fatal: [colors.bgBrightRed, colors.black]
};
var defaultDateFormat = (date6) => `${date6.getHours().toString().padStart(2, "0")}:${date6.getMinutes().toString().padStart(2, "0")}:${date6.getSeconds().toString().padStart(2, "0")}.${date6.getMilliseconds().toString().padStart(3, "0")}`;
var defaultLogger = /* @__PURE__ */ loggerMake(({
  cause,
  date: date6,
  fiber: fiber3,
  logLevel,
  message
}) => {
  const message_ = Array.isArray(message) ? message.slice() : [message];
  if (cause.reasons.length > 0) {
    message_.push(causePretty(cause));
  }
  const now2 = date6.getTime();
  const spans = fiber3.getRef(CurrentLogSpans);
  let spanString = "";
  for (const span of spans) {
    spanString += ` ${formatLogSpan(span, now2)}`;
  }
  const annotations = fiber3.getRef(CurrentLogAnnotations);
  if (Object.keys(annotations).length > 0) {
    message_.push(annotations);
  }
  const console2 = fiber3.getRef(ConsoleRef);
  const log3 = fiber3.getRef(LogToStderr) ? console2.error : console2.log;
  log3(`[${defaultDateFormat(date6)}] ${logLevel.toUpperCase()} (#${fiber3.id})${spanString}:`, ...message_);
});
var tracerLogger = /* @__PURE__ */ loggerMake(({
  cause,
  fiber: fiber3,
  logLevel,
  message
}) => {
  const clock = fiber3.getRef(ClockRef);
  const annotations = fiber3.getRef(CurrentLogAnnotations);
  const span = fiber3.currentSpan;
  if (span === void 0 || span._tag === "ExternalSpan") return;
  const attributes = {};
  for (const [key, value3] of Object.entries(annotations)) {
    assignProperty(attributes, key, value3);
  }
  attributes["effect.fiberId"] = fiber3.id;
  attributes["effect.logLevel"] = logLevel.toUpperCase();
  if (cause.reasons.length > 0) {
    attributes["effect.cause"] = causePretty(cause);
  }
  span.event(toStringUnknown(Array.isArray(message) && message.length === 1 ? message[0] : message), clock.currentTimeNanosUnsafe(), attributes);
});
function interruptChildrenPatch() {
  fiberMiddleware.interruptChildren ??= fiberInterruptChildren;
}
var undefined_ = /* @__PURE__ */ succeed3(void 0);
var withErrorReporting = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, options) => onError(self, (cause) => withFiber((fiber3) => {
  reportCauseUnsafe(fiber3, cause, options?.defectsOnly);
  return void_;
})));
var reportCauseUnsafe = (fiber3, cause, defectsOnly) => {
  const reporters = fiber3.getRef(CurrentErrorReporters);
  if (reporters.size === 0) return;
  if (defectsOnly && !hasDies(cause)) return;
  const opts = {
    cause,
    fiber: fiber3,
    timestamp: fiber3.getRef(ClockRef).currentTimeNanosUnsafe()
  };
  reporters.forEach((reporter) => reporter.report(opts));
};

// node_modules/effect/dist/Cause.js
var isFailReason2 = isFailReason;
var fromReasons = causeFromReasons;
var fail4 = causeFail;
var die2 = causeDie;
var hasInterruptsOnly2 = hasInterruptsOnly;
var map5 = causeMap;
var squash = causeSquash;
var isDone2 = isDone;
var Done2 = Done;
var done2 = done;
var UnknownError2 = UnknownError;

// node_modules/effect/dist/Effect.js
var Effect_exports = {};
__export(Effect_exports, {
  Do: () => Do2,
  Transaction: () => Transaction,
  TypeId: () => TypeId11,
  abortSignal: () => abortSignal2,
  acquireDisposable: () => acquireDisposable2,
  acquireRelease: () => acquireRelease2,
  acquireUseRelease: () => acquireUseRelease2,
  addFinalizer: () => addFinalizer3,
  all: () => all2,
  andThen: () => andThen2,
  annotateCurrentSpan: () => annotateCurrentSpan2,
  annotateLogs: () => annotateLogs,
  annotateLogsScoped: () => annotateLogsScoped2,
  annotateSpans: () => annotateSpans2,
  as: () => as2,
  asSome: () => asSome2,
  asVoid: () => asVoid2,
  awaitAllChildren: () => awaitAllChildren2,
  bind: () => bind3,
  bindTo: () => bindTo3,
  cached: () => cached2,
  cachedInvalidateWithTTL: () => cachedInvalidateWithTTL2,
  cachedWithTTL: () => cachedWithTTL2,
  callback: () => callback2,
  catch: () => catch_2,
  catchCause: () => catchCause2,
  catchCauseFilter: () => catchCauseFilter2,
  catchCauseIf: () => catchCauseIf2,
  catchDefect: () => catchDefect2,
  catchEager: () => catchEager2,
  catchFilter: () => catchFilter2,
  catchIf: () => catchIf2,
  catchNoSuchElement: () => catchNoSuchElement2,
  catchReason: () => catchReason2,
  catchReasons: () => catchReasons2,
  catchTag: () => catchTag2,
  catchTags: () => catchTags2,
  clockWith: () => clockWith2,
  context: () => context2,
  contextWith: () => contextWith2,
  currentParentSpan: () => currentParentSpan2,
  currentSpan: () => currentSpan2,
  delay: () => delay2,
  die: () => die3,
  effectify: () => effectify,
  ensuring: () => ensuring2,
  eventually: () => eventually2,
  exit: () => exit2,
  fail: () => fail6,
  failCause: () => failCause3,
  failCauseSync: () => failCauseSync2,
  failSync: () => failSync2,
  fiber: () => fiber2,
  fiberId: () => fiberId2,
  filter: () => filter4,
  filterMap: () => filterMap2,
  filterMapEffect: () => filterMapEffect2,
  filterMapOrElse: () => filterMapOrElse2,
  filterMapOrFail: () => filterMapOrFail2,
  filterOrElse: () => filterOrElse2,
  filterOrFail: () => filterOrFail2,
  findFirst: () => findFirst4,
  findFirstFilter: () => findFirstFilter2,
  firstSuccessOf: () => firstSuccessOf2,
  flatMap: () => flatMap3,
  flatMapEager: () => flatMapEager2,
  flatten: () => flatten3,
  flip: () => flip2,
  fn: () => fn2,
  fnUntraced: () => fnUntraced2,
  fnUntracedEager: () => fnUntracedEager2,
  forEach: () => forEach2,
  forever: () => forever3,
  forkChild: () => forkChild2,
  forkDetach: () => forkDetach2,
  forkIn: () => forkIn2,
  forkScoped: () => forkScoped2,
  fromNullishOr: () => fromNullishOr3,
  fromOption: () => fromOption3,
  fromResult: () => fromResult2,
  gen: () => gen2,
  head: () => head2,
  ignore: () => ignore2,
  ignoreCause: () => ignoreCause2,
  interrupt: () => interrupt2,
  interruptible: () => interruptible2,
  interruptibleMask: () => interruptibleMask2,
  isEffect: () => isEffect2,
  isFailure: () => isFailure5,
  isSuccess: () => isSuccess5,
  let: () => let_3,
  linkSpans: () => linkSpans2,
  log: () => log,
  logDebug: () => logDebug,
  logError: () => logError,
  logFatal: () => logFatal,
  logInfo: () => logInfo,
  logTrace: () => logTrace,
  logWarning: () => logWarning,
  logWithLevel: () => logWithLevel2,
  makeSpan: () => makeSpan2,
  makeSpanScoped: () => makeSpanScoped2,
  map: () => map6,
  mapBoth: () => mapBoth2,
  mapBothEager: () => mapBothEager2,
  mapEager: () => mapEager2,
  mapError: () => mapError2,
  mapErrorEager: () => mapErrorEager2,
  match: () => match6,
  matchCause: () => matchCause2,
  matchCauseEager: () => matchCauseEager2,
  matchCauseEffect: () => matchCauseEffect2,
  matchCauseEffectEager: () => matchCauseEffectEager2,
  matchEager: () => matchEager2,
  matchEffect: () => matchEffect3,
  never: () => never2,
  onError: () => onError2,
  onErrorFilter: () => onErrorFilter2,
  onErrorIf: () => onErrorIf2,
  onExit: () => onExit2,
  onExitFilter: () => onExitFilter2,
  onExitIf: () => onExitIf2,
  onExitPrimitive: () => onExitPrimitive2,
  onInterrupt: () => onInterrupt2,
  option: () => option2,
  orDie: () => orDie2,
  orElseSucceed: () => orElseSucceed2,
  partition: () => partition3,
  promise: () => promise2,
  provide: () => provide4,
  provideContext: () => provideContext2,
  provideService: () => provideService2,
  provideServiceEffect: () => provideServiceEffect2,
  race: () => race2,
  raceAll: () => raceAll2,
  raceAllFirst: () => raceAllFirst2,
  raceFirst: () => raceFirst2,
  reduce: () => reduce3,
  repeat: () => repeat2,
  repeatOrElse: () => repeatOrElse2,
  replicate: () => replicate2,
  replicateEffect: () => replicateEffect2,
  request: () => request2,
  requestUnsafe: () => requestUnsafe2,
  result: () => result2,
  retry: () => retry2,
  retryOrElse: () => retryOrElse2,
  runCallback: () => runCallback2,
  runCallbackWith: () => runCallbackWith2,
  runFork: () => runFork2,
  runForkWith: () => runForkWith2,
  runPromise: () => runPromise2,
  runPromiseExit: () => runPromiseExit2,
  runPromiseExitWith: () => runPromiseExitWith2,
  runPromiseWith: () => runPromiseWith2,
  runSync: () => runSync2,
  runSyncExit: () => runSyncExit2,
  runSyncExitWith: () => runSyncExitWith2,
  runSyncWith: () => runSyncWith2,
  sandbox: () => sandbox2,
  satisfiesErrorType: () => satisfiesErrorType,
  satisfiesServicesType: () => satisfiesServicesType,
  satisfiesSuccessType: () => satisfiesSuccessType,
  schedule: () => schedule,
  scheduleFrom: () => scheduleFrom2,
  scope: () => scope2,
  scoped: () => scoped2,
  scopedWith: () => scopedWith2,
  service: () => service2,
  serviceOption: () => serviceOption2,
  setContext: () => setContext2,
  sleep: () => sleep2,
  spanAnnotations: () => spanAnnotations2,
  spanLinks: () => spanLinks2,
  succeed: () => succeed6,
  succeedNone: () => succeedNone2,
  succeedSome: () => succeedSome2,
  suspend: () => suspend2,
  sync: () => sync2,
  tap: () => tap2,
  tapCause: () => tapCause2,
  tapCauseFilter: () => tapCauseFilter2,
  tapCauseIf: () => tapCauseIf2,
  tapDefect: () => tapDefect2,
  tapError: () => tapError2,
  tapErrorTag: () => tapErrorTag2,
  timed: () => timed2,
  timeout: () => timeout2,
  timeoutOption: () => timeoutOption2,
  timeoutOrElse: () => timeoutOrElse2,
  tracer: () => tracer2,
  track: () => track,
  trackDefects: () => trackDefects,
  trackDuration: () => trackDuration,
  trackErrors: () => trackErrors,
  trackSuccesses: () => trackSuccesses,
  transposeOption: () => transposeOption2,
  try: () => try_2,
  tryPromise: () => tryPromise2,
  tx: () => tx,
  txRetry: () => txRetry,
  undefined: () => undefined_2,
  uninterruptible: () => uninterruptible2,
  uninterruptibleMask: () => uninterruptibleMask2,
  unwrapReason: () => unwrapReason2,
  updateContext: () => updateContext2,
  updateService: () => updateService2,
  updateServiceScoped: () => updateServiceScoped2,
  useSpan: () => useSpan2,
  validate: () => validate2,
  void: () => void_3,
  when: () => when2,
  whileLoop: () => whileLoop2,
  withErrorReporting: () => withErrorReporting2,
  withExecutionPlan: () => withExecutionPlan2,
  withFiber: () => withFiber2,
  withLogSpan: () => withLogSpan,
  withLogger: () => withLogger,
  withParentSpan: () => withParentSpan2,
  withSpan: () => withSpan2,
  withSpanScoped: () => withSpanScoped2,
  withTracer: () => withTracer2,
  withTracerEnabled: () => withTracerEnabled2,
  withTracerTiming: () => withTracerTiming2,
  yieldNow: () => yieldNow2,
  yieldNowWith: () => yieldNowWith2,
  zip: () => zip2,
  zipWith: () => zipWith2
});

// node_modules/effect/dist/Exit.js
var succeed4 = exitSucceed;
var failCause2 = exitFailCause;
var fail5 = exitFail;
var void_2 = exitVoid;
var isSuccess4 = exitIsSuccess;
var isFailure4 = exitIsFailure;

// node_modules/effect/dist/Deferred.js
var TypeId5 = "~effect/Deferred";
var DeferredProto = {
  [TypeId5]: {
    _A: identity,
    _E: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var makeUnsafe2 = () => {
  const self = Object.create(DeferredProto);
  self.resumes = void 0;
  self.effect = void 0;
  return self;
};
var _await = (self) => callback((resume) => {
  if (self.effect) return resume(self.effect);
  self.resumes ??= [];
  self.resumes.push(resume);
  return sync(() => {
    const resumes = self.resumes;
    if (resumes === void 0) return;
    const index = resumes.indexOf(resume);
    if (index >= 0) resumes.splice(index, 1);
  });
});
var completeWith = /* @__PURE__ */ dual(2, (self, effect2) => sync(() => doneUnsafe(self, effect2)));
var done3 = completeWith;
var isDone3 = (self) => sync(() => isDoneUnsafe(self));
var isDoneUnsafe = (self) => self.effect !== void 0;
var doneUnsafe = (self, effect2) => {
  if (self.effect) return false;
  self.effect = effect2;
  if (self.resumes) {
    const resumes = self.resumes;
    self.resumes = void 0;
    for (let i = 0; i < resumes.length; i++) {
      resumes[i](effect2);
    }
  }
  return true;
};

// node_modules/effect/dist/References.js
var CurrentLogAnnotations2 = CurrentLogAnnotations;
var CurrentLogSpans2 = CurrentLogSpans;
var MinimumLogLevel2 = MinimumLogLevel;
var TracerTimingEnabled2 = TracerTimingEnabled;

// node_modules/effect/dist/Scope.js
var Scope = scopeTag;
var make5 = scopeMake;
var makeUnsafe3 = scopeMakeUnsafe;
var provide = provideScope;
var addFinalizerExit = scopeAddFinalizerExit;
var addFinalizer2 = scopeAddFinalizer;
var forkUnsafe2 = scopeForkUnsafe;
var close = scopeClose;

// node_modules/effect/dist/Layer.js
var TypeId6 = "~effect/Layer";
var MemoMapTypeId = "~effect/Layer/MemoMap";
var memoMapReuse = (entry, scope3) => {
  entry.observers++;
  return andThen(scopeAddFinalizerExit(scope3, (exit3) => entry.finalizer(exit3)), entry.effect);
};
var isLayer = (u) => hasProperty(u, TypeId6);
var LayerProto = {
  [TypeId6]: {
    _ROut: identity,
    _E: identity,
    _RIn: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var fromBuildUnsafe = (build) => {
  const self = Object.create(LayerProto);
  self.build = build;
  return self;
};
var fromBuild = (build) => fromBuildUnsafe((memoMap, scope3) => {
  const layerScope = forkUnsafe2(scope3);
  return onExit(build(memoMap, layerScope), (exit3) => exit3._tag === "Failure" ? close(layerScope, exit3) : void_);
});
var fromBuildMemo = (build) => {
  const self = fromBuild((memoMap, scope3) => memoMap.getOrElseMemoize(self, scope3, build));
  return self;
};
var memoMapBuild = (memoMap, layer15, scope3, build) => {
  const layerScope = makeUnsafe3();
  const deferred = makeUnsafe2();
  const entry = {
    observers: 1,
    effect: _await(deferred),
    finalizer: (exit3) => suspend(() => {
      entry.observers--;
      if (entry.observers === 0) {
        memoMap.map.delete(layer15);
        return close(layerScope, exit3);
      }
      return void_;
    })
  };
  memoMap.map.set(layer15, entry);
  return scopeAddFinalizerExit(scope3, entry.finalizer).pipe(flatMap2(() => build(memoMap, layerScope)), onExit((exit3) => {
    entry.effect = exit3;
    return done3(deferred, exit3);
  }));
};
var MemoMapImpl = class {
  get [MemoMapTypeId]() {
    return MemoMapTypeId;
  }
  parent;
  constructor(parent) {
    this.parent = parent;
  }
  map = /* @__PURE__ */ new Map();
  get(layer15, scope3) {
    const local = this.map.get(layer15);
    if (local) {
      return memoMapReuse(local, scope3);
    }
    return this.parent?.get(layer15, scope3);
  }
  getOrElseMemoize(layer15, scope3, build) {
    return suspend(() => {
      const existing = this.get(layer15, scope3);
      if (existing) {
        return existing;
      }
      return memoMapBuild(this, layer15, scope3, build);
    });
  }
};
var makeMemoMapUnsafe = () => new MemoMapImpl();
var forkMemoMapUnsafe = (parent) => new MemoMapImpl(parent);
var CurrentMemoMap = class _CurrentMemoMap extends (/* @__PURE__ */ Service()("effect/Layer/CurrentMemoMap")) {
  static forkOrCreate(self) {
    const current = getOrUndefined2(self, _CurrentMemoMap);
    return current ? forkMemoMapUnsafe(current) : makeMemoMapUnsafe();
  }
};
var buildWithMemoMap = /* @__PURE__ */ dual(3, (self, memoMap, scope3) => provideService(map4(self.build(memoMap, scope3), add(CurrentMemoMap, memoMap)), CurrentMemoMap, memoMap));
var buildWithScope = /* @__PURE__ */ dual(2, (self, scope3) => withFiber((fiber3) => buildWithMemoMap(self, CurrentMemoMap.forkOrCreate(fiber3.context), scope3)));
var succeed5 = function() {
  if (arguments.length === 1) {
    return (resource) => succeedContext(make2(arguments[0], resource));
  }
  return succeedContext(make2(arguments[0], arguments[1]));
};
var succeedContext = (context3) => fromBuildUnsafe(constant(succeed3(context3)));
var effect = function() {
  if (arguments.length === 1) {
    return (effect2) => effectImpl(arguments[0], effect2);
  }
  return effectImpl(arguments[0], arguments[1]);
};
var effectImpl = (service3, effect2) => effectContext(map4(effect2, (value3) => make2(service3, value3)));
var effectContext = (effect2) => fromBuildMemo((_, scope3) => provide(effect2, scope3));
var mergeAllEffect = (layers, memoMap, scope3) => {
  const parentScope = forkUnsafe2(scope3, "parallel");
  return forEach(layers, (layer15) => layer15.build(memoMap, forkUnsafe2(parentScope, "sequential")), {
    concurrency: layers.length
  }).pipe(map4((context3) => mergeAll(...context3)));
};
var mergeAll2 = (...layers) => fromBuild((memoMap, scope3) => mergeAllEffect(layers, memoMap, scope3));
var provideWith = (self, that, f) => fromBuild((memoMap, scope3) => flatMap2(Array.isArray(that) ? mergeAllEffect(that, memoMap, scope3) : that.build(memoMap, scope3), (context3) => self.build(memoMap, scope3).pipe(provideContext(context3), map4((merged) => f(merged, context3)))));
var provide2 = /* @__PURE__ */ dual(2, (self, that) => provideWith(self, that, identity));
var provideMerge = /* @__PURE__ */ dual(2, (self, that) => provideWith(self, that, (self2, that2) => merge(that2, self2)));

// node_modules/effect/dist/ExecutionPlan.js
var TypeId7 = "~effect/ExecutionPlan";
var Proto2 = {
  [TypeId7]: TypeId7,
  get captureRequirements() {
    const self = this;
    return contextWith((context3) => succeed3(makeProto(self.steps.map((step) => ({
      ...step,
      provide: isLayer(step.provide) ? provide2(step.provide, succeedContext(context3)) : step.provide
    })))));
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var makeProto = (steps) => {
  const self = Object.create(Proto2);
  self.steps = steps;
  return self;
};
var CurrentMetadata = /* @__PURE__ */ Reference("effect/ExecutionPlan/CurrentMetadata", {
  defaultValue: /* @__PURE__ */ constant({
    attempt: 0,
    stepIndex: 0
  })
});

// node_modules/effect/dist/Clock.js
var Clock = ClockRef;

// node_modules/effect/dist/Number.js
var Number3 = globalThis.Number;
var round = /* @__PURE__ */ dual(2, (self, precision) => {
  const factor = Math.pow(10, precision);
  return Math.round(self * factor) / factor;
});

// node_modules/effect/dist/Pull.js
var catchDone = /* @__PURE__ */ dual(2, (effect2, f) => catchCauseFilter(effect2, filterDoneLeftover, (l) => f(l)));
var isDoneCause = (cause) => cause.reasons.some(isDoneFailure);
var isDoneFailure = (failure) => failure._tag === "Fail" && isDone2(failure.error);
var filterDone = (cause) => {
  let done4;
  let hasFailure = false;
  for (const reason of cause.reasons) {
    if (isDoneFailure(reason)) {
      done4 ??= reason.error;
    } else if (reason._tag !== "Interrupt") {
      hasFailure = true;
    }
  }
  if (done4 === void 0) return fail2(cause);
  return hasFailure ? fail2(fromReasons(cause.reasons.filter((reason) => !isDoneFailure(reason)))) : succeed2(done4);
};
var filterDoneLeftover = (cause) => {
  const done4 = filterDone(cause);
  return isFailure2(done4) ? done4 : succeed2(done4.success.value);
};
var doneExitFromCause = (cause) => {
  const halt = filterDone(cause);
  return !isFailure2(halt) ? succeed4(halt.success.value) : failCause2(halt.failure);
};
var matchEffect2 = /* @__PURE__ */ dual(2, (self, options) => matchCauseEffect(self, {
  onSuccess: options.onSuccess,
  onFailure: (cause) => {
    const halt = filterDone(cause);
    return !isFailure2(halt) ? options.onDone(halt.success.value) : options.onFailure(halt.failure);
  }
}));

// node_modules/effect/dist/Schedule.js
var TypeId8 = "~effect/Schedule";
var CurrentMetadata2 = /* @__PURE__ */ Reference("effect/Schedule/CurrentMetadata", {
  defaultValue: /* @__PURE__ */ constant({
    input: void 0,
    output: void 0,
    duration: zero,
    attempt: 0,
    start: 0,
    now: 0,
    elapsed: 0,
    elapsedSincePrevious: 0
  })
});
var ScheduleProto = {
  [TypeId8]: {
    _Out: identity,
    _In: identity,
    _Env: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var isSchedule = (u) => hasProperty(u, TypeId8);
var fromStep = (step) => {
  const self = Object.create(ScheduleProto);
  self.step = step;
  return self;
};
var metadataFn = () => {
  let n = 0;
  let previous;
  let start;
  return (now2, input) => {
    if (start === void 0) start = now2;
    const elapsed = now2 - start;
    const elapsedSincePrevious = previous === void 0 ? 0 : now2 - previous;
    previous = now2;
    return {
      input,
      attempt: ++n,
      start,
      now: now2,
      elapsed,
      elapsedSincePrevious
    };
  };
};
var fromStepWithMetadata = (step) => fromStep(map4(step, (f) => {
  const meta = metadataFn();
  return (now2, input) => f(meta(now2, input));
}));
var toStep = (schedule3) => catchCause(schedule3.step, (cause) => succeed3(() => failCause(cause)));
var toStepWithMetadata = (schedule3) => clockWith((clock) => map4(toStep(schedule3), (step) => {
  const metaFn = metadataFn();
  return (input) => suspend(() => {
    const now2 = clock.currentTimeMillisUnsafe();
    return flatMap2(step(now2, input), ([output, duration]) => {
      const meta = metaFn(now2, input);
      meta.output = output;
      meta.duration = duration;
      return as(sleep(duration), meta);
    });
  });
}));
var passthrough = (self) => fromStep(map4(toStep(self), (step) => (now2, input) => matchEffect2(step(now2, input), {
  onSuccess: (result3) => succeed3([input, result3[1]]),
  onFailure: failCause,
  onDone: () => done2(input)
})));
var recurs = (times) => while_(forever2, ({
  attempt
}) => succeed3(attempt <= times));
var spaced = (duration) => {
  const decoded = fromInputUnsafe(duration);
  return fromStepWithMetadata(succeed3((meta) => succeed3([meta.attempt - 1, decoded])));
};
var while_ = /* @__PURE__ */ dual(2, (self, predicate) => fromStep(map4(toStep(self), (step) => {
  const meta = metadataFn();
  return (now2, input) => flatMap2(step(now2, input), (result3) => {
    const [output, duration] = result3;
    const eff = predicate({
      ...meta(now2, input),
      output,
      duration
    });
    return flatMap2(isEffect(eff) ? eff : succeed3(eff), (check) => check ? succeed3(result3) : done2(output));
  });
})));
var forever2 = /* @__PURE__ */ spaced(zero);

// node_modules/effect/dist/internal/layer.js
var provideLayer = (self, layer15, options) => scopedWith((scope3) => flatMap2(options?.local ? buildWithMemoMap(layer15, makeMemoMapUnsafe(), scope3) : buildWithScope(layer15, scope3), (context3) => provideContext(self, context3)));
var provide3 = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, source, options) => isContext(source) ? provideContext(self, source) : provideLayer(self, Array.isArray(source) ? mergeAll2(...source) : source, options));

// node_modules/effect/dist/internal/schedule.js
var repeatOrElse = /* @__PURE__ */ dual(3, (self, schedule3, orElse4) => flatMap2(toStepWithMetadata(schedule3), (step) => {
  let meta = CurrentMetadata2.defaultValue();
  return catch_(forever(tap(flatMap2(suspend(() => provideService(self, CurrentMetadata2, meta)), step), (meta_) => sync(() => {
    meta = meta_;
  })), {
    disableYield: true
  }), (error2) => isDone(error2) ? succeed3(error2.value) : orElse4(error2, meta.attempt === 0 ? none2() : some2(meta)));
}));
var retryOrElse = /* @__PURE__ */ dual(3, (self, policy, orElse4) => flatMap2(toStepWithMetadata(policy), (step) => {
  let meta = CurrentMetadata2.defaultValue();
  let lastError;
  const loop = catch_(suspend(() => provideService(self, CurrentMetadata2, meta)), (error2) => {
    lastError = error2;
    return flatMap2(step(error2), (meta_) => {
      meta = meta_;
      return loop;
    });
  });
  return catchDone(loop, (out) => internalCall(() => orElse4(lastError, out)));
}));
var repeat = /* @__PURE__ */ dual(2, (self, options) => {
  const schedule3 = typeof options === "function" ? options(identity) : isSchedule(options) ? options : buildFromOptions(options);
  return repeatOrElse(self, schedule3, fail3);
});
var retry = /* @__PURE__ */ dual(2, (self, options) => {
  const schedule3 = typeof options === "function" ? options(identity) : isSchedule(options) ? options : buildFromOptions(options);
  return retryOrElse(self, schedule3, fail3);
});
var scheduleFrom = /* @__PURE__ */ dual(3, (self, initial, schedule3) => flatMap2(toStepWithMetadata(schedule3), (step) => {
  let meta = CurrentMetadata2.defaultValue();
  const selfWithMeta = suspend(() => provideService(self, CurrentMetadata2, meta));
  return catch_(flatMap2(step(initial), (meta_) => {
    meta = meta_;
    const body = constant(flatMap2(selfWithMeta, step));
    return whileLoop({
      while: constTrue,
      body,
      step(meta_2) {
        meta = meta_2;
      }
    });
  }), (error2) => isDone(error2) ? succeed3(error2.value) : fail3(error2));
}));
var passthroughForever = /* @__PURE__ */ passthrough(forever2);
var buildFromOptions = (options) => {
  let schedule3 = options.schedule ? passthrough(options.schedule) : passthroughForever;
  if (options.while) {
    schedule3 = while_(schedule3, ({
      input
    }) => {
      const applied = options.while(input);
      return isEffect(applied) ? applied : succeed3(applied);
    });
  }
  if (options.until) {
    schedule3 = while_(schedule3, ({
      input
    }) => {
      const applied = options.until(input);
      return isEffect(applied) ? map4(applied, (b) => !b) : succeed3(!applied);
    });
  }
  if (options.times !== void 0) {
    schedule3 = while_(schedule3, ({
      attempt
    }) => succeed3(attempt <= options.times));
  }
  return schedule3;
};

// node_modules/effect/dist/internal/executionPlan.js
var makeEventEmitter = (onEvent, currentMetadata) => {
  let lastStepIndex = -1;
  let stepAttempt = 0;
  const emit = (event) => ignoreCause(onEvent(event));
  return {
    begin: clockWith((clock) => suspend(() => {
      const meta = currentMetadata();
      if (meta.stepIndex !== lastStepIndex) {
        lastStepIndex = meta.stepIndex;
        stepAttempt = 0;
      }
      stepAttempt++;
      const state = {
        attempt: meta.attempt,
        stepAttempt,
        stepIndex: meta.stepIndex,
        startNanos: clock.monotonicTimeNanosUnsafe()
      };
      return as(emit({
        _tag: "AttemptStart",
        attempt: state.attempt,
        stepAttempt: state.stepAttempt,
        stepIndex: state.stepIndex
      }), state);
    })),
    end: (state, exit3) => clockWith((clock) => {
      const duration = nanos(clock.monotonicTimeNanosUnsafe() - state.startNanos);
      return emit(exit3._tag === "Success" ? {
        _tag: "AttemptSuccess",
        attempt: state.attempt,
        stepAttempt: state.stepAttempt,
        stepIndex: state.stepIndex,
        duration
      } : {
        _tag: "AttemptFailure",
        attempt: state.attempt,
        stepAttempt: state.stepAttempt,
        stepIndex: state.stepIndex,
        duration,
        cause: exit3.cause
      });
    })
  };
};
var withExecutionPlan = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, plan, options) => suspend(() => {
  let i = 0;
  let meta = {
    attempt: 0,
    stepIndex: 0
  };
  const provideMeta = provideServiceEffect(CurrentMetadata, sync(() => {
    meta = {
      attempt: meta.attempt + 1,
      stepIndex: i
    };
    return meta;
  }));
  const emitter = options?.onEvent === void 0 ? void 0 : makeEventEmitter(options.onEvent, () => meta);
  const instrument = emitter === void 0 ? identity : (attempt) => uninterruptibleMask((restore) => flatMap2(emitter.begin, (state) => onExit(restore(attempt), (exit3) => emitter.end(state, exit3))));
  let result3;
  return flatMap2(whileLoop({
    while: () => i < plan.steps.length && (result3 === void 0 || isFailure2(result3)),
    body() {
      const step = plan.steps[i];
      let nextEffect = provideMeta(instrument(provide3(self, step.provide)));
      if (result3) {
        let attempted = false;
        const wrapped = nextEffect;
        nextEffect = suspend(() => {
          if (attempted) return wrapped;
          attempted = true;
          return fromResult(result3);
        });
        nextEffect = retry(nextEffect, scheduleFromStep(step, false));
      } else {
        const schedule3 = scheduleFromStep(step, true);
        nextEffect = schedule3 ? retry(nextEffect, schedule3) : nextEffect;
      }
      return result(nextEffect);
    },
    step(result_) {
      result3 = result_;
      i++;
    }
  }), () => fromResult(result3));
}));
var scheduleFromStep = (step, first) => {
  if (!first) {
    return buildFromOptions({
      schedule: step.schedule ? step.schedule : step.attempts ? void 0 : scheduleOnce,
      times: step.attempts,
      while: step.while
    });
  } else if (step.attempts === 1 || !(step.schedule || step.attempts)) {
    return void 0;
  }
  return buildFromOptions({
    schedule: step.schedule,
    while: step.while,
    times: step.attempts ? step.attempts - 1 : void 0
  });
};
var scheduleOnce = /* @__PURE__ */ recurs(1);

// node_modules/effect/dist/Request.js
var TypeId9 = "~effect/Request";
var requestVariance = /* @__PURE__ */ byReferenceUnsafe({
  /* c8 ignore next */
  _E: (_) => _,
  /* c8 ignore next */
  _A: (_) => _,
  /* c8 ignore next */
  _R: (_) => _
});
var RequestPrototype = {
  ...StructuralProto,
  [TypeId9]: requestVariance
};
var makeEntry = (options) => options;

// node_modules/effect/dist/internal/request.js
var request = /* @__PURE__ */ dual(2, (self, resolver) => {
  const withResolver = (resolver2) => callback((resume) => {
    const entry = addEntry(resolver2, self, resume, getCurrentFiber());
    return maybeRemoveEntry(resolver2, entry);
  });
  return isEffect(resolver) ? flatMap2(resolver, withResolver) : withResolver(resolver);
});
var requestUnsafe = (self, options) => {
  const entry = addEntry(options.resolver, self, options.onExit, {
    context: options.context,
    currentScheduler: get(options.context, Scheduler)
  });
  return () => removeEntryUnsafe(options.resolver, entry);
};
var batchPool = [];
var pendingBatches = /* @__PURE__ */ new WeakMap();
var addEntry = (resolver, request3, resume, fiber3) => {
  let batchMap = pendingBatches.get(resolver);
  if (!batchMap) {
    batchMap = /* @__PURE__ */ new Map();
    pendingBatches.set(resolver, batchMap);
  }
  let batch;
  let completed = false;
  const entry = makeEntry({
    request: request3,
    context: fiber3.context,
    uninterruptible: false,
    completeUnsafe(effect2) {
      if (completed) return;
      completed = true;
      resume(effect2);
      batch?.entrySet.delete(entry);
    }
  });
  if (resolver.preCheck !== void 0 && !resolver.preCheck(entry)) {
    return entry;
  }
  const key = resolver.batchKey(entry);
  batch = batchMap.get(key);
  if (!batch) {
    if (batchPool.length > 0) {
      batch = batchPool.pop();
      batch.key = key;
      batch.resolver = resolver;
      batch.map = batchMap;
    } else {
      const newBatch = {
        key,
        resolver,
        map: batchMap,
        entrySet: /* @__PURE__ */ new Set(),
        entries: /* @__PURE__ */ new Set(),
        delayEffect: flatMap2(suspend(() => newBatch.resolver.delay), (_) => runBatch(newBatch)),
        run: onExit(suspend(() => newBatch.resolver.runAll(Array.from(newBatch.entries), newBatch.key)), (exit3) => {
          for (const entry2 of newBatch.entrySet) {
            entry2.completeUnsafe(exit3._tag === "Success" ? exitDie(new Error("Effect.request: RequestResolver did not complete request", {
              cause: entry2.request
            })) : exit3);
          }
          newBatch.entries.clear();
          if (batchPool.length < 128) {
            newBatch.entrySet.clear();
            newBatch.key = void 0;
            newBatch.fiber = void 0;
            newBatch.resolver = void 0;
            newBatch.map = void 0;
            batchPool.push(newBatch);
          }
          return void_;
        })
      };
      batch = newBatch;
    }
    batchMap.set(key, batch);
    batch.fiber = runForkWith(fiber3.context)(batch.delayEffect, {
      scheduler: fiber3.currentScheduler
    });
  }
  batch.entrySet.add(entry);
  batch.entries.add(entry);
  if (batch.resolver.collectWhile(batch.entries)) return entry;
  batch.fiber.interruptUnsafe(fiber3.id);
  batch.fiber = runForkWith(fiber3.context)(runBatch(batch), {
    scheduler: fiber3.currentScheduler
  });
  return entry;
};
var removeEntryUnsafe = (resolver, entry) => {
  if (entry.uninterruptible) return;
  const batchMap = pendingBatches.get(resolver);
  if (!batchMap) return;
  const key = resolver.batchKey(entry);
  const batch = batchMap.get(key);
  if (!batch) return;
  batch.entries.delete(entry);
  batch.entrySet.delete(entry);
  if (batch.entries.size === 0) {
    batchMap.delete(key);
    batch.fiber?.interruptUnsafe();
  }
};
var maybeRemoveEntry = (resolver, entry) => sync(() => removeEntryUnsafe(resolver, entry));
function runBatch(batch) {
  if (!batch.map.has(batch.key)) return void_;
  batch.map.delete(batch.key);
  return batch.run;
}

// node_modules/effect/dist/Metric.js
var CurrentMetricAttributesKey = "effect/Metric/CurrentMetricAttributes";
var CurrentMetricAttributes = /* @__PURE__ */ Reference(CurrentMetricAttributesKey, {
  defaultValue: () => ({})
});
var MetricRegistryKey = "~effect/observability/Metric/MetricRegistryKey";
var MetricRegistry = /* @__PURE__ */ Reference(MetricRegistryKey, {
  defaultValue: () => /* @__PURE__ */ new Map()
});
var TypeId10 = "~effect/observability/Metric";
var Metric$ = class {
  [TypeId10] = TypeId10;
  #metadataCache = /* @__PURE__ */ new WeakMap();
  #metadata;
  id;
  description;
  attributes;
  constructor(id, description, attributes) {
    this.id = id;
    this.description = description;
    this.attributes = attributes;
  }
  valueUnsafe(context3) {
    return this.hook(context3).get(context3);
  }
  modifyUnsafe(input, context3) {
    return this.hook(context3).modify(input, context3);
  }
  updateUnsafe(input, context3) {
    return this.hook(context3).update(input, context3);
  }
  hook(context3) {
    const extraAttributes = get(context3, CurrentMetricAttributes);
    if (Object.keys(extraAttributes).length === 0) {
      if (isNotUndefined(this.#metadata)) {
        return this.#metadata.hooks;
      }
      this.#metadata = this.getOrCreate(context3, this.attributes);
      return this.#metadata.hooks;
    }
    const mergedAttributes = mergeAttributes(this.attributes, extraAttributes);
    let metadata = this.#metadataCache.get(mergedAttributes);
    if (isNotUndefined(metadata)) {
      return metadata.hooks;
    }
    metadata = this.getOrCreate(context3, mergedAttributes);
    this.#metadataCache.set(mergedAttributes, metadata);
    return metadata.hooks;
  }
  getOrCreate(context3, attributes) {
    const key = makeKey(this, attributes);
    const registry = get(context3, MetricRegistry);
    if (registry.has(key)) {
      return registry.get(key);
    }
    const hooks = this.createHooks();
    const meta = {
      id: this.id,
      type: this.type,
      description: this.description,
      attributes: attributesToRecord(attributes),
      hooks
    };
    registry.set(key, meta);
    return meta;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var update = /* @__PURE__ */ dual(2, (self, input) => contextWith((services) => sync(() => self.updateUnsafe(input, services))));
function makeKey(metric, attributes) {
  let key = `${metric.type}:${metric.id}`;
  if (isNotUndefined(metric.description)) {
    key += `:${metric.description}`;
  }
  if (isNotUndefined(attributes)) {
    key += `:${serializeAttributes(attributes)}`;
  }
  return key;
}
function serializeAttributes(attributes) {
  return JSON.stringify(Array.isArray(attributes) ? attributes : Object.entries(attributes));
}
function mergeAttributes(self, other) {
  return {
    ...attributesToRecord(self),
    ...attributesToRecord(other)
  };
}
function attributesToRecord(attributes) {
  if (isNotUndefined(attributes) && Array.isArray(attributes)) {
    return attributes.reduce((acc, [key, value3]) => {
      assignProperty(acc, key, value3);
      return acc;
    }, {});
  }
  return attributes;
}

// node_modules/effect/dist/Effect.js
var TypeId11 = EffectTypeId;
var isEffect2 = isEffect;
var all2 = all;
var partition3 = partition2;
var reduce3 = reduce2;
var validate2 = validate;
var findFirst4 = findFirst3;
var findFirstFilter2 = findFirstFilter;
var forEach2 = forEach;
var head2 = head;
var whileLoop2 = whileLoop;
var promise2 = promise;
var tryPromise2 = tryPromise;
var succeed6 = succeed3;
var succeedNone2 = succeedNone;
var succeedSome2 = succeedSome;
var suspend2 = suspend;
var sync2 = sync;
var void_3 = void_;
var undefined_2 = undefined_;
var callback2 = callback;
var never2 = never;
var Do2 = Do;
var bindTo3 = bindTo2;
var let_3 = let_2;
var bind3 = bind2;
var gen2 = gen;
var fail6 = fail3;
var failSync2 = failSync;
var failCause3 = failCause;
var failCauseSync2 = failCauseSync;
var die3 = die;
var try_2 = try_;
var yieldNow2 = yieldNow;
var yieldNowWith2 = yieldNowWith;
var withFiber2 = withFiber;
var fromResult2 = fromResult;
var fromOption3 = fromOption2;
var transposeOption2 = transposeOption;
var fromNullishOr3 = fromNullishOr2;
var flatMap3 = flatMap2;
var flatten3 = flatten2;
var andThen2 = andThen;
var tap2 = tap;
var result2 = result;
var option2 = option;
var exit2 = exit;
var map6 = map4;
var as2 = as;
var asSome2 = asSome;
var asVoid2 = asVoid;
var flip2 = flip;
var zip2 = zip;
var zipWith2 = zipWith;
var catch_2 = catch_;
var catchTag2 = catchTag;
var catchTags2 = catchTags;
var catchReason2 = catchReason;
var catchReasons2 = catchReasons;
var unwrapReason2 = unwrapReason;
var catchCause2 = catchCause;
var catchDefect2 = catchDefect;
var catchIf2 = catchIf;
var catchFilter2 = catchFilter;
var catchNoSuchElement2 = catchNoSuchElement;
var catchCauseIf2 = catchCauseIf;
var catchCauseFilter2 = catchCauseFilter;
var mapError2 = mapError;
var mapBoth2 = mapBoth;
var orDie2 = orDie;
var tapError2 = tapError;
var tapErrorTag2 = tapErrorTag;
var tapCause2 = tapCause;
var tapCauseIf2 = tapCauseIf;
var tapCauseFilter2 = tapCauseFilter;
var tapDefect2 = tapDefect;
var eventually2 = eventually;
var retry2 = retry;
var retryOrElse2 = retryOrElse;
var sandbox2 = sandbox;
var ignore2 = ignore;
var ignoreCause2 = ignoreCause;
var withExecutionPlan2 = withExecutionPlan;
var withErrorReporting2 = withErrorReporting;
var orElseSucceed2 = orElseSucceed;
var firstSuccessOf2 = firstSuccessOf;
var timeout2 = timeout;
var timeoutOption2 = timeoutOption;
var timeoutOrElse2 = timeoutOrElse;
var delay2 = delay;
var sleep2 = sleep;
var timed2 = timed;
var raceAll2 = raceAll;
var raceAllFirst2 = raceAllFirst;
var race2 = race;
var raceFirst2 = raceFirst;
var filter4 = filter3;
var filterMap2 = filterMap;
var filterMapEffect2 = filterMapEffect;
var filterOrElse2 = filterOrElse;
var filterMapOrElse2 = filterMapOrElse;
var filterOrFail2 = filterOrFail;
var filterMapOrFail2 = filterMapOrFail;
var when2 = when;
var match6 = match5;
var matchEager2 = matchEager;
var matchCause2 = matchCause;
var matchCauseEager2 = matchCauseEager;
var matchCauseEffectEager2 = matchCauseEffectEager;
var matchCauseEffect2 = matchCauseEffect;
var matchEffect3 = matchEffect;
var isFailure5 = isFailure3;
var isSuccess5 = isSuccess3;
var context2 = context;
var contextWith2 = contextWith;
var provide4 = provide3;
var provideContext2 = provideContext;
var setContext2 = setContext;
var service2 = service;
var serviceOption2 = serviceOption;
var updateContext2 = updateContext;
var updateService2 = updateService;
var updateServiceScoped2 = updateServiceScoped;
var provideService2 = provideService;
var provideServiceEffect2 = provideServiceEffect;
var scope2 = scope;
var scoped2 = scoped;
var scopedWith2 = scopedWith;
var acquireRelease2 = acquireRelease;
var acquireDisposable2 = acquireDisposable;
var acquireUseRelease2 = acquireUseRelease;
var addFinalizer3 = addFinalizer;
var ensuring2 = ensuring;
var onError2 = onError;
var onErrorIf2 = onErrorIf;
var onErrorFilter2 = onErrorFilter;
var onExitPrimitive2 = onExitPrimitive;
var onExit2 = onExit;
var onExitIf2 = onExitIf;
var onExitFilter2 = onExitFilter;
var cached2 = cached;
var cachedWithTTL2 = cachedWithTTL;
var cachedInvalidateWithTTL2 = cachedInvalidateWithTTL;
var interrupt2 = interrupt;
var interruptible2 = interruptible;
var onInterrupt2 = onInterrupt;
var uninterruptible2 = uninterruptible;
var uninterruptibleMask2 = uninterruptibleMask;
var interruptibleMask2 = interruptibleMask;
var abortSignal2 = abortSignal;
var forever3 = forever;
var repeat2 = repeat;
var repeatOrElse2 = repeatOrElse;
var replicate2 = replicate;
var replicateEffect2 = replicateEffect;
var schedule = /* @__PURE__ */ dual(2, (self, schedule3) => scheduleFrom2(self, void 0, schedule3));
var scheduleFrom2 = scheduleFrom;
var tracer2 = tracer;
var withTracer2 = withTracer;
var withTracerEnabled2 = withTracerEnabled;
var withTracerTiming2 = withTracerTiming;
var annotateSpans2 = annotateSpans;
var annotateCurrentSpan2 = annotateCurrentSpan;
var currentSpan2 = currentSpan;
var currentParentSpan2 = currentParentSpan;
var spanAnnotations2 = spanAnnotations;
var spanLinks2 = spanLinks;
var linkSpans2 = linkSpans;
var makeSpan2 = makeSpan;
var makeSpanScoped2 = makeSpanScoped;
var useSpan2 = useSpan;
var withSpan2 = withSpan;
var withSpanScoped2 = withSpanScoped;
var withParentSpan2 = withParentSpan;
var request2 = request;
var requestUnsafe2 = requestUnsafe;
var forkChild2 = forkChild;
var forkIn2 = forkIn;
var forkScoped2 = forkScoped;
var forkDetach2 = forkDetach;
var awaitAllChildren2 = awaitAllChildren;
var fiber2 = fiber;
var fiberId2 = fiberId;
var runFork2 = runFork;
var runForkWith2 = runForkWith;
var runCallbackWith2 = runCallbackWith;
var runCallback2 = runCallback;
var runPromise2 = runPromise;
var runPromiseWith2 = runPromiseWith;
var runPromiseExit2 = runPromiseExit;
var runPromiseExitWith2 = runPromiseExitWith;
var runSync2 = runSync;
var runSyncWith2 = runSyncWith;
var runSyncExit2 = runSyncExit;
var runSyncExitWith2 = runSyncExitWith;
var fnUntraced2 = fnUntraced;
var fn2 = fn;
var clockWith2 = clockWith;
var logWithLevel2 = logWithLevel;
var log = /* @__PURE__ */ logWithLevel();
var logFatal = /* @__PURE__ */ logWithLevel("Fatal");
var logWarning = /* @__PURE__ */ logWithLevel("Warn");
var logError = /* @__PURE__ */ logWithLevel("Error");
var logInfo = /* @__PURE__ */ logWithLevel("Info");
var logDebug = /* @__PURE__ */ logWithLevel("Debug");
var logTrace = /* @__PURE__ */ logWithLevel("Trace");
var withLogger = /* @__PURE__ */ dual(2, (effect2, logger) => updateService(effect2, CurrentLoggers, (loggers) => /* @__PURE__ */ new Set([...loggers, logger])));
var annotateLogs = /* @__PURE__ */ dual((args2) => isEffect2(args2[0]), (effect2, ...args2) => updateService(effect2, CurrentLogAnnotations2, (annotations) => {
  const newAnnotations = args2.length === 1 ? {
    ...annotations,
    ...args2[0]
  } : {
    ...annotations
  };
  if (args2.length === 1) {
    return newAnnotations;
  } else {
    assignProperty(newAnnotations, args2[0], args2[1]);
  }
  return newAnnotations;
}));
var annotateLogsScoped2 = annotateLogsScoped;
var withLogSpan = /* @__PURE__ */ dual(2, (effect2, label) => flatMap2(currentTimeMillis, (now2) => updateService(effect2, CurrentLogSpans2, (spans) => {
  const span = [label, now2];
  return [span, ...spans];
})));
var track = /* @__PURE__ */ dual((args2) => isEffect2(args2[0]), (self, metric, f) => onExit2(self, (exit3) => {
  const input = f === void 0 ? exit3 : internalCall(() => f(exit3));
  return update(metric, input);
}));
var trackSuccesses = /* @__PURE__ */ dual((args2) => isEffect2(args2[0]), (self, metric, f) => tap2(self, (value3) => {
  const input = f === void 0 ? value3 : f(value3);
  return update(metric, input);
}));
var trackErrors = /* @__PURE__ */ dual((args2) => isEffect2(args2[0]), (self, metric, f) => tapError2(self, (error2) => {
  const input = f === void 0 ? error2 : internalCall(() => f(error2));
  return update(metric, input);
}));
var trackDefects = /* @__PURE__ */ dual((args2) => isEffect2(args2[0]), (self, metric, f) => tapDefect2(self, (defect) => {
  const input = f === void 0 ? defect : internalCall(() => f(defect));
  return update(metric, input);
}));
var trackDuration = /* @__PURE__ */ dual((args2) => isEffect2(args2[0]), (self, metric, f) => clockWith2((clock) => {
  const startTime = clock.monotonicTimeNanosUnsafe();
  return onExit2(self, () => {
    const endTime = clock.monotonicTimeNanosUnsafe();
    const duration = subtract(fromInputUnsafe(endTime), fromInputUnsafe(startTime));
    const input = f === void 0 ? duration : internalCall(() => f(duration));
    return update(metric, input);
  });
}));
var Transaction = class extends (/* @__PURE__ */ Service()("effect/Effect/Transaction")) {
};
var tx = (effect2) => withFiber2((fiber3) => {
  let state = getOrUndefined2(fiber3.context, Transaction);
  if (state) {
    return effect2;
  }
  state = {
    journal: /* @__PURE__ */ new Map(),
    retry: false
  };
  let result3;
  return uninterruptibleMask2((restore) => flatMap3(whileLoop2({
    while: () => !result3,
    body: constant(restore(effect2).pipe(provideService2(Transaction, state), tapCause2(() => {
      if (!state.retry) return void_3;
      return restore(awaitPendingTransaction(state));
    }), exit2)),
    step(exit3) {
      if (state.retry || !isTransactionConsistent(state)) {
        return clearTransaction(state);
      }
      if (isSuccess4(exit3)) {
        commitTransaction(fiber3, state);
      } else {
        clearTransaction(state);
      }
      result3 = exit3;
    }
  }), () => result3));
});
var isTransactionConsistent = (state) => {
  for (const [ref, {
    version
  }] of state.journal) {
    if (ref.version !== version) {
      return false;
    }
  }
  return true;
};
var awaitPendingTransaction = (state) => suspend2(() => {
  const key = {};
  const refs = Array.from(state.journal.keys());
  const clearPending = () => {
    for (const clear4 of refs) {
      clear4.pending.delete(key);
    }
  };
  return callback2((resume) => {
    const onCall = () => {
      clearPending();
      resume(void_3);
    };
    for (const ref of refs) {
      ref.pending.set(key, onCall);
    }
    return sync2(clearPending);
  });
});
function commitTransaction(fiber3, state) {
  for (const [ref, {
    value: value3
  }] of state.journal) {
    if (value3 !== ref.value) {
      ref.version = ref.version + 1;
      ref.value = value3;
    }
    for (const pending of ref.pending.values()) {
      fiber3.currentDispatcher.scheduleTask(pending, 0);
    }
    ref.pending.clear();
  }
}
function clearTransaction(state) {
  state.retry = false;
  state.journal.clear();
}
var txRetry = /* @__PURE__ */ flatMap3(Transaction, (state) => {
  state.retry = true;
  return interrupt2;
});
var effectify = (fn3, onError4, onSyncError) => (...args2) => callback2((resume) => {
  try {
    fn3(...args2, (err, result3) => {
      if (err) {
        resume(fail6(onError4 ? onError4(err, args2) : err));
      } else {
        resume(succeed6(result3));
      }
    });
  } catch (err) {
    resume(onSyncError ? fail6(onSyncError(err, args2)) : die3(err));
  }
});
var satisfiesSuccessType = () => (effect2) => effect2;
var satisfiesErrorType = () => (effect2) => effect2;
var satisfiesServicesType = () => (effect2) => effect2;
var mapEager2 = mapEager;
var mapErrorEager2 = mapErrorEager;
var mapBothEager2 = mapBothEager;
var flatMapEager2 = flatMapEager;
var catchEager2 = catchEager;
var fnUntracedEager2 = fnUntracedEager;

// node_modules/effect/dist/Runtime.js
var defaultTeardown = (exit3, onExit4) => {
  if (isSuccess4(exit3)) return onExit4(0);
  if (hasInterruptsOnly2(exit3.cause)) return onExit4(130);
  return onExit4(getErrorExitCode(squash(exit3.cause)));
};
var makeRunMain = (f) => dual((args2) => isEffect2(args2[0]), (effect2, options) => {
  const fiber3 = options?.disableErrorReporting === true ? runFork2(effect2) : runFork2(tapCause2(effect2, (cause) => {
    if (hasInterruptsOnly2(cause)) return void_3;
    const isReported = getErrorReported(squash(cause));
    return isReported ? logError(cause) : void_3;
  }));
  try {
    const keepAlive = globalThis.setInterval(constVoid, 2147483647);
    fiber3.addObserver(() => {
      clearInterval(keepAlive);
    });
  } catch {
  }
  const teardown = options?.teardown ?? defaultTeardown;
  return f({
    fiber: fiber3,
    teardown
  });
});
var errorExitCode = "~effect/Runtime/errorExitCode";
var getErrorExitCode = (u) => {
  if (typeof u === "object" && u !== null && errorExitCode in u) {
    const code2 = u[errorExitCode];
    if (typeof code2 === "number") {
      return code2;
    }
  }
  return 1;
};
var errorReported = "~effect/Runtime/errorReported";
var getErrorReported = (u) => {
  if (typeof u === "object" && u !== null && errorReported in u) {
    const isReported = u[errorReported];
    if (typeof isReported === "boolean") {
      return isReported;
    }
  }
  return true;
};

// node_modules/@effect/platform-node-shared/dist/NodeRuntime.js
var runMain = /* @__PURE__ */ makeRunMain(({
  fiber: fiber3,
  teardown
}) => {
  let receivedSignal = false;
  fiber3.addObserver((exit3) => {
    process.removeListener("SIGINT", onSigint);
    process.removeListener("SIGTERM", onSigint);
    teardown(exit3, (code2) => {
      if (receivedSignal || code2 !== 0) {
        process.exit(code2);
      }
    });
  });
  function onSigint() {
    receivedSignal = true;
    fiber3.interruptUnsafe(fiber3.id);
  }
  process.on("SIGINT", onSigint);
  process.on("SIGTERM", onSigint);
});

// node_modules/@effect/platform-node/dist/NodeRuntime.js
var runMain2 = runMain;

// node_modules/effect/dist/PlatformError.js
var TypeId12 = "~effect/platform/PlatformError";
var BadArgument = class extends (/* @__PURE__ */ TaggedError2("BadArgument")) {
  /**
   * Formats the module, method, and optional description that rejected the argument.
   *
   * **When to use**
   *
   * Use to read the formatted error message for a rejected platform argument.
   *
   * @since 4.0.0
   */
  get message() {
    return `${this.module}.${this.method}${this.description ? `: ${this.description}` : ""}`;
  }
};
var SystemError = class extends Error3 {
  /**
   * Formats the normalized system error tag with operation and path details.
   *
   * **When to use**
   *
   * Use to read the formatted error message for a normalized system failure.
   *
   * @since 4.0.0
   */
  get message() {
    return `${this._tag}: ${this.module}.${this.method}${this.pathOrDescriptor !== void 0 ? ` (${this.pathOrDescriptor})` : ""}${this.description ? `: ${this.description}` : ""}`;
  }
};
var PlatformError = class extends (/* @__PURE__ */ TaggedError2("PlatformError")) {
  constructor(reason) {
    if ("cause" in reason) {
      super({
        reason,
        cause: reason.cause
      });
    } else {
      super({
        reason
      });
    }
  }
  /**
   * Marks this value as a platform error wrapper for runtime guards.
   *
   * **When to use**
   *
   * Use to identify `PlatformError` values through their runtime type marker.
   *
   * @since 4.0.0
   */
  [TypeId12] = TypeId12;
  get message() {
    return this.reason.message;
  }
};
var systemError = (options) => new PlatformError(new SystemError(options));
var badArgument = (options) => new PlatformError(new BadArgument(options));

// node_modules/effect/dist/Fiber.js
var interrupt3 = fiberInterrupt;
var getCurrent = getCurrentFiber;
var runIn = fiberRunIn;

// node_modules/effect/dist/Latch.js
var makeUnsafe4 = makeLatchUnsafe;

// node_modules/effect/dist/MutableRef.js
var TypeId13 = "~effect/MutableRef";
var MutableRefProto = {
  [TypeId13]: TypeId13,
  ...PipeInspectableProto,
  toJSON() {
    return {
      _id: "MutableRef",
      current: toJson(this.current)
    };
  }
};
var make6 = (value3) => {
  const ref = Object.create(MutableRefProto);
  ref.current = value3;
  return ref;
};

// node_modules/effect/dist/MutableList.js
var Empty = /* @__PURE__ */ Symbol.for("effect/MutableList/Empty");
var make7 = () => ({
  head: void 0,
  tail: void 0,
  length: 0
});
var emptyBucket = () => ({
  array: [],
  mutable: true,
  offset: 0,
  next: void 0
});
var append2 = (self, message) => {
  if (!self.tail) {
    self.head = self.tail = emptyBucket();
  } else if (!self.tail.mutable) {
    self.tail.next = emptyBucket();
    self.tail = self.tail.next;
  }
  self.tail.array.push(message);
  self.length++;
};
var clear = (self) => {
  self.head = self.tail = void 0;
  self.length = 0;
};
var takeN = (self, n) => {
  if (n <= 0 || !self.head) return [];
  n = Math.min(n, self.length);
  if (n === self.length && self.head?.offset === 0 && !self.head.next) {
    const array3 = self.head.array;
    clear(self);
    return array3;
  }
  const array2 = new Array(n);
  let index = 0;
  let chunk = self.head;
  while (chunk) {
    while (chunk.offset < chunk.array.length) {
      array2[index++] = chunk.array[chunk.offset];
      if (chunk.mutable) chunk.array[chunk.offset] = void 0;
      chunk.offset++;
      if (index === n) {
        self.head = chunk;
        self.length -= n;
        if (self.length === 0) clear(self);
        return array2;
      }
    }
    chunk = chunk.next;
  }
  clear(self);
  return array2;
};
var take = (self) => {
  if (!self.head) return Empty;
  const message = self.head.array[self.head.offset];
  if (self.head.mutable) self.head.array[self.head.offset] = void 0;
  self.head.offset++;
  self.length--;
  if (self.head.offset === self.head.array.length) {
    if (self.head.next) {
      self.head = self.head.next;
    } else {
      clear(self);
    }
  }
  return message;
};

// node_modules/effect/dist/Queue.js
var TypeId14 = "~effect/Queue";
var EnqueueTypeId = "~effect/Queue/Enqueue";
var DequeueTypeId = "~effect/Queue/Dequeue";
var variance = {
  _A: identity,
  _E: identity
};
var QueueProto = {
  [TypeId14]: variance,
  [EnqueueTypeId]: variance,
  [DequeueTypeId]: variance,
  ...PipeInspectableProto,
  toJSON() {
    return {
      _id: "effect/Queue",
      state: this.state._tag,
      size: sizeUnsafe(this)
    };
  }
};
var make8 = (options) => withFiber((fiber3) => {
  const self = Object.create(QueueProto);
  self.dispatcher = fiber3.currentDispatcher;
  self.capacity = options?.capacity ?? Number.POSITIVE_INFINITY;
  self.strategy = options?.strategy ?? "suspend";
  self.messages = make7();
  self.scheduleRunning = false;
  self.state = {
    _tag: "Open",
    takers: /* @__PURE__ */ new Set(),
    offers: /* @__PURE__ */ new Set(),
    awaiters: /* @__PURE__ */ new Set()
  };
  return succeed3(self);
});
var bounded = (capacity) => make8({
  capacity
});
var offer = (self, message) => suspend(() => {
  if (self.state._tag !== "Open") {
    return exitFalse;
  } else if (self.messages.length >= self.capacity) {
    switch (self.strategy) {
      case "dropping":
        return exitFalse;
      case "suspend":
        if (self.capacity <= 0 && self.state.takers.size > 0) {
          append2(self.messages, message);
          releaseTakers(self);
          return exitTrue;
        }
        return offerRemainingSingle(self, message);
      case "sliding":
        take(self.messages);
        append2(self.messages, message);
        return exitTrue;
    }
  }
  append2(self.messages, message);
  scheduleReleaseTaker(self);
  return exitTrue;
});
var offerUnsafe = (self, message) => {
  if (self.state._tag !== "Open") {
    return false;
  } else if (self.messages.length >= self.capacity) {
    if (self.strategy === "sliding") {
      take(self.messages);
      append2(self.messages, message);
      return true;
    } else if (self.capacity <= 0 && self.state.takers.size > 0) {
      append2(self.messages, message);
      releaseTakers(self);
      return true;
    }
    return false;
  }
  append2(self.messages, message);
  scheduleReleaseTaker(self);
  return true;
};
var failCause4 = /* @__PURE__ */ dual(2, (self, cause) => sync(() => failCauseUnsafe(self, cause)));
var failCauseUnsafe = (self, cause) => {
  if (self.state._tag !== "Open") {
    return false;
  }
  const exit3 = exitFailCause(cause);
  const fail10 = exitZipRight(exit3, exitFailDone);
  if (self.state.offers.size === 0 && self.messages.length === 0) {
    finalize(self, fail10);
    return true;
  }
  self.state = {
    ...self.state,
    _tag: "Closing",
    exit: fail10
  };
  return true;
};
var endUnsafe = (self) => failCauseUnsafe(self, causeFail(Done()));
var shutdown = (self) => sync(() => {
  if (self.state._tag === "Done") {
    return true;
  }
  clear(self.messages);
  const offers = self.state.offers;
  finalize(self, self.state._tag === "Open" ? exitInterrupt2 : self.state.exit);
  if (offers.size > 0) {
    for (const entry of offers) {
      if (entry._tag === "Single") {
        entry.resume(exitFalse);
      } else {
        entry.resume(exitSucceed(entry.remaining.slice(entry.offset)));
      }
    }
    offers.clear();
  }
  return true;
});
var takeAll2 = (self) => takeBetween(self, 1, Number.POSITIVE_INFINITY);
var takeBetween = (self, min2, max2) => suspend(() => takeBetweenUnsafe(self, min2, max2) ?? andThen(awaitTake(self), takeBetween(self, 1, max2)));
var take2 = (self) => suspend(() => takeUnsafe(self) ?? andThen(awaitTake(self), take2(self)));
var poll = (self) => suspend(() => {
  const result3 = takeUnsafe(self);
  if (result3 === void 0) {
    return succeed3(none2());
  }
  if (result3._tag === "Success") {
    return succeed3(some2(result3.value));
  }
  return succeed3(none2());
});
var takeUnsafe = (self) => {
  if (self.state._tag === "Done") {
    return self.state.exit;
  }
  if (self.messages.length > 0) {
    const message = take(self.messages);
    releaseCapacity(self);
    return exitSucceed(message);
  } else if (self.capacity <= 0 && self.state.offers.size > 0) {
    self.capacity = 1;
    releaseCapacity(self);
    self.capacity = 0;
    const message = take(self.messages);
    releaseCapacity(self);
    return exitSucceed(message);
  }
  return void 0;
};
var sizeUnsafe = (self) => self.state._tag === "Done" ? 0 : self.messages.length;
var exitFalse = /* @__PURE__ */ exitSucceed(false);
var exitTrue = /* @__PURE__ */ exitSucceed(true);
var exitFailDone = /* @__PURE__ */ exitFail(/* @__PURE__ */ Done());
var exitInterrupt2 = /* @__PURE__ */ exitInterrupt();
var releaseTakers = (self) => {
  self.scheduleRunning = false;
  if (self.state._tag === "Done" || self.state.takers.size === 0) {
    return;
  }
  for (const taker of self.state.takers) {
    self.state.takers.delete(taker);
    taker(exitVoid);
    if (self.messages.length === 0) {
      break;
    }
  }
};
var scheduleReleaseTaker = (self) => {
  if (self.scheduleRunning || self.state._tag === "Done" || self.state.takers.size === 0) {
    return;
  }
  self.scheduleRunning = true;
  self.dispatcher.scheduleTask(() => releaseTakers(self), 0);
};
var takeBetweenUnsafe = (self, min2, max2) => {
  if (self.state._tag === "Done") {
    return self.state.exit;
  } else if (max2 <= 0 || min2 <= 0) {
    return exitSucceed([]);
  } else if (self.capacity <= 0 && self.state.offers.size > 0) {
    self.capacity = 1;
    releaseCapacity(self);
    self.capacity = 0;
    const messages = [take(self.messages)];
    releaseCapacity(self);
    return exitSucceed(messages);
  }
  min2 = Math.min(min2, self.capacity || 1);
  if (min2 <= self.messages.length) {
    const messages = takeN(self.messages, max2);
    releaseCapacity(self);
    return exitSucceed(messages);
  }
};
var offerRemainingSingle = (self, message) => {
  return callback((resume) => {
    if (self.state._tag !== "Open") {
      return resume(exitFalse);
    }
    const entry = {
      _tag: "Single",
      message,
      resume
    };
    self.state.offers.add(entry);
    return sync(() => {
      if (self.state._tag === "Open") {
        self.state.offers.delete(entry);
      }
    });
  });
};
var releaseCapacity = (self) => {
  if (self.state._tag === "Done") {
    return isDoneCause(self.state.exit.cause);
  } else if (self.state.offers.size === 0) {
    if (self.state._tag === "Closing" && self.messages.length === 0) {
      finalize(self, self.state.exit);
      return isDoneCause(self.state.exit.cause);
    }
    return false;
  }
  let n = self.capacity - self.messages.length;
  for (const entry of self.state.offers) {
    if (n === 0) break;
    else if (entry._tag === "Single") {
      append2(self.messages, entry.message);
      n--;
      entry.resume(exitTrue);
      self.state.offers.delete(entry);
    } else {
      for (; entry.offset < entry.remaining.length; entry.offset++) {
        if (n === 0) return false;
        append2(self.messages, entry.remaining[entry.offset]);
        n--;
      }
      entry.resume(exitSucceed([]));
      self.state.offers.delete(entry);
    }
  }
  return false;
};
var awaitTake = (self) => callback((resume) => {
  if (self.state._tag === "Done") {
    return resume(self.state.exit);
  }
  self.state.takers.add(resume);
  return sync(() => {
    if (self.state._tag !== "Done") {
      self.state.takers.delete(resume);
    }
  });
});
var finalize = (self, exit3) => {
  if (self.state._tag === "Done") {
    return;
  }
  const openState = self.state;
  self.state = {
    _tag: "Done",
    exit: exit3
  };
  for (const taker of openState.takers) {
    taker(exit3);
  }
  openState.takers.clear();
  for (const awaiter of openState.awaiters) {
    awaiter(exit3);
  }
  openState.awaiters.clear();
};

// node_modules/effect/dist/Semaphore.js
var makeUnsafe5 = (permits) => new SemaphoreImpl(permits);
var waitForPermits = (self, n, effect2) => callback((resume) => {
  if (self.free >= n) return resume(effect2);
  const observer = () => {
    if (self.free < n) return;
    self.waiters.delete(observer);
    resume(effect2);
  };
  self.waiters.add(observer);
  return sync(() => {
    self.waiters.delete(observer);
  });
});
var SemaphoreImpl = class {
  waiters = /* @__PURE__ */ new Set();
  taken = 0;
  permits;
  constructor(permits) {
    this.permits = permits;
  }
  get free() {
    return this.permits - this.taken;
  }
  take(n) {
    const take3 = suspend(() => {
      if (this.free < n) {
        return waitForPermits(this, n, take3);
      }
      this.taken += n;
      return succeed3(n);
    });
    return take3;
  }
  takeIfAvailable(n) {
    return suspend(() => {
      if (this.free < n) return succeed3(false);
      this.taken += n;
      return succeed3(true);
    });
  }
  releaseUnsafe(fiber3, n) {
    this.taken -= n;
    if (this.waiters.size > 0) {
      fiber3.currentDispatcher.scheduleTask(() => {
        for (const observer of this.waiters) {
          if (this.free <= 0) break;
          observer();
        }
      }, 0);
    }
    return this.free;
  }
  resize(permits) {
    return withFiber((fiber3) => {
      this.permits = permits;
      if (this.free < 0) return void_;
      this.releaseUnsafe(fiber3, 0);
      return void_;
    });
  }
  release(n) {
    return withFiber((fiber3) => succeed3(this.releaseUnsafe(fiber3, n)));
  }
  get releaseAll() {
    return withFiber((fiber3) => succeed3(this.releaseUnsafe(fiber3, this.taken)));
  }
  withPermits(n) {
    return (self) => uninterruptibleMask((restore) => {
      const acquire = suspend(() => {
        if (this.free < n) {
          const wait = waitForPermits(this, n, void_);
          return flatMap2(restore(wait), () => acquire);
        }
        this.taken += n;
        return onExitPrimitive(restore(self), () => {
          this.releaseUnsafe(getCurrentFiber(), n);
          return void 0;
        }, true);
      });
      return acquire;
    });
  }
  withPermit = /* @__PURE__ */ this.withPermits(1);
  withPermitsIfAvailable(n) {
    return (self) => uninterruptibleMask((restore) => {
      if (this.free < n) return succeedNone;
      this.taken += n;
      return onExitPrimitive(restore(asSome(self)), () => {
        this.releaseUnsafe(getCurrentFiber(), n);
        return void 0;
      }, true);
    });
  }
};
var make9 = (permits) => sync(() => new SemaphoreImpl(permits));

// node_modules/effect/dist/Channel.js
var TypeId15 = "~effect/Channel";
var isChannel = (u) => hasProperty(u, TypeId15);
var ChannelProto = {
  [TypeId15]: {
    _Env: identity,
    _InErr: identity,
    _InElem: identity,
    _OutErr: identity,
    _OutElem: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var fromTransform = (transform4) => {
  const self = Object.create(ChannelProto);
  self.transform = (upstream, scope3) => catchCause2(transform4(upstream, scope3), (cause) => succeed6(failCause3(cause)));
  return self;
};
var transformPull = (self, f) => fromTransform((upstream, scope3) => flatMap3(toTransform(self)(upstream, scope3), (pull) => f(pull, scope3)));
var fromPull = (effect2) => fromTransform((_, __) => effect2);
var fromTransformBracket = (f) => fromTransform(fnUntraced2(function* (upstream, scope3) {
  const closableScope = forkUnsafe2(scope3);
  const onCause = (cause) => close(closableScope, doneExitFromCause(cause));
  const pull = yield* onError2(f(upstream, scope3, closableScope), onCause);
  return onError2(pull, onCause);
}));
var toTransform = (channel) => channel.transform;
var asyncQueue = (scope3, f, options) => make8({
  capacity: options?.bufferSize,
  strategy: options?.strategy
}).pipe(tap2((queue) => addFinalizer2(scope3, shutdown(queue))), tap2((queue) => forkIn2(provide(f(queue), scope3), scope3)));
var callbackArray = (f, options) => fromTransform((_, scope3) => map6(asyncQueue(scope3, f, options), takeAll2));
var suspend3 = (evaluate2) => fromTransform((upstream, scope3) => suspend2(() => toTransform(evaluate2())(upstream, scope3)));
var empty3 = /* @__PURE__ */ fromPull(/* @__PURE__ */ succeed6(/* @__PURE__ */ done2()));
var failCause5 = (cause) => fromPull(failCause3(cause));
var die4 = (defect) => failCause5(die2(defect));
var fromQueueArray = (queue) => fromPull(succeed6(takeAll2(queue)));
var map7 = /* @__PURE__ */ dual(2, (self, f) => transformPull(self, (pull) => sync2(() => {
  let i = 0;
  return map6(pull, (o) => f(o, i++));
})));
var mapDone = /* @__PURE__ */ dual(2, (self, f) => mapDoneEffect(self, (o) => succeed6(f(o))));
var mapDoneEffect = /* @__PURE__ */ dual(2, (self, f) => transformPull(self, (pull) => succeed6(catchDone(pull, (done4) => flatMap3(f(done4), done2)))));
var merge2 = /* @__PURE__ */ dual((args2) => isChannel(args2[0]) && isChannel(args2[1]), (left, right, options) => fromTransformBracket(fnUntraced2(function* (upstream, _scope, forkedScope) {
  const strategy = options?.haltStrategy ?? "both";
  const queue = yield* bounded(0);
  yield* addFinalizer2(forkedScope, shutdown(queue));
  let done4 = 0;
  function onExit4(side, cause) {
    done4++;
    if (!isDoneCause(cause)) {
      return failCause4(queue, cause);
    }
    switch (strategy) {
      case "both": {
        return done4 === 2 ? failCause4(queue, cause) : void_3;
      }
      case "left":
      case "right": {
        return side === strategy ? failCause4(queue, cause) : void_3;
      }
      case "either": {
        return failCause4(queue, cause);
      }
    }
  }
  const runSide = (side, channel, scope3) => toTransform(channel)(upstream, scope3).pipe(flatMap3((pull) => pull.pipe(flatMap3((value3) => offer(queue, value3)), forever3)), onError2((cause) => andThen2(close(scope3, doneExitFromCause(cause)), onExit4(side, cause))), forkIn2(forkedScope));
  yield* runSide("left", left, forkUnsafe2(forkedScope));
  yield* runSide("right", right, forkUnsafe2(forkedScope));
  return take2(queue);
})));
var splitLines = () => fromTransform((upstream, _scope) => sync2(() => {
  let stringBuilder = "";
  let midCRLF = false;
  let done4 = none2();
  function splitLinesArray(chunk) {
    const chunkBuilder = [];
    function pushLine(segment) {
      if (stringBuilder.length === 0) {
        chunkBuilder.push(segment);
      } else {
        chunkBuilder.push(stringBuilder + segment);
        stringBuilder = "";
      }
    }
    for (let i = 0; i < chunk.length; i++) {
      const str = chunk[i];
      if (str.length !== 0) {
        let from = 0;
        let indexOfCR = str.indexOf("\r");
        let indexOfLF = str.indexOf("\n");
        if (midCRLF) {
          if (indexOfLF === 0) {
            pushLine("");
            from = 1;
            indexOfLF = str.indexOf("\n", from);
          } else {
            pushLine("");
          }
          midCRLF = false;
        }
        while (indexOfCR !== -1 || indexOfLF !== -1) {
          if (indexOfCR === -1 || indexOfLF !== -1 && indexOfLF < indexOfCR) {
            pushLine(str.substring(from, indexOfLF));
            from = indexOfLF + 1;
            indexOfLF = str.indexOf("\n", from);
          } else {
            if (str.length === indexOfCR + 1) {
              midCRLF = true;
              indexOfCR = -1;
            } else {
              pushLine(str.substring(from, indexOfCR));
              from = indexOfCR + (indexOfLF === indexOfCR + 1 ? 2 : 1);
              indexOfCR = str.indexOf("\r", from);
              indexOfLF = str.indexOf("\n", from);
            }
          }
        }
        stringBuilder = stringBuilder + str.substring(from, str.length - (midCRLF ? 1 : 0));
      }
    }
    return isReadonlyArrayNonEmpty(chunkBuilder) ? chunkBuilder : null;
  }
  const pullOrFlush = suspend2(() => {
    if (done4._tag === "Some") {
      return done2(done4.value);
    }
    return matchEffect2(upstream, {
      onSuccess: loop,
      onFailure: failCause3,
      onDone: (leftover) => {
        done4 = some2(leftover);
        if (stringBuilder.length > 0 || midCRLF) {
          const last = stringBuilder;
          stringBuilder = "";
          midCRLF = false;
          return succeed6([last]);
        }
        return done2(leftover);
      }
    });
  });
  function loop(chunk) {
    const lines2 = splitLinesArray(chunk);
    return lines2 !== null ? succeed6(lines2) : pullOrFlush;
  }
  return pullOrFlush;
}));
var pipeTo = /* @__PURE__ */ dual(2, (self, that) => fromTransform((upstream, scope3) => flatMap3(toTransform(self)(upstream, scope3), (upstream2) => toTransform(that)(upstream2, scope3))));
var unwrap = (channel) => fromTransform((upstream, scope3) => {
  let pull;
  return succeed6(suspend2(() => {
    if (pull) return pull;
    return channel.pipe(provide(scope3), flatMap3((channel2) => toTransform(channel2)(upstream, scope3)), flatMap3((pull_) => pull = pull_));
  }));
});
var runWith = (self, f, onHalt) => suspend2(() => {
  const scope3 = makeUnsafe3();
  const makePull = toTransform(self)(done2(), scope3);
  return catchDone(flatMap3(makePull, f), onHalt ? onHalt : succeed6).pipe(onExit2((exit3) => close(scope3, exit3)));
});
var runFold = /* @__PURE__ */ dual(3, (self, initial, f) => suspend2(() => {
  let state = initial();
  return runWith(self, (pull) => whileLoop2({
    while: constTrue,
    body: () => pull,
    step: (value3) => {
      state = f(state, value3);
    }
  }), () => succeed6(state));
}));
var toPullScoped = (self, scope3) => toTransform(self)(done2(), scope3);

// node_modules/effect/dist/internal/stream.js
var TypeId16 = "~effect/Stream";
var streamVariance = {
  _R: identity,
  _E: identity,
  _A: identity
};
var StreamProto = {
  [TypeId16]: streamVariance,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var fromChannel = (channel) => {
  const self = Object.create(StreamProto);
  self.channel = channel;
  return self;
};

// node_modules/effect/dist/Sink.js
var TypeId17 = "~effect/Sink";
var endVoid = /* @__PURE__ */ succeed6([void 0]);
var sinkVariance = {
  _A: identity,
  _In: identity,
  _L: identity,
  _E: identity,
  _R: identity
};
var SinkProto = {
  [TypeId17]: sinkVariance,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var isSink = (u) => hasProperty(u, TypeId17);
var fromChannel2 = (channel) => fromTransform2((upstream, scope3) => toTransform(channel)(upstream, scope3).pipe(flatMap3(forever3({
  disableYield: true
})), catchDone(succeed6)));
var fromTransform2 = (transform4) => {
  const self = Object.create(SinkProto);
  self.transform = transform4;
  return self;
};
var toChannel = (self) => fromTransform((upstream, scope3) => succeed6(flatMap3(self.transform(upstream, scope3), done2)));
var drain = /* @__PURE__ */ fromTransform2((upstream) => catchDone(forever3(upstream, {
  disableYield: true
}), () => endVoid));
var forEach3 = (f) => forEachArray(forEach2((_) => f(_), {
  discard: true
}));
var forEachArray = (f) => fromTransform2((upstream) => upstream.pipe(flatMap3(f), forever3({
  disableYield: true
}), catchDone(() => endVoid)));
var unwrap2 = (effect2) => fromChannel2(unwrap(map6(effect2, toChannel)));

// node_modules/effect/dist/MutableHashMap.js
var TypeId18 = "~effect/collections/MutableHashMap";
var MutableHashMapProto = {
  [TypeId18]: TypeId18,
  [Symbol.iterator]() {
    return this.backing[Symbol.iterator]();
  },
  toString() {
    return `MutableHashMap(${format(Array.from(this))})`;
  },
  toJSON() {
    return {
      _id: "MutableHashMap",
      values: toJson(Array.from(this))
    };
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var empty4 = () => {
  const self = Object.create(MutableHashMapProto);
  self.backing = /* @__PURE__ */ new Map();
  self.buckets = /* @__PURE__ */ new Map();
  return self;
};
var make10 = (...entries) => fromIterable2(entries);
var fromIterable2 = (entries) => {
  const self = empty4();
  for (const [key, value3] of entries) {
    set(self, key, value3);
  }
  return self;
};
var get2 = /* @__PURE__ */ dual(2, (self, key) => {
  if (self.backing.has(key)) {
    return some2(self.backing.get(key));
  } else if (isSimpleKey(key)) {
    return none2();
  }
  const refKey = referentialKeysCache.get(self);
  if (refKey !== void 0) {
    return self.backing.has(refKey) ? some2(self.backing.get(refKey)) : none2();
  }
  const hash2 = hash(key);
  const bucket = self.buckets.get(hash2);
  if (bucket === void 0) {
    return none2();
  }
  return getFromBucket(self, bucket, key);
});
var referentialKeysCache = /* @__PURE__ */ new WeakMap();
var isSimpleKey = (u) => typeof u !== "object" && typeof u !== "function";
var getFromBucket = (self, bucket, key) => {
  for (let i = 0, len = bucket.length; i < len; i++) {
    if (equals(key, bucket[i])) {
      const refKey = bucket[i];
      referentialKeysCache.set(key, refKey);
      return some2(self.backing.get(refKey));
    }
  }
  return none2();
};
var set = /* @__PURE__ */ dual(3, (self, key, value3) => {
  if (self.backing.has(key) || isSimpleKey(key)) {
    self.backing.set(key, value3);
    return self;
  }
  let refKey = referentialKeysCache.get(self);
  if (refKey !== void 0 && self.backing.has(refKey)) {
    self.backing.set(refKey, value3);
    return self;
  }
  const hash2 = hash(key);
  const bucket = self.buckets.get(hash2);
  if (bucket === void 0) {
    self.buckets.set(hash2, [key]);
    self.backing.set(key, value3);
    return self;
  }
  refKey = getRefKey(bucket, key);
  if (refKey === void 0) {
    bucket.push(key);
    refKey = key;
  }
  self.backing.set(refKey, value3);
  return self;
});
var getRefKey = (bucket, key) => {
  for (let i = 0, len = bucket.length; i < len; i++) {
    if (equals(key, bucket[i])) {
      referentialKeysCache.set(key, bucket[i]);
      return bucket[i];
    }
  }
};
var remove = /* @__PURE__ */ dual(2, (self, key_) => {
  if (isSimpleKey(key_)) {
    self.backing.delete(key_);
    return self;
  }
  const key = referentialKeysCache.get(self) ?? key_;
  const hash2 = hash(key);
  const bucket = self.buckets.get(hash2);
  if (bucket === void 0) {
    return self;
  }
  for (let i = 0, len = bucket.length; i < len; i++) {
    const bkey = bucket[i];
    if (bkey === key || equals(key, bkey)) {
      self.backing.delete(bkey);
      bucket.splice(i, 1);
      break;
    }
  }
  if (bucket.length === 0) {
    self.buckets.delete(hash2);
  }
  return self;
});
var size = (self) => self.backing.size;

// node_modules/effect/dist/internal/rcRef.js
var TypeId19 = "~effect/RcRef";
var stateEmpty = {
  _tag: "Empty"
};
var stateClosed = {
  _tag: "Closed"
};
var variance2 = {
  _A: identity,
  _E: identity
};
var RcRefImpl = class {
  [TypeId19] = variance2;
  pipe() {
    return pipeArguments(this, arguments);
  }
  state = stateEmpty;
  semaphore = /* @__PURE__ */ makeUnsafe5(1);
  acquire;
  context;
  scope;
  idleTimeToLive;
  constructor(acquire, context3, scope3, idleTimeToLive) {
    this.acquire = acquire;
    this.context = context3;
    this.scope = scope3;
    this.idleTimeToLive = idleTimeToLive;
  }
};
var make11 = (options) => withFiber2((fiber3) => {
  const context3 = fiber3.context;
  const scope3 = get(context3, Scope);
  const ref = new RcRefImpl(options.acquire, context3, scope3, options.idleTimeToLive ? fromInputUnsafe(options.idleTimeToLive) : void 0);
  return as2(addFinalizerExit(scope3, () => {
    const close3 = ref.state._tag === "Acquired" ? close(ref.state.scope, void_2) : void_3;
    ref.state = stateClosed;
    return close3;
  }), ref);
});
var getState = (self) => uninterruptibleMask2(function loop(restore) {
  switch (self.state._tag) {
    case "Closed": {
      return interrupt2;
    }
    case "Acquired": {
      self.state.refCount++;
      return self.state.fiber ? as2(interrupt3(self.state.fiber), self.state) : succeed6(self.state);
    }
    case "Empty": {
      const scope3 = makeUnsafe3();
      return self.semaphore.withPermit(suspend2(() => {
        if (self.state._tag !== "Empty") {
          return loop(restore);
        }
        return restore(provideContext2(self.acquire, add(self.context, Scope, scope3))).pipe(map6((value3) => {
          const state = {
            _tag: "Acquired",
            value: value3,
            scope: scope3,
            fiber: void 0,
            refCount: 1,
            invalidated: false
          };
          self.state = state;
          return state;
        }), onExit2((exit3) => isFailure4(exit3) ? close(scope3, exit3) : void_3));
      }));
    }
  }
});
var get3 = /* @__PURE__ */ fnUntraced2(function* (self_) {
  const self = self_;
  const state = yield* getState(self);
  const scope3 = yield* scope2;
  const isFinite3 = self.idleTimeToLive !== void 0 && isFinite(self.idleTimeToLive);
  yield* addFinalizerExit(scope3, () => {
    state.refCount--;
    if (state.refCount > 0) {
      return void_3;
    }
    if (self.idleTimeToLive === void 0) {
      self.state = stateEmpty;
      return close(state.scope, void_2);
    } else if (state.invalidated) {
      return close(state.scope, void_2);
    } else if (!isFinite3) {
      return void_3;
    }
    state.fiber = sleep2(self.idleTimeToLive).pipe(flatMap3(() => {
      if (self.state._tag === "Acquired" && self.state.refCount === 0) {
        self.state = stateEmpty;
        return close(state.scope, void_2);
      }
      return void_3;
    }), ensuring2(sync2(() => {
      state.fiber = void 0;
    })), runForkWith2(self.context), runIn(self.scope));
    return void_3;
  });
  return state.value;
});

// node_modules/effect/dist/RcRef.js
var make12 = make11;
var get4 = get3;

// node_modules/effect/dist/Stream.js
var TypeId20 = "~effect/Stream";
var isStream = (u) => hasProperty(u, TypeId20);
var fromChannel3 = fromChannel;
var fromPull2 = (pull) => fromChannel3(fromPull(pull));
var transformPull2 = (self, f) => fromChannel3(fromTransform((_, scope3) => flatMap3(toPullScoped(self.channel, scope3), (pull) => f(pull, scope3))));
var toChannel2 = (stream) => stream.channel;
var callback3 = (f, options) => fromChannel3(callbackArray(f, options));
var empty5 = /* @__PURE__ */ fromChannel3(empty3);
var suspend4 = (stream) => fromChannel3(suspend3(() => stream().channel));
var die6 = (defect) => fromChannel3(die4(defect));
var fromQueue = (queue) => fromChannel3(fromQueueArray(queue));
var unwrap3 = (effect2) => fromChannel3(unwrap(map6(effect2, toChannel2)));
var map8 = /* @__PURE__ */ dual(2, (self, f) => suspend4(() => {
  let i = 0;
  return fromChannel3(map7(self.channel, map2((o) => f(o, i++))));
}));
var merge3 = /* @__PURE__ */ dual((args2) => isStream(args2[0]) && isStream(args2[1]), (self, that, options) => fromChannel3(merge2(toChannel2(self), toChannel2(that), options)));
var transduce = /* @__PURE__ */ dual(2, (self, sink) => transformPull2(self, (upstream, scope3) => sync2(() => {
  let done4;
  let leftover;
  const upstreamWithLeftover = suspend2(() => {
    if (leftover !== void 0) {
      const chunk = leftover;
      leftover = void 0;
      return succeed6(chunk);
    }
    return upstream;
  }).pipe(catch_2((error2) => {
    done4 = fail5(error2);
    return done2();
  }));
  const pull = map6(suspend2(() => sink.transform(upstreamWithLeftover, scope3)), ([value3, leftover_]) => {
    leftover = leftover_;
    return of(value3);
  });
  return suspend2(() => done4 ? done4 : pull);
})));
var decodeText = /* @__PURE__ */ dual((args2) => isStream(args2[0]), (self, options) => suspend4(() => {
  const decoder = new TextDecoder(options?.encoding);
  return map8(self, (chunk) => decoder.decode(chunk, {
    stream: true
  }));
}));
var splitLines2 = (self) => self.channel.pipe(pipeTo(splitLines()), fromChannel3);
var run = /* @__PURE__ */ dual(2, (self, sink) => scopedWith2((scope3) => toPullScoped(self.channel, scope3).pipe(flatMap3((upstream) => sink.transform(upstream, scope3)), map6(([a]) => a))));
var runCollect = (self) => runFold(self.channel, () => [], (acc, chunk) => {
  for (let i = 0; i < chunk.length; i++) {
    acc.push(chunk[i]);
  }
  return acc;
});
var mkString = (self) => runFold(self.channel, () => "", (acc, chunk) => acc + chunk.join(""));

// node_modules/effect/dist/FileSystem.js
var TypeId21 = "~effect/platform/FileSystem";
var Size = (bytes) => typeof bytes === "bigint" ? bytes : BigInt(bytes);
var bigint1024 = /* @__PURE__ */ BigInt(1024);
var bigintPiB = bigint1024 * bigint1024 * bigint1024 * bigint1024 * bigint1024;
var FileSystem = /* @__PURE__ */ Service("effect/platform/FileSystem");
var make13 = (impl) => FileSystem.of({
  ...impl,
  [TypeId21]: TypeId21,
  exists: (path5) => pipe(impl.access(path5), as2(true), catchTag2("PlatformError", (e) => e.reason._tag === "NotFound" ? succeed6(false) : fail6(e))),
  readFileString: (path5, encoding) => flatMap3(impl.readFile(path5), (_) => try_2({
    try: () => new TextDecoder(encoding).decode(_),
    catch: (cause) => badArgument({
      module: "FileSystem",
      method: "readFileString",
      description: "invalid encoding",
      cause
    })
  })),
  stream: fnUntraced2(function* (path5, options) {
    const file4 = yield* impl.open(path5, {
      flag: "r"
    });
    if (options?.offset) {
      yield* file4.seek(options.offset, "start");
    }
    const bytesToRead = options?.bytesToRead !== void 0 ? Size(options.bytesToRead) : void 0;
    let totalBytesRead = BigInt(0);
    const chunkSize = Size(options?.chunkSize ?? 64 * 1024);
    const readChunk = file4.readAlloc(chunkSize);
    return fromPull2(succeed6(flatMap3(suspend2(() => {
      if (bytesToRead !== void 0 && bytesToRead <= totalBytesRead) {
        return done2();
      }
      return bytesToRead !== void 0 && bytesToRead - totalBytesRead < chunkSize ? file4.readAlloc(bytesToRead - totalBytesRead) : readChunk;
    }), match({
      onNone: () => done2(),
      onSome: (buf) => {
        totalBytesRead += BigInt(buf.length);
        return succeed6(of(buf));
      }
    }))));
  }, unwrap3),
  sink: (path5, options) => pipe(impl.open(path5, {
    flag: "w",
    ...options
  }), map6((file4) => forEach3((_) => file4.writeAll(_))), unwrap2),
  writeFileString: (path5, data, options) => flatMap3(try_2({
    try: () => new TextEncoder().encode(data),
    catch: (cause) => badArgument({
      module: "FileSystem",
      method: "writeFileString",
      description: "could not encode string",
      cause
    })
  }), (_) => impl.writeFile(path5, _, options))
});
var FileTypeId = "~effect/platform/FileSystem/File";
var WatchBackend = class extends (/* @__PURE__ */ Service()("effect/platform/FileSystem/WatchBackend")) {
};

// node_modules/effect/dist/Path.js
var TypeId22 = "~effect/platform/Path";
var Path = /* @__PURE__ */ Service("effect/Path");
function normalizeStringPosix(path5, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let code2;
  for (let i = 0; i <= path5.length; ++i) {
    if (i < path5.length) {
      code2 = path5.charCodeAt(i);
    } else if (code2 === 47) {
      break;
    } else {
      code2 = 47;
    }
    if (code2 === 47) {
      if (lastSlash === i - 1 || dots === 1) {
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = "";
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0) {
            res += "/..";
          } else {
            res = "..";
          }
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += "/" + path5.slice(lastSlash + 1, i);
        } else {
          res = path5.slice(lastSlash + 1, i);
        }
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code2 === 46 && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
function _format(sep2, pathObject) {
  const dir2 = pathObject.dir || pathObject.root;
  const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
  if (!dir2) {
    return base;
  }
  if (dir2 === pathObject.root) {
    return dir2 + base;
  }
  return dir2 + sep2 + base;
}
function fromFileUrl(url) {
  if (url.protocol !== "file:") {
    return fail6(new BadArgument({
      module: "Path",
      method: "fromFileUrl",
      description: "URL must be of scheme file"
    }));
  } else if (url.hostname !== "") {
    return fail6(new BadArgument({
      module: "Path",
      method: "fromFileUrl",
      description: "Invalid file URL host"
    }));
  }
  const pathname = url.pathname;
  for (let n = 0; n < pathname.length; n++) {
    if (pathname[n] === "%") {
      const third = pathname.codePointAt(n + 2) | 32;
      if (pathname[n + 1] === "2" && third === 102) {
        return fail6(new BadArgument({
          module: "Path",
          method: "fromFileUrl",
          description: "must not include encoded / characters"
        }));
      }
    }
  }
  return succeed6(decodeURIComponent(pathname));
}
var resolve = function resolve2() {
  let resolvedPath = "";
  let resolvedAbsolute = false;
  let cwd = void 0;
  for (let i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    let path5;
    if (i >= 0) {
      path5 = arguments[i];
    } else {
      const process2 = globalThis.process;
      if (cwd === void 0 && "process" in globalThis && typeof process2 === "object" && process2 !== null && typeof process2.cwd === "function") {
        cwd = process2.cwd();
      }
      path5 = cwd;
    }
    if (path5.length === 0) {
      continue;
    }
    resolvedPath = path5 + "/" + resolvedPath;
    resolvedAbsolute = path5.charCodeAt(0) === 47;
  }
  resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);
  if (resolvedAbsolute) {
    if (resolvedPath.length > 0) {
      return "/" + resolvedPath;
    } else {
      return "/";
    }
  } else if (resolvedPath.length > 0) {
    return resolvedPath;
  } else {
    return ".";
  }
};
var CHAR_FORWARD_SLASH = 47;
function toFileUrl(filepath) {
  const outURL = new URL("file://");
  let resolved2 = resolve(filepath);
  const filePathLast = filepath.charCodeAt(filepath.length - 1);
  if (filePathLast === CHAR_FORWARD_SLASH && resolved2[resolved2.length - 1] !== "/") {
    resolved2 += "/";
  }
  outURL.pathname = encodePathChars(resolved2);
  return succeed6(outURL);
}
var percentRegExp = /%/g;
var backslashRegExp = /\\/g;
var newlineRegExp = /\n/g;
var carriageReturnRegExp = /\r/g;
var tabRegExp = /\t/g;
function encodePathChars(filepath) {
  if (filepath.includes("%")) {
    filepath = filepath.replace(percentRegExp, "%25");
  }
  if (filepath.includes("\\")) {
    filepath = filepath.replace(backslashRegExp, "%5C");
  }
  if (filepath.includes("\n")) {
    filepath = filepath.replace(newlineRegExp, "%0A");
  }
  if (filepath.includes("\r")) {
    filepath = filepath.replace(carriageReturnRegExp, "%0D");
  }
  if (filepath.includes("	")) {
    filepath = filepath.replace(tabRegExp, "%09");
  }
  return filepath;
}
var posixImpl = /* @__PURE__ */ Path.of({
  [TypeId22]: TypeId22,
  resolve,
  normalize(path5) {
    if (path5.length === 0) return ".";
    const isAbsolute3 = path5.charCodeAt(0) === 47;
    const trailingSeparator = path5.charCodeAt(path5.length - 1) === 47;
    path5 = normalizeStringPosix(path5, !isAbsolute3);
    if (path5.length === 0 && !isAbsolute3) path5 = ".";
    if (path5.length > 0 && trailingSeparator) path5 += "/";
    if (isAbsolute3) return "/" + path5;
    return path5;
  },
  isAbsolute(path5) {
    return path5.length > 0 && path5.charCodeAt(0) === 47;
  },
  join() {
    if (arguments.length === 0) {
      return ".";
    }
    let joined;
    for (let i = 0; i < arguments.length; ++i) {
      const arg = arguments[i];
      if (arg.length > 0) {
        if (joined === void 0) {
          joined = arg;
        } else {
          joined += "/" + arg;
        }
      }
    }
    if (joined === void 0) {
      return ".";
    }
    return posixImpl.normalize(joined);
  },
  relative(from, to) {
    if (from === to) return "";
    from = posixImpl.resolve(from);
    to = posixImpl.resolve(to);
    if (from === to) return "";
    let fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47) {
        break;
      }
    }
    const fromEnd = from.length;
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47) {
        break;
      }
    }
    const toEnd = to.length;
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47) {
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47) {
            lastCommonSep = i;
          } else if (i === 0) {
            lastCommonSep = 0;
          }
        }
        break;
      }
      const fromCode = from.charCodeAt(fromStart + i);
      const toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode) {
        break;
      } else if (fromCode === 47) {
        lastCommonSep = i;
      }
    }
    let out = "";
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47) {
        if (out.length === 0) {
          out += "..";
        } else {
          out += "/..";
        }
      }
    }
    if (out.length > 0) {
      return out + to.slice(toStart + lastCommonSep);
    } else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47) {
        ++toStart;
      }
      return to.slice(toStart);
    }
  },
  dirname(path5) {
    if (path5.length === 0) return ".";
    let code2 = path5.charCodeAt(0);
    const hasRoot = code2 === 47;
    let end = -1;
    let matchedSlash = true;
    for (let i = path5.length - 1; i >= 1; --i) {
      code2 = path5.charCodeAt(i);
      if (code2 === 47) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
        matchedSlash = false;
      }
    }
    if (end === -1) return hasRoot ? "/" : ".";
    if (hasRoot && end === 1) return "//";
    return path5.slice(0, end);
  },
  basename(path5, ext) {
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (ext !== void 0 && ext.length > 0 && ext.length <= path5.length) {
      if (ext.length === path5.length && ext === path5) return "";
      let extIdx = ext.length - 1;
      let firstNonSlashEnd = -1;
      for (i = path5.length - 1; i >= 0; --i) {
        const code2 = path5.charCodeAt(i);
        if (code2 === 47) {
          if (!matchedSlash) {
            start = i + 1;
            break;
          }
        } else {
          if (firstNonSlashEnd === -1) {
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            if (code2 === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                end = i;
              }
            } else {
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }
      if (start === end) end = firstNonSlashEnd;
      else if (end === -1) end = path5.length;
      return path5.slice(start, end);
    } else {
      for (i = path5.length - 1; i >= 0; --i) {
        if (path5.charCodeAt(i) === 47) {
          if (!matchedSlash) {
            start = i + 1;
            break;
          }
        } else if (end === -1) {
          matchedSlash = false;
          end = i + 1;
        }
      }
      if (end === -1) return "";
      return path5.slice(start, end);
    }
  },
  extname(path5) {
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for (let i = path5.length - 1; i >= 0; --i) {
      const code2 = path5.charCodeAt(i);
      if (code2 === 47) {
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
      if (end === -1) {
        matchedSlash = false;
        end = i + 1;
      }
      if (code2 === 46) {
        if (startDot === -1) {
          startDot = i;
        } else if (preDotState !== 1) {
          preDotState = 1;
        }
      } else if (startDot !== -1) {
        preDotState = -1;
      }
    }
    if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
    preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return "";
    }
    return path5.slice(startDot, end);
  },
  format: function format2(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format("/", pathObject);
  },
  parse(path5) {
    const ret = {
      root: "",
      dir: "",
      base: "",
      ext: "",
      name: ""
    };
    if (path5.length === 0) return ret;
    let code2 = path5.charCodeAt(0);
    const isAbsolute3 = code2 === 47;
    let start;
    if (isAbsolute3) {
      ret.root = "/";
      start = 1;
    } else {
      start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path5.length - 1;
    let preDotState = 0;
    for (; i >= start; --i) {
      code2 = path5.charCodeAt(i);
      if (code2 === 47) {
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
      if (end === -1) {
        matchedSlash = false;
        end = i + 1;
      }
      if (code2 === 46) {
        if (startDot === -1) startDot = i;
        else if (preDotState !== 1) preDotState = 1;
      } else if (startDot !== -1) {
        preDotState = -1;
      }
    }
    if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
    preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute3) ret.base = ret.name = path5.slice(1, end);
        else ret.base = ret.name = path5.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute3) {
        ret.name = path5.slice(1, startDot);
        ret.base = path5.slice(1, end);
      } else {
        ret.name = path5.slice(startPart, startDot);
        ret.base = path5.slice(startPart, end);
      }
      ret.ext = path5.slice(startDot, end);
    }
    if (startPart > 0) ret.dir = path5.slice(0, startPart - 1);
    else if (isAbsolute3) ret.dir = "/";
    return ret;
  },
  sep: "/",
  fromFileUrl,
  toFileUrl,
  toNamespacedPath: identity
});

// node_modules/effect/dist/internal/schema/annotations.js
function resolve3(ast) {
  return ast.checks ? ast.checks[ast.checks.length - 1].annotations : ast.annotations;
}
var STRUCTURAL_ANNOTATION_KEY = "~structural";
var SENTINELS_ANNOTATION_KEY = "~sentinels";
var CONSTRUCTOR_ANNOTATION_KEY = "~constructor";
var getExpected = /* @__PURE__ */ memoize((ast) => {
  const identifier3 = resolve3(ast)?.identifier;
  if (typeof identifier3 === "string") return identifier3;
  return ast.getExpected(getExpected);
});

// node_modules/effect/dist/internal/schema/parser.js
var missing = /* @__PURE__ */ Symbol();
var succeed8 = succeed4;
var missingExit = /* @__PURE__ */ succeed8(missing);
var sameExit = /* @__PURE__ */ succeed8(missing);
var toOption = (value3) => value3 === missing ? none2() : some2(value3);
var fromOptionExit = (option4) => option4._tag === "None" ? missingExit : succeed8(option4.value);

// node_modules/effect/dist/SchemaIssue.js
var TypeId23 = "~effect/SchemaIssue/Issue";
function isIssue(u) {
  return hasProperty(u, TypeId23) && u[TypeId23] === TypeId23;
}
function hasInput(issue) {
  return Object.hasOwn(issue, "input");
}
var Base = class {
  [TypeId23] = TypeId23;
  constructor(input, options) {
    if (options?.reportInput === true && input !== missing) {
      this.input = input;
    }
  }
};
var Filter = class extends Base {
  _tag = "Filter";
  /**
   * The filter that failed.
   */
  filter;
  /**
   * The issue that occurred.
   */
  issue;
  constructor(filter10, issue, input, options) {
    super(input, options);
    this.filter = filter10;
    this.issue = issue;
  }
};
var Encoding = class extends Base {
  _tag = "Encoding";
  /**
   * The schema that caused the issue.
   */
  ast;
  /**
   * The issue that occurred.
   */
  issue;
  constructor(ast, issue, input, options) {
    super(input, options);
    this.ast = ast;
    this.issue = issue;
  }
};
var Pointer = class extends Base {
  _tag = "Pointer";
  /**
   * The path to the location in the input that caused the issue.
   */
  path;
  /**
   * The issue that occurred.
   */
  issue;
  constructor(path5, issue) {
    super();
    this.path = path5;
    this.issue = issue;
  }
};
var MissingKey = class extends Base {
  _tag = "MissingKey";
  /**
   * The metadata for the issue.
   */
  annotations;
  constructor(annotations) {
    super();
    this.annotations = annotations;
  }
};
var UnexpectedKey = class extends Base {
  _tag = "UnexpectedKey";
  /**
   * The schema that caused the issue.
   */
  ast;
  constructor(ast, input, options) {
    super(input, options);
    this.ast = ast;
  }
};
var Composite = class extends Base {
  _tag = "Composite";
  /**
   * The schema that caused the issue.
   */
  ast;
  /**
   * The issues that occurred.
   */
  issues;
  constructor(ast, issues, input, options) {
    super(input, options);
    this.ast = ast;
    this.issues = issues;
  }
};
var InvalidType = class extends Base {
  _tag = "InvalidType";
  /**
   * The schema that caused the issue.
   */
  ast;
  constructor(ast, input, options) {
    super(input, options);
    this.ast = ast;
  }
};
var InvalidValue = class extends Base {
  _tag = "InvalidValue";
  /**
   * The metadata for the issue.
   */
  annotations;
  constructor(annotations, input, options) {
    super(input, options);
    this.annotations = annotations;
  }
};
var AnyOf = class extends Base {
  _tag = "AnyOf";
  /**
   * The schema that caused the issue.
   */
  ast;
  /**
   * The issues that occurred.
   */
  issues;
  constructor(ast, issues, input, options) {
    super(input, options);
    this.ast = ast;
    this.issues = issues;
  }
};
var OneOf = class extends Base {
  _tag = "OneOf";
  /**
   * The schema that caused the issue.
   */
  ast;
  /**
   * The schemas that were successful.
   */
  successes;
  constructor(ast, successes, input, options) {
    super(input, options);
    this.ast = ast;
    this.successes = successes;
  }
};
function makeFilterIssue(entry, input, options) {
  if (isIssue(entry)) {
    return entry;
  }
  if (typeof entry === "string") {
    return new InvalidValue({
      message: entry
    }, input, options);
  }
  const inner = typeof entry.issue === "string" ? new InvalidValue({
    message: entry.issue
  }, input, options) : entry.issue;
  return new Pointer(entry.path, inner);
}
function makeSingle(out, input, options) {
  if (out === void 0) {
    return void 0;
  }
  if (typeof out === "boolean") {
    return out ? void 0 : new InvalidValue(void 0, input, options);
  }
  return makeFilterIssue(out, input, options);
}
function normalizeFilterOutput(ast, out, input, options) {
  if (Array.isArray(out)) {
    if (!isReadonlyArrayNonEmpty(out)) {
      return void 0;
    }
    return out.length === 1 ? makeFilterIssue(out[0], input, options) : new Composite(ast, map2(out, (entry) => makeFilterIssue(entry, input, options)), input, options);
  }
  return makeSingle(out, input, options);
}
var defaultLeafHook = (issue) => {
  const message = findMessage(issue);
  if (message !== void 0) return message;
  switch (issue._tag) {
    case "InvalidType":
      return getExpectedMessage(getExpected(issue.ast), issue);
    case "InvalidValue": {
      const expected = findExpected(issue);
      if (expected !== void 0) return getExpectedMessage(expected, issue);
      const input = formatInput(issue);
      return input === void 0 ? "Expected a valid value" : `Invalid data ${input}`;
    }
    case "MissingKey":
      return "Missing key";
    case "UnexpectedKey": {
      const input = formatInput(issue);
      return input === void 0 ? "Expected no excess property" : `Unexpected key with value ${input}`;
    }
    case "Forbidden":
      return "Forbidden operation";
    case "OneOf": {
      const input = formatInput(issue);
      return input === void 0 ? "Expected exactly one member to match" : `Expected exactly one member to match the input ${input}`;
    }
  }
};
var defaultCheckHook = (issue) => findMessage(issue.issue) ?? findMessage(issue);
function formatInput(issue) {
  return hasInput(issue) ? format(issue.input) : void 0;
}
function findExpected(issue) {
  const expected = issue.annotations?.expected;
  return typeof expected === "string" ? expected : void 0;
}
function getExpectedMessage(expected, issue) {
  const input = formatInput(issue);
  return input === void 0 ? `Expected ${expected}` : `Expected ${expected}, got ${input}`;
}
function formatCheck(check) {
  const expected = check.annotations?.expected;
  if (typeof expected === "string") return expected;
  switch (check._tag) {
    case "Filter":
      return "<filter>";
    case "FilterGroup":
      return check.checks.map((check2) => formatCheck(check2)).join(" & ");
  }
}
function makeFormatterDefault() {
  return (issue) => formatIssue(issue, "");
}
var defaultFormatter = /* @__PURE__ */ makeFormatterDefault();
function formatIssue(issue, path5) {
  let message;
  switch (issue._tag) {
    case "Filter": {
      const annotated = defaultCheckHook(issue);
      if (annotated !== void 0) {
        message = annotated;
      } else {
        if (issue.issue._tag !== "InvalidValue") {
          return formatIssue(issue.issue, path5);
        }
        const expected = findExpected(issue.issue);
        message = expected === void 0 ? getExpectedMessage(formatCheck(issue.filter), issue) : getExpectedMessage(expected, issue.issue);
      }
      break;
    }
    case "Encoding":
      return formatIssue(issue.issue, path5);
    case "Pointer":
      return formatIssue(issue.issue, path5 + formatPath(issue.path));
    case "Composite":
    case "AnyOf": {
      if (issue._tag === "Composite" || issue.issues.length > 0) {
        return issue.issues.map((issue2) => formatIssue(issue2, path5)).join("\n");
      }
      message = findMessage(issue) ?? getExpectedMessage(getExpected(issue.ast), issue);
      break;
    }
    default:
      message = defaultLeafHook(issue);
      break;
  }
  return path5 ? `${message}
  at ${path5}` : message;
}
function findMessage(issue) {
  if (issue._tag === "Pointer") return;
  if (issue._tag === "Encoding") return findMessage(issue.issue);
  const annotations = issue._tag === "Filter" ? issue.filter.annotations : "annotations" in issue ? issue.annotations : issue.ast.annotations;
  const message = annotations?.[issue._tag === "MissingKey" ? "messageMissingKey" : issue._tag === "UnexpectedKey" ? "messageUnexpectedKey" : "message"];
  if (typeof message === "string") return message;
}

// node_modules/effect/dist/internal/schema/cause.js
function getSchemaIssue(cause) {
  let issue;
  for (const reason of cause.reasons) {
    if (!isFailReason2(reason) || !isIssue(reason.error)) {
      return void 0;
    }
    issue ??= reason.error;
  }
  return issue;
}
function getSchemaIssueOrThrow(cause, message) {
  const issue = getSchemaIssue(cause);
  if (issue === void 0) {
    throw new Error(message, {
      cause
    });
  }
  return issue;
}

// node_modules/effect/dist/SchemaGetter.js
var Getter = class _Getter extends Class {
  run;
  constructor(run6) {
    super();
    this.run = run6;
  }
  map(f) {
    return new _Getter((oe, options) => this.run(oe, options).pipe(mapEager2(map(f))));
  }
  compose(other) {
    if (isPassthrough(this)) {
      return other;
    }
    if (isPassthrough(other)) {
      return this;
    }
    return new _Getter((oe, options) => this.run(oe, options).pipe(flatMapEager2((ot) => other.run(ot, options))));
  }
};
var passthrough_ = /* @__PURE__ */ new Getter(succeed6);
function isPassthrough(getter) {
  return getter.run === passthrough_.run;
}
function passthrough2() {
  return passthrough_;
}
function onSome(f) {
  return new Getter((oe, options) => isNone2(oe) ? succeedNone2 : f(oe.value, options));
}
function transform(f) {
  return transformOptional(map(f));
}
function transformOrFail(f) {
  return onSome((e, options) => f(e, options).pipe(mapEager2(some2)));
}
function transformOptional(f) {
  return new Getter((oe) => succeed6(f(oe)));
}
function withDefault(defaultValue) {
  return new Getter((o) => {
    const filtered = filter(o, isNotUndefined);
    return isSome2(filtered) ? succeed6(filtered) : mapEager2(defaultValue, some2);
  });
}
function String2() {
  return transform(globalThis.String);
}
function Number4() {
  return transform(globalThis.Number);
}
function Date3() {
  return transform((u) => new globalThis.Date(u));
}
function encodeBase642() {
  return transform(encodeBase64);
}
function decodeBase642() {
  return transformOrFail((input, options) => mapErrorEager2(fromResult2(decodeBase64(input)), () => new InvalidValue({
    expected: "a valid Base64 string"
  }, input, options)));
}

// node_modules/effect/dist/SchemaTransformation.js
var TypeId24 = "~effect/SchemaTransformation/Transformation";
var Transformation = class _Transformation {
  [TypeId24] = TypeId24;
  _tag = "Transformation";
  decode;
  encode;
  constructor(decode, encode) {
    this.decode = decode;
    this.encode = encode;
  }
  flip() {
    return new _Transformation(this.encode, this.decode);
  }
  compose(other) {
    return new _Transformation(this.decode.compose(other.decode), other.encode.compose(this.encode));
  }
};
function isTransformation(u) {
  return hasProperty(u, TypeId24) && u[TypeId24] === TypeId24;
}
var make14 = (options) => {
  if (isTransformation(options)) {
    return options;
  }
  return new Transformation(options.decode, options.encode);
};
function transformOrFail2(options) {
  return new Transformation(transformOrFail(options.decode), transformOrFail(options.encode));
}
function transform2(options) {
  return new Transformation(transform(options.decode), transform(options.encode));
}
var passthrough_2 = /* @__PURE__ */ new Transformation(/* @__PURE__ */ passthrough2(), /* @__PURE__ */ passthrough2());
function passthrough3() {
  return passthrough_2;
}
var numberFromString = /* @__PURE__ */ new Transformation(/* @__PURE__ */ Number4(), /* @__PURE__ */ String2());
var dateFromString = /* @__PURE__ */ new Transformation(/* @__PURE__ */ Date3(), /* @__PURE__ */ transform(formatDate));
var isJsonError = (input) => isObject(input) && typeof input["message"] === "string";
var decodeJsonError = (input) => {
  const hasCause = Object.hasOwn(input, "cause");
  const err = hasCause ? new Error(input.message, {
    cause: decodeDefect(input.cause)
  }) : new Error(input.message);
  if (typeof input.name === "string" && input.name !== "Error") err.name = input.name;
  if (typeof input.stack === "string") err.stack = input.stack;
  return err;
};
var encodeUnknownAsJson = (input) => {
  try {
    const json = formatJson(input);
    return json === void 0 ? format(input) : JSON.parse(json);
  } catch {
    return format(input);
  }
};
var encodeJsonError = (input, options, encodeDefect) => {
  const encoded = {
    name: input.name,
    message: typeof input.message === "string" ? input.message : ""
  };
  if (options?.includeStack && typeof input.stack === "string") {
    encoded.stack = input.stack;
  }
  if (!options?.excludeCause && input.cause !== void 0) {
    encoded.cause = encodeDefect(input.cause);
  }
  return encoded;
};
var makeEncodeDefect = (options) => {
  const seen = /* @__PURE__ */ new WeakSet();
  const encode = (input) => {
    if (isError(input)) {
      if (seen.has(input)) {
        return "[Circular]";
      }
      seen.add(input);
      const encoded = encodeJsonError(input, options, encode);
      seen.delete(input);
      return encoded;
    }
    return encodeUnknownAsJson(input);
  };
  return encode;
};
var decodeDefect = (input) => isJsonError(input) ? decodeJsonError(input) : input;
var defectFromJson = (options) => transform2({
  decode: decodeDefect,
  encode: makeEncodeDefect(options)
});
var urlFromString = /* @__PURE__ */ transformOrFail2({
  decode: (s, options) => URL.canParse(s) ? succeed6(new URL(s)) : fail6(new InvalidValue({
    expected: "a valid URL string"
  }, s, options)),
  encode: (url) => succeed6(url.href)
});
var uint8ArrayFromBase64String = /* @__PURE__ */ new Transformation(/* @__PURE__ */ decodeBase642(), /* @__PURE__ */ encodeBase642());

// node_modules/effect/dist/SchemaAST.js
function makeGuard(tag2) {
  return (ast) => ast._tag === tag2;
}
var isDeclaration = /* @__PURE__ */ makeGuard("Declaration");
var isNever2 = /* @__PURE__ */ makeGuard("Never");
var isLiteral = /* @__PURE__ */ makeGuard("Literal");
var isUniqueSymbol = /* @__PURE__ */ makeGuard("UniqueSymbol");
var isArrays = /* @__PURE__ */ makeGuard("Arrays");
var isObjects = /* @__PURE__ */ makeGuard("Objects");
var isSuspend = /* @__PURE__ */ makeGuard("Suspend");
var Link = class {
  to;
  transformation;
  constructor(to, transformation) {
    this.to = to;
    this.transformation = transformation;
  }
};
var defaultParseOptions = {};
var Context = class {
  isOptional;
  isMutable;
  /** Used for constructor default values (e.g. `withConstructorDefault` API) */
  constructorDefault;
  annotations;
  constructor(isOptional2, isMutable, constructorDefault = void 0, annotations = void 0) {
    this.isOptional = isOptional2;
    this.isMutable = isMutable;
    this.constructorDefault = constructorDefault;
    this.annotations = annotations;
  }
};
var TypeId25 = "~effect/Schema";
var Base2 = class {
  [TypeId25] = TypeId25;
  annotations;
  checks;
  encoding;
  context;
  constructor(annotations = void 0, checks = void 0, encoding = void 0, context3 = void 0) {
    this.annotations = annotations;
    this.checks = checks;
    this.encoding = encoding;
    this.context = context3;
  }
  toString() {
    return `<${this._tag}>`;
  }
};
var Declaration = class _Declaration extends Base2 {
  _tag = "Declaration";
  typeParameters;
  run;
  encodingChecks;
  /**
   * Parser factory {@link flip} swaps in, so a declaration can behave
   * differently when encoding. `undefined` reuses {@link run}.
   */
  encodingRun;
  constructor(typeParameters, run6, annotations, checks, encoding, context3, encodingChecks, encodingRun) {
    super(annotations, checks, encoding, context3);
    this.typeParameters = typeParameters;
    this.run = run6;
    this.encodingChecks = encodingChecks;
    this.encodingRun = encodingRun;
  }
  /** @internal */
  getParser() {
    let run6;
    return (input, options) => {
      if (input === missing) return missingExit;
      return (run6 ??= this.run(this.typeParameters))(input, this, options);
    };
  }
  _rebuild(recur, checks, encodingChecks, run6, encodingRun) {
    const tps = mapOrSame(this.typeParameters, recur);
    return tps === this.typeParameters && checks === this.checks && encodingChecks === this.encodingChecks && run6 === this.run && encodingRun === this.encodingRun ? this : new _Declaration(tps, run6, this.annotations, checks, void 0, this.context, encodingChecks, encodingRun);
  }
  /** @internal */
  recur(recur) {
    return this._rebuild(recur, this.checks, this.encodingChecks, this.run, this.encodingRun);
  }
  /** @internal */
  flip(recur) {
    return this._rebuild(recur, this.encodingChecks, this.checks, this.encodingRun ?? this.run, this.run);
  }
  /** @internal */
  getExpected() {
    const expected = this.annotations?.expected;
    if (typeof expected === "string") return expected;
    return "<Declaration>";
  }
};
var Null = class extends Base2 {
  _tag = "Null";
  /** @internal */
  getParser() {
    return fromConst(this, null);
  }
  /** @internal */
  getExpected() {
    return "null";
  }
};
var null_ = /* @__PURE__ */ new Null();
var Undefined = class extends Base2 {
  _tag = "Undefined";
  /** @internal */
  getParser() {
    return fromConst(this, void 0);
  }
  /** @internal */
  toCodecJson() {
    return replaceEncoding(this, [undefinedToNull]);
  }
  /** @internal */
  getExpected() {
    return "undefined";
  }
};
var undefinedToNull = /* @__PURE__ */ new Link(null_, /* @__PURE__ */ new Transformation(/* @__PURE__ */ transform(() => void 0), /* @__PURE__ */ transform(() => null)));
var undefined_3 = /* @__PURE__ */ new Undefined();
var Unknown = class extends Base2 {
  _tag = "Unknown";
  /** @internal */
  getParser() {
    return fromRefinement(this, isUnknown);
  }
  /** @internal */
  getExpected() {
    return "unknown";
  }
};
var unknown = /* @__PURE__ */ new Unknown();
var Literal = class extends Base2 {
  _tag = "Literal";
  literal;
  constructor(literal2, annotations, checks, encoding, context3) {
    super(annotations, checks, encoding, context3);
    if (typeof literal2 === "number" && !globalThis.Number.isFinite(literal2)) {
      throw new Error(`A numeric literal must be finite, got ${format(literal2)}`);
    }
    this.literal = literal2;
  }
  /** @internal */
  getParser() {
    return fromConst(this, this.literal);
  }
  /** @internal */
  matchPart(s, _options) {
    return s === globalThis.String(this.literal) ? this.literal : void 0;
  }
  /** @internal */
  toCodecJson() {
    return typeof this.literal === "bigint" ? literalToString(this) : this;
  }
  /** @internal */
  toCodecStringTree() {
    return typeof this.literal === "string" ? this : literalToString(this);
  }
  /** @internal */
  getExpected() {
    return typeof this.literal === "string" ? JSON.stringify(this.literal) : globalThis.String(this.literal);
  }
};
function literalToString(ast) {
  const literalAsString = globalThis.String(ast.literal);
  return replaceEncoding(ast, [new Link(new Literal(literalAsString), new Transformation(transform(() => ast.literal), transform(() => literalAsString)))]);
}
var String3 = class extends Base2 {
  _tag = "String";
  /** @internal */
  getParser() {
    return fromRefinement(this, isString);
  }
  /** @internal */
  matchPart(s, options) {
    const checks = this.checks;
    return checks && !options.disableChecks && collectIssues(checks, s, void 0, this, options) ? void 0 : s;
  }
  /** @internal */
  getExpected() {
    return "string";
  }
};
var string2 = /* @__PURE__ */ new String3();
var Number5 = class extends Base2 {
  _tag = "Number";
  /** @internal */
  getParser() {
    return fromRefinement(this, isNumber);
  }
  /** @internal */
  matchKey(s, options) {
    return this._match(isStringNumberRegExp, s, options);
  }
  /** @internal */
  matchPart(s, options) {
    return this._match(isStringFiniteRegExp, s, options);
  }
  _match(regexp, s, options) {
    if (!regexp.test(s)) return void 0;
    const value3 = globalThis.Number(s);
    if (options.disableChecks || !this.checks) return value3;
    return collectIssues(this.checks, value3, void 0, this, options) ? void 0 : value3;
  }
  /** @internal */
  toCodecJson() {
    if (this.checks && (hasCheck(this.checks, "effect/schema/isFinite") || hasCheck(this.checks, "effect/schema/isInt"))) {
      return this;
    }
    return replaceEncoding(this, [numberToJson]);
  }
  /** @internal */
  toCodecStringTree() {
    if (this.toCodecJson() === this) {
      return replaceEncoding(this, [finiteToString]);
    }
    return replaceEncoding(this, [numberToString]);
  }
  /** @internal */
  getExpected() {
    return "number";
  }
};
function hasCheck(checks, id) {
  return checks.some((check) => check.annotations?.representation?.id === id || check._tag === "FilterGroup" && hasCheck(check.checks, id));
}
var number2 = /* @__PURE__ */ new Number5();
var Boolean2 = class extends Base2 {
  _tag = "Boolean";
  /** @internal */
  getParser() {
    return fromRefinement(this, isBoolean);
  }
  /** @internal */
  getExpected() {
    return "boolean";
  }
};
var boolean = /* @__PURE__ */ new Boolean2();
var Arrays = class _Arrays extends Base2 {
  _tag = "Arrays";
  isMutable;
  elements;
  rest;
  encodingChecks;
  constructor(isMutable, elements, rest, annotations, checks, encoding, context3, encodingChecks) {
    super(annotations, checks, encoding, context3);
    this.isMutable = isMutable;
    this.elements = elements;
    this.rest = rest;
    this.encodingChecks = encodingChecks;
    let hasOptional = false;
    for (let i = 0; i < elements.length; i++) {
      if (isOptional(elements[i])) {
        hasOptional = true;
      } else if (hasOptional) {
        throw new Error("A required element cannot follow an optional element. ts(1257)");
      }
    }
    if (hasOptional && rest.length > 1) {
      throw new Error("A required element cannot follow an optional element. ts(1257)");
    }
    for (let i = 1; i < rest.length; i++) {
      if (isOptional(rest[i])) {
        throw new Error("An optional element cannot follow a rest element. ts(1266)");
      }
    }
  }
  /** @internal */
  getParser(compile, compileConstructorDefault2 = compile) {
    const ast = this;
    let elements;
    let rest;
    const elementLen = ast.elements.length;
    const tailLen = Math.max(0, ast.rest.length - 1);
    function getParser(tailThreshold, index) {
      if (index < elementLen) {
        return elements[index];
      } else if (index >= tailThreshold) {
        return rest[index - tailThreshold + 1];
      }
      return rest[0];
    }
    return fnUntracedEager2(function* (input, options) {
      if (input === missing) {
        return missing;
      }
      if (!Array.isArray(input)) {
        return yield* fail6(new InvalidType(ast, input, options));
      }
      if (!elements) {
        elements = ast.elements.map((ast2) => ({
          ast: ast2,
          parser: compileConstructorDefault2(ast2)
        }));
        rest = ast.rest.map((ast2) => ({
          ast: ast2,
          parser: compileConstructorDefault2(ast2)
        }));
      }
      const len = input.length;
      const state = {
        ast,
        getParser,
        input,
        len,
        tailThreshold: Math.max(elementLen, len - tailLen),
        output: new globalThis.Array(len),
        issues: void 0,
        options
      };
      const concurrency = resolveConcurrency(options?.concurrency);
      const eff = parseArray(state, input, {
        concurrency: concurrency?.concurrency,
        end: ast.rest.length === 0 ? elementLen : Math.max(len, elementLen + tailLen)
      });
      if (eff) yield* eff;
      if (ast.rest.length === 0 && len > elementLen) {
        for (let i = elementLen; i <= len - 1; i++) {
          const unexpected = new UnexpectedKey(ast, input[i], options);
          const issue = new Pointer([i], unexpected);
          if (options.errors === "all") {
            if (state.issues) state.issues.push(issue);
            else state.issues = [issue];
          } else {
            return yield* fail6(new Composite(ast, [issue], input, options));
          }
        }
      }
      if (state.issues) {
        return yield* fail6(new Composite(ast, state.issues, input, options));
      }
      return state.output;
    });
  }
  _rebuild(recur, checks, encodingChecks) {
    const elements = mapOrSame(this.elements, recur);
    const rest = mapOrSame(this.rest, recur);
    return elements === this.elements && rest === this.rest && checks === this.checks && encodingChecks === this.encodingChecks ? this : new _Arrays(this.isMutable, elements, rest, this.annotations, checks, void 0, this.context, encodingChecks);
  }
  /** @internal */
  recur(recur) {
    return this._rebuild(recur, this.checks, this.encodingChecks);
  }
  /** @internal */
  flip(recur) {
    return this._rebuild(recur, this.encodingChecks, this.checks);
  }
  /** @internal */
  getExpected() {
    return "array";
  }
};
var parseArray = /* @__PURE__ */ iterateEager()({
  onItem(s, item, i) {
    const value3 = i < s.len ? item : missing;
    return s.getParser(s.tailThreshold, i).parser(value3, s.options);
  },
  step(s, item, exit3, i) {
    if (exit3._tag === "Failure") {
      return wrapPropertyKeyIssue(s, s.ast, i, exit3);
    }
    const value3 = exit3 === sameExit ? item : exit3[args];
    if (value3 !== missing) {
      s.output[i] = value3;
    } else {
      const p = s.getParser(s.tailThreshold, i);
      if (isOptional(p.ast)) return;
      const issue = new Pointer([i], new MissingKey(p.ast.context?.annotations));
      if (s.options.errors === "all") {
        if (s.issues) s.issues.push(issue);
        else s.issues = [issue];
      } else {
        return fail5(new Composite(s.ast, [issue], s.input, s.options));
      }
    }
  }
});
var resolveConcurrency = (value3) => {
  value3 = value3 === "unbounded" ? Infinity : value3 ?? 1;
  return value3 > 1 ? {
    concurrency: value3
  } : void 0;
};
var wrapPropertyKeyIssue = (s, ast, key, exit3) => {
  if (exit3.cause.reasons.length === 0) {
    return exit3;
  }
  const issue = getSchemaIssue(exit3.cause);
  if (issue === void 0) {
    return failCause2(map5(exit3.cause, (issue2) => new Composite(ast, [new Pointer([key], issue2)], s.input, s.options)));
  }
  const pointer = new Pointer([key], issue);
  if (s.options.errors === "all") {
    if (s.issues) s.issues.push(pointer);
    else s.issues = [pointer];
  } else {
    return fail5(new Composite(ast, [pointer], s.input, s.options));
  }
};
var FINITE_PATTERN = "[+-]?\\d*\\.?\\d+(?:[Ee][+-]?\\d+)?";
function getIndexSignatureKeys(input, parameter2, options = defaultParseOptions) {
  let stringKeys;
  let symbolKeys;
  function go(parameter3) {
    switch (parameter3._tag) {
      case "String":
      case "TemplateLiteral":
        return (stringKeys ??= Object.keys(input)).filter((k) => parameter3.matchPart(k, options) !== void 0);
      case "Number":
        return (stringKeys ??= Object.keys(input)).filter((k) => parameter3.matchKey(k, options) !== void 0);
      case "Symbol":
        return (symbolKeys ??= Object.getOwnPropertySymbols(input)).filter((k) => parameter3.matchKey(k, options) !== void 0);
      case "Union":
        return [...new Set(parameter3.types.flatMap(go))];
      default:
        return [];
    }
  }
  return go(parameterFromPropertyKey(toEncoded(parameter2)));
}
var PropertySignature = class {
  name;
  type;
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }
};
function isIndexSignatureParameterSide(ast) {
  switch (ast._tag) {
    case "String":
    case "Number":
    case "Symbol":
    case "TemplateLiteral":
      return true;
    case "Union":
      return ast.types.every(isIndexSignatureParameterSide);
    default:
      return false;
  }
}
function isIndexSignatureParameter(ast) {
  return isIndexSignatureParameterSide(ast) && isIndexSignatureParameterSide(toEncoded(ast));
}
var IndexSignature = class {
  parameter;
  type;
  constructor(parameter2, type) {
    if (!isIndexSignatureParameter(parameter2)) {
      throw new Error(`Invalid index signature parameter ${parameter2._tag}`);
    }
    this.parameter = parameter2;
    this.type = type;
    if (isOptional(type) && !containsUndefined(type)) {
      throw new Error("Cannot use `Schema.optionalKey` with index signatures, use `Schema.optional` instead.");
    }
  }
};
var Objects = class _Objects extends Base2 {
  _tag = "Objects";
  propertySignatures;
  indexSignatures;
  encodingChecks;
  constructor(propertySignatures, indexSignatures, annotations, checks, encoding, context3, encodingChecks) {
    super(annotations, checks, encoding, context3);
    this.propertySignatures = propertySignatures;
    this.indexSignatures = indexSignatures;
    this.encodingChecks = encodingChecks;
    const duplicates = propertySignatures.map((ps) => ps.name).filter((name, i, arr) => arr.indexOf(name) !== i);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate identifiers: ${JSON.stringify(duplicates)}. ts(2300)`);
    }
  }
  /** @internal */
  getParser(compile, compileConstructorDefault2 = compile) {
    const ast = this;
    const expectedKeys = [];
    for (const ps of ast.propertySignatures) {
      expectedKeys.push(ps.name);
    }
    const hasProperties = expectedKeys.length;
    const indexCount = ast.indexSignatures.length;
    let expectedKeysSet = hasProperties && indexCount ? new Set(expectedKeys) : void 0;
    if (!hasProperties && !indexCount) {
      return fromRefinement(ast, isNotNullish);
    }
    let properties;
    let indexes;
    const finishIndex = (s, key, k2, inputValue, exitValue) => {
      if (exitValue._tag === "Failure") {
        return wrapPropertyKeyIssue(s, ast, key, exitValue) ?? void_2;
      }
      const value3 = exitValue === sameExit ? inputValue : exitValue[args];
      if (k2 !== missing && value3 !== missing) {
        if (hasProperties && (expectedKeysSet.has(key) || expectedKeysSet.has(k2))) return void_2;
        assignProperty(s.out, k2, value3);
      }
      return void_2;
    };
    const parseIndex = (s, key, index, exitKey) => {
      if (!exitKey) {
        const eff = index.parserKey(key, s.options);
        if (!effectIsExit(eff)) {
          return flatMap3(exit2(eff), (exit3) => parseIndex(s, key, index, exit3));
        }
        exitKey = eff;
      }
      if (exitKey._tag === "Failure") {
        return wrapPropertyKeyIssue(s, ast, key, exitKey) ?? void_2;
      }
      const k2 = exitKey === sameExit ? key : exitKey[args];
      const inputValue = s.input[key];
      const result3 = index.parserValue(inputValue, s.options);
      return effectIsExit(result3) ? finishIndex(s, key, k2, inputValue, result3) : flatMap3(exit2(result3), (exit3) => finishIndex(s, key, k2, inputValue, exit3));
    };
    const parseStringIndex = (s, key, index) => {
      const inputValue = s.input[key];
      const result3 = index.parserValue(inputValue, s.options);
      return effectIsExit(result3) ? finishIndex(s, key, key, inputValue, result3) : flatMap3(exit2(result3), (exit3) => finishIndex(s, key, key, inputValue, exit3));
    };
    const parseIndexes = indexCount ? iterateEager()({
      onItem: (s, [key, index]) => parseIndex(s, key, index),
      step: (_s, _, exit3) => exit3._tag === "Failure" ? exit3 : void 0
    }) : void 0;
    const compileMembers = () => {
      if (!properties) {
        properties = ast.propertySignatures.map((ps) => ({
          parser: compileConstructorDefault2(ps.type),
          name: ps.name,
          type: ps.type
        }));
        indexes = indexCount ? ast.indexSignatures.map((is3) => ({
          is: is3,
          parserKey: compile(parameterFromPropertyKey(is3.parameter)),
          parserValue: compileConstructorDefault2(is3.type)
        })) : void 0;
      }
      return properties;
    };
    const fallback = fnUntracedEager2(function* (input, options) {
      if (input === missing) {
        return missing;
      }
      if (!(typeof input === "object" && input !== null && !Array.isArray(input))) {
        return yield* fail6(new InvalidType(ast, input, options));
      }
      compileMembers();
      const record2 = input;
      const out = {};
      const state = {
        ast,
        input: record2,
        out,
        issues: void 0,
        options
      };
      const errorsAllOption = options.errors === "all";
      const onExcessPropertyError = options.onExcessProperty === "error";
      const onExcessPropertyPreserve = options.onExcessProperty === "preserve";
      let inputKeys;
      if (!indexCount && (onExcessPropertyError || onExcessPropertyPreserve)) {
        expectedKeysSet ??= new Set(expectedKeys);
        inputKeys = Reflect.ownKeys(record2);
        for (let i = 0; i < inputKeys.length; i++) {
          const key = inputKeys[i];
          if (!expectedKeysSet.has(key)) {
            if (onExcessPropertyError) {
              const unexpected = new UnexpectedKey(ast, record2[key], options);
              const issue = new Pointer([key], unexpected);
              if (errorsAllOption) {
                if (state.issues) {
                  state.issues.push(issue);
                } else {
                  state.issues = [issue];
                }
                continue;
              } else {
                return yield* fail6(new Composite(ast, [issue], input, options));
              }
            } else {
              assignProperty(out, key, record2[key]);
            }
          }
        }
      }
      const concurrency = resolveConcurrency(options?.concurrency);
      if (hasProperties) {
        const eff = parseProperties(state, properties, concurrency);
        if (eff) yield* eff;
      }
      if (indexCount && !concurrency) {
        for (let i = 0; i < indexCount; i++) {
          const index = indexes[i];
          const parse4 = index.is.parameter === string2 ? parseStringIndex : parseIndex;
          const keys = index.is.parameter === string2 ? Object.keys(record2) : getIndexSignatureKeys(record2, index.is.parameter, options);
          for (let j = 0; j < keys.length; j++) {
            const eff = parse4(state, keys[j], index);
            if (!effectIsExit(eff)) yield* eff;
            else if (eff._tag === "Failure") return yield* eff;
          }
        }
      } else if (parseIndexes) {
        const keyPairs = empty2();
        for (let i = 0; i < indexCount; i++) {
          const index = indexes[i];
          const keys = getIndexSignatureKeys(record2, index.is.parameter, options);
          for (let j = 0; j < keys.length; j++) {
            keyPairs.push([keys[j], index]);
          }
        }
        const eff = parseIndexes(state, keyPairs, concurrency);
        if (eff) yield* eff;
      }
      if (state.issues) {
        return yield* fail6(new Composite(ast, state.issues, input, options));
      }
      if (options.propertyOrder === "original") {
        const keys = (inputKeys ?? Reflect.ownKeys(record2)).concat(expectedKeys);
        const preserved = {};
        for (const key of keys) {
          if (Object.hasOwn(out, key)) {
            assignProperty(preserved, key, out[key]);
          }
        }
        return preserved;
      }
      return out;
    });
    if (indexCount) return fallback;
    const resume = (state, index, pending) => {
      const property = properties[index];
      return flatMap3(exit2(pending), (exit3) => {
        const terminal = stepProperty(state, property, exit3);
        if (terminal) return terminal;
        const done4 = () => succeed8(state.out);
        const eff = parseProperties(state, properties.slice(index + 1));
        return eff ? flatMapEager2(eff, done4) : done4();
      });
    };
    return (input, options) => {
      if (input === missing) return missingExit;
      if (options.errors === "all" || options.onExcessProperty !== void 0 || options.propertyOrder === "original" || options.concurrency !== void 0) {
        return fallback(input, options);
      }
      if (!(typeof input === "object" && input !== null && !Array.isArray(input))) {
        return fail6(new InvalidType(ast, input, options));
      }
      const props = compileMembers();
      const record2 = input;
      const out = {};
      const state = {
        ast,
        input: record2,
        out,
        issues: void 0,
        options
      };
      try {
        for (let index = 0; index < props.length; index++) {
          const property = props[index];
          const name = property.name;
          const hasKey = Object.hasOwn(record2, name);
          const value3 = hasKey ? record2[name] : missing;
          const exit3 = property.parser(value3, options);
          if (!effectIsExit(exit3)) {
            return resume(state, index, exit3);
          }
          if (exit3 === sameExit) {
            if (hasKey) assignProperty(out, name, value3);
            continue;
          }
          const terminal = stepProperty(state, property, exit3);
          if (terminal) return terminal;
        }
      } catch (error2) {
        return die3(error2);
      }
      return succeed8(out);
    };
  }
  _rebuild(recur, recurParameter, checks, encodingChecks) {
    const props = mapOrSame(this.propertySignatures, (ps) => {
      const t = recur(ps.type);
      return t === ps.type ? ps : new PropertySignature(ps.name, t);
    });
    const indexes = mapOrSame(this.indexSignatures, (is3) => {
      const p = recurParameter(is3.parameter);
      const t = recur(is3.type);
      return p === is3.parameter && t === is3.type ? is3 : new IndexSignature(p, t);
    });
    return props === this.propertySignatures && indexes === this.indexSignatures && checks === this.checks && encodingChecks === this.encodingChecks ? this : new _Objects(props, indexes, this.annotations, checks, void 0, this.context, encodingChecks);
  }
  /** @internal */
  flip(recur) {
    return this._rebuild(recur, recur, this.encodingChecks, this.checks);
  }
  /** @internal */
  recur(recur, recurParameter = recur) {
    return this._rebuild(recur, recurParameter, this.checks, this.encodingChecks);
  }
  /** @internal */
  getExpected() {
    if (this.propertySignatures.length === 0 && this.indexSignatures.length === 0) return "object | array";
    return "object";
  }
};
function stepProperty(s, p, exit3) {
  if (exit3._tag === "Failure") {
    return wrapPropertyKeyIssue(s, s.ast, p.name, exit3);
  }
  if (exit3 === sameExit) return;
  const value3 = exit3[args];
  if (value3 !== missing) {
    assignProperty(s.out, p.name, value3);
    return;
  }
  delete s.out[p.name];
  if (!isOptional(p.type)) {
    const issue = new Pointer([p.name], new MissingKey(p.type.context?.annotations));
    if (s.options.errors === "all") {
      if (s.issues) s.issues.push(issue);
      else s.issues = [issue];
      return;
    } else {
      return fail5(new Composite(s.ast, [issue], s.input, s.options));
    }
  }
}
var parseProperties = /* @__PURE__ */ iterateEager()({
  onItem(s, p) {
    if (!Object.hasOwn(s.input, p.name)) {
      return p.parser(missing, s.options);
    }
    const value3 = s.input[p.name];
    assignProperty(s.out, p.name, value3);
    return p.parser(value3, s.options);
  },
  step: stepProperty
});
function combineChecks(a, b) {
  if (!a) return b;
  if (!b) return a;
  return [...a, ...b];
}
function struct(fields, checks, annotations) {
  return new Objects(Reflect.ownKeys(fields).map((key) => {
    return new PropertySignature(key, fields[key].ast);
  }), [], annotations, checks);
}
function getAST(self) {
  return self.ast;
}
function tuple(elements, checks = void 0) {
  return new Arrays(false, elements.map((e) => e.ast), [], void 0, checks);
}
function union2(members, mode, checks) {
  return new Union(members.map(getAST), mode, void 0, checks);
}
var toCandidate = /* @__PURE__ */ memoizeIdempotent((ast) => {
  while (true) {
    if (isSuspend(ast)) return unknown;
    const encoding = ast.encoding;
    if (!encoding) {
      return ast.recur?.(toCandidate, identity) ?? ast;
    }
    if (encoding.some((link4) => link4.transformation._tag === "Middleware" && link4.transformation.decode !== identity)) return unknown;
    ast = encoding[encoding.length - 1].to;
  }
});
function getCandidateTypes(ast) {
  switch (ast._tag) {
    case "Null":
      return ["null"];
    case "Undefined":
      return ["undefined"];
    case "String":
    case "TemplateLiteral":
      return ["string"];
    case "Number":
      return ["number"];
    case "Boolean":
      return ["boolean"];
    case "Symbol":
    case "UniqueSymbol":
      return ["symbol"];
    case "BigInt":
      return ["bigint"];
    case "Arrays":
      return ["array"];
    case "ObjectKeyword":
      return ["object", "array", "function"];
    case "Objects":
      return ast.propertySignatures.length || ast.indexSignatures.length ? ["object"] : ["string", "number", "boolean", "symbol", "bigint", "object", "array", "function"];
    case "Enum":
      return Array.from(new Set(ast.enums.map(([, v]) => typeof v)));
    case "Literal":
      return [typeof ast.literal];
    case "Union":
      return Array.from(new Set(ast.types.flatMap(getCandidateTypes)));
    default:
      return ["null", "undefined", "string", "number", "boolean", "symbol", "bigint", "object", "array", "function"];
  }
}
function collectSentinels(ast) {
  switch (ast._tag) {
    default:
      return [];
    case "Declaration": {
      const s = ast.annotations?.[SENTINELS_ANNOTATION_KEY];
      return Array.isArray(s) ? s : [];
    }
    case "Objects":
      return ast.propertySignatures.flatMap((ps) => {
        const type = ps.type;
        if (!isOptional(type)) {
          if (isLiteral(type)) {
            return [{
              key: ps.name,
              literal: type.literal
            }];
          }
          if (isUniqueSymbol(type)) {
            return [{
              key: ps.name,
              literal: type.symbol
            }];
          }
        }
        return [];
      });
    case "Arrays":
      return ast.elements.flatMap((e, i) => {
        if (!isOptional(e)) {
          if (isLiteral(e)) {
            return [{
              key: i,
              literal: e.literal
            }];
          }
          if (isUniqueSymbol(e)) {
            return [{
              key: i,
              literal: e.symbol
            }];
          }
        }
        return [];
      });
    case "Union": {
      if (ast.types.length === 0) return [];
      const members = ast.types.map((type) => collectSentinels(toCandidate(type)));
      return members[0].filter((s) => members.every((sentinels) => sentinels.some((o) => o.key === s.key && o.literal === s.literal)));
    }
    case "Suspend":
      return collectSentinels(ast.thunk());
  }
}
var candidateIndexCache = /* @__PURE__ */ new WeakMap();
var emptyCandidates = /* @__PURE__ */ Object.freeze([]);
function getIndex(types) {
  let index = candidateIndexCache.get(types);
  if (index) return index;
  let bySentinel;
  let sentinelCandidateCount = 0;
  let otherwise;
  let literalCandidates;
  let onlyLiterals = true;
  for (let i = 0; i < types.length; i++) {
    const a = types[i];
    const encoded = toCandidate(a);
    if (isNever2(encoded)) continue;
    if (onlyLiterals) {
      if (isLiteral(encoded) || isUniqueSymbol(encoded)) {
        literalCandidates ??= /* @__PURE__ */ new Map();
        const literal2 = isLiteral(encoded) ? encoded.literal : encoded.symbol;
        let arr = literalCandidates.get(literal2);
        if (!arr) literalCandidates.set(literal2, arr = []);
        arr.push(a);
      } else {
        onlyLiterals = false;
      }
    }
    const sentinels = collectSentinels(encoded);
    if (sentinels.length) {
      bySentinel ??= /* @__PURE__ */ new Map();
      sentinelCandidateCount++;
      for (const {
        key,
        literal: literal2
      } of sentinels) {
        let entry = bySentinel.get(key);
        if (!entry) bySentinel.set(key, entry = [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Set()]);
        entry[1].add(i);
        let indexes = entry[0].get(literal2);
        if (!indexes) entry[0].set(literal2, indexes = /* @__PURE__ */ new Set());
        indexes.add(i);
      }
    } else {
      otherwise ??= {};
      const candidateTypes = getCandidateTypes(encoded);
      for (const t of candidateTypes) (otherwise[t] ??= []).push(i);
    }
  }
  if (onlyLiterals && literalCandidates) {
    literalCandidates.forEach(Object.freeze);
    index = (input) => literalCandidates.get(input) ?? emptyCandidates;
  } else if (bySentinel?.size === 1 && !otherwise) {
    const [key, [byValue]] = bySentinel.entries().next().value;
    const candidates = byValue;
    for (const [literal2, indexes] of byValue) {
      candidates.set(literal2, Object.freeze(Array.from(indexes, (index2) => types[index2])));
    }
    index = (input, isConstructor) => {
      if (isObjectKeyword(input)) {
        const value3 = Object.hasOwn(input, key) ? input[key] : void 0;
        if (value3 !== void 0) return candidates.get(value3) ?? emptyCandidates;
        if (isConstructor) return types;
      }
      return emptyCandidates;
    };
  } else if (bySentinel) {
    let commonSentinel;
    for (const entry of bySentinel) {
      if ((!commonSentinel || entry[1][0].size > commonSentinel[1][0].size) && entry[1][1].size === sentinelCandidateCount) {
        commonSentinel = entry;
      }
    }
    index = (input, isConstructor) => {
      const runtimeType = input === null ? "null" : Array.isArray(input) ? "array" : typeof input;
      const base = otherwise?.[runtimeType] ?? emptyCandidates;
      if (!isObjectKeyword(input)) return base.map((i) => types[i]);
      const selected = new Set(base);
      let directKey;
      if (commonSentinel) {
        const [key, [byValue]] = commonSentinel;
        const hasKey = Object.hasOwn(input, key);
        const value3 = hasKey ? input[key] : void 0;
        if (hasKey && (!isConstructor || value3 !== void 0)) {
          const match7 = byValue.get(value3);
          if (!match7) return base.map((i) => types[i]);
          for (const i of match7) selected.add(i);
          directKey = key;
        }
      }
      if (directKey === void 0) {
        for (const [key, [byValue, all3]] of bySentinel) {
          const hasKey = Object.hasOwn(input, key);
          const value3 = hasKey ? input[key] : void 0;
          if (hasKey && (!isConstructor || value3 !== void 0)) {
            const match7 = byValue.get(value3);
            if (match7) {
              for (const i of match7) selected.add(i);
            }
          } else if (isConstructor) {
            for (const i of all3) selected.add(i);
          }
        }
      }
      for (const [key, [byValue, all3]] of bySentinel) {
        if (key === directKey) continue;
        const hasKey = Object.hasOwn(input, key);
        const value3 = hasKey ? input[key] : void 0;
        if (hasKey && (!isConstructor || value3 !== void 0)) {
          const match7 = byValue.get(value3);
          for (const i of selected) {
            if (all3.has(i) && !match7?.has(i)) selected.delete(i);
          }
        }
      }
      return Array.from(selected).sort((a, b) => a - b).map((i) => types[i]);
    };
  } else {
    index = (input) => {
      const runtimeType = input === null ? "null" : Array.isArray(input) ? "array" : typeof input;
      return (otherwise?.[runtimeType] ?? emptyCandidates).map((i) => types[i]).filter(filterLiterals(input));
    };
  }
  candidateIndexCache.set(types, index);
  return index;
}
function filterLiterals(input) {
  return (ast) => {
    const encoded = toCandidate(ast);
    return encoded._tag === "Literal" ? encoded.literal === input : encoded._tag === "UniqueSymbol" ? encoded.symbol === input : true;
  };
}
function getCandidates(input, types, isConstructor = false) {
  return getIndex(types)(input, isConstructor);
}
var Union = class _Union extends Base2 {
  _tag = "Union";
  types;
  mode;
  encodingChecks;
  constructor(types, mode, annotations, checks, encoding, context3, encodingChecks) {
    super(annotations, checks, encoding, context3);
    this.types = types;
    this.mode = mode;
    this.encodingChecks = encodingChecks;
  }
  /** @internal */
  getParser(compile, compileConstructorDefault2) {
    const ast = this;
    return (input, options) => {
      if (input === missing) {
        return missingExit;
      }
      const candidates = getCandidates(input, ast.types, compileConstructorDefault2 !== void 0);
      if (candidates.length === 1) {
        const result3 = compile(candidates[0])(input, options);
        if (result3._tag === "Success") return result3;
        return effectIsExit(result3) ? failSingleUnionCandidate(ast, result3.cause, input, options) : catchCause2(result3, (cause) => failSingleUnionCandidate(ast, cause, input, options));
      }
      const state = {
        ast,
        compile,
        input,
        out: void 0,
        successes: ast.mode === "oneOf" ? [] : void 0,
        issues: void 0,
        options
      };
      const concurrency = resolveConcurrency(options?.concurrency);
      const eff = parseUnion(state, candidates, concurrency ? {
        ...concurrency,
        orderedStep: true
      } : void 0);
      if (!eff) {
        if (state.out) return state.out;
        return fail6(new AnyOf(ast, state.issues ?? [], input, options));
      }
      return flatMapEager2(eff, (_) => {
        if (state.out === sameExit) return succeed6(input);
        if (state.out) return state.out;
        return fail6(new AnyOf(ast, state.issues ?? [], input, options));
      });
    };
  }
  _rebuild(recur, checks, encodingChecks) {
    const types = mapOrSame(this.types, recur);
    return types === this.types && checks === this.checks && encodingChecks === this.encodingChecks ? this : new _Union(types, this.mode, this.annotations, checks, void 0, this.context, encodingChecks);
  }
  /** @internal */
  recur(recur) {
    return this._rebuild(recur, this.checks, this.encodingChecks);
  }
  /** @internal */
  flip(recur) {
    return this._rebuild(recur, this.encodingChecks, this.checks);
  }
  /** @internal */
  matchPart(s, options) {
    for (const type of this.types) {
      const out = type.matchPart(s, options);
      if (out !== void 0) return out;
    }
    return void 0;
  }
  /** @internal */
  getExpected(getExpected2) {
    const expected = this.annotations?.expected;
    if (typeof expected === "string") return expected;
    if (this.types.length === 0) return "never";
    const types = this.types.map((type) => {
      const encoded = toEncoded(type);
      switch (encoded._tag) {
        case "Arrays": {
          const literals = encoded.elements.filter(isLiteral);
          if (literals.length > 0) {
            return `${formatIsMutable(encoded.isMutable)}[ ${literals.map((e) => getExpected2(e) + formatIsOptional(e.context?.isOptional)).join(", ")}, ... ]`;
          }
          break;
        }
        case "Objects": {
          const literals = encoded.propertySignatures.filter((ps) => isLiteral(ps.type));
          if (literals.length > 0) {
            return `{ ${literals.map((ps) => `${formatIsMutable(ps.type.context?.isMutable)}${formatPropertyKey(ps.name)}${formatIsOptional(ps.type.context?.isOptional)}: ${getExpected2(ps.type)}`).join(", ")}, ... }`;
          }
          break;
        }
      }
      return getExpected2(encoded);
    });
    return Array.from(new Set(types)).join(" | ");
  }
};
function failSingleUnionCandidate(ast, cause, input, options) {
  const issue = getSchemaIssue(cause);
  if (!issue) return failCause2(cause);
  return fail5(new AnyOf(ast, [issue], input, options));
}
var parseUnion = /* @__PURE__ */ iterateEager()({
  onItem(s, ast) {
    const parser = s.compile(ast);
    return parser(s.input, s.options);
  },
  step(s, candidate, exit3) {
    if (exit3._tag === "Failure") {
      const issue = getSchemaIssue(exit3.cause);
      if (issue === void 0) {
        return exit3;
      }
      if (s.issues) s.issues.push(issue);
      else s.issues = [issue];
    } else {
      if (s.out && s.successes) {
        s.successes.push(candidate);
        return fail5(new OneOf(s.ast, s.successes, s.input, s.options));
      }
      s.out = exit3;
      if (s.successes) {
        s.successes.push(candidate);
      } else {
        return void_2;
      }
    }
  }
});
var nonFiniteLiterals = /* @__PURE__ */ new Union([/* @__PURE__ */ new Literal("Infinity"), /* @__PURE__ */ new Literal("-Infinity"), /* @__PURE__ */ new Literal("NaN")], "anyOf");
function formatIsMutable(isMutable) {
  return isMutable ? "" : "readonly ";
}
function formatIsOptional(isOptional2) {
  return isOptional2 ? "?" : "";
}
var Filter2 = class _Filter extends Class {
  _tag = "Filter";
  run;
  annotations;
  /**
   * Whether the parsing process should be aborted after this check has failed.
   */
  aborted;
  constructor(run6, annotations = void 0, aborted = false) {
    super();
    this.run = run6;
    this.annotations = annotations;
    this.aborted = aborted;
  }
  annotate(annotations) {
    return new _Filter(this.run, {
      ...this.annotations,
      ...annotations
    }, this.aborted);
  }
  abort() {
    return new _Filter(this.run, this.annotations, true);
  }
  and(other, annotations) {
    return new FilterGroup([this, other], annotations);
  }
};
var FilterGroup = class _FilterGroup extends Class {
  _tag = "FilterGroup";
  checks;
  annotations;
  constructor(checks, annotations = void 0) {
    super();
    this.checks = checks;
    this.annotations = annotations;
  }
  annotate(annotations) {
    return new _FilterGroup(this.checks, {
      ...this.annotations,
      ...annotations
    });
  }
  and(other, annotations) {
    return new _FilterGroup([this, other], annotations);
  }
};
function makeFilter(filter10, annotations, aborted = false) {
  return new Filter2((input, ast, options) => normalizeFilterOutput(ast, filter10(input, ast, options), input, options), annotations, aborted);
}
function isFinite2(annotations) {
  return makeFilter((n) => globalThis.Number.isFinite(n), {
    expected: "a finite number",
    representation: {
      id: "effect/schema/isFinite",
      payload: null
    },
    toJsonSchema: () => ({
      type: "number"
    }),
    toCode: () => ({
      runtime: "Schema.isFinite()"
    }),
    arbitrary: {
      constraint: {
        noInfinity: true,
        noNaN: true
      }
    },
    ...annotations
  });
}
var finite = /* @__PURE__ */ appendChecks(number2, [/* @__PURE__ */ isFinite2()]);
var numberToJson = /* @__PURE__ */ new Link(/* @__PURE__ */ new Union([finite, nonFiniteLiterals], "anyOf"), /* @__PURE__ */ new Transformation(/* @__PURE__ */ Number4(), /* @__PURE__ */ transform((n) => globalThis.Number.isFinite(n) ? n : globalThis.String(n))));
function isPattern(regExp, annotations) {
  const source = regExp.source;
  const pattern = new globalThis.RegExp(source, regExp.flags);
  return makeFilter((s) => {
    pattern.lastIndex = 0;
    return pattern.test(s);
  }, {
    expected: `a string matching the RegExp ${source}`,
    representation: {
      id: "effect/schema/isPattern",
      payload: {
        source,
        flags: regExp.flags
      }
    },
    toJsonSchema: () => ({
      pattern: source
    }),
    arbitrary: {
      constraint: {
        patterns: [regExp.source]
      }
    },
    ...annotations
  });
}
function modifyOwnPropertyDescriptors(ast, f) {
  const d = Object.getOwnPropertyDescriptors(ast);
  f(d);
  return Object.create(Object.getPrototypeOf(ast), d);
}
var contextOwners = /* @__PURE__ */ new WeakMap();
function getContextOwner(ast) {
  return contextOwners.get(ast) ?? ast;
}
function replaceEncoding(ast, encoding) {
  if (ast.encoding === encoding) {
    return ast;
  }
  return modifyOwnPropertyDescriptors(ast, (d) => {
    d.encoding.value = encoding;
  });
}
function replaceContext(ast, context3) {
  if (ast.context === context3) {
    return ast;
  }
  const owner = getContextOwner(ast);
  if (owner.context === context3) {
    return owner;
  }
  const out = modifyOwnPropertyDescriptors(ast, (d) => {
    d.context.value = context3;
  });
  contextOwners.set(out, owner);
  return out;
}
function annotate(ast, annotations) {
  if (ast.checks) {
    const last = ast.checks[ast.checks.length - 1];
    return replaceChecks(ast, append(ast.checks.slice(0, -1), last.annotate(annotations)));
  }
  return modifyOwnPropertyDescriptors(ast, (d) => {
    d.annotations.value = {
      ...d.annotations.value,
      ...annotations
    };
  });
}
function replaceChecks(ast, checks) {
  if (ast._tag === "Suspend" && checks) {
    throw new Error("Cannot add checks to Suspend");
  }
  if (ast.checks === checks) {
    return ast;
  }
  return modifyOwnPropertyDescriptors(ast, (d) => {
    d.checks.value = checks;
  });
}
function appendChecks(ast, checks) {
  return replaceChecks(ast, combineChecks(ast.checks, checks));
}
function mapLink(link4, f) {
  const to = f(link4.to);
  return to === link4.to ? link4 : new Link(to, link4.transformation);
}
function updateLastLink(encoding, f) {
  const links = encoding;
  const last = links[links.length - 1];
  const out = mapLink(last, f);
  return out === last ? encoding : append(encoding.slice(0, encoding.length - 1), out);
}
function applyToLastLink(f) {
  return (ast) => ast.encoding ? replaceEncoding(ast, updateLastLink(ast.encoding, f)) : ast;
}
function replaceContextLastLink(ast, context3) {
  return applyToLastLink((ast2) => replaceContext(ast2, context3))(ast);
}
function applyToSelfOrLastLinkEncodingIdempotent(f, options) {
  function out(ast) {
    if (ast.encoding) {
      const last = ast.encoding[ast.encoding.length - 1];
      return options?.stopAt?.(last) ? ast : replaceEncoding(ast, updateLastLink(ast.encoding, out));
    }
    return f(ast);
  }
  return memoizeIdempotent(out);
}
function appendTransformation(from, transformation, to) {
  const link4 = new Link(from, transformation);
  return replaceEncoding(to, to.encoding ? [...to.encoding, link4] : [link4]);
}
function mapOrSame(as3, f) {
  let changed = false;
  const out = new Array(as3.length);
  for (let i = 0; i < as3.length; i++) {
    const a = as3[i];
    const fa = f(a);
    if (fa !== a) {
      changed = true;
    }
    out[i] = fa;
  }
  return changed ? out : as3;
}
function annotateKey(ast, annotations) {
  const context3 = ast.context ? new Context(ast.context.isOptional, ast.context.isMutable, ast.context.constructorDefault, {
    ...ast.context.annotations,
    ...annotations
  }) : new Context(false, false, void 0, annotations);
  return replaceContext(ast, context3);
}
var optionalKey = /* @__PURE__ */ memoizeIdempotent((ast) => {
  const context3 = ast.context ? ast.context.isOptional === false ? new Context(true, ast.context.isMutable, ast.context.constructorDefault, ast.context.annotations) : ast.context : new Context(true, false);
  return optionalKeyLastLink(replaceContext(ast, context3));
});
var optionalKeyLastLink = /* @__PURE__ */ applyToLastLink(optionalKey);
var optional = /* @__PURE__ */ memoize((ast) => optionalKey(new Union([ast, undefined_3], "anyOf")));
function withConstructorDefault(ast, defaultValue) {
  const transformation = new Transformation(withDefault(defaultValue), passthrough2());
  const constructorDefault = new Link(unknown, transformation);
  const context3 = ast.context ? new Context(ast.context.isOptional, ast.context.isMutable, constructorDefault, ast.context.annotations) : new Context(false, false, constructorDefault);
  return replaceContext(ast, context3);
}
function decodeTo(from, to, transformation) {
  return appendTransformation(from, transformation, to);
}
function isOptional(ast) {
  return ast.context?.isOptional ?? false;
}
function isStructuralCheck(check) {
  return check.annotations?.[STRUCTURAL_ANNOTATION_KEY] === true || check._tag === "FilterGroup" && check.checks.every(isStructuralCheck);
}
function extractStructuralChecks(checks) {
  function extract(check) {
    if (isStructuralCheck(check)) return [check];
    return check._tag === "FilterGroup" ? check.checks.flatMap(extract) : [];
  }
  const out = checks.flatMap(extract);
  return isArrayNonEmpty2(out) ? out : void 0;
}
var toType = /* @__PURE__ */ memoizeIdempotent((ast) => {
  if (ast.encoding) {
    return toType(replaceEncoding(ast, void 0));
  }
  const out = ast;
  const type = out.recur?.(toType) ?? out;
  const encodingChecks = type.encodingChecks;
  if (encodingChecks) {
    const checks = type === ast ? encodingChecks : isArrays(type) || isObjects(type) || isDeclaration(type) && type.typeParameters.length > 0 ? extractStructuralChecks(encodingChecks) : void 0;
    return modifyOwnPropertyDescriptors(type, (d) => {
      d.encodingChecks.value = void 0;
      d.checks.value = combineChecks(type.checks, checks);
    });
  }
  return type;
});
var toEncoded = /* @__PURE__ */ memoizeIdempotent((ast) => {
  return toType(flip3(ast));
});
function flipEncoding(ast, encoding) {
  const links = encoding;
  const len = links.length;
  const last = links[len - 1];
  const ls = [new Link(flip3(replaceEncoding(ast, void 0)), links[0].transformation.flip())];
  for (let i = 1; i < len; i++) {
    ls.unshift(new Link(flip3(links[i - 1].to), links[i].transformation.flip()));
  }
  const to = flip3(last.to);
  if (to.encoding) {
    return replaceEncoding(to, [...to.encoding, ...ls]);
  } else {
    return replaceEncoding(to, ls);
  }
}
var flip3 = /* @__PURE__ */ memoize((ast) => {
  if (ast.encoding) {
    return flipEncoding(ast, ast.encoding);
  }
  const out = ast;
  return out.flip?.(flip3) ?? out.recur?.(flip3) ?? out;
});
function containsUndefined(ast) {
  switch (ast._tag) {
    case "Undefined":
      return true;
    case "Union":
      return ast.types.some(containsUndefined);
    default:
      return false;
  }
}
function fromConst(ast, value3) {
  const succeed10 = succeed8(value3);
  return (input, options) => {
    if (input === missing) return missingExit;
    if (input === value3) return succeed10;
    return fail6(new InvalidType(ast, input, options));
  };
}
function fromRefinement(ast, refinement) {
  return (input, options) => {
    if (input === missing) return missingExit;
    if (refinement(input)) return sameExit;
    return fail6(new InvalidType(ast, input, options));
  };
}
var parameterFromPropertyKey = /* @__PURE__ */ applyToSelfOrLastLinkEncodingIdempotent((ast) => {
  switch (ast._tag) {
    default:
      return ast;
    case "Number":
      return ast.toCodecStringTree();
    case "Union":
      return ast.recur(parameterFromPropertyKey);
  }
});
var parameterFromString = /* @__PURE__ */ applyToSelfOrLastLinkEncodingIdempotent((ast) => {
  switch (ast._tag) {
    default:
      return ast;
    case "Symbol":
    case "UniqueSymbol":
      return ast.toCodecStringTree();
    case "Union":
      return ast.recur(parameterFromString);
  }
});
var isStringFiniteRegExp = /* @__PURE__ */ new globalThis.RegExp(`^${FINITE_PATTERN}$`);
var isStringNumberRegExp = /* @__PURE__ */ new globalThis.RegExp(`^(?:${FINITE_PATTERN}|Infinity|-Infinity|NaN)$`);
function isStringFinite(annotations) {
  return isPattern(isStringFiniteRegExp, {
    expected: "a string representing a finite number",
    representation: {
      id: "effect/schema/isStringFinite",
      payload: null
    },
    toJsonSchema: () => ({
      pattern: isStringFiniteRegExp.source
    }),
    ...annotations
  });
}
var finiteString = /* @__PURE__ */ appendChecks(string2, [/* @__PURE__ */ isStringFinite()]);
var finiteToString = /* @__PURE__ */ new Link(finiteString, numberFromString);
var numberToString = /* @__PURE__ */ new Link(/* @__PURE__ */ new Union([finiteString, nonFiniteLiterals], "anyOf"), numberFromString);
var BIGINT_PATTERN = "-?\\d+";
var isStringBigIntRegExp = /* @__PURE__ */ new globalThis.RegExp(`^${BIGINT_PATTERN}$`);
var REGEXP_PATTERN = "Symbol\\((.*)\\)";
var isStringSymbolRegExp = /* @__PURE__ */ new globalThis.RegExp(`^${REGEXP_PATTERN}$`);
function collectIssues(checks, value3, issues, ast, options) {
  for (let i = 0; i < checks.length; i++) {
    const check = checks[i];
    if (check._tag === "FilterGroup") {
      issues = collectIssues(check.checks, value3, issues, ast, options);
      if (issues && (options.errors !== "all" || issues[issues.length - 1].filter.aborted)) {
        return issues;
      }
    } else {
      const issue = check.run(value3, ast, options);
      if (issue) {
        const filter10 = new Filter(check, issue, value3, options);
        if (issues) issues.push(filter10);
        else issues = [filter10];
        if (options.errors !== "all" || check.aborted) {
          return issues;
        }
      }
    }
  }
  return issues;
}
function getConstructorDescriptor(ast) {
  if (!isDeclaration(ast)) return void 0;
  const getDescriptor = ast.annotations?.[CONSTRUCTOR_ANNOTATION_KEY];
  return isFunction(getDescriptor) ? getDescriptor(ast.typeParameters) : void 0;
}
function isJsonLeaf(u) {
  return u === null || typeof u === "string" || typeof u === "boolean" || typeof u === "number" && globalThis.Number.isFinite(u);
}
function isStringTreeLeaf(u) {
  return u === void 0 || typeof u === "string";
}
function isTree(u, isLeaf) {
  const cache = /* @__PURE__ */ new WeakMap();
  const stack = [];
  outer: while (true) {
    if (typeof u !== "object" || u === null) {
      if (!isLeaf(u)) {
        return false;
      }
    } else {
      const value3 = u;
      const cached3 = cache.get(value3);
      if (cached3 === false) {
        return false;
      }
      if (cached3 === void 0) {
        const isArray2 = Array.isArray(value3);
        if (!isArray2) {
          const prototype = Object.getPrototypeOf(value3);
          if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
            return false;
          }
        }
        cache.set(value3, false);
        stack.push({
          value: value3,
          keys: isArray2 ? value3.length : Object.keys(value3),
          index: 0
        });
      }
    }
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const keys = frame.keys;
      if (typeof keys === "number") {
        if (frame.index < keys) {
          u = frame.value[frame.index++];
          continue outer;
        }
      } else if (frame.index < keys.length) {
        u = frame.value[keys[frame.index++]];
        continue outer;
      }
      cache.set(frame.value, true);
      stack.pop();
    }
    return true;
  }
}
function isJson(u) {
  return isTree(u, isJsonLeaf);
}
var Json = /* @__PURE__ */ new Declaration([], () => (input, ast, options) => isJson(input) ? sameExit : fail6(new InvalidType(ast, input, options)), {
  representation: {
    id: "effect/schema/Json",
    payload: null
  },
  expected: "JSON value",
  toCodecJson: () => void 0,
  toCodecStringTree: () => unknownToStringTree,
  toArbitrary: () => (fc) => fc.jsonValue()
});
function isStringTree(u) {
  return isTree(u, isStringTreeLeaf);
}
var StringTree = /* @__PURE__ */ new Declaration([], () => (input, ast, options) => isStringTree(input) ? sameExit : fail6(new InvalidType(ast, input, options)), {
  expected: "StringTree",
  toCodecStringTree: () => void 0
});
var unknownToStringTree = /* @__PURE__ */ new Link(StringTree, /* @__PURE__ */ passthrough3());

// node_modules/effect/dist/Brand.js
function nominal() {
  return Object.assign((input) => input, {
    option: (input) => some2(input),
    result: (input) => succeed2(input),
    is: (_) => true
  });
}

// node_modules/effect/dist/unstable/process/ChildProcessSpawner.js
var ExitCode = /* @__PURE__ */ nominal();
var ProcessId = /* @__PURE__ */ nominal();
var HandleTypeId = "~effect/ChildProcessSpawner/ChildProcessHandle";
var HandleProto = {
  [HandleTypeId]: HandleTypeId,
  ...BaseProto,
  toJSON() {
    return {
      _id: "ChildProcessHandle",
      pid: this.pid
    };
  }
};
var makeHandle = (params) => Object.setPrototypeOf({
  ...params
}, HandleProto);
var make15 = (spawn2) => {
  const streamString = (command, options) => spawn2(command).pipe(map6((handle) => decodeText(options?.includeStderr === true ? handle.all : handle.stdout)), unwrap3);
  const streamLines = (command, options) => splitLines2(streamString(command, options));
  return ChildProcessSpawner.of({
    spawn: spawn2,
    exitCode: (command) => scoped2(flatMap3(spawn2(command), (handle) => handle.exitCode)),
    streamString,
    streamLines,
    lines: (command, options) => runCollect(streamLines(command, options)),
    string: (command, options) => mkString(streamString(command, options))
  });
};
var ChildProcessSpawner = class extends (/* @__PURE__ */ Service()("effect/process/ChildProcessSpawner")) {
};

// node_modules/effect/dist/unstable/process/ChildProcess.js
var TypeId26 = "~effect/unstable/process/ChildProcess";
var Proto3 = {
  .../* @__PURE__ */ Prototype2({
    label: "Command",
    evaluate(fiber3) {
      return getUnsafe(fiber3.context, ChildProcessSpawner).spawn(this);
    }
  }),
  [TypeId26]: TypeId26
};
var makeStandardCommand = (command, args2, options) => Object.assign(Object.create(Proto3), {
  _tag: "StandardCommand",
  command,
  args: args2,
  options
});
var make16 = function make17(...args2) {
  if (isTemplateString(args2[0])) {
    const [templates, ...expressions] = args2;
    const tokens = parseTemplates(templates, expressions);
    return makeStandardCommand(tokens[0] ?? "", tokens.slice(1), {});
  }
  if (typeof args2[0] === "object" && !Array.isArray(args2[0]) && !isTemplateString(args2[0])) {
    const options2 = args2[0];
    return function(templates, ...expressions) {
      const tokens = parseTemplates(templates, expressions);
      return makeStandardCommand(tokens[0] ?? "", tokens.slice(1), options2);
    };
  }
  if (typeof args2[0] === "string" && !Array.isArray(args2[1])) {
    const [command2, options2 = {}] = args2;
    return makeStandardCommand(command2, [], options2);
  }
  const [command, cmdArgs = [], options = {}] = args2;
  return makeStandardCommand(command, cmdArgs, options);
};
var isTemplateString = (u) => Array.isArray(u) && "raw" in u && Array.isArray(u.raw);
var parseFdName = (name) => {
  const match7 = /^fd(\d+)$/.exec(name);
  if (match7 === null) return void 0;
  const fd = parseInt(match7[1], 10);
  return fd >= 3 ? fd : void 0;
};
var fdName = (fd) => `fd${fd}`;
var parseTemplates = (templates, expressions) => {
  let tokens = [];
  for (const [index, template] of templates.entries()) {
    tokens = parseTemplate(templates, expressions, tokens, template, index);
  }
  return tokens;
};
var parseTemplate = (templates, expressions, prevTokens, template, index) => {
  const rawTemplate = templates.raw[index];
  if (rawTemplate === void 0) {
    throw new Error(`Invalid backslash sequence: ${templates.raw[index]}`);
  }
  const {
    hasLeadingWhitespace,
    hasTrailingWhitespace,
    tokens
  } = splitByWhitespaces(template, rawTemplate);
  const nextTokens = concatTokens(prevTokens, tokens, hasLeadingWhitespace);
  if (index === expressions.length) {
    return nextTokens;
  }
  const expression = expressions[index];
  const expressionTokens = Array.isArray(expression) ? expression.map((expression2) => parseExpression(expression2)) : [parseExpression(expression)];
  return concatTokens(nextTokens, expressionTokens, hasTrailingWhitespace);
};
var parseExpression = (expression) => {
  const type = typeof expression;
  if (type === "string") {
    return expression;
  }
  return String(expression);
};
var DELIMITERS = /* @__PURE__ */ new Set([" ", "	", "\r", "\n"]);
var ESCAPE_LENGTH = {
  x: 3,
  u: 5
};
var splitByWhitespaces = (template, rawTemplate) => {
  if (rawTemplate.length === 0) {
    return {
      tokens: [],
      hasLeadingWhitespace: false,
      hasTrailingWhitespace: false
    };
  }
  const hasLeadingWhitespace = DELIMITERS.has(rawTemplate[0]);
  const tokens = [];
  let templateCursor = 0;
  for (let templateIndex = 0, rawIndex = 0; templateIndex < template.length; templateIndex += 1, rawIndex += 1) {
    const rawCharacter = rawTemplate[rawIndex];
    if (DELIMITERS.has(rawCharacter)) {
      if (templateCursor !== templateIndex) {
        tokens.push(template.slice(templateCursor, templateIndex));
      }
      templateCursor = templateIndex + 1;
    } else if (rawCharacter === "\\") {
      const nextRawCharacter = rawTemplate[rawIndex + 1];
      if (nextRawCharacter === "\n") {
        templateIndex -= 1;
        rawIndex += 1;
      } else if (nextRawCharacter === "u" && rawTemplate[rawIndex + 2] === "{") {
        rawIndex = rawTemplate.indexOf("}", rawIndex + 3);
      } else {
        rawIndex += ESCAPE_LENGTH[nextRawCharacter] ?? 1;
      }
    }
  }
  const hasTrailingWhitespace = templateCursor === template.length;
  if (!hasTrailingWhitespace) {
    tokens.push(template.slice(templateCursor));
  }
  return {
    tokens,
    hasLeadingWhitespace,
    hasTrailingWhitespace
  };
};
var concatTokens = (prevTokens, nextTokens, isSeparated) => isSeparated || prevTokens.length === 0 || nextTokens.length === 0 ? [...prevTokens, ...nextTokens] : [...prevTokens.slice(0, -1), `${prevTokens.at(-1)}${nextTokens.at(0)}`, ...nextTokens.slice(1)];

// node_modules/@effect/platform-node-shared/dist/NodeChildProcessSpawner.js
import * as NodeChildProcess from "node:child_process";
import { PassThrough } from "node:stream";

// node_modules/@effect/platform-node-shared/dist/internal/nodeChildProcessSpawner.js
var buildSpawnOptions = (options, base, platform) => {
  const detached = options.detached ?? platform !== "win32";
  return {
    ...base,
    detached,
    shell: options.shell,
    windowsHide: options.windowsHide ?? !detached
  };
};

// node_modules/@effect/platform-node-shared/dist/internal/utils.js
var handleErrnoException = (module, method) => (err, [path5]) => {
  let reason = "Unknown";
  switch (err.code) {
    case "ENOENT":
      reason = "NotFound";
      break;
    case "EACCES":
      reason = "PermissionDenied";
      break;
    case "EEXIST":
      reason = "AlreadyExists";
      break;
    case "EISDIR":
      reason = "BadResource";
      break;
    case "ENOTDIR":
      reason = "BadResource";
      break;
    case "EBUSY":
      reason = "Busy";
      break;
    case "ELOOP":
      reason = "BadResource";
      break;
  }
  return systemError({
    _tag: reason,
    module,
    method,
    pathOrDescriptor: path5,
    syscall: err.syscall,
    cause: err
  });
};

// node_modules/@effect/platform-node-shared/dist/NodeSink.js
var fromWritable = (options) => fromChannel2(mapDone(fromWritableChannel(options), (_) => [_]));
var fromWritableChannel = (options) => fromTransform((pull) => {
  const writable = options.evaluate();
  return succeed6(pullIntoWritable({
    ...options,
    writable,
    pull
  }));
});
var pullIntoWritable = (options) => options.pull.pipe(flatMap3((chunk) => {
  let i = 0;
  return callback2(function loop(resume) {
    for (; i < chunk.length; ) {
      const success = options.writable.write(chunk[i++], options.encoding);
      if (!success) {
        options.writable.once("drain", () => loop(resume));
        return;
      }
    }
    resume(void_3);
  });
}), forever3({
  disableYield: true
}), raceFirst2(callback2((resume) => {
  const onError4 = (error2) => resume(fail6(options.onError(error2)));
  options.writable.once("error", onError4);
  return sync2(() => {
    options.writable.off("error", onError4);
  });
})), options.endOnDone !== false ? catchDone((_) => {
  if ("closed" in options.writable && options.writable.closed) {
    return done2(_);
  }
  return callback2((resume) => {
    options.writable.once("finish", () => resume(done2(_)));
    options.writable.end();
  });
}) : identity);

// node_modules/@effect/platform-node-shared/dist/NodeStream.js
var fromReadable = (options) => fromChannel3(fromReadableChannel(options));
var fromReadableChannel = (options) => fromTransform((_, scope3) => readableToPullUnsafe({
  scope: scope3,
  readable: options.evaluate(),
  onError: options.onError ?? defaultOnError,
  chunkSize: options.chunkSize,
  closeOnDone: options.closeOnDone
}));
var readableToPullUnsafe = (options) => {
  const readable = options.readable;
  const closeOnDone = options.closeOnDone ?? true;
  const exit3 = options.exit ?? make6(void 0);
  const latch = makeUnsafe4(false);
  function onReadable() {
    latch.openUnsafe();
  }
  function onError4(error2) {
    exit3.current = fail5(options.onError(error2));
    latch.openUnsafe();
  }
  function onEnd2() {
    exit3.current = fail5(Done2());
    latch.openUnsafe();
  }
  readable.on("readable", onReadable);
  readable.once("error", onError4);
  readable.once("end", onEnd2);
  const pull = suspend2(function loop() {
    let item = options.readable.read(options.chunkSize);
    if (item === null) {
      if (exit3.current) {
        return exit3.current;
      }
      if (readable.readableEnded) {
        return fail6(Done2());
      }
      latch.closeUnsafe();
      return flatMap3(latch.await, loop);
    }
    const chunk = of(item);
    while (true) {
      item = options.readable.read(options.chunkSize);
      if (item === null) break;
      chunk.push(item);
    }
    return succeed6(chunk);
  });
  return as2(addFinalizer2(options.scope, sync2(() => {
    readable.off("readable", onReadable);
    readable.off("error", onError4);
    readable.off("end", onEnd2);
    if (closeOnDone && "closed" in options.readable && !options.readable.closed) {
      options.readable.destroy();
    }
  })), pull);
};
var defaultOnError = (error2) => new UnknownError2(error2);

// node_modules/@effect/platform-node-shared/dist/NodeChildProcessSpawner.js
var toError = (error2) => error2 instanceof globalThis.Error ? error2 : new globalThis.Error(String(error2));
var toPlatformError = (method, error2, command) => {
  const {
    commands
  } = flattenCommand(command);
  const commandStr = commands.reduce((acc, curr) => {
    const cmd = `${curr.command} ${curr.args.join(" ")}`;
    return acc.length === 0 ? cmd : `${acc} | ${cmd}`;
  }, "");
  return handleErrnoException("ChildProcess", method)(error2, [commandStr]);
};
var taskkill = (childProcess, onExit4 = () => {
}) => NodeChildProcess.execFile("taskkill", ["/pid", String(childProcess.pid), "/T", "/F"], {
  windowsHide: true
}, onExit4);
var make18 = /* @__PURE__ */ gen2(function* () {
  const fs = yield* FileSystem;
  const path5 = yield* Path;
  const resolveWorkingDirectory = fnUntraced2(function* (options) {
    if (isUndefined(options.cwd)) return void 0;
    yield* fs.access(options.cwd);
    return path5.resolve(options.cwd);
  });
  const resolveEnvironment = (options) => {
    return options.extendEnv ? {
      ...globalThis.process.env,
      ...options.env
    } : options.env;
  };
  const inputToStdioOption = (input) => isStream(input) ? "pipe" : input;
  const outputToStdioOption = (input) => isSink(input) ? "pipe" : input;
  const resolveStdinOption = (options) => {
    const defaultConfig = {
      stream: "pipe",
      encoding: "utf-8",
      endOnDone: true
    };
    if (isUndefined(options.stdin)) {
      return defaultConfig;
    }
    if (typeof options.stdin === "string") {
      return {
        ...defaultConfig,
        stream: options.stdin
      };
    }
    if (isStream(options.stdin)) {
      return {
        ...defaultConfig,
        stream: options.stdin
      };
    }
    return {
      stream: options.stdin.stream,
      encoding: options.stdin.encoding ?? defaultConfig.encoding,
      endOnDone: options.stdin.endOnDone ?? defaultConfig.endOnDone
    };
  };
  const resolveOutputOption = (options, streamName) => {
    const option4 = options[streamName];
    if (isUndefined(option4)) {
      return {
        stream: "pipe"
      };
    }
    if (typeof option4 === "string") {
      return {
        stream: option4
      };
    }
    if (isSink(option4)) {
      return {
        stream: option4
      };
    }
    return {
      stream: option4.stream
    };
  };
  const resolveAdditionalFds = (options) => {
    if (isUndefined(options.additionalFds)) {
      return [];
    }
    const result3 = [];
    for (const [name, config] of Object.entries(options.additionalFds)) {
      const fd = parseFdName(name);
      if (isNotUndefined(fd)) {
        result3.push({
          fd,
          config
        });
      }
    }
    return result3.sort((a, b) => a.fd - b.fd);
  };
  const buildStdioArray = (stdinConfig, stdoutConfig, stderrConfig, additionalFds) => {
    const stdio = [inputToStdioOption(stdinConfig.stream), outputToStdioOption(stdoutConfig.stream), outputToStdioOption(stderrConfig.stream)];
    if (additionalFds.length === 0) {
      return stdio;
    }
    const maxFd = additionalFds.reduce((max2, {
      fd
    }) => Math.max(max2, fd), 2);
    for (let i = 3; i <= maxFd; i++) {
      stdio[i] = "ignore";
    }
    for (const {
      fd
    } of additionalFds) {
      stdio[fd] = "pipe";
    }
    return stdio;
  };
  const setupAdditionalFds = fnUntraced2(function* (command, childProcess, additionalFds) {
    if (additionalFds.length === 0) {
      return {
        getInputFd: () => drain,
        getOutputFd: () => empty5
      };
    }
    const inputSinks = /* @__PURE__ */ new Map();
    const outputStreams = /* @__PURE__ */ new Map();
    for (const {
      config,
      fd
    } of additionalFds) {
      const nodeStream = childProcess.stdio[fd];
      switch (config.type) {
        case "input": {
          let sink = drain;
          if (nodeStream && "write" in nodeStream) {
            sink = fromWritable({
              evaluate: () => nodeStream,
              onError: (error2) => toPlatformError(`fromWritable(fd${fd})`, toError(error2), command)
            });
          }
          if (config.stream) {
            yield* forkScoped2(run(config.stream, sink));
          }
          inputSinks.set(fd, sink);
          break;
        }
        case "output": {
          let stream = empty5;
          if (nodeStream && "read" in nodeStream) {
            const passThrough = new PassThrough();
            nodeStream.on("error", (error2) => passThrough.destroy(error2));
            nodeStream.pipe(passThrough);
            stream = fromReadable({
              evaluate: () => passThrough,
              onError: (error2) => toPlatformError(`fromReadable(fd${fd})`, toError(error2), command)
            });
          }
          if (config.sink) {
            stream = transduce(stream, config.sink);
          }
          outputStreams.set(fd, stream);
          break;
        }
      }
    }
    return {
      getInputFd: (fd) => inputSinks.get(fd) ?? drain,
      getOutputFd: (fd) => outputStreams.get(fd) ?? empty5
    };
  });
  const setupChildStdin = (command, childProcess, config) => suspend2(() => {
    let sink = drain;
    if (isNotNull(childProcess.stdin)) {
      sink = fromWritable({
        evaluate: () => childProcess.stdin,
        onError: (error2) => toPlatformError("fromWritable(stdin)", toError(error2), command),
        endOnDone: config.endOnDone,
        encoding: config.encoding
      });
    }
    if (isStream(config.stream)) {
      return as2(forkScoped2(run(config.stream, sink)), sink);
    }
    return succeed6(sink);
  });
  const setupChildOutputStreams = (command, childProcess, stdoutConfig, stderrConfig) => {
    let stdout = childProcess.stdout ? (() => {
      const passThrough = new PassThrough();
      childProcess.stdout.on("error", (error2) => passThrough.destroy(error2));
      childProcess.stdout.pipe(passThrough);
      return fromReadable({
        evaluate: () => passThrough,
        onError: (error2) => toPlatformError("fromReadable(stdout)", toError(error2), command)
      });
    })() : empty5;
    let stderr = childProcess.stderr ? (() => {
      const passThrough = new PassThrough();
      childProcess.stderr.on("error", (error2) => passThrough.destroy(error2));
      childProcess.stderr.pipe(passThrough);
      return fromReadable({
        evaluate: () => passThrough,
        onError: (error2) => toPlatformError("fromReadable(stderr)", toError(error2), command)
      });
    })() : empty5;
    if (isSink(stdoutConfig.stream)) {
      stdout = transduce(stdout, stdoutConfig.stream);
    }
    if (isSink(stderrConfig.stream)) {
      stderr = transduce(stderr, stderrConfig.stream);
    }
    const all3 = merge3(stdout, stderr);
    return {
      stdout,
      stderr,
      all: all3
    };
  };
  const spawn2 = (command, spawnOptions) => callback2((resume) => {
    const deferred = makeUnsafe2();
    const handle = NodeChildProcess.spawn(command.command, command.args, spawnOptions);
    handle.on("error", (error2) => {
      resume(fail6(toPlatformError("spawn", error2, command)));
    });
    handle.on("exit", (...args2) => {
      doneUnsafe(deferred, succeed4(args2));
    });
    handle.on("spawn", () => {
      resume(succeed6([handle, deferred]));
    });
    return sync2(() => {
      handle.kill("SIGTERM");
    });
  });
  const killProcessGroup = (command, childProcess, signal) => {
    if (globalThis.process.platform === "win32") {
      return callback2((resume) => {
        taskkill(childProcess, (error2) => {
          if (error2) {
            resume(fail6(toPlatformError("kill", toError(error2), command)));
          } else {
            resume(void_3);
          }
        });
      });
    }
    return try_2({
      try: () => {
        globalThis.process.kill(-childProcess.pid, signal);
      },
      catch: (error2) => toPlatformError("kill", toError(error2), command)
    });
  };
  const killProcessGroupOnExit = (childProcess, signal) => {
    if (globalThis.process.platform === "win32") {
      taskkill(childProcess);
      return;
    }
    try {
      globalThis.process.kill(-childProcess.pid, signal);
    } catch {
    }
  };
  const killProcess = (command, childProcess, signal) => suspend2(() => {
    const killed = childProcess.kill(signal);
    if (!killed) {
      const error2 = new globalThis.Error("Failed to kill child process");
      return fail6(toPlatformError("kill", error2, command));
    }
    return void_3;
  });
  const withTimeout = (childProcess, command, options) => (kill) => {
    const killSignal = options?.killSignal ?? "SIGTERM";
    return isUndefined(options?.forceKillAfter) ? kill(command, childProcess, killSignal) : timeoutOrElse2(kill(command, childProcess, killSignal), {
      duration: options.forceKillAfter,
      orElse: () => kill(command, childProcess, "SIGKILL")
    });
  };
  const getSourceStream = (handle, from) => {
    const fromOption4 = from ?? "stdout";
    switch (fromOption4) {
      case "stdout":
        return handle.stdout;
      case "stderr":
        return handle.stderr;
      case "all":
        return handle.all;
      default: {
        const fd = parseFdName(fromOption4);
        if (isNotUndefined(fd)) {
          return handle.getOutputFd(fd);
        }
        return handle.stdout;
      }
    }
  };
  const spawnCommand = fnUntraced2(function* (cmd) {
    switch (cmd._tag) {
      case "StandardCommand": {
        const stdinConfig = resolveStdinOption(cmd.options);
        const stdoutConfig = resolveOutputOption(cmd.options, "stdout");
        const stderrConfig = resolveOutputOption(cmd.options, "stderr");
        const resolvedAdditionalFds = resolveAdditionalFds(cmd.options);
        let isReferenced = true;
        const cwd = yield* resolveWorkingDirectory(cmd.options);
        const env = resolveEnvironment(cmd.options);
        const stdio = buildStdioArray(stdinConfig, stdoutConfig, stderrConfig, resolvedAdditionalFds);
        const [childProcess, exitSignal] = yield* acquireRelease2(spawn2(cmd, buildSpawnOptions(cmd.options, {
          cwd,
          env,
          stdio
        }, process.platform)), fnUntraced2(function* ([childProcess2, exitSignal2]) {
          const exited = yield* isDone3(exitSignal2);
          const killWithTimeout = withTimeout(childProcess2, cmd, cmd.options);
          if (exited) {
            const [code2] = yield* _await(exitSignal2);
            if (code2 !== 0 && isNotNull(code2)) {
              return yield* ignore2(killWithTimeout(killProcessGroup));
            }
            return yield* void_3;
          }
          if (!isReferenced) {
            return yield* void_3;
          }
          return yield* killWithTimeout((command, childProcess3, signal) => killProcessGroup(command, childProcess3, signal).pipe(catch_2(() => killProcess(command, childProcess3, signal)), andThen2(_await(exitSignal2)))).pipe(ignore2);
        }));
        const pid = ProcessId(childProcess.pid);
        childProcess.on("exit", (code2) => {
          if (code2 !== 0 && isNotNull(code2)) {
            killProcessGroupOnExit(childProcess, cmd.options.killSignal ?? "SIGTERM");
          }
        });
        const reref = sync2(() => {
          if (!isReferenced) {
            childProcess.ref();
            isReferenced = true;
          }
        });
        const unref = sync2(() => {
          if (isReferenced) {
            childProcess.unref();
            isReferenced = false;
          }
          return reref;
        });
        const stdin = yield* setupChildStdin(cmd, childProcess, stdinConfig);
        const {
          all: all3,
          stderr,
          stdout
        } = setupChildOutputStreams(cmd, childProcess, stdoutConfig, stderrConfig);
        const {
          getInputFd,
          getOutputFd
        } = yield* setupAdditionalFds(cmd, childProcess, resolvedAdditionalFds);
        const isRunning = map6(isDone3(exitSignal), (done4) => !done4);
        const exitCode = flatMap3(_await(exitSignal), ([code2, signal]) => {
          if (isNotNull(code2)) {
            return succeed6(ExitCode(code2));
          }
          const error2 = new globalThis.Error(`Process interrupted due to receipt of signal: '${signal}'`);
          return fail6(toPlatformError("exitCode", error2, cmd));
        });
        const kill = (options) => {
          const killWithTimeout = withTimeout(childProcess, cmd, options);
          return killWithTimeout((command, childProcess2, signal) => killProcessGroup(command, childProcess2, signal).pipe(catch_2(() => killProcess(command, childProcess2, signal)), andThen2(_await(exitSignal)))).pipe(asVoid2);
        };
        return makeHandle({
          pid,
          exitCode,
          isRunning,
          kill,
          stdin,
          stdout,
          stderr,
          all: all3,
          getInputFd,
          getOutputFd,
          unref
        });
      }
      case "PipedCommand": {
        const {
          commands,
          pipeOptions
        } = flattenCommand(cmd);
        const [root2, ...pipeline] = commands;
        const handles = [yield* spawnCommand(root2)];
        for (let i = 0; i < pipeline.length; i++) {
          const command = pipeline[i];
          const options = pipeOptions[i] ?? {};
          const stdinConfig = resolveStdinOption(command.options);
          const sourceStream = unwrap3(succeed6(getSourceStream(handles[handles.length - 1], options.from)));
          const toOption2 = options.to ?? "stdin";
          if (toOption2 === "stdin") {
            handles.push(yield* spawnCommand(make16(command.command, command.args, {
              ...command.options,
              stdin: {
                ...stdinConfig,
                stream: sourceStream
              }
            })));
          } else {
            const fd = parseFdName(toOption2);
            if (isNotUndefined(fd)) {
              const fdName2 = fdName(fd);
              const existingFds = command.options.additionalFds ?? {};
              handles.push(yield* spawnCommand(make16(command.command, command.args, {
                ...command.options,
                additionalFds: {
                  ...existingFds,
                  [fdName2]: {
                    type: "input",
                    stream: sourceStream
                  }
                }
              })));
            } else {
              handles.push(yield* spawnCommand(make16(command.command, command.args, {
                ...command.options,
                stdin: {
                  ...stdinConfig,
                  stream: sourceStream
                }
              })));
            }
          }
        }
        const handle = handles[handles.length - 1];
        const kill = (options) => forEach2([...handles].reverse(), (handle2) => ignore2(handle2.kill(options)), {
          discard: true
        });
        const unref = gen2(function* () {
          const rerefs = [];
          for (const handle2 of handles) {
            rerefs.push(yield* handle2.unref);
          }
          return forEach2([...rerefs].reverse(), (reref) => reref, {
            discard: true
          });
        });
        return makeHandle({
          pid: handle.pid,
          exitCode: handle.exitCode,
          isRunning: handle.isRunning,
          kill,
          stdin: handle.stdin,
          stdout: handle.stdout,
          stderr: handle.stderr,
          all: handle.all,
          getInputFd: handle.getInputFd,
          getOutputFd: handle.getOutputFd,
          unref
        });
      }
    }
  });
  return make15(spawnCommand);
});
var layer = /* @__PURE__ */ effect(ChildProcessSpawner, make18);
var flattenCommand = (command) => {
  const commands = [];
  const pipeOptions = [];
  const flatten4 = (cmd) => {
    switch (cmd._tag) {
      case "StandardCommand": {
        commands.push(cmd);
        break;
      }
      case "PipedCommand": {
        flatten4(cmd.left);
        pipeOptions.push(cmd.options);
        flatten4(cmd.right);
        break;
      }
    }
  };
  flatten4(command);
  if (commands.length === 0) {
    throw new Error("flattenCommand produced empty commands array");
  }
  const [first, ...rest] = commands;
  const nonEmptyCommands = [first, ...rest];
  return {
    commands: nonEmptyCommands,
    pipeOptions
  };
};

// node_modules/effect/dist/internal/uuid.js
var hex = (byte) => byte.toString(16).padStart(2, "0");
var stringify = (bytes) => {
  const segments = [bytes.subarray(0, 4), bytes.subarray(4, 6), bytes.subarray(6, 8), bytes.subarray(8, 10), bytes.subarray(10, 16)];
  return segments.map((segment) => Array.from(segment, hex).join("")).join("-");
};
var randomBytes = () => globalThis.crypto.getRandomValues(new Uint8Array(16));
function v4Bytes(bytes = randomBytes()) {
  bytes[6] = bytes[6] & 15 | 64;
  bytes[8] = bytes[8] & 63 | 128;
  return bytes;
}
var v4String = (bytes) => stringify(bytes === void 0 ? v4Bytes() : v4Bytes(bytes));
var maxV7Timestamp = 2 ** 48 - 1;
function v7Bytes(timestampMillis, bytes = randomBytes()) {
  const timestamp = Math.min(Math.max(0, Math.trunc(timestampMillis)), maxV7Timestamp);
  bytes[0] = Math.floor(timestamp / 2 ** 40);
  bytes[1] = Math.floor(timestamp / 2 ** 32) & 255;
  bytes[2] = Math.floor(timestamp / 2 ** 24) & 255;
  bytes[3] = Math.floor(timestamp / 2 ** 16) & 255;
  bytes[4] = Math.floor(timestamp / 2 ** 8) & 255;
  bytes[5] = timestamp & 255;
  bytes[6] = bytes[6] & 15 | 112;
  bytes[8] = bytes[8] & 63 | 128;
  return bytes;
}
var v7String = (timestampMillis, bytes) => stringify(bytes === void 0 ? v7Bytes(timestampMillis) : v7Bytes(timestampMillis, bytes));

// node_modules/effect/dist/Crypto.js
var TypeId27 = "~effect/platform/Crypto";
var Crypto = /* @__PURE__ */ Service("effect/Crypto");
var make19 = (impl) => {
  const randomBytesUnsafe = impl.randomBytes;
  const randomBytes4 = (size2) => map6(validateSize("randomBytes", size2), randomBytesUnsafe);
  const readUint53 = (bytes) => (bytes[0] & 31) * 2 ** 48 + bytes[1] * 2 ** 40 + bytes[2] * 2 ** 32 + bytes[3] * 2 ** 24 + bytes[4] * 2 ** 16 + bytes[5] * 2 ** 8 + bytes[6];
  const nextDoubleUnsafe = () => readUint53(randomBytesUnsafe(7)) / 2 ** 53;
  const nextIntUnsafe = () => {
    while (true) {
      const bytes = randomBytesUnsafe(7);
      const value3 = readUint53(bytes);
      if ((bytes[0] & 32) === 0) {
        return value3 + Number.MIN_SAFE_INTEGER;
      }
      if (value3 < Number.MAX_SAFE_INTEGER) {
        return value3 + 1;
      }
    }
  };
  return Crypto.of({
    [TypeId27]: TypeId27,
    randomBytes: randomBytes4,
    nextDoubleUnsafe,
    nextIntUnsafe,
    digest: impl.digest,
    random: sync2(() => nextDoubleUnsafe()),
    randomBoolean: sync2(() => nextDoubleUnsafe() > 0.5),
    randomInt: sync2(() => nextIntUnsafe()),
    randomBetween: (min2, max2) => sync2(() => nextDoubleUnsafe() * (max2 - min2) + min2),
    randomIntBetween(min2, max2, options) {
      const extra = options?.halfOpen === true ? 0 : 1;
      return sync2(() => {
        const minInt = Math.ceil(min2);
        const maxInt = Math.floor(max2);
        return Math.floor(nextDoubleUnsafe() * (maxInt - minInt + extra)) + minInt;
      });
    },
    randomShuffle: (elements) => sync2(() => {
      const buffer2 = Array.from(elements);
      for (let i = buffer2.length - 1; i >= 1; i = i - 1) {
        const index = Math.min(i, Math.floor(nextDoubleUnsafe() * (i + 1)));
        const value3 = buffer2[i];
        buffer2[i] = buffer2[index];
        buffer2[index] = value3;
      }
      return buffer2;
    }),
    randomUUIDv4: sync2(() => v4String(randomBytesUnsafe(16))),
    randomUUIDv7: clockWith2((clock) => succeed6(v7String(clock.currentTimeMillisUnsafe(), randomBytesUnsafe(16))))
  });
};
var validateSize = (method, size2) => Number.isSafeInteger(size2) && size2 >= 0 ? succeed6(size2) : fail6(badArgument({
  module: "Crypto",
  method,
  description: "size must be a non-negative safe integer"
}));

// node_modules/@effect/platform-node-shared/dist/NodeCrypto.js
import * as NodeCrypto from "node:crypto";
var toHashAlgorithm = (algorithm) => {
  switch (algorithm) {
    case "SHA-1":
      return "sha1";
    case "SHA-256":
      return "sha256";
    case "SHA-384":
      return "sha384";
    case "SHA-512":
      return "sha512";
  }
};
var digest = (algorithm, data) => try_2({
  try: () => Uint8Array.from(NodeCrypto.createHash(toHashAlgorithm(algorithm)).update(data).digest()),
  catch: (cause) => systemError({
    module: "Crypto",
    method: "digest",
    _tag: "Unknown",
    description: "Could not compute digest",
    cause
  })
});
var make20 = /* @__PURE__ */ make19({
  randomBytes: NodeCrypto.randomBytes,
  digest
});
var layer2 = /* @__PURE__ */ succeed5(Crypto, make20);

// node_modules/@effect/platform-node/dist/NodeCrypto.js
var layer3 = layer2;

// node_modules/@effect/platform-node-shared/dist/NodeFileSystem.js
import * as Crypto2 from "node:crypto";
import * as NFS from "node:fs";
import * as OS from "node:os";
import * as Path2 from "node:path";
var handleBadArgument = (method) => (err) => badArgument({
  module: "FileSystem",
  method,
  description: err.message ?? String(err)
});
var access2 = /* @__PURE__ */ (() => {
  const nodeAccess = /* @__PURE__ */ effectify(NFS.access, /* @__PURE__ */ handleErrnoException("FileSystem", "access"), /* @__PURE__ */ handleBadArgument("access"));
  return (path5, options) => {
    let mode = NFS.constants.F_OK;
    if (options?.readable) {
      mode |= NFS.constants.R_OK;
    }
    if (options?.writable) {
      mode |= NFS.constants.W_OK;
    }
    return nodeAccess(path5, mode);
  };
})();
var copy = /* @__PURE__ */ (() => {
  const nodeCp = /* @__PURE__ */ effectify(NFS.cp, /* @__PURE__ */ handleErrnoException("FileSystem", "copy"), /* @__PURE__ */ handleBadArgument("copy"));
  return (fromPath, toPath, options) => nodeCp(fromPath, toPath, {
    force: options?.overwrite ?? false,
    preserveTimestamps: options?.preserveTimestamps ?? false,
    recursive: true
  });
})();
var copyFile2 = /* @__PURE__ */ (() => {
  const nodeCopyFile = /* @__PURE__ */ effectify(NFS.copyFile, /* @__PURE__ */ handleErrnoException("FileSystem", "copyFile"), /* @__PURE__ */ handleBadArgument("copyFile"));
  return (fromPath, toPath) => nodeCopyFile(fromPath, toPath);
})();
var chmod2 = /* @__PURE__ */ (() => {
  const nodeChmod = /* @__PURE__ */ effectify(NFS.chmod, /* @__PURE__ */ handleErrnoException("FileSystem", "chmod"), /* @__PURE__ */ handleBadArgument("chmod"));
  return (path5, mode) => nodeChmod(path5, mode);
})();
var chown2 = /* @__PURE__ */ (() => {
  const nodeChown = /* @__PURE__ */ effectify(NFS.chown, /* @__PURE__ */ handleErrnoException("FileSystem", "chown"), /* @__PURE__ */ handleBadArgument("chown"));
  return (path5, uid, gid) => nodeChown(path5, uid, gid);
})();
var glob2 = /* @__PURE__ */ (() => {
  const nodeGlob = /* @__PURE__ */ effectify(NFS.glob, /* @__PURE__ */ handleErrnoException("FileSystem", "glob"), /* @__PURE__ */ handleBadArgument("glob"));
  return (pattern, options) => nodeGlob(pattern, {
    cwd: options?.root,
    exclude: options?.exclude
  });
})();
var link2 = /* @__PURE__ */ (() => {
  const nodeLink = /* @__PURE__ */ effectify(NFS.link, /* @__PURE__ */ handleErrnoException("FileSystem", "link"), /* @__PURE__ */ handleBadArgument("link"));
  return (existingPath, newPath) => nodeLink(existingPath, newPath);
})();
var makeDirectory = /* @__PURE__ */ (() => {
  const nodeMkdir = /* @__PURE__ */ effectify(NFS.mkdir, /* @__PURE__ */ handleErrnoException("FileSystem", "makeDirectory"), /* @__PURE__ */ handleBadArgument("makeDirectory"));
  return (path5, options) => nodeMkdir(path5, {
    recursive: options?.recursive ?? false,
    mode: options?.mode
  });
})();
var makeTempDirectoryFactory = (method) => {
  const nodeMkdtemp = effectify(NFS.mkdtemp, handleErrnoException("FileSystem", method), handleBadArgument(method));
  return (options) => suspend2(() => {
    const prefix = options?.prefix ?? "";
    const directory4 = typeof options?.directory === "string" ? Path2.join(options.directory, ".") : OS.tmpdir();
    return nodeMkdtemp(prefix ? Path2.join(directory4, prefix) : directory4 + "/");
  });
};
var makeTempDirectory = /* @__PURE__ */ makeTempDirectoryFactory("makeTempDirectory");
var removeFactory = (method) => {
  const nodeRm = effectify(NFS.rm, handleErrnoException("FileSystem", method), handleBadArgument(method));
  return (path5, options) => nodeRm(path5, {
    recursive: options?.recursive ?? false,
    force: options?.force ?? false
  });
};
var remove2 = /* @__PURE__ */ removeFactory("remove");
var makeTempDirectoryScoped = /* @__PURE__ */ (() => {
  const makeDirectory2 = /* @__PURE__ */ makeTempDirectoryFactory("makeTempDirectoryScoped");
  const removeDirectory = /* @__PURE__ */ removeFactory("makeTempDirectoryScoped");
  return (options) => acquireRelease2(makeDirectory2(options), (directory4) => orDie2(removeDirectory(directory4, {
    recursive: true
  })));
})();
var openFactory = (method) => {
  const nodeOpen = effectify(NFS.open, handleErrnoException("FileSystem", method), handleBadArgument(method));
  const nodeClose = effectify(NFS.close, handleErrnoException("FileSystem", method), handleBadArgument(method));
  return (path5, options) => pipe(acquireRelease2(nodeOpen(path5, options?.flag ?? "r", options?.mode), (fd) => orDie2(nodeClose(fd))), map6((fd) => makeFile(fd, options?.flag?.startsWith("a") ?? false)));
};
var open2 = /* @__PURE__ */ openFactory("open");
var makeFile = /* @__PURE__ */ (() => {
  const nodeReadFactory = (method) => effectify(NFS.read, handleErrnoException("FileSystem", method), handleBadArgument(method));
  const nodeRead = /* @__PURE__ */ nodeReadFactory("read");
  const nodeReadAlloc = /* @__PURE__ */ nodeReadFactory("readAlloc");
  const nodeStat = /* @__PURE__ */ effectify(NFS.fstat, /* @__PURE__ */ handleErrnoException("FileSystem", "stat"), /* @__PURE__ */ handleBadArgument("stat"));
  const nodeTruncate = /* @__PURE__ */ effectify(NFS.ftruncate, /* @__PURE__ */ handleErrnoException("FileSystem", "truncate"), /* @__PURE__ */ handleBadArgument("truncate"));
  const nodeSync = /* @__PURE__ */ effectify(NFS.fsync, /* @__PURE__ */ handleErrnoException("FileSystem", "sync"), /* @__PURE__ */ handleBadArgument("sync"));
  const nodeWriteFactory = (method) => effectify(NFS.write, handleErrnoException("FileSystem", method), handleBadArgument(method));
  const nodeWrite = /* @__PURE__ */ nodeWriteFactory("write");
  const nodeWriteAll = /* @__PURE__ */ nodeWriteFactory("writeAll");
  class FileImpl {
    [FileTypeId];
    fd;
    append;
    position = /* @__PURE__ */ BigInt(0);
    constructor(fd, append3) {
      this[FileTypeId] = FileTypeId;
      this.fd = fd;
      this.append = append3;
    }
    get stat() {
      return map6(nodeStat(this.fd), makeFileInfo);
    }
    get sync() {
      return nodeSync(this.fd);
    }
    seek(offset, from) {
      const offsetSize = Size(offset);
      return sync2(() => {
        if (from === "start") {
          this.position = offsetSize;
        } else if (from === "current") {
          this.position = this.position + offsetSize;
        }
        return Size(this.position);
      });
    }
    read(buffer2) {
      return suspend2(() => {
        const position = this.position;
        return map6(nodeRead(this.fd, {
          buffer: buffer2,
          position
        }), (bytesRead) => {
          const sizeRead = Size(bytesRead);
          this.position = position + sizeRead;
          return sizeRead;
        });
      });
    }
    readAlloc(size2) {
      const sizeNumber = Number(size2);
      return suspend2(() => {
        const buffer2 = Buffer.allocUnsafeSlow(sizeNumber);
        const position = this.position;
        return map6(nodeReadAlloc(this.fd, {
          buffer: buffer2,
          position
        }), (bytesRead) => {
          if (bytesRead === 0) {
            return none2();
          }
          this.position = position + BigInt(bytesRead);
          if (bytesRead === sizeNumber) {
            return some2(buffer2);
          }
          const dst = Buffer.allocUnsafeSlow(bytesRead);
          buffer2.copy(dst, 0, 0, bytesRead);
          return some2(dst);
        });
      });
    }
    truncate(length) {
      return map6(nodeTruncate(this.fd, length ? Number(length) : void 0), () => {
        if (!this.append) {
          const len = BigInt(length ?? 0);
          if (this.position > len) {
            this.position = len;
          }
        }
      });
    }
    write(buffer2) {
      return suspend2(() => {
        const position = this.position;
        return map6(nodeWrite(this.fd, buffer2, void 0, void 0, this.append ? void 0 : Number(position)), (bytesWritten) => {
          const sizeWritten = Size(bytesWritten);
          if (!this.append) {
            this.position = position + sizeWritten;
          }
          return sizeWritten;
        });
      });
    }
    writeAllChunk(buffer2) {
      return suspend2(() => {
        const position = this.position;
        return flatMap3(nodeWriteAll(this.fd, buffer2, void 0, void 0, this.append ? void 0 : Number(position)), (bytesWritten) => {
          if (bytesWritten === 0) {
            return fail6(systemError({
              module: "FileSystem",
              method: "writeAll",
              _tag: "WriteZero",
              pathOrDescriptor: this.fd,
              description: "write returned 0 bytes written"
            }));
          }
          if (!this.append) {
            this.position = position + BigInt(bytesWritten);
          }
          return bytesWritten < buffer2.length ? this.writeAllChunk(buffer2.subarray(bytesWritten)) : void_3;
        });
      });
    }
    writeAll(buffer2) {
      return this.writeAllChunk(buffer2);
    }
  }
  return (fd, append3) => new FileImpl(fd, append3);
})();
var makeTempFileFactory = (method) => {
  const makeDirectory2 = makeTempDirectoryFactory(method);
  return fnUntraced2(function* (options) {
    const directory4 = yield* makeDirectory2(options);
    const random2 = Crypto2.randomBytes(6).toString("hex");
    const name = Path2.join(directory4, options?.suffix ? `${random2}${options.suffix}` : random2);
    yield* writeFile2(name, new Uint8Array(0));
    return name;
  });
};
var makeTempFile = /* @__PURE__ */ makeTempFileFactory("makeTempFile");
var makeTempFileScoped = /* @__PURE__ */ (() => {
  const makeFile2 = /* @__PURE__ */ makeTempFileFactory("makeTempFileScoped");
  const removeDirectory = /* @__PURE__ */ removeFactory("makeTempFileScoped");
  return (options) => acquireRelease2(makeFile2(options), (file4) => orDie2(removeDirectory(Path2.dirname(file4), {
    recursive: true
  })));
})();
var readDirectory = (path5, options) => tryPromise2({
  try: () => NFS.promises.readdir(path5, options),
  catch: (err) => handleErrnoException("FileSystem", "readDirectory")(err, [path5])
});
var readFile2 = (path5) => callback2((resume, signal) => {
  try {
    NFS.readFile(path5, {
      signal
    }, (err, data) => {
      if (err) {
        resume(fail6(handleErrnoException("FileSystem", "readFile")(err, [path5])));
      } else {
        resume(succeed6(data));
      }
    });
  } catch (err) {
    resume(fail6(handleBadArgument("readFile")(err)));
  }
});
var readLink = /* @__PURE__ */ (() => {
  const nodeReadLink = /* @__PURE__ */ effectify(NFS.readlink, /* @__PURE__ */ handleErrnoException("FileSystem", "readLink"), /* @__PURE__ */ handleBadArgument("readLink"));
  return (path5) => nodeReadLink(path5);
})();
var realPath = /* @__PURE__ */ (() => {
  const nodeRealPath = /* @__PURE__ */ effectify(NFS.realpath, /* @__PURE__ */ handleErrnoException("FileSystem", "realPath"), /* @__PURE__ */ handleBadArgument("realPath"));
  return (path5) => nodeRealPath(path5);
})();
var rename2 = /* @__PURE__ */ (() => {
  const nodeRename = /* @__PURE__ */ effectify(NFS.rename, /* @__PURE__ */ handleErrnoException("FileSystem", "rename"), /* @__PURE__ */ handleBadArgument("rename"));
  return (oldPath, newPath) => nodeRename(oldPath, newPath);
})();
var makeFileInfo = (stat3) => ({
  type: stat3.isFile() ? "File" : stat3.isDirectory() ? "Directory" : stat3.isSymbolicLink() ? "SymbolicLink" : stat3.isBlockDevice() ? "BlockDevice" : stat3.isCharacterDevice() ? "CharacterDevice" : stat3.isFIFO() ? "FIFO" : stat3.isSocket() ? "Socket" : "Unknown",
  mtime: fromNullishOr(stat3.mtime),
  atime: fromNullishOr(stat3.atime),
  birthtime: fromNullishOr(stat3.birthtime),
  dev: stat3.dev,
  rdev: fromNullishOr(stat3.rdev),
  ino: fromNullishOr(stat3.ino),
  mode: stat3.mode,
  nlink: fromNullishOr(stat3.nlink),
  uid: fromNullishOr(stat3.uid),
  gid: fromNullishOr(stat3.gid),
  size: Size(stat3.size),
  blksize: stat3.blksize !== void 0 ? some2(Size(stat3.blksize)) : none2(),
  blocks: fromNullishOr(stat3.blocks)
});
var stat2 = /* @__PURE__ */ (() => {
  const nodeStat = /* @__PURE__ */ effectify(NFS.stat, /* @__PURE__ */ handleErrnoException("FileSystem", "stat"), /* @__PURE__ */ handleBadArgument("stat"));
  return (path5) => map6(nodeStat(path5), makeFileInfo);
})();
var symlink2 = /* @__PURE__ */ (() => {
  const nodeSymlink = /* @__PURE__ */ effectify(NFS.symlink, /* @__PURE__ */ handleErrnoException("FileSystem", "symlink"), /* @__PURE__ */ handleBadArgument("symlink"));
  return (target, path5) => nodeSymlink(target, path5);
})();
var truncate2 = /* @__PURE__ */ (() => {
  const nodeTruncate = /* @__PURE__ */ effectify(NFS.truncate, /* @__PURE__ */ handleErrnoException("FileSystem", "truncate"), /* @__PURE__ */ handleBadArgument("truncate"));
  return (path5, length) => nodeTruncate(path5, length !== void 0 ? Number(length) : void 0);
})();
var utimes2 = /* @__PURE__ */ (() => {
  const nodeUtimes = /* @__PURE__ */ effectify(NFS.utimes, /* @__PURE__ */ handleErrnoException("FileSystem", "utime"), /* @__PURE__ */ handleBadArgument("utime"));
  return (path5, atime, mtime) => nodeUtimes(path5, atime, mtime);
})();
var watchNode = (path5, options) => callback3((queue) => acquireRelease2(sync2(() => {
  const watcher = NFS.watch(path5, {
    recursive: options?.recursive ?? false
  }, (event, path6) => {
    if (!path6) return;
    switch (event) {
      case "rename": {
        runFork2(matchEffect3(stat2(path6), {
          onSuccess: (_) => offer(queue, {
            _tag: "Create",
            path: path6
          }),
          onFailure: (_) => offer(queue, {
            _tag: "Remove",
            path: path6
          })
        }));
        return;
      }
      case "change": {
        offerUnsafe(queue, {
          _tag: "Update",
          path: path6
        });
        return;
      }
    }
  });
  watcher.on("error", (error2) => {
    failCauseUnsafe(queue, fail4(systemError({
      module: "FileSystem",
      _tag: "Unknown",
      method: "watch",
      pathOrDescriptor: path5,
      cause: error2
    })));
  });
  watcher.on("close", () => {
    endUnsafe(queue);
  });
  return watcher;
}), (watcher) => sync2(() => watcher.close())));
var watch2 = (backend, path5, options) => stat2(path5).pipe(map6((stat3) => backend.pipe(flatMap((_) => _.register(path5, stat3, options)), getOrElse(() => watchNode(path5, options)))), unwrap3);
var writeFile2 = (path5, data, options) => callback2((resume, signal) => {
  try {
    NFS.writeFile(path5, data, {
      signal,
      flag: options?.flag,
      mode: options?.mode
    }, (err) => {
      if (err) {
        resume(fail6(handleErrnoException("FileSystem", "writeFile")(err, [path5])));
      } else {
        resume(void_3);
      }
    });
  } catch (err) {
    resume(fail6(handleBadArgument("writeFile")(err)));
  }
});
var makeFileSystem = /* @__PURE__ */ map6(/* @__PURE__ */ serviceOption2(WatchBackend), (backend) => make13({
  access: access2,
  chmod: chmod2,
  chown: chown2,
  copy,
  copyFile: copyFile2,
  glob: glob2,
  link: link2,
  makeDirectory,
  makeTempDirectory,
  makeTempDirectoryScoped,
  makeTempFile,
  makeTempFileScoped,
  open: open2,
  readDirectory,
  readFile: readFile2,
  readLink,
  realPath,
  remove: remove2,
  rename: rename2,
  stat: stat2,
  symlink: symlink2,
  truncate: truncate2,
  utimes: utimes2,
  watch(path5, options) {
    return watch2(backend, path5, options);
  },
  writeFile: writeFile2
}));
var layer4 = /* @__PURE__ */ effect(FileSystem)(makeFileSystem);

// node_modules/@effect/platform-node/dist/NodeFileSystem.js
var layer5 = layer4;

// node_modules/@effect/platform-node-shared/dist/NodePath.js
import * as NodePath from "node:path";
import * as NodeUrl from "node:url";
var fileUrlOps = (windows) => ({
  fromFileUrl: (url) => try_2({
    try: () => NodeUrl.fileURLToPath(url, {
      windows
    }),
    catch: (cause) => new BadArgument({
      module: "Path",
      method: "fromFileUrl",
      cause
    })
  }),
  toFileUrl: (path5) => try_2({
    try: () => NodeUrl.pathToFileURL(path5, {
      windows
    }),
    catch: (cause) => new BadArgument({
      module: "Path",
      method: "toFileUrl",
      cause
    })
  })
});
var layerPosix = /* @__PURE__ */ succeed5(Path)({
  [TypeId22]: TypeId22,
  ...NodePath.posix,
  .../* @__PURE__ */ fileUrlOps(false)
});
var layerWin32 = /* @__PURE__ */ succeed5(Path)({
  [TypeId22]: TypeId22,
  ...NodePath.win32,
  .../* @__PURE__ */ fileUrlOps(true)
});
var layer6 = /* @__PURE__ */ succeed5(Path)({
  [TypeId22]: TypeId22,
  ...NodePath,
  .../* @__PURE__ */ fileUrlOps(void 0)
});

// node_modules/@effect/platform-node/dist/NodePath.js
var layer7 = layer6;

// node_modules/effect/dist/Stdio.js
var TypeId28 = "~effect/Stdio";
var Stdio = /* @__PURE__ */ Service(TypeId28);
var make21 = (options) => ({
  [TypeId28]: TypeId28,
  stdinIsTerminal: succeed6(false),
  stdoutIsTerminal: succeed6(false),
  ...options
});

// node_modules/@effect/platform-node-shared/dist/NodeStdio.js
var layer8 = /* @__PURE__ */ succeed5(Stdio, /* @__PURE__ */ make21({
  args: /* @__PURE__ */ sync2(() => process.argv.slice(2)),
  stdinIsTerminal: /* @__PURE__ */ sync2(() => process.stdin.isTTY === true),
  stdoutIsTerminal: /* @__PURE__ */ sync2(() => process.stdout.isTTY === true),
  stdout: (options) => fromWritable({
    evaluate: () => process.stdout,
    onError: (cause) => systemError({
      module: "Stdio",
      method: "stdout",
      _tag: "Unknown",
      cause
    }),
    endOnDone: options?.endOnDone ?? false
  }),
  stderr: (options) => fromWritable({
    evaluate: () => process.stderr,
    onError: (cause) => systemError({
      module: "Stdio",
      method: "stderr",
      _tag: "Unknown",
      cause
    }),
    endOnDone: options?.endOnDone ?? false
  }),
  stdin: /* @__PURE__ */ fromReadable({
    evaluate: () => process.stdin,
    onError: (cause) => systemError({
      module: "Stdio",
      method: "stdin",
      _tag: "Unknown",
      cause
    }),
    closeOnDone: false
  })
}));

// node_modules/@effect/platform-node/dist/NodeStdio.js
var layer9 = layer8;

// node_modules/effect/dist/SchemaParser.js
function makeEffect(schema) {
  const parser = runWithCompiler(constructorCompiler, toType(schema.ast));
  return (input, options) => {
    return parser(input, options?.disableChecks ? options?.parseOptions ? {
      ...options.parseOptions,
      disableChecks: true
    } : {
      disableChecks: true
    } : options?.parseOptions);
  };
}
function makeOption(schema) {
  const parser = makeEffect(schema);
  return (input, options) => {
    const exit3 = runSyncExit2(parser(input, options));
    if (isSuccess4(exit3)) {
      return some2(exit3.value);
    }
    getSchemaIssueOrThrow(exit3.cause, "Option adapter can only return none for schema issues");
    return none2();
  };
}
function make22(schema) {
  const parser = makeEffect(schema);
  return (input, options) => {
    const exit3 = runSyncExit2(parser(input, options));
    if (isSuccess4(exit3)) {
      return exit3.value;
    }
    const issue = getSchemaIssueOrThrow(exit3.cause, "Constructor adapter can only throw schema issues");
    throw new Error("Schema validation failed", {
      cause: issue
    });
  };
}
function is(schema) {
  return _is(schema.ast);
}
function _is(ast) {
  const parser = asExit(run2(toType(ast)));
  return (input) => {
    const exit3 = parser(input, defaultParseOptions);
    if (isSuccess4(exit3)) {
      return true;
    }
    getSchemaIssueOrThrow(exit3.cause, "Type guard adapter can only return false for schema issues");
    return false;
  };
}
function decodeUnknownEffect(schema, options) {
  const parser = run2(schema.ast);
  return options === void 0 ? parser : (input, overrideOptions) => parser(input, mergeParseOptions(options, overrideOptions));
}
var mergeParseOptions = (options, overrideOptions) => overrideOptions ? {
  ...options,
  ...overrideOptions
} : options;
var getValue = (value3) => {
  if (value3 === missing) {
    return fail6(new InvalidValue());
  }
  return succeed6(value3);
};
function run2(ast) {
  return runWithCompiler(normalCompiler, ast);
}
function runWithCompiler(compiler, ast) {
  let parser;
  return (input, options) => {
    const result3 = (parser ??= compiler(ast))(input, options ?? defaultParseOptions);
    if (result3 === sameExit) {
      return succeed6(input);
    }
    if (!effectIsExit(result3)) {
      return flatMapEager2(result3, getValue);
    }
    return result3[args] === missing ? getValue(missing) : result3;
  };
}
function asExit(parser) {
  return (input, options) => runSyncExit2(parser(input, options));
}
var normalCompiler = /* @__PURE__ */ memoize((ast) => makeParser(ast, normalCompiler));
var constructorCompiler = /* @__PURE__ */ memoize((ast) => makeParser(ast, constructorCompiler, compileConstructorDefault));
var compileDefaulted = /* @__PURE__ */ memoize((ast) => makeParser(ast, constructorCompiler, compileConstructorDefault, ast.context?.constructorDefault));
function compileConstructorDefault(ast) {
  return ast.context?.constructorDefault ? compileDefaulted(ast) : constructorCompiler(ast);
}
function applyTransformation(result3, current, transformation, options) {
  let transformed;
  if (effectIsExit(result3) && result3._tag === "Success") {
    const optional7 = toOption(result3 === sameExit ? current : result3[args]);
    transformed = transformation._tag === "Transformation" ? transformation.decode.run(optional7, options) : transformation.decode(succeed8(optional7), options);
  } else if (transformation._tag === "Transformation") {
    transformed = flatMapEager2(result3, (value3) => transformation.decode.run(toOption(value3), options));
  } else {
    transformed = transformation.decode(mapEager2(result3, toOption), options);
  }
  return effectIsExit(transformed) && transformed._tag === "Success" ? fromOptionExit(transformed[args]) : flatMapEager2(transformed, fromOptionExit);
}
function makeConstructorParser(descriptor, compile) {
  let sourceParser;
  return (input, options) => {
    if (input === missing) return missingExit;
    if (descriptor.isConstructed(input)) return sameExit;
    const result3 = (sourceParser ??= compile(descriptor.link.to))(input, options);
    return applyTransformation(result3, input, descriptor.link.transformation, options);
  };
}
function makeParser(ast, compile, compileConstructorDefault2, constructorDefault) {
  const descriptor = compileConstructorDefault2 ? getConstructorDescriptor(ast) : void 0;
  const parser = descriptor ? makeConstructorParser(descriptor, compile) : ast.getParser(compile, compileConstructorDefault2);
  const checks = ast.checks;
  const links = constructorDefault ? ast.encoding ? [...ast.encoding, constructorDefault] : [constructorDefault] : ast.encoding;
  const encodingChecks = ast.encodingChecks;
  const astOptions = (checks ? checks[checks.length - 1].annotations : ast.annotations)?.["parseOptions"];
  if (!links && !checks && !encodingChecks) {
    if (!astOptions) {
      return parser;
    }
    return (input, options) => parser(input, mergeParseOptions(options, astOptions));
  }
  let encodingParsers;
  const parseLocal = (input, options) => {
    let result3 = parser(input, options);
    if (encodingChecks && !options.disableChecks) {
      if (effectIsExit(result3)) {
        if (result3._tag === "Success") {
          const output = result3 === sameExit ? input : result3[args];
          if (input !== missing && output !== missing) {
            const issues = collectIssues(encodingChecks, input, void 0, ast, options);
            if (issues) {
              result3 = fail6(new Composite(ast, issues, input, options));
            }
          }
        }
      } else {
        result3 = flatMap3(result3, (value3) => {
          if (input !== missing && value3 !== missing) {
            const issues = collectIssues(encodingChecks, input, void 0, ast, options);
            if (issues) {
              return fail6(new Composite(ast, issues, input, options));
            }
          }
          return succeed6(value3);
        });
      }
    }
    if (checks && !options.disableChecks) {
      if (effectIsExit(result3)) {
        if (result3._tag === "Success") {
          const value3 = result3 === sameExit ? input : result3[args];
          if (value3 === missing) return result3;
          const issues = collectIssues(checks, value3, void 0, ast, options);
          if (issues) {
            result3 = fail6(new Composite(ast, issues, value3, options));
          }
        }
      } else {
        result3 = flatMap3(result3, (value3) => {
          if (value3 !== missing) {
            const issues = collectIssues(checks, value3, void 0, ast, options);
            if (issues) {
              return fail6(new Composite(ast, issues, value3, options));
            }
          }
          return succeed6(value3);
        });
      }
    }
    return result3;
  };
  if (!links) {
    return astOptions ? (input, options) => parseLocal(input, mergeParseOptions(options, astOptions)) : parseLocal;
  }
  return (input, options) => {
    if (astOptions) {
      options = mergeParseOptions(options, astOptions);
    }
    const parsers = encodingParsers ??= links.map((link4) => compile(link4.to));
    let current = input;
    let result3 = parsers[parsers.length - 1](input, options);
    for (let i = links.length - 1; i >= 0; i--) {
      result3 = applyTransformation(result3, current, links[i].transformation, options);
      if (i !== 0) {
        const next = parsers[i - 1];
        if (result3._tag === "Success") {
          current = result3[args];
          result3 = next(current, options);
        } else {
          result3 = flatMapEager2(result3, (value3) => {
            const nextResult = next(value3, options);
            return nextResult === sameExit ? succeed8(value3) : nextResult;
          });
        }
      }
    }
    if (result3._tag === "Success") {
      const value3 = result3[args];
      const local = parseLocal(value3, options);
      return local === sameExit ? result3 : local;
    }
    result3 = catchCause2(result3, (cause) => failCauseSync2(() => map5(cause, (issue) => new Encoding(ast, issue, input, options))));
    return flatMapEager2(result3, (value3) => {
      const local = parseLocal(value3, options);
      return local === sameExit ? succeed8(value3) : local;
    });
  };
}

// node_modules/effect/dist/internal/schema/schema.js
var TypeId29 = "~effect/Schema/Schema";
var SchemaProto = {
  [TypeId29]: TypeId29,
  pipe() {
    return pipeArguments(this, arguments);
  },
  annotate(annotations) {
    return this.rebuild(annotate(this.ast, annotations));
  },
  annotateKey(annotations) {
    return this.rebuild(annotateKey(this.ast, annotations));
  },
  check(...checks) {
    return this.rebuild(appendChecks(this.ast, checks));
  }
};
function make23(ast, options) {
  function Schema() {
  }
  const self = Object.defineProperties(Object.setPrototypeOf(Schema, SchemaProto), Object.getOwnPropertyDescriptors({
    ...options
  }));
  self.ast = ast;
  self.rebuild = (ast2) => make23(ast2, options);
  self.makeEffect = makeEffect(self);
  self.make = make22(self);
  self.makeOption = makeOption(self);
  return self;
}

// node_modules/effect/dist/Struct.js
var lambda = (f) => f;

// node_modules/effect/dist/internal/redacted.js
var redactedRegistry = /* @__PURE__ */ new WeakMap();
var value = (self) => {
  if (redactedRegistry.has(self)) {
    return redactedRegistry.get(self);
  } else {
    throw new Error("Unable to get redacted value" + (self.label ? ` with label: "${self.label}"` : ""));
  }
};

// node_modules/effect/dist/Redacted.js
var TypeId30 = "~effect/data/Redacted";
var isRedacted = (u) => hasProperty(u, TypeId30);
var make24 = (value3, options) => {
  const self = Object.create(Proto4);
  if (options?.label) {
    self.label = options.label;
  }
  redactedRegistry.set(self, value3);
  return self;
};
var Proto4 = {
  [TypeId30]: {
    _A: (_) => _
  },
  label: void 0,
  ...PipeInspectableProto,
  toJSON() {
    return this.toString();
  },
  toString() {
    return `<redacted${isString(this.label) ? ":" + this.label : ""}>`;
  },
  [symbol]() {
    return hash(redactedRegistry.get(this));
  },
  [symbol2](that) {
    return isRedacted(that) && equals(redactedRegistry.get(this), redactedRegistry.get(that));
  }
};
var value2 = value;

// node_modules/effect/dist/Schema.js
var TypeId31 = TypeId29;
function declareConstructor() {
  return (typeParameters, run6, annotations) => {
    return make25(new Declaration(typeParameters.map(getAST), (typeParameters2) => run6(typeParameters2.map((ast) => make25(ast))), annotations));
  };
}
function declare(is3, annotations) {
  return declareConstructor()([], () => (input, ast, options) => is3(input) ? succeed6(input) : fail6(new InvalidType(ast, input, options)), annotations);
}
var SchemaErrorTypeId = "~effect/SchemaError/SchemaError";
var SchemaError = class extends (/* @__PURE__ */ TaggedError2("SchemaError")) {
  [SchemaErrorTypeId] = SchemaErrorTypeId;
  constructor(issue) {
    const stackTraceLimit = getStackTraceLimit();
    setStackTraceLimit(0);
    try {
      super({
        issue
      });
    } finally {
      setStackTraceLimit(stackTraceLimit);
    }
  }
  get message() {
    return defaultFormatter(this.issue);
  }
  toString() {
    return `SchemaError(${this.message})`;
  }
};
var is2 = is;
function decodeUnknownEffect2(schema, options) {
  const parser = decodeUnknownEffect(schema, options);
  return (input, options2) => {
    return fromIssueEffect(parser(input, options2));
  };
}
function fromIssueEffect(self) {
  if (effectIsExit(self)) {
    return fromIssueExit(self);
  }
  return catchCause2(self, (cause) => failCauseSync2(() => map5(cause, (issue) => new SchemaError(issue))));
}
function fromIssueExit(exit3) {
  return isSuccess4(exit3) ? exit3 : failCause2(map5(exit3.cause, (issue) => new SchemaError(issue)));
}
var make25 = make23;
function isSchema(u) {
  return hasProperty(u, TypeId31) && u[TypeId31] === TypeId31;
}
var optionalKey2 = /* @__PURE__ */ lambda((schema) => make25(optionalKey(schema.ast), {
  schema
}));
var optional2 = /* @__PURE__ */ lambda((self) => {
  const schema = UndefinedOr(self);
  return make25(optional(self.ast), {
    schema
  });
});
function Literal2(literal2) {
  const out = make25(new Literal(literal2), {
    literal: literal2,
    transform(to) {
      return out.pipe(decodeTo2(Literal2(to), {
        decode: transform(() => to),
        encode: transform(() => literal2)
      }));
    }
  });
  return out;
}
var Unknown2 = /* @__PURE__ */ make25(unknown);
var Undefined2 = /* @__PURE__ */ make25(undefined_3);
var String4 = /* @__PURE__ */ make25(string2);
var Number6 = /* @__PURE__ */ make25(number2);
var Boolean3 = /* @__PURE__ */ make25(boolean);
function makeStruct(ast, fields) {
  return make25(ast, {
    fields,
    mapFields(f, options) {
      const fields2 = f(this.fields);
      return makeStruct(struct(fields2, options?.unsafePreserveChecks ? this.ast.checks : void 0), fields2);
    }
  });
}
function Struct(fields) {
  return makeStruct(struct(fields, void 0), fields);
}
function makeTuple(ast, elements) {
  return make25(ast, {
    elements,
    mapElements(f, options) {
      const elements2 = f(this.elements);
      return makeTuple(tuple(elements2, options?.unsafePreserveChecks ? this.ast.checks : void 0), elements2);
    }
  });
}
function Tuple(elements) {
  return makeTuple(tuple(elements), elements);
}
var ArraySchema = /* @__PURE__ */ lambda((schema) => make25(new Arrays(false, [], [schema.ast]), {
  value: schema
}));
function makeUnion(ast, members) {
  return make25(ast, {
    members,
    mapMembers(f, options) {
      const members2 = f(this.members);
      return makeUnion(union2(members2, this.ast.mode, options?.unsafePreserveChecks ? this.ast.checks : void 0), members2);
    }
  });
}
function Union2(members, options) {
  return makeUnion(union2(members, options?.mode ?? "anyOf", void 0), members);
}
function Literals(literals) {
  const members = literals.map(Literal2);
  return make25(union2(members, "anyOf", void 0), {
    literals,
    members,
    mapMembers(f) {
      return Union2(f(this.members));
    },
    pick(literals2) {
      return Literals(literals2);
    },
    transform(to) {
      return Union2(members.map((member, index) => member.transform(to[index])));
    }
  });
}
var UndefinedOr = /* @__PURE__ */ lambda((self) => Union2([self, Undefined2]));
function decodeTo2(to, transformation) {
  return (from) => {
    return make25(decodeTo(from.ast, to.ast, transformation ? make14(transformation) : passthrough3()), {
      from,
      to
    });
  };
}
function withConstructorDefault2(defaultValue) {
  return (schema) => make25(withConstructorDefault(schema.ast, defaultValue), {
    schema
  });
}
function tag(literal2) {
  return Literal2(literal2).pipe(withConstructorDefault2(succeed6(literal2)));
}
function TaggedStruct(value3, fields) {
  return Struct({
    _tag: tag(value3),
    ...fields
  });
}
function instanceOf(constructor, annotations) {
  return declare((u) => u instanceof constructor, annotations);
}
function link3() {
  return (encodeTo, transformation) => {
    return new Link(encodeTo.ast, make14(transformation));
  };
}
var makeFilter2 = makeFilter;
function isPattern2(regExp, annotations) {
  const source = regExp.source;
  const flags = regExp.flags;
  const runtimeRegExp = flags === "" ? `new RegExp(${format(source)})` : `new RegExp(${format(source)}, ${format(flags)})`;
  return isPattern(regExp, {
    toCode: () => ({
      runtime: `Schema.isPattern(${runtimeRegExp})`
    }),
    ...annotations
  });
}
function isBase64(annotations) {
  const regExp = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  return isPattern2(regExp, {
    expected: "a base64 encoded string",
    representation: {
      id: "effect/schema/isBase64",
      payload: null
    },
    toJsonSchema: () => ({
      pattern: regExp.source
    }),
    toCode: () => ({
      runtime: "Schema.isBase64()"
    }),
    ...annotations
  });
}
var Finite = /* @__PURE__ */ make25(finite);
function isInt(annotations) {
  return makeFilter2((n) => globalThis.Number.isSafeInteger(n), {
    expected: "an integer",
    representation: {
      id: "effect/schema/isInt",
      payload: null
    },
    toJsonSchema: () => ({
      type: "integer"
    }),
    toCode: () => ({
      runtime: "Schema.isInt()"
    }),
    arbitrary: {
      constraint: {
        integer: true
      }
    },
    ...annotations
  });
}
var Int = /* @__PURE__ */ Number6.check(/* @__PURE__ */ isInt());
var getErrorOptionsKey = (options) => (options?.includeStack === true ? 1 : 0) | (options?.excludeCause === true ? 2 : 0);
var getErrorOptions = (key) => {
  switch (key) {
    case 0:
      return void 0;
    case 1:
      return {
        includeStack: true
      };
    case 2:
      return {
        excludeCause: true
      };
    case 3:
      return {
        includeStack: true,
        excludeCause: true
      };
  }
};
var defectSchemaCache = [];
function Defect(options) {
  const key = getErrorOptionsKey(options);
  const cached3 = defectSchemaCache[key];
  if (cached3 !== void 0) {
    return cached3;
  }
  const schema = Json2.pipe(decodeTo2(Unknown2, defectFromJson(getErrorOptions(key))));
  defectSchemaCache[key] = schema;
  return schema;
}
var RegExp2 = /* @__PURE__ */ instanceOf(globalThis.RegExp, {
  representation: {
    id: "effect/schema/RegExp",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.RegExp`,
    Type: `globalThis.RegExp`
  }),
  expected: "RegExp",
  toCodecJson: () => link3()(Struct({
    source: String4,
    flags: String4
  }), transformOrFail2({
    decode: (e, options) => try_2({
      try: () => new globalThis.RegExp(e.source, e.flags),
      catch: () => new InvalidValue({
        expected: "valid RegExp source and flags"
      }, e, options)
    }),
    encode: (regExp) => succeed6({
      source: regExp.source,
      flags: regExp.flags
    })
  })),
  toArbitrary: () => (fc) => fc.tuple(fc.constantFrom(
    ".",
    ".*",
    "\\d+",
    "\\w+",
    "[a-z]+",
    "[A-Z]+",
    "[0-9]+",
    "^[a-zA-Z0-9]+$",
    "^\\d{4}-\\d{2}-\\d{2}$"
    // date pattern
  ), fc.uniqueArray(fc.constantFrom("g", "i", "m", "s", "u", "y"), {
    minLength: 0,
    maxLength: 6
  }).map((flags) => flags.join(""))).map(([source, flags]) => new globalThis.RegExp(source, flags)),
  toEquivalence: () => (a, b) => a.source === b.source && a.flags === b.flags
});
var URLString = /* @__PURE__ */ String4.annotate({
  expected: "a string that will be decoded as a URL"
});
var URL2 = /* @__PURE__ */ instanceOf(globalThis.URL, {
  representation: {
    id: "effect/schema/URL",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.URL`,
    Type: `globalThis.URL`
  }),
  expected: "URL",
  toCodecJson: () => link3()(URLString, urlFromString),
  toArbitrary: () => (fc) => fc.webUrl().map((s) => new globalThis.URL(s)),
  toEquivalence: () => (a, b) => a.toString() === b.toString()
});
function dateArbitraryConstraints(ordered, base, toDate) {
  const out = {
    ...base
  };
  if (ordered?.minimum !== void 0) {
    const minimum = toDate === void 0 ? ordered.minimum : toDate(ordered.minimum);
    const nextMin = ordered.exclusiveMinimum ? new globalThis.Date(minimum.getTime() + 1) : minimum;
    if (out.min === void 0 || nextMin.getTime() > out.min.getTime()) {
      out.min = nextMin;
    }
  }
  if (ordered?.maximum !== void 0) {
    const maximum = toDate === void 0 ? ordered.maximum : toDate(ordered.maximum);
    const nextMax = ordered.exclusiveMaximum ? new globalThis.Date(maximum.getTime() - 1) : maximum;
    if (out.max === void 0 || nextMax.getTime() < out.max.getTime()) {
      out.max = nextMax;
    }
  }
  return out;
}
var DateString = /* @__PURE__ */ String4.annotate({
  expected: "a string that will be decoded as a Date"
});
var Date4 = /* @__PURE__ */ declare((input) => input instanceof globalThis.Date && !globalThis.Number.isNaN(input.getTime()), {
  representation: {
    id: "effect/schema/Date",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.Date`,
    Type: `globalThis.Date`
  }),
  expected: "a valid Date",
  toCodecJson: () => link3()(DateString, dateFromString),
  toArbitrary: () => (fc, ctx) => fc.date(dateArbitraryConstraints(ctx?.constraint?.ordered?.order === Date2 ? ctx.constraint.ordered : void 0, {
    noInvalidDate: true
  }))
});
var File = /* @__PURE__ */ instanceOf(globalThis.File, {
  representation: {
    id: "effect/schema/File",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.File`,
    Type: `globalThis.File`
  }),
  expected: "File",
  toCodecJson: () => link3()(Struct({
    data: String4.check(isBase64()),
    type: String4,
    name: String4,
    lastModified: Int
  }), transformOrFail2({
    decode: (e, options) => match2(decodeBase64(e.data), {
      onFailure: () => fail6(new InvalidValue({
        expected: "a valid Base64 string"
      }, e.data, options)),
      onSuccess: (bytes) => {
        const buffer2 = new globalThis.Uint8Array(bytes);
        return succeed6(new globalThis.File([buffer2], e.name, {
          type: e.type,
          lastModified: e.lastModified
        }));
      }
    }),
    encode: (file4, options) => tryPromise2({
      try: async () => {
        const bytes = new globalThis.Uint8Array(await file4.arrayBuffer());
        return {
          data: encodeBase64(bytes),
          type: file4.type,
          name: file4.name,
          lastModified: file4.lastModified
        };
      },
      catch: () => new InvalidValue({
        expected: "a readable File"
      }, file4, options)
    })
  }))
});
var FormData2 = /* @__PURE__ */ instanceOf(globalThis.FormData, {
  representation: {
    id: "effect/schema/FormData",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.FormData`,
    Type: `globalThis.FormData`
  }),
  expected: "FormData",
  toCodecJson: () => link3()(ArraySchema(Tuple([String4, Union2([Struct({
    _tag: tag("String"),
    value: String4
  }), Struct({
    _tag: tag("File"),
    value: File
  })])])), transformOrFail2({
    decode: (e) => {
      const out = new globalThis.FormData();
      for (const [key, entry] of e) {
        out.append(key, entry.value);
      }
      return succeed6(out);
    },
    encode: (formData) => {
      return succeed6(globalThis.Array.from(formData.entries()).map(([key, value3]) => {
        if (typeof value3 === "string") {
          return [key, {
            _tag: "String",
            value: value3
          }];
        } else {
          return [key, {
            _tag: "File",
            value: value3
          }];
        }
      }));
    }
  }))
});
var URLSearchParams2 = /* @__PURE__ */ instanceOf(globalThis.URLSearchParams, {
  representation: {
    id: "effect/schema/URLSearchParams",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.URLSearchParams`,
    Type: `globalThis.URLSearchParams`
  }),
  expected: "URLSearchParams",
  toCodecJson: () => link3()(String4.annotate({
    expected: "a query string that will be decoded as URLSearchParams"
  }), transform2({
    decode: (e) => new globalThis.URLSearchParams(e),
    encode: (params) => params.toString()
  }))
});
var Base64String = /* @__PURE__ */ String4.annotate({
  expected: "a base64 encoded string that will be decoded as Uint8Array",
  format: "byte",
  contentEncoding: "base64"
});
var Uint8Array2 = /* @__PURE__ */ instanceOf(globalThis.Uint8Array, {
  representation: {
    id: "effect/schema/Uint8Array",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.Uint8Array`,
    Type: `globalThis.Uint8Array`
  }),
  expected: "Uint8Array",
  toCodecJson: () => link3()(Base64String, uint8ArrayFromBase64String),
  toArbitrary: () => (fc) => fc.uint8Array()
});
var immerable = /* @__PURE__ */ globalThis.Symbol.for("immer-draftable");
var payloadToken = {};
function makeClass(Inherited, identifier3, struct2, annotations, proto2) {
  const getClassSchema = getClassSchemaFactory(struct2, identifier3, annotations);
  const ClassTypeId = getClassTypeId(identifier3);
  const out = class extends Inherited {
    constructor(...[input, options]) {
      const internalOptions = options;
      const payload = internalOptions?.["~payload"];
      const value3 = payload?.token === payloadToken ? payload.value : struct2.make(input ?? {}, options);
      super(value3, {
        ...options,
        disableChecks: true,
        "~payload": {
          token: payloadToken,
          value: value3
        }
      });
    }
    static [TypeId31] = TypeId31;
    get [ClassTypeId]() {
      return ClassTypeId;
    }
    static [immerable] = true;
    static identifier = identifier3;
    static fields = struct2.fields;
    static get ast() {
      return getClassSchema(this).ast;
    }
    static pipe() {
      return pipeArguments(this, arguments);
    }
    static rebuild(ast) {
      return getClassSchema(this).rebuild(ast);
    }
    static make(input, options) {
      return new this(input, options);
    }
    static makeOption(input, options) {
      return makeOption(getClassSchema(this))(input ?? {}, options);
    }
    static makeEffect(input, options) {
      return getClassSchema(this).makeEffect(input ?? {}, options);
    }
    static annotate(annotations2) {
      return this.rebuild(annotate(this.ast, annotations2));
    }
    static annotateKey(annotations2) {
      return this.rebuild(annotateKey(this.ast, annotations2));
    }
    static check(...checks) {
      return this.rebuild(appendChecks(this.ast, checks));
    }
    static extend(identifier4) {
      return (schema, annotations2) => {
        const extension = isStruct(schema) ? schema : Struct(schema);
        const fields = {
          ...struct2.fields,
          ...extension.fields
        };
        const ast = struct(fields, struct2.ast.checks, {
          identifier: identifier4
        });
        return makeClass(this, identifier4, makeStruct(appendChecks(ast, extension.ast.checks), fields), annotations2, proto2);
      };
    }
    static mapFields(f, options) {
      return struct2.mapFields(f, options);
    }
  };
  if (proto2 !== void 0) {
    Object.assign(out.prototype, proto2(identifier3));
  }
  return out;
}
function getClassTransformation(self) {
  return new Transformation(transform((input) => new self(input, {
    "~payload": {
      token: payloadToken,
      value: input
    }
  })), passthrough2());
}
function getClassTypeId(identifier3) {
  return `~effect/Schema/Class/${identifier3}`;
}
function getClassSchemaFactory(from, identifier3, annotations) {
  let memo;
  return (self) => {
    if (memo !== void 0) {
      return memo;
    }
    const ClassTypeId = getClassTypeId(identifier3);
    const isClassValue = (input) => input instanceof self || hasProperty(input, ClassTypeId);
    const transformation = getClassTransformation(self);
    const to = make25(new Declaration([from.ast], () => (input, ast, options) => {
      return isClassValue(input) ? succeed6(input) : fail6(new InvalidType(ast, input, options));
    }, {
      identifier: identifier3,
      [CONSTRUCTOR_ANNOTATION_KEY]: ([from2]) => ({
        isConstructed: isClassValue,
        link: new Link(from2, transformation)
      }),
      toCodec: ([from2]) => new Link(from2.ast, transformation),
      toArbitrary: ([from2]) => () => ({
        arbitrary: from2.arbitrary.map((args2) => new self(args2)),
        terminal: from2.terminal?.map((args2) => new self(args2))
      }),
      toFormatter: ([from2]) => (t) => `${self.identifier}(${from2(t)})`,
      [SENTINELS_ANNOTATION_KEY]: collectSentinels(from.ast),
      ...annotations
    }));
    return memo = decodeTo2(to, transformation)(from);
  };
}
function isStruct(schema) {
  return isSchema(schema);
}
var Error4 = (identifier3) => (schema, annotations) => {
  const struct2 = isStruct(schema) ? schema : Struct(schema);
  const self = makeClass(Error2, identifier3, struct2, annotations, (identifier4) => ({
    name: identifier4
  }));
  return self;
};
var TaggedError3 = (identifier3) => {
  return (tagValue, schema, annotations) => {
    const struct2 = isStruct(schema) ? schema.mapFields((fields) => ({
      _tag: tag(tagValue),
      ...fields
    }), {
      unsafePreserveChecks: true
    }) : TaggedStruct(tagValue, schema);
    return Error4(identifier3 ?? tagValue)(struct2, annotations);
  };
};
function withoutConstructorDefault(context3) {
  return context3.constructorDefault === void 0 ? context3 : new Context(context3.isOptional, context3.isMutable, void 0, context3.annotations);
}
function validateCanonicalObjectPropertyNames(ast) {
  if (ast.propertySignatures.some((ps) => typeof ps.name !== "string")) {
    throw new globalThis.Error("Objects property names must be strings", {
      cause: ast
    });
  }
}
function makeReorder(getPriority) {
  return (types) => {
    const indexMap = /* @__PURE__ */ new Map();
    for (let i = 0; i < types.length; i++) {
      indexMap.set(toEncoded(types[i]), i);
    }
    const sortedTypes = [...types].sort((a, b) => {
      a = toEncoded(a);
      b = toEncoded(b);
      const pa = getPriority(a);
      const pb = getPriority(b);
      if (pa !== pb) return pa - pb;
      return indexMap.get(a) - indexMap.get(b);
    });
    const orderChanged = sortedTypes.some((ast, index) => ast !== types[index]);
    if (!orderChanged) return types;
    return sortedTypes;
  };
}
function toCodecStringTree(schema) {
  return make25(toCodecStringTreeAST(schema.ast), {
    schema
  });
}
var toStringTreeReorder = /* @__PURE__ */ makeReorder((ast) => {
  switch (ast._tag) {
    case "Null":
    case "Boolean":
    case "Number":
    case "BigInt":
    case "Symbol":
    case "UniqueSymbol":
      return 0;
    default:
      return 1;
  }
});
function toCodecStringTreeASTStep(ast, recur, onMissingAnnotation) {
  switch (ast._tag) {
    case "Declaration": {
      const typeParameters = ast.typeParameters.map((tp) => make25(recur(toEncoded(tp))));
      const getStringTreeLink = ast.annotations?.toCodecStringTree;
      if (isFunction(getStringTreeLink)) {
        const link5 = getStringTreeLink(typeParameters);
        if (link5 === void 0) return ast;
        return replaceEncoding(ast, [mapLink(link5, recur)]);
      }
      const getJsonLink = ast.annotations?.toCodecJson;
      const jsonLink = isFunction(getJsonLink) ? getJsonLink(typeParameters) : void 0;
      const getLink = jsonLink === void 0 ? ast.annotations?.toCodec : void 0;
      const link4 = jsonLink ?? (isFunction(getLink) ? getLink(typeParameters) : void 0);
      return link4 === void 0 ? onMissingAnnotation(ast) : replaceEncoding(ast, [mapLink(link4, recur)]);
    }
    case "Null":
      return replaceEncoding(ast, [nullToString]);
    case "Boolean":
      return replaceEncoding(ast, [booleanToString]);
    case "Unknown":
    case "ObjectKeyword":
      return replaceEncoding(ast, [unknownToStringTree]);
    case "Enum":
    case "Number":
    case "Literal":
    case "UniqueSymbol":
    case "Symbol":
    case "BigInt":
      return ast.toCodecStringTree();
    case "Objects": {
      validateCanonicalObjectPropertyNames(ast);
      return ast.recur(recur, parameterFromString);
    }
    case "Union": {
      const sortedTypes = toStringTreeReorder(ast.types);
      if (sortedTypes !== ast.types) {
        return new Union(sortedTypes, ast.mode, ast.annotations, ast.checks, ast.encoding, ast.context, ast.encodingChecks).recur(recur);
      }
      return ast.recur(recur);
    }
    case "Arrays":
    case "Suspend":
      return ast.recur(recur);
  }
  return ast;
}
var nullToString = /* @__PURE__ */ new Link(/* @__PURE__ */ new Literal("null"), /* @__PURE__ */ new Transformation(/* @__PURE__ */ transform(() => null), /* @__PURE__ */ transform(() => "null")));
var booleanToString = /* @__PURE__ */ new Link(/* @__PURE__ */ new Union([/* @__PURE__ */ new Literal("true"), /* @__PURE__ */ new Literal("false")], "anyOf"), /* @__PURE__ */ new Transformation(/* @__PURE__ */ transform((s) => s === "true"), /* @__PURE__ */ String2()));
var arrayFromSingleTransformation = /* @__PURE__ */ new Transformation(/* @__PURE__ */ transform((input) => typeof input === "string" ? [input] : input), /* @__PURE__ */ passthrough2());
var isCodecArrayFromSingleLink = (link4) => link4.transformation === arrayFromSingleTransformation;
var toCodecStringTreeAST = /* @__PURE__ */ applyToSelfOrLastLinkEncodingIdempotent((ast) => {
  const out = toCodecStringTreeASTStep(ast, toCodecStringTreeAST, (ast2) => {
    throw new globalThis.Error("Missing structural codec for StringTree", {
      cause: ast2
    });
  });
  if (out !== ast && ast.context !== void 0) {
    return replaceContextLastLink(out, withoutConstructorDefault(ast.context));
  }
  return out;
}, {
  stopAt: isCodecArrayFromSingleLink
});
var Json2 = /* @__PURE__ */ make25(/* @__PURE__ */ annotate(Json, {
  toCode: () => ({
    runtime: "Schema.Json",
    Type: "Schema.Json"
  })
}));

// node_modules/effect/dist/Terminal.js
var TypeId32 = "~effect/platform/Terminal";
var QuitErrorTypeId = "effect/platform/Terminal/QuitError";
var QuitError = class extends (/* @__PURE__ */ Error4("QuitError")({
  _tag: /* @__PURE__ */ tag("QuitError")
})) {
  /**
   * Marks this value as a terminal quit error for runtime guards.
   *
   * @since 4.0.0
   */
  [QuitErrorTypeId] = QuitErrorTypeId;
};
var isQuitError = (u) => hasProperty(u, QuitErrorTypeId);
var Terminal = /* @__PURE__ */ Service("effect/platform/Terminal");
var make26 = (impl) => Terminal.of({
  ...impl,
  [TypeId32]: TypeId32
});

// node_modules/@effect/platform-node-shared/dist/NodeTerminal.js
import * as readline from "node:readline";
var make27 = /* @__PURE__ */ fnUntraced2(function* (shouldQuit = defaultShouldQuit) {
  const stdin = process.stdin;
  const stdout = process.stdout;
  const lines2 = yield* make8();
  let inputEnded = stdin.readableEnded;
  let readlineActive = false;
  const onStdinEnd = () => {
    inputEnded = true;
    if (!readlineActive) {
      endUnsafe(lines2);
    }
  };
  stdin.once("end", onStdinEnd);
  yield* addFinalizer3(() => sync2(() => stdin.off("end", onStdinEnd)));
  const rlRef = yield* make12({
    acquire: acquireRelease2(sync2(() => {
      const rl = readline.createInterface({
        input: stdin,
        escapeCodeTimeout: 50
      });
      const onLine = (line) => offerUnsafe(lines2, line);
      const onClose = () => {
        readlineActive = false;
        endUnsafe(lines2);
      };
      readlineActive = true;
      readline.emitKeypressEvents(stdin, rl);
      rl.on("line", onLine);
      rl.once("close", onClose);
      if (stdin.isTTY) {
        stdin.setRawMode(true);
      }
      return {
        rl,
        onClose,
        onLine
      };
    }), ({
      rl,
      onClose,
      onLine
    }) => sync2(() => {
      readlineActive = false;
      rl.off("line", onLine);
      rl.off("close", onClose);
      if (stdin.isTTY) {
        stdin.setRawMode(false);
      }
      rl.close();
      if (inputEnded) {
        endUnsafe(lines2);
      }
    })),
    idleTimeToLive: "10 millis"
  });
  const columns = sync2(() => stdout.columns ?? 0);
  const rows = sync2(() => stdout.rows ?? 0);
  const readInput = gen2(function* () {
    const queue = yield* make8();
    const handleKeypress = (s, k) => {
      const userInput = {
        input: fromUndefinedOr(s),
        key: {
          name: k.name ?? "",
          ctrl: !!k.ctrl,
          meta: !!k.meta,
          shift: !!k.shift
        }
      };
      offerUnsafe(queue, userInput);
      if (shouldQuit(userInput)) {
        endUnsafe(queue);
      }
    };
    const keepAlive = setInterval(() => {
    }, 2147483647);
    const handleEnd = () => {
      clearInterval(keepAlive);
      endUnsafe(queue);
    };
    yield* addFinalizer3(() => sync2(() => {
      clearInterval(keepAlive);
      stdin.off("keypress", handleKeypress);
      stdin.off("end", handleEnd);
    }));
    stdin.on("keypress", handleKeypress);
    if (inputEnded) {
      handleEnd();
    } else {
      yield* get4(rlRef);
      stdin.once("end", handleEnd);
    }
    return queue;
  });
  const readLine = suspend2(() => poll(lines2).pipe(flatMap3(match({
    onNone: () => scoped2(andThen2(get4(rlRef), take2(lines2))),
    onSome: succeed6
  })), mapError2(() => new QuitError({}))));
  const display = (prompt) => uninterruptible2(callback2((resume) => {
    stdout.write(prompt, (err) => isNullish(err) ? resume(void_3) : resume(fail6(badArgument({
      module: "Terminal",
      method: "display",
      description: "Failed to write prompt to stdout",
      cause: err
    }))));
  }));
  return make26({
    columns,
    rows,
    readInput,
    readLine,
    display
  });
});
var layer10 = /* @__PURE__ */ effect(Terminal, /* @__PURE__ */ make27(defaultShouldQuit));
function defaultShouldQuit(input) {
  return input.key.ctrl && (input.key.name === "c" || input.key.name === "d");
}

// node_modules/@effect/platform-node/dist/NodeTerminal.js
var layer11 = layer10;

// node_modules/@effect/platform-node/dist/NodeServices.js
var layer12 = /* @__PURE__ */ provideMerge(layer, /* @__PURE__ */ mergeAll2(layer5, layer3, layer7, layer9, layer11));

// node_modules/effect/dist/Cache.js
var TypeId33 = "~effect/Cache";
var makeWith = (lookup2, options) => contextWith((context3) => {
  const self = Object.create(Proto5);
  self.lookup = (key) => updateContext(lookup2(key), (input) => merge(context3, input));
  self.map = make10();
  self.capacity = options.capacity;
  self.timeToLive = options.timeToLive ? (exit3, key) => fromInputUnsafe(options.timeToLive(exit3, key)) : defaultTimeToLive;
  return succeed3(self);
});
var make28 = (options) => makeWith(options.lookup, {
  ...options,
  timeToLive: options.timeToLive !== void 0 ? () => options.timeToLive : defaultTimeToLive
});
var Proto5 = {
  ...PipeInspectableProto,
  [TypeId33]: TypeId33,
  toJSON() {
    return {
      _id: "Cache",
      capacity: this.capacity,
      map: this.map
    };
  }
};
var defaultTimeToLive = (_, _key) => infinity;
var get5 = /* @__PURE__ */ dual(2, (self, key) => withFiber((fiber3) => {
  const oentry = get2(self.map, key);
  if (isSome2(oentry) && !hasExpired(oentry.value, fiber3)) {
    remove(self.map, key);
    set(self.map, key, oentry.value);
    return oentry.value.await();
  }
  const entry = new EntryImpl(fiber3, self.lookup(key));
  entry.fiber.addObserver((exit3) => {
    if (exitHasInterrupts(exit3)) {
      const current = get2(self.map, key);
      if (isSome2(current) && current.value === entry) {
        remove(self.map, key);
      }
      return;
    }
    const ttl = self.timeToLive(exit3, key);
    if (isFinite(ttl)) {
      entry.expiresAt = fiber3.getRef(ClockRef).currentTimeMillisUnsafe() + toMillis(ttl);
    } else if (isZero(ttl)) {
      remove(self.map, key);
    }
  });
  set(self.map, key, entry);
  if (Number.isFinite(self.capacity)) {
    checkCapacity(self);
  }
  return entry.await();
}));
var EntryImpl = class {
  expiresAt;
  awaiters;
  fiber;
  constructor(parent, valueEffect) {
    this.fiber = forkUnsafe(parent, valueEffect, true, true);
    this.awaiters = 0;
    this.expiresAt = void 0;
  }
  await() {
    const exit3 = this.fiber.pollUnsafe();
    if (exit3) return exit3;
    this.awaiters++;
    return onExit(fiberJoin(this.fiber), () => {
      this.awaiters--;
      if (this.awaiters > 0 || this.fiber.pollUnsafe()) return void_;
      return fiberInterrupt(this.fiber);
    });
  }
};
var hasExpired = (entry, fiber3) => {
  if (entry.expiresAt === void 0) {
    return false;
  }
  return fiber3.getRef(ClockRef).currentTimeMillisUnsafe() >= entry.expiresAt;
};
var checkCapacity = (self) => {
  let diff = size(self.map) - self.capacity;
  if (diff <= 0) return;
  for (const [key] of self.map) {
    remove(self.map, key);
    diff--;
    if (diff === 0) return;
  }
};

// node_modules/effect/dist/ConfigProvider.js
function makeValue(value3) {
  return {
    _tag: "Value",
    value: value3
  };
}
function makeRecord(keys, value3) {
  return {
    _tag: "Record",
    keys,
    value: value3
  };
}
function makeArray(length, value3) {
  return {
    _tag: "Array",
    length,
    value: value3
  };
}
var ConfigProvider = /* @__PURE__ */ Reference("effect/ConfigProvider", {
  defaultValue: () => fromEnv()
});
var Proto6 = {
  ...PipeInspectableProto,
  toJSON() {
    return {
      _id: "ConfigProvider"
    };
  }
};
var identityPath = (path5) => path5;
function makeProvider(load, mapInput2) {
  const self = Object.create(Proto6);
  self.load = load;
  self.mapInput = mapInput2;
  return self;
}
function makeSource(get6, transform4) {
  return makeProvider((path5) => get6(transform4(path5)), (f) => makeSource(get6, flow(transform4, f)));
}
function make29(get6) {
  return makeSource(get6, identityPath);
}
function emptyStringAsMissing(value3, preserveEmptyStrings) {
  return value3 === "" && !preserveEmptyStrings ? void 0 : value3;
}
function fromEnvRecord(env, options) {
  const preserveEmptyStrings = options?.preserveEmptyStrings === true;
  const trie = buildEnvTrie(env);
  return make29((path5) => succeed6(nodeAtEnv(trie, env, path5, preserveEmptyStrings)));
}
function fromEnv(options) {
  const env = options?.env ?? {
    ...globalThis.process?.env,
    ...import.meta?.env
  };
  return fromEnvRecord(env, {
    preserveEmptyStrings: options?.preserveEmptyStrings
  });
}
function buildEnvTrie(env) {
  const trie = {};
  for (const [name, value3] of Object.entries(env)) {
    if (value3 === void 0) continue;
    const segments = name.split("_");
    let node = trie;
    for (const seg of segments) {
      const children = node.children ??= /* @__PURE__ */ Object.create(null);
      node = children[seg] ??= {};
    }
  }
  return trie;
}
var NUMERIC_INDEX = /^(0|[1-9][0-9]*)$/;
function nodeAtEnv(trie, env, path5, preserveEmptyStrings) {
  const key = path5.map(String).join("_");
  const leafValue = emptyStringAsMissing(Object.hasOwn(env, key) ? env[key] : void 0, preserveEmptyStrings);
  const trieNode = trieNodeAt(trie, path5);
  const children = trieNode?.children ? Object.keys(trieNode.children) : [];
  if (children.length === 0) {
    return leafValue === void 0 ? void 0 : makeValue(leafValue);
  }
  const allNumeric = children.every((k) => NUMERIC_INDEX.test(k));
  if (allNumeric) {
    const length = Math.max(...children.map((k) => parseInt(k, 10))) + 1;
    return makeArray(length, leafValue);
  }
  return makeRecord(new Set(children), leafValue);
}
function trieNodeAt(root2, path5) {
  if (path5.length === 0) return root2;
  let node = root2;
  for (const seg of path5) {
    node = node?.children?.[String(seg)];
    if (!node) return void 0;
  }
  return node;
}

// node_modules/effect/dist/Config.js
var TypeId34 = "~effect/Config";
var Proto7 = {
  .../* @__PURE__ */ Prototype2({
    label: "Config",
    evaluate(fiber3) {
      return this.parse(fiber3.getRef(ConfigProvider));
    }
  }),
  [TypeId34]: TypeId34,
  toJSON() {
    return {
      _id: "Config"
    };
  }
};
function make30(evaluator) {
  const self = Object.create(Proto7);
  self.evaluator = evaluator;
  self.parse = (provider) => evaluator(provider, []).pipe(mapErrorEager2((failure) => failure.error), flatMapEager2((resolution) => resolution._tag === "Resolved" ? succeed6(resolution.value) : fail6(resolution.error)));
  return self;
}
var evaluateAt = (self, provider, pathPrefix) => self.evaluator(provider, pathPrefix);
var resolved = (value3, hasInput2) => ({
  _tag: "Resolved",
  value: value3,
  hasInput: hasInput2
});
var map9 = /* @__PURE__ */ dual(2, (self, f) => {
  return make30((provider, pathPrefix) => map6(evaluateAt(self, provider, pathPrefix), (resolution) => resolution._tag === "Resolved" ? resolved(f(resolution.value), resolution.hasInput) : resolution));
});
var withDefault2 = /* @__PURE__ */ dual(2, (self, defaultValue) => {
  return make30((provider, pathPrefix) => mapEager2(evaluateAt(self, provider, pathPrefix), (resolution) => resolution._tag === "Absent" ? resolved(defaultValue, false) : resolution));
});
var option3 = (self) => self.pipe(map9(some2), withDefault2(none2()));
var TrueValues = /* @__PURE__ */ Literals(["true", "yes", "on", "1", "y"]);
var FalseValues = /* @__PURE__ */ Literals(["false", "no", "off", "0", "n"]);
var Boolean4 = /* @__PURE__ */ Literals([...TrueValues.literals, ...FalseValues.literals]).pipe(/* @__PURE__ */ decodeTo2(Boolean3, /* @__PURE__ */ transform2({
  decode: (value3) => value3 === "true" || value3 === "yes" || value3 === "on" || value3 === "1" || value3 === "y",
  encode: (value3) => value3 ? "true" : "false"
})));

// node_modules/effect/dist/Console.js
var Console_exports = {};
__export(Console_exports, {
  Console: () => Console,
  assert: () => assert,
  clear: () => clear3,
  consoleWith: () => consoleWith,
  count: () => count,
  countReset: () => countReset,
  debug: () => debug,
  dir: () => dir,
  dirxml: () => dirxml,
  error: () => error,
  group: () => group,
  info: () => info,
  log: () => log2,
  table: () => table,
  time: () => time,
  timeLog: () => timeLog,
  trace: () => trace,
  warn: () => warn,
  withGroup: () => withGroup,
  withTime: () => withTime
});
var Console = ConsoleRef;
var consoleWith = (f) => withFiber((fiber3) => f(fiber3.getRef(Console)));
var assert = (condition, ...args2) => consoleWith((console2) => sync(() => {
  console2.assert(condition, ...args2);
}));
var clear3 = /* @__PURE__ */ consoleWith((console2) => sync(() => {
  console2.clear();
}));
var count = (label) => consoleWith((console2) => sync(() => {
  console2.count(label);
}));
var countReset = (label) => consoleWith((console2) => sync(() => {
  console2.countReset(label);
}));
var debug = (...args2) => consoleWith((console2) => sync(() => {
  console2.debug(...args2);
}));
var dir = (item, options) => consoleWith((console2) => sync(() => {
  console2.dir(item, options);
}));
var dirxml = (...args2) => consoleWith((console2) => sync(() => {
  console2.dirxml(...args2);
}));
var error = (...args2) => consoleWith((console2) => sync(() => {
  console2.error(...args2);
}));
var group = (options) => consoleWith((console2) => acquireRelease(sync(() => {
  if (options?.collapsed) {
    console2.groupCollapsed(options.label);
  } else {
    console2.group(options?.label);
  }
}), () => sync(() => {
  console2.groupEnd();
})));
var info = (...args2) => consoleWith((console2) => sync(() => {
  console2.info(...args2);
}));
var log2 = (...args2) => consoleWith((console2) => sync(() => {
  console2.log(...args2);
}));
var table = (tabularData, properties) => consoleWith((console2) => sync(() => {
  console2.table(tabularData, properties);
}));
var time = (label) => consoleWith((console2) => acquireRelease(sync(() => {
  console2.time(label);
}), () => sync(() => {
  console2.timeEnd(label);
})));
var timeLog = (label, ...args2) => consoleWith((console2) => sync(() => {
  console2.timeLog(label, ...args2);
}));
var trace = (...args2) => consoleWith((console2) => sync(() => {
  console2.trace(...args2);
}));
var warn = (...args2) => consoleWith((console2) => sync(() => {
  console2.warn(...args2);
}));
var withGroup = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, options) => consoleWith((console2) => acquireUseRelease(sync(() => {
  if (options?.collapsed) {
    console2.groupCollapsed(options.label);
  } else {
    console2.group(options?.label);
  }
}), () => self, () => sync(() => {
  console2.groupEnd();
}))));
var withTime = /* @__PURE__ */ dual((args2) => isEffect(args2[0]), (self, label) => consoleWith((console2) => acquireUseRelease(sync(() => {
  console2.time(label);
}), () => self, () => sync(() => {
  console2.timeEnd(label);
}))));

// node_modules/effect/dist/unstable/reactivity/Reactivity.js
var Reactivity = class extends (/* @__PURE__ */ Service()("effect/reactivity/Reactivity")) {
};
var make31 = /* @__PURE__ */ sync2(() => {
  const handlers = /* @__PURE__ */ new Map();
  const invalidateUnsafe = (keys) => {
    keysToHashes(keys, (hash2) => {
      const set2 = handlers.get(hash2);
      if (set2 === void 0) return;
      set2.forEach((run6) => run6());
    });
  };
  const invalidate2 = (keys) => contextWith2((services) => {
    const pending = getOrUndefined2(services, PendingInvalidation);
    if (pending) {
      keysToHashes(keys, (hash2) => {
        pending.add(hash2);
      });
    } else {
      invalidateUnsafe(keys);
    }
    return void_3;
  });
  const mutation = (keys, effect2) => tap2(effect2, invalidate2(keys));
  const registerUnsafe = (keys, handler) => {
    const resolvedKeys = [];
    keysToHashes(keys, (hash2) => {
      resolvedKeys.push(hash2);
      let set2 = handlers.get(hash2);
      if (set2 === void 0) {
        set2 = /* @__PURE__ */ new Set();
        handlers.set(hash2, set2);
      }
      set2.add(handler);
    });
    return () => {
      for (let i = 0; i < resolvedKeys.length; i++) {
        const set2 = handlers.get(resolvedKeys[i]);
        set2.delete(handler);
        if (set2.size === 0) {
          handlers.delete(resolvedKeys[i]);
        }
      }
    };
  };
  const query = (keys, effect2) => gen2(function* () {
    const services = yield* context2();
    const scope3 = get(services, Scope);
    const results = yield* make8();
    const runFork3 = flow(runForkWith2(services), runIn(scope3));
    let running = false;
    let pending = false;
    const handleExit = (exit3) => {
      if (exit3._tag === "Failure") {
        failCauseUnsafe(results, exit3.cause);
      } else {
        offerUnsafe(results, exit3.value);
      }
      if (pending) {
        pending = false;
        runFork3(effect2).addObserver(handleExit);
      } else {
        running = false;
      }
    };
    function run6() {
      if (running) {
        pending = true;
        return;
      }
      running = true;
      runFork3(effect2).addObserver(handleExit);
    }
    const cancel = registerUnsafe(keys, run6);
    yield* addFinalizer2(scope3, sync2(cancel));
    run6();
    return results;
  });
  const stream = (tables, effect2) => query(tables, effect2).pipe(map6(fromQueue), unwrap3);
  const withBatch = (effect2) => suspend2(() => {
    const pending = /* @__PURE__ */ new Set();
    return effect2.pipe(provideService2(PendingInvalidation, pending), onExit2((_) => sync2(() => {
      pending.forEach((hash2) => {
        const set2 = handlers.get(hash2);
        if (set2 === void 0) return;
        set2.forEach((run6) => run6());
      });
    })));
  });
  return Reactivity.of({
    mutation,
    query,
    stream,
    invalidateUnsafe,
    invalidate: invalidate2,
    registerUnsafe,
    withBatch
  });
});
var PendingInvalidation = class extends (/* @__PURE__ */ Service()("effect/reactivity/Reactivity/PendingInvalidation")) {
};
var layer13 = /* @__PURE__ */ effect(Reactivity)(make31);
function stringOrHash(u) {
  switch (typeof u) {
    case "string":
    case "number":
    case "bigint":
    case "boolean":
      return String(u);
    default:
      return hash(u);
  }
}
var keysToHashes = (keys, f) => {
  if (Array.isArray(keys)) {
    for (let i = 0; i < keys.length; i++) {
      f(stringOrHash(keys[i]));
    }
    return;
  }
  for (const key in keys) {
    f(key);
    const ids = keys[key];
    for (let i = 0; i < ids.length; i++) {
      f(`${key}:${stringOrHash(ids[i])}`);
    }
  }
};

// node_modules/effect/dist/unstable/sql/Statement.js
var FragmentTypeId = "~effect/sql/Fragment";
var fragment = (segments) => ({
  [FragmentTypeId]: FragmentTypeId,
  segments
});
var CurrentTransformer = /* @__PURE__ */ Reference("effect/sql/CurrentTransformer", {
  defaultValue: constUndefined
});
var isFragment = (u) => hasProperty(u, FragmentTypeId);
var literal = (value3, params) => ({
  _tag: "Literal",
  value: value3,
  params
});
var identifier2 = (value3) => ({
  _tag: "Identifier",
  value: value3
});
var parameter = (value3) => ({
  _tag: "Parameter",
  value: value3
});
var arrayHelper = (value3) => ({
  _tag: "ArrayHelper",
  value: value3
});
var RecordInsertHelperProto = {
  _tag: "RecordInsertHelper",
  returning(sql) {
    const self = Object.create(Object.getPrototypeOf(this));
    Object.assign(self, this, {
      returningIdentifier: sql
    });
    return self;
  }
};
var recordInsertHelper = (value3) => Object.assign(Object.create(RecordInsertHelperProto), {
  value: value3,
  returningIdentifier: void 0
});
var RecordUpdateHelperProto = {
  ...RecordInsertHelperProto,
  _tag: "RecordUpdateHelper"
};
var recordUpdateHelper = (value3, alias) => Object.assign(Object.create(RecordUpdateHelperProto), {
  value: value3,
  alias,
  returningIdentifier: void 0
});
var RecordUpdateHelperSingleProto = {
  ...RecordInsertHelperProto,
  _tag: "RecordUpdateHelperSingle"
};
var recordUpdateHelperSingle = (value3, omit2) => Object.assign(Object.create(RecordUpdateHelperSingleProto), {
  value: value3,
  omit: omit2,
  returningIdentifier: void 0
});
var make32 = (acquirer, compiler, spanAttributes, transformRows) => {
  const cache = transformRows === void 0 ? constructorCache.noTransforms : constructorCache.transforms;
  if (cache.has(acquirer)) {
    return cache.get(acquirer);
  }
  const self = Object.assign(function sql(strings, ...args2) {
    if (typeof strings === "string") {
      return identifier2(strings);
    } else if (Array.isArray(strings) && "raw" in strings) {
      return statement(acquirer, compiler, strings, args2, spanAttributes, transformRows);
    }
    throw "absurd";
  }, {
    unsafe(sql, params) {
      return makeUnsafe6([literal(sql, params)], acquirer, compiler, spanAttributes, transformRows);
    },
    literal(sql) {
      return fragment([literal(sql)]);
    },
    in: in_,
    insert(value3) {
      return recordInsertHelper(Array.isArray(value3) ? value3 : [value3]);
    },
    update(value3, omit2) {
      return recordUpdateHelperSingle(value3, omit2 ?? []);
    },
    updateValues(value3, alias) {
      return recordUpdateHelper(value3, alias);
    },
    and,
    or,
    csv,
    join: join2,
    onDialect(options) {
      return options[compiler.dialect]();
    },
    onDialectOrElse(options) {
      return options[compiler.dialect] !== void 0 ? options[compiler.dialect]() : options.orElse();
    }
  });
  cache.set(acquirer, self);
  return self;
};
var constructorCache = {
  transforms: /* @__PURE__ */ new WeakMap(),
  noTransforms: /* @__PURE__ */ new WeakMap()
};
var statement = (acquirer, compiler, strings, args2, spanAttributes, transformRows) => {
  const segments = strings[0].length > 0 ? [literal(strings[0])] : [];
  for (let i = 0; i < args2.length; i++) {
    const arg = args2[i];
    if (isFragment(arg)) {
      segments.push(...arg.segments);
    } else if (isSegment(arg)) {
      segments.push(arg);
    } else {
      segments.push(parameter(arg));
    }
    if (strings[i + 1].length > 0) {
      segments.push(literal(strings[i + 1]));
    }
  }
  return makeUnsafe6(segments, acquirer, compiler, spanAttributes, transformRows);
};
function join2(lit, addParens = true, fallback = "") {
  const literalStatement = literal(lit);
  const fallbackFragment = fragment([literal(fallback)]);
  return (clauses) => {
    if (clauses.length === 0) {
      return fallbackFragment;
    } else if (clauses.length === 1) {
      return fragment(convertLiteralOrFragment(clauses[0]));
    }
    const segments = [];
    if (addParens) {
      segments.push(literal("("));
    }
    segments.push.apply(segments, convertLiteralOrFragment(clauses[0]));
    for (let i = 1; i < clauses.length; i++) {
      segments.push(literalStatement);
      segments.push.apply(segments, convertLiteralOrFragment(clauses[i]));
    }
    if (addParens) {
      segments.push(literal(")"));
    }
    return fragment(segments);
  };
}
var and = /* @__PURE__ */ join2(" AND ", true, "1=1");
var or = /* @__PURE__ */ join2(" OR ", true, "1=1");
var csv = function(...args2) {
  if (args2[args2.length - 1].length === 0) {
    return emptyFragment;
  }
  if (args2.length === 1) {
    return csvRaw(args2[0]);
  }
  return fragment([literal(`${args2[0]} `), ...csvRaw(args2[1]).segments]);
};
var csvRaw = /* @__PURE__ */ join2(",", false);
var emptyFragment = /* @__PURE__ */ fragment([/* @__PURE__ */ literal("")]);
var makeCompiler = (options) => {
  const self = Object.create(CompilerProto);
  self.options = options;
  self.dialect = options.dialect;
  self.disableTransforms = false;
  self.statementCache = /* @__PURE__ */ new WeakMap();
  self.statementCacheNoTransform = /* @__PURE__ */ new WeakMap();
  return self;
};
var CompilerProto = {
  compile(statement2, withoutTransform = false, placeholderOverride) {
    const opts = this.options;
    withoutTransform = withoutTransform || this.disableTransforms;
    const cache = withoutTransform ? this.statementCacheNoTransform : this.statementCache;
    const cached3 = cache.get(statement2);
    if (cached3 !== void 0) {
      return cached3;
    }
    const segments = statement2.segments;
    const len = segments.length;
    let sql = "";
    const binds = [];
    let placeholderCount = 0;
    const placeholder = placeholderOverride ?? ((u) => opts.placeholder(++placeholderCount, u));
    const placeholderNoIncrement = (u) => opts.placeholder(placeholderCount, u);
    const placeholders = makePlaceholdersArray(placeholder);
    for (let i = 0; i < len; i++) {
      const segment = segments[i];
      switch (segment._tag) {
        case "Literal": {
          sql += segment.value;
          if (segment.params) {
            binds.push.apply(binds, segment.params);
          }
          break;
        }
        case "Identifier": {
          sql += opts.onIdentifier(segment.value, withoutTransform);
          break;
        }
        case "Parameter": {
          sql += placeholder(segment.value);
          binds.push(segment.value);
          break;
        }
        case "ArrayHelper": {
          sql += `(${placeholders(segment.value)})`;
          binds.push.apply(binds, segment.value);
          break;
        }
        case "RecordInsertHelper": {
          const keys = Object.keys(segment.value[0]);
          if (opts.onInsert) {
            const values = new Array(segment.value.length);
            let placeholders2 = "";
            for (let i2 = 0; i2 < segment.value.length; i2++) {
              const row = new Array(keys.length);
              values[i2] = row;
              placeholders2 += i2 === 0 ? "(" : ",(";
              for (let j = 0; j < keys.length; j++) {
                const key = keys[j];
                const value3 = segment.value[i2][key];
                const primitive = extractPrimitive(value3, opts.onCustom, placeholderNoIncrement, withoutTransform);
                row[j] = primitive;
                placeholders2 += j === 0 ? placeholder(value3) : `,${placeholder(value3)}`;
              }
              placeholders2 += ")";
            }
            const [s, b] = opts.onInsert(keys.map((_) => opts.onIdentifier(_, withoutTransform)), placeholders2, values, typeof segment.returningIdentifier === "string" ? [segment.returningIdentifier, []] : segment.returningIdentifier ? this.compile(segment.returningIdentifier, withoutTransform, placeholder) : void 0);
            sql += s;
            binds.push.apply(binds, b);
          } else {
            let placeholders2 = "";
            for (let i2 = 0; i2 < segment.value.length; i2++) {
              placeholders2 += i2 === 0 ? "(" : ",(";
              for (let j = 0; j < keys.length; j++) {
                const value3 = segment.value[i2][keys[j]];
                const primitive = extractPrimitive(value3, opts.onCustom, placeholderNoIncrement, withoutTransform);
                binds.push(primitive);
                placeholders2 += j === 0 ? placeholder(value3) : `,${placeholder(value3)}`;
              }
              placeholders2 += ")";
            }
            sql += `${generateColumns(keys, opts.onIdentifier, withoutTransform)} VALUES ${placeholders2}`;
            if (typeof segment.returningIdentifier === "string") {
              sql += ` RETURNING ${segment.returningIdentifier}`;
            } else if (segment.returningIdentifier) {
              sql += " RETURNING ";
              const [s, b] = this.compile(segment.returningIdentifier, withoutTransform, placeholder);
              sql += s;
              binds.push.apply(binds, b);
            }
          }
          break;
        }
        case "RecordUpdateHelperSingle": {
          let keys = Object.keys(segment.value);
          if (segment.omit.length > 0) {
            keys = keys.filter((key) => !segment.omit.includes(key));
          }
          if (opts.onRecordUpdateSingle) {
            const [s, b] = opts.onRecordUpdateSingle(keys.map((_) => opts.onIdentifier(_, withoutTransform)), keys.map((key) => extractPrimitive(segment.value[key], opts.onCustom, placeholderNoIncrement, withoutTransform)), typeof segment.returningIdentifier === "string" ? [segment.returningIdentifier, []] : segment.returningIdentifier ? this.compile(segment.returningIdentifier, withoutTransform, placeholder) : void 0);
            sql += s;
            binds.push.apply(binds, b);
          } else {
            for (let i2 = 0, len2 = keys.length; i2 < len2; i2++) {
              const column = opts.onIdentifier(keys[i2], withoutTransform);
              if (i2 === 0) {
                sql += `${column} = ${placeholder(segment.value[keys[i2]])}`;
              } else {
                sql += `, ${column} = ${placeholder(segment.value[keys[i2]])}`;
              }
              binds.push(extractPrimitive(segment.value[keys[i2]], opts.onCustom, placeholderNoIncrement, withoutTransform));
            }
            if (typeof segment.returningIdentifier === "string") {
              if (this.dialect === "mssql") {
                sql += ` OUTPUT ${segment.returningIdentifier === "*" ? "INSERTED.*" : segment.returningIdentifier}`;
              } else {
                sql += ` RETURNING ${segment.returningIdentifier}`;
              }
            } else if (segment.returningIdentifier) {
              sql += this.dialect === "mssql" ? " OUTPUT " : " RETURNING ";
              const [s, b] = this.compile(segment.returningIdentifier, withoutTransform, placeholder);
              sql += s;
              binds.push.apply(binds, b);
            }
          }
          break;
        }
        case "RecordUpdateHelper": {
          const keys = Object.keys(segment.value[0]);
          const values = new Array(segment.value.length);
          let placeholders2 = "";
          for (let i2 = 0; i2 < segment.value.length; i2++) {
            const row = new Array(keys.length);
            values[i2] = row;
            placeholders2 += i2 === 0 ? "(" : ",(";
            for (let j = 0; j < keys.length; j++) {
              const key = keys[j];
              const value3 = segment.value[i2][key];
              row[j] = extractPrimitive(value3, opts.onCustom, placeholderNoIncrement, withoutTransform);
              placeholders2 += j === 0 ? placeholder(value3) : `,${placeholder(value3)}`;
            }
            placeholders2 += ")";
          }
          const [s, b] = opts.onRecordUpdate(placeholders2, segment.alias, generateColumns(keys, opts.onIdentifier, withoutTransform), values, typeof segment.returningIdentifier === "string" ? [segment.returningIdentifier, []] : segment.returningIdentifier ? this.compile(segment.returningIdentifier, withoutTransform, placeholder) : void 0);
          sql += s;
          binds.push.apply(binds, b);
          break;
        }
        case "Custom": {
          const [s, b] = opts.onCustom(segment, placeholder, withoutTransform);
          sql += s;
          binds.push.apply(binds, b);
          break;
        }
      }
    }
    const result3 = [sql, binds];
    if (placeholderOverride !== void 0) {
      return result3;
    }
    cache.set(statement2, result3);
    return result3;
  },
  get withoutTransform() {
    const self = Object.create(CompilerProto);
    Object.assign(self, this, {
      disableTransforms: true
    });
    return self;
  }
};
var makeCompilerSqlite = (transform4) => makeCompiler({
  dialect: "sqlite",
  placeholder(_) {
    return "?";
  },
  onIdentifier: transform4 ? function(value3, withoutTransform) {
    return withoutTransform ? escapeSqlite(value3) : escapeSqlite(transform4(value3));
  } : escapeSqlite,
  onRecordUpdate() {
    return ["", []];
  },
  onCustom() {
    return ["", []];
  }
});
function defaultEscape(c) {
  const re = new RegExp(c, "g");
  const double = c + c;
  const dot = c + "." + c;
  return function(str) {
    return c + str.replace(re, double).replace(/\./g, dot) + c;
  };
}
var defaultTransforms = (transformer, nested = true) => {
  const transformValue = (value3) => {
    if (Array.isArray(value3)) {
      if (value3.length === 0 || value3[0].constructor !== Object) {
        return value3;
      }
      return array2(value3);
    } else if (value3?.constructor === Object) {
      return transformObject(value3);
    }
    return value3;
  };
  const transformObject = (obj) => {
    const newObj = {};
    for (const key of Object.keys(obj)) {
      assignProperty(newObj, transformer(key), transformValue(obj[key]));
    }
    return newObj;
  };
  const transformArrayNested = (rows) => {
    const newRows = new Array(rows.length);
    for (let i = 0, len = rows.length; i < len; i++) {
      const row = rows[i];
      if (Array.isArray(row)) {
        newRows[i] = transformArrayNested(row);
      } else {
        const obj = {};
        for (const [key, value3] of Object.entries(row)) {
          assignProperty(obj, transformer(key), transformValue(value3));
        }
        newRows[i] = obj;
      }
    }
    return newRows;
  };
  const transformArray = (rows) => {
    const newRows = new Array(rows.length);
    for (let i = 0, len = rows.length; i < len; i++) {
      const row = rows[i];
      if (Array.isArray(row)) {
        newRows[i] = transformArray(row);
      } else {
        const obj = {};
        for (const [key, value3] of Object.entries(row)) {
          assignProperty(obj, transformer(key), value3);
        }
        newRows[i] = obj;
      }
    }
    return newRows;
  };
  const array2 = nested ? transformArrayNested : transformArray;
  return {
    value: transformValue,
    object: transformObject,
    array: array2
  };
};
var ATTR_DB_OPERATION_NAME = "db.operation.name";
var ATTR_DB_QUERY_TEXT = "db.query.text";
var makeUnsafe6 = (segments, acquirer, compiler, spanAttributes, transformRows) => {
  const self = Object.create(StatementProto);
  self.segments = segments;
  self.acquirer = acquirer;
  self.compiler = compiler;
  self.spanAttributes = spanAttributes;
  self.transformRows = transformRows;
  return self;
};
var StatementProto = {
  [FragmentTypeId]: FragmentTypeId,
  withConnection(operation, f, withoutTransform = false) {
    return useSpan2("sql.execute", {
      kind: "client"
    }, (span) => this.withConnectionSpan(operation, f, withoutTransform, span));
  },
  withConnectionSpan(operation, f, withoutTransform, span) {
    return withStatement(this, span, (statement2) => {
      const [sql, params] = statement2.compile(withoutTransform);
      for (const [key, value3] of this.spanAttributes) {
        span.attribute(key, value3);
      }
      span.attribute(ATTR_DB_OPERATION_NAME, operation);
      span.attribute(ATTR_DB_QUERY_TEXT, sql);
      return scoped2(flatMap3(this.acquirer, (_) => f(_, sql, params)));
    });
  },
  get withoutTransform() {
    return this.withConnection("executeWithoutTransform", (connection, sql, params) => connection.execute(sql, params, void 0), true);
  },
  get raw() {
    return this.withConnection("executeRaw", (connection, sql, params) => connection.executeRaw(sql, params), true);
  },
  get stream() {
    const self = this;
    return unwrap3(flatMap3(makeSpanScoped2("sql.execute", {
      kind: "client"
    }), (span) => withStatement(self, span, (statement2) => {
      const [sql, params] = statement2.compile();
      for (const [key, value3] of self.spanAttributes) {
        span.attribute(key, value3);
      }
      span.attribute(ATTR_DB_OPERATION_NAME, "executeStream");
      span.attribute(ATTR_DB_QUERY_TEXT, sql);
      return map6(self.acquirer, (_) => _.executeStream(sql, params, self.transformRows));
    })));
  },
  get values() {
    return this.withConnection("executeValues", (connection, sql, params) => connection.executeValues(sql, params));
  },
  get valuesUnprepared() {
    return this.withConnection("executeValuesUnprepared", (connection, sql, params) => connection.executeValuesUnprepared(sql, params));
  },
  get unprepared() {
    const self = this;
    return self.withConnection("executeUnprepared", (connection, sql, params) => connection.executeUnprepared(sql, params, self.transformRows));
  },
  .../* @__PURE__ */ Prototype2({
    label: "Statement",
    evaluate(fiber3) {
      const span = makeSpanUnsafe(fiber3, "sql.execute", {
        kind: "client"
      });
      const clock = fiber3.getRef(Clock);
      const timingEnabled = fiber3.getRef(TracerTimingEnabled2);
      return onExit2(this.withConnectionSpan("execute", (connection, sql, params) => connection.execute(sql, params, this.transformRows), false, span), (exit3) => endSpan(span, exit3, clock, timingEnabled));
    }
  }),
  compile(withoutTransform) {
    return this.compiler.compile(this, withoutTransform ?? false);
  },
  toJSON() {
    const [sql, params] = this.compile();
    return {
      _id: "Statement",
      segments: this.segments,
      sql,
      params
    };
  }
};
var withStatement = (self, span, f) => withFiber2((fiber3) => {
  const transform4 = fiber3.getRef(CurrentTransformer);
  if (transform4 === void 0) {
    return f(self);
  }
  return flatMap3(transform4(self, make32(self.acquirer, self.compiler, self.spanAttributes, self.transformRows), fiber3, span), f);
});
var isSegment = (u) => {
  if (!hasProperty(u, "_tag")) {
    return false;
  }
  switch (u._tag) {
    case "Literal":
    case "Parameter":
    case "ArrayHelper":
    case "RecordInsertHelper":
    case "RecordUpdateHelper":
    case "RecordUpdateHelperSingle":
    case "Identifier":
    case "Custom":
      return true;
    default:
      return false;
  }
};
function convertLiteralOrFragment(clause) {
  if (typeof clause === "string") {
    return [literal(clause)];
  }
  return clause.segments;
}
var makePlaceholdersArray = (evaluate2) => (values) => {
  if (values.length === 0) {
    return "";
  }
  let result3 = evaluate2(values[0]);
  for (let i = 1; i < values.length; i++) {
    result3 += `,${evaluate2(values[i])}`;
  }
  return result3;
};
var generateColumns = (keys, escape, withoutTransform) => {
  if (keys.length === 0) {
    return "()";
  }
  let str = `(${escape(keys[0], withoutTransform)}`;
  for (let i = 1; i < keys.length; i++) {
    str += `,${escape(keys[i], withoutTransform)}`;
  }
  return str + ")";
};
var extractPrimitive = (value3, onCustom, placeholder, withoutTransform) => {
  if (value3 === void 0) {
    return null;
  } else if (isFragment(value3)) {
    const head3 = value3.segments[0];
    if (head3._tag === "Custom") {
      const compiled = onCustom(head3, placeholder, withoutTransform);
      return compiled[1][0] ?? null;
    } else if (head3._tag === "Parameter") {
      return head3.value;
    }
    return null;
  }
  return value3;
};
var escapeSqlite = /* @__PURE__ */ defaultEscape('"');
function in_() {
  if (arguments.length === 1) {
    return arrayHelper(arguments[0]);
  }
  const column = arguments[0];
  const values = arguments[1];
  return values.length === 0 ? neverFragment : fragment([identifier2(column), literal(" IN "), arrayHelper(values)]);
}
var neverFragment = /* @__PURE__ */ fragment([/* @__PURE__ */ literal("1=0")]);

// node_modules/effect/dist/unstable/sql/SqlClient.js
var TypeId35 = "~effect/sql/SqlClient";
var SqlClient = /* @__PURE__ */ Service("effect/sql/SqlClient");
var clientIdCounter = 0;
var transactionSemaphoreIdCounter = 0;
var make33 = /* @__PURE__ */ fnUntraced2(function* (options) {
  const transactionService = options.transactionService ?? TransactionConnection(clientIdCounter++);
  const getConnection = flatMap3(serviceOption2(transactionService), match({
    onNone: () => options.acquirer,
    onSome: ([conn]) => succeed6(conn)
  }));
  const beginTransaction = options.beginTransaction ?? "BEGIN";
  const commit = options.commit ?? "COMMIT";
  const savepoint = options.savepoint ?? ((name) => `SAVEPOINT ${name}`);
  const rollback = options.rollback ?? "ROLLBACK";
  const rollbackSavepoint = options.rollbackSavepoint ?? ((name) => `ROLLBACK TO SAVEPOINT ${name}`);
  const transactionAcquirer = options.transactionAcquirer ?? options.acquirer;
  const withTransaction = makeWithTransaction({
    transactionService,
    spanAttributes: options.spanAttributes,
    acquireConnection: flatMap3(make5(), (scope3) => map6(provide(transactionAcquirer, scope3), (conn) => [scope3, conn])),
    begin: (conn) => conn.executeUnprepared(beginTransaction, [], void 0),
    savepoint: (conn, id) => conn.executeUnprepared(savepoint(`effect_sql_${id}`), [], void 0),
    commit: (conn) => conn.executeUnprepared(commit, [], void 0),
    rollback: (conn) => conn.executeUnprepared(rollback, [], void 0),
    rollbackSavepoint: (conn, id) => conn.executeUnprepared(rollbackSavepoint(`effect_sql_${id}`), [], void 0)
  });
  const reactivity = yield* Reactivity;
  const client = Object.assign(make32(getConnection, options.compiler, options.spanAttributes, options.transformRows), {
    [TypeId35]: TypeId35,
    safe: void 0,
    withTransaction,
    transactionService,
    reserve: transactionAcquirer,
    withoutTransforms() {
      if (options.transformRows === void 0) {
        return this;
      }
      const statement2 = make32(getConnection, options.compiler.withoutTransform, options.spanAttributes, void 0);
      const client2 = Object.assign(statement2, {
        ...this,
        ...statement2
      });
      client2.safe = client2;
      client2.withoutTransforms = () => client2;
      return client2;
    },
    reactive: options.reactiveQueue ? (keys, effect2) => options.reactiveQueue(keys, effect2).pipe(map6(fromQueue), unwrap3) : reactivity.stream,
    reactiveMailbox: options.reactiveQueue ?? reactivity.query
  });
  client.safe = client;
  return client;
});
var makeWithTransaction = (options) => {
  const transactionSemaphore = Service(`effect/sql/SqlClient/TransactionSemaphore/${transactionSemaphoreIdCounter++}`);
  return (effect2) => uninterruptibleMask2((restore) => useSpan2("sql.transaction", {
    kind: "client"
  }, (span) => withFiber2((fiber3) => {
    for (const [key, value3] of options.spanAttributes) {
      span.attribute(key, value3);
    }
    const services = fiber3.context;
    const clock = fiber3.getRef(Clock);
    const connOption = getOption(services, options.transactionService);
    const conn = connOption._tag === "Some" ? succeed6([void 0, connOption.value[0]]) : options.acquireConnection;
    const id = connOption._tag === "Some" ? connOption.value[1] + 1 : 0;
    const transaction = flatMap3(conn, ([scope3, conn2]) => (id === 0 ? options.begin(conn2) : options.savepoint(conn2, id)).pipe(flatMap3(() => onExitPrimitive2(provideContext2(restore(effect2), services.pipe(add(options.transactionService, [conn2, id]), add(transactionSemaphore, makeUnsafe5(1)), add(ParentSpan, span))), (exit3) => {
      let effect3;
      if (isSuccess4(exit3)) {
        if (id === 0) {
          span.event("db.transaction.commit", clock.currentTimeNanosUnsafe());
          effect3 = orDie2(options.commit(conn2));
        } else {
          span.event("db.transaction.savepoint", clock.currentTimeNanosUnsafe());
          effect3 = void_3;
        }
      } else {
        span.event("db.transaction.rollback", clock.currentTimeNanosUnsafe());
        effect3 = orDie2(id > 0 ? options.rollbackSavepoint(conn2, id) : options.rollback(conn2));
      }
      return flatMap3(effect3, () => exit3);
    }, true)), scope3 ? (eff) => onExitPrimitive2(eff, (exit3) => close(scope3, exit3), true) : identity));
    return id === 0 ? transaction : getUnsafe(services, transactionSemaphore).withPermit(transaction);
  })));
};
var TransactionConnection = (clientId) => Service(`effect/sql/SqlClient/TransactionConnection/${clientId}`);
var SafeIntegers = /* @__PURE__ */ Reference("effect/sql/SqlClient/SafeIntegers", {
  defaultValue: () => false
});

// node_modules/effect/dist/unstable/cli/Argument.js
var Argument_exports = {};
__export(Argument_exports, {
  atLeast: () => atLeast2,
  atMost: () => atMost2,
  between: () => between2,
  choice: () => choice3,
  choiceWithValue: () => choiceWithValue2,
  date: () => date4,
  directory: () => directory2,
  file: () => file2,
  fileParse: () => fileParse3,
  fileSchema: () => fileSchema3,
  fileText: () => fileText3,
  filter: () => filter8,
  filterMap: () => filterMap4,
  float: () => float4,
  integer: () => integer4,
  map: () => map12,
  mapEffect: () => mapEffect3,
  mapTryCatch: () => mapTryCatch2,
  none: () => none5,
  optional: () => optional4,
  orElse: () => orElse2,
  orElseResult: () => orElseResult2,
  path: () => path3,
  redacted: () => redacted3,
  string: () => string5,
  variadic: () => variadic2,
  withDefault: () => withDefault4,
  withDescription: () => withDescription2,
  withFallbackConfig: () => withFallbackConfig2,
  withFallbackPrompt: () => withFallbackPrompt2,
  withMetavar: () => withMetavar2,
  withSchema: () => withSchema2
});

// node_modules/effect/dist/unstable/cli/CliError.js
var CliError_exports = {};
__export(CliError_exports, {
  DuplicateOption: () => DuplicateOption,
  InvalidValue: () => InvalidValue2,
  MissingArgument: () => MissingArgument,
  MissingOption: () => MissingOption,
  NonShowHelpErrors: () => NonShowHelpErrors,
  ShowHelp: () => ShowHelp,
  UnexpectedArgument: () => UnexpectedArgument,
  UnknownSubcommand: () => UnknownSubcommand,
  UnrecognizedOption: () => UnrecognizedOption,
  UserError: () => UserError,
  isCliError: () => isCliError
});
var TypeId36 = "~effect/cli/CliError";
var isCliError = (u) => hasProperty(u, TypeId36);
var UnrecognizedOption = class extends (/* @__PURE__ */ TaggedError3(`${TypeId36}/UnrecognizedOption`)("UnrecognizedOption", {
  option: String4,
  command: /* @__PURE__ */ optional2(/* @__PURE__ */ ArraySchema(String4)),
  suggestions: /* @__PURE__ */ ArraySchema(String4)
})) {
  /**
   * Marks this value as a CLI parsing error for runtime guards.
   *
   * @since 4.0.0
   */
  [TypeId36] = TypeId36;
  /**
   * Formats the unrecognized option with command context and suggestions.
   *
   * @since 4.0.0
   */
  get message() {
    const suggestionText = this.suggestions.length > 0 ? `

  Did you mean this?
    ${this.suggestions.join("\n    ")}` : "";
    const baseMessage = this.command ? `Unrecognized flag: ${this.option} in command ${this.command.join(" ")}` : `Unrecognized flag: ${this.option}`;
    return baseMessage + suggestionText;
  }
};
var DuplicateOption = class extends (/* @__PURE__ */ TaggedError3(`${TypeId36}/DuplicateOption`)("DuplicateOption", {
  option: String4,
  parentCommand: String4,
  childCommand: String4
})) {
  /**
   * Marks this value as a CLI configuration error for runtime guards.
   *
   * @since 4.0.0
   */
  [TypeId36] = TypeId36;
  /**
   * Explains which parent and child commands define the duplicate option.
   *
   * @since 4.0.0
   */
  get message() {
    return `Duplicate flag name "${this.option}" in parent command "${this.parentCommand}" and subcommand "${this.childCommand}". Parent will always claim this flag (Mode A semantics). Consider renaming one of them to avoid confusion.`;
  }
};
var MissingOption = class extends (/* @__PURE__ */ TaggedError3(`${TypeId36}/MissingOption`)("MissingOption", {
  option: String4
})) {
  /**
   * Marks this value as a missing CLI option error for runtime guards.
   *
   * @since 4.0.0
   */
  [TypeId36] = TypeId36;
  /**
   * Formats the missing required flag for display.
   *
   * @since 4.0.0
   */
  get message() {
    return `Missing required flag: --${this.option}`;
  }
};
var MissingArgument = class extends (/* @__PURE__ */ TaggedError3(`${TypeId36}/MissingArgument`)("MissingArgument", {
  argument: String4
})) {
  /**
   * Marks this value as a missing CLI argument error for runtime guards.
   *
   * @since 4.0.0
   */
  [TypeId36] = TypeId36;
  /**
   * Formats the missing required positional argument for display.
   *
   * @since 4.0.0
   */
  get message() {
    return `Missing required argument: ${this.argument}`;
  }
};
var UnexpectedArgument = class extends (/* @__PURE__ */ TaggedError3(`${TypeId36}/UnexpectedArgument`)("UnexpectedArgument", {
  arguments: /* @__PURE__ */ ArraySchema(String4)
})) {
  /**
   * Marks this value as an unexpected CLI argument error for runtime guards.
   *
   * @since 4.0.0
   */
  [TypeId36] = TypeId36;
  /**
   * Formats the unexpected positional arguments for display.
   *
   * @since 4.0.0
   */
  get message() {
    const label = this.arguments.length === 1 ? "argument" : "arguments";
    return `Unexpected positional ${label}: ${this.arguments.map((value3) => JSON.stringify(value3)).join(", ")}`;
  }
};
var InvalidValue2 = class extends (/* @__PURE__ */ TaggedError3(`${TypeId36}/InvalidValue`)("InvalidValue", {
  option: String4,
  value: String4,
  expected: String4,
  kind: /* @__PURE__ */ Union2([/* @__PURE__ */ Literal2("flag"), /* @__PURE__ */ Literal2("argument")])
})) {
  /**
   * Marks this value as an invalid CLI value error for runtime guards.
   *
   * @since 4.0.0
   */
  [TypeId36] = TypeId36;
  /**
   * Formats the invalid flag or argument value with the expected input.
   *
   * @since 4.0.0
   */
  get message() {
    const expectation = this.expected.startsWith("Expected ") || this.expected.startsWith("Expected:") ? this.expected : `Expected: ${this.expected}`;
    if (this.kind === "argument") {
      return `Invalid value for argument <${this.option}>: "${this.value}". ${expectation}`;
    }
    if (this.value.length === 0) {
      return `Missing value for flag --${this.option}. ${expectation}`;
    }
    return `Invalid value for flag --${this.option}: "${this.value}". ${expectation}`;
  }
};
var UnknownSubcommand = class extends (/* @__PURE__ */ TaggedError3(`${TypeId36}/UnknownSubcommand`)("UnknownSubcommand", {
  subcommand: String4,
  parent: /* @__PURE__ */ optional2(/* @__PURE__ */ ArraySchema(String4)),
  suggestions: /* @__PURE__ */ ArraySchema(String4)
})) {
  /**
   * Marks this value as an unknown CLI subcommand error for runtime guards.
   *
   * @since 4.0.0
   */
  [TypeId36] = TypeId36;
  /**
   * Formats the unknown subcommand with parent command context and suggestions.
   *
   * @since 4.0.0
   */
  get message() {
    const suggestionText = this.suggestions.length > 0 ? `

  Did you mean this?
    ${this.suggestions.join("\n    ")}` : "";
    return this.parent ? `Unknown subcommand "${this.subcommand}" for "${this.parent.join(" ")}"${suggestionText}` : `Unknown subcommand "${this.subcommand}"${suggestionText}`;
  }
};
var UserError = class extends (/* @__PURE__ */ TaggedError3(`${TypeId36}/UserError`)("UserError", {
  cause: /* @__PURE__ */ Defect(),
  userMessage: /* @__PURE__ */ optionalKey2(String4)
})) {
  /**
   * Marks this value as a user handler error for runtime guards.
   *
   * @since 4.0.0
   */
  [TypeId36] = TypeId36;
  /**
   * Controls whether the runtime logger should report this error. The CLI
   * runner sets this to `false` after rendering the error itself.
   *
   * @since 4.0.0
   */
  [errorReported] = true;
  /**
   * Returns the explicit user-facing message or a safe fallback from `cause`.
   *
   * @since 4.0.0
   */
  get message() {
    if (this.userMessage) return this.userMessage;
    if (typeof this.cause === "string" && this.cause) return this.cause;
    if (this.cause instanceof Error && this.cause.message) return this.cause.message;
    return "An error occurred";
  }
};
var NonShowHelpErrors = /* @__PURE__ */ Union2([UnrecognizedOption, DuplicateOption, MissingOption, MissingArgument, UnexpectedArgument, InvalidValue2, UnknownSubcommand, UserError]);
var ShowHelp = class extends (/* @__PURE__ */ TaggedError3(`${TypeId36}/ShowHelp`)("ShowHelp", {
  commandPath: /* @__PURE__ */ ArraySchema(String4),
  errors: /* @__PURE__ */ ArraySchema(NonShowHelpErrors)
})) {
  [TypeId36] = TypeId36;
  [errorExitCode] = this.errors.length ? 1 : 0;
  [errorReported] = false;
  get message() {
    return "Help requested";
  }
};

// node_modules/effect/dist/unstable/encoding/Ini.js
var hasOwn = Object.prototype.hasOwnProperty;
var splitSections = (value3) => {
  const sections = [];
  let start = 0;
  let index = 0;
  while ((index = value3.indexOf(".", index)) !== -1) {
    if (index === 0 || value3[index - 1] !== "\\") {
      sections.push(value3.slice(start, index));
      start = index + 1;
    }
    index++;
  }
  sections.push(value3.slice(start));
  return sections;
};
var isQuoted = (value3) => value3.length >= 2 && (value3.startsWith('"') && value3.endsWith('"') || value3.startsWith("'") && value3.endsWith("'"));
var unquote = (input) => {
  let value3 = (input ?? "").trim();
  if (isQuoted(value3)) {
    if (value3[0] === "'") {
      value3 = value3.slice(1, -1);
    }
    try {
      return JSON.parse(value3);
    } catch {
      return value3;
    }
  }
  let escaped = false;
  let output = "";
  for (const character of value3) {
    if (escaped) {
      output += character === ";" || character === "#" || character === "\\" ? character : `\\${character}`;
      escaped = false;
    } else if (character === ";" || character === "#") {
      break;
    } else if (character === "\\") {
      escaped = true;
    } else {
      output += character;
    }
  }
  return output.trim();
};
var parse = (input) => {
  const output = /* @__PURE__ */ Object.create(null);
  let current = output;
  const sectionPattern = /^\[([^\]]*)\]\s*$/;
  const propertyPattern = /^([^=]+)(=(.*))?$/;
  for (const line of input.split(/[\r\n]+/g)) {
    if (line.length === 0 || /^\s*(?:[;#]|$)/.test(line)) {
      continue;
    }
    const sectionMatch = sectionPattern.exec(line);
    if (sectionMatch !== null) {
      const section = unquote(sectionMatch[1]);
      if (section === "__proto__") {
        current = /* @__PURE__ */ Object.create(null);
      } else {
        current = output[section] ??= /* @__PURE__ */ Object.create(null);
      }
      continue;
    }
    const propertyMatch = propertyPattern.exec(line);
    if (propertyMatch === null) {
      continue;
    }
    const rawKey = unquote(propertyMatch[1]);
    const array2 = rawKey.length > 2 && rawKey.endsWith("[]");
    const key = array2 ? rawKey.slice(0, -2) : rawKey;
    if (key === "__proto__") {
      continue;
    }
    const rawValue = propertyMatch[2] === void 0 ? true : unquote(propertyMatch[3]);
    const value3 = rawValue === "true" || rawValue === "false" || rawValue === "null" ? JSON.parse(rawValue) : rawValue;
    if (array2) {
      if (!hasOwn.call(current, key)) {
        current[key] = [];
      } else if (!Array.isArray(current[key])) {
        current[key] = [current[key]];
      }
    }
    if (Array.isArray(current[key])) {
      current[key].push(value3);
    } else {
      current[key] = value3;
    }
  }
  const remove3 = [];
  for (const section of Object.keys(output)) {
    if (typeof output[section] !== "object" || output[section] === null || Array.isArray(output[section])) {
      continue;
    }
    const parts = splitSections(section);
    const last = parts.pop();
    const key = last.replace(/\\\./g, ".");
    current = output;
    for (const part of parts) {
      if (part === "__proto__") {
        continue;
      }
      if (!hasOwn.call(current, part) || typeof current[part] !== "object" || current[part] === null) {
        current[part] = /* @__PURE__ */ Object.create(null);
      }
      current = current[part];
    }
    if (current === output && key === last) {
      continue;
    }
    current[key] = output[section];
    remove3.push(section);
  }
  for (const section of remove3) {
    delete output[section];
  }
  return output;
};

// node_modules/effect/dist/unstable/encoding/Toml.js
var hasOwn2 = Object.prototype.hasOwnProperty;
var makeTable = () => /* @__PURE__ */ Object.create(null);
var isTable = (value3) => typeof value3 === "object" && value3 !== null && !Array.isArray(value3) && !(value3 instanceof Date);
var TomlParser = class {
  root = /* @__PURE__ */ makeTable();
  input;
  current = this.root;
  index = 0;
  line = 1;
  column = 1;
  explicitTables = /* @__PURE__ */ new Set();
  constructor(input) {
    this.input = input;
  }
  parse() {
    while (true) {
      this.skipDocumentWhitespace();
      if (this.done) {
        return this.root;
      }
      if (this.peek() === "[") {
        this.parseHeader();
      } else {
        const keys = this.parseKeyPath("=");
        this.skipInlineWhitespace();
        this.expect("=");
        this.skipInlineWhitespace();
        this.assign(this.current, keys, this.parseValue());
        this.finishStatement();
      }
    }
  }
  parseHeader() {
    this.expect("[");
    const array2 = this.peek() === "[";
    if (array2) {
      this.advance();
    }
    this.skipInlineWhitespace();
    const path5 = this.parseKeyPath("]");
    this.skipInlineWhitespace();
    this.expect("]");
    if (array2) {
      this.expect("]");
    }
    this.finishStatement();
    const pathKey = JSON.stringify(path5);
    if (!array2 && this.explicitTables.has(pathKey)) {
      this.fail(`Cannot redefine table '${path5.join(".")}'`);
    }
    if (!array2) {
      this.explicitTables.add(pathKey);
    }
    this.current = this.resolveTable(path5, array2);
  }
  resolveTable(path5, array2) {
    let table3 = this.root;
    for (let index = 0; index < path5.length; index++) {
      const key = path5[index];
      const last = index === path5.length - 1;
      let value3 = table3[key];
      if (last && array2) {
        if (value3 === void 0) {
          value3 = [];
          table3[key] = value3;
        }
        if (!Array.isArray(value3)) {
          this.fail(`Cannot redefine existing key '${path5.slice(0, index + 1).join(".")}'`);
        }
        const next = makeTable();
        value3.push(next);
        return next;
      }
      if (value3 === void 0) {
        value3 = makeTable();
        table3[key] = value3;
      }
      if (Array.isArray(value3)) {
        value3 = value3[value3.length - 1];
      }
      if (!isTable(value3)) {
        this.fail(`Cannot redefine existing key '${path5.slice(0, index + 1).join(".")}'`);
      }
      table3 = value3;
    }
    return table3;
  }
  assign(target, keys, value3) {
    let table3 = target;
    for (let index = 0; index < keys.length - 1; index++) {
      const key2 = keys[index];
      const existing = table3[key2];
      if (existing === void 0) {
        const child = makeTable();
        table3[key2] = child;
        table3 = child;
      } else if (isTable(existing)) {
        table3 = existing;
      } else {
        this.fail(`Cannot redefine existing key '${keys.slice(0, index + 1).join(".")}'`);
      }
    }
    const key = keys[keys.length - 1];
    if (hasOwn2.call(table3, key)) {
      this.fail(`Cannot redefine existing key '${keys.join(".")}'`);
    }
    table3[key] = value3;
  }
  parseKeyPath(stop) {
    const keys = [];
    while (true) {
      this.skipInlineWhitespace();
      const character = this.peek();
      let key;
      if (character === '"') {
        key = this.parseBasicString(false);
      } else if (character === "'") {
        key = this.parseLiteralString(false);
      } else {
        const start = this.index;
        while (/[A-Za-z0-9_-]/.test(this.peek())) {
          this.advance();
        }
        key = this.input.slice(start, this.index);
      }
      if (key.length === 0) {
        this.fail("Expected a key");
      }
      keys.push(key);
      this.skipInlineWhitespace();
      if (this.peek() === ".") {
        this.advance();
        continue;
      }
      if (this.peek() !== stop) {
        this.fail(`Expected '${stop}'`);
      }
      return keys;
    }
  }
  parseValue() {
    const character = this.peek();
    if (character === '"') {
      return this.parseBasicString(this.input.startsWith('"""', this.index));
    }
    if (character === "'") {
      return this.parseLiteralString(this.input.startsWith("'''", this.index));
    }
    if (character === "[") {
      return this.parseArray();
    }
    if (character === "{") {
      return this.parseInlineTable();
    }
    const spaceSeparatedDateTime = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:\d{2})?)/.exec(this.input.slice(this.index));
    if (spaceSeparatedDateTime !== null) {
      this.advance(spaceSeparatedDateTime[0].length);
      return this.parseDate(`${spaceSeparatedDateTime[1]}T${spaceSeparatedDateTime[2]}`);
    }
    const start = this.index;
    while (!this.done && !/[\s,#\]}]/.test(this.peek())) {
      this.advance();
    }
    const token = this.input.slice(start, this.index);
    if (token === "true") return true;
    if (token === "false") return false;
    if (token.length === 0) this.fail("Expected a value");
    const date6 = this.parseDate(token);
    if (date6 !== void 0) {
      return date6;
    }
    const number3 = this.parseNumber(token);
    if (number3 !== void 0) {
      return number3;
    }
    this.fail(`Invalid value '${token}'`);
  }
  parseDate(token) {
    const date6 = "\\d{4}-\\d{2}-\\d{2}";
    const time2 = "\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?";
    if (new RegExp(`^${date6}[Tt]${time2}(?:[Zz]|[+-]\\d{2}:\\d{2})$`).test(token)) {
      const value3 = new Date(token.replace("t", "T").replace("z", "Z"));
      if (Number.isNaN(value3.getTime())) {
        this.fail(`Invalid date-time '${token}'`);
      }
      return value3;
    }
    if (new RegExp(`^${date6}[Tt]${time2}$`).test(token) || new RegExp(`^${date6}$`).test(token) || new RegExp(`^${time2}$`).test(token)) {
      return token.replace("t", "T");
    }
    return void 0;
  }
  parseNumber(token) {
    const normalized = token.replace(/_/g, "");
    if (/^[+-]?(?:inf|nan)$/.test(token)) {
      if (normalized.endsWith("nan")) return Number.NaN;
      return normalized[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    }
    if (/^0x[0-9A-Fa-f](?:_?[0-9A-Fa-f])*$/.test(token)) {
      return Number.parseInt(normalized.slice(2), 16);
    }
    if (/^0o[0-7](?:_?[0-7])*$/.test(token)) {
      return Number.parseInt(normalized.slice(2), 8);
    }
    if (/^0b[01](?:_?[01])*$/.test(token)) {
      return Number.parseInt(normalized.slice(2), 2);
    }
    if (/^[+-]?(?:0|[1-9](?:_?\d)*)$/.test(token)) {
      return Number(normalized);
    }
    if (/^[+-]?(?:(?:0|[1-9](?:_?\d)*)\.\d(?:_?\d)*(?:[eE][+-]?\d(?:_?\d)*)?|(?:0|[1-9](?:_?\d)*)[eE][+-]?\d(?:_?\d)*)$/.test(token)) {
      return Number(normalized);
    }
    return void 0;
  }
  parseBasicString(multiline) {
    this.expect('"');
    if (multiline) {
      this.expect('"');
      this.expect('"');
      if (this.peek() === "\n") this.advance();
    }
    let output = "";
    while (!this.done) {
      if (multiline && this.input.startsWith('"""', this.index)) {
        this.advance(3);
        return output;
      }
      const character = this.peek();
      if (!multiline && character === '"') {
        this.advance();
        return output;
      }
      if (!multiline && (character === "\n" || character === "\r")) {
        this.fail("Basic strings cannot contain newlines");
      }
      if (character !== "\\") {
        output += character;
        this.advance();
        continue;
      }
      this.advance();
      if (multiline && /[ \t\r\n]/.test(this.peek())) {
        while (/[ \t]/.test(this.peek())) this.advance();
        if (this.peek() !== "\n" && this.peek() !== "\r") {
          this.fail("Invalid multiline string continuation");
        }
        while (/[ \t\r\n]/.test(this.peek())) this.advance();
        continue;
      }
      const escape = this.peek();
      this.advance();
      const escapes = {
        b: "\b",
        t: "	",
        n: "\n",
        f: "\f",
        r: "\r",
        '"': '"',
        "\\": "\\"
      };
      if (hasOwn2.call(escapes, escape)) {
        output += escapes[escape];
      } else if (escape === "u" || escape === "U") {
        const length = escape === "u" ? 4 : 8;
        const hex2 = this.input.slice(this.index, this.index + length);
        if (!new RegExp(`^[0-9A-Fa-f]{${length}}$`).test(hex2)) {
          this.fail("Invalid unicode escape");
        }
        output += String.fromCodePoint(Number.parseInt(hex2, 16));
        this.advance(length);
      } else {
        this.fail(`Invalid escape '\\${escape}'`);
      }
    }
    this.fail("Unterminated basic string");
  }
  parseLiteralString(multiline) {
    this.expect("'");
    if (multiline) {
      this.expect("'");
      this.expect("'");
      if (this.peek() === "\n") this.advance();
    }
    const start = this.index;
    while (!this.done) {
      if (multiline && this.input.startsWith("'''", this.index)) {
        const output = this.input.slice(start, this.index);
        this.advance(3);
        return output;
      }
      if (!multiline && this.peek() === "'") {
        const output = this.input.slice(start, this.index);
        this.advance();
        return output;
      }
      if (!multiline && (this.peek() === "\n" || this.peek() === "\r")) {
        this.fail("Literal strings cannot contain newlines");
      }
      this.advance();
    }
    this.fail("Unterminated literal string");
  }
  parseArray() {
    this.expect("[");
    const output = [];
    while (true) {
      this.skipArrayWhitespace();
      if (this.peek() === "]") {
        this.advance();
        return output;
      }
      output.push(this.parseValue());
      this.skipArrayWhitespace();
      if (this.peek() === "]") {
        this.advance();
        return output;
      }
      this.expect(",");
    }
  }
  parseInlineTable() {
    this.expect("{");
    const output = makeTable();
    this.skipInlineWhitespace();
    if (this.peek() === "}") {
      this.advance();
      return output;
    }
    while (true) {
      const keys = this.parseKeyPath("=");
      this.skipInlineWhitespace();
      this.expect("=");
      this.skipInlineWhitespace();
      this.assign(output, keys, this.parseValue());
      this.skipInlineWhitespace();
      if (this.peek() === "}") {
        this.advance();
        return output;
      }
      this.expect(",");
      this.skipInlineWhitespace();
      if (this.peek() === "}") {
        this.fail("Inline tables cannot end with a trailing comma");
      }
    }
  }
  skipDocumentWhitespace() {
    while (!this.done) {
      if (/[ \t\r\n]/.test(this.peek())) {
        this.advance();
      } else if (this.peek() === "#") {
        this.skipComment();
      } else {
        return;
      }
    }
  }
  skipInlineWhitespace() {
    while (this.peek() === " " || this.peek() === "	") {
      this.advance();
    }
  }
  skipArrayWhitespace() {
    while (!this.done) {
      if (/[ \t\r\n]/.test(this.peek())) {
        this.advance();
      } else if (this.peek() === "#") {
        this.skipComment();
      } else {
        return;
      }
    }
  }
  finishStatement() {
    this.skipInlineWhitespace();
    if (this.peek() === "#") {
      this.skipComment();
    }
    if (!this.done && this.peek() !== "\n" && this.peek() !== "\r") {
      this.fail("Expected the end of the line");
    }
  }
  skipComment() {
    while (!this.done && this.peek() !== "\n") {
      this.advance();
    }
  }
  expect(character) {
    if (this.peek() !== character) {
      this.fail(`Expected '${character}'`);
    }
    this.advance();
  }
  advance(count2 = 1) {
    for (let offset = 0; offset < count2; offset++) {
      if (this.input[this.index] === "\n") {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.index++;
    }
  }
  peek() {
    return this.input[this.index] ?? "";
  }
  get done() {
    return this.index >= this.input.length;
  }
  fail(message) {
    throw new SyntaxError(`${message} at line ${this.line}, column ${this.column}`);
  }
};
var parse2 = (input) => new TomlParser(input.replace(/^\uFEFF/, "")).parse();

// node_modules/effect/dist/unstable/encoding/Yaml.js
var hasOwn3 = Object.prototype.hasOwnProperty;
var setProperty = (record2, key, value3) => {
  Object.defineProperty(record2, key, {
    configurable: true,
    enumerable: true,
    writable: true,
    value: value3
  });
};
var stripComment = (input) => {
  let quote;
  let escaped = false;
  for (let index = 0; index < input.length; index++) {
    const character = input[index];
    if (quote === '"') {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = void 0;
      }
    } else if (quote === "'") {
      if (character === quote && input[index + 1] === quote) {
        index++;
      } else if (character === quote) {
        quote = void 0;
      }
    } else if (character === "'" || character === '"') {
      quote = character;
    } else if (character === "#" && (index === 0 || /\s/.test(input[index - 1]))) {
      return input.slice(0, index).trimEnd();
    }
  }
  return input.trimEnd();
};
var mappingSeparator = (input) => {
  let quote;
  let escaped = false;
  let depth = 0;
  for (let index = 0; index < input.length; index++) {
    const character = input[index];
    if (quote === '"') {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = void 0;
    } else if (quote === "'") {
      if (character === quote && input[index + 1] === quote) index++;
      else if (character === quote) quote = void 0;
    } else if (character === "'" || character === '"') {
      quote = character;
    } else if (character === "[" || character === "{") {
      depth++;
    } else if (character === "]" || character === "}") {
      depth--;
    } else if (character === ":" && depth === 0 && (input[index + 1] === void 0 || /\s/.test(input[index + 1]))) {
      return index;
    }
  }
  return -1;
};
var parseDoubleQuoted = (input) => {
  if (!input.endsWith('"') || input.length < 2) {
    throw new SyntaxError("Unterminated double-quoted YAML string");
  }
  let output = "";
  for (let index = 1; index < input.length - 1; index++) {
    const character = input[index];
    if (character !== "\\") {
      output += character;
      continue;
    }
    const escape = input[++index];
    const escapes = {
      "0": "\0",
      a: "\x07",
      b: "\b",
      t: "	",
      n: "\n",
      v: "\v",
      f: "\f",
      r: "\r",
      e: "\x1B",
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      N: "\x85",
      _: "\xA0",
      L: "\u2028",
      P: "\u2029"
    };
    if (hasOwn3.call(escapes, escape)) {
      output += escapes[escape];
      continue;
    }
    if (escape === "x" || escape === "u" || escape === "U") {
      const length = escape === "x" ? 2 : escape === "u" ? 4 : 8;
      const hex2 = input.slice(index + 1, index + 1 + length);
      if (!new RegExp(`^[0-9A-Fa-f]{${length}}$`).test(hex2)) {
        throw new SyntaxError("Invalid unicode escape in YAML string");
      }
      output += String.fromCodePoint(Number.parseInt(hex2, 16));
      index += length;
      continue;
    }
    throw new SyntaxError(`Invalid YAML escape '\\${escape}'`);
  }
  return output;
};
var parseScalar = (input) => {
  const value3 = input.trim();
  if (value3.length === 0) return null;
  if (value3.startsWith('"') && value3.endsWith('"')) {
    return parseDoubleQuoted(value3);
  }
  if (value3.startsWith("'") && value3.endsWith("'")) {
    return value3.slice(1, -1).replace(/''/g, "'");
  }
  if (/^(?:null|~)$/i.test(value3)) return null;
  if (/^true$/i.test(value3)) return true;
  if (/^false$/i.test(value3)) return false;
  if (/^[+-]?\.inf$/i.test(value3)) return value3[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  if (/^\.nan$/i.test(value3)) return Number.NaN;
  const normalized = value3.replace(/_/g, "");
  if (/^[+-]?0x[0-9a-f]+$/i.test(normalized)) {
    const sign = normalized[0] === "-" ? -1 : 1;
    return sign * Number.parseInt(normalized.replace(/^[+-]?0x/i, ""), 16);
  }
  if (/^[+-]?0o[0-7]+$/i.test(normalized)) {
    const sign = normalized[0] === "-" ? -1 : 1;
    return sign * Number.parseInt(normalized.replace(/^[+-]?0o/i, ""), 8);
  }
  if (/^[+-]?(?:0|[1-9]\d*)$/.test(normalized) || /^[+-]?(?:(?:0|[1-9]\d*)?\.\d+|(?:0|[1-9]\d*)\.?\d*[eE][+-]?\d+)$/.test(normalized)) {
    return Number(normalized);
  }
  return value3;
};
var parseKey = (input) => {
  const value3 = parseScalar(input);
  return value3 === null || value3 === void 0 ? "" : String(value3);
};
var FlowParser = class {
  input;
  anchors;
  index = 0;
  constructor(input, anchors) {
    this.input = input;
    this.anchors = anchors;
  }
  parse() {
    const value3 = this.parseValue();
    this.skipWhitespace();
    if (this.index !== this.input.length) {
      this.fail("Unexpected flow collection content");
    }
    return value3;
  }
  parseValue() {
    this.skipWhitespace();
    const character = this.peek();
    if (character === "[") return this.parseSequence();
    if (character === "{") return this.parseMapping();
    if (character === '"' || character === "'") return parseScalar(this.readQuoted(character));
    if (character === "*") {
      this.index++;
      const name = this.readUntil(/[,\]}\s]/);
      if (!this.anchors.has(name)) this.fail(`Unknown alias '*${name}'`);
      return this.anchors.get(name);
    }
    return parseScalar(this.readUntil(/[,\]}]/).trim());
  }
  parseSequence() {
    this.expect("[");
    const output = [];
    this.skipWhitespace();
    if (this.peek() === "]") {
      this.index++;
      return output;
    }
    while (true) {
      output.push(this.parseValue());
      this.skipWhitespace();
      if (this.peek() === "]") {
        this.index++;
        return output;
      }
      this.expect(",");
      this.skipWhitespace();
      if (this.peek() === "]") {
        this.index++;
        return output;
      }
    }
  }
  parseMapping() {
    this.expect("{");
    const output = {};
    this.skipWhitespace();
    if (this.peek() === "}") {
      this.index++;
      return output;
    }
    while (true) {
      const key = this.parseKey();
      this.skipWhitespace();
      this.expect(":");
      if (hasOwn3.call(output, key)) this.fail(`Duplicate key '${key}'`);
      setProperty(output, key, this.parseValue());
      this.skipWhitespace();
      if (this.peek() === "}") {
        this.index++;
        return output;
      }
      this.expect(",");
      this.skipWhitespace();
      if (this.peek() === "}") {
        this.index++;
        return output;
      }
    }
  }
  parseKey() {
    this.skipWhitespace();
    const character = this.peek();
    if (character === '"' || character === "'") {
      return parseKey(this.readQuoted(character));
    }
    return this.readUntil(/:/).trim();
  }
  readQuoted(quote) {
    const start = this.index++;
    let escaped = false;
    while (this.index < this.input.length) {
      const character = this.input[this.index++];
      if (quote === '"' && escaped) escaped = false;
      else if (quote === '"' && character === "\\") escaped = true;
      else if (quote === "'" && character === quote && this.input[this.index] === quote) this.index++;
      else if (character === quote) return this.input.slice(start, this.index);
    }
    this.fail("Unterminated quoted scalar");
  }
  readUntil(stop) {
    const start = this.index;
    while (this.index < this.input.length && !stop.test(this.peek())) this.index++;
    return this.input.slice(start, this.index);
  }
  skipWhitespace() {
    while (/\s/.test(this.peek())) this.index++;
  }
  expect(character) {
    if (this.peek() !== character) this.fail(`Expected '${character}'`);
    this.index++;
  }
  peek() {
    return this.input[this.index] ?? "";
  }
  fail(message) {
    throw new SyntaxError(`${message} at flow offset ${this.index}`);
  }
};
var YamlParser = class {
  lines;
  index = 0;
  anchors = /* @__PURE__ */ new Map();
  constructor(lines2) {
    this.lines = lines2;
  }
  parse() {
    this.skipIgnored();
    if (this.index >= this.lines.length) return null;
    const value3 = this.parseNode(this.lines[this.index].indent);
    this.skipIgnored();
    if (this.index < this.lines.length) {
      this.fail(this.lines[this.index], "Unexpected content");
    }
    return value3;
  }
  parseNode(indent) {
    this.skipIgnored();
    const line = this.lines[this.index];
    if (line === void 0) return null;
    if (line.indent !== indent) this.fail(line, `Expected indentation of ${indent} spaces`);
    if (line.text === "-" || line.text.startsWith("- ")) return this.parseSequence(indent);
    if (mappingSeparator(line.text) !== -1) return this.parseMapping(indent);
    this.index++;
    return this.parseInlineValue(line.text);
  }
  parseMapping(indent) {
    const output = {};
    while (true) {
      this.skipIgnored();
      const line = this.lines[this.index];
      if (line === void 0 || line.indent < indent) return output;
      if (line.indent > indent) this.fail(line, `Unexpected indentation of ${line.indent} spaces`);
      const separator = mappingSeparator(line.text);
      if (separator === -1) return output;
      this.index++;
      this.parseMappingEntry(output, line.text, separator, indent, line);
    }
  }
  parseMappingEntry(output, text2, separator, indent, line) {
    const key = parseKey(text2.slice(0, separator).trim());
    const rawValue = text2.slice(separator + 1).trim();
    const value3 = this.parseNodeValue(rawValue, indent);
    if (hasOwn3.call(output, key)) this.fail(line, `Duplicate key '${key}'`);
    setProperty(output, key, value3);
  }
  parseSequence(indent) {
    const output = [];
    while (true) {
      this.skipIgnored();
      const line = this.lines[this.index];
      if (line === void 0 || line.indent < indent) return output;
      if (line.indent > indent) this.fail(line, `Unexpected indentation of ${line.indent} spaces`);
      if (line.text !== "-" && !line.text.startsWith("- ")) return output;
      this.index++;
      const item = line.text.slice(1).trimStart();
      const separator = mappingSeparator(item);
      if (separator === -1) {
        output.push(this.parseNodeValue(item, indent));
        continue;
      }
      const mapping = {};
      this.parseMappingEntry(mapping, item, separator, indent + 2, line);
      while (true) {
        this.skipIgnored();
        const continuation = this.lines[this.index];
        if (continuation === void 0 || continuation.indent <= indent) break;
        if (continuation.indent !== indent + 2) {
          this.fail(continuation, `Expected indentation of ${indent + 2} spaces`);
        }
        const nextSeparator = mappingSeparator(continuation.text);
        if (nextSeparator === -1) this.fail(continuation, "Expected a mapping entry");
        this.index++;
        this.parseMappingEntry(mapping, continuation.text, nextSeparator, indent + 2, continuation);
      }
      output.push(mapping);
    }
  }
  parseNodeValue(rawValue, parentIndent) {
    let value3 = rawValue;
    let anchor;
    const anchorMatch = /^&([^\s,[\]{}]+)(?:\s+(.*))?$/.exec(value3);
    if (anchorMatch !== null) {
      anchor = anchorMatch[1];
      value3 = anchorMatch[2] ?? "";
    }
    let parsed;
    if (value3.length === 0) {
      this.skipIgnored();
      const next = this.lines[this.index];
      parsed = next !== void 0 && next.indent > parentIndent ? this.parseNode(next.indent) : null;
    } else if (/^[|>](?:[1-9]?[+-]?|[+-]?[1-9]?)$/.test(value3)) {
      parsed = this.parseBlockScalar(value3, parentIndent);
    } else {
      parsed = this.parseInlineValue(value3);
    }
    if (anchor !== void 0) this.anchors.set(anchor, parsed);
    return parsed;
  }
  parseInlineValue(value3) {
    if (value3.startsWith("*")) {
      const name = value3.slice(1).trim();
      if (!this.anchors.has(name)) throw new SyntaxError(`Unknown YAML alias '*${name}'`);
      return this.anchors.get(name);
    }
    if (value3.startsWith("[") || value3.startsWith("{")) {
      return new FlowParser(value3, this.anchors).parse();
    }
    return parseScalar(value3);
  }
  parseBlockScalar(indicator, parentIndent) {
    const style = indicator[0];
    const chomp = indicator.includes("-") ? "strip" : indicator.includes("+") ? "keep" : "clip";
    const explicitIndent = Number.parseInt(indicator.replace(/[^1-9]/g, ""), 10);
    const start = this.index;
    let end = start;
    let contentIndent = Number.isNaN(explicitIndent) ? Number.POSITIVE_INFINITY : parentIndent + explicitIndent;
    while (end < this.lines.length) {
      const line = this.lines[end];
      if (line.raw.trim().length !== 0 && line.indent <= parentIndent) break;
      if (line.raw.trim().length !== 0) contentIndent = Math.min(contentIndent, line.indent);
      end++;
    }
    if (contentIndent === Number.POSITIVE_INFINITY) contentIndent = parentIndent + 1;
    const content = [];
    for (let index = start; index < end; index++) {
      const line = this.lines[index];
      if (line.raw.trim().length === 0) {
        content.push("");
      } else if (line.indent < contentIndent) {
        this.fail(line, `Expected block scalar indentation of ${contentIndent} spaces`);
      } else {
        content.push(line.raw.slice(contentIndent));
      }
    }
    this.index = end;
    let output = "";
    if (style === "|") {
      output = content.join("\n");
    } else {
      for (let index = 0; index < content.length; index++) {
        output += content[index];
        if (index < content.length - 1) {
          output += content[index].length === 0 || content[index + 1].length === 0 ? "\n" : " ";
        }
      }
    }
    if (chomp === "keep") return `${output}
`;
    output = output.replace(/\n+$/, "");
    return chomp === "strip" ? output : `${output}
`;
  }
  skipIgnored() {
    while (this.index < this.lines.length) {
      const line = this.lines[this.index];
      if (line.text.length === 0 || line.text.startsWith("%") || line.text === "---") {
        this.index++;
      } else if (line.text === "...") {
        this.index++;
        while (this.index < this.lines.length && this.lines[this.index].text.length === 0) this.index++;
        if (this.index < this.lines.length) {
          this.fail(this.lines[this.index], "Multiple YAML documents are not supported");
        }
      } else {
        return;
      }
    }
  }
  fail(line, message) {
    throw new SyntaxError(`${message} at line ${line.number}`);
  }
};
var parse3 = (input) => {
  const source = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines2 = source.split("\n").map((raw, index) => {
    const indentation = /^( *)/.exec(raw)[1].length;
    if (raw.slice(0, indentation + 1).includes("	")) {
      throw new SyntaxError(`Tabs cannot be used for YAML indentation at line ${index + 1}`);
    }
    return {
      raw,
      text: stripComment(raw.slice(indentation)),
      indent: indentation,
      number: index + 1
    };
  });
  return new YamlParser(lines2).parse();
};

// node_modules/effect/dist/unstable/cli/Primitive.js
var TypeId37 = "~effect/cli/Primitive";
var Proto8 = {
  [TypeId37]: {
    _A: identity
  }
};
var isTrueValue = /* @__PURE__ */ is2(TrueValues);
var isFalseValue = /* @__PURE__ */ is2(FalseValues);
var isBoolean2 = (p) => p._tag === "Boolean";
var makePrimitive2 = (tag2, parse4) => Object.assign(Object.create(Proto8), {
  _tag: tag2,
  parse: parse4
});
var makeSchemaPrimitive = (tag2, schema) => {
  const toCodecStringTree2 = toCodecStringTree(schema);
  const decode = decodeUnknownEffect2(toCodecStringTree2);
  return makePrimitive2(tag2, (value3) => mapError2(decode(value3), (error2) => error2.message));
};
var boolean2 = /* @__PURE__ */ makeSchemaPrimitive("Boolean", Boolean4);
var float = /* @__PURE__ */ makeSchemaPrimitive("Float", Finite);
var integer = /* @__PURE__ */ makeSchemaPrimitive("Integer", Int);
var date = /* @__PURE__ */ makeSchemaPrimitive("Date", Date4);
var string3 = /* @__PURE__ */ makePrimitive2("String", (value3) => succeed6(value3));
var choice = (choices) => {
  const choiceMap = new Map(choices);
  const validChoices = choices.map(([key]) => format(key)).join(" | ");
  const primitive = makePrimitive2("Choice", (value3) => {
    if (choiceMap.has(value3)) {
      return succeed6(choiceMap.get(value3));
    }
    return fail6(validChoices);
  });
  return Object.assign(primitive, {
    choiceKeys: choices.map(([key]) => key)
  });
};
var path = (pathType, mustExist) => {
  const primitive = makePrimitive2("Path", fnUntraced2(function* (value3) {
    const fs = yield* FileSystem;
    const path5 = yield* Path;
    const absolutePath = path5.isAbsolute(value3) ? value3 : path5.resolve(value3);
    const exists2 = yield* mapError2(fs.exists(absolutePath), (error2) => `Failed to check path existence: ${error2.message}`);
    if (mustExist === true && !exists2) {
      return yield* fail6(`Path does not exist: ${absolutePath}`);
    }
    if (exists2 && pathType !== "either") {
      const stat3 = yield* mapError2(fs.stat(absolutePath), (error2) => `Failed to stat path: ${error2.message}`);
      if (pathType === "file" && stat3.type !== "File") {
        return yield* fail6(`Path is not a file: ${absolutePath}`);
      }
      if (pathType === "directory" && stat3.type !== "Directory") {
        return yield* fail6(`Path is not a directory: ${absolutePath}`);
      }
    }
    return absolutePath;
  }));
  return Object.assign(primitive, {
    pathType
  });
};
var redacted = /* @__PURE__ */ makePrimitive2("Redacted", (value3) => succeed6(make24(value3)));
var fileText = /* @__PURE__ */ makePrimitive2("FileText", /* @__PURE__ */ fnUntraced2(function* (filePath) {
  const fs = yield* FileSystem;
  const path5 = yield* Path;
  const absolutePath = path5.isAbsolute(filePath) ? filePath : path5.resolve(filePath);
  const exists2 = yield* mapError2(fs.exists(absolutePath), (error2) => `Failed to check file existence: ${error2.message}`);
  if (!exists2) {
    return yield* fail6(`File does not exist: ${absolutePath}`);
  }
  const stat3 = yield* mapError2(fs.stat(absolutePath), (error2) => `Failed to stat file: ${error2.message}`);
  if (stat3.type !== "File") {
    return yield* fail6(`Path is not a file: ${absolutePath}`);
  }
  const content = yield* mapError2(fs.readFileString(absolutePath), (error2) => `Failed to read file: ${error2.message}`);
  return content;
}));
var fileParsers = {
  ini: (content) => parse(content),
  json: (content) => JSON.parse(content),
  toml: (content) => parse2(content),
  yml: (content) => parse3(content),
  yaml: (content) => parse3(content)
};
var fileParse = (options) => {
  return makePrimitive2("FileParse", fnUntraced2(function* (filePath) {
    const fileFormat = options?.format ?? filePath.split(".").pop();
    const parser = fileParsers[fileFormat];
    if (parser === void 0) {
      return yield* fail6(`Unsupported file format: ${fileFormat}`);
    }
    const content = yield* fileText.parse(filePath);
    return yield* try_2({
      try: () => parser(content),
      catch: (error2) => `Failed to parse '.${fileFormat}' file content: ${error2}`
    });
  }));
};
var fileSchema = (schema, options) => {
  const decode = decodeUnknownEffect2(schema);
  return makePrimitive2("FileSchema", fnUntraced2(function* (filePath) {
    const content = yield* fileParse(options).parse(filePath);
    return yield* mapError2(decode(content), (error2) => options?.errorFormatter?.(error2.issue) ?? error2.toString());
  }));
};
var keyValuePair = /* @__PURE__ */ makePrimitive2("KeyValuePair", /* @__PURE__ */ fnUntraced2(function* (value3) {
  const parts = value3.split("=");
  if (parts.length !== 2) {
    return yield* fail6(`Invalid key=value format. Expected format: key=value, got: ${value3}`);
  }
  const [key, val] = parts;
  if (!key || !val) {
    return yield* fail6(`Invalid key=value format. Both key and value must be non-empty. Got: ${value3}`);
  }
  return {
    [key]: val
  };
}));
var none3 = /* @__PURE__ */ makePrimitive2("None", () => fail6("This option does not accept values"));
var getTypeName = (primitive) => {
  switch (primitive._tag) {
    case "Boolean":
      return "boolean";
    case "String":
      return "string";
    case "Integer":
      return "integer";
    case "Float":
      return "number";
    case "Date":
      return "date";
    case "Path":
      return "path";
    case "Choice":
      return "choice";
    case "Redacted":
      return "string";
    case "FileText":
      return "file";
    case "FileParse":
      return "file";
    case "FileSchema":
      return "file";
    case "KeyValuePair":
      return "key=value";
    case "None":
      return "none";
    default:
      return "value";
  }
};
var getChoiceKeys = (primitive) => primitive._tag === "Choice" ? primitive.choiceKeys : void 0;
var getPathType = (primitive) => primitive._tag === "Path" ? primitive.pathType : void 0;

// node_modules/effect/dist/unstable/cli/internal/ansi.js
var ESC = "\x1B[";
var BEL = "\x07";
var SEP = ";";
var reset = `${ESC}0m`;
var bold = `${ESC}1m`;
var italicized = `${ESC}3m`;
var underlined = `${ESC}4m`;
var strikethrough = `${ESC}9m`;
var cursorShow = `${ESC}?25h`;
var cursorHide = `${ESC}?25l`;
var cursorLeft = `${ESC}G`;
var cursorSavePosition = `${ESC}s`;
var cursorRestorePosition = `${ESC}u`;
var eraseLine = `${ESC}2K`;
var beep = BEL;
var red = `${ESC}31m`;
var green = `${ESC}32m`;
var magenta = `${ESC}35m`;
var white = `${ESC}37m`;
var blackBright = `${ESC}90m`;
var cyanBright = `${ESC}96m`;
var annotate2 = (text2, ...styles) => {
  const flat = styles.flat();
  return `${flat.join("")}${text2}${reset}`;
};
var combine3 = (...styles) => styles;
var cursorTo = (column, row) => {
  if (row === void 0) {
    return `${ESC}${Math.max(column + 1, 0)}G`;
  }
  return `${ESC}${row + 1}${SEP}${Math.max(column + 1, 0)}H`;
};
var cursorDown = (lines2 = 1) => {
  return `${ESC}${lines2}B`;
};
var cursorMove = (column, row = 0) => {
  let command = "";
  if (row < 0) {
    command += `${ESC}${-row}A`;
  }
  if (row > 0) {
    command += `${ESC}${row}B`;
  }
  if (column > 0) {
    command += `${ESC}${column}C`;
  }
  if (column < 0) {
    command += `${ESC}${-column}D`;
  }
  return command;
};
var eraseLines = (rows) => {
  let command = "";
  for (let i = 0; i < rows; i++) {
    command += `${ESC}2K` + (i < rows - 1 ? `${ESC}1A` : "");
  }
  if (rows > 0) {
    command += `${ESC}G`;
  }
  return command;
};

// node_modules/effect/dist/unstable/cli/Prompt.js
var TypeId38 = "~effect/cli/Prompt";
var isPrompt = (u) => hasProperty(u, TypeId38);
var defaultTheme = {
  prefix: "?",
  arrowUp: "\u2191",
  arrowDown: "\u2193",
  checkboxOn: "\u2612",
  checkboxOff: "\u2610",
  tick: "\u2714",
  ellipsis: "\u2026",
  pointerSmall: "\u203A",
  pointer: "\u276F",
  descriptionSeparator: "- ",
  passwordMask: "*",
  toggleSeparator: "/",
  primaryColor: cyanBright,
  mutedColor: blackBright,
  successColor: green,
  errorColor: red,
  submittedColor: white
};
var windowsTheme = {
  ...defaultTheme,
  checkboxOn: "[*]",
  checkboxOff: "[ ]",
  tick: "\u221A",
  ellipsis: "...",
  pointerSmall: "\xBB",
  pointer: ">"
};
var makeTheme = (options) => ({
  ...process.platform === "win32" ? windowsTheme : defaultTheme,
  ...options
});
var Theme = /* @__PURE__ */ Reference("effect/unstable/cli/Prompt/Theme", {
  defaultValue: makeTheme
});
var getTheme = (options) => map6(Theme, (theme) => ({
  ...theme,
  ...options.theme
}));
var annotateLine = (line) => annotate2(line, bold);
var annotateErrorLine = (line, color) => annotate2(line, combine3(italicized, color));
var annotateSymbol = (symbol4, ...styles) => symbol4.length === 0 ? "" : annotate2(symbol4, ...styles);
var separateSymbol = (symbol4, text2) => symbol4.length === 0 ? text2 : symbol4 + " " + text2;
var renderPagingPrefix = (theme, showArrowUp, showArrowDown) => {
  const width = Math.max(theme.arrowUp.length, theme.arrowDown.length);
  if (showArrowUp) {
    return theme.arrowUp.padEnd(width);
  }
  if (showArrowDown) {
    return theme.arrowDown.padEnd(width);
  }
  return " ".repeat(width);
};
var confirm = (options) => {
  const opts = {
    initial: false,
    ...options,
    label: {
      confirm: "yes",
      deny: "no",
      ...options.label
    },
    placeholder: {
      defaultConfirm: "(Y/n)",
      defaultDeny: "(y/N)",
      ...options.placeholder
    }
  };
  const initialState = {
    value: opts.initial
  };
  return custom(initialState, {
    render: handleConfirmRender(opts),
    process: (input) => handleConfirmProcess(input, opts.initial),
    clear: handleConfirmClear(opts)
  });
};
var custom = (initialState, ...args2) => {
  const [events, handlers] = args2.length === 1 ? [void 0, args2[0]] : [args2[0], args2[1]];
  const op = Object.create(proto);
  op._tag = "Loop";
  op.initialState = initialState;
  op.render = handlers.render;
  op.process = handlers.process;
  op.clear = handlers.clear;
  op.events = events;
  return op;
};
var date2 = (options) => {
  const opts = {
    initial: /* @__PURE__ */ new Date(),
    dateMask: "YYYY-MM-DD HH:mm:ss",
    validate: succeed6,
    ...options,
    locales: {
      ...defaultLocales,
      ...options.locales
    }
  };
  const dateParts = makeDateParts(opts.dateMask, opts.initial, opts.locales);
  const initialCursorPosition = dateParts.findIndex((part) => !part.isToken());
  const initialState = {
    dateParts,
    typed: "",
    cursor: initialCursorPosition,
    value: opts.initial,
    error: none2()
  };
  return custom(initialState, {
    render: handleDateRender(opts),
    process: handleDateProcess(opts),
    clear: handleDateClear(opts)
  });
};
var flatMap5 = /* @__PURE__ */ dual(2, (self, f) => {
  const op = Object.create(proto);
  op._tag = "OnSuccess";
  op.prompt = self;
  op.onSuccess = f;
  return op;
});
var float2 = (options) => {
  const opts = {
    default: 0,
    min: Number.NEGATIVE_INFINITY,
    max: Number.POSITIVE_INFINITY,
    incrementBy: 1,
    decrementBy: 1,
    precision: 2,
    validate: (n) => {
      if (n < opts.min) {
        return fail6(`${n} must be greater than or equal to ${opts.min}`);
      }
      if (n > opts.max) {
        return fail6(`${n} must be less than or equal to ${opts.max}`);
      }
      return succeed6(n);
    },
    ...options
  };
  const initialValue = options.default === void 0 ? "" : `${opts.default}`;
  const initialState = {
    cursor: initialValue.length,
    value: initialValue,
    error: none2()
  };
  return custom(initialState, {
    render: handleRenderFloat(opts),
    process: handleProcessFloat(opts),
    clear: handleNumberClear(opts)
  });
};
var integer2 = (options) => {
  const opts = {
    default: 0,
    min: Number.NEGATIVE_INFINITY,
    max: Number.POSITIVE_INFINITY,
    incrementBy: 1,
    decrementBy: 1,
    validate: (n) => {
      if (n < opts.min) {
        return fail6(`${n} must be greater than or equal to ${opts.min}`);
      }
      if (n > opts.max) {
        return fail6(`${n} must be less than or equal to ${opts.max}`);
      }
      return succeed6(n);
    },
    ...options
  };
  const initialValue = options.default === void 0 ? "" : `${opts.default}`;
  const initialState = {
    cursor: initialValue.length,
    value: initialValue,
    error: none2()
  };
  return custom(initialState, {
    render: handleRenderInteger(opts),
    process: handleProcessInteger(opts),
    clear: handleNumberClear(opts)
  });
};
var map10 = /* @__PURE__ */ dual(2, (self, f) => flatMap5(self, (a) => succeed9(f(a))));
var password = (options) => basePrompt(options, "password").pipe(map10(make24));
var run3 = /* @__PURE__ */ fnUntraced2(function* (self) {
  const terminal = yield* Terminal;
  const input = yield* terminal.readInput;
  return yield* runWithInput(self, terminal, input);
}, /* @__PURE__ */ mapError2(() => new QuitError({})), scoped2);
var getSelectInitialIndex = (choices) => {
  let initialIndex = 0;
  let seenSelected = -1;
  for (let i = 0; i < choices.length; i++) {
    const choice5 = choices[i];
    if (choice5.selected === true) {
      if (seenSelected !== -1) {
        throw new Error("InvalidArgumentException: only a single choice can be selected by default for Prompt.select");
      }
      seenSelected = i;
    }
  }
  if (seenSelected !== -1) {
    initialIndex = seenSelected;
  }
  return initialIndex;
};
var select = (options) => {
  const opts = {
    maxPerPage: 10,
    ...options
  };
  const initialIndex = getSelectInitialIndex(opts.choices);
  return custom(initialIndex, {
    render: handleSelectRender(opts),
    process: handleSelectProcess(opts),
    clear: handleSelectClear(opts)
  });
};
var succeed9 = (value3) => {
  const op = Object.create(proto);
  op._tag = "Succeed";
  op.value = value3;
  return op;
};
var text = (options) => basePrompt(options, "text");
var toggle = (options) => {
  const opts = {
    initial: false,
    active: "on",
    inactive: "off",
    ...options
  };
  return custom(opts.initial, {
    render: handleToggleRender(opts),
    process: handleToggleProcess,
    clear: () => handleToggleClear(opts)
  });
};
var proto = {
  .../* @__PURE__ */ Prototype2({
    label: "Prompt",
    evaluate() {
      return run3(this);
    }
  }),
  [TypeId38]: {
    _Output: (_) => _
  }
};
var runWithInput = (prompt, terminal, input) => suspend2(() => {
  const op = prompt;
  switch (op._tag) {
    case "Loop": {
      return runLoop(op, terminal, input);
    }
    case "OnSuccess": {
      return flatMap3(runWithInput(op.prompt, terminal, input), (a) => runWithInput(op.onSuccess(a), terminal, input));
    }
    case "Succeed": {
      return succeed6(op.value);
    }
  }
});
var runLoop = /* @__PURE__ */ fnUntraced2(function* (loop, terminal, input) {
  let state = isEffect2(loop.initialState) ? yield* loop.initialState : loop.initialState;
  let action2 = Action.NextFrame({
    state
  });
  while (true) {
    const msg = yield* loop.render(state, action2);
    yield* orDie2(terminal.display(msg));
    if (loop.events) {
      const takeInput = take2(input).pipe(map6((input2) => ({
        _tag: "Input",
        input: input2
      })));
      const result3 = yield* raceFirst2(takeInput, take2(loop.events).pipe(map6((value3) => ({
        _tag: "Event",
        value: value3
      }))));
      action2 = yield* loop.process(result3, state);
    } else {
      const result3 = yield* take2(input);
      action2 = yield* loop.process(result3, state);
    }
    switch (action2._tag) {
      case "Beep":
        continue;
      case "NextFrame": {
        yield* orDie2(terminal.display(yield* loop.clear(state, action2)));
        state = action2.state;
        continue;
      }
      case "Submit": {
        yield* orDie2(terminal.display(yield* loop.clear(state, action2)));
        const msg2 = yield* loop.render(state, action2);
        yield* orDie2(terminal.display(msg2));
        return action2.value;
      }
    }
  }
}, (effect2, _, terminal) => ensuring2(effect2, orDie2(terminal.display(cursorShow))));
var Action = /* @__PURE__ */ taggedEnum();
var eraseText = (text2, columns) => {
  if (columns === 0) {
    return eraseLine + cursorTo(0);
  }
  let rows = 0;
  const lines2 = text2.split(NEWLINE_REGEXP);
  for (const line of lines2) {
    rows += 1 + Math.floor(Math.max(line.length - 1, 0) / columns);
  }
  return eraseLines(rows);
};
var lines = (prompt, columns) => {
  const lines2 = prompt.split(NEWLINE_REGEXP);
  return columns === 0 ? lines2.length : pipe(map2(lines2, (line) => Math.ceil(line.length / columns)), reduce(0, (left, right) => left + right));
};
var clearOutputWithError = (outputText, columns, errorText) => {
  if (errorText !== void 0 && errorText.length > 0) {
    return cursorDown(lines(errorText, columns)) + eraseText(`
${errorText}`, columns) + eraseText(outputText, columns);
  }
  return eraseText(outputText, columns);
};
var renderBeep = beep;
var NEWLINE_REGEXP = /\r?\n/;
var handleConfirmClear = (options) => {
  return fnUntraced2(function* (state, _) {
    const terminal = yield* Terminal;
    const columns = yield* terminal.columns;
    const figures = yield* getTheme(options);
    const confirmMessage = state.value ? options.placeholder.defaultConfirm : options.placeholder.defaultDeny;
    const promptText = renderConfirmOutput(confirmMessage, figures.prefix, figures.pointerSmall, options, {
      plain: true
    });
    const clearOutput = eraseText(promptText, columns);
    const resetCurrentLine = eraseLine + cursorLeft;
    return clearOutput + resetCurrentLine;
  });
};
var renderConfirmOutput = (confirm2, leadingSymbol, trailingSymbol, options, renderOptions) => renderPrompt(confirm2, options.message, leadingSymbol, trailingSymbol, renderOptions);
var renderConfirmNextFrame = /* @__PURE__ */ fnUntraced2(function* (state, options) {
  const figures = yield* getTheme(options);
  const leadingSymbol = annotateSymbol(figures.prefix, figures.primaryColor);
  const trailingSymbol = annotateSymbol(figures.pointerSmall, figures.mutedColor);
  const confirmMessage = state.value ? options.placeholder.defaultConfirm : options.placeholder.defaultDeny;
  const confirm2 = annotate2(confirmMessage, figures.mutedColor);
  const promptMsg = renderConfirmOutput(confirm2, leadingSymbol, trailingSymbol, options);
  return cursorHide + promptMsg;
});
var renderConfirmSubmission = /* @__PURE__ */ fnUntraced2(function* (value3, options) {
  const figures = yield* getTheme(options);
  const leadingSymbol = annotateSymbol(figures.tick, figures.successColor);
  const trailingSymbol = annotateSymbol(figures.ellipsis, figures.mutedColor);
  const confirmMessage = value3 ? options.label.confirm : options.label.deny;
  const promptMsg = renderConfirmOutput(confirmMessage, leadingSymbol, trailingSymbol, options);
  return promptMsg + "\n";
});
var handleConfirmRender = (options) => {
  return (_, action2) => {
    return Action.$match(action2, {
      Beep: () => succeed6(renderBeep),
      NextFrame: ({
        state
      }) => renderConfirmNextFrame(state, options),
      Submit: ({
        value: value3
      }) => renderConfirmSubmission(value3, options)
    });
  };
};
var TRUE_VALUE_REGEXP = /^y|t$/;
var FALSE_VALUE_REGEXP = /^n|f$/;
var handleConfirmProcess = (input, defaultValue) => {
  const value3 = getOrElse(input.input, () => "");
  if (input.key.name === "enter" || input.key.name === "return") {
    return succeed6(Action.Submit({
      value: defaultValue
    }));
  }
  if (TRUE_VALUE_REGEXP.test(value3.toLowerCase())) {
    return succeed6(Action.Submit({
      value: true
    }));
  }
  if (FALSE_VALUE_REGEXP.test(value3.toLowerCase())) {
    return succeed6(Action.Submit({
      value: false
    }));
  }
  return succeed6(Action.Beep());
};
var handleDateClear = (options) => {
  return fnUntraced2(function* (state, _) {
    const terminal = yield* Terminal;
    const columns = yield* terminal.columns;
    const figures = yield* getTheme(options);
    const resetCurrentLine = eraseLine + cursorLeft;
    const parts = reduce(state.dateParts, "", (doc, part) => doc + part.toString());
    const promptText = renderDateOutput(figures.prefix, figures.pointerSmall, parts, options, {
      plain: true
    });
    const errorText = isSome2(state.error) ? match3(state.error.value.split(NEWLINE_REGEXP), {
      onEmpty: () => "",
      onNonEmpty: (errorLines) => separateSymbol(figures.pointerSmall, errorLines.join("\n"))
    }) : "";
    const clearOutput = clearOutputWithError(promptText, columns, errorText);
    return clearOutput + resetCurrentLine;
  });
};
var renderDateError = (state, pointer, theme) => {
  if (isSome2(state.error)) {
    const errorLines = state.error.value.split(NEWLINE_REGEXP);
    if (isReadonlyArrayNonEmpty(errorLines)) {
      const prefix = annotateSymbol(pointer, theme.errorColor);
      const lines2 = map2(errorLines, (str) => annotateErrorLine(str, theme.errorColor));
      return cursorSavePosition + "\n" + separateSymbol(prefix, lines2.join("\n")) + cursorRestorePosition;
    }
  }
  return "";
};
var renderParts = (state, theme, submitted = false) => {
  return reduce(state.dateParts, "", (doc, part, currentIndex) => {
    const partDoc = part.toString();
    if (currentIndex === state.cursor && !submitted) {
      const annotation = combine3(underlined, theme.primaryColor);
      return doc + annotate2(partDoc, annotation);
    }
    return doc + partDoc;
  });
};
var renderDateOutput = (leadingSymbol, trailingSymbol, parts, options, renderOptions) => renderPrompt(parts, options.message, leadingSymbol, trailingSymbol, renderOptions);
var renderDateNextFrame = /* @__PURE__ */ fnUntraced2(function* (state, options) {
  const figures = yield* getTheme(options);
  const leadingSymbol = annotateSymbol(figures.prefix, figures.primaryColor);
  const trailingSymbol = annotateSymbol(figures.pointerSmall, figures.mutedColor);
  const parts = renderParts(state, figures);
  const promptMsg = renderDateOutput(leadingSymbol, trailingSymbol, parts, options);
  const errorMsg = renderDateError(state, figures.pointerSmall, figures);
  return cursorHide + promptMsg + errorMsg;
});
var renderDateSubmission = /* @__PURE__ */ fnUntraced2(function* (state, options) {
  const figures = yield* getTheme(options);
  const leadingSymbol = annotateSymbol(figures.tick, figures.successColor);
  const trailingSymbol = annotateSymbol(figures.ellipsis, figures.mutedColor);
  const parts = renderParts(state, figures, true);
  const promptMsg = renderDateOutput(leadingSymbol, trailingSymbol, parts, options);
  return promptMsg + "\n";
});
var processUp = (state) => {
  state.dateParts[state.cursor].increment();
  return Action.NextFrame({
    state: {
      ...state,
      typed: ""
    }
  });
};
var processDown = (state) => {
  state.dateParts[state.cursor].decrement();
  return Action.NextFrame({
    state: {
      ...state,
      typed: ""
    }
  });
};
var processDateCursorLeft = (state) => {
  const previous = state.dateParts[state.cursor].previousPart();
  if (isSome2(previous)) {
    return Action.NextFrame({
      state: {
        ...state,
        typed: "",
        cursor: state.dateParts.indexOf(previous.value)
      }
    });
  }
  return Action.Beep();
};
var processDateCursorRight = (state) => {
  const next = state.dateParts[state.cursor].nextPart();
  if (isSome2(next)) {
    return Action.NextFrame({
      state: {
        ...state,
        typed: "",
        cursor: state.dateParts.indexOf(next.value)
      }
    });
  }
  return Action.Beep();
};
var processDateNext = (state) => {
  const next = state.dateParts[state.cursor].nextPart();
  const cursor = match(next, {
    onNone: () => state.dateParts.findIndex((part) => !part.isToken()),
    onSome: (next2) => state.dateParts.indexOf(next2)
  });
  return Action.NextFrame({
    state: {
      ...state,
      cursor
    }
  });
};
var defaultDateProcessor = (value3, state) => {
  if (/\d/.test(value3)) {
    const typed = state.typed + value3;
    state.dateParts[state.cursor].setValue(typed);
    return Action.NextFrame({
      state: {
        ...state,
        typed
      }
    });
  }
  return Action.Beep();
};
var defaultLocales = {
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  weekdaysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
};
var handleDateRender = (options) => {
  return (state, action2) => {
    return Action.$match(action2, {
      Beep: () => succeed6(renderBeep),
      NextFrame: ({
        state: state2
      }) => renderDateNextFrame(state2, options),
      Submit: () => renderDateSubmission(state, options)
    });
  };
};
var handleDateProcess = (options) => {
  return (input, state) => {
    switch (input.key.name) {
      case "left": {
        return succeed6(processDateCursorLeft(state));
      }
      case "right": {
        return succeed6(processDateCursorRight(state));
      }
      case "k":
      case "up": {
        return succeed6(processUp(state));
      }
      case "j":
      case "down": {
        return succeed6(processDown(state));
      }
      case "tab": {
        return succeed6(processDateNext(state));
      }
      case "enter":
      case "return": {
        return match6(options.validate(state.value), {
          onFailure: (error2) => Action.NextFrame({
            state: {
              ...state,
              error: some2(error2)
            }
          }),
          onSuccess: (value3) => Action.Submit({
            value: value3
          })
        });
      }
      default: {
        return succeed6(defaultDateProcessor(getOrElse(input.input, () => ""), state));
      }
    }
  };
};
var DATE_PART_REGEXP = /\\(.)|"((?:\\["\\]|[^"])+)"|(D[Do]?|d{3,4}|d)|(M{1,4})|(YY(?:YY)?)|([aA])|([Hh]{1,2})|(m{1,2})|(s{1,2})|(S{1,4})|./g;
var regExpGroups = {
  1: ({
    token,
    ...opts
  }) => new Token({
    token: token.replace(/\\(.)/g, "$1"),
    ...opts
  }),
  2: (opts) => new Day(opts),
  3: (opts) => new Month(opts),
  4: (opts) => new Year(opts),
  5: (opts) => new Meridiem(opts),
  6: (opts) => new Hours(opts),
  7: (opts) => new Minutes(opts),
  8: (opts) => new Seconds(opts),
  9: (opts) => new Milliseconds(opts)
};
var makeDateParts = (dateMask, date6, locales) => {
  const parts = [];
  let result3 = null;
  while (result3 = DATE_PART_REGEXP.exec(dateMask)) {
    const match7 = result3.shift();
    const index = result3.findIndex((group2) => group2 !== void 0);
    if (index in regExpGroups) {
      const token = result3[index] || match7;
      parts.push(regExpGroups[index]({
        token,
        date: date6,
        parts,
        locales
      }));
    } else {
      parts.push(new Token({
        token: result3[index] || match7,
        date: date6,
        parts,
        locales
      }));
    }
  }
  const orderedParts = parts.reduce((array2, element) => {
    const lastElement = array2[array2.length - 1];
    if (element.isToken() && lastElement !== void 0 && lastElement.isToken()) {
      lastElement.setValue(element.token);
    } else {
      array2.push(element);
    }
    return array2;
  }, empty2());
  parts.splice(0, parts.length, ...orderedParts);
  return parts;
};
var DatePart = class {
  token;
  date;
  parts;
  locales;
  constructor(params) {
    this.token = params.token;
    this.locales = params.locales;
    this.date = params.date || /* @__PURE__ */ new Date();
    this.parts = params.parts || [this];
  }
  /**
   * Returns `true` if this `DatePart` is a `Token`, `false` otherwise.
   */
  isToken() {
    return false;
  }
  /**
   * Retrieves the next date part in the list of parts.
   */
  nextPart() {
    const currentPartIndex = getOrElse(findFirstIndex(this.parts, (part) => part === this), () => 0);
    return findFirst2(this.parts.slice(currentPartIndex + 1), (part) => !part.isToken());
  }
  /**
   * Retrieves the previous date part in the list of parts.
   */
  previousPart() {
    const currentPartIndex = findFirstIndex(this.parts, (part) => part === this);
    if (isSome2(currentPartIndex)) {
      return findLast(this.parts.slice(0, currentPartIndex.value), (part) => !part.isToken());
    }
    return none2();
  }
  toString() {
    return String(this.date);
  }
};
var Token = class extends DatePart {
  increment() {
  }
  decrement() {
  }
  setValue(value3) {
    this.token = this.token + value3;
  }
  isToken() {
    return true;
  }
  toString() {
    return this.token;
  }
};
var Milliseconds = class extends DatePart {
  increment() {
    this.date.setMilliseconds(this.date.getMilliseconds() + 1);
  }
  decrement() {
    this.date.setMilliseconds(this.date.getMilliseconds() - 1);
  }
  setValue(value3) {
    this.date.setMilliseconds(Number.parseInt(value3.slice(-this.token.length)));
  }
  toString() {
    const millis2 = `${this.date.getMilliseconds()}`;
    return millis2.padStart(4, "0").substring(0, this.token.length);
  }
};
var Seconds = class extends DatePart {
  increment() {
    this.date.setSeconds(this.date.getSeconds() + 1);
  }
  decrement() {
    this.date.setSeconds(this.date.getSeconds() - 1);
  }
  setValue(value3) {
    this.date.setSeconds(Number.parseInt(value3.slice(-2)));
  }
  toString() {
    const seconds2 = `${this.date.getSeconds()}`;
    return this.token.length > 1 ? seconds2.padStart(2, "0") : seconds2;
  }
};
var Minutes = class extends DatePart {
  increment() {
    this.date.setMinutes(this.date.getMinutes() + 1);
  }
  decrement() {
    this.date.setMinutes(this.date.getMinutes() - 1);
  }
  setValue(value3) {
    this.date.setMinutes(Number.parseInt(value3.slice(-2)));
  }
  toString() {
    const minutes2 = `${this.date.getMinutes()}`;
    return this.token.length > 1 ? minutes2.padStart(2, "0") : minutes2;
  }
};
var Hours = class extends DatePart {
  increment() {
    this.date.setHours(this.date.getHours() + 1);
  }
  decrement() {
    this.date.setHours(this.date.getHours() - 1);
  }
  setValue(value3) {
    this.date.setHours(Number.parseInt(value3.slice(-2)));
  }
  toString() {
    const hours2 = /h/.test(this.token) ? this.date.getHours() % 12 || 12 : this.date.getHours();
    return this.token.length > 1 ? `${hours2}`.padStart(2, "0") : `${hours2}`;
  }
};
var Day = class extends DatePart {
  increment() {
    this.date.setDate(this.date.getDate() + 1);
  }
  decrement() {
    this.date.setDate(this.date.getDate() - 1);
  }
  setValue(value3) {
    this.date.setDate(Number.parseInt(value3.slice(-2)));
  }
  toString() {
    const date6 = this.date.getDate();
    const day = this.date.getDay();
    switch (this.token) {
      case "DD":
        return `${date6}`.padStart(2, "0");
      case "Do":
        return `${date6}${this.ordinalIndicator(date6)}`;
      case "d":
        return `${day + 1}`;
      case "ddd":
        return this.locales.weekdaysShort[day];
      case "dddd":
        return this.locales.weekdays[day];
      default:
        return `${date6}`;
    }
  }
  ordinalIndicator(day) {
    if (day >= 11 && day <= 13) {
      return "th";
    }
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }
};
var Month = class extends DatePart {
  increment() {
    this.date.setMonth(this.date.getMonth() + 1);
  }
  decrement() {
    this.date.setMonth(this.date.getMonth() - 1);
  }
  setValue(value3) {
    const month = Number.parseInt(value3.slice(-2)) - 1;
    this.date.setMonth(month < 0 ? 0 : month);
  }
  toString() {
    const month = this.date.getMonth();
    switch (this.token.length) {
      case 2:
        return `${month + 1}`.padStart(2, "0");
      case 3:
        return this.locales.monthsShort[month];
      case 4:
        return this.locales.months[month];
      default:
        return `${month + 1}`;
    }
  }
};
var Year = class extends DatePart {
  increment() {
    this.date.setFullYear(this.date.getFullYear() + 1);
  }
  decrement() {
    this.date.setFullYear(this.date.getFullYear() - 1);
  }
  setValue(value3) {
    this.date.setFullYear(Number.parseInt(value3.slice(-4)));
  }
  toString() {
    const year = `${this.date.getFullYear()}`.padStart(4, "0");
    return this.token.length === 2 ? year.slice(-2) : year;
  }
};
var Meridiem = class extends DatePart {
  increment() {
    this.date.setHours((this.date.getHours() + 12) % 24);
  }
  decrement() {
    this.increment();
  }
  setValue(_value) {
  }
  toString() {
    const meridiem = this.date.getHours() >= 12 ? "pm" : "am";
    return /A/.test(this.token) ? meridiem.toUpperCase() : meridiem;
  }
};
var renderPrompt = (confirm2, message, leadingSymbol, trailingSymbol, options) => {
  const prefix = leadingSymbol.length === 0 ? "" : leadingSymbol + " ";
  const renderLine = (line) => {
    let output = prefix + line;
    if (trailingSymbol.length > 0) {
      output += " " + trailingSymbol;
    }
    if (confirm2.length > 0) {
      output += " " + confirm2;
    } else if (trailingSymbol.length > 0) {
      output += " ";
    }
    return output;
  };
  const annotate4 = options?.plain === true ? (line) => line : annotateLine;
  return match3(message.split(NEWLINE_REGEXP), {
    onEmpty: () => renderLine(""),
    onNonEmpty: (promptLines) => {
      const lines2 = map2(promptLines, (line) => annotate4(line));
      return renderLine(lines2.join("\n"));
    }
  });
};
var renderChoiceDescription = (choice5, isActive, theme, renderOptions) => {
  if (!choice5.disabled && choice5.description && isActive) {
    const text2 = theme.descriptionSeparator + choice5.description;
    return renderOptions?.plain === true ? text2 : annotate2(text2, theme.mutedColor);
  }
  return "";
};
var handleNumberClear = (options) => {
  return fnUntraced2(function* (state, _) {
    const terminal = yield* Terminal;
    const columns = yield* terminal.columns;
    const figures = yield* getTheme(options);
    const resetCurrentLine = eraseLine + cursorLeft;
    const errorText = renderNumberError(state, figures.pointerSmall, figures, {
      plain: true
    });
    const promptText = renderNumberOutput(state, figures.prefix, figures.pointerSmall, options, figures, {
      plain: true
    });
    const clearOutput = clearOutputWithError(promptText, columns, errorText);
    return clearOutput + resetCurrentLine;
  });
};
var renderNumberInput = (state, submitted, theme, renderOptions) => {
  const value3 = state.value === "" ? "" : `${state.value}`;
  if (submitted || renderOptions?.plain === true) {
    return value3;
  }
  const annotation = isSome2(state.error) ? theme.errorColor : combine3(underlined, theme.primaryColor);
  return annotate2(value3, annotation);
};
var renderNumberError = (state, pointer, theme, renderOptions) => {
  if (isSome2(state.error)) {
    return match3(state.error.value.split(NEWLINE_REGEXP), {
      onEmpty: () => "",
      onNonEmpty: (errorLines) => {
        if (renderOptions?.plain === true) {
          return separateSymbol(pointer, errorLines.join("\n"));
        }
        const prefix = annotateSymbol(pointer, theme.errorColor);
        const lines2 = map2(errorLines, (str) => annotateErrorLine(str, theme.errorColor));
        return cursorSavePosition + "\n" + separateSymbol(prefix, lines2.join("\n")) + cursorRestorePosition;
      }
    });
  }
  return "";
};
var renderNumberOutput = (state, leadingSymbol, trailingSymbol, options, theme, renderOptions, submitted = false) => {
  const value3 = renderNumberInput(state, submitted, theme, renderOptions);
  return renderPrompt(value3, options.message, leadingSymbol, trailingSymbol, renderOptions);
};
var renderNumberNextFrame = /* @__PURE__ */ fnUntraced2(function* (state, options) {
  const figures = yield* getTheme(options);
  const leadingSymbol = annotateSymbol(figures.prefix, figures.primaryColor);
  const trailingSymbol = annotateSymbol(figures.pointerSmall, figures.mutedColor);
  const errorMsg = renderNumberError(state, figures.pointerSmall, figures);
  const promptMsg = renderNumberOutput(state, leadingSymbol, trailingSymbol, options, figures);
  return promptMsg + errorMsg;
});
var renderNumberSubmission = /* @__PURE__ */ fnUntraced2(function* (nextState, options) {
  const figures = yield* getTheme(options);
  const leadingSymbol = annotateSymbol(figures.tick, figures.successColor);
  const trailingSymbol = annotateSymbol(figures.ellipsis, figures.mutedColor);
  const promptMsg = renderNumberOutput(nextState, leadingSymbol, trailingSymbol, options, figures, void 0, true);
  return promptMsg + "\n";
});
var processNumberBackspace = (state) => {
  if (state.value.length <= 0) {
    return succeed6(Action.Beep());
  }
  const value3 = state.value.slice(0, state.value.length - 1);
  return succeed6(Action.NextFrame({
    state: {
      ...state,
      value: value3,
      error: none2()
    }
  }));
};
var processNumberClear = (state) => succeed6(Action.NextFrame({
  state: {
    ...state,
    cursor: 0,
    value: "",
    error: none2()
  }
}));
var defaultIntProcessor = (input, state) => {
  if (state.value.length === 0 && input === "-") {
    return succeed6(Action.NextFrame({
      state: {
        ...state,
        value: "-",
        error: none2()
      }
    }));
  }
  const parsed = Number.parseInt(state.value + input);
  if (Number.isNaN(parsed)) {
    return succeed6(Action.Beep());
  } else {
    return succeed6(Action.NextFrame({
      state: {
        ...state,
        value: `${parsed}`,
        error: none2()
      }
    }));
  }
};
var defaultFloatProcessor = (input, state) => {
  if (input === "." && state.value.includes(".")) {
    return succeed6(Action.Beep());
  }
  if (state.value.length === 0 && input === "-") {
    return succeed6(Action.NextFrame({
      state: {
        ...state,
        value: "-",
        error: none2()
      }
    }));
  }
  const parsed = Number.parseFloat(state.value + input);
  if (Number.isNaN(parsed)) {
    return succeed6(Action.Beep());
  } else {
    return succeed6(Action.NextFrame({
      state: {
        ...state,
        value: input === "." ? `${parsed}.` : state.value.includes(".") && /^\d$/.test(input) ? state.value + input : `${parsed}`,
        error: none2()
      }
    }));
  }
};
var handleRenderInteger = (options) => {
  return (state, action2) => {
    return Action.$match(action2, {
      Beep: () => succeed6(renderBeep),
      NextFrame: ({
        state: state2
      }) => renderNumberNextFrame(state2, options),
      Submit: () => renderNumberSubmission(state, options)
    });
  };
};
var handleProcessInteger = (options) => {
  return (input, state) => {
    if (input.key.ctrl && input.key.name === "u") {
      return processNumberClear(state);
    }
    switch (input.key.name) {
      case "backspace": {
        return processNumberBackspace(state);
      }
      case "k":
      case "up": {
        return succeed6(Action.NextFrame({
          state: {
            ...state,
            value: state.value === "" || state.value === "-" ? `${options.incrementBy}` : `${Number.parseInt(state.value) + options.incrementBy}`,
            error: none2()
          }
        }));
      }
      case "j":
      case "down": {
        return succeed6(Action.NextFrame({
          state: {
            ...state,
            value: state.value === "" || state.value === "-" ? `-${options.decrementBy}` : `${Number.parseInt(state.value) - options.decrementBy}`,
            error: none2()
          }
        }));
      }
      case "enter":
      case "return": {
        const parsed = Number.parseInt(state.value);
        if (Number.isNaN(parsed)) {
          return succeed6(Action.NextFrame({
            state: {
              ...state,
              error: some2("Must provide an integer value")
            }
          }));
        } else {
          return match6(options.validate(parsed), {
            onFailure: (error2) => Action.NextFrame({
              state: {
                ...state,
                error: some2(error2)
              }
            }),
            onSuccess: (value3) => Action.Submit({
              value: value3
            })
          });
        }
      }
      default: {
        return defaultIntProcessor(getOrElse(input.input, () => ""), state);
      }
    }
  };
};
var handleRenderFloat = (options) => {
  return (state, action2) => {
    return Action.$match(action2, {
      Beep: () => succeed6(renderBeep),
      NextFrame: ({
        state: state2
      }) => renderNumberNextFrame(state2, options),
      Submit: () => renderNumberSubmission(state, options)
    });
  };
};
var handleProcessFloat = (options) => {
  return (input, state) => {
    if (input.key.ctrl && input.key.name === "u") {
      return processNumberClear(state);
    }
    switch (input.key.name) {
      case "backspace": {
        return processNumberBackspace(state);
      }
      case "k":
      case "up": {
        return succeed6(Action.NextFrame({
          state: {
            ...state,
            value: state.value === "" || state.value === "-" ? `${options.incrementBy}` : `${Number.parseFloat(state.value) + options.incrementBy}`,
            error: none2()
          }
        }));
      }
      case "j":
      case "down": {
        return succeed6(Action.NextFrame({
          state: {
            ...state,
            value: state.value === "" || state.value === "-" ? `-${options.decrementBy}` : `${Number.parseFloat(state.value) - options.decrementBy}`,
            error: none2()
          }
        }));
      }
      case "enter":
      case "return": {
        const parsed = Number.parseFloat(state.value);
        if (Number.isNaN(parsed)) {
          return succeed6(Action.NextFrame({
            state: {
              ...state,
              error: some2("Must provide a floating point value")
            }
          }));
        } else {
          return flatMap3(sync2(() => round(parsed, options.precision)), (rounded) => match6(options.validate(rounded), {
            onFailure: (error2) => Action.NextFrame({
              state: {
                ...state,
                error: some2(error2)
              }
            }),
            onSuccess: (value3) => Action.Submit({
              value: value3
            })
          }));
        }
      }
      default: {
        return defaultFloatProcessor(getOrElse(input.input, () => ""), state);
      }
    }
  };
};
var renderSelectOutput = (leadingSymbol, trailingSymbol, options, renderOptions) => renderPrompt("", options.message, leadingSymbol, trailingSymbol, renderOptions);
var renderChoicePrefix = (state, choices, toDisplay, currentIndex, figures, renderOptions) => {
  const prefix = renderPagingPrefix(figures, currentIndex === toDisplay.startIndex && toDisplay.startIndex > 0, currentIndex === toDisplay.endIndex - 1 && toDisplay.endIndex < choices.length);
  if (renderOptions?.plain === true) {
    return state === currentIndex ? figures.pointer + prefix : prefix + " ".repeat(figures.pointer.length);
  }
  if (choices[currentIndex].disabled) {
    const annotation = combine3(bold, figures.mutedColor);
    return state === currentIndex ? annotateSymbol(figures.pointer, annotation) + prefix : prefix + " ".repeat(figures.pointer.length);
  }
  return state === currentIndex ? annotateSymbol(figures.pointer, figures.primaryColor) + prefix : prefix + " ".repeat(figures.pointer.length);
};
var renderChoiceTitle = (choice5, isSelected, theme, renderOptions) => {
  if (renderOptions?.plain === true) {
    return choice5.title;
  }
  const title = choice5.title;
  if (isSelected) {
    return choice5.disabled ? annotate2(title, combine3(underlined, theme.mutedColor)) : annotate2(title, combine3(underlined, theme.primaryColor));
  }
  return choice5.disabled ? annotate2(title, combine3(strikethrough, theme.mutedColor)) : title;
};
var renderSelectChoices = (state, options, figures, renderOptions) => {
  const choices = options.choices;
  const toDisplay = entriesToDisplay(state, choices.length, options.maxPerPage);
  const documents = [];
  for (let index = toDisplay.startIndex; index < toDisplay.endIndex; index++) {
    const choice5 = choices[index];
    const isSelected = state === index;
    const prefix = renderChoicePrefix(state, choices, toDisplay, index, figures, renderOptions);
    const title = renderChoiceTitle(choice5, isSelected, figures, renderOptions);
    const description = renderChoiceDescription(choice5, isSelected, figures, renderOptions);
    documents.push(prefix + title + " " + description);
  }
  return documents.join("\n");
};
var renderSelectNextFrame = /* @__PURE__ */ fnUntraced2(function* (state, options) {
  const figures = yield* getTheme(options);
  const choices = renderSelectChoices(state, options, figures);
  const leadingSymbol = annotateSymbol(figures.prefix, figures.primaryColor);
  const trailingSymbol = annotateSymbol(figures.pointerSmall, figures.mutedColor);
  const promptMsg = renderSelectOutput(leadingSymbol, trailingSymbol, options);
  return cursorHide + promptMsg + "\n" + choices;
});
var renderSelectSubmission = /* @__PURE__ */ fnUntraced2(function* (state, options) {
  const figures = yield* getTheme(options);
  const selected = options.choices[state].title;
  const leadingSymbol = annotateSymbol(figures.tick, figures.successColor);
  const trailingSymbol = annotateSymbol(figures.ellipsis, figures.mutedColor);
  const promptMsg = renderSelectOutput(leadingSymbol, trailingSymbol, options);
  return promptMsg + " " + annotate2(selected, figures.submittedColor) + "\n";
});
var processSelectCursorUp = (state, choices) => {
  if (state === 0) {
    return succeed6(Action.NextFrame({
      state: choices.length - 1
    }));
  }
  return succeed6(Action.NextFrame({
    state: state - 1
  }));
};
var processSelectCursorDown = (state, choices) => {
  if (state === choices.length - 1) {
    return succeed6(Action.NextFrame({
      state: 0
    }));
  }
  return succeed6(Action.NextFrame({
    state: state + 1
  }));
};
var processSelectNext = (state, choices) => {
  return succeed6(Action.NextFrame({
    state: (state + 1) % choices.length
  }));
};
var handleSelectRender = (options) => {
  return (state, action2) => {
    return Action.$match(action2, {
      Beep: () => succeed6(renderBeep),
      NextFrame: ({
        state: state2
      }) => renderSelectNextFrame(state2, options),
      Submit: () => renderSelectSubmission(state, options)
    });
  };
};
var handleSelectClear = (options) => fnUntraced2(function* (state, _) {
  const terminal = yield* Terminal;
  const columns = yield* terminal.columns;
  const figures = yield* getTheme(options);
  const clearPrompt = eraseLine + cursorLeft;
  const promptText = renderSelectOutput(figures.prefix, figures.pointerSmall, options, {
    plain: true
  });
  const choicesText = renderSelectChoices(state, options, figures, {
    plain: true
  });
  const clearOutput = eraseText(`${promptText}
${choicesText}`, columns);
  return clearOutput + clearPrompt;
});
var handleSelectProcess = (options) => {
  return (input, state) => {
    switch (input.key.name) {
      case "k":
      case "up": {
        return processSelectCursorUp(state, options.choices);
      }
      case "j":
      case "down": {
        return processSelectCursorDown(state, options.choices);
      }
      case "tab": {
        return processSelectNext(state, options.choices);
      }
      case "enter":
      case "return": {
        const selected = options.choices[state];
        if (selected.disabled) {
          return succeed6(Action.Beep());
        }
        return succeed6(Action.Submit({
          value: selected.value
        }));
      }
      default: {
        return succeed6(Action.Beep());
      }
    }
  };
};
var renderClearScreen = /* @__PURE__ */ fnUntraced2(function* (state, options) {
  const terminal = yield* Terminal;
  const columns = yield* terminal.columns;
  const figures = yield* getTheme(options);
  const resetCurrentLine = eraseLine + cursorLeft;
  const errorText = renderTextError(state, figures.pointerSmall, figures, {
    plain: true
  });
  const clearOutput = clearOutputWithError(renderTextOutput(state, figures.prefix, figures.pointerSmall, options, figures, {
    plain: true
  }), columns, errorText);
  return clearOutput + resetCurrentLine;
});
var renderTextInput = (nextState, options, theme, submitted, renderOptions) => {
  const text2 = nextState.value;
  if (renderOptions?.plain === true) {
    switch (options.type) {
      case "hidden": {
        return "";
      }
      case "password": {
        return theme.passwordMask.repeat(text2.length);
      }
      case "text": {
        return text2;
      }
    }
  }
  if (text2.length === 0) {
    return "";
  }
  const annotation = isSome2(nextState.error) ? theme.errorColor : submitted ? theme.submittedColor : combine3(underlined, theme.primaryColor);
  switch (options.type) {
    case "hidden": {
      return "";
    }
    case "password": {
      return annotateSymbol(theme.passwordMask.repeat(text2.length), annotation);
    }
    case "text": {
      return annotate2(text2, annotation);
    }
  }
};
var renderTextError = (nextState, pointer, theme, renderOptions) => {
  if (isSome2(nextState.error)) {
    return match3(nextState.error.value.split(NEWLINE_REGEXP), {
      onEmpty: () => "",
      onNonEmpty: (errorLines) => {
        if (renderOptions?.plain === true) {
          return separateSymbol(pointer, errorLines.join("\n"));
        }
        const prefix = annotateSymbol(pointer, theme.errorColor);
        const lines2 = map2(errorLines, (str) => annotateErrorLine(str, theme.errorColor));
        return cursorSavePosition + "\n" + separateSymbol(prefix, lines2.join("\n")) + cursorRestorePosition;
      }
    });
  }
  return "";
};
var renderTextOutput = (nextState, leadingSymbol, trailingSymbol, options, theme, renderOptions, submitted = false) => {
  const value3 = renderTextInput(nextState, options, theme, submitted, renderOptions);
  return renderPrompt(value3, options.message, leadingSymbol, trailingSymbol, renderOptions);
};
var renderTextNextFrame = /* @__PURE__ */ fnUntraced2(function* (state, options) {
  const figures = yield* getTheme(options);
  const leadingSymbol = annotateSymbol(figures.prefix, figures.primaryColor);
  const trailingSymbol = annotateSymbol(figures.pointerSmall, figures.mutedColor);
  const promptMsg = renderTextOutput(state, leadingSymbol, trailingSymbol, options, figures);
  const errorMsg = renderTextError(state, figures.pointerSmall, figures);
  const cursorWidth = options.type === "password" ? figures.passwordMask.length : 1;
  const offset = (state.cursor - state.value.length) * cursorWidth;
  return promptMsg + errorMsg + cursorMove(offset);
});
var renderTextSubmission = /* @__PURE__ */ fnUntraced2(function* (state, options) {
  const figures = yield* getTheme(options);
  const leadingSymbol = annotateSymbol(figures.tick, figures.successColor);
  const trailingSymbol = annotateSymbol(figures.ellipsis, figures.mutedColor);
  const promptMsg = renderTextOutput(state, leadingSymbol, trailingSymbol, options, figures, void 0, true);
  return promptMsg + "\n";
});
var processTextBackspace = (state) => {
  if (state.cursor <= 0) {
    return succeed6(Action.Beep());
  }
  const beforeCursor = state.value.slice(0, state.cursor - 1);
  const afterCursor = state.value.slice(state.cursor);
  const cursor = state.cursor - 1;
  const value3 = `${beforeCursor}${afterCursor}`;
  return succeed6(Action.NextFrame({
    state: {
      ...state,
      cursor,
      value: value3,
      error: none2()
    }
  }));
};
var processTextClear = (state) => succeed6(Action.NextFrame({
  state: {
    ...state,
    cursor: 0,
    value: "",
    error: none2()
  }
}));
var processTextCursorLeft = (state) => {
  if (state.cursor <= 0) {
    return succeed6(Action.Beep());
  }
  const cursor = state.cursor - 1;
  return succeed6(Action.NextFrame({
    state: {
      ...state,
      cursor,
      error: none2()
    }
  }));
};
var processTextCursorRight = (state) => {
  if (state.cursor >= state.value.length) {
    return succeed6(Action.Beep());
  }
  const cursor = Math.min(state.cursor + 1, state.value.length);
  return succeed6(Action.NextFrame({
    state: {
      ...state,
      cursor,
      error: none2()
    }
  }));
};
var processTextCursorStart = (state) => succeed6(Action.NextFrame({
  state: {
    ...state,
    cursor: 0,
    error: none2()
  }
}));
var processTextCursorEnd = (state) => succeed6(Action.NextFrame({
  state: {
    ...state,
    cursor: state.value.length,
    error: none2()
  }
}));
var processTab = (state, options) => {
  if (state.value === options.default) {
    return succeed6(Action.Beep());
  }
  const value3 = state.value.length === 0 ? options.default : state.value;
  return succeed6(Action.NextFrame({
    state: {
      ...state,
      value: value3,
      cursor: value3.length,
      error: none2()
    }
  }));
};
var defaultTextProcessor = (input, state) => {
  const beforeCursor = state.value.slice(0, state.cursor);
  const afterCursor = state.value.slice(state.cursor);
  const value3 = `${beforeCursor}${input}${afterCursor}`;
  const cursor = state.cursor + input.length;
  return succeed6(Action.NextFrame({
    state: {
      ...state,
      cursor,
      value: value3,
      error: none2()
    }
  }));
};
var handleTextRender = (options) => {
  return (state, action2) => {
    return Action.$match(action2, {
      Beep: () => succeed6(renderBeep),
      NextFrame: ({
        state: state2
      }) => renderTextNextFrame(state2, options),
      Submit: () => renderTextSubmission(state, options)
    });
  };
};
var handleTextProcess = (options) => {
  return (input, state) => {
    if (input.key.ctrl) {
      switch (input.key.name) {
        case "u": {
          return processTextClear(state);
        }
        case "a": {
          return processTextCursorStart(state);
        }
        case "e": {
          return processTextCursorEnd(state);
        }
        default: {
          return succeed6(Action.Beep());
        }
      }
    }
    switch (input.key.name) {
      case "backspace": {
        return processTextBackspace(state);
      }
      case "left": {
        return processTextCursorLeft(state);
      }
      case "right": {
        return processTextCursorRight(state);
      }
      case "home": {
        return processTextCursorStart(state);
      }
      case "end": {
        return processTextCursorEnd(state);
      }
      case "enter":
      case "return": {
        const value3 = state.value;
        return match6(options.validate(value3), {
          onFailure: (error2) => Action.NextFrame({
            state: {
              ...state,
              value: value3,
              error: some2(error2)
            }
          }),
          onSuccess: (value4) => Action.Submit({
            value: value4
          })
        });
      }
      case "tab": {
        return processTab(state, options);
      }
      default: {
        return defaultTextProcessor(getOrElse(input.input, () => ""), state);
      }
    }
  };
};
var handleTextClear = (options) => {
  return (state, _) => {
    return renderClearScreen(state, options);
  };
};
var basePrompt = (options, type) => {
  const opts = {
    default: "",
    type,
    validate: succeed6,
    ...options
  };
  const initialState = {
    cursor: opts.default.length,
    value: opts.default,
    error: none2()
  };
  return custom(initialState, {
    render: handleTextRender(opts),
    process: handleTextProcess(opts),
    clear: handleTextClear(opts)
  });
};
var handleToggleClear = /* @__PURE__ */ fnUntraced2(function* (options) {
  const terminal = yield* Terminal;
  const columns = yield* terminal.columns;
  const figures = yield* getTheme(options);
  const clearPrompt = eraseLine + cursorLeft;
  const toggleText = options.active + " " + separateSymbol(figures.toggleSeparator, options.inactive);
  const promptText = renderPrompt(toggleText, options.message, figures.prefix, figures.pointerSmall, {
    plain: true
  });
  const clearOutput = eraseText(promptText, columns);
  return clearOutput + clearPrompt;
});
var renderToggle = (value3, options, theme, submitted = false) => {
  const separator = annotateSymbol(theme.toggleSeparator, theme.mutedColor);
  const selectedAnnotation = combine3(underlined, submitted ? theme.submittedColor : theme.primaryColor);
  const inactive = value3 ? options.inactive : annotate2(options.inactive, selectedAnnotation);
  const active = value3 ? annotate2(options.active, selectedAnnotation) : options.active;
  return active + " " + separateSymbol(separator, inactive);
};
var renderToggleOutput = (toggle2, leadingSymbol, trailingSymbol, options) => {
  return renderPrompt(toggle2, options.message, leadingSymbol, trailingSymbol);
};
var renderToggleNextFrame = /* @__PURE__ */ fnUntraced2(function* (state, options) {
  const figures = yield* getTheme(options);
  const leadingSymbol = annotateSymbol(figures.prefix, figures.primaryColor);
  const trailingSymbol = annotateSymbol(figures.pointerSmall, figures.mutedColor);
  const toggle2 = renderToggle(state, options, figures);
  const promptMsg = renderToggleOutput(toggle2, leadingSymbol, trailingSymbol, options);
  return cursorHide + promptMsg;
});
var renderToggleSubmission = /* @__PURE__ */ fnUntraced2(function* (value3, options) {
  const figures = yield* getTheme(options);
  const leadingSymbol = annotateSymbol(figures.tick, figures.successColor);
  const trailingSymbol = annotateSymbol(figures.ellipsis, figures.mutedColor);
  const toggle2 = renderToggle(value3, options, figures, true);
  const promptMsg = renderToggleOutput(toggle2, leadingSymbol, trailingSymbol, options);
  return promptMsg + "\n";
});
var activate = /* @__PURE__ */ succeed6(/* @__PURE__ */ Action.NextFrame({
  state: true
}));
var deactivate = /* @__PURE__ */ succeed6(/* @__PURE__ */ Action.NextFrame({
  state: false
}));
var handleToggleRender = (options) => {
  return (state, action2) => {
    switch (action2._tag) {
      case "Beep": {
        return succeed6(renderBeep);
      }
      case "NextFrame": {
        return renderToggleNextFrame(state, options);
      }
      case "Submit": {
        return renderToggleSubmission(state, options);
      }
    }
  };
};
var handleToggleProcess = (input, state) => {
  switch (input.key.name) {
    case "0":
    case "j":
    case "delete":
    case "right":
    case "down": {
      return deactivate;
    }
    case "1":
    case "k":
    case "left":
    case "up": {
      return activate;
    }
    case " ":
    case "tab": {
      return state ? deactivate : activate;
    }
    case "enter":
    case "return": {
      return succeed6(Action.Submit({
        value: state
      }));
    }
    default: {
      return succeed6(Action.Beep());
    }
  }
};
var entriesToDisplay = (cursor, total, maxVisible) => {
  const max2 = maxVisible === void 0 ? total : maxVisible;
  let startIndex = Math.min(total - max2, cursor - Math.floor(max2 / 2));
  if (startIndex < 0) {
    startIndex = 0;
  }
  const endIndex = Math.min(startIndex + max2, total);
  return {
    startIndex,
    endIndex
  };
};

// node_modules/effect/dist/unstable/cli/Param.js
var TypeId39 = "~effect/cli/Param";
var argumentKind = "argument";
var flagKind = "flag";
var Proto9 = {
  [TypeId39]: {
    _A: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var isParam = (u) => hasProperty(u, TypeId39);
var isFlagParam = (single) => single.kind === "flag";
var makeSingle2 = (params) => {
  const parse4 = (args2) => params.kind === argumentKind ? parsePositional(params.name, params.primitiveType, args2) : parseFlag(params.name, params.primitiveType, args2);
  return Object.setPrototypeOf({
    _tag: "Single",
    ...params,
    description: params.description ?? none2(),
    aliases: params.aliases ?? [],
    hidden: params.hidden ?? false,
    parse: parse4
  }, Proto9);
};
var string4 = (kind, name) => makeSingle2({
  name,
  primitiveType: string3,
  kind
});
var boolean3 = (kind, name) => makeSingle2({
  name,
  primitiveType: boolean2,
  kind
});
var integer3 = (kind, name) => makeSingle2({
  name,
  primitiveType: integer,
  kind
});
var float3 = (kind, name) => makeSingle2({
  name,
  primitiveType: float,
  kind
});
var date3 = (kind, name) => makeSingle2({
  name,
  primitiveType: date,
  kind
});
var choiceWithValue = (kind, name, choices) => makeSingle2({
  name,
  primitiveType: choice(choices),
  kind
});
var choice2 = (kind, name, choices) => {
  const mappedChoices = choices.map((value3) => [value3, value3]);
  return choiceWithValue(kind, name, mappedChoices);
};
var path2 = (kind, name, options) => makeSingle2({
  name,
  kind,
  primitiveType: path(options?.pathType ?? "either", options?.mustExist),
  typeName: options?.typeName
});
var directory = (kind, name, options) => path2(kind, name, {
  pathType: "directory",
  typeName: "directory",
  mustExist: options?.mustExist
});
var file = (kind, name, options) => path2(kind, name, {
  pathType: "file",
  typeName: "file",
  mustExist: options?.mustExist
});
var redacted2 = (kind, name) => makeSingle2({
  name,
  primitiveType: redacted,
  kind
});
var fileText2 = (kind, name) => makeSingle2({
  name,
  primitiveType: fileText,
  kind
});
var fileParse2 = (kind, name, options) => makeSingle2({
  name,
  primitiveType: fileParse(options),
  kind
});
var fileSchema2 = (kind, name, schema, options) => makeSingle2({
  name,
  primitiveType: fileSchema(schema, options),
  kind
});
var keyValuePair2 = (kind, name) => map11(variadic(makeSingle2({
  name,
  primitiveType: keyValuePair,
  kind
}), {
  min: 1
}), (objects) => Object.fromEntries(objects.flatMap(Object.entries)));
var none4 = (kind) => makeSingle2({
  name: "__none__",
  primitiveType: none3,
  kind
});
var FLAG_DASH_REGEXP = /^-+/;
var withAlias = /* @__PURE__ */ dual(2, (self, alias) => {
  return transformSingle(self, (single) => makeSingle2({
    ...single,
    aliases: [...single.aliases, alias.replace(FLAG_DASH_REGEXP, "")]
  }));
});
var withDescription = /* @__PURE__ */ dual(2, (self, description) => {
  return transformSingle(self, (single) => makeSingle2({
    ...single,
    description: some2(description)
  }));
});
var withHidden = (self) => transformSingle(self, (single) => makeSingle2({
  ...single,
  hidden: true
}));
var map11 = /* @__PURE__ */ dual(2, (self, f) => {
  const parse4 = (args2) => map6(self.parse(args2), ([operands, value3]) => [operands, f(value3)]);
  return Object.assign(Object.create(Proto9), {
    _tag: "Map",
    kind: self.kind,
    param: self,
    f,
    parse: parse4
  });
});
var transform3 = (self, f, alternatives = []) => {
  const alternativeParsers = alternatives.map((alternative) => () => alternative().parse);
  return Object.assign(Object.create(Proto9), {
    _tag: "Transform",
    kind: self.kind,
    param: self,
    alternatives,
    f,
    parse: f(self.parse, alternativeParsers)
  });
};
var mapEffect2 = /* @__PURE__ */ dual(2, (self, f) => transform3(self, (parse4) => (args2) => flatMap3(parse4(args2), ([leftover, a]) => f(a).pipe(map6((b) => [leftover, b])))));
var mapTryCatch = /* @__PURE__ */ dual(3, (self, f, onError4) => {
  const single = getUnderlyingSingleOrThrow(self);
  return transform3(self, (parse4) => (args2) => flatMap3(parse4(args2), ([leftover, a]) => try_2({
    try: () => f(a),
    catch: (error2) => onError4(error2)
  }).pipe(mapError2((error2) => new InvalidValue2({
    option: single.name,
    value: String(a),
    expected: error2,
    kind: single.kind
  })), map6((b) => [leftover, b]))));
});
var optional3 = (param) => {
  const parse4 = fnUntraced2(function* (args2) {
    getUnderlyingSingleOrThrow(param);
    return yield* param.parse(args2).pipe(
      map6(([leftover, value3]) => [leftover, some2(value3)]),
      // Catch both MissingOption (for flags) and MissingArgument (for positional arguments)
      catchTags2({
        MissingOption: () => succeed6([args2.arguments, none2()]),
        MissingArgument: () => succeed6([args2.arguments, none2()])
      })
    );
  });
  return Object.assign(Object.create(Proto9), {
    _tag: "Optional",
    kind: param.kind,
    param,
    parse: parse4
  });
};
var withDefault3 = /* @__PURE__ */ dual(2, (self, defaultValue) => {
  if (!isEffect2(defaultValue)) {
    return map11(optional3(self), getOrElse(() => defaultValue));
  }
  return mapEffect2(optional3(self), match({
    onNone: () => defaultValue,
    onSome: succeed6
  }));
});
var withFallbackConfig = /* @__PURE__ */ dual(2, (self, config) => {
  const toInvalidValue = (error2, configError) => new InvalidValue2({
    option: error2._tag === "MissingOption" ? error2.option : error2.argument,
    value: "config",
    expected: configError.message,
    kind: error2._tag === "MissingOption" ? "flag" : "argument"
  });
  const runConfig = (error2, args2) => option3(config).pipe(mapError2((configError) => toInvalidValue(error2, configError)), flatMap3(match({
    onNone: () => fail6(error2),
    onSome: (value3) => succeed6([args2.arguments, value3])
  })));
  return transform3(self, (parse4) => (args2) => parse4(args2).pipe(catchTag2(["MissingOption", "MissingArgument"], (error2) => runConfig(error2, args2))));
});
var withFallbackPrompt = /* @__PURE__ */ dual(2, (self, prompt) => {
  const runPrompt = (error2, args2) => flatMap3(isPrompt(prompt) ? succeed6(prompt) : prompt, run3).pipe(map6((value3) => [args2.arguments, value3]), catchTag2("QuitError", () => fail6(error2)));
  return transform3(self, (parse4) => (args2) => parse4(args2).pipe(catchTag2(["MissingOption", "MissingArgument"], (error2) => runPrompt(error2, args2))));
});
var variadic = (self, options) => {
  const single = getUnderlyingSingleOrThrow(self);
  const parse4 = (args2) => {
    if (single.kind === "argument") {
      return parsePositionalVariadic(self, single, args2, options);
    } else {
      return parseOptionVariadic(self, single, args2, options);
    }
  };
  return Object.assign(Object.create(Proto9), {
    _tag: "Variadic",
    kind: self.kind,
    param: self,
    min: fromUndefinedOr(options?.min),
    max: fromUndefinedOr(options?.max),
    parse: parse4
  });
};
var between = /* @__PURE__ */ dual(3, (self, min2, max2) => {
  if (min2 < 0) {
    throw new Error("between: min must be non-negative");
  }
  if (max2 < min2) {
    throw new Error("between: max must be greater than or equal to min");
  }
  return variadic(self, {
    min: min2,
    max: max2
  });
});
var atMost = /* @__PURE__ */ dual(2, (self, max2) => {
  if (max2 < 0) {
    throw new Error("atMost: max must be non-negative");
  }
  return variadic(self, {
    max: max2
  });
});
var atLeast = /* @__PURE__ */ dual(2, (self, min2) => {
  if (min2 < 0) {
    throw new Error("atLeast: min must be non-negative");
  }
  return variadic(self, {
    min: min2
  });
});
var filterMap3 = /* @__PURE__ */ dual(3, (self, filter10, onNone) => mapEffect2(self, fnUntraced2(function* (a) {
  const result3 = filter10(a);
  if (isSome2(result3)) {
    return result3.value;
  }
  const single = getUnderlyingSingleOrThrow(self);
  return yield* new InvalidValue2({
    option: single.name,
    value: String(a),
    expected: onNone(a),
    kind: single.kind
  });
})));
var filter7 = /* @__PURE__ */ dual(3, (self, predicate, onFalse) => filterMap3(self, liftPredicate(predicate), onFalse));
var withMetavar = /* @__PURE__ */ dual(2, (self, metavar) => transformSingle(self, (single) => makeSingle2({
  ...single,
  typeName: metavar
})));
var withSchema = /* @__PURE__ */ dual(2, (self, schema) => {
  const decodeParam = decodeUnknownEffect2(schema);
  return mapEffect2(self, (value3) => mapError2(decodeParam(value3), (error2) => {
    const single = getUnderlyingSingleOrThrow(self);
    return new InvalidValue2({
      option: single.name,
      value: String(value3),
      expected: `Schema validation failed: ${error2.message}`,
      kind: single.kind
    });
  }));
});
var orElse = /* @__PURE__ */ dual(2, (self, orElse4) => transform3(self, (parse4, alternatives) => (args2) => catch_2(parse4(args2), () => alternatives[0]()(args2)), [orElse4]));
var orElseResult = /* @__PURE__ */ dual(2, (self, orElse4) => {
  return transform3(self, (parse4, alternatives) => (args2) => catch_2(map6(parse4(args2), ([leftover, value3]) => [leftover, succeed2(value3)]), () => map6(alternatives[0]()(args2), ([leftover, value3]) => [leftover, fail2(value3)])), [orElse4]);
});
var parsePositional = /* @__PURE__ */ fnUntraced2(function* (name, primitiveType, args2) {
  if (args2.arguments.length === 0) {
    return yield* new MissingArgument({
      argument: name
    });
  }
  const arg = args2.arguments[0];
  const value3 = yield* mapError2(primitiveType.parse(arg), (error2) => new InvalidValue2({
    option: name,
    value: arg,
    expected: error2,
    kind: "argument"
  }));
  return [args2.arguments.slice(1), value3];
});
var parseFlag = /* @__PURE__ */ fnUntraced2(function* (name, primitiveType, args2) {
  const providedValues = args2.flags[name];
  if (providedValues === void 0 || providedValues.length === 0) {
    return yield* new MissingOption({
      option: name
    });
  }
  const arg = providedValues[0];
  const value3 = yield* mapError2(primitiveType.parse(arg), (error2) => new InvalidValue2({
    option: name,
    value: arg,
    expected: error2,
    kind: "flag"
  }));
  return [args2.arguments, value3];
});
var parsePositionalVariadic = /* @__PURE__ */ fnUntraced2(function* (self, single, args2, options) {
  const results = [];
  const minValue = options?.min ?? 0;
  const maxValue = options?.max ?? Number.POSITIVE_INFINITY;
  let count2 = 0;
  let currentArgs = args2.arguments;
  while (currentArgs.length > 0 && count2 < maxValue) {
    const [remainingArgs, value3] = yield* self.parse({
      flags: args2.flags,
      arguments: currentArgs
    });
    results.push(value3);
    currentArgs = remainingArgs;
    count2++;
  }
  if (count2 < minValue) {
    return yield* new InvalidValue2({
      option: single.name,
      value: `${count2} values`,
      expected: `at least ${minValue} value${minValue === 1 ? "" : "s"}`,
      kind: single.kind
    });
  }
  return [currentArgs, results];
});
var parseOptionVariadic = /* @__PURE__ */ fnUntraced2(function* (self, single, args2, options) {
  const results = [];
  const names = [single.name, ...single.aliases];
  const values = names.flatMap((name) => args2.flags[name] ?? []);
  const count2 = values.length;
  if (isNotUndefined(options?.min) && count2 < options.min) {
    return yield* count2 === 0 ? new MissingOption({
      option: single.name
    }) : new InvalidValue2({
      option: single.name,
      value: `${count2} occurrences`,
      expected: `at least ${options.min} value${options.min === 1 ? "" : "s"}`,
      kind: single.kind
    });
  }
  if (isNotUndefined(options?.max) && count2 > options.max) {
    return yield* new InvalidValue2({
      option: single.name,
      value: `${count2} occurrences`,
      expected: `at most ${options.max} value${options.max === 1 ? "" : "s"}`,
      kind: single.kind
    });
  }
  for (const value3 of values) {
    const [, parsedValue] = yield* self.parse({
      flags: {
        [single.name]: [value3]
      },
      arguments: []
    });
    results.push(parsedValue);
  }
  return [args2.arguments, results];
});
var matchParam = (param, patterns) => {
  const p = param;
  switch (p._tag) {
    case "Single":
      return patterns.Single(p);
    case "Map":
      return patterns.Map(p);
    case "Transform":
      return patterns.Transform(p);
    case "Optional":
      return patterns.Optional(p);
    case "Variadic":
      return patterns.Variadic(p);
  }
};
var transformSingle = (param, f) => {
  return matchParam(param, {
    Single: (single) => f(single),
    Map: (mapped) => map11(transformSingle(mapped.param, f), mapped.f),
    Transform: (mapped) => transform3(transformSingle(mapped.param, f), mapped.f, mapped.alternatives.map((alternative) => () => transformSingle(alternative(), f))),
    Optional: (p) => optional3(transformSingle(p.param, f)),
    Variadic: (p) => variadic(transformSingle(p.param, f), {
      min: getOrUndefined(p.min),
      max: getOrUndefined(p.max)
    })
  });
};
var extractSingleParams = (param) => {
  return matchParam(param, {
    Single: (single) => [single],
    Map: (mapped) => extractSingleParams(mapped.param),
    Transform: (mapped) => [...extractSingleParams(mapped.param), ...mapped.alternatives.flatMap((alternative) => extractSingleParams(alternative()))],
    Optional: (optional7) => extractSingleParams(optional7.param),
    Variadic: (variadic3) => extractSingleParams(variadic3.param)
  });
};
var getUnderlyingSingleOrThrow = (param) => {
  const singles = extractSingleParams(param);
  if (singles.length === 0) {
    throw new Error("No Single param found in param structure");
  }
  if (singles.length > 1) {
    throw new Error(`Multiple Single params found: ${singles.map((s) => s.name).join(", ")}`);
  }
  return singles[0];
};
var getParamMetadata = (param) => {
  return matchParam(param, {
    Single: () => ({
      isOptional: false,
      isVariadic: false,
      variadicMin: none2(),
      variadicMax: none2()
    }),
    Map: (mapped) => getParamMetadata(mapped.param),
    Transform: (mapped) => getParamMetadata(mapped.param),
    Optional: (optional7) => ({
      ...getParamMetadata(optional7.param),
      isOptional: true
    }),
    Variadic: (variadic3) => ({
      ...getParamMetadata(variadic3.param),
      isVariadic: true,
      variadicMin: variadic3.min,
      variadicMax: variadic3.max
    })
  });
};

// node_modules/effect/dist/unstable/cli/Argument.js
var string5 = (name) => string4(argumentKind, name);
var integer4 = (name) => integer3(argumentKind, name);
var file2 = (name, options) => file(argumentKind, name, options);
var directory2 = (name, options) => directory(argumentKind, name, options);
var float4 = (name) => float3(argumentKind, name);
var date4 = (name) => date3(argumentKind, name);
var choice3 = (name, choices) => choice2(argumentKind, name, choices);
var path3 = (name, options) => path2(argumentKind, name, options);
var redacted3 = (name) => redacted2(argumentKind, name);
var fileText3 = (name) => fileText2(argumentKind, name);
var fileParse3 = (name, options) => fileParse2(argumentKind, name, options);
var fileSchema3 = (name, schema, options) => fileSchema2(argumentKind, name, schema, options);
var none5 = /* @__PURE__ */ none4(argumentKind);
var optional4 = (arg) => optional3(arg);
var withDescription2 = /* @__PURE__ */ dual(2, (self, description) => withDescription(self, description));
var withDefault4 = withDefault3;
var withFallbackConfig2 = /* @__PURE__ */ dual(2, (self, config) => withFallbackConfig(self, config));
var withFallbackPrompt2 = /* @__PURE__ */ dual(2, (self, prompt) => withFallbackPrompt(self, prompt));
var variadic2 = /* @__PURE__ */ dual((args2) => isParam(args2[0]), (self, options) => variadic(self, options));
var map12 = /* @__PURE__ */ dual(2, (self, f) => map11(self, f));
var mapEffect3 = /* @__PURE__ */ dual(2, (self, f) => mapEffect2(self, f));
var mapTryCatch2 = /* @__PURE__ */ dual(3, (self, f, onError4) => mapTryCatch(self, f, onError4));
var atLeast2 = /* @__PURE__ */ dual(2, (self, min2) => atLeast(self, min2));
var atMost2 = /* @__PURE__ */ dual(2, (self, max2) => atMost(self, max2));
var between2 = /* @__PURE__ */ dual(3, (self, min2, max2) => between(self, min2, max2));
var withSchema2 = /* @__PURE__ */ dual(2, (self, schema) => withSchema(self, schema));
var choiceWithValue2 = (name, choices) => choiceWithValue(argumentKind, name, choices);
var withMetavar2 = /* @__PURE__ */ dual(2, (self, metavar) => withMetavar(self, metavar));
var filter8 = /* @__PURE__ */ dual(3, (self, predicate, onFalse) => filter7(self, predicate, onFalse));
var filterMap4 = /* @__PURE__ */ dual(3, (self, f, onNone) => filterMap3(self, f, onNone));
var orElse2 = /* @__PURE__ */ dual(2, (self, that) => orElse(self, that));
var orElseResult2 = /* @__PURE__ */ dual(2, (self, that) => orElseResult(self, that));

// node_modules/effect/dist/unstable/cli/CliOutput.js
var Formatter = /* @__PURE__ */ Reference("effect/cli/CliOutput", {
  defaultValue: () => defaultFormatter2()
});
var escapeControlCharacters = (text2) => (
  // oxlint-disable-next-line no-control-regex
  text2.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, (character) => `\\x${character.charCodeAt(0).toString(16).padStart(2, "0")}`)
);
var defaultFormatter2 = (options) => {
  const globalProcess = globalThis.process;
  const hasProcess = typeof globalProcess === "object" && globalProcess !== null;
  const useColor = options?.colors !== void 0 ? options.colors : hasProcess && typeof globalProcess.stdout === "object" && globalProcess.stdout !== null && globalProcess.stdout.isTTY === true && globalProcess.env?.NO_COLOR !== "1";
  const colors2 = useColor ? {
    bold: (text2) => `\x1B[1m${text2}\x1B[0m`,
    dim: (text2) => `\x1B[2m${text2}\x1B[0m`,
    cyan: (text2) => `\x1B[36m${text2}\x1B[0m`,
    green: (text2) => `\x1B[32m${text2}\x1B[0m`,
    blue: (text2) => `\x1B[34m${text2}\x1B[0m`,
    yellow: (text2) => `\x1B[33m${text2}\x1B[0m`,
    magenta: (text2) => `\x1B[35m${text2}\x1B[0m`
  } : {
    bold: (text2) => text2,
    dim: (text2) => text2,
    cyan: (text2) => text2,
    green: (text2) => text2,
    blue: (text2) => text2,
    yellow: (text2) => text2,
    magenta: (text2) => text2
  };
  const reset2 = useColor ? "\x1B[0m" : "";
  const red2 = useColor ? "\x1B[31m" : "";
  const bold2 = useColor ? "\x1B[1m" : "";
  return {
    formatHelpDoc: (doc) => formatHelpDocImpl(doc, colors2),
    formatCliError: (error2) => escapeControlCharacters(error2.message),
    formatError: (error2) => {
      return `
${bold2}${red2}ERROR${reset2}
  ${escapeControlCharacters(error2.message)}${reset2}`;
    },
    formatErrors: (errors) => {
      if (errors.length === 0) return "";
      if (errors.length === 1) {
        return `
${bold2}${red2}ERROR${reset2}
  ${escapeControlCharacters(errors[0].message)}${reset2}`;
      }
      const grouped = /* @__PURE__ */ new Map();
      for (const error2 of errors) {
        const tag2 = error2._tag ?? "Error";
        const group2 = grouped.get(tag2) ?? [];
        group2.push(error2);
        grouped.set(tag2, group2);
      }
      const sections = [];
      sections.push(`
${bold2}${red2}ERRORS${reset2}`);
      for (const [, group2] of grouped) {
        for (const error2 of group2) {
          sections.push(`  ${escapeControlCharacters(error2.message)}${reset2}`);
        }
      }
      return sections.join("\n");
    },
    formatVersion: (name, version) => `${colors2.bold(name)} ${colors2.dim("v")}${colors2.bold(version)}`
  };
};
var stripAnsi = (text2) => {
  return text2.replace(/\u001B\[[0-9;]*m/g, "");
};
var visualLength = (text2) => stripAnsi(text2).length;
var pad = (s, width) => {
  const actualLength = visualLength(s);
  const padding = Math.max(0, width - actualLength);
  return s + " ".repeat(padding);
};
var renderTable = (rows, widthCap) => {
  const maxColumn = Math.max(...rows.map((r) => visualLength(r.left))) + 4;
  const col = widthCap === void 0 ? maxColumn : Math.min(maxColumn, widthCap);
  return rows.map(({
    left,
    right
  }) => `  ${pad(left, Math.max(col, visualLength(left) + 1))}${right}`).join("\n");
};
var formatSubcommandName = (name, alias) => alias ? `${name}, ${alias}` : name;
var formatHelpDocImpl = (doc, colors2) => {
  const sections = [];
  if (doc.description) {
    sections.push(colors2.bold("DESCRIPTION"));
    sections.push(`  ${doc.description}`);
    sections.push("");
  }
  sections.push(colors2.bold("USAGE"));
  sections.push(`  ${colors2.cyan(doc.usage)}`);
  sections.push("");
  if (doc.args && doc.args.length > 0) {
    sections.push(colors2.bold("ARGUMENTS"));
    const argRows = doc.args.map((arg) => {
      let name = arg.name;
      if (arg.variadic) {
        name += "...";
      }
      const coloredName = colors2.green(name);
      const coloredType = colors2.dim(arg.type);
      const nameType = `${coloredName} ${coloredType}`;
      const optionalSuffix = arg.required ? "" : colors2.dim(" (optional)");
      const description = getOrElse(arg.description, () => "") + optionalSuffix;
      return {
        left: nameType,
        right: description
      };
    });
    sections.push(renderTable(argRows, 25));
    sections.push("");
  }
  if (doc.flags.length > 0) {
    sections.push(colors2.bold("FLAGS"));
    const flagRows = doc.flags.map((flag) => {
      const names = [];
      names.push(colors2.green(`--${flag.name}`));
      for (const alias of flag.aliases) {
        names.push(colors2.green(alias));
      }
      const namesPart = names.join(", ");
      const typePart = flag.type !== "boolean" ? ` ${colors2.dim(flag.type)}` : "";
      return {
        left: namesPart + typePart,
        right: getOrElse(flag.description, () => "")
      };
    });
    sections.push(renderTable(flagRows));
    sections.push("");
  }
  if (doc.globalFlags && doc.globalFlags.length > 0) {
    sections.push(colors2.bold("GLOBAL FLAGS"));
    const globalFlagRows = doc.globalFlags.map((flag) => {
      const names = [];
      names.push(colors2.green(`--${flag.name}`));
      for (const alias of flag.aliases) {
        names.push(colors2.green(alias));
      }
      const namesPart = names.join(", ");
      const typePart = flag.type !== "boolean" ? ` ${colors2.dim(flag.type)}` : "";
      return {
        left: namesPart + typePart,
        right: getOrElse(flag.description, () => "")
      };
    });
    sections.push(renderTable(globalFlagRows));
    sections.push("");
  }
  if (doc.subcommands && doc.subcommands.length > 0) {
    const ungrouped = doc.subcommands.find((group2) => group2.group === void 0);
    if (ungrouped) {
      sections.push(colors2.bold("SUBCOMMANDS"));
      sections.push(renderTable(ungrouped.commands.map((sub) => ({
        left: colors2.cyan(formatSubcommandName(sub.name, sub.alias)),
        right: sub.shortDescription ?? sub.description
      })), 20));
      if (doc.subcommands.length > 1) {
        sections.push("");
      }
    }
    for (const group2 of doc.subcommands) {
      if (group2.group === void 0) continue;
      sections.push(colors2.bold(`${group2.group}:`));
      sections.push(renderTable(group2.commands.map((sub) => ({
        left: colors2.cyan(formatSubcommandName(sub.name, sub.alias)),
        right: sub.shortDescription ?? sub.description
      })), 20));
      sections.push("");
    }
  }
  if (doc.examples && doc.examples.length > 0) {
    sections.push(colors2.bold("EXAMPLES"));
    let first = true;
    let previousHadDescription = false;
    for (const example of doc.examples) {
      if (example.description) {
        if (!first) sections.push("");
        sections.push(`  ${colors2.dim(`# ${example.description}`)}`);
      } else if (previousHadDescription) {
        sections.push("");
      }
      sections.push(`  ${colors2.cyan(example.command)}`);
      first = false;
      previousHadDescription = !!example.description;
    }
    sections.push("");
  }
  if (sections[sections.length - 1] === "") {
    sections.pop();
  }
  return sections.join("\n");
};

// node_modules/effect/dist/unstable/cli/internal/completions/bash.js
var escapeForBash = (s) => s.replace(/'/g, "'\\''");
var sanitizeFunctionName = (s) => s.replace(/[^a-zA-Z0-9_]/g, "_");
var flagNamesForWordlist = (flag) => {
  const names = [`--${flag.name}`];
  for (const alias of flag.aliases) {
    names.push(alias.length === 1 ? `-${alias}` : `--${alias}`);
  }
  if (flag.type._tag === "Boolean") {
    names.push(`--no-${flag.name}`);
  }
  return names;
};
var buildFlagGroupDeclarations = (flags, lines2) => {
  if (flags.length === 0) return;
  const groups = flags.map(flagNamesForWordlist);
  lines2.push(`  local ${groups.map((_, index) => `_used_${index}=""`).join(" ")}`);
  lines2.push(`  for ((i = 1; i < cword; i++)); do`);
  lines2.push(`    case "\${words[i]%%=*}" in`);
  groups.forEach((forms, index) => {
    lines2.push(`      ${forms.join("|")}) _used_${index}=1 ;;`);
  });
  lines2.push(`    esac`);
  lines2.push(`  done`);
  lines2.push(`  local _filtered_flags=""`);
  groups.forEach((forms, index) => {
    lines2.push(`  [[ -n "$_used_${index}" ]] || _filtered_flags+=" ${forms.join(" ")}"`);
  });
  lines2.push(``);
};
var choicesHelper = (helperName, lines2) => {
  lines2.push(`${helperName}()`);
  lines2.push(`{`);
  lines2.push(`  local _cur="$1" _word="$2"; shift 2`);
  lines2.push(``);
  lines2.push(`  local _head="\${_cur%"$_word"}"`);
  lines2.push(`  local _open=""`);
  lines2.push(`  case "$_head" in`);
  lines2.push(`    *\\') _open="'" ;;`);
  lines2.push(`    *\\") _open='"' ;;`);
  lines2.push(`  esac`);
  lines2.push(``);
  lines2.push(`  local _prefix="$_cur" _committed="$_head"`);
  lines2.push(`  _prefix=\${_prefix//\\\\/}; _prefix=\${_prefix//\\"/}; _prefix=\${_prefix//\\'/}`);
  lines2.push(`  _committed=\${_committed//\\\\/}; _committed=\${_committed//\\"/}; _committed=\${_committed//\\'/}`);
  lines2.push(``);
  lines2.push(`  COMPREPLY=()`);
  lines2.push(`  local _choice _rest _match`);
  lines2.push(`  for _choice in "$@"; do`);
  lines2.push(`    [[ "$_choice" == "$_prefix"* ]] || continue`);
  lines2.push(`    _rest="\${_choice#"$_committed"}"`);
  lines2.push(`    case "$_open" in`);
  lines2.push(`      "'")`);
  lines2.push(`        if [[ "$_head" == "'" ]]; then`);
  lines2.push(`          _match=\${_rest//\\'/\\'\\\\\\'\\'}`);
  lines2.push(`        else`);
  lines2.push(`          [[ "$_rest" == *\\'* ]] && continue`);
  lines2.push(`          _match="$_rest"`);
  lines2.push(`        fi`);
  lines2.push(`        ;;`);
  lines2.push(`      '"')`);
  lines2.push(`        _match="\${_rest//\\\\/\\\\\\\\}"`);
  lines2.push(`        _match="\${_match//\\$/\\\\$}"`);
  lines2.push('        _match="${_match//\\`/\\\\\\`}"');
  lines2.push(`        _match="\${_match//\\"/\\\\\\"}"`);
  lines2.push(`        ;;`);
  lines2.push(`      *)`);
  lines2.push(`        printf -v _match '%q' "$_rest"`);
  lines2.push(`        [[ -z "$_head" && "$_match" == '~'* ]] && _match="\\\\$_match"`);
  lines2.push(`        ;;`);
  lines2.push(`    esac`);
  lines2.push(`    [[ -n "$_open" && "$_match" == *"$_open" ]] && _match+="$_open"`);
  lines2.push(`    COMPREPLY+=("$_match")`);
  lines2.push(`  done`);
  lines2.push(`}`);
  lines2.push(``);
};
var choiceCompletion = (helperName, values) => `${helperName} "$cur" "$_comp_word" ${values.map((value3) => `'${escapeForBash(value3)}'`).join(" ")}`;
var flagValueCompletion = (type, helperName) => {
  switch (type._tag) {
    case "Boolean":
      return void 0;
    case "Choice":
      return choiceCompletion(helperName, type.values);
    case "Path":
      if (type.pathType === "directory") return `COMPREPLY=( $(compgen -d -- "$cur") )`;
      return `COMPREPLY=( $(compgen -f -- "$cur") )`;
    default:
      return void 0;
  }
};
var argCompletion = (type, helperName) => {
  switch (type._tag) {
    case "Choice":
      return choiceCompletion(helperName, type.values);
    case "Path":
      if (type.pathType === "directory") return `COMPREPLY=( $(compgen -d -- "$cur") )`;
      return `COMPREPLY=( $(compgen -f -- "$cur") )`;
    default:
      return void 0;
  }
};
var generateFunction = (descriptor, parentPath, lines2, helperName) => {
  const currentPath = [...parentPath, descriptor.name];
  const funcName = `_${currentPath.map(sanitizeFunctionName).join("_")}`;
  lines2.push(`${funcName}()`);
  lines2.push(`{`);
  lines2.push(`  local cur prev words cword i`);
  lines2.push(parentPath.length === 0 ? `  local _command_index=0` : `  local _command_index="$1"`);
  lines2.push(`  _init_completion -n "$COMP_WORDBREAKS" || return`);
  if (parentPath.length === 0) {
    lines2.push(`  local _comp_word="$2"`);
  }
  lines2.push(``);
  const flagsWithValues = descriptor.flags.filter((f) => f.type._tag !== "Boolean");
  if (flagsWithValues.length > 0) {
    lines2.push(`  # Flag value completions`);
    lines2.push(`  case "$prev" in`);
    for (const flag of flagsWithValues) {
      const longNames = [`--${flag.name}`];
      for (const alias of flag.aliases) {
        longNames.push(alias.length === 1 ? `-${alias}` : `--${alias}`);
      }
      const completion = flagValueCompletion(flag.type, helperName);
      if (completion) {
        lines2.push(`    ${longNames.join("|")})`);
        lines2.push(`      ${completion}`);
        lines2.push(`      return`);
        lines2.push(`      ;;`);
      }
    }
    lines2.push(`  esac`);
    lines2.push(``);
  }
  if (descriptor.subcommands.length > 0) {
    lines2.push(`  # Subcommand dispatch`);
    lines2.push(`  local cmd _skip_next=0`);
    lines2.push(`  for ((i = _command_index + 1; i < cword; i++)); do`);
    lines2.push(`    if (( _skip_next )); then`);
    lines2.push(`      _skip_next=0`);
    lines2.push(`      continue`);
    lines2.push(`    fi`);
    lines2.push(`    case "\${words[i]}" in`);
    for (const flag of descriptor.flags) {
      if (flag.type._tag === "Boolean") continue;
      const forms = flagNamesForWordlist(flag);
      lines2.push(`      ${forms.join("|")}) _skip_next=1 ;;`);
      lines2.push(`      ${forms.map((form) => `${form}=*`).join("|")}) ;;`);
    }
    for (const sub of descriptor.subcommands) {
      const subFuncName = `_${[...currentPath, sub.name].map(sanitizeFunctionName).join("_")}`;
      lines2.push(`      ${sub.name})`);
      lines2.push(`        ${subFuncName} "$i"`);
      lines2.push(`        return`);
      lines2.push(`        ;;`);
    }
    lines2.push(`    esac`);
    lines2.push(`  done`);
    lines2.push(``);
  }
  buildFlagGroupDeclarations(descriptor.flags, lines2);
  if (descriptor.flags.length > 0 || descriptor.subcommands.length > 0) {
    lines2.push(`  # Complete flags (filtered) and subcommands`);
    lines2.push(`  if [[ "$cur" == -* ]]; then`);
    if (descriptor.flags.length > 0) {
      lines2.push(`    COMPREPLY=( $(compgen -W "$_filtered_flags" -- "$cur") )`);
    }
    lines2.push(`    return`);
    lines2.push(`  fi`);
    lines2.push(``);
  }
  const argsWithCompletions = descriptor.arguments.flatMap((argument, index) => {
    const completion = argCompletion(argument.type, helperName);
    return completion === void 0 ? [] : [{
      argument,
      completion,
      index
    }];
  });
  if (argsWithCompletions.length > 0) {
    lines2.push(`  # Positional argument completions`);
    lines2.push(`  local _position=0 _skip_next=0 _end_of_options=0`);
    lines2.push(`  for ((i = _command_index + 1; i < cword; i++)); do`);
    lines2.push(`    if (( _skip_next )); then`);
    lines2.push(`      _skip_next=0`);
    lines2.push(`      continue`);
    lines2.push(`    fi`);
    lines2.push(`    if (( _end_of_options )); then`);
    lines2.push(`      ((_position += 1))`);
    lines2.push(`      continue`);
    lines2.push(`    fi`);
    lines2.push(`    case "\${words[i]}" in`);
    lines2.push(`      --) _end_of_options=1 ;;`);
    for (const flag of descriptor.flags) {
      const forms = flagNamesForWordlist(flag);
      if (flag.type._tag === "Boolean") {
        lines2.push(`      ${forms.join("|")}) ;;`);
      } else {
        lines2.push(`      ${forms.join("|")}) _skip_next=1 ;;`);
        lines2.push(`      ${forms.map((form) => `${form}=*`).join("|")}) ;;`);
      }
    }
    lines2.push(`      -*) ;;`);
    lines2.push(`      *) ((_position += 1)) ;;`);
    lines2.push(`    esac`);
    lines2.push(`  done`);
    lines2.push(`  case "$_position" in`);
    for (const {
      argument,
      completion,
      index
    } of argsWithCompletions) {
      if (argument.variadic) continue;
      lines2.push(`    ${index})`);
      lines2.push(`      ${completion}`);
      lines2.push(`      return`);
      lines2.push(`      ;;`);
    }
    lines2.push(`  esac`);
    const variadic3 = argsWithCompletions.find(({
      argument
    }) => argument.variadic);
    if (variadic3 !== void 0) {
      lines2.push(`  if (( _position >= ${variadic3.index} )); then`);
      lines2.push(`    ${variadic3.completion}`);
      lines2.push(`    return`);
      lines2.push(`  fi`);
    }
  } else if (descriptor.subcommands.length > 0) {
    const subNames = descriptor.subcommands.map((s) => s.name);
    lines2.push(`  COMPREPLY=( $(compgen -W '${subNames.join(" ")}' -- "$cur") )`);
  }
  lines2.push(`}`);
  lines2.push(``);
  for (const sub of descriptor.subcommands) {
    generateFunction(sub, currentPath, lines2, helperName);
  }
};
var generate = (executableName, descriptor) => {
  const lines2 = [];
  const safeName = sanitizeFunctionName(executableName);
  const helperName = `_${safeName}--choices`;
  lines2.push(`###-begin-${escapeForBash(executableName)}-completions-###`);
  lines2.push(`#`);
  lines2.push(`# Static completion script for Bash`);
  lines2.push(`#`);
  lines2.push(`# Installation:`);
  lines2.push(`#   ${escapeForBash(executableName)} --completions bash >> ~/.bashrc`);
  lines2.push(`#`);
  lines2.push(``);
  lines2.push(`if ! type _init_completion &>/dev/null; then`);
  lines2.push(`  _init_completion()`);
  lines2.push(`  {`);
  lines2.push(`    COMPREPLY=()`);
  lines2.push(`    local _i _j=0 _piece _line="$COMP_LINE"`);
  lines2.push(`    words=("\${COMP_WORDS[0]}")`);
  lines2.push(`    cword=0`);
  lines2.push(`    _line="\${_line#*"\${COMP_WORDS[0]}"}"`);
  lines2.push(`    for ((_i = 1; _i < \${#COMP_WORDS[@]}; _i++)); do`);
  lines2.push(`      _piece="\${COMP_WORDS[_i]}"`);
  lines2.push(`      if [[ "$_line" == [[:blank:]]* ]]; then`);
  lines2.push(`        ((_j++))`);
  lines2.push(`        words[_j]="$_piece"`);
  lines2.push(`      else`);
  lines2.push(`        words[_j]="\${words[_j]}$_piece"`);
  lines2.push(`      fi`);
  lines2.push(`      ((_i == COMP_CWORD)) && cword=$_j`);
  lines2.push(`      _line="\${_line#*"$_piece"}"`);
  lines2.push(`    done`);
  lines2.push(`    cur="\${words[cword]}"`);
  lines2.push(`    prev=""`);
  lines2.push(`    ((cword > 0)) && prev="\${words[cword-1]}"`);
  lines2.push(`    return 0`);
  lines2.push(`  }`);
  lines2.push(`fi`);
  lines2.push(``);
  choicesHelper(helperName, lines2);
  generateFunction(descriptor, [], lines2, helperName);
  lines2.push(`complete -F _${safeName} ${escapeForBash(executableName)}`);
  lines2.push(`###-end-${escapeForBash(executableName)}-completions-###`);
  return lines2.join("\n");
};

// node_modules/effect/dist/unstable/cli/internal/completions/fish.js
var escapeFishString = (s) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
var escapeFishChoice = (s) => escapeFishString(s.replace(/[^A-Za-z0-9_.,/@%+-]/gu, "\\$&"));
var subcommandCondition = (parentPath, childSubcommandNames) => {
  if (parentPath.length === 0) {
    if (childSubcommandNames.length > 0) {
      return `__fish_use_subcommand`;
    }
    return ``;
  }
  const parentCondition = parentPath.map((parent) => `__fish_seen_subcommand_from ${parent}`).join("; and ");
  if (childSubcommandNames.length > 0) {
    return `${parentCondition}; and not __fish_seen_subcommand_from ${childSubcommandNames.join(" ")}`;
  }
  return parentCondition;
};
var flagContainsOptCondition = (flag) => {
  const optArgs = [];
  for (const alias of flag.aliases) {
    if (alias.length === 1) {
      optArgs.push(`-s ${alias}`);
    }
  }
  optArgs.push(flag.name);
  for (const alias of flag.aliases) {
    if (alias.length > 1) {
      optArgs.push(alias);
    }
  }
  if (flag.type._tag === "Boolean") {
    optArgs.push(`no-${flag.name}`);
  }
  return `not __fish_contains_opt ${optArgs.join(" ")}`;
};
var valueFlagDedupCondition = (flag) => {
  const forms = [`--${flag.name}`];
  for (const alias of flag.aliases) {
    forms.push(alias.length === 1 ? `-${alias}` : `--${alias}`);
  }
  return `begin; ${flagContainsOptCondition(flag)}; or contains -- (commandline -poc)[-1] ${forms.join(" ")}; end`;
};
var flagCompletionArgs = (flag) => {
  const args2 = [`-l ${flag.name}`];
  for (const alias of flag.aliases) {
    if (alias.length === 1) {
      args2.push(`-s ${alias}`);
    } else {
      args2.push(`-l ${alias}`);
    }
  }
  if (flag.description) {
    args2.push(`-d '${escapeFishString(flag.description)}'`);
  }
  const valueArgs = flagValueArgs(flag.type);
  if (valueArgs) {
    args2.push(valueArgs);
  }
  return args2;
};
var flagValueArgs = (type) => {
  switch (type._tag) {
    case "Boolean":
      return void 0;
    case "Choice":
      return `-r -f -a '${type.values.map(escapeFishChoice).join(" ")}'`;
    case "Path":
      if (type.pathType === "directory") return `-r -F`;
      return `-r -F`;
    default:
      return `-r -f`;
  }
};
var argValueArgs = (type) => {
  switch (type._tag) {
    case "Choice":
      return `-r -f -a '${type.values.map(escapeFishChoice).join(" ")}'`;
    case "Path":
      return `-r -F`;
    default:
      return void 0;
  }
};
var generateCompletions = (executableName, descriptor, parentPath, lines2) => {
  const allSubNames = descriptor.subcommands.map((s) => s.name);
  const condition = subcommandCondition(parentPath, allSubNames);
  const conditionArg = condition ? `-n '${condition}'` : ``;
  const hasPathArgs = descriptor.arguments.some((a) => a.type._tag === "Path");
  if (!hasPathArgs) {
    const parts = [`complete -c ${executableName}`];
    if (conditionArg) parts.push(conditionArg);
    parts.push(`-f`);
    lines2.push(parts.join(" "));
  }
  for (const sub of descriptor.subcommands) {
    const parts = [`complete -c ${executableName}`];
    if (conditionArg) parts.push(conditionArg);
    parts.push(`-f -a '${escapeFishString(sub.name)}'`);
    if (sub.description) {
      parts.push(`-d '${escapeFishString(sub.description)}'`);
    }
    lines2.push(parts.join(" "));
  }
  for (const flag of descriptor.flags) {
    const isBoolean3 = flag.type._tag === "Boolean";
    const dedup = isBoolean3 ? flagContainsOptCondition(flag) : valueFlagDedupCondition(flag);
    const flagCondition = condition ? `${condition}; and ${dedup}` : dedup;
    const flagCondArg = flagCondition ? `-n '${flagCondition}'` : ``;
    const parts = [`complete -c ${executableName}`];
    if (flagCondArg) parts.push(flagCondArg);
    parts.push(...flagCompletionArgs(flag));
    lines2.push(parts.join(" "));
    if (isBoolean3) {
      const negParts = [`complete -c ${executableName}`];
      if (flagCondArg) negParts.push(flagCondArg);
      negParts.push(`-l no-${flag.name}`);
      if (flag.description) {
        negParts.push(`-d '${escapeFishString(`Disable ${flag.name}`)}'`);
      }
      lines2.push(negParts.join(" "));
    }
  }
  if (descriptor.flags.length > 0) {
    const notDash = `not string match -q -- "-*" (commandline -ct)`;
    const bareBase = condition ? `${condition}; and ${notDash}` : notDash;
    for (const flag of descriptor.flags) {
      const bareCondition = `${bareBase}; and ${flagContainsOptCondition(flag)}`;
      const isBoolean3 = flag.type._tag === "Boolean";
      const parts = [`complete -c ${executableName}`];
      parts.push(`-n '${bareCondition}'`);
      parts.push(`-f -a '--${flag.name}'`);
      if (flag.description) {
        parts.push(`-d '${escapeFishString(flag.description)}'`);
      }
      lines2.push(parts.join(" "));
      if (isBoolean3) {
        const negParts = [`complete -c ${executableName}`];
        negParts.push(`-n '${bareCondition}'`);
        negParts.push(`-f -a '--no-${flag.name}'`);
        if (flag.description) {
          negParts.push(`-d '${escapeFishString(`Disable ${flag.name}`)}'`);
        }
        lines2.push(negParts.join(" "));
      }
    }
  }
  for (const arg of descriptor.arguments) {
    const valueArg = argValueArgs(arg.type);
    if (valueArg) {
      const parts = [`complete -c ${executableName}`];
      if (conditionArg) parts.push(conditionArg);
      parts.push(valueArg);
      if (arg.description) {
        parts.push(`-d '${escapeFishString(arg.description)}'`);
      }
      lines2.push(parts.join(" "));
    }
  }
  for (const sub of descriptor.subcommands) {
    generateCompletions(executableName, sub, [...parentPath, sub.name], lines2);
  }
};
var generate2 = (executableName, descriptor) => {
  const lines2 = [];
  lines2.push(`###-begin-${executableName}-completions-###`);
  lines2.push(`#`);
  lines2.push(`# Static completion script for Fish`);
  lines2.push(`#`);
  lines2.push(`# Installation:`);
  lines2.push(`#   ${executableName} --completions fish > ~/.config/fish/completions/${executableName}.fish`);
  lines2.push(`#`);
  lines2.push(``);
  generateCompletions(executableName, descriptor, [], lines2);
  lines2.push(``);
  lines2.push(`###-end-${executableName}-completions-###`);
  return lines2.join("\n");
};

// node_modules/effect/dist/unstable/cli/internal/completions/zsh.js
var escapeZsh = (s) => s.replace(/\\/g, "\\\\").replace(/'/g, "'\\''").replace(/:/g, "\\:");
var escapeZshChoice = (s) => s.replace(/[^A-Za-z0-9_.,/@%+-]/gu, "\\$&").replace(/'/g, "'\\''");
var sanitize = (s) => s.replace(/[^a-zA-Z0-9_]/g, "_");
var allForms = (flag) => {
  const forms = [`--${flag.name}`];
  for (const alias of flag.aliases) {
    forms.push(alias.length === 1 ? `-${alias}` : `--${alias}`);
  }
  if (flag.type._tag === "Boolean") {
    forms.push(`--no-${flag.name}`);
  }
  return forms;
};
var valueAction = (type) => {
  switch (type._tag) {
    case "Boolean":
      return "";
    case "Choice":
      return `:value:(${type.values.map(escapeZshChoice).join(" ")})`;
    case "Path":
      return type.pathType === "directory" ? `:directory:_directories` : `:file:_files`;
    case "Integer":
      return `:integer:`;
    case "Float":
      return `:float:`;
    case "Date":
      return `:date:`;
    default:
      return `:value:`;
  }
};
var argAction = (type) => {
  switch (type._tag) {
    case "Choice":
      return `(${type.values.map(escapeZshChoice).join(" ")})`;
    case "Path":
      return type.pathType === "directory" ? `_directories` : `_files`;
    default:
      return ``;
  }
};
var flagSpecs = (flag) => {
  const specs = [];
  const desc = flag.description ? `[${escapeZsh(flag.description)}]` : "";
  const action2 = valueAction(flag.type);
  const excl = `(${allForms(flag).join(" ")})`;
  specs.push(`'${excl}--${flag.name}${desc}${action2}'`);
  for (const alias of flag.aliases) {
    const prefix = alias.length === 1 ? "-" : "--";
    specs.push(`'${excl}${prefix}${alias}${desc}${action2}'`);
  }
  if (flag.type._tag === "Boolean") {
    const negDesc = flag.description ? `[${escapeZsh(`Disable ${flag.name}`)}]` : "";
    specs.push(`'${excl}--no-${flag.name}${negDesc}'`);
  }
  return specs;
};
var argSpec = (arg) => {
  const desc = arg.description ? escapeZsh(arg.description) : arg.name;
  const action2 = argAction(arg.type);
  const prefix = arg.variadic ? "*" : "";
  return `'${prefix}:${desc}:${action2}'`;
};
var generateFunction2 = (descriptor, parentPath, lines2) => {
  const currentPath = [...parentPath, descriptor.name];
  const funcName = `_${currentPath.map(sanitize).join("_")}`;
  lines2.push(`${funcName}() {`);
  if (descriptor.subcommands.length > 0) {
    lines2.push(`  local context state state_descr line`);
    lines2.push(`  typeset -A opt_args`);
    lines2.push(``);
    lines2.push(`  local -a commands`);
    lines2.push(`  commands=(`);
    for (const sub of descriptor.subcommands) {
      const desc = sub.description ? escapeZsh(sub.description) : "";
      lines2.push(`    '${sub.name}:${desc}'`);
    }
    lines2.push(`  )`);
    lines2.push(``);
    lines2.push(`  local -a specs`);
    lines2.push(`  specs=(`);
    for (const flag of descriptor.flags) {
      for (const spec of flagSpecs(flag)) {
        lines2.push(`    ${spec}`);
      }
    }
    if (descriptor.arguments.length > 0) {
      lines2.push(`    -`);
      lines2.push(`    parent-arguments`);
      for (const arg of descriptor.arguments) {
        lines2.push(`    ${argSpec(arg)}`);
      }
      lines2.push(`    -`);
      lines2.push(`    subcommands`);
    }
    lines2.push(`    '1:command:->command'`);
    lines2.push(`    '*::arg:->args'`);
    lines2.push(`  )`);
    lines2.push(``);
    lines2.push(`  _arguments -C "\${specs[@]}"`);
    lines2.push(``);
    lines2.push(`  case "$state" in`);
    lines2.push(`    command)`);
    lines2.push(`      _describe -t commands 'commands' commands`);
    lines2.push(`      ;;`);
    lines2.push(`    args)`);
    lines2.push(`      case "$words[1]" in`);
    for (const sub of descriptor.subcommands) {
      const subFunc = `_${[...currentPath, sub.name].map(sanitize).join("_")}`;
      lines2.push(`        ${sub.name})`);
      lines2.push(`          ${subFunc}`);
      lines2.push(`          ;;`);
    }
    lines2.push(`      esac`);
    lines2.push(`      ;;`);
    lines2.push(`  esac`);
  } else {
    const allSpecs = [];
    for (const flag of descriptor.flags) {
      allSpecs.push(...flagSpecs(flag));
    }
    for (const arg of descriptor.arguments) {
      allSpecs.push(argSpec(arg));
    }
    if (allSpecs.length > 0) {
      lines2.push(`  local -a specs`);
      lines2.push(`  specs=(`);
      for (const spec of allSpecs) {
        lines2.push(`    ${spec}`);
      }
      lines2.push(`  )`);
      lines2.push(`  _arguments "\${specs[@]}"`);
    }
  }
  lines2.push(`}`);
  lines2.push(``);
  for (const sub of descriptor.subcommands) {
    generateFunction2(sub, currentPath, lines2);
  }
};
var generate3 = (executableName, descriptor) => {
  const lines2 = [];
  const safeName = sanitize(executableName);
  lines2.push(`#compdef ${executableName}`);
  lines2.push(`###-begin-${executableName}-completions-###`);
  lines2.push(`#`);
  lines2.push(`# Static completion script for Zsh`);
  lines2.push(`#`);
  lines2.push(`# Installation:`);
  lines2.push(`#   ${executableName} --completions zsh > ~/.zsh/completions/_${executableName}`);
  lines2.push(`#   then add ~/.zsh/completions to your fpath`);
  lines2.push(`#`);
  lines2.push(``);
  generateFunction2(descriptor, [], lines2);
  lines2.push(`# Handle both direct invocation and autoload`);
  lines2.push(`if [[ "\${zsh_eval_context[-1]}" == "loadautofunc" ]]; then`);
  lines2.push(`  _${safeName} "$@"`);
  lines2.push(`else`);
  lines2.push(`  compdef _${safeName} ${executableName}`);
  lines2.push(`fi`);
  lines2.push(`###-end-${executableName}-completions-###`);
  return lines2.join("\n");
};

// node_modules/effect/dist/unstable/cli/Completions.js
var generate4 = (executableName, shell, descriptor) => {
  switch (shell) {
    case "bash":
      return generate(executableName, descriptor);
    case "zsh":
      return generate3(executableName, descriptor);
    case "fish":
      return generate2(executableName, descriptor);
  }
};

// node_modules/effect/dist/unstable/cli/Flag.js
var Flag_exports = {};
__export(Flag_exports, {
  atLeast: () => atLeast3,
  atMost: () => atMost3,
  between: () => between3,
  boolean: () => boolean4,
  choice: () => choice4,
  choiceWithValue: () => choiceWithValue3,
  date: () => date5,
  directory: () => directory3,
  file: () => file3,
  fileParse: () => fileParse4,
  fileSchema: () => fileSchema4,
  fileText: () => fileText4,
  filter: () => filter9,
  filterMap: () => filterMap5,
  float: () => float5,
  integer: () => integer5,
  keyValuePair: () => keyValuePair3,
  map: () => map13,
  mapEffect: () => mapEffect4,
  mapTryCatch: () => mapTryCatch3,
  none: () => none6,
  optional: () => optional5,
  orElse: () => orElse3,
  orElseResult: () => orElseResult3,
  path: () => path4,
  redacted: () => redacted4,
  string: () => string6,
  withAlias: () => withAlias2,
  withDefault: () => withDefault5,
  withDescription: () => withDescription3,
  withFallbackConfig: () => withFallbackConfig3,
  withFallbackPrompt: () => withFallbackPrompt3,
  withHidden: () => withHidden2,
  withMetavar: () => withMetavar3,
  withSchema: () => withSchema3
});
var string6 = (name) => string4(flagKind, name);
var boolean4 = (name) => boolean3(flagKind, name);
var integer5 = (name) => integer3(flagKind, name);
var float5 = (name) => float3(flagKind, name);
var date5 = (name) => date3(flagKind, name);
var choiceWithValue3 = (name, choices) => choiceWithValue(flagKind, name, choices);
var choice4 = (name, choices) => choice2(flagKind, name, choices);
var path4 = (name, options) => path2(flagKind, name, options);
var file3 = (name, options) => file(flagKind, name, options);
var directory3 = (name, options) => directory(flagKind, name, options);
var redacted4 = (name) => redacted2(flagKind, name);
var fileText4 = (name) => fileText2(flagKind, name);
var fileParse4 = (name, options) => fileParse2(flagKind, name, options);
var fileSchema4 = (name, schema, options) => fileSchema2(flagKind, name, schema, options);
var keyValuePair3 = (name) => keyValuePair2(flagKind, name);
var none6 = /* @__PURE__ */ none4(flagKind);
var withAlias2 = /* @__PURE__ */ dual(2, (self, alias) => withAlias(self, alias));
var withDescription3 = /* @__PURE__ */ dual(2, (self, description) => withDescription(self, description));
var withMetavar3 = /* @__PURE__ */ dual(2, (self, metavar) => withMetavar(self, metavar));
var withHidden2 = (self) => withHidden(self);
var optional5 = (param) => optional3(param);
var withDefault5 = withDefault3;
var withFallbackConfig3 = /* @__PURE__ */ dual(2, (self, config) => withFallbackConfig(self, config));
var withFallbackPrompt3 = /* @__PURE__ */ dual(2, (self, prompt) => withFallbackPrompt(self, prompt));
var map13 = /* @__PURE__ */ dual(2, (self, f) => map11(self, f));
var mapEffect4 = /* @__PURE__ */ dual(2, (self, f) => mapEffect2(self, f));
var mapTryCatch3 = /* @__PURE__ */ dual(3, (self, f, onError4) => mapTryCatch(self, f, onError4));
var atLeast3 = /* @__PURE__ */ dual(2, (self, min2) => atLeast(self, min2));
var atMost3 = /* @__PURE__ */ dual(2, (self, max2) => atMost(self, max2));
var between3 = /* @__PURE__ */ dual(3, (self, min2, max2) => between(self, min2, max2));
var filterMap5 = /* @__PURE__ */ dual(3, (self, f, onNone) => filterMap3(self, f, onNone));
var filter9 = /* @__PURE__ */ dual(3, (self, predicate, onFalse) => filter7(self, predicate, onFalse));
var orElse3 = /* @__PURE__ */ dual(2, (self, that) => orElse(self, that));
var orElseResult3 = /* @__PURE__ */ dual(2, (self, that) => orElseResult(self, that));
var withSchema3 = /* @__PURE__ */ dual(2, (self, schema) => withSchema(self, schema));

// node_modules/effect/dist/unstable/cli/internal/config.js
var ConfigInternalTypeId = "~effect/cli/Command/Config/Internal";
var parseConfig = (config) => {
  const orderedParams = [];
  const flags = [];
  const args2 = [];
  function parse4(config2) {
    const tree = /* @__PURE__ */ Object.create(null);
    for (const key of Object.keys(config2)) {
      tree[key] = parseValue(config2[key]);
    }
    return tree;
  }
  function parseValue(value3) {
    if (Array.isArray(value3)) {
      return {
        _tag: "Array",
        children: value3.map((v) => parseValue(v))
      };
    } else if (isParam(value3)) {
      const index = orderedParams.length;
      orderedParams.push(value3);
      if (value3.kind === "argument") {
        args2.push(value3);
      } else {
        flags.push(value3);
      }
      return {
        _tag: "Param",
        index
      };
    } else {
      return {
        _tag: "Nested",
        tree: parse4(value3)
      };
    }
  }
  return {
    [ConfigInternalTypeId]: ConfigInternalTypeId,
    flags,
    arguments: args2,
    orderedParams,
    tree: parse4(config)
  };
};
var emptyConfig = /* @__PURE__ */ parseConfig({});
var shiftNodeIndexes = (node, offset) => {
  switch (node._tag) {
    case "Param":
      return {
        _tag: "Param",
        index: node.index + offset
      };
    case "Array":
      return {
        _tag: "Array",
        children: node.children.map((child) => shiftNodeIndexes(child, offset))
      };
    case "Nested":
      return {
        _tag: "Nested",
        tree: shiftTreeIndexes(node.tree, offset)
      };
  }
};
var shiftTreeIndexes = (tree, offset) => {
  const output = /* @__PURE__ */ Object.create(null);
  for (const key of Object.keys(tree)) {
    output[key] = shiftNodeIndexes(tree[key], offset);
  }
  return output;
};
var mergeConfig = (left, right) => {
  const offset = left.orderedParams.length;
  return {
    [ConfigInternalTypeId]: ConfigInternalTypeId,
    flags: [...left.flags, ...right.flags],
    arguments: [...left.arguments, ...right.arguments],
    orderedParams: [...left.orderedParams, ...right.orderedParams],
    tree: Object.assign(/* @__PURE__ */ Object.create(null), left.tree, shiftTreeIndexes(right.tree, offset))
  };
};
var reconstructTree = (tree, results) => {
  const output = {};
  for (const key of Object.keys(tree)) {
    assignProperty(output, key, nodeValue(tree[key]));
  }
  return output;
  function nodeValue(node) {
    switch (node._tag) {
      case "Param":
        return results[node.index];
      case "Array":
        return node.children.map((child) => nodeValue(child));
      case "Nested":
        return reconstructTree(node.tree, results);
    }
  }
};

// node_modules/effect/dist/unstable/cli/internal/command.js
var TypeId40 = "~effect/cli/Command";
var toImpl = (self) => self;
var Proto10 = {
  .../* @__PURE__ */ Prototype2({
    label: "Command",
    evaluate() {
      return toImpl(this).service;
    }
  })
};
var makeCommand = (options) => {
  const config = options.config;
  const contextConfig = options.contextConfig ?? emptyConfig;
  const service3 = options.service ?? Service(`${TypeId40}/${options.name}`);
  const annotations = options.annotations ?? empty();
  const globalFlags = options.globalFlags ?? [];
  const subcommands = options.subcommands ?? [];
  const handle = (input, commandPath) => isNotUndefined(options.handle) ? options.handle(input, commandPath) : fail6(new ShowHelp({
    commandPath,
    errors: []
  }));
  const parse4 = options.parse ?? makeParser2(config);
  const parseContext = options.parseContext ?? makeParser2(contextConfig, {
    allowLeftovers: true
  });
  const buildHelpDoc = (commandPath) => {
    const args2 = [];
    const flags = [];
    for (const arg of config.arguments) {
      const singles = extractSingleParams(arg);
      const metadata = getParamMetadata(arg);
      for (const single of singles) {
        args2.push({
          name: single.name,
          type: single.typeName ?? getTypeName(single.primitiveType),
          description: single.description,
          required: !metadata.isOptional && (!metadata.isVariadic || exists(metadata.variadicMin, (min2) => min2 > 0)),
          variadic: metadata.isVariadic
        });
      }
    }
    let usage = commandPath.length > 0 ? commandPath.join(" ") : options.name;
    if (subcommands.some((group2) => group2.commands.some((c) => !c.unlisted))) {
      usage += " <subcommand>";
    }
    usage += " [flags]";
    for (const arg of args2) {
      const argName = arg.variadic ? `<${arg.name}...>` : `<${arg.name}>`;
      usage += ` ${arg.required ? argName : `[${argName}]`}`;
    }
    for (const option4 of config.flags) {
      const singles = extractSingleParams(option4);
      const metadata = getParamMetadata(option4);
      for (const single of singles) {
        if (single.hidden) continue;
        flags.push(toFlagDoc(single, metadata));
      }
    }
    const subcommandDocs = [];
    for (const group2 of subcommands) {
      const visible = group2.commands.filter((c) => !c.unlisted);
      if (visible.length === 0) continue;
      subcommandDocs.push({
        group: group2.group,
        commands: map2(visible, (subcommand) => ({
          name: subcommand.name,
          alias: subcommand.alias,
          shortDescription: subcommand.shortDescription,
          description: subcommand.description ?? ""
        }))
      });
    }
    const examples = options.examples ?? [];
    return {
      description: options.description ?? "",
      usage,
      flags,
      annotations,
      ...args2.length > 0 && {
        args: args2
      },
      ...subcommandDocs.length > 0 && {
        subcommands: subcommandDocs
      },
      ...examples.length > 0 && {
        examples
      }
    };
  };
  return Object.assign(Object.create(Proto10), {
    [TypeId40]: TypeId40,
    name: options.name,
    examples: options.examples ?? [],
    annotations,
    globalFlags,
    subcommands,
    unlisted: options.unlisted ?? false,
    config,
    contextConfig,
    service: service3,
    parse: parse4,
    parseContext,
    handle,
    buildHelpDoc,
    ...isNotUndefined(options.description) ? {
      description: options.description
    } : {},
    ...isNotUndefined(options.shortDescription) ? {
      shortDescription: options.shortDescription
    } : {},
    ...isNotUndefined(options.alias) ? {
      alias: options.alias
    } : {}
  });
};
var toFlagDoc = (single, metadata) => {
  const formattedAliases = single.aliases.map((alias) => alias.length === 1 ? `-${alias}` : `--${alias}`);
  return {
    name: single.name,
    aliases: formattedAliases,
    type: single.typeName ?? getTypeName(single.primitiveType),
    description: appendChoiceKeys(single.description, getChoiceKeys(single.primitiveType)),
    required: single.primitiveType._tag !== "Boolean" && !metadata.isOptional
  };
};
var appendChoiceKeys = (description, choiceKeys) => {
  if (choiceKeys === void 0 || choiceKeys.length === 0) {
    return description;
  }
  const choiceSuffix = `(choices: ${choiceKeys.join(", ")})`;
  return match(description, {
    onNone: () => some2(choiceSuffix),
    onSome: (value3) => some2(`${value3} ${choiceSuffix}`)
  });
};
var makeParser2 = (cfg, options) => fnUntraced2(function* (input) {
  const parsedArgs = {
    flags: input.flags,
    arguments: input.arguments
  };
  const [remainingArguments, values] = yield* parseParams(parsedArgs, cfg.orderedParams);
  if (options?.allowLeftovers !== true && remainingArguments.length > 0) {
    return yield* new UnexpectedArgument({
      arguments: remainingArguments
    });
  }
  return reconstructTree(cfg.tree, values);
});
var parseParams = /* @__PURE__ */ fnUntraced2(function* (parsedArgs, params) {
  const results = [];
  let currentArguments = parsedArgs.arguments;
  for (const option4 of params) {
    const [remainingArguments, parsed] = yield* option4.parse({
      flags: parsedArgs.flags,
      arguments: currentArguments
    });
    results.push(parsed);
    currentArguments = remainingArguments;
  }
  return [currentArguments, results];
});
var checkForDuplicateFlags = (parent, subcommands, options) => {
  const parentImpl = toImpl(parent);
  const parentOptionNames = /* @__PURE__ */ new Set();
  const extractNames = (flags) => {
    for (const option4 of flags) {
      const singles = extractSingleParams(option4);
      for (const single of singles) {
        parentOptionNames.add(single.name);
      }
    }
  };
  extractNames((options?.contextConfig ?? parentImpl.contextConfig).flags);
  for (const subcommand of subcommands) {
    const subImpl = toImpl(subcommand);
    for (const option4 of subImpl.config.flags) {
      const singles = extractSingleParams(option4);
      for (const single of singles) {
        if (parentOptionNames.has(single.name)) {
          throw new DuplicateOption({
            option: single.name,
            parentCommand: parent.name,
            childCommand: subcommand.name
          });
        }
      }
    }
  }
};

// node_modules/effect/dist/unstable/cli/internal/completions/descriptor.js
var toFlagType = (single) => {
  const tag2 = single.primitiveType._tag;
  switch (tag2) {
    case "Boolean":
      return {
        _tag: "Boolean"
      };
    case "Integer":
      return {
        _tag: "Integer"
      };
    case "Float":
      return {
        _tag: "Float"
      };
    case "Date":
      return {
        _tag: "Date"
      };
    case "Choice": {
      const keys = getChoiceKeys(single.primitiveType);
      return {
        _tag: "Choice",
        values: keys ?? []
      };
    }
    case "Path":
      return {
        _tag: "Path",
        pathType: getPathType(single.primitiveType) ?? "either"
      };
    case "FileText":
    case "FileParse":
    case "FileSchema":
      return {
        _tag: "Path",
        pathType: "file"
      };
    default:
      return {
        _tag: "String"
      };
  }
};
var toArgumentType = (single) => {
  const tag2 = single.primitiveType._tag;
  switch (tag2) {
    case "Integer":
      return {
        _tag: "Integer"
      };
    case "Float":
      return {
        _tag: "Float"
      };
    case "Date":
      return {
        _tag: "Date"
      };
    case "Choice": {
      const keys = getChoiceKeys(single.primitiveType);
      return {
        _tag: "Choice",
        values: keys ?? []
      };
    }
    case "Path":
      return {
        _tag: "Path",
        pathType: getPathType(single.primitiveType) ?? "either"
      };
    case "FileText":
    case "FileParse":
    case "FileSchema":
      return {
        _tag: "Path",
        pathType: "file"
      };
    default:
      return {
        _tag: "String"
      };
  }
};
var fromCommand = (cmd) => {
  const impl = toImpl(cmd);
  const config = impl.config;
  const flags = [];
  for (const flag of config.flags) {
    const singles = extractSingleParams(flag);
    for (const single of singles) {
      if (single.kind !== "flag") continue;
      if (single.hidden) continue;
      flags.push({
        name: single.name,
        aliases: single.aliases,
        description: getOrUndefined(single.description),
        type: toFlagType(single)
      });
    }
  }
  const args2 = [];
  for (const arg of config.arguments) {
    const singles = extractSingleParams(arg);
    const metadata = getParamMetadata(arg);
    for (const single of singles) {
      if (single.kind !== "argument") continue;
      args2.push({
        name: single.name,
        description: getOrUndefined(single.description),
        required: !metadata.isOptional,
        variadic: metadata.isVariadic,
        type: toArgumentType(single)
      });
    }
  }
  const subcommands = [];
  for (const group2 of cmd.subcommands) {
    for (const subcommand of group2.commands) {
      if (subcommand.unlisted) continue;
      subcommands.push(fromCommand(subcommand));
    }
  }
  return {
    name: cmd.name,
    description: cmd.shortDescription ?? cmd.description,
    flags,
    arguments: args2,
    subcommands
  };
};

// node_modules/effect/dist/unstable/cli/internal/help.js
var dedupeGlobalFlags = (flags) => {
  const seen = /* @__PURE__ */ new Set();
  const deduped = [];
  for (const flag of flags) {
    if (seen.has(flag)) {
      continue;
    }
    seen.add(flag);
    deduped.push(flag);
  }
  return deduped;
};
var getCommandsForCommandPath = (command, commandPath) => {
  const commands = [command];
  let currentCommand = command;
  for (let i = 1; i < commandPath.length; i++) {
    const subcommandName = commandPath[i];
    let subcommand = void 0;
    for (const group2 of currentCommand.subcommands) {
      subcommand = group2.commands.find((sub) => sub.name === subcommandName);
      if (subcommand) {
        break;
      }
    }
    if (!subcommand) {
      break;
    }
    commands.push(subcommand);
    currentCommand = subcommand;
  }
  return commands;
};
var getGlobalFlagsForCommandPath = (command, commandPath, builtIns) => {
  const commands = getCommandsForCommandPath(command, commandPath);
  const declared = commands.flatMap((current) => toImpl(current).globalFlags);
  return dedupeGlobalFlags([...builtIns, ...declared]);
};
var collectDeclaredGlobalFlags = (command) => {
  const collected = [];
  const visit = (current) => {
    const impl = toImpl(current);
    for (const flag of impl.globalFlags) {
      collected.push(flag);
    }
    for (const group2 of current.subcommands) {
      for (const subcommand of group2.commands) {
        visit(subcommand);
      }
    }
  };
  visit(command);
  return dedupeGlobalFlags(collected);
};
var getSharedFlagsForCommandPath = (commands, currentFlags) => {
  if (commands.length <= 1) {
    return [];
  }
  const seen = new Set(currentFlags.map((flag) => flag.name));
  const sharedFlags = [];
  for (const ancestor of commands.slice(0, -1)) {
    const ancestorImpl = toImpl(ancestor);
    for (const flag of ancestorImpl.contextConfig.flags) {
      const singles = extractSingleParams(flag);
      const metadata = getParamMetadata(flag);
      for (const single of singles) {
        if (seen.has(single.name)) {
          continue;
        }
        if (single.hidden) {
          continue;
        }
        seen.add(single.name);
        sharedFlags.push(toFlagDoc(single, metadata));
      }
    }
  }
  return sharedFlags;
};
var getGlobalFlagsForCommandTree = (command, builtIns) => dedupeGlobalFlags([...builtIns, ...collectDeclaredGlobalFlags(command)]);
var getHelpForCommandPath = (command, commandPath, builtIns) => gen2(function* () {
  const commands = getCommandsForCommandPath(command, commandPath);
  const currentCommand = commands.length > 0 ? commands[commands.length - 1] : command;
  const baseDoc = toImpl(currentCommand).buildHelpDoc(commandPath);
  const sharedFlags = getSharedFlagsForCommandPath(commands, baseDoc.flags);
  const flags = getGlobalFlagsForCommandPath(command, commandPath, builtIns);
  const globalFlagDocs = [];
  for (const flag of flags) {
    const singles = extractSingleParams(flag.flag);
    const metadata = getParamMetadata(flag.flag);
    for (const single of singles) {
      if (single.hidden) continue;
      globalFlagDocs.push({
        ...toFlagDoc(single, metadata),
        required: false
      });
    }
  }
  return {
    ...baseDoc,
    flags: [...sharedFlags, ...baseDoc.flags],
    globalFlags: globalFlagDocs
  };
});

// node_modules/effect/dist/unstable/cli/GlobalFlag.js
var action = (options) => ({
  _tag: "Action",
  flag: options.flag,
  run: options.run
});
var setting = (id) => (options) => {
  settingIdCounter += 1;
  const ref = Service(`effect/unstable/cli/GlobalFlag/${id}/${settingIdCounter}`);
  return Object.assign(ref, {
    _tag: "Setting",
    id,
    flag: options.flag
  });
};
var settingIdCounter = 0;
var Help = /* @__PURE__ */ action({
  flag: /* @__PURE__ */ boolean4("help").pipe(/* @__PURE__ */ withAlias2("h"), /* @__PURE__ */ withDescription3("Show help information"), /* @__PURE__ */ withDefault5(false)),
  run: /* @__PURE__ */ fnUntraced2(function* (_, {
    builtIns,
    command,
    commandPath
  }) {
    const formatter = yield* Formatter;
    const helpDoc = yield* getHelpForCommandPath(command, commandPath, builtIns);
    yield* log2(formatter.formatHelpDoc(helpDoc));
  })
});
var Version = /* @__PURE__ */ action({
  flag: /* @__PURE__ */ boolean4("version").pipe(/* @__PURE__ */ withAlias2("v"), /* @__PURE__ */ withDescription3("Show version information"), /* @__PURE__ */ withDefault5(false)),
  run: /* @__PURE__ */ fnUntraced2(function* (_, {
    command,
    version
  }) {
    const formatter = yield* Formatter;
    yield* log2(formatter.formatVersion(command.name, version));
  })
});
var Wizard = /* @__PURE__ */ action({
  flag: /* @__PURE__ */ boolean4("wizard").pipe(/* @__PURE__ */ withDescription3("Start wizard mode for a command"), /* @__PURE__ */ withDefault5(false)),
  run: () => void_3
});
var Completions = /* @__PURE__ */ action({
  flag: /* @__PURE__ */ choice4("completions", ["bash", "zsh", "fish", "sh"]).pipe(optional5, /* @__PURE__ */ map13((v) => map(v, (s) => s === "sh" ? "bash" : s)), /* @__PURE__ */ withMetavar3("<bash|zsh|fish|sh>"), /* @__PURE__ */ withDescription3("Print shell completion script")),
  run: /* @__PURE__ */ fnUntraced2(function* (shell, {
    command
  }) {
    if (isNone2(shell)) return;
    const descriptor = fromCommand(command);
    yield* log2(generate4(command.name, shell.value, descriptor));
  })
});
var LogLevel = /* @__PURE__ */ setting("log-level")({
  flag: /* @__PURE__ */ choiceWithValue3("log-level", [["all", "All"], ["trace", "Trace"], ["debug", "Debug"], ["info", "Info"], ["warn", "Warn"], ["warning", "Warn"], ["error", "Error"], ["fatal", "Fatal"], ["none", "None"]]).pipe(optional5, /* @__PURE__ */ withDescription3("Sets the minimum log level"), /* @__PURE__ */ withMetavar3("<all|trace|debug|info|warn|warning|error|fatal|none>"))
});
var BuiltIns = [Help, Version, Wizard, Completions, LogLevel];

// node_modules/effect/dist/unstable/cli/CliConfig.js
var CliConfig = class extends (/* @__PURE__ */ Reference("effect/unstable/cli/CliConfig", {
  defaultValue: () => defaults
})) {
};
var defaults = {
  builtIns: BuiltIns
};

// node_modules/effect/dist/unstable/cli/Command.js
var Command_exports = {};
__export(Command_exports, {
  annotate: () => annotate3,
  annotateMerge: () => annotateMerge,
  isCommand: () => isCommand,
  make: () => make34,
  provide: () => provide6,
  provideEffect: () => provideEffect,
  provideEffectDiscard: () => provideEffectDiscard,
  provideSync: () => provideSync,
  run: () => run5,
  runWith: () => runWith2,
  unlisted: () => unlisted,
  withAlias: () => withAlias3,
  withDescription: () => withDescription4,
  withExamples: () => withExamples,
  withGlobalFlags: () => withGlobalFlags,
  withHandler: () => withHandler,
  withSharedFlags: () => withSharedFlags,
  withShortDescription: () => withShortDescription,
  withSubcommands: () => withSubcommands,
  wizard: () => wizard
});

// node_modules/effect/dist/unstable/cli/internal/lexer.js
function lex(argv) {
  const endIndex = argv.indexOf("--");
  if (endIndex === -1) {
    return {
      tokens: lexTokens(argv),
      trailingOperands: []
    };
  }
  return {
    tokens: lexTokens(argv.slice(0, endIndex)),
    trailingOperands: argv.slice(endIndex + 1)
  };
}
var lexTokens = (args2) => {
  const tokens = [];
  for (const arg of args2) {
    if (!arg.startsWith("-")) {
      tokens.push({
        _tag: "Value",
        value: arg
      });
    } else if (arg.startsWith("--")) {
      const equalIndex = arg.indexOf("=");
      if (equalIndex !== -1) {
        const name = arg.slice(2, equalIndex);
        const value3 = arg.slice(equalIndex + 1);
        tokens.push({
          _tag: "LongOption",
          name,
          raw: arg,
          value: value3
        });
      } else {
        tokens.push({
          _tag: "LongOption",
          name: arg.slice(2),
          raw: arg
        });
      }
    } else if (arg.length > 1) {
      const flags = arg.slice(1);
      const equalIndex = flags.indexOf("=");
      if (equalIndex !== -1) {
        const flag = flags.slice(0, equalIndex);
        const value3 = flags.slice(equalIndex + 1);
        tokens.push({
          _tag: "ShortOption",
          flag,
          raw: `-${flag}`,
          value: value3
        });
      } else {
        for (const ch of flags) {
          tokens.push({
            _tag: "ShortOption",
            flag: ch,
            raw: `-${ch}`
          });
        }
      }
    } else {
      tokens.push({
        _tag: "Value",
        value: arg
      });
    }
  }
  return tokens;
};

// node_modules/effect/dist/unstable/cli/internal/auto-suggest.js
var levenshtein = (a, b) => {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({
    length: m + 1
  }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
};
var suggest = (input, candidates) => {
  const distances = candidates.map((c) => [levenshtein(input, c), c]).filter(([d]) => d <= 2).sort(([a], [b]) => a - b);
  if (distances.length === 0) return [];
  const minDistance = distances[0][0];
  return distances.filter(([d]) => d === minDistance).map(([, c]) => c);
};

// node_modules/effect/dist/unstable/cli/internal/parser.js
var getCommandPath = (parsedInput) => match(parsedInput.subcommand, {
  onNone: () => [],
  onSome: (subcommand) => [subcommand.name, ...getCommandPath(subcommand.parsedInput)]
});
var parseArgs = (lexResult, command, commandPath = []) => gen2(function* () {
  const {
    tokens,
    trailingOperands: afterEndOfOptions
  } = lexResult;
  const newCommandPath = [...commandPath, command.name];
  const commandImpl = toImpl(command);
  const singles = commandImpl.config.flags.flatMap(extractSingleParams);
  const flagParams = singles.filter(isFlagParam);
  const flagRegistry = createFlagRegistry(flagParams);
  const inheritedSingles = commandImpl.contextConfig.flags.flatMap(extractSingleParams);
  const inheritedFlagParams = inheritedSingles.filter(isFlagParam);
  const inheritedFlagRegistry = createFlagRegistry(inheritedFlagParams);
  const inheritedNames = new Set(inheritedFlagParams.map((param) => param.name));
  const context3 = {
    command,
    commandPath: newCommandPath,
    flagRegistry,
    inheritedFlagRegistry,
    localFlagNames: flagParams.filter((param) => !inheritedNames.has(param.name)).map((param) => param.name)
  };
  const result3 = scanCommandLevel(tokens, context3);
  if (result3._tag === "Leaf") {
    return {
      flags: result3.flags,
      arguments: [...result3.arguments, ...afterEndOfOptions],
      subcommand: none2(),
      ...result3.errors.length > 0 && {
        errors: result3.errors
      }
    };
  }
  const subLex = {
    tokens: result3.childTokens,
    trailingOperands: afterEndOfOptions
  };
  const subParsed = yield* parseArgs(subLex, result3.sub, newCommandPath);
  const allErrors = [...result3.errors, ...subParsed.errors ?? []];
  return {
    flags: result3.flags,
    arguments: [],
    subcommand: some2({
      name: result3.sub.name,
      parsedInput: subParsed
    }),
    ...allErrors.length > 0 && {
      errors: allErrors
    }
  };
});
var makeCursor = (tokens) => {
  let i = 0;
  return {
    peek: () => tokens[i],
    take: () => tokens[i++],
    rest: () => tokens.slice(i)
  };
};
var createFlagRegistry = (params) => {
  const index = /* @__PURE__ */ new Map();
  for (const param of params) {
    if (index.has(param.name)) {
      throw new Error(`Duplicate flag name "${param.name}" in command definition`);
    }
    index.set(param.name, param);
    for (const alias of param.aliases) {
      if (index.has(alias)) {
        throw new Error(`Duplicate flag/alias "${alias}" in command definition (conflicts with "${index.get(alias).name}")`);
      }
      index.set(alias, param);
    }
  }
  return {
    params,
    index
  };
};
var buildSubcommandIndex = (subcommands) => {
  const index = /* @__PURE__ */ new Map();
  const setKey = (key, command) => {
    const existing = index.get(key);
    if (existing && existing !== command) {
      throw new Error(`Duplicate subcommand name/alias "${key}" in command definition (conflicts with "${existing.name}")`);
    }
    index.set(key, command);
  };
  for (const group2 of subcommands) {
    for (const subcommand of group2.commands) {
      setKey(subcommand.name, subcommand);
      if (subcommand.alias && subcommand.alias !== subcommand.name) {
        setKey(subcommand.alias, subcommand);
      }
    }
  }
  return index;
};
var createEmptyFlagMap = (params) => Object.fromEntries(params.map((p) => [p.name, []]));
var createFlagAccumulator = (params) => {
  const map14 = createEmptyFlagMap(params);
  return {
    add: (name, raw) => {
      if (raw !== void 0) map14[name].push(raw);
    },
    merge: (from) => {
      for (const key in from) {
        const values = from[key];
        if (values?.length) {
          for (let i = 0; i < values.length; i++) {
            map14[key].push(values[i]);
          }
        }
      }
    },
    snapshot: () => map14
  };
};
var isFlagToken = (t) => t._tag === "LongOption" || t._tag === "ShortOption";
var getFlagName = (t) => t._tag === "LongOption" ? t.name : t.flag;
var resolveFlag = (token, registry) => {
  const tokenName = getFlagName(token);
  const direct = registry.index.get(tokenName);
  if (direct && direct.name === tokenName) {
    return {
      param: direct,
      negated: false
    };
  }
  if (token._tag === "LongOption" && token.name.startsWith("no-")) {
    const canonicalName = token.name.slice(3);
    const param = registry.index.get(canonicalName);
    if (param && param.name === canonicalName && isBoolean2(param.primitiveType)) {
      return {
        param,
        negated: true
      };
    }
  }
  if (direct) {
    return {
      param: direct,
      negated: false
    };
  }
  return void 0;
};
var invalidNegatedFlagValue = (token, spec, value3) => new InvalidValue2({
  option: spec.name,
  value: value3,
  expected: `omit the value and use ${token.raw} by itself to set --${spec.name} to false`,
  kind: "flag"
});
var missingFlagValue = (spec) => {
  const choices = getChoiceKeys(spec.primitiveType);
  return new InvalidValue2({
    option: spec.name,
    value: "",
    expected: choices === void 0 ? spec.typeName ?? getTypeName(spec.primitiveType) : choices.join(" | "),
    kind: "flag"
  });
};
var asBooleanLiteral = (token) => token?._tag === "Value" && (isTrueValue(token.value) || isFalseValue(token.value)) ? token.value : void 0;
var consumeFlagValue = (cursor, token, spec, negated = false) => {
  const consumed = consumeFlagValueWithTokens(cursor, token, spec, negated);
  switch (consumed._tag) {
    case "Value":
      return {
        _tag: "Value",
        value: consumed.value
      };
    case "Error":
      return {
        _tag: "Error",
        error: consumed.error
      };
  }
};
var consumeFlagValueWithTokens = (cursor, token, spec, negated = false) => {
  if (negated) {
    if (token.value !== void 0) {
      return {
        _tag: "Error",
        error: invalidNegatedFlagValue(token, spec, token.value),
        tokens: []
      };
    }
    const literal2 = asBooleanLiteral(cursor.peek());
    if (literal2 !== void 0) {
      const literalToken = cursor.take();
      return {
        _tag: "Error",
        error: invalidNegatedFlagValue(token, spec, literal2),
        tokens: literalToken === void 0 ? [] : [literalToken]
      };
    }
    return {
      _tag: "Value",
      value: "false",
      tokens: []
    };
  }
  if (token.value !== void 0) {
    return {
      _tag: "Value",
      value: token.value,
      tokens: []
    };
  }
  if (isBoolean2(spec.primitiveType)) {
    const literal2 = asBooleanLiteral(cursor.peek());
    const literalToken = literal2 !== void 0 ? cursor.take() : void 0;
    return {
      _tag: "Value",
      value: literal2 ?? "true",
      tokens: literalToken === void 0 ? [] : [literalToken]
    };
  }
  const next = cursor.peek();
  if (next?._tag === "Value") {
    const valueToken = cursor.take();
    return {
      _tag: "Value",
      value: next.value,
      tokens: valueToken === void 0 ? [] : [valueToken]
    };
  }
  return {
    _tag: "Error",
    error: missingFlagValue(spec),
    tokens: []
  };
};
var consumeKnownFlags = (tokens, registry) => {
  const flagMap = createEmptyFlagMap(registry.params);
  const remainder = [];
  const errors = [];
  const cursor = makeCursor(tokens);
  for (let t = cursor.take(); t; t = cursor.take()) {
    if (!isFlagToken(t)) {
      remainder.push(t);
      continue;
    }
    const resolved2 = resolveFlag(t, registry);
    if (!resolved2) {
      remainder.push(t);
      continue;
    }
    const consumed = consumeFlagValue(cursor, t, resolved2.param, resolved2.negated);
    if (consumed._tag === "Error") {
      errors.push(consumed.error);
      continue;
    }
    if (consumed.value !== void 0) {
      flagMap[resolved2.param.name].push(consumed.value);
    }
  }
  return {
    flagMap,
    remainder,
    errors
  };
};
var extractFlagParams = (command) => {
  const commandImpl = toImpl(command);
  const singles = commandImpl.config.flags.flatMap(extractSingleParams);
  return singles.filter(isFlagParam);
};
var extractContextFlagParams = (command) => {
  const commandImpl = toImpl(command);
  const singles = commandImpl.contextConfig.flags.flatMap(extractSingleParams);
  return singles.filter(isFlagParam);
};
var resolveFromRegistries = (token, registries) => {
  for (const registry of registries) {
    const resolved2 = resolveFlag(token, registry);
    if (resolved2 !== void 0) {
      return resolved2;
    }
  }
  return void 0;
};
var preserveFlag = (remainder, cursor, token, resolved2) => {
  remainder.push(token);
  const consumed = consumeFlagValueWithTokens(cursor, token, resolved2.param, resolved2.negated);
  remainder.push(...consumed.tokens);
};
var localFlagWouldPrecedeSubcommand = (token, remainingTokens, resolved2, subIndex, registries) => {
  const cursor = makeCursor(remainingTokens);
  consumeFlagValueWithTokens(cursor, token, resolved2.param, resolved2.negated);
  for (let token2 = cursor.take(); token2; token2 = cursor.take()) {
    if (isFlagToken(token2)) {
      const known = resolveFromRegistries(token2, registries);
      if (known !== void 0) {
        consumeFlagValueWithTokens(cursor, token2, known.param, known.negated);
      }
      continue;
    }
    if (token2._tag === "Value") {
      return subIndex.has(token2.value);
    }
  }
  return false;
};
var consumeGlobalFlags = (tokens, command, registry) => {
  const flagMap = createEmptyFlagMap(registry.params);
  const errors = [];
  const consumeLevel = (tokens2, command2, ignoredRegistries) => {
    const localRegistry = createFlagRegistry(extractFlagParams(command2));
    const inheritedRegistry = createFlagRegistry(extractContextFlagParams(command2));
    const subIndex = buildSubcommandIndex(command2.subcommands);
    const cursor = makeCursor(tokens2);
    const remainder = [];
    let awaitingFirstValue = true;
    for (let token = cursor.take(); token; token = cursor.take()) {
      if (isFlagToken(token)) {
        const ignored = resolveFromRegistries(token, ignoredRegistries);
        if (ignored !== void 0) {
          preserveFlag(remainder, cursor, token, ignored);
          continue;
        }
        const inherited = resolveFlag(token, inheritedRegistry);
        if (inherited !== void 0) {
          preserveFlag(remainder, cursor, token, inherited);
          continue;
        }
        const local = resolveFlag(token, localRegistry);
        const global = resolveFlag(token, registry);
        if (local !== void 0) {
          if (global === void 0 || !awaitingFirstValue || !localFlagWouldPrecedeSubcommand(token, cursor.rest(), local, subIndex, [localRegistry, inheritedRegistry, registry])) {
            preserveFlag(remainder, cursor, token, local);
            continue;
          }
        }
        if (global !== void 0) {
          const consumed = consumeFlagValueWithTokens(cursor, token, global.param, global.negated);
          if (consumed._tag === "Error") {
            errors.push(consumed.error);
            continue;
          }
          if (consumed.value !== void 0) {
            flagMap[global.param.name].push(consumed.value);
          }
          continue;
        }
        remainder.push(token);
        continue;
      }
      if (token._tag === "Value" && awaitingFirstValue) {
        const sub = subIndex.get(token.value);
        if (sub !== void 0) {
          remainder.push(token);
          remainder.push(...consumeLevel(cursor.rest(), sub, [...ignoredRegistries, inheritedRegistry]));
          return remainder;
        }
        awaitingFirstValue = false;
      }
      remainder.push(token);
    }
    return remainder;
  };
  return {
    flagMap,
    remainder: consumeLevel(tokens, command, []),
    errors
  };
};
var createUnrecognizedFlagError = (token, params, commandPath) => {
  const printable = token._tag === "LongOption" ? `--${token.name}` : `-${token.flag}`;
  const validNames = [];
  for (const p of params) {
    if (p.hidden) continue;
    validNames.push(p.name);
    if (isBoolean2(p.primitiveType)) {
      validNames.push(`no-${p.name}`);
    }
    for (const alias of p.aliases) {
      validNames.push(alias);
    }
  }
  const suggestions = suggest(getFlagName(token), validNames).map((n) => n.length === 1 ? `-${n}` : `--${n}`);
  return new UnrecognizedOption({
    option: printable,
    suggestions,
    command: commandPath
  });
};
var createParseState = (registry) => ({
  flags: createFlagAccumulator(registry.params),
  arguments: [],
  errors: [],
  mode: {
    _tag: "AwaitingFirstValue"
  }
});
var toLeafResult = (state) => ({
  _tag: "Leaf",
  flags: state.flags.snapshot(),
  arguments: state.arguments,
  errors: state.errors
});
var resolveFirstValue = (value3, cursor, context3, state) => {
  const {
    command,
    commandPath,
    inheritedFlagRegistry,
    localFlagNames
  } = context3;
  const subIndex = buildSubcommandIndex(command.subcommands);
  const sub = subIndex.get(value3);
  if (sub) {
    const selectedPath = [...commandPath, sub.name];
    const parentFlags = state.flags.snapshot();
    for (const localFlagName of localFlagNames) {
      const values = parentFlags[localFlagName];
      if (values !== void 0 && values.length > 0) {
        state.errors.push(new UnrecognizedOption({
          option: `--${localFlagName}`,
          suggestions: [],
          command: selectedPath
        }));
      }
    }
    const tail = consumeKnownFlags(cursor.rest(), inheritedFlagRegistry);
    state.flags.merge(tail.flagMap);
    state.errors.push(...tail.errors);
    return {
      _tag: "Subcommand",
      result: {
        _tag: "Sub",
        flags: state.flags.snapshot(),
        sub,
        childTokens: tail.remainder,
        errors: state.errors
      }
    };
  }
  const expectsArgs = toImpl(command).config.arguments.length > 0;
  if (!expectsArgs && subIndex.size > 0) {
    const visibleKeys = [];
    for (const [key, sub2] of subIndex) {
      if (!sub2.unlisted) visibleKeys.push(key);
    }
    const suggestions = suggest(value3, visibleKeys);
    state.errors.push(new UnknownSubcommand({
      subcommand: value3,
      parent: commandPath,
      suggestions
    }));
  }
  return {
    _tag: "Argument"
  };
};
var processFlag = (token, cursor, context3, state) => {
  const {
    commandPath,
    flagRegistry
  } = context3;
  const resolved2 = resolveFlag(token, flagRegistry);
  if (!resolved2) {
    state.errors.push(createUnrecognizedFlagError(token, flagRegistry.params, commandPath));
    return;
  }
  const consumed = consumeFlagValue(cursor, token, resolved2.param, resolved2.negated);
  if (consumed._tag === "Error") {
    state.errors.push(consumed.error);
    return;
  }
  state.flags.add(resolved2.param.name, consumed.value);
};
var processValue = (value3, cursor, context3, state) => {
  if (state.mode._tag === "AwaitingFirstValue") {
    const result3 = resolveFirstValue(value3, cursor, context3, state);
    if (result3._tag === "Subcommand") {
      return result3.result;
    }
    state.mode = {
      _tag: "CollectingArguments"
    };
  }
  state.arguments.push(value3);
  return void 0;
};
var scanCommandLevel = (tokens, context3) => {
  const cursor = makeCursor(tokens);
  const state = createParseState(context3.flagRegistry);
  for (let token = cursor.take(); token; token = cursor.take()) {
    if (isFlagToken(token)) {
      processFlag(token, cursor, context3, state);
      continue;
    }
    if (token._tag === "Value") {
      const subResult = processValue(token.value, cursor, context3, state);
      if (subResult) return subResult;
    }
  }
  return toLeafResult(state);
};

// node_modules/effect/dist/unstable/cli/internal/wizard.js
var run4 = /* @__PURE__ */ fnUntraced2(function* (command, options) {
  const commandPath = options?.commandPath ?? [command.name];
  const selected = getCommandAtPath(command, commandPath);
  const commandLine = (options?.prefix ?? commandPath).map((value3) => commandLineArg(value3));
  yield* logCurrentCommand(commandLine);
  yield* promptCommand(selected, commandLine, selected === command ? "ROOT" : selected.name);
  return {
    args: commandLine.map((arg) => arg.value),
    displayArgs: commandLine.map((arg) => arg.displayValue)
  };
});
var getCommandAtPath = (command, commandPath) => {
  let current = command;
  for (const name of commandPath.slice(1)) {
    const child = current.subcommands.flatMap((group2) => group2.commands).find((candidate) => candidate.name === name || candidate.alias === name);
    if (child === void 0) {
      break;
    }
    current = child;
  }
  return current;
};
var promptCommand = /* @__PURE__ */ fnUntraced2(function* (command, commandLine, sectionName) {
  const impl = toImpl(command);
  const visibleSubcommands = command.subcommands.flatMap((group2) => group2.commands.filter((child2) => !child2.unlisted));
  const config = visibleSubcommands.length === 0 ? impl.config : impl.contextConfig;
  if (config.flags.length > 0) {
    yield* log2(renderSection(sectionName, "FLAGS"));
    for (const param of config.flags) {
      commandLine.push(...yield* promptParam(param));
    }
    if (config.arguments.length > 0 || visibleSubcommands.length > 0) {
      yield* logCurrentCommand(commandLine);
    }
  }
  if (config.arguments.length > 0) {
    yield* log2(renderSection(sectionName, "ARGUMENTS"));
    for (const param of config.arguments) {
      commandLine.push(...yield* promptParam(param));
    }
    if (visibleSubcommands.length > 0) {
      yield* logCurrentCommand(commandLine);
    }
  }
  if (visibleSubcommands.length === 0) {
    return;
  }
  const child = yield* run3(select({
    message: "Command",
    choices: visibleSubcommands.map((command2) => ({
      title: command2.name,
      value: command2,
      ...command2.shortDescription !== void 0 ? {
        description: command2.shortDescription
      } : command2.description !== void 0 ? {
        description: command2.description
      } : {}
    }))
  }));
  yield* log2();
  commandLine.push(commandLineArg(child.name));
  if (hasWizardSteps(child)) {
    yield* logCurrentCommand(commandLine);
  }
  yield* promptCommand(child, commandLine, child.name);
});
var hasWizardSteps = (command) => {
  const hasVisibleSubcommands = command.subcommands.some((group2) => group2.commands.some((child) => !child.unlisted));
  return hasVisibleSubcommands || toImpl(command).config.orderedParams.length > 0;
};
var promptParam = /* @__PURE__ */ fnUntraced2(function* (param) {
  const single = getUnderlyingSingleOrThrow(param);
  const metadata = getParamMetadata(param);
  if (metadata.isOptional) {
    const include = yield* run3(confirm({
      message: `Set ${renderParamLabel(single)}?`,
      initial: false
    }));
    if (!include) {
      yield* log2();
      return [];
    }
  }
  const count2 = !metadata.isVariadic ? 1 : yield* run3(integer2({
    message: `${renderParamLabel(single)} count`,
    default: getOrElse(metadata.variadicMin, () => 0),
    min: getOrElse(metadata.variadicMin, () => 0),
    ...isSome2(metadata.variadicMax) ? {
      max: metadata.variadicMax.value
    } : {}
  }));
  const values = [];
  for (let i = 0; i < count2; i++) {
    values.push(yield* promptSingle(single));
  }
  const parsed = single.kind === flagKind ? {
    flags: {
      [single.name]: values.map((arg) => arg.value)
    },
    arguments: []
  } : {
    flags: {},
    arguments: values.map((arg) => arg.value)
  };
  yield* param.parse(parsed);
  yield* log2();
  if (single.kind === argumentKind) {
    return values;
  }
  return values.flatMap((value3) => [commandLineArg(`--${single.name}`), value3]);
});
var promptSingle = (single) => {
  const message = renderParamMessage(single);
  switch (single.primitiveType._tag) {
    case "Boolean":
      return map6(run3(confirm({
        message,
        label: {
          confirm: "true",
          deny: "false"
        },
        placeholder: {
          defaultConfirm: "(T/f)",
          defaultDeny: "(t/F)"
        }
      })), (value3) => commandLineArg(String(value3)));
    case "Choice": {
      const choices = getChoiceKeys(single.primitiveType) ?? [];
      return map6(run3(select({
        message,
        choices: choices.map((choice5) => ({
          title: choice5,
          value: choice5
        }))
      })), commandLineArg);
    }
    case "Date":
      return map6(run3(date2({
        message
      })), (date6) => commandLineArg(date6.toISOString()));
    case "Float":
      return map6(run3(float2({
        message
      })), (value3) => commandLineArg(String(value3)));
    case "Integer":
      return map6(run3(integer2({
        message
      })), (value3) => commandLineArg(String(value3)));
    case "Redacted":
      return map6(run3(password({
        message
      })), (value3) => commandLineArg(value2(value3), "<redacted>"));
    default:
      return map6(run3(text({
        message
      })), commandLineArg);
  }
};
var commandLineArg = (value3, displayValue = value3) => ({
  value: value3,
  displayValue
});
var formatName = (single) => single.kind === flagKind ? `--${single.name}` : single.name;
var renderParamMessage = (single) => renderParamLabel(single);
var renderParamLabel = (single) => {
  const description = getOrUndefined(single.description)?.trim();
  const label = single.kind === flagKind && description !== void 0 && description.length <= 32 ? description : humanize(single.name);
  return single.kind === flagKind ? `${label} (${formatName(single)})` : label;
};
var humanize = (name) => {
  const words = name.split(/[-_]+/).filter((word) => word.length > 0);
  if (words.length === 0) return name;
  return [words[0][0].toUpperCase() + words[0].slice(1), ...words.slice(1)].join(" ");
};
var logCurrentCommand = (commandLine) => log2(renderCommandBlock("Current command", commandLine.map((arg) => arg.displayValue), magenta));
var renderSection = (commandName, section) => `${annotate2(commandName.toUpperCase(), bold, cyanBright)} ${annotate2("\xB7", blackBright)} ${annotate2(section, bold, white)}`;
var renderIntroduction = (name, version, summary) => {
  const title = `${annotate2(name, bold, cyanBright)} ${annotate2(`v${version}`, white)} ${annotate2("\xB7 Command wizard", bold, white)}`;
  return [title, ...summary === void 0 || summary.length === 0 ? [] : [summary], annotate2("Build a command interactively. Press Ctrl+C to cancel.", blackBright), ""].join("\n");
};
var renderCompletion = (commandLine) => renderCommandBlock("Command ready", commandLine, cyanBright, green);
var renderQuit = () => `
${annotate2("Wizard cancelled.", red)}`;
var renderCommandBlock = (label, commandLine, commandColor, labelColor = white) => {
  const lines2 = wrapCommand(commandLine);
  return [annotate2(label, bold, labelColor), ...lines2.map((line) => annotate2(line, commandColor)), ""].join("\n");
};
var wrapCommand = (commandLine) => {
  const width = 88;
  const firstIndent = "  $ ";
  const continuationIndent = "    ";
  const args2 = commandLine.map(formatShellArg);
  const lines2 = [];
  let current = firstIndent;
  for (const arg of args2) {
    const separator = current === firstIndent || current === continuationIndent ? "" : " ";
    if (current.length + separator.length + arg.length > width && current !== firstIndent) {
      lines2.push(`${current} \\`);
      current = `${continuationIndent}${arg}`;
    } else {
      current += `${separator}${arg}`;
    }
  }
  if (current !== firstIndent) {
    lines2.push(current);
  }
  return lines2;
};
var formatShellArg = (arg) => /^[A-Za-z0-9_./:@%+=,-]+$/.test(arg) ? arg : `'${arg.replaceAll("'", `'"'"'`)}'`;

// node_modules/effect/dist/unstable/cli/Command.js
var isCommand = (u) => hasProperty(u, TypeId40);
var make34 = (name, config, handler) => {
  const parsedConfig = parseConfig(config ?? {});
  return makeCommand({
    name,
    config: parsedConfig,
    ...isNotUndefined(handler) ? {
      handle: handler
    } : {}
  });
};
var withHandler = /* @__PURE__ */ dual(2, (self, handler) => makeCommand({
  ...toImpl(self),
  handle: handler
}));
var normalizeSubcommandEntries = (entries) => {
  const flat = [];
  const grouped = /* @__PURE__ */ new Map();
  const addToGroup = (group2, command) => {
    flat.push(command);
    const existing = grouped.get(group2);
    if (existing) {
      existing.push(command);
    } else {
      grouped.set(group2, [command]);
    }
  };
  for (const entry of entries) {
    if (isCommand(entry)) {
      addToGroup(void 0, entry);
      continue;
    }
    for (const command of entry.commands) {
      addToGroup(entry.group, command);
    }
  }
  const groups = [];
  const ungroupedCommands = grouped.get(void 0);
  if (ungroupedCommands && ungroupedCommands.length > 0) {
    groups.push({
      group: void 0,
      commands: ungroupedCommands
    });
  }
  for (const [group2, commands] of grouped) {
    if (group2 === void 0) {
      continue;
    }
    groups.push({
      group: group2,
      commands
    });
  }
  return {
    flat,
    groups
  };
};
var withSubcommands = /* @__PURE__ */ dual(2, (self, subcommands) => {
  const normalized = normalizeSubcommandEntries(subcommands);
  checkForDuplicateFlags(self, normalized.flat);
  const impl = toImpl(self);
  const byName = new Map(normalized.flat.map((s) => [s.name, toImpl(s)]));
  const SubcommandStateSymbol = /* @__PURE__ */ Symbol("effect/cli/SubcommandState");
  const parse4 = fnUntraced2(function* (raw) {
    if (isNone2(raw.subcommand)) {
      return yield* impl.parse(raw);
    }
    const sub = byName.get(raw.subcommand.value.name);
    if (!sub) {
      return yield* impl.parse(raw);
    }
    const context3 = yield* impl.parseContext(raw);
    const result3 = yield* sub.parse(raw.subcommand.value.parsedInput);
    return {
      ...context3,
      [SubcommandStateSymbol]: {
        name: sub.name,
        result: result3
      }
    };
  });
  const handle = fnUntraced2(function* (input, path5) {
    const internal = input;
    const selectedSubcommand = internal[SubcommandStateSymbol];
    if (selectedSubcommand) {
      const child = byName.get(selectedSubcommand.name);
      if (!child) {
        return yield* new ShowHelp({
          commandPath: path5,
          errors: []
        });
      }
      return yield* child.handle(selectedSubcommand.result, [...path5, child.name]).pipe(provideService2(impl.service, input));
    }
    return yield* impl.handle(input, path5);
  });
  return makeCommand({
    name: impl.name,
    config: impl.config,
    contextConfig: impl.contextConfig,
    description: impl.description,
    shortDescription: impl.shortDescription,
    alias: impl.alias,
    unlisted: impl.unlisted,
    annotations: impl.annotations,
    globalFlags: impl.globalFlags,
    examples: impl.examples,
    service: impl.service,
    subcommands: normalized.groups,
    parse: parse4,
    parseContext: impl.parseContext,
    handle
  });
});
var withSharedFlags = /* @__PURE__ */ dual(2, (self, sharedFlags) => {
  const impl = toImpl(self);
  const sharedConfig = parseConfig(sharedFlags);
  const mergedConfig = mergeConfig(impl.config, sharedConfig);
  const mergedContextConfig = mergeConfig(impl.contextConfig, sharedConfig);
  if (impl.subcommands.length > 0) {
    const flatSubcommands = impl.subcommands.flatMap((group2) => group2.commands);
    checkForDuplicateFlags(self, flatSubcommands, {
      contextConfig: mergedContextConfig
    });
  }
  const parseShared = makeParser2(sharedConfig, {
    allowLeftovers: true
  });
  const parse4 = fnUntraced2(function* (raw) {
    const base = yield* impl.parse(raw);
    const shared = yield* parseShared(raw);
    return {
      ...base,
      ...shared
    };
  });
  const parseContext = fnUntraced2(function* (raw) {
    const base = yield* impl.parseContext(raw);
    const shared = yield* parseShared(raw);
    return {
      ...base,
      ...shared
    };
  });
  const handle = (input, commandPath) => impl.handle(input, commandPath);
  return makeCommand({
    name: impl.name,
    config: mergedConfig,
    contextConfig: mergedContextConfig,
    description: impl.description,
    shortDescription: impl.shortDescription,
    alias: impl.alias,
    unlisted: impl.unlisted,
    annotations: impl.annotations,
    globalFlags: impl.globalFlags,
    examples: impl.examples,
    service: impl.service,
    subcommands: impl.subcommands,
    parse: parse4,
    parseContext,
    handle
  });
});
var withGlobalFlags = /* @__PURE__ */ dual(2, (self, globalFlags) => {
  const impl = toImpl(self);
  const next = Array.from(/* @__PURE__ */ new Set([...impl.globalFlags, ...globalFlags]));
  return makeCommand({
    ...impl,
    globalFlags: next
  });
});
var withDescription4 = /* @__PURE__ */ dual(2, (self, description) => makeCommand({
  ...toImpl(self),
  description
}));
var withShortDescription = /* @__PURE__ */ dual(2, (self, shortDescription) => makeCommand({
  ...toImpl(self),
  shortDescription
}));
var withAlias3 = /* @__PURE__ */ dual(2, (self, alias) => makeCommand({
  ...toImpl(self),
  alias
}));
var unlisted = (self) => makeCommand({
  ...toImpl(self),
  unlisted: true
});
var annotate3 = /* @__PURE__ */ dual(3, (self, service3, value3) => {
  const impl = toImpl(self);
  return makeCommand({
    ...impl,
    annotations: add(impl.annotations, service3, value3)
  });
});
var annotateMerge = /* @__PURE__ */ dual(2, (self, annotations) => {
  const impl = toImpl(self);
  return makeCommand({
    ...impl,
    annotations: merge(impl.annotations, annotations)
  });
});
var withExamples = /* @__PURE__ */ dual(2, (self, examples) => makeCommand({
  ...toImpl(self),
  examples
}));
var mapHandler = (self, f) => {
  const impl = toImpl(self);
  return makeCommand({
    ...impl,
    handle: (input, path5) => f(impl.handle(input, path5), input)
  });
};
var provide6 = /* @__PURE__ */ dual((args2) => isCommand(args2[0]), (self, layer15, options) => mapHandler(self, (handler, input) => provide4(handler, typeof layer15 === "function" ? layer15(input) : layer15, options)));
var provideSync = /* @__PURE__ */ dual(3, (self, service3, implementation) => mapHandler(self, (handler, input) => provideService2(handler, service3, typeof implementation === "function" ? implementation(input) : implementation)));
var provideEffect = /* @__PURE__ */ dual(3, (self, service3, effect2) => mapHandler(self, (handler, input) => provideServiceEffect2(handler, service3, typeof effect2 === "function" ? effect2(input) : effect2)));
var provideEffectDiscard = /* @__PURE__ */ dual(2, (self, effect2) => mapHandler(self, (handler, input) => andThen2(typeof effect2 === "function" ? effect2(input) : effect2, handler)));
var wizard = (command, options) => map6(run4(command, options), (result3) => result3.args);
var getOutOfScopeGlobalFlagErrors = (allFlags, activeFlags, flagMap, commandPath) => {
  const activeSet = new Set(activeFlags);
  const errors = [];
  const seen = /* @__PURE__ */ new Set();
  for (const flag of allFlags) {
    if (activeSet.has(flag)) {
      continue;
    }
    const singles = extractSingleParams(flag.flag);
    for (const single of singles) {
      const entries = flagMap[single.name];
      if (!entries || entries.length === 0) {
        continue;
      }
      const option4 = `--${single.name}`;
      if (seen.has(option4)) {
        continue;
      }
      seen.add(option4);
      errors.push(new UnrecognizedOption({
        option: option4,
        suggestions: [],
        command: commandPath
      }));
    }
  }
  return errors;
};
var showHelp = (command, error2, renderErrors) => gen2(function* () {
  const {
    builtIns
  } = yield* CliConfig;
  const formatter = yield* Formatter;
  const helpDoc = yield* getHelpForCommandPath(command, error2.commandPath, builtIns);
  yield* log2(formatter.formatHelpDoc(helpDoc));
  if (renderErrors && error2.errors.length > 0) {
    yield* error(formatter.formatErrors(error2.errors));
  }
});
var showUserError = (error2) => gen2(function* () {
  const formatter = yield* Formatter;
  yield* error(formatter.formatError(error2));
  error2[errorReported] = false;
});
var run5 = /* @__PURE__ */ dual(2, (command, config) => Stdio.use(({
  args: args2
}) => flatMap3(args2, (args3) => runWith2(command, config)(args3))));
var runWith2 = (command, config) => {
  const commandImpl = toImpl(command);
  return fnUntraced2(function* (args2) {
    const {
      builtIns
    } = yield* CliConfig;
    const {
      tokens,
      trailingOperands
    } = lex(args2);
    const allFlags = getGlobalFlagsForCommandTree(command, builtIns);
    const allFlagParams = allFlags.flatMap((f) => extractSingleParams(f.flag));
    const globalRegistry = createFlagRegistry(allFlagParams.filter(isFlagParam));
    const {
      flagMap,
      remainder,
      errors: globalFlagErrors
    } = consumeGlobalFlags(tokens, command, globalRegistry);
    const emptyArgs = {
      flags: flagMap,
      arguments: []
    };
    const parsedArgs = yield* parseArgs({
      tokens: remainder,
      trailingOperands
    }, command);
    const commandPath = [command.name, ...getCommandPath(parsedArgs)];
    const handlerCtx = {
      builtIns,
      command,
      commandPath,
      version: config.version
    };
    const activeFlags = getGlobalFlagsForCommandPath(command, commandPath, builtIns);
    const outOfScopeErrors = getOutOfScopeGlobalFlagErrors(allFlags, activeFlags, flagMap, commandPath);
    if (outOfScopeErrors.length > 0 || globalFlagErrors.length > 0) {
      const parseErrors = parsedArgs.errors ?? [];
      return yield* new ShowHelp({
        commandPath,
        errors: [...globalFlagErrors, ...outOfScopeErrors, ...parseErrors]
      });
    }
    for (const flag of activeFlags) {
      if (flag._tag !== "Action") continue;
      const singles = extractSingleParams(flag.flag);
      const hasEntry = singles.some((s) => {
        const entries = flagMap[s.name];
        return entries !== void 0 && entries.length > 0;
      });
      if (!hasEntry) continue;
      const [, value3] = yield* flag.flag.parse(emptyArgs);
      if (flag === Wizard) {
        return yield* gen2(function* () {
          yield* log2(renderIntroduction(command.name, config.version, command.description));
          const prefix = [command.name, ...args2.filter((arg) => arg !== "--wizard" && !arg.startsWith("--wizard="))];
          const wizardResult = yield* run4(command, {
            commandPath,
            prefix
          });
          yield* log2(renderCompletion(wizardResult.displayArgs));
          const shouldRun = yield* run3(toggle({
            message: "Run this command?",
            initial: true,
            active: "yes",
            inactive: "no"
          }));
          if (shouldRun) {
            yield* log2();
            yield* runWith2(command, {
              ...config,
              renderErrors: false
            })(wizardResult.args.slice(1));
          }
        }).pipe(catchTag2("QuitError", () => log2(renderQuit())));
      }
      yield* flag.run(value3, handlerCtx);
      return;
    }
    if (parsedArgs.errors && parsedArgs.errors.length > 0) {
      return yield* new ShowHelp({
        commandPath,
        errors: parsedArgs.errors
      });
    }
    const parseResult = yield* result2(commandImpl.parse(parsedArgs));
    if (parseResult._tag === "Failure") {
      return yield* new ShowHelp({
        commandPath,
        errors: [parseResult.failure]
      });
    }
    let program = commandImpl.handle(parseResult.success, [command.name]);
    const logLevel = activeFlags.includes(LogLevel) ? (yield* LogLevel.flag.parse(emptyArgs))[1] : none2();
    program = provideService2(program, LogLevel, logLevel);
    for (const flag of activeFlags) {
      if (flag._tag !== "Setting" || flag === LogLevel) continue;
      const [, value3] = yield* flag.flag.parse(emptyArgs);
      program = provideService2(program, flag, value3);
    }
    const services = match(logLevel, {
      onNone: () => empty(),
      onSome: (level) => make2(MinimumLogLevel2, level)
    });
    yield* provideContext2(program, services);
  }, catchFilter2((error2) => isCliError(error2) && error2._tag === "ShowHelp" ? succeed2(error2) : fail2(error2), (error2) => andThen2(showHelp(command, error2, config.renderErrors !== false), fail6(error2))), catchFilter2((error2) => config.renderErrors !== false && isCliError(error2) && error2._tag === "UserError" ? succeed2(error2) : fail2(error2), (error2) => andThen2(showUserError(error2), fail6(error2))), catchFilter2((e) => isQuitError(e) ? succeed2(e) : fail2(e), (_) => interrupt2));
};

// src/cli.ts
import { createHash as createHash3, randomUUID } from "node:crypto";
import { existsSync as existsSync3, readFileSync as readFileSync2, realpathSync as realpathSync2, statSync as statSync2 } from "node:fs";
import { extname as extname2, isAbsolute as isAbsolute2, join as join5, relative as relative2, resolve as resolve5 } from "node:path";

// src/protocol.ts
var ACTORS = ["A", "B", "master"];
var POLICIES = ["fix", "report-only", "check-in"];
var DEFAULT_POLICY = "fix";
var PROTOCOL_SCHEMA_VERSION = 1;
var RUN_MODES = ["single", "joint", "cold"];
var ROUTES = ["review", "diagnose"];
var ROW_KINDS = [
  "Coverage",
  "Issue",
  "Question",
  "Proposed fix",
  "Shelved fix",
  "Check-in"
];
var COVERAGE_STATES = ["open", "covered", "gap"];
var ISSUE_STATES = [
  "new",
  "verified",
  "assumed",
  "contested",
  "disproved",
  "duplicate",
  "accepted"
];
var QUESTION_STATES = ["open", "answered"];
var PROPOSED_FIX_STATES = ["draft", "marked", "rejected"];
var SHELVED_FIX_STATES = ["shelved", "conditions", "reviewed"];
var CHECK_IN_STATES = ["approved", "checked in", "dropped"];
var ISSUE_LABELS = [
  "Bug",
  "Restructure",
  "Hardening",
  "Nit",
  "telemetry-quality"
];
function hasRequiredCoverageDeclaration(route, deep, declared) {
  if (route === "diagnose") {
    return declared.some((item) => item.coverageKind === "symptom" || item.coverageKind === "cluster");
  }
  return !deep || declared.some((item) => item.coverageKind === "hunk" || item.coverageKind === "scenario");
}
function initialProtocolState(options) {
  if (!options.campaignId.trim()) throw new Error("campaignId must not be empty");
  const mode = options.mode ?? "joint";
  const deep = mode === "single" ? options.deep ?? false : true;
  const route = options.route ?? "review";
  const declaredCoverage = options.declaredCoverage ?? [];
  if (options.declaredCoverage !== void 0 && !hasRequiredCoverageDeclaration(route, deep, declaredCoverage)) {
    throw new Error(
      route === "diagnose" ? "diagnosis initialization needs a declared symptom or cluster" : "deep review initialization needs a declared hunk or scenario"
    );
  }
  return {
    schemaVersion: PROTOCOL_SCHEMA_VERSION,
    campaignId: options.campaignId,
    mode,
    deep,
    coldSeat: mode === "cold" ? options.coldSeat ?? "A" : null,
    route,
    policy: options.policy ?? DEFAULT_POLICY,
    reportPath: options.reportPath ?? null,
    names: { A: options.names?.A ?? "A", B: options.names?.B ?? "B", master: options.names?.master ?? "master" },
    declaredCoverage,
    rows: [],
    checkout: null,
    issueTakes: [],
    baseline: null,
    handoffs: { A: null, B: null },
    imports: { A: false, B: false },
    reportCheckpoint: null,
    notifications: []
  };
}
var Rejected = class extends Error {
  constructor(code2, message) {
    super(message);
    this.code = code2;
  }
  code;
};
function reject(code2, message) {
  throw new Rejected(code2, message);
}
function requireText(value3, name) {
  if (!value3.trim()) reject("evidence", `${name} must not be empty`);
}
function requireSha256(value3, name) {
  if (!/^[0-9a-f]{64}$/.test(value3)) reject("evidence", `${name} must be a lowercase SHA-256`);
}
function requireList(values, name) {
  if (values.length === 0) reject("evidence", `${name} must not be empty`);
}
function selectedQuestionOption(options, value3) {
  const normalized = options.map(normalizedAnswer);
  const selected = normalizedAnswer(value3);
  const exactIndex = normalized.indexOf(selected);
  if (exactIndex >= 0) return options[exactIndex];
  const label = /^\(([a-z])\)(?:\s|$)/i.exec(value3.trim())?.[1]?.toLowerCase();
  if (!label) return void 0;
  const index = label.charCodeAt(0) - "a".charCodeAt(0);
  if (index < 0 || index >= options.length) return void 0;
  const option4 = options[index];
  if (option4 === void 0) return void 0;
  const optionLabel = /^\(([a-z])\)(?:\s|$)/i.exec(option4.trim())?.[1]?.toLowerCase();
  return optionLabel === void 0 || optionLabel === label ? option4 : void 0;
}
function mapsToQuestionOption(options, value3) {
  return selectedQuestionOption(options, value3) !== void 0;
}
function requireQuestionOptions(options, recommendation) {
  if (options.length < 2) reject("question", "A Question needs at least two options");
  const normalized = options.map((option4) => {
    requireText(option4, "Question option");
    return normalizedAnswer(option4);
  });
  if (new Set(normalized).size !== normalized.length) {
    reject("question", "Question options must be distinct");
  }
  requireText(recommendation, "Question recommendation");
  if (!mapsToQuestionOption(options, recommendation)) {
    reject("question", "Question recommendation must map to an offered option");
  }
}
function requireTimestamp(at) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(at) || new Date(at).toISOString() !== at) {
    reject("evidence", `invalid timestamp '${at}'`);
  }
}
function rowById(state, id) {
  const row = state.rows.find((candidate) => candidate.id === id);
  if (!row) reject("missing-row", `row ${id} does not exist`);
  return row;
}
function rowOfKind(state, id, kind) {
  const row = rowById(state, id);
  if (row.kind !== kind) reject("invalid-state", `${id} is ${row.kind}, not ${kind}`);
  return row;
}
function expectRevision(row, expected) {
  if (row.revision !== expected) {
    reject("revision", `${row.id} is revision ${row.revision}, not ${expected}`);
  }
}
function ensureUniqueId(state, id) {
  if (state.rows.some((row) => row.id === id)) reject("duplicate-id", `row ${id} already exists`);
}
function isSeat(actor) {
  return actor === "A" || actor === "B";
}
function otherSeat(seat) {
  return seat === "A" ? "B" : "A";
}
function currentMark(row) {
  return row.marks[0] ?? null;
}
function hasCurrentMark(row) {
  const mark = currentMark(row);
  return mark !== null && mark.revision === row.revision;
}
function refsCurrent(state, refs, kind) {
  return refs.every((ref) => {
    const row = state.rows.find((candidate) => candidate.id === ref.id);
    return row?.kind === kind && row.revision === ref.revision;
  });
}
function hasOpenQuestion(state, issueId) {
  return state.rows.some(
    (row) => row.kind === "Question" && row.state === "open" && row.issueIds.includes(issueId)
  );
}
function hasAnyQuestion(state, issueId) {
  const issue = rowOfKind(state, issueId, "Issue");
  return state.rows.some(
    (row) => row.kind === "Question" && row.issueRefs.some((ref) => ref.id === issueId && ref.revision === issue.revision)
  );
}
function hasAnsweredDecision(state, issueId) {
  const issue = rowOfKind(state, issueId, "Issue");
  return state.rows.some(
    (row) => row.kind === "Question" && row.purpose === "decision" && row.state === "answered" && row.issueRefs.some((ref) => ref.id === issueId && ref.revision === issue.revision)
  );
}
function hasAnsweredShapeDecision(state, proposed) {
  return state.rows.some(
    (row) => row.kind === "Question" && row.purpose === "decision" && row.state === "answered" && row.proposedFixRef?.id === proposed.id && row.proposedFixRef.revision === proposed.revision
  );
}
function issueTake(state, issueId) {
  return state.issueTakes.find((take3) => take3.issueId === issueId) ?? null;
}
function issueIdsForProposedFixRefs(state, refs) {
  return [...new Set(refs.flatMap((ref) => {
    const row = rowOfKind(state, ref.id, "Proposed fix");
    return row.issueRefs.map((issueRef) => issueRef.id);
  }))];
}
var ALLOW_NO_RED_ANSWER = "allow-no-red";
function normalizedAnswer(answer) {
  return answer.trim().toLowerCase();
}
function currentNoRedQuestion(state, proposed) {
  return state.rows.find(
    (row) => row.kind === "Question" && row.purpose === "no-red" && row.proposedFixRef?.id === proposed.id && row.proposedFixRef.revision === proposed.revision && proposed.issueRefs.every(
      (issueRef) => row.issueRefs.some(
        (questionRef) => questionRef.id === issueRef.id && questionRef.revision === issueRef.revision
      )
    )
  );
}
function allowsNoRedRun(state, refs) {
  return refs.length > 0 && refs.every((proposedRef) => {
    const issueIds = issueIdsForProposedFixRefs(state, [proposedRef]);
    const proposed = rowOfKind(state, proposedRef.id, "Proposed fix");
    const architecture = normalizedAnswer(proposed.fix.testLocation ?? "") === "none" && proposed.fix.originClass === "design-absence" && issueIds.some((issueId) => issueOrAncestorHasLabel(state, issueId, "Restructure"));
    return architecture && state.rows.some(
      (row) => row.kind === "Question" && row.purpose === "no-red" && row.state === "answered" && normalizedAnswer(row.answer) === ALLOW_NO_RED_ANSWER && row.proposedFixRef?.id === proposedRef.id && row.proposedFixRef.revision === proposedRef.revision && proposed.issueRefs.every(
        (issueRef) => row.issueRefs.some(
          (questionRef) => questionRef.id === issueRef.id && questionRef.revision === issueRef.revision
        )
      )
    );
  });
}
function issueOrAncestorHasLabel(state, issueId, label, seen = /* @__PURE__ */ new Set()) {
  if (seen.has(issueId)) return false;
  seen.add(issueId);
  const issue = rowOfKind(state, issueId, "Issue");
  return issue.label === label || issue.parentIssueIds.some(
    (parentId) => issueOrAncestorHasLabel(state, parentId, label, seen)
  );
}
function proposedFixesForIssue(state, issueId) {
  return state.rows.filter(
    (row) => row.kind === "Proposed fix" && row.issueRefs.some((ref) => ref.id === issueId)
  );
}
function proposedFixHasOpenQuestion(state, proposed) {
  return proposed.issueRefs.some((ref) => hasOpenQuestion(state, ref.id));
}
function shelvedFixesForProposedFix(state, id) {
  return state.rows.filter(
    (row) => row.kind === "Shelved fix" && row.proposedFixRefs.some((ref) => ref.id === id)
  );
}
function issueIdsForShelvedFix(state, shelved) {
  return issueIdsForProposedFixRefs(state, shelved.proposedFixRefs);
}
function issueIsSubstantive(issue) {
  return issue.label === "Bug" || issue.label === "Restructure";
}
function issueIsDirectlyFixable(issue) {
  return issueIsSubstantive(issue) || issue.label === "telemetry-quality";
}
function proposedFixIsSubstantive(state, proposed) {
  return proposed.issueRefs.some((ref) => {
    const issue = state.rows.find(
      (row) => row.kind === "Issue" && row.id === ref.id
    );
    return issue !== void 0 && issueIsSubstantive(issue);
  });
}
function proposedFixIsDirectlyShelvable(state, proposed) {
  return proposed.issueRefs.some((ref) => {
    const issue = state.rows.find(
      (row) => row.kind === "Issue" && row.id === ref.id
    );
    return issue !== void 0 && issueIsDirectlyFixable(issue);
  });
}
function proposedFixHasDispositionedIssue(state, proposed) {
  return proposed.issueRefs.some((ref) => {
    const issue = state.rows.find(
      (row) => row.kind === "Issue" && row.id === ref.id
    );
    return issue === void 0 || issue.exit !== void 0 || issue.state !== "verified" && issue.state !== "assumed";
  });
}
function shelvedFixIsSubstantive(state, shelved) {
  return shelved.proposedFixRefs.some((ref) => {
    const proposed = state.rows.find(
      (row) => row.kind === "Proposed fix" && row.id === ref.id
    );
    return proposed !== void 0 && proposedFixIsSubstantive(state, proposed);
  });
}
function shelvedFixIsDirectlyReviewable(state, shelved) {
  return shelved.proposedFixRefs.some((ref) => {
    const proposed = state.rows.find(
      (row) => row.kind === "Proposed fix" && row.id === ref.id
    );
    return proposed !== void 0 && proposedFixIsDirectlyShelvable(state, proposed);
  });
}
function proposedFixIsCurrent(state, proposed) {
  return refsCurrent(state, proposed.issueRefs, "Issue") && !proposedFixHasDispositionedIssue(state, proposed) && !proposedFixHasOpenQuestion(state, proposed);
}
function shelvedFixIsCurrent(state, shelved) {
  if (!refsCurrent(state, shelved.proposedFixRefs, "Proposed fix")) return false;
  return shelved.proposedFixRefs.every((ref) => {
    const proposed = state.rows.find(
      (row) => row.kind === "Proposed fix" && row.id === ref.id
    );
    return proposed !== void 0 && proposedFixIsCurrent(state, proposed);
  });
}
function shelvedFixHasOpenQuestion(state, shelved) {
  return state.rows.some(
    (row) => row.kind === "Question" && row.state === "open" && row.shelvedFixRef?.id === shelved.id && row.shelvedFixRef.revision === shelved.revision
  );
}
function shelvedFixHasCurrentQuestion(state, shelved) {
  return state.rows.some(
    (row) => row.kind === "Question" && row.shelvedFixRef?.id === shelved.id && row.shelvedFixRef.revision === shelved.revision
  );
}
function checkoutTouchesShelvedFix(state, shelved) {
  if (!state.checkout) return false;
  if (state.checkout.rowIds.includes(shelved.id)) return true;
  return shelved.proposedFixRefs.some((proposedRef) => {
    if (state.checkout?.rowIds.includes(proposedRef.id)) return true;
    const proposed = rowOfKind(state, proposedRef.id, "Proposed fix");
    return proposed.issueRefs.some((issueRef) => checkoutTouchesIssue(state, issueRef.id));
  });
}
function checkoutTouchesIssue(state, issueId) {
  return state.checkout?.rowIds.some((id) => {
    const row = rowById(state, id);
    if (row.kind === "Issue") return row.id === issueId;
    if (row.kind === "Proposed fix") return row.issueRefs.some((ref) => ref.id === issueId);
    if (row.kind === "Shelved fix") {
      return row.proposedFixRefs.some(
        (ref) => rowOfKind(state, ref.id, "Proposed fix").issueRefs.some((issueRef) => issueRef.id === issueId)
      );
    }
    return false;
  }) ?? false;
}
function rejectOtherSeatIssueWork(state, issueId, actor) {
  if (!isSeat(actor)) return;
  const take3 = issueTake(state, issueId);
  if (take3 && take3.holder !== actor) {
    reject("actor", `${issueId} is taken by ${take3.holder}`);
  }
  if (state.checkout && checkoutTouchesIssue(state, issueId)) {
    if (state.checkout.holder !== actor) {
      reject("checkout", `${issueId} is frozen by ${state.checkout.holder}'s checkout work`);
    }
    if (!state.checkout.rowIds.includes(issueId)) {
      reject("checkout", `${issueId} is an upstream dependency frozen during checkout work`);
    }
  }
}
function rejectProposedWork(state, proposed, actor, includeIssueTakes) {
  if (includeIssueTakes) {
    for (const ref of proposed.issueRefs) {
      const take3 = issueTake(state, ref.id);
      if (take3 && take3.holder !== actor) reject("actor", `${ref.id} is taken by ${take3.holder}`);
    }
  }
  if (state.checkout && state.checkout.holder !== actor && (state.checkout.rowIds.some((id) => {
    const row = rowById(state, id);
    return row.id === proposed.id || row.kind === "Shelved fix" && row.proposedFixRefs.some((ref) => ref.id === proposed.id);
  }) || proposed.issueRefs.some((ref) => checkoutTouchesIssue(state, ref.id)))) {
    reject("checkout", `${proposed.id} is frozen by ${state.checkout.holder}'s checkout work`);
  }
  const ownDependentShelfTarget = state.checkout?.holder === actor && state.checkout.rowIds.some((id) => {
    const row = rowById(state, id);
    return row.kind === "Shelved fix" && row.proposedFixRefs.some((ref) => ref.id === proposed.id);
  });
  if (ownDependentShelfTarget) {
    reject("checkout", `${proposed.id} is an upstream dependency frozen during checkout work`);
  }
  const ownTarget = state.checkout?.holder === actor ? state.checkout.targets.find((target) => target.id === proposed.id) : void 0;
  if (ownTarget?.current && ownTarget.state !== "rejected") {
    reject("checkout", `${proposed.id} is frozen at the revision being implemented`);
  }
}
function checkInsForShelvedFix(state, id) {
  return state.rows.filter(
    (row) => row.kind === "Check-in" && row.shelvedFixRefs.some((ref) => ref.id === id)
  );
}
function checkoutWorkRecorded(state, hold) {
  return hold.targets.every((target) => {
    const row = rowById(state, target.id);
    if (row.kind === "Issue") {
      return row.revision > target.revision && row.revisionAuthor === hold.holder;
    }
    if (row.kind === "Proposed fix") {
      if (target.state === "rejected" || !target.current) {
        return row.revision > target.revision && row.author === hold.holder;
      }
      return shelvedFixesForProposedFix(state, row.id).some(
        (shelved) => shelved.author === hold.holder && shelved.createdAt > hold.takenAt && shelved.proposedFixRefs.some((ref) => ref.id === row.id && ref.revision === target.revision)
      );
    }
    if (row.kind === "Shelved fix") {
      return row.author === hold.holder && row.revision > target.revision && row.state === "shelved";
    }
    if (row.kind === "Coverage") {
      return row.author === hold.holder && row.revision > target.revision && row.state !== "open";
    }
    return false;
  });
}
function checkoutTargetEligible(state, row, actor, batchRowIds = []) {
  if (row.kind === "Issue") {
    return issueIsSubstantive(row) && !row.exit && (row.state === "new" && row.revisionAuthor === actor || row.state === "contested" && row.contestCount >= 2 && row.contestedBy === actor || row.state === "contested" && row.contestCount < 2 && row.revisionAuthor !== actor || row.state === "disproved" && row.revisionAuthor === actor);
  }
  if (row.kind === "Proposed fix") {
    const batchHasSubstantiveProposal = batchRowIds.some((id) => {
      const candidate = state.rows.find(
        (value3) => value3.kind === "Proposed fix" && value3.id === id
      );
      return candidate !== void 0 && proposedFixIsDirectlyShelvable(state, candidate);
    });
    if (row.proposalKind !== "proposal" || !proposedFixIsDirectlyShelvable(state, row) && !batchHasSubstantiveProposal || proposedFixHasDispositionedIssue(state, row) || proposedFixHasOpenQuestion(state, row)) return false;
    const staleRepair = row.author === actor && !refsCurrent(state, row.issueRefs, "Issue");
    const rejectedRepair = row.author === actor && row.state === "rejected";
    const readyToShelve = refsCurrent(state, row.issueRefs, "Issue") && (row.state === "marked" || row.state === "draft" && !row.priorMarkRequired) && shelvedFixesForProposedFix(state, row.id).length === 0 && row.issueRefs.every((ref) => issueTake(state, ref.id)?.holder === actor) && (normalizedAnswer(row.fix.testLocation ?? "") !== "none" || allowsNoRedRun(state, [{ id: row.id, revision: row.revision }]));
    return staleRepair || rejectedRepair || readyToShelve;
  }
  if (row.kind === "Shelved fix") {
    if (row.author !== actor || !shelvedFixIsDirectlyReviewable(state, row)) return false;
    if (!issueIdsForShelvedFix(state, row).every((id) => issueTake(state, id)?.holder === actor)) {
      return false;
    }
    if (row.state === "conditions" && shelvedFixIsCurrent(state, row)) return true;
    if (shelvedFixIsCurrent(state, row)) return false;
    return row.proposedFixRefs.every((ref) => {
      const proposed = state.rows.find(
        (candidate) => candidate.kind === "Proposed fix" && candidate.id === ref.id
      );
      return proposed !== void 0 && proposedFixIsCurrent(state, proposed) && proposed.proposalKind === "proposal" && (proposed.state === "marked" || proposed.state === "draft" && !proposed.priorMarkRequired);
    });
  }
  if (row.kind === "Coverage") {
    return row.author === actor && row.state === "open";
  }
  return false;
}
function replaceRow(state, after) {
  const found = state.rows.some((row) => row.id === after.id);
  return {
    ...state,
    rows: found ? state.rows.map((row) => row.id === after.id ? after : row) : [...state.rows, after]
  };
}
function applyEvent(state, event) {
  switch (event.type) {
    case "run.changed":
      return { ...state, deep: event.deep, declaredCoverage: event.declaredCoverage };
    case "row.changed":
      return replaceRow(state, event.after);
    case "checkout.changed":
      return { ...state, checkout: event.checkout, baseline: event.baseline };
    case "handoff.changed":
      return { ...state, handoffs: { ...state.handoffs, [event.seat]: event.handoff } };
    case "import.changed":
      return { ...state, imports: { ...state.imports, [event.seat]: event.imported } };
    case "issue-take.changed":
      return {
        ...state,
        issueTakes: event.take ? [...state.issueTakes.filter((take3) => take3.issueId !== event.issueId), event.take] : state.issueTakes.filter((take3) => take3.issueId !== event.issueId)
      };
    case "report.changed":
      return { ...state, reportCheckpoint: event.checkpoint };
    case "notification.requested":
      return { ...state, notifications: [...state.notifications, event.notification] };
  }
}
function rowChanged(command, before, after, reason = "command") {
  return {
    type: "row.changed",
    command: command.type,
    actor: command.actor,
    at: command.at,
    from: before?.state ?? null,
    to: after.state,
    rowId: after.id,
    rowKind: after.kind,
    before,
    after,
    reason
  };
}
function revised(row, at, fields) {
  const nextState = fields.state ?? row.state;
  return {
    ...row,
    ...fields,
    revision: row.revision + 1,
    updatedAt: at,
    stateChangedAt: nextState === row.state ? row.stateChangedAt : at
  };
}
function completeIssueFacts(facts) {
  requireText(facts.proposition, "Issue proposition");
  requireText(facts.site, "Issue site");
  requireText(facts.trigger, "Issue trigger");
  requireText(facts.cause, "Issue cause");
  requireText(facts.scope, "Issue scope");
  requireText(facts.frequency, "Issue frequency");
  requireText(facts.impact, "Issue impact");
  if (facts.impactRank === void 0 || facts.impactRank < 1 || facts.impactRank > 5) {
    reject("evidence", "Issue impact rank must be 1 (highest) through 5 (lowest)");
  }
  if (facts.detector === void 0 !== (facts.detectorGap === void 0)) {
    reject("evidence", "Issue detector and detector gap must be recorded together");
  }
  if (facts.detector !== void 0) requireText(facts.detector, "Issue detector");
  if (facts.detectorGap !== void 0) requireText(facts.detectorGap, "Issue detector gap");
}
function initialIssueFacts(facts) {
  requireText(facts.proposition, "Issue proposition");
  requireText(facts.site, "Issue site");
}
function completeProposedFix(fix, proposalKind = "proposal") {
  requireText(fix.shape, proposalKind === "direction" ? "Direction summary" : "Proposed fix shape");
  requireText(fix.cost, proposalKind === "direction" ? "Direction cost" : "Proposed fix cost");
  if (proposalKind === "direction") return;
  requireText(fix.originClass ?? "", "Proposed fix origin class");
  requireText(fix.sitesWalked ?? "", "Proposed fix sites walked");
  requireText(fix.rulingsChecked ?? "", "Proposed fix rulings checked");
  requireText(fix.testLocation ?? "", "Proposed fix test location");
  if (normalizedAnswer(fix.testLocation ?? "") === "none" && fix.originClass !== "design-absence") {
    reject("evidence", "test location 'none' is only valid for a design-absence architecture proposal");
  }
  if (fix.originClass === "self-consistency") {
    requireText(fix.guardrail ?? "", "Self-consistency guardrail");
  }
  if (fix.coordination !== void 0) requireText(fix.coordination, "Proposed fix coordination");
}
function validateRunLogs(redRun, greenRun) {
  if (redRun) requireText(redRun.path, "Shelved fix red run");
  requireText(greenRun.path, "Shelved fix green run");
  if (redRun && redRun.path.trim() === greenRun.path.trim()) {
    reject("evidence", "Shelved fix red and green runs must be different log files");
  }
}
function validateShelvedEvidence(state, refs, redRun, greenRun) {
  const noTestRefs = refs.filter(
    (ref) => normalizedAnswer(rowOfKind(state, ref.id, "Proposed fix").fix.testLocation ?? "") === "none"
  );
  const testableRefs = refs.filter((ref) => !noTestRefs.some((candidate) => candidate.id === ref.id));
  for (const ref of noTestRefs) {
    if (!allowsNoRedRun(state, [ref])) {
      reject("question", `${ref.id} needs a current answered no-red architecture Question`);
    }
  }
  if (testableRefs.length > 0 && redRun === null) {
    reject("evidence", "Every testable Proposed fix needs a failing red run");
  }
  if (testableRefs.length === 0 && redRun !== null) {
    reject("evidence", "An all-no-red Shelved fix cannot claim an aggregate red run");
  }
  validateRunLogs(redRun, greenRun);
}
function assertAuthor(row, actor) {
  if (row.author !== actor) reject("actor", `only ${row.author} may edit this row`);
}
function assertIndependent(row, actor) {
  if (!isSeat(actor)) reject("actor", "a reviewer must perform this action");
  if (row.author === actor) reject("self-mark", `${actor} cannot mark or review their own row`);
}
function assertIssueIndependent(row, actor) {
  if (!isSeat(actor)) reject("actor", "a reviewer must perform this action");
  if (row.revisionAuthor === actor) {
    reject("self-mark", `${actor} cannot mark or dispute the Issue revision they wrote`);
  }
}
function assertIssueEditor(row, actor) {
  if (!isSeat(actor) || row.revisionAuthor !== actor) {
    reject("actor", `only current Issue editor ${row.revisionAuthor} may perform this action`);
  }
}
function checkoutHeldBy(state, actor) {
  if (state.checkout?.holder !== actor) {
    reject("checkout", `checkout is not held by ${actor}`);
  }
}
function refsForIssues(state, ids) {
  requireList(ids, "Proposed fix issues");
  const includesSubstantiveIssue = ids.some((id) => issueIsSubstantive(rowOfKind(state, id, "Issue")));
  return ids.map((id) => {
    const issue = rowOfKind(state, id, "Issue");
    if (issue.exit) reject("invalid-state", `${id} already has an exit`);
    if (issue.state !== "verified" && issue.state !== "assumed") {
      reject("invalid-state", `${id} must be verified or assumed before a Proposed fix`);
    }
    if (state.mode !== "single" && !hasCurrentMark(issue) && (issue.label !== "Hardening" && issue.label !== "Nit" || !includesSubstantiveIssue)) {
      reject("invalid-state", `${id} needs the other reviewer's mark`);
    }
    if (hasOpenQuestion(state, id)) reject("question", `${id} is waiting for the user's answer`);
    return { id, revision: issue.revision };
  });
}
function requiresPriorMark(state, issueIds, fix) {
  const fastAttentionMiss = fix.originClass === "attention-miss" && !fix.interfaceChange && !fix.ownershipChange && !fix.riskSurface && !issueIds.some((id) => hasAnyQuestion(state, id));
  return state.mode !== "single" && (state.policy === "report-only" || !fastAttentionMiss);
}
function refsForProposedFixes(state, ids) {
  requireList(ids, "Shelved fix proposed fixes");
  const includesSubstantiveProposal = ids.some(
    (id) => proposedFixIsSubstantive(state, rowOfKind(state, id, "Proposed fix"))
  );
  const refs = ids.map((id) => {
    const proposed = rowOfKind(state, id, "Proposed fix");
    if (proposed.proposalKind === "direction") {
      reject("invalid-state", `${id} is a report direction and cannot be shelved`);
    }
    if (!refsCurrent(state, proposed.issueRefs, "Issue")) {
      reject("stale-reference", `${id} refers to an old Issue revision`);
    }
    for (const issueRef of proposed.issueRefs) {
      const issue = rowOfKind(state, issueRef.id, "Issue");
      if (issue.exit || issue.state !== "verified" && issue.state !== "assumed") {
        reject("invalid-state", `${issue.id} is no longer settled`);
      }
      if (state.mode !== "single" && !hasCurrentMark(issue) && (issue.label !== "Hardening" && issue.label !== "Nit" || !includesSubstantiveProposal)) {
        reject("invalid-state", `${issue.id} needs the other reviewer's mark`);
      }
    }
    if (proposedFixHasOpenQuestion(state, proposed)) {
      reject("question", `${id} is waiting for a user answer`);
    }
    if (proposed.shapeEditCount >= 2 && !hasAnsweredShapeDecision(state, proposed)) {
      reject("question", `${id} needs a user answer after two shape edits`);
    }
    const ready = proposed.state === "marked" || proposed.state === "draft" && !proposed.priorMarkRequired;
    if (!ready) reject("invalid-state", `${id} is not ready to shelve`);
    if (shelvedFixesForProposedFix(state, id).length > 0) {
      reject("invalid-state", `${id} already has a Shelved fix`);
    }
    return { id, revision: proposed.revision };
  });
  if (!refs.some((ref) => proposedFixIsDirectlyShelvable(state, rowOfKind(state, ref.id, "Proposed fix")))) {
    reject("invalid-state", "A Shelved fix must include at least one Bug, Restructure, or telemetry-quality Issue");
  }
  return refs;
}
function refsForShelvedFixes(state, ids) {
  requireList(ids, "Check-in shelved fixes");
  return ids.map((id) => {
    const shelved = rowOfKind(state, id, "Shelved fix");
    const reviewed = shelved.state === "reviewed" && hasCurrentMark(shelved);
    if (!reviewed) {
      reject("invalid-state", `${id} must have a current independent review`);
    }
    if (!shelvedFixIsCurrent(state, shelved)) {
      reject("stale-reference", `${id} has a stale Proposed-fix or Issue reference, or an open Question`);
    }
    if (checkInsForShelvedFix(state, id).some((row) => row.state !== "dropped")) {
      reject("invalid-state", `${id} already belongs to a live Check-in`);
    }
    return { id, revision: shelved.revision };
  });
}
function importRows(state, command) {
  if (state.mode !== "joint") reject("invalid-state", "cold rows import only into a joint run");
  if (command.campaignId !== state.campaignId) reject("invalid-state", "cold pass belongs to another campaign");
  if (state.imports[command.actor]) reject("invalid-state", `${command.actor} already imported`);
  const seen = /* @__PURE__ */ new Set();
  const events = [];
  for (const row of command.rows) {
    if (row.author !== command.actor) reject("actor", `${row.id} was not authored by ${command.actor}`);
    if (seen.has(row.id)) reject("duplicate-id", `cold import repeats ${row.id}`);
    seen.add(row.id);
    ensureUniqueId(state, row.id);
    if (row.marks.length > 0) reject("self-mark", `cold row ${row.id} cannot carry a mark`);
    if (row.kind === "Coverage" && row.state === "open") {
      reject("ready-work", `${row.id} is unfinished cold coverage`);
    }
    if (row.kind === "Issue" && (row.label === "Bug" || row.label === "Restructure") && row.state === "new") {
      reject("ready-work", `${row.id} is an unfinished cold Issue`);
    }
    events.push(rowChanged(command, null, row));
  }
  for (const declared of state.declaredCoverage) {
    const covered = command.rows.some(
      (row) => row.kind === "Coverage" && row.author === command.actor && row.coverageKind === declared.coverageKind && coverageTargetMatches(declared.coverageKind, row.target, declared.target) && row.state !== "open"
    );
    if (!covered) {
      reject("ready-work", `cold pass has no result for ${declared.coverageKind} '${declared.target}'`);
    }
  }
  events.push({
    type: "import.changed",
    command: command.type,
    actor: command.actor,
    at: command.at,
    from: "cold",
    to: "imported",
    seat: command.actor,
    imported: true
  });
  return events;
}
function decideCommand(state, command) {
  requireTimestamp(command.at);
  if (state.mode === "joint" && isSeat(command.actor) && (!state.imports.A || !state.imports.B) && command.type !== "cold.import") {
    reject("ready-work", "both cold passes must be imported before reviewer mutations");
  }
  if (state.mode === "cold" && command.actor !== state.coldSeat) {
    reject("actor", `only cold seat ${state.coldSeat ?? "unset"} may change this cold run`);
  }
  if (state.mode === "cold") {
    const coldCommands = [
      "coverage.add",
      "coverage.cover",
      "coverage.gap",
      "issue.add",
      "issue.edit",
      "issue.verify",
      "issue.assume",
      "issue.disprove",
      "issue.duplicate",
      "issue.accept"
    ];
    if (!coldCommands.includes(command.type)) {
      reject("policy", `${command.type} is not available during a cold pass`);
    }
  }
  if (state.mode === "single" && command.actor === "B" && command.type !== "shelved-fix.review") {
    reject("actor", "seat B exists only as the fresh Shelved-fix reviewer in a single-seat run");
  }
  const event = (before, after) => rowChanged(command, before, after);
  switch (command.type) {
    case "issue.edit":
    case "issue.verify":
    case "issue.assume":
    case "issue.mark":
    case "issue.contest":
    case "issue.probe":
    case "issue.disprove":
    case "issue.duplicate":
    case "issue.accept":
    case "issue.exit":
      rejectOtherSeatIssueWork(state, command.id, command.actor);
      if (hasOpenQuestion(state, command.id)) {
        reject("question", `${command.id} is frozen while its Question is open`);
      }
      break;
    case "proposed-fix.edit": {
      const proposed = rowOfKind(state, command.id, "Proposed fix");
      rejectProposedWork(state, proposed, command.actor, true);
      if (proposedFixHasOpenQuestion(state, proposed)) {
        reject("question", `${command.id} is frozen while its Question is open`);
      }
      break;
    }
    case "proposed-fix.mark":
    case "proposed-fix.reject": {
      const proposed = rowOfKind(state, command.id, "Proposed fix");
      rejectProposedWork(state, proposed, command.actor, false);
      if (proposedFixHasOpenQuestion(state, proposed)) {
        reject("question", `${command.id} is frozen while its Question is open`);
      }
      break;
    }
    case "coverage.cover":
    case "coverage.gap": {
      const coverage = rowOfKind(state, command.id, "Coverage");
      if (state.checkout && state.checkout.holder !== command.actor && state.checkout.rowIds.includes(coverage.id)) {
        reject("checkout", `${coverage.id} is frozen by ${state.checkout.holder}'s checkout work`);
      }
      break;
    }
    case "shelved-fix.edit":
    case "shelved-fix.review": {
      const shelved = rowOfKind(state, command.id, "Shelved fix");
      if (shelvedFixHasOpenQuestion(state, shelved)) {
        reject("question", `${shelved.id} is frozen while its Question is open`);
      }
      if (command.type === "shelved-fix.review" && checkoutTouchesShelvedFix(state, shelved)) {
        reject("checkout", `release the overlapping checkout before reviewing ${shelved.id}`);
      }
      break;
    }
    default:
      break;
  }
  switch (command.type) {
    case "run.escalate": {
      if (state.mode !== "single" || state.deep) {
        reject("invalid-state", "only a quick or plain single-seat run may escalate to deep");
      }
      const declaredCoverage = [
        ...state.declaredCoverage,
        ...(command.declaredCoverage ?? []).filter(
          (candidate) => !state.declaredCoverage.some(
            (existing) => existing.coverageKind === candidate.coverageKind && existing.target === candidate.target
          )
        )
      ];
      for (const declared of declaredCoverage) requireText(declared.target, "Declared coverage target");
      if (!hasRequiredCoverageDeclaration(state.route, true, declaredCoverage)) {
        reject(
          "evidence",
          state.route === "review" ? "deep review escalation needs a declared hunk or scenario" : "deep diagnosis escalation needs a declared symptom or cluster"
        );
      }
      return [{
        type: "run.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "quick",
        to: "deep",
        deep: true,
        declaredCoverage
      }];
    }
    case "cold.import":
      return importRows(state, command);
    case "coverage.add": {
      ensureUniqueId(state, command.id);
      requireText(command.target, "Coverage target");
      if (command.issueId) rowOfKind(state, command.issueId, "Issue");
      const common = {
        id: command.id,
        kind: "Coverage",
        author: command.actor,
        revision: 0,
        createdAt: command.at,
        updatedAt: command.at,
        stateChangedAt: command.at,
        coverageKind: command.coverageKind,
        target: command.target,
        ...command.issueId ? { issueId: command.issueId } : {}
      };
      let row;
      if (command.initial?.state === "covered") {
        requireText(command.initial.evidence, "Coverage evidence");
        row = { ...common, state: "covered", evidence: command.initial.evidence, marks: [] };
      } else if (command.initial?.state === "gap") {
        requireText(command.initial.reason, "Coverage gap reason");
        row = { ...common, state: "gap", reason: command.initial.reason, marks: [] };
      } else {
        row = { ...common, state: "open", marks: [] };
      }
      return [event(null, row)];
    }
    case "coverage.cover":
    case "coverage.gap": {
      const before = rowOfKind(state, command.id, "Coverage");
      assertAuthor(before, command.actor);
      expectRevision(before, command.expectedRevision);
      const after = command.type === "coverage.cover" ? revised(before, command.at, { state: "covered", evidence: command.evidence, marks: [] }) : revised(before, command.at, { state: "gap", reason: command.reason, marks: [] });
      requireText(command.type === "coverage.cover" ? command.evidence : command.reason, "Coverage result");
      return [event(before, after)];
    }
    case "issue.add": {
      ensureUniqueId(state, command.id);
      initialIssueFacts(command.facts);
      for (const id of command.parentIssueIds ?? []) rowOfKind(state, id, "Issue");
      const common = {
        id: command.id,
        kind: "Issue",
        author: command.actor,
        revisionAuthor: command.actor,
        revision: 0,
        createdAt: command.at,
        updatedAt: command.at,
        stateChangedAt: command.at,
        label: command.label,
        facts: command.facts,
        parentIssueIds: command.parentIssueIds ?? [],
        clusters: command.clusters ?? [],
        contestCount: 0,
        editCount: 0
      };
      let row;
      if (command.initial?.state === "verified") {
        completeIssueFacts(command.facts);
        requireText(command.initial.evidence, "Issue verification evidence");
        row = {
          ...common,
          state: "verified",
          certainty: command.initial.certainty,
          evidence: command.initial.evidence,
          marks: []
        };
      } else if (command.initial?.state === "assumed") {
        completeIssueFacts(command.facts);
        requireText(command.initial.assumption, "Issue assumption");
        requireText(command.initial.noProbeReason, "Reason no fifteen-minute probe exists");
        row = {
          ...common,
          state: "assumed",
          certainty: command.initial.certainty,
          assumption: command.initial.assumption,
          noProbeReason: command.initial.noProbeReason,
          marks: []
        };
      } else if (command.initial?.state === "accepted") {
        if (command.label !== "Nit") reject("invalid-state", "Only a Nit may be accepted");
        requireText(command.initial.reason, "Accepted Nit reason");
        row = {
          ...common,
          label: "Nit",
          state: "accepted",
          certainty: command.certainty,
          reason: command.initial.reason,
          marks: []
        };
      } else {
        row = { ...common, state: "new", certainty: command.certainty, marks: [] };
      }
      return [event(null, row)];
    }
    case "issue.edit": {
      const before = rowOfKind(state, command.id, "Issue");
      expectRevision(before, command.expectedRevision);
      if (before.exit) reject("invalid-state", `${before.id} already has an exit`);
      if (["disproved", "duplicate", "accepted"].includes(before.state)) {
        reject("invalid-state", `${before.id} is terminal in ${before.state}`);
      }
      if (before.state === "contested" && before.contestCount >= 2) {
        reject("invalid-state", `${before.id} must be settled by issue.probe`);
      }
      const facts = { ...before.facts, ...command.facts };
      const label = command.label ?? before.label;
      const downgradesSubstantive = issueIsSubstantive(before) && label !== "Bug" && label !== "Restructure";
      const downgradesImpact = before.facts.impactRank !== void 0 && facts.impactRank !== void 0 && facts.impactRank > before.facts.impactRank;
      if (downgradesSubstantive || downgradesImpact) {
        requireText(command.labelChangeReason ?? "", "Issue severity downgrade reason");
      }
      if (command.labelChangeReason !== void 0) {
        requireText(command.labelChangeReason, "Issue label change reason");
      }
      const parentIssueIds = command.parentIssueIds ?? before.parentIssueIds;
      for (const id of parentIssueIds) {
        if (id === before.id) reject("invalid-state", "An Issue cannot be its own parent");
        rowOfKind(state, id, "Issue");
      }
      const common = {
        id: before.id,
        kind: "Issue",
        author: before.author,
        revisionAuthor: command.actor,
        revision: before.revision + 1,
        createdAt: before.createdAt,
        updatedAt: command.at,
        stateChangedAt: before.state === "contested" ? command.at : before.stateChangedAt,
        label,
        ...command.labelChangeReason !== void 0 ? { labelChangeReason: command.labelChangeReason } : before.labelChangeReason !== void 0 ? { labelChangeReason: before.labelChangeReason } : {},
        facts,
        parentIssueIds,
        clusters: command.clusters ?? before.clusters,
        contestCount: before.contestCount,
        editCount: before.editCount + 1
      };
      let after;
      if (before.state === "verified") {
        completeIssueFacts(facts);
        if (command.assumption !== void 0 || command.noProbeReason !== void 0) {
          reject("invalid-state", "assumption fields apply only to an assumed Issue");
        }
        const certainty = command.certainty ?? before.certainty;
        if (certainty < 4) reject("evidence", "A verified Issue needs certainty step 4 or 5");
        const evidence = command.evidence ?? before.evidence;
        requireText(evidence, "Issue verification evidence");
        after = {
          ...common,
          state: "verified",
          certainty,
          evidence,
          marks: []
        };
      } else if (before.state === "assumed") {
        completeIssueFacts(facts);
        if (command.evidence !== void 0) {
          reject("invalid-state", "evidence applies to issue.verify, issue.probe, or issue.disprove");
        }
        const assumption = command.assumption ?? before.assumption;
        const noProbeReason = command.noProbeReason ?? before.noProbeReason;
        requireText(assumption, "Issue assumption");
        requireText(noProbeReason, "Reason no fifteen-minute probe exists");
        after = {
          ...common,
          state: "assumed",
          certainty: command.certainty ?? before.certainty,
          assumption,
          noProbeReason,
          marks: []
        };
      } else {
        if (command.evidence !== void 0 || command.assumption !== void 0 || command.noProbeReason !== void 0) {
          reject("invalid-state", "state-specific evidence requires verify or assume");
        }
        initialIssueFacts(facts);
        after = {
          ...common,
          state: "new",
          certainty: command.certainty ?? before.certainty,
          marks: []
        };
      }
      return [event(before, after)];
    }
    case "issue.verify": {
      const before = rowOfKind(state, command.id, "Issue");
      assertIssueEditor(before, command.actor);
      expectRevision(before, command.expectedRevision);
      if (before.exit) reject("invalid-state", `${before.id} already has an exit`);
      if (!["new", "assumed", "contested"].includes(before.state)) {
        reject("invalid-state", `${before.id} cannot be verified from ${before.state}`);
      }
      if (before.state === "contested" && before.contestCount >= 2) {
        reject("invalid-state", `${before.id} must be settled by issue.probe`);
      }
      requireText(command.evidence, "Issue verification evidence");
      completeIssueFacts(before.facts);
      const after = revised(before, command.at, {
        state: "verified",
        revisionAuthor: command.actor,
        certainty: command.certainty,
        evidence: command.evidence,
        marks: []
      });
      return [event(before, after)];
    }
    case "issue.assume": {
      const before = rowOfKind(state, command.id, "Issue");
      assertIssueEditor(before, command.actor);
      expectRevision(before, command.expectedRevision);
      if (before.exit || !["new", "contested"].includes(before.state)) {
        reject("invalid-state", `${before.id} cannot be assumed from ${before.state}`);
      }
      requireText(command.assumption, "Issue assumption");
      requireText(command.noProbeReason, "Reason no fifteen-minute probe exists");
      completeIssueFacts(before.facts);
      const after = revised(before, command.at, {
        state: "assumed",
        revisionAuthor: command.actor,
        certainty: command.certainty,
        assumption: command.assumption,
        noProbeReason: command.noProbeReason,
        marks: []
      });
      return [event(before, after)];
    }
    case "issue.mark": {
      const before = rowOfKind(state, command.id, "Issue");
      expectRevision(before, command.expectedRevision);
      assertIssueIndependent(before, command.actor);
      if (before.exit) reject("invalid-state", `${before.id} already has an exit`);
      if (before.state !== "verified" && before.state !== "assumed") {
        reject("invalid-state", `${before.id} cannot be marked from ${before.state}`);
      }
      if (hasCurrentMark(before)) reject("invalid-state", `${before.id} already has a current mark`);
      const after = {
        ...before,
        marks: [{ reviewer: command.actor, revision: before.revision, at: command.at }],
        updatedAt: command.at
      };
      return [event(before, after)];
    }
    case "issue.contest": {
      const before = rowOfKind(state, command.id, "Issue");
      expectRevision(before, command.expectedRevision);
      assertIssueIndependent(before, command.actor);
      if (before.exit || before.state !== "verified" && before.state !== "assumed") {
        reject("invalid-state", `${before.id} cannot be contested from ${before.state}`);
      }
      if (hasCurrentMark(before)) reject("invalid-state", `${before.id} is already agreed at this revision`);
      requireText(command.probe, "Issue contest probe");
      const after = revised(before, command.at, {
        state: "contested",
        revisionAuthor: command.actor,
        probe: command.probe,
        contestedBy: command.actor,
        contestCount: before.contestCount + 1,
        marks: []
      });
      return [event(before, after)];
    }
    case "issue.probe": {
      const before = rowOfKind(state, command.id, "Issue");
      expectRevision(before, command.expectedRevision);
      if (before.state !== "contested" || before.contestCount < 2) {
        reject("invalid-state", `${before.id} has not reached the required probe`);
      }
      if (before.contestedBy !== command.actor) reject("actor", `${before.contestedBy} owns this probe`);
      checkoutHeldBy(state, command.actor);
      if (!state.baseline) reject("checkout", "record the first-holder baseline before running the probe");
      requireText(command.evidence, "Issue probe evidence");
      const after = command.verdict === "verified" ? revised(before, command.at, {
        state: "verified",
        revisionAuthor: command.actor,
        certainty: command.certainty,
        evidence: command.evidence,
        marks: []
      }) : revised(before, command.at, {
        state: "disproved",
        revisionAuthor: command.actor,
        certainty: command.certainty,
        evidence: command.evidence,
        marks: []
      });
      return [event(before, after)];
    }
    case "issue.disprove": {
      const before = rowOfKind(state, command.id, "Issue");
      expectRevision(before, command.expectedRevision);
      if (state.mode !== "cold") assertIssueIndependent(before, command.actor);
      else assertIssueEditor(before, command.actor);
      if (before.exit || ["disproved", "duplicate", "accepted"].includes(before.state)) {
        reject("invalid-state", `${before.id} cannot be disproved from ${before.state}`);
      }
      if (command.certainty < 2) reject("evidence", "A disproved Issue needs certainty step 2 or better");
      requireText(command.evidence, "Issue disproof evidence");
      const after = revised(before, command.at, {
        state: "disproved",
        revisionAuthor: command.actor,
        certainty: command.certainty,
        evidence: command.evidence,
        marks: []
      });
      return [event(before, after)];
    }
    case "issue.duplicate": {
      const before = rowOfKind(state, command.id, "Issue");
      expectRevision(before, command.expectedRevision);
      if (state.mode !== "cold") assertIssueIndependent(before, command.actor);
      else assertIssueEditor(before, command.actor);
      if (before.exit || ["disproved", "duplicate", "accepted"].includes(before.state)) {
        reject("invalid-state", `${before.id} cannot become duplicate from ${before.state}`);
      }
      const target = rowOfKind(state, command.duplicateOf, "Issue");
      if (before.id === target.id) reject("invalid-state", "An Issue cannot duplicate itself");
      if (target.state === "duplicate") reject("invalid-state", "A duplicate target cannot itself be duplicate");
      if (state.rows.some((row) => row.kind === "Issue" && row.state === "duplicate" && row.duplicateOf === before.id)) {
        reject("invalid-state", `${before.id} is already the target of a duplicate`);
      }
      const after = revised(before, command.at, {
        state: "duplicate",
        revisionAuthor: command.actor,
        duplicateOf: target.id,
        marks: []
      });
      return [event(before, after)];
    }
    case "issue.accept": {
      const before = rowOfKind(state, command.id, "Issue");
      expectRevision(before, command.expectedRevision);
      assertIssueEditor(before, command.actor);
      if (before.label !== "Nit") reject("invalid-state", "Only a Nit may be accepted");
      if (before.exit || ["disproved", "duplicate", "accepted"].includes(before.state)) {
        reject("invalid-state", `${before.id} cannot be accepted from ${before.state}`);
      }
      requireText(command.reason, "Accepted Nit reason");
      const after = revised(before, command.at, {
        state: "accepted",
        revisionAuthor: command.actor,
        label: "Nit",
        reason: command.reason,
        marks: []
      });
      return [event(before, after)];
    }
    case "issue.exit": {
      const before = rowOfKind(state, command.id, "Issue");
      expectRevision(before, command.expectedRevision);
      if (before.exit) reject("invalid-state", `${before.id} already has an exit`);
      if (command.exit.kind === "user-drop") {
        if (command.actor !== "master") reject("actor", "only the user through master may drop an Issue");
        requireText(command.exit.reason, "Issue drop reason");
      } else {
        if (command.actor !== before.revisionAuthor) {
          reject("actor", `only current Issue editor ${before.revisionAuthor} may record this exit`);
        }
        requireText(command.exit.reference, "Issue exit reference");
        if (command.exit.kind === "todo" && before.state !== "assumed") {
          reject("invalid-state", "A todo exit requires an assumed Issue with its no-probe reason");
        }
        if (command.exit.kind === "comment-or-assert" && before.state !== "disproved") {
          reject("invalid-state", "A comment-or-assert exit requires a disproved Issue");
        }
        if (command.exit.kind === "ruling-or-baseline") {
          const settled = before.state === "verified" || before.state === "assumed";
          const independentlyChecked = state.mode === "single" || hasCurrentMark(before) || hasAnsweredDecision(state, before.id);
          if (!settled || !independentlyChecked) {
            reject("invalid-state", "A ruling-or-baseline exit requires settled, independently checked evidence");
          }
        }
      }
      return [event(before, revised(before, command.at, {
        exit: command.exit,
        revisionAuthor: isSeat(command.actor) ? command.actor : before.revisionAuthor
      }))];
    }
    case "issue.take": {
      const issue = rowOfKind(state, command.id, "Issue");
      expectRevision(issue, command.expectedRevision);
      if (state.checkout && state.checkout.holder !== command.actor && checkoutTouchesIssue(state, issue.id)) {
        reject("checkout", `${issue.id} is frozen by ${state.checkout.holder}'s checkout work`);
      }
      if (issue.exit || issue.state !== "verified" && issue.state !== "assumed") {
        reject("invalid-state", `${issue.id} is not ready to take`);
      }
      const accompaniesSubstantiveTake = state.issueTakes.some((take4) => {
        if (take4.holder !== command.actor) return false;
        const takenIssue = rowOfKind(state, take4.issueId, "Issue");
        return issueIsSubstantive(takenIssue);
      });
      if (state.mode !== "single" && !hasCurrentMark(issue) && (issue.label !== "Hardening" && issue.label !== "Nit" || !accompaniesSubstantiveTake)) {
        reject("invalid-state", `${issue.id} needs the other reviewer's mark`);
      }
      if (hasOpenQuestion(state, issue.id)) reject("question", `${issue.id} is waiting for the user`);
      const proposed = proposedFixesForIssue(state, issue.id);
      const shelves = proposed.flatMap((row) => shelvedFixesForProposedFix(state, row.id));
      const correctionShelves = [...new Map(shelves.map((row) => [row.id, row])).values()];
      if (correctionShelves.some(
        (row) => row.author !== command.actor || row.state !== "conditions" && shelvedFixIsCurrent(state, row) || checkInsForShelvedFix(state, row.id).some((checkIn) => checkIn.state !== "dropped")
      )) {
        reject("invalid-state", `${issue.id} already has a Shelved fix that is not owned correction work`);
      }
      const siblingIssueIds = proposed.flatMap((row) => row.issueRefs.map((ref) => ref.id));
      const otherHolder = siblingIssueIds.map((id) => issueTake(state, id)).find((take4) => take4 && take4.holder !== command.actor);
      if (otherHolder) {
        reject("invalid-state", `${otherHolder.issueId} in the same Proposed fix is taken by ${otherHolder.holder}`);
      }
      const existing = issueTake(state, issue.id);
      if (existing) reject("invalid-state", `${issue.id} is taken by ${existing.holder}`);
      const take3 = {
        issueId: issue.id,
        issueRevision: issue.revision,
        holder: command.actor,
        takenAt: command.at
      };
      return [{
        type: "issue-take.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "free",
        to: "taken",
        issueId: issue.id,
        take: take3
      }];
    }
    case "issue.release": {
      const issue = rowOfKind(state, command.id, "Issue");
      expectRevision(issue, command.expectedRevision);
      const take3 = issueTake(state, command.id);
      if (!take3) reject("invalid-state", `${command.id} is not taken`);
      if (take3.holder !== command.actor) reject("actor", `${command.id} is taken by ${take3.holder}`);
      return [{
        type: "issue-take.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "taken",
        to: "free",
        issueId: command.id,
        take: null
      }];
    }
    case "question.add": {
      ensureUniqueId(state, command.id);
      requireList(command.issueIds, "Question issues");
      const questionIssueRefs = [];
      let conditionsShelf;
      if (command.shelvedFixRef) {
        if (command.purpose !== "decision") {
          reject("question", "Only a decision Question may be linked to review conditions");
        }
        conditionsShelf = rowOfKind(state, command.shelvedFixRef.id, "Shelved fix");
        expectRevision(conditionsShelf, command.shelvedFixRef.revision);
        if (conditionsShelf.author !== command.actor || conditionsShelf.state !== "conditions") {
          reject("question", "A review-conditions Question must name the author's current conditions shelf");
        }
        if (!shelvedFixIsCurrent(state, conditionsShelf)) {
          reject("stale-reference", `${conditionsShelf.id} has stale upstream revisions`);
        }
      }
      for (const id of command.issueIds) {
        if (state.checkout && checkoutTouchesIssue(state, id)) {
          reject("checkout", `release checkout before asking a Question about ${id}`);
        }
        rejectOtherSeatIssueWork(state, id, command.actor);
        const issue = rowOfKind(state, id, "Issue");
        if (issue.exit) reject("invalid-state", `${id} already has an exit`);
        if (issue.state !== "verified" && issue.state !== "assumed") {
          reject("invalid-state", `${id} must be verified or assumed before asking a Question`);
        }
        if (hasOpenQuestion(state, id)) reject("question", `${id} already has an open Question`);
        const hasShelf = proposedFixesForIssue(state, id).some(
          (proposed) => shelvedFixesForProposedFix(state, proposed.id).length > 0
        );
        const conditionsShelfContainsIssue = conditionsShelf !== void 0 && issueIdsForProposedFixRefs(state, conditionsShelf.proposedFixRefs).includes(id);
        if (hasShelf && !conditionsShelfContainsIssue) {
          reject("question", `${id} already has a Shelved fix; only current review conditions may ask late`);
        }
        questionIssueRefs.push({ id, revision: issue.revision });
      }
      if (command.purpose === "no-red" && !command.proposedFixRef) {
        reject("question", "A no-red Question must name the current Proposed fix revision");
      }
      if (command.proposedFixRef && command.shelvedFixRef) {
        reject("question", "A Question links either a Proposed fix or a Shelved fix, not both");
      }
      if (command.proposedFixRef) {
        const proposed = rowOfKind(state, command.proposedFixRef.id, "Proposed fix");
        expectRevision(proposed, command.proposedFixRef.revision);
        if (proposed.author !== command.actor) {
          reject("question", "A Proposed-fix Question must be asked by its author");
        }
        if (command.purpose === "decision" && !((proposed.state === "rejected" || proposed.state === "draft") && proposed.shapeEditCount >= 2)) {
          reject("question", "A shape Question must name the current twice-disputed Proposed fix");
        }
        if (command.purpose === "no-red" && proposed.state !== "draft" && proposed.state !== "marked") {
          reject("question", "A no-red Question must name a current unrejected Proposed fix");
        }
        if (!proposed.issueRefs.every((ref) => command.issueIds.includes(ref.id))) {
          reject("question", "A shape Question must link every Issue in its Proposed fix");
        }
      }
      if (conditionsShelf) {
        const shelfIssueIds = issueIdsForProposedFixRefs(state, conditionsShelf.proposedFixRefs);
        if (!shelfIssueIds.every((id) => command.issueIds.includes(id))) {
          reject("question", "A review-conditions Question must link every Issue in its Shelved fix");
        }
      }
      requireText(command.question, "Question");
      requireQuestionOptions(command.options, command.recommendation);
      if (command.purpose === "no-red" && !command.options.some((option4) => normalizedAnswer(option4) === ALLOW_NO_RED_ANSWER)) {
        reject("question", `A no-red Question must offer the exact answer '${ALLOW_NO_RED_ANSWER}'`);
      }
      requireText(command.userEffect, "Question user effect");
      requireText(command.codeCost, "Question code cost");
      const row = {
        id: command.id,
        kind: "Question",
        author: command.actor,
        revision: 0,
        createdAt: command.at,
        updatedAt: command.at,
        stateChangedAt: command.at,
        issueIds: command.issueIds,
        issueRefs: questionIssueRefs,
        purpose: command.purpose,
        ...command.proposedFixRef ? { proposedFixRef: command.proposedFixRef } : {},
        ...command.shelvedFixRef ? { shelvedFixRef: command.shelvedFixRef } : {},
        question: command.question,
        options: command.options,
        recommendation: command.recommendation,
        userEffect: command.userEffect,
        codeCost: command.codeCost,
        state: "open",
        marks: []
      };
      return [event(null, row)];
    }
    case "question.answer": {
      const before = rowOfKind(state, command.id, "Question");
      expectRevision(before, command.expectedRevision);
      if (before.state !== "open") reject("invalid-state", `${before.id} is already answered`);
      if (!refsCurrent(state, before.issueRefs, "Issue")) {
        reject("stale-reference", `${before.id} refers to an old Issue revision`);
      }
      if (before.proposedFixRef && !refsCurrent(state, [before.proposedFixRef], "Proposed fix")) {
        reject("stale-reference", `${before.id} refers to an old Proposed-fix revision`);
      }
      if (before.shelvedFixRef && !refsCurrent(state, [before.shelvedFixRef], "Shelved fix")) {
        reject("stale-reference", `${before.id} refers to an old Shelved-fix revision`);
      }
      requireText(command.answer, "Question answer");
      const answer = selectedQuestionOption(before.options, command.answer);
      if (answer === void 0) {
        reject("question", "Question answer must map to an offered option");
      }
      const after = revised(before, command.at, {
        state: "answered",
        answer,
        answeredAt: command.at
      });
      return [event(before, after)];
    }
    case "proposed-fix.add": {
      ensureUniqueId(state, command.id);
      const proposalKind = command.proposalKind ?? "proposal";
      completeProposedFix(command.fix, proposalKind);
      for (const issueId of command.issueIds) {
        const take3 = issueTake(state, issueId);
        if (take3?.holder !== command.actor) reject("actor", `${command.actor} must take ${issueId} first`);
        const issue = rowOfKind(state, issueId, "Issue");
        if (take3.issueRevision !== issue.revision) reject("revision", `${issueId} take is stale`);
      }
      if (proposalKind === "proposal" && command.fix.originClass === "design-absence" && !command.issueIds.some((issueId) => issueOrAncestorHasLabel(state, issueId, "Restructure"))) {
        reject("invalid-state", "A design-absence proposal must link a Restructure Issue");
      }
      const row = {
        id: command.id,
        kind: "Proposed fix",
        author: command.actor,
        proposalKind,
        revision: 0,
        createdAt: command.at,
        updatedAt: command.at,
        stateChangedAt: command.at,
        issueRefs: refsForIssues(state, command.issueIds),
        fix: command.fix,
        priorMarkRequired: requiresPriorMark(state, command.issueIds, command.fix),
        shapeEditCount: 0,
        state: "draft",
        marks: []
      };
      return [event(null, row)];
    }
    case "proposed-fix.edit": {
      const before = rowOfKind(state, command.id, "Proposed fix");
      assertAuthor(before, command.actor);
      expectRevision(before, command.expectedRevision);
      const answeredDecision = hasAnsweredShapeDecision(state, before);
      if (before.shapeEditCount >= 2 && !answeredDecision) {
        reject("question", `${before.id} reached two shape edits; ask the user`);
      }
      completeProposedFix(command.fix, before.proposalKind);
      const currentRefs = refsForIssues(state, before.issueRefs.map((ref) => ref.id));
      if (before.proposalKind === "proposal" && command.fix.originClass === "design-absence" && !before.issueRefs.some((ref) => issueOrAncestorHasLabel(state, ref.id, "Restructure"))) {
        reject("invalid-state", "A design-absence proposal must link a Restructure Issue");
      }
      const after = revised(before, command.at, {
        state: "draft",
        fix: command.fix,
        issueRefs: currentRefs,
        priorMarkRequired: requiresPriorMark(state, before.issueRefs.map((ref) => ref.id), command.fix),
        shapeEditCount: answeredDecision ? 0 : before.shapeEditCount,
        marks: []
      });
      return [event(before, after)];
    }
    case "proposed-fix.mark": {
      const before = rowOfKind(state, command.id, "Proposed fix");
      expectRevision(before, command.expectedRevision);
      assertIndependent(before, command.actor);
      if (before.state !== "draft") reject("invalid-state", `${before.id} cannot be marked from ${before.state}`);
      if (!refsCurrent(state, before.issueRefs, "Issue")) {
        reject("stale-reference", `${before.id} refers to an old Issue revision`);
      }
      refsForIssues(state, before.issueRefs.map((ref) => ref.id));
      if (before.shapeEditCount >= 2 && !hasAnsweredShapeDecision(state, before)) {
        reject("question", `${before.id} needs a user answer after two shape edits`);
      }
      completeProposedFix(before.fix, before.proposalKind);
      const after = revised(before, command.at, {
        state: "marked",
        marks: [{ reviewer: command.actor, revision: before.revision + 1, at: command.at }]
      });
      return [event(before, after)];
    }
    case "proposed-fix.reject": {
      const before = rowOfKind(state, command.id, "Proposed fix");
      expectRevision(before, command.expectedRevision);
      assertIndependent(before, command.actor);
      if (before.state !== "draft") reject("invalid-state", `${before.id} cannot be rejected from ${before.state}`);
      if (!refsCurrent(state, before.issueRefs, "Issue")) {
        reject("stale-reference", `${before.id} refers to an old Issue revision`);
      }
      completeProposedFix(before.fix, before.proposalKind);
      requireText(command.reason, "Proposed fix rejection reason");
      const after = revised(before, command.at, {
        state: "rejected",
        reason: command.reason,
        shapeEditCount: before.shapeEditCount + 1,
        marks: []
      });
      return [event(before, after)];
    }
    case "shelved-fix.add": {
      if (state.policy === "report-only") reject("policy", "report-only runs do not create Shelved fixes");
      ensureUniqueId(state, command.id);
      checkoutHeldBy(state, command.actor);
      if (!state.baseline) reject("checkout", "record the first-holder baseline before shelving a fix");
      requireText(command.artifact, "Shelved fix artifact");
      const proposedFixRefs = refsForProposedFixes(state, command.proposedFixIds);
      for (const issueId of issueIdsForProposedFixRefs(state, proposedFixRefs)) {
        const take3 = issueTake(state, issueId);
        if (take3?.holder !== command.actor) reject("actor", `${command.actor} must take ${issueId} first`);
        const issue = rowOfKind(state, issueId, "Issue");
        if (take3.issueRevision !== issue.revision) reject("revision", `${issueId} take is stale`);
      }
      validateShelvedEvidence(state, proposedFixRefs, command.redRun, command.greenRun);
      const row = {
        id: command.id,
        kind: "Shelved fix",
        author: command.actor,
        revision: 0,
        createdAt: command.at,
        updatedAt: command.at,
        stateChangedAt: command.at,
        proposedFixRefs,
        artifact: command.artifact,
        redRun: command.redRun,
        greenRun: command.greenRun,
        state: "shelved",
        marks: []
      };
      return [event(null, row)];
    }
    case "shelved-fix.edit": {
      const before = rowOfKind(state, command.id, "Shelved fix");
      assertAuthor(before, command.actor);
      expectRevision(before, command.expectedRevision);
      checkoutHeldBy(state, command.actor);
      if (!state.baseline) reject("checkout", "record the first-holder baseline before updating a shelve");
      if (checkInsForShelvedFix(state, before.id).some((row) => row.state !== "dropped")) {
        reject("invalid-state", `${before.id} belongs to an active Check-in`);
      }
      for (const issueId of issueIdsForShelvedFix(state, before)) {
        const issue = rowOfKind(state, issueId, "Issue");
        const take3 = issueTake(state, issueId);
        if (take3?.holder !== command.actor || take3.issueRevision !== issue.revision) {
          reject("actor", `${command.actor} must hold a current take for ${issueId}`);
        }
      }
      requireText(command.artifact, "Shelved fix artifact");
      const proposedFixRefs = before.proposedFixRefs.map((ref) => {
        const proposed = rowOfKind(state, ref.id, "Proposed fix");
        if (!refsCurrent(state, proposed.issueRefs, "Issue")) {
          reject("stale-reference", `${proposed.id} refers to an old Issue revision`);
        }
        const ready = proposed.state === "marked" || proposed.state === "draft" && !proposed.priorMarkRequired;
        if (!ready) reject("invalid-state", `${proposed.id} is not ready for a Shelved fix`);
        if (proposedFixHasOpenQuestion(state, proposed)) {
          reject("question", `${proposed.id} is waiting for a user answer`);
        }
        return { id: proposed.id, revision: proposed.revision };
      });
      validateShelvedEvidence(state, proposedFixRefs, command.redRun, command.greenRun);
      const after = revised(before, command.at, {
        state: "shelved",
        proposedFixRefs,
        artifact: command.artifact,
        redRun: command.redRun,
        greenRun: command.greenRun,
        marks: []
      });
      return [event(before, after)];
    }
    case "shelved-fix.review": {
      const before = rowOfKind(state, command.id, "Shelved fix");
      expectRevision(before, command.expectedRevision);
      assertIndependent(before, command.actor);
      if (!shelvedFixIsDirectlyReviewable(state, before)) {
        reject("invalid-state", `${before.id} has no Bug, Restructure, or telemetry-quality Issue to review`);
      }
      if (before.state !== "shelved") reject("invalid-state", `${before.id} cannot be reviewed from ${before.state}`);
      if (!shelvedFixIsCurrent(state, before)) {
        reject("stale-reference", `${before.id} has a stale Proposed-fix or Issue reference, or an open Question`);
      }
      if (command.verdict === "conditions") requireText(command.conditions ?? "", "Shelved fix conditions");
      const after = command.verdict === "reviewed" ? revised(before, command.at, {
        state: "reviewed",
        marks: [{ reviewer: command.actor, revision: before.revision + 1, at: command.at }]
      }) : revised(before, command.at, {
        state: "conditions",
        conditions: command.conditions ?? "",
        marks: []
      });
      return [event(before, after)];
    }
    case "check-in.approve": {
      if (state.policy === "report-only") reject("policy", "report-only runs cannot check in fixes");
      if (!state.reportCheckpoint) reject("invalid-state", "record the final report before approving a Check-in");
      if (state.mode === "single" && command.executor === "B") {
        reject("actor", "seat B is only the fresh diff reviewer and cannot execute a single-seat Check-in");
      }
      requireSha256(command.notesHash, "Check-in notes hash");
      if (command.notesHash !== state.reportCheckpoint.notesHash) {
        reject("stale-reference", "reviewer notes changed after the report was recorded");
      }
      ensureUniqueId(state, command.id);
      requireText(command.approval, "User approval");
      const shelvedFixRefs = refsForShelvedFixes(state, command.shelvedFixIds);
      const linkedIssueIds = issueIdsForProposedFixRefs(
        state,
        shelvedFixRefs.flatMap((ref) => rowOfKind(state, ref.id, "Shelved fix").proposedFixRefs)
      );
      const heldIssue = linkedIssueIds.find((id) => issueTake(state, id));
      if (heldIssue) reject("invalid-state", `release ${heldIssue} before approving its Check-in`);
      const row = {
        id: command.id,
        kind: "Check-in",
        author: "master",
        revision: 0,
        createdAt: command.at,
        updatedAt: command.at,
        stateChangedAt: command.at,
        shelvedFixRefs,
        executor: command.executor,
        approval: command.approval,
        state: "approved",
        marks: []
      };
      return [event(null, row)];
    }
    case "check-in.record": {
      const before = rowOfKind(state, command.id, "Check-in");
      expectRevision(before, command.expectedRevision);
      if (before.state !== "approved") reject("invalid-state", `${before.id} is not approved`);
      if (command.actor !== before.executor) reject("actor", `${before.executor} must perform this Check-in`);
      if (!refsCurrent(state, before.shelvedFixRefs, "Shelved fix")) {
        reject("stale-reference", `${before.id} refers to an old Shelved fix revision`);
      }
      requireText(command.changeset, "Check-in changeset");
      requireText(command.departures, "Check-in departures (use 'none' when there are none)");
      const after = revised(before, command.at, {
        state: "checked in",
        changeset: command.changeset,
        departures: command.departures
      });
      return [event(before, after)];
    }
    case "check-in.drop": {
      const before = rowOfKind(state, command.id, "Check-in");
      expectRevision(before, command.expectedRevision);
      if (before.state !== "approved") reject("invalid-state", `${before.id} is not approved`);
      requireText(command.reason, "Check-in drop reason");
      return [event(before, revised(before, command.at, {
        state: "dropped",
        reason: command.reason
      }))];
    }
    case "checkout.take": {
      if (state.checkout) reject("checkout", `checkout is held by ${state.checkout.holder}`);
      requireText(command.purpose, "Checkout purpose");
      requireList(command.rowIds, "Checkout rows");
      if (new Set(command.rowIds).size !== command.rowIds.length) {
        reject("checkout", "Checkout rows must be distinct");
      }
      for (const id of command.rowIds) {
        const row = rowById(state, id);
        if (!checkoutTargetEligible(state, row, command.actor, command.rowIds)) {
          reject("checkout", `${id} is not ready checkout work for ${command.actor}`);
        }
      }
      const checkout = {
        holder: command.actor,
        purpose: command.purpose,
        rowIds: command.rowIds,
        targets: command.rowIds.map((id) => {
          const row = rowById(state, id);
          const current = row.kind === "Proposed fix" ? proposedFixIsCurrent(state, row) : row.kind === "Shelved fix" ? shelvedFixIsCurrent(state, row) : true;
          return { id, revision: row.revision, state: row.state, current };
        }),
        takenAt: command.at
      };
      return [{
        type: "checkout.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "free",
        to: "held",
        checkout,
        baseline: state.baseline
      }];
    }
    case "checkout.baseline": {
      checkoutHeldBy(state, command.actor);
      if (state.baseline) reject("invalid-state", "the checkout baseline is already recorded");
      requireText(command.buildLog, "Checkout baseline build log");
      requireText(command.testLog, "Checkout baseline test log");
      const baseline = {
        recordedBy: command.actor,
        buildLog: command.buildLog,
        testLog: command.testLog,
        recordedAt: command.at
      };
      return [{
        type: "checkout.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "held",
        to: "held",
        checkout: state.checkout,
        baseline
      }];
    }
    case "checkout.release": {
      const hold = state.checkout;
      if (!hold) reject("checkout", "checkout is not held");
      const forced = command.actor === "master";
      if (command.actor !== hold.holder) {
        if (!forced) reject("actor", `checkout is held by ${hold.holder}`);
        requireText(command.reason ?? "", "Forced checkout release reason");
      }
      if (!forced) {
        if (!command.probesRemoved) reject("checkout", "remove every probe before releasing checkout");
        if (!command.shelvesRecorded) reject("checkout", "record every shelve before releasing checkout");
        if (!state.baseline) reject("checkout", "record the first-holder baseline before releasing checkout");
        if (!checkoutWorkRecorded(state, hold)) {
          reject("checkout", "record the checkout's probe or Shelved fix before releasing checkout");
        }
      }
      return [{
        type: "checkout.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "held",
        to: "free",
        checkout: null,
        baseline: state.baseline,
        release: forced ? { forced: true, reason: command.reason ?? "" } : { forced: false }
      }];
    }
    case "report.record": {
      if (state.mode === "cold") reject("invalid-state", "cold passes import instead of reporting");
      if (state.mode === "joint" && command.actor !== "master") {
        reject("actor", "the master records a joint report");
      }
      if (state.mode === "single" && command.actor !== "A") {
        reject("actor", "seat A records a single-seat report");
      }
      if (state.checkout || state.issueTakes.length > 0) {
        reject("ready-work", "release checkout and every Issue take before recording the report");
      }
      if (state.mode === "joint") {
        if (!state.imports.A || !state.imports.B || !state.handoffs.A || !state.handoffs.B) {
          reject("ready-work", "both imported reviewers must hand off before recording the report");
        }
      }
      const unfinishedReviewerWork = [...readyWork(state, "A"), ...readyWork(state, "B")].filter((item) => item.command !== "report.record");
      if (unfinishedReviewerWork.length > 0) {
        reject("ready-work", "reviewer ready work remains before the report");
      }
      requireSha256(command.notesHash, "Report notes hash");
      if (state.reportCheckpoint?.notesHash === command.notesHash) {
        reject("invalid-state", "the report is already recorded with this notes hash");
      }
      const checkpoint = {
        recordedBy: command.actor,
        recordedAt: command.at,
        notesHash: command.notesHash
      };
      return [{
        type: "report.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: state.reportCheckpoint ? "reported" : "unreported",
        to: "reported",
        checkpoint
      }];
    }
    case "handoff": {
      if (state.mode !== "joint") reject("invalid-state", `${state.mode} runs report or import instead of handing off`);
      if (!state.imports.A || !state.imports.B) {
        reject("ready-work", "both cold passes must be imported before handoff");
      }
      if (state.handoffs[command.actor]) reject("invalid-state", `${command.actor} already handed off`);
      if (state.checkout?.holder === command.actor) {
        reject("checkout", `${command.actor} must release checkout before handoff`);
      }
      if (state.issueTakes.some((take3) => take3.holder === command.actor)) {
        reject("ready-work", `${command.actor} must release every Issue take before handoff`);
      }
      if (readyWork(state, command.actor).length > 0) {
        reject("ready-work", `${command.actor} still has ready work`);
      }
      const handoff = { seat: command.actor, at: command.at };
      return [{
        type: "handoff.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: state.handoffs[command.actor] ? "handed-off" : "working",
        to: "handed-off",
        seat: command.actor,
        handoff
      }];
    }
  }
}
function invalidationEvents(beforeState, currentState, command, primaryEvents) {
  const events = [];
  const changedRows = primaryEvents.filter(
    (event) => event.type === "row.changed"
  );
  const editedIssues = changedRows.filter(
    (event) => event.rowKind === "Issue" && event.before !== null && event.after.revision !== event.before.revision
  );
  const editedProposed = changedRows.filter(
    (event) => event.rowKind === "Proposed fix" && event.before !== null && event.after.revision !== event.before.revision
  );
  let working = currentState;
  const emit = (before, after, reason = "revision-invalidation") => {
    const next = rowChanged(command, before, after, reason);
    events.push(next);
    working = applyEvent(working, next);
  };
  for (const changed of editedIssues) {
    const issueId = changed.rowId;
    const take3 = issueTake(working, issueId);
    if (take3) {
      const released = {
        type: "issue-take.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "taken",
        to: "free",
        issueId,
        take: null
      };
      events.push(released);
      working = applyEvent(working, released);
    }
    for (const proposed of proposedFixesForIssue(working, issueId)) {
      const cleared = proposed.state === "marked" ? revised(proposed, command.at, { state: "draft", marks: [] }) : { ...proposed, marks: [], updatedAt: command.at };
      if (proposed.state === "marked" || proposed.marks.length > 0) emit(proposed, cleared);
      for (const shelved of shelvedFixesForProposedFix(working, proposed.id)) {
        if (shelved.state === "reviewed" || shelved.marks.length > 0) {
          emit(shelved, revised(shelved, command.at, {
            state: "shelved",
            marks: []
          }));
        }
      }
    }
  }
  for (const changed of editedProposed) {
    const id = changed.rowId;
    for (const shelved of shelvedFixesForProposedFix(working, id)) {
      if (shelved.state === "reviewed" || shelved.marks.length > 0) {
        emit(shelved, revised(shelved, command.at, {
          state: "shelved",
          marks: []
        }));
      }
    }
  }
  for (const checkIn of working.rows.filter(
    (row) => row.kind === "Check-in" && row.state === "approved"
  )) {
    const current = checkIn.shelvedFixRefs.every((ref) => {
      const shelved = working.rows.find(
        (row) => row.kind === "Shelved fix" && row.id === ref.id
      );
      return shelved !== void 0 && shelved.revision === ref.revision && shelved.state === "reviewed" && hasCurrentMark(shelved) && shelvedFixIsCurrent(working, shelved);
    });
    if (!current) {
      emit(checkIn, revised(checkIn, command.at, {
        state: "dropped",
        reason: "upstream Issue, Proposed fix, or Shelved fix changed after approval",
        marks: []
      }));
    }
  }
  for (const changed of editedIssues) {
    const current = rowOfKind(working, changed.rowId, "Issue");
    if (current.marks.length > 0) {
      emit(current, { ...current, marks: [], updatedAt: command.at });
    }
  }
  const checkedIn = changedRows.find(
    (event) => event.rowKind === "Check-in" && event.to === "checked in"
  );
  if (checkedIn) {
    const checkIn = checkedIn.after;
    for (const shelvedRef of checkIn.shelvedFixRefs) {
      const shelved = rowOfKind(working, shelvedRef.id, "Shelved fix");
      for (const proposedRef of shelved.proposedFixRefs) {
        const proposed = rowOfKind(working, proposedRef.id, "Proposed fix");
        for (const issueRef of proposed.issueRefs) {
          const issue = rowOfKind(working, issueRef.id, "Issue");
          if (!issue.exit) {
            emit(issue, {
              ...issue,
              exit: { kind: "check-in", checkInId: checkIn.id },
              updatedAt: command.at
            }, "check-in");
          }
        }
      }
    }
  }
  void beforeState;
  return events;
}
function addReady(work, actor, command, reason, rowId2) {
  work.push(rowId2 ? { actor, command, rowId: rowId2, reason } : { actor, command, reason });
}
function parseClusterTokens(value3) {
  const withoutProgress = value3.replace(/\(\d+\/\d+\)(?=[\s,]|$)/g, " ");
  return [...new Set(withoutProgress.split(/[\s,]+/).map((token) => token.trim()).filter(Boolean))];
}
function coverageTargetMatches(kind, observed, declared) {
  if (kind !== "cluster") return observed === declared;
  const observedTokens = new Set(parseClusterTokens(observed));
  const declaredTokens = parseClusterTokens(declared);
  return declaredTokens.length > 0 && declaredTokens.every((token) => observedTokens.has(token));
}
function readyWork(state, actor) {
  const work = [];
  if (state.mode === "cold" && actor !== state.coldSeat) return work;
  if (actor === "master") {
    for (const row of state.rows) {
      if (row.kind === "Question" && row.state === "open") {
        addReady(work, actor, "question.answer", "The user must answer this Question", row.id);
      }
      if (row.kind === "Check-in" && row.state === "approved" && row.executor === actor) {
        addReady(work, actor, "check-in.record", "Record the approved Check-in", row.id);
      }
    }
    const jointReady = state.mode === "joint" && state.imports.A && state.imports.B && state.handoffs.A !== null && state.handoffs.B !== null;
    if (!state.reportCheckpoint && jointReady && !state.checkout && state.issueTakes.length === 0 && readyWork(state, "A").length === 0 && readyWork(state, "B").length === 0) {
      addReady(work, actor, "report.record", "Record the final report checkpoint");
    }
    return work;
  }
  if (state.mode === "joint" && (!state.imports.A || !state.imports.B)) return work;
  if (state.mode === "single" && actor === "B") {
    for (const row of state.rows) {
      if (row.kind === "Shelved fix" && row.author !== actor && row.state === "shelved" && shelvedFixIsSubstantive(state, row) && shelvedFixIsCurrent(state, row)) {
        addReady(work, actor, "shelved-fix.review", "Freshly review the single-seat Shelved fix", row.id);
      }
    }
    return work;
  }
  for (const declared of state.declaredCoverage) {
    const exists2 = state.rows.some(
      (row) => row.kind === "Coverage" && row.coverageKind === declared.coverageKind && coverageTargetMatches(declared.coverageKind, row.target, declared.target) || state.mode !== "cold" && declared.coverageKind === "cluster" && row.kind === "Issue" && (row.state === "verified" || row.state === "assumed") && row.clusters.some((cluster) => coverageTargetMatches("cluster", cluster, declared.target))
    );
    const assignedHere = state.mode === "cold" || actor === "A";
    if (!exists2 && assignedHere) {
      addReady(work, actor, "coverage.add", `Cover ${declared.coverageKind} '${declared.target}'`);
    }
  }
  if (state.checkout?.holder === actor && !state.baseline) {
    addReady(work, actor, "checkout.baseline", "Record the first-holder build and test baseline");
  } else if (state.checkout?.holder === actor && checkoutWorkRecorded(state, state.checkout)) {
    addReady(work, actor, "checkout.release", "Release checkout after removing probes and recording shelves");
  }
  for (const row of state.rows) {
    if (state.mode === "cold" && row.author !== actor) continue;
    if (row.kind === "Coverage" && row.author === actor && row.state === "open") {
      addReady(work, actor, "coverage.cover", "Finish this coverage observation", row.id);
      continue;
    }
    if (row.kind === "Issue" && !row.exit) {
      const issueProposals = proposedFixesForIssue(state, row.id);
      const completedShelf = issueProposals.some(
        (proposed) => shelvedFixesForProposedFix(state, proposed.id).some(
          (shelved) => shelved.state !== "conditions" && shelvedFixIsCurrent(state, shelved)
        )
      );
      const completedReportOnlyProposal = state.policy === "report-only" && issueProposals.some(
        (proposed) => proposedFixIsCurrent(state, proposed) && !proposedFixHasDispositionedIssue(state, proposed)
      );
      if (issueTake(state, row.id)?.holder === actor && (completedShelf || completedReportOnlyProposal)) {
        const recordedWork = completedShelf ? "Shelved fix" : "Proposed fix";
        addReady(work, actor, "issue.release", `Release this Issue take after recording its ${recordedWork}`, row.id);
        continue;
      }
      if (row.label === "Hardening" || row.label === "Nit" || row.label === "telemetry-quality") continue;
      if (state.mode !== "cold" && row.state === "disproved" && row.revisionAuthor === actor) {
        addReady(work, actor, "issue.exit", "Record the disproved Issue's comment-or-assert exit", row.id);
      } else if (row.state === "new" && row.revisionAuthor === actor) {
        addReady(work, actor, "issue.verify", "Verify or otherwise dispose this Issue", row.id);
      } else if ((row.state === "verified" || row.state === "assumed") && row.revisionAuthor !== actor && !hasCurrentMark(row)) {
        addReady(work, actor, "issue.mark", "Check the other reviewer's Issue", row.id);
      } else if (row.state === "contested" && row.contestCount >= 2 && row.contestedBy === actor) {
        if (!state.checkout) {
          addReady(work, actor, "checkout.take", "Take checkout and run the named probe", row.id);
        } else if (state.checkout.holder === actor) {
          addReady(work, actor, "issue.probe", "Run and record the named probe", row.id);
        }
      } else if (row.state === "contested" && row.contestCount < 2 && row.revisionAuthor !== actor) {
        addReady(work, actor, "issue.edit", "Answer the contest with one Issue edit", row.id);
      }
      const needsEveryStep = row.label === "Bug" || row.label === "Restructure";
      const settled = (row.state === "verified" || row.state === "assumed") && (state.mode === "single" || hasCurrentMark(row));
      if (state.mode !== "cold" && settled && needsEveryStep && !hasOpenQuestion(state, row.id)) {
        const proposed = proposedFixesForIssue(state, row.id);
        const activeProposals = proposed.filter((candidate) => !proposedFixHasDispositionedIssue(state, candidate));
        const implementationProposals = activeProposals.filter((candidate) => candidate.proposalKind === "proposal");
        if (implementationProposals.length === 0 && (state.policy !== "report-only" || activeProposals.length === 0)) {
          const take3 = issueTake(state, row.id);
          if (!take3) {
            addReady(work, actor, "issue.take", "Take this Issue before writing its Proposed fix", row.id);
          } else if (take3.holder === actor) {
            addReady(work, actor, "proposed-fix.add", "Write a Proposed fix for the Issue you took", row.id);
          }
        } else {
          const shelved = implementationProposals.some(
            (candidate) => shelvedFixesForProposedFix(state, candidate.id).length > 0
          );
          const take3 = issueTake(state, row.id);
          const readyToShelve = state.policy !== "report-only" && implementationProposals.some(
            (candidate) => proposedFixIsCurrent(state, candidate) && (candidate.state === "marked" || candidate.state === "draft" && !candidate.priorMarkRequired) && (normalizedAnswer(candidate.fix.testLocation ?? "") !== "none" || allowsNoRedRun(state, [{ id: candidate.id, revision: candidate.revision }]))
          );
          if (state.policy === "report-only" && take3?.holder === actor) {
            addReady(work, actor, "issue.release", "Release this Issue take after recording its Proposed fix", row.id);
          } else if (shelved && take3?.holder === actor) {
            addReady(work, actor, "issue.release", "Release this Issue take after recording its Shelved fix", row.id);
          } else if (!shelved && readyToShelve && !take3) {
            addReady(work, actor, "issue.take", "Take this Issue before writing its Shelved fix", row.id);
          }
        }
      } else if (issueTake(state, row.id)?.holder === actor && hasOpenQuestion(state, row.id)) {
        addReady(work, actor, "issue.release", "Release this Issue take while the user answers", row.id);
      }
      continue;
    }
    if (row.kind === "Proposed fix") {
      if (!proposedFixIsSubstantive(state, row)) continue;
      if (proposedFixHasDispositionedIssue(state, row)) continue;
      const current = refsCurrent(state, row.issueRefs, "Issue");
      const answered = hasAnsweredShapeDecision(state, row);
      const proposalRef = [{ id: row.id, revision: row.revision }];
      const noRedQuestion = currentNoRedQuestion(state, row);
      const lacksNoRedDecision = row.proposalKind === "proposal" && normalizedAnswer(row.fix.testLocation ?? "") === "none" && (row.state === "marked" || row.state === "draft" && !row.priorMarkRequired) && noRedQuestion === void 0;
      const noRedDenied = noRedQuestion?.state === "answered" && !allowsNoRedRun(state, proposalRef);
      if (!current && row.author === actor) {
        addReady(work, actor, "proposed-fix.edit", "Refresh the stale Issue revisions", row.id);
      } else if (row.shapeEditCount >= 2 && !answered && row.author === actor) {
        addReady(work, actor, "question.add", "Ask the user after two Proposed fix edits", row.id);
      } else if (noRedDenied && row.author === actor) {
        addReady(work, actor, "proposed-fix.edit", "Add a reachable test after the no-red exception was denied", row.id);
      } else if (lacksNoRedDecision && row.author === actor) {
        addReady(work, actor, "question.add", "Ask for a no-red architecture exception", row.id);
      } else if (row.state === "draft" && row.priorMarkRequired && row.author !== actor && !proposedFixHasOpenQuestion(state, row) && (row.shapeEditCount < 2 || answered)) {
        addReady(work, actor, "proposed-fix.mark", "Mark or reject the Proposed fix", row.id);
      } else if (row.state === "rejected" && row.author === actor) {
        addReady(work, actor, "proposed-fix.edit", "Revise the rejected Proposed fix", row.id);
      } else if (state.policy !== "report-only" && row.proposalKind === "proposal" && !proposedFixHasOpenQuestion(state, row) && (row.state === "marked" || row.state === "draft" && !row.priorMarkRequired) && shelvedFixesForProposedFix(state, row.id).length === 0 && row.issueRefs.every((ref) => issueTake(state, ref.id)?.holder === actor)) {
        if (!state.checkout) {
          addReady(work, actor, "checkout.take", "Take checkout and write this fix", row.id);
        } else if (state.checkout.holder === actor && state.baseline) {
          addReady(work, actor, "shelved-fix.add", "Record the red run, fix, green run, and Shelved fix", row.id);
        }
      }
      continue;
    }
    if (row.kind === "Shelved fix") {
      if (!shelvedFixIsSubstantive(state, row)) continue;
      if (shelvedFixHasOpenQuestion(state, row)) continue;
      const dispositioned = row.proposedFixRefs.some((ref) => {
        const proposed = state.rows.find(
          (candidate) => candidate.kind === "Proposed fix" && candidate.id === ref.id
        );
        return proposed === void 0 || proposedFixHasDispositionedIssue(state, proposed);
      });
      if (dispositioned) continue;
      const current = shelvedFixIsCurrent(state, row);
      const authorCorrection = row.author === actor && (!current || row.state === "conditions");
      if (authorCorrection) {
        const issueIds = issueIdsForShelvedFix(state, row);
        const blocked = issueIds.some((id) => {
          const take3 = issueTake(state, id);
          return take3 !== null && take3.holder !== actor;
        });
        if (blocked) continue;
        const missing2 = issueIds.filter((id) => !issueTake(state, id));
        for (const id of missing2) {
          addReady(work, actor, "issue.take", `Take ${id} before correcting ${row.id}`, id);
        }
        if (missing2.length > 0) {
          if (row.state === "conditions" && !shelvedFixHasCurrentQuestion(state, row)) {
            addReady(work, actor, "question.add", "Ask the user if review conditions require a product decision", row.id);
          }
          continue;
        }
      }
      if (!current) {
        if (row.author === actor) {
          if (!state.checkout) {
            addReady(work, actor, "checkout.take", "Take checkout to refresh this stale Shelved fix", row.id);
          } else if (state.checkout.holder === actor && state.baseline) {
            addReady(work, actor, "shelved-fix.edit", "Refresh this Shelved fix after its Proposed fix changed", row.id);
          }
        }
      } else if (row.state === "shelved" && row.author !== actor && !checkoutTouchesShelvedFix(state, row)) {
        addReady(work, actor, "shelved-fix.review", "Review the other reviewer's Shelved fix", row.id);
      } else if (row.state === "conditions" && row.author === actor) {
        if (!shelvedFixHasCurrentQuestion(state, row)) {
          addReady(work, actor, "question.add", "Ask the user if review conditions require a product decision", row.id);
        }
        if (!state.checkout) {
          addReady(work, actor, "checkout.take", "Take checkout and satisfy the review conditions", row.id);
        } else if (state.checkout.holder === actor && state.baseline) {
          addReady(work, actor, "shelved-fix.edit", "Update the Shelved fix to satisfy its conditions", row.id);
        }
      }
      continue;
    }
    if (row.kind === "Check-in" && row.state === "approved" && row.executor === actor) {
      addReady(work, actor, "check-in.record", "Record the approved Check-in", row.id);
    }
  }
  if (state.mode === "cold" && work.length === 0) {
    addReady(work, actor, "cold.import", "Import this finished cold pass into the shared run");
  }
  if (state.mode === "single" && actor === "A" && !state.reportCheckpoint && work.length === 0 && !state.checkout && state.issueTakes.length === 0 && readyWork(state, "B").length === 0) {
    addReady(work, actor, "report.record", "Print and record the final single-seat report");
  }
  return work;
}
function workflowEvents(before, afterCore, command) {
  const events = [];
  let working = afterCore;
  const preservesReportCheckpoint = command.type === "report.record" || command.type === "check-in.approve" || command.type === "check-in.record" || command.type === "check-in.drop";
  if (before.reportCheckpoint && !preservesReportCheckpoint) {
    const staleReport = {
      type: "report.changed",
      command: command.type,
      actor: command.actor,
      at: command.at,
      from: "reported",
      to: "stale",
      checkpoint: null
    };
    events.push(staleReport);
    working = applyEvent(working, staleReport);
  }
  const notificationSeats = before.mode === "joint" ? working.imports.A && working.imports.B ? ["A", "B"] : [] : before.mode === "single" ? ["A", "B"] : [];
  for (const seat of notificationSeats) {
    const readyBefore = readyWork(before, seat);
    const readyAfter = readyWork(working, seat);
    const hasHold = working.checkout?.holder === seat || working.issueTakes.some((take3) => take3.holder === seat);
    if (working.handoffs[seat] && (readyAfter.length > 0 || hasHold)) {
      const event = {
        type: "handoff.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "handed-off",
        to: "working",
        seat,
        handoff: null
      };
      events.push(event);
      working = applyEvent(working, event);
    }
    if (readyBefore.length === 0 && readyAfter.length > 0) {
      const rowIds = readyAfter.flatMap((item) => item.rowId ? [item.rowId] : []);
      const notification = {
        recipient: seat,
        kind: "ready-work",
        message: `ready: ${rowIds.join(", ") || "campaign"}; next: "$LEDGER_DIR/bin/ledger.ts" status`,
        rowIds,
        at: command.at
      };
      events.push({
        type: "notification.requested",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "not-requested",
        to: "requested",
        notification
      });
    }
  }
  if (before.mode !== "cold" && command.type === "question.add") {
    const openQuestions2 = working.rows.filter(
      (row) => row.kind === "Question" && row.state === "open"
    );
    const questionDetails = openQuestions2.map((row) => {
      const answerHint = row.purpose === "no-red" ? ALLOW_NO_RED_ANSWER : "...";
      return [
        `question: ${row.id} ${row.question}`,
        `options: ${row.options.join(" | ")}`,
        `user_effect: ${row.userEffect}`,
        `code_cost: ${row.codeCost}`,
        `recommendation: ${row.recommendation}`,
        `linked: ${[
          ...row.issueIds,
          ...row.proposedFixRef ? [row.proposedFixRef.id] : [],
          ...row.shelvedFixRef ? [row.shelvedFixRef.id] : []
        ].join(", ")}`,
        `next: "$LEDGER_DIR/bin/ledger.ts" question answer ${row.id} rev=${row.revision} answer=${answerHint}`
      ].join("; ");
    });
    const notification = {
      recipient: "master",
      kind: "question",
      message: questionDetails.join("\n"),
      rowIds: openQuestions2.map((row) => row.id),
      at: command.at
    };
    events.push({
      type: "notification.requested",
      command: command.type,
      actor: command.actor,
      at: command.at,
      from: "not-requested",
      to: "requested",
      notification
    });
  }
  if (before.mode !== "cold" && command.type === "question.answer") {
    const question = rowOfKind(working, command.id, "Question");
    const recordedAnswer = question.state === "answered" ? question.answer : command.answer;
    const notification = {
      recipient: question.author,
      kind: "answer",
      message: `answered: ${command.id}; answer: ${recordedAnswer}; linked: ${[
        ...question.issueIds,
        ...question.proposedFixRef ? [question.proposedFixRef.id] : [],
        ...question.shelvedFixRef ? [question.shelvedFixRef.id] : []
      ].join(", ")}; next: "$LEDGER_DIR/bin/ledger.ts" status`,
      rowIds: [
        command.id,
        ...question.issueIds,
        ...question.proposedFixRef ? [question.proposedFixRef.id] : [],
        ...question.shelvedFixRef ? [question.shelvedFixRef.id] : []
      ],
      at: command.at
    };
    events.push({
      type: "notification.requested",
      command: command.type,
      actor: command.actor,
      at: command.at,
      from: "not-requested",
      to: "requested",
      notification
    });
  }
  if (command.type === "handoff") {
    const receiver = otherSeat(command.actor);
    const awaiting = readyWork(working, receiver);
    const notification = {
      recipient: receiver,
      kind: "handoff",
      message: `handoff: ${command.actor}; awaiting: ${awaiting.flatMap((item) => item.rowId ? [item.rowId] : []).join(", ") || "none"}; next: "$LEDGER_DIR/bin/ledger.ts" status`,
      rowIds: awaiting.flatMap((item) => item.rowId ? [item.rowId] : []),
      at: command.at
    };
    events.push({
      type: "notification.requested",
      command: command.type,
      actor: command.actor,
      at: command.at,
      from: "not-requested",
      to: "requested",
      notification
    });
    const handoffNotice = events.at(-1);
    if (handoffNotice) working = applyEvent(working, handoffNotice);
    if (working.imports.A && working.imports.B && working.handoffs.A && working.handoffs.B && !working.checkout && working.issueTakes.length === 0 && readyWork(working, "A").length === 0 && readyWork(working, "B").length === 0) {
      const done4 = {
        recipient: "master",
        kind: "no-ready-work-left",
        message: 'Both reviewers handed off with no ready work left; next: "$LEDGER_DIR/bin/ledger.ts" report',
        rowIds: [],
        at: command.at
      };
      events.push({
        type: "notification.requested",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "not-requested",
        to: "requested",
        notification: done4
      });
    }
  }
  if (before.mode === "single") {
    const reviewerWork = (snapshot, seat) => readyWork(snapshot, seat).filter((item) => item.command !== "report.record");
    const beforeHadWork = reviewerWork(before, "A").length > 0 || reviewerWork(before, "B").length > 0 || before.checkout !== null || before.issueTakes.length > 0;
    const afterHasWork = reviewerWork(working, "A").length > 0 || reviewerWork(working, "B").length > 0 || working.checkout !== null || working.issueTakes.length > 0;
    if (beforeHadWork && !afterHasWork) {
      const done4 = {
        recipient: "master",
        kind: "no-ready-work-left",
        message: 'Single-seat run has no ready work left; next: "$LEDGER_DIR/bin/ledger.ts" report',
        rowIds: [],
        at: command.at
      };
      events.push({
        type: "notification.requested",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "not-requested",
        to: "requested",
        notification: done4
      });
    }
  }
  return events;
}
function transition(state, command) {
  try {
    const primary = decideCommand(state, command);
    let working = primary.reduce(applyEvent, state);
    const invalidations = invalidationEvents(state, working, command, primary);
    working = invalidations.reduce(applyEvent, working);
    const workflow = workflowEvents(state, working, command);
    working = workflow.reduce(applyEvent, working);
    return { ok: true, state: working, events: [...primary, ...invalidations, ...workflow] };
  } catch (error2) {
    if (error2 instanceof Rejected) {
      return { ok: false, error: { code: error2.code, message: error2.message, command: command.type } };
    }
    throw error2;
  }
}
var ProtocolDecodeError = class extends Error {
  name = "ProtocolDecodeError";
};
function decodeFailure(path5, expected) {
  throw new ProtocolDecodeError(`${path5} must be ${expected}`);
}
function objectAt(value3, path5) {
  if (typeof value3 !== "object" || value3 === null || Array.isArray(value3)) {
    return decodeFailure(path5, "an object");
  }
  return value3;
}
function stringAt(value3, path5) {
  if (typeof value3 !== "string") return decodeFailure(path5, "a string");
  return value3;
}
function nonemptyAt(value3, path5) {
  const result3 = stringAt(value3, path5);
  if (!result3.trim()) return decodeFailure(path5, "a non-empty string");
  return result3;
}
function integerAt(value3, path5) {
  if (!Number.isSafeInteger(value3) || value3 < 0) return decodeFailure(path5, "a non-negative integer");
  return value3;
}
function booleanAt(value3, path5) {
  if (typeof value3 !== "boolean") return decodeFailure(path5, "a boolean");
  return value3;
}
function arrayAt(value3, path5) {
  if (!Array.isArray(value3)) return decodeFailure(path5, "an array");
  return value3;
}
function oneOfAt(value3, values, path5) {
  if (typeof value3 !== "string" || !values.includes(value3)) {
    return decodeFailure(path5, `one of ${values.join(", ")}`);
  }
  return value3;
}
function timestampAt(value3, path5) {
  const result3 = stringAt(value3, path5);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(result3) || new Date(result3).toISOString() !== result3) {
    return decodeFailure(path5, "a canonical ISO timestamp");
  }
  return result3;
}
function idAt(value3, kind, path5) {
  const id = stringAt(value3, path5);
  const patterns = {
    Coverage: /^C-[AB]-[1-9]\d*$/,
    Issue: /^I-[AB]-[1-9]\d*$/,
    Question: /^Q-[AB]-[1-9]\d*$/,
    "Proposed fix": /^P-[AB]-[1-9]\d*$/,
    "Shelved fix": /^S-[AB]-[1-9]\d*$/,
    "Check-in": /^K-M-[1-9]\d*$/
  };
  if (!patterns[kind].test(id)) return decodeFailure(path5, `a ${kind} id`);
  return id;
}
function actorAt(value3, path5) {
  return oneOfAt(value3, ACTORS, path5);
}
function seatAt(value3, path5) {
  return oneOfAt(value3, ["A", "B"], path5);
}
function stringsAt(value3, path5) {
  return arrayAt(value3, path5).map((item, index) => stringAt(item, `${path5}[${index}]`));
}
function marksAt(value3, path5) {
  const marks = arrayAt(value3, path5).map((item, index) => {
    const mark = objectAt(item, `${path5}[${index}]`);
    return {
      reviewer: seatAt(mark.reviewer, `${path5}[${index}].reviewer`),
      revision: integerAt(mark.revision, `${path5}[${index}].revision`),
      at: timestampAt(mark.at, `${path5}[${index}].at`)
    };
  });
  if (marks.length > 1) return decodeFailure(path5, "zero or one mark");
  return marks;
}
function refsAt(value3, kind, path5) {
  return arrayAt(value3, path5).map((item, index) => {
    const ref = objectAt(item, `${path5}[${index}]`);
    return {
      id: idAt(ref.id, kind, `${path5}[${index}].id`),
      revision: integerAt(ref.revision, `${path5}[${index}].revision`)
    };
  });
}
function factsAt(value3, path5) {
  const facts = objectAt(value3, path5);
  for (const field of ["proposition", "site", "trigger", "cause", "scope", "frequency", "impact"]) {
    stringAt(facts[field], `${path5}.${field}`);
  }
}
function rowBaseAt(row, kind, path5) {
  idAt(row.id, kind, `${path5}.id`);
  if (row.kind !== kind) decodeFailure(`${path5}.kind`, kind);
  actorAt(row.author, `${path5}.author`);
  integerAt(row.revision, `${path5}.revision`);
  timestampAt(row.createdAt, `${path5}.createdAt`);
  timestampAt(row.updatedAt, `${path5}.updatedAt`);
  timestampAt(row.stateChangedAt, `${path5}.stateChangedAt`);
}
function decodeRow(value3, path5) {
  const row = objectAt(value3, path5);
  const kind = oneOfAt(row.kind, ROW_KINDS, `${path5}.kind`);
  rowBaseAt(row, kind, path5);
  const marks = marksAt(row.marks, `${path5}.marks`);
  const revision = integerAt(row.revision, `${path5}.revision`);
  const author = actorAt(row.author, `${path5}.author`);
  const markAuthor = kind === "Issue" ? seatAt(row.revisionAuthor, `${path5}.revisionAuthor`) : author;
  for (const mark of marks) {
    if (mark.reviewer === markAuthor) decodeFailure(`${path5}.marks`, "independent marks only");
    if (mark.revision !== revision) decodeFailure(`${path5}.marks`, `marks on revision ${revision}`);
  }
  switch (kind) {
    case "Coverage": {
      seatAt(row.author, `${path5}.author`);
      oneOfAt(row.coverageKind, ["hunk", "symptom", "cluster", "scenario"], `${path5}.coverageKind`);
      nonemptyAt(row.target, `${path5}.target`);
      if (row.issueId !== void 0) idAt(row.issueId, "Issue", `${path5}.issueId`);
      const state = oneOfAt(row.state, COVERAGE_STATES, `${path5}.state`);
      if (marks.length !== 0) decodeFailure(`${path5}.marks`, "empty");
      if (state === "covered") nonemptyAt(row.evidence, `${path5}.evidence`);
      if (state === "gap") nonemptyAt(row.reason, `${path5}.reason`);
      break;
    }
    case "Issue": {
      seatAt(row.author, `${path5}.author`);
      seatAt(row.revisionAuthor, `${path5}.revisionAuthor`);
      const label = oneOfAt(row.label, ISSUE_LABELS, `${path5}.label`);
      if (row.labelChangeReason !== void 0) {
        nonemptyAt(row.labelChangeReason, `${path5}.labelChangeReason`);
      }
      factsAt(row.facts, `${path5}.facts`);
      const issueFacts2 = objectAt(row.facts, `${path5}.facts`);
      if (issueFacts2.impactRank !== void 0) {
        const impactRank = integerAt(issueFacts2.impactRank, `${path5}.facts.impactRank`);
        if (impactRank < 1 || impactRank > 5) decodeFailure(`${path5}.facts.impactRank`, "1 through 5");
      }
      if (issueFacts2.detector === void 0 !== (issueFacts2.detectorGap === void 0)) {
        decodeFailure(`${path5}.facts`, "detector and detectorGap together");
      }
      if (issueFacts2.detector !== void 0) nonemptyAt(issueFacts2.detector, `${path5}.facts.detector`);
      if (issueFacts2.detectorGap !== void 0) nonemptyAt(issueFacts2.detectorGap, `${path5}.facts.detectorGap`);
      refsAt(arrayAt(row.parentIssueIds, `${path5}.parentIssueIds`).map((id) => ({ id, revision: 0 })), "Issue", `${path5}.parentIssueIds`);
      stringsAt(row.clusters, `${path5}.clusters`);
      integerAt(row.contestCount, `${path5}.contestCount`);
      integerAt(row.editCount, `${path5}.editCount`);
      const state = oneOfAt(row.state, ISSUE_STATES, `${path5}.state`);
      const certainty = integerAt(row.certainty, `${path5}.certainty`);
      if (certainty < 1 || certainty > 5) decodeFailure(`${path5}.certainty`, "1 through 5");
      if (state === "verified") {
        if (issueFacts2.impactRank === void 0) decodeFailure(`${path5}.facts.impactRank`, "1 through 5");
        if (certainty < 4) decodeFailure(`${path5}.certainty`, "4 or 5 for verified");
        nonemptyAt(row.evidence, `${path5}.evidence`);
      }
      if (state === "assumed") {
        if (issueFacts2.impactRank === void 0) decodeFailure(`${path5}.facts.impactRank`, "1 through 5");
        nonemptyAt(row.assumption, `${path5}.assumption`);
        nonemptyAt(row.noProbeReason, `${path5}.noProbeReason`);
      }
      if (state === "contested") {
        nonemptyAt(row.probe, `${path5}.probe`);
        seatAt(row.contestedBy, `${path5}.contestedBy`);
      }
      if (state === "disproved") nonemptyAt(row.evidence, `${path5}.evidence`);
      if (state === "duplicate") idAt(row.duplicateOf, "Issue", `${path5}.duplicateOf`);
      if (state === "accepted") {
        if (label !== "Nit") decodeFailure(`${path5}.label`, "Nit when accepted");
        nonemptyAt(row.reason, `${path5}.reason`);
      }
      if (row.exit !== void 0) {
        const exit3 = objectAt(row.exit, `${path5}.exit`);
        const exitKind = oneOfAt(
          exit3.kind,
          ["comment-or-assert", "ruling-or-baseline", "todo", "user-drop", "check-in"],
          `${path5}.exit.kind`
        );
        if (exitKind === "check-in") idAt(exit3.checkInId, "Check-in", `${path5}.exit.checkInId`);
        else if (exitKind === "user-drop") nonemptyAt(exit3.reason, `${path5}.exit.reason`);
        else nonemptyAt(exit3.reference, `${path5}.exit.reference`);
      }
      break;
    }
    case "Question": {
      seatAt(row.author, `${path5}.author`);
      const issueIds = arrayAt(row.issueIds, `${path5}.issueIds`);
      if (issueIds.length === 0) decodeFailure(`${path5}.issueIds`, "non-empty");
      refsAt(issueIds.map((id) => ({ id, revision: 0 })), "Issue", `${path5}.issueIds`);
      const issueRefs = refsAt(row.issueRefs, "Issue", `${path5}.issueRefs`);
      if (issueRefs.length !== issueIds.length) decodeFailure(`${path5}.issueRefs`, "one ref per issue id");
      for (const id of issueIds) {
        if (!issueRefs.some((ref) => ref.id === id)) decodeFailure(`${path5}.issueRefs`, `a ref for ${String(id)}`);
      }
      const purpose = oneOfAt(row.purpose, ["decision", "no-red"], `${path5}.purpose`);
      if (row.proposedFixRef !== void 0) {
        const ref = objectAt(row.proposedFixRef, `${path5}.proposedFixRef`);
        idAt(ref.id, "Proposed fix", `${path5}.proposedFixRef.id`);
        integerAt(ref.revision, `${path5}.proposedFixRef.revision`);
      }
      if (row.shelvedFixRef !== void 0) {
        const ref = objectAt(row.shelvedFixRef, `${path5}.shelvedFixRef`);
        idAt(ref.id, "Shelved fix", `${path5}.shelvedFixRef.id`);
        integerAt(ref.revision, `${path5}.shelvedFixRef.revision`);
      }
      if (row.proposedFixRef !== void 0 && row.shelvedFixRef !== void 0) {
        decodeFailure(path5, "at most one Proposed-fix or Shelved-fix link");
      }
      if (purpose === "no-red" && row.proposedFixRef === void 0) {
        decodeFailure(`${path5}.proposedFixRef`, "required on a no-red Question");
      }
      if (purpose === "no-red" && row.shelvedFixRef !== void 0) {
        decodeFailure(`${path5}.shelvedFixRef`, "absent on a no-red Question");
      }
      nonemptyAt(row.question, `${path5}.question`);
      const options = stringsAt(row.options, `${path5}.options`);
      if (options.length < 2) decodeFailure(`${path5}.options`, "at least two options");
      if (options.some((option4) => !option4.trim())) decodeFailure(`${path5}.options`, "non-empty options");
      if (new Set(options.map(normalizedAnswer)).size !== options.length) {
        decodeFailure(`${path5}.options`, "distinct options");
      }
      if (purpose === "no-red" && !options.some((option4) => normalizedAnswer(option4) === ALLOW_NO_RED_ANSWER)) {
        decodeFailure(`${path5}.options`, `an exact '${ALLOW_NO_RED_ANSWER}' option`);
      }
      nonemptyAt(row.recommendation, `${path5}.recommendation`);
      const recommendation = stringAt(row.recommendation, `${path5}.recommendation`);
      if (!mapsToQuestionOption(options, recommendation)) {
        decodeFailure(`${path5}.recommendation`, "a mapping to an offered option");
      }
      nonemptyAt(row.userEffect, `${path5}.userEffect`);
      nonemptyAt(row.codeCost, `${path5}.codeCost`);
      const state = oneOfAt(row.state, QUESTION_STATES, `${path5}.state`);
      if (state === "answered") {
        nonemptyAt(row.answer, `${path5}.answer`);
        if (!mapsToQuestionOption(options, stringAt(row.answer, `${path5}.answer`))) {
          decodeFailure(`${path5}.answer`, "a mapping to an offered option");
        }
        timestampAt(row.answeredAt, `${path5}.answeredAt`);
      }
      if (marks.length !== 0) decodeFailure(`${path5}.marks`, "empty");
      break;
    }
    case "Proposed fix": {
      seatAt(row.author, `${path5}.author`);
      const proposalKind = oneOfAt(row.proposalKind, ["proposal", "direction"], `${path5}.proposalKind`);
      if (arrayAt(row.issueRefs, `${path5}.issueRefs`).length === 0) decodeFailure(`${path5}.issueRefs`, "non-empty");
      refsAt(row.issueRefs, "Issue", `${path5}.issueRefs`);
      const fix = objectAt(row.fix, `${path5}.fix`);
      nonemptyAt(fix.shape, `${path5}.fix.shape`);
      nonemptyAt(fix.cost, `${path5}.fix.cost`);
      if (proposalKind === "proposal") {
        oneOfAt(fix.originClass, ["attention-miss", "self-consistency", "design-absence"], `${path5}.fix.originClass`);
        for (const field of ["sitesWalked", "rulingsChecked", "testLocation"]) {
          nonemptyAt(fix[field], `${path5}.fix.${field}`);
        }
        if (normalizedAnswer(stringAt(fix.testLocation, `${path5}.fix.testLocation`)) === "none" && fix.originClass !== "design-absence") {
          decodeFailure(`${path5}.fix.testLocation`, "none only for design-absence architecture proposals");
        }
        for (const field of ["interfaceChange", "ownershipChange", "riskSurface"]) {
          booleanAt(fix[field], `${path5}.fix.${field}`);
        }
        if (fix.originClass === "self-consistency") nonemptyAt(fix.guardrail, `${path5}.fix.guardrail`);
      }
      if (fix.coordination !== void 0) nonemptyAt(fix.coordination, `${path5}.fix.coordination`);
      booleanAt(row.priorMarkRequired, `${path5}.priorMarkRequired`);
      integerAt(row.shapeEditCount, `${path5}.shapeEditCount`);
      const state = oneOfAt(row.state, PROPOSED_FIX_STATES, `${path5}.state`);
      if (state === "marked" && marks.length !== 1) decodeFailure(`${path5}.marks`, "one mark when marked");
      if (state !== "marked" && marks.length !== 0) decodeFailure(`${path5}.marks`, "empty unless marked");
      if (state === "rejected") nonemptyAt(row.reason, `${path5}.reason`);
      break;
    }
    case "Shelved fix": {
      seatAt(row.author, `${path5}.author`);
      if (arrayAt(row.proposedFixRefs, `${path5}.proposedFixRefs`).length === 0) decodeFailure(`${path5}.proposedFixRefs`, "non-empty");
      refsAt(row.proposedFixRefs, "Proposed fix", `${path5}.proposedFixRefs`);
      nonemptyAt(row.artifact, `${path5}.artifact`);
      if (row.redRun !== null) nonemptyAt(objectAt(row.redRun, `${path5}.redRun`).path, `${path5}.redRun.path`);
      nonemptyAt(objectAt(row.greenRun, `${path5}.greenRun`).path, `${path5}.greenRun.path`);
      if (row.redRun !== null && objectAt(row.redRun, `${path5}.redRun`).path === objectAt(row.greenRun, `${path5}.greenRun`).path) {
        decodeFailure(`${path5}.redRun.path`, "different from greenRun.path");
      }
      const state = oneOfAt(row.state, SHELVED_FIX_STATES, `${path5}.state`);
      if (state === "conditions") nonemptyAt(row.conditions, `${path5}.conditions`);
      if (state === "reviewed" && marks.length !== 1) decodeFailure(`${path5}.marks`, "one mark when reviewed");
      if (state !== "reviewed" && marks.length !== 0) decodeFailure(`${path5}.marks`, "empty unless reviewed");
      break;
    }
    case "Check-in": {
      if (row.author !== "master") decodeFailure(`${path5}.author`, "master");
      if (arrayAt(row.shelvedFixRefs, `${path5}.shelvedFixRefs`).length === 0) decodeFailure(`${path5}.shelvedFixRefs`, "non-empty");
      refsAt(row.shelvedFixRefs, "Shelved fix", `${path5}.shelvedFixRefs`);
      actorAt(row.executor, `${path5}.executor`);
      nonemptyAt(row.approval, `${path5}.approval`);
      const state = oneOfAt(row.state, CHECK_IN_STATES, `${path5}.state`);
      if (state === "checked in") {
        nonemptyAt(row.changeset, `${path5}.changeset`);
        nonemptyAt(row.departures, `${path5}.departures`);
      }
      if (state === "dropped") nonemptyAt(row.reason, `${path5}.reason`);
      if (marks.length !== 0) decodeFailure(`${path5}.marks`, "empty");
      break;
    }
  }
  return row;
}
function decodeProtocolState(input) {
  const state = objectAt(input, "state");
  if (state.schemaVersion !== PROTOCOL_SCHEMA_VERSION) {
    decodeFailure("state.schemaVersion", `${PROTOCOL_SCHEMA_VERSION}`);
  }
  nonemptyAt(state.campaignId, "state.campaignId");
  oneOfAt(state.mode, RUN_MODES, "state.mode");
  booleanAt(state.deep, "state.deep");
  if (state.mode !== "single" && state.deep !== true) {
    decodeFailure("state.deep", "true for joint and cold runs");
  }
  if (state.mode === "cold") seatAt(state.coldSeat, "state.coldSeat");
  else if (state.coldSeat !== null) decodeFailure("state.coldSeat", "null outside a cold run");
  const route = oneOfAt(state.route, ROUTES, "state.route");
  oneOfAt(state.policy, POLICIES, "state.policy");
  if (state.reportPath !== null) stringAt(state.reportPath, "state.reportPath");
  const names = objectAt(state.names, "state.names");
  for (const actor of ACTORS) nonemptyAt(names[actor], `state.names.${actor}`);
  const declaredCoverage = arrayAt(state.declaredCoverage, "state.declaredCoverage").map((value3, index) => {
    const declared = objectAt(value3, `state.declaredCoverage[${index}]`);
    return {
      coverageKind: oneOfAt(declared.coverageKind, ["hunk", "symptom", "cluster", "scenario"], `state.declaredCoverage[${index}].coverageKind`),
      target: nonemptyAt(declared.target, `state.declaredCoverage[${index}].target`)
    };
  });
  if (!hasRequiredCoverageDeclaration(route, state.deep, declaredCoverage)) {
    decodeFailure(
      "state.declaredCoverage",
      route === "diagnose" ? "at least one declared symptom or cluster" : "at least one declared hunk or scenario for a deep review"
    );
  }
  const rows = arrayAt(state.rows, "state.rows").map((row, index) => decodeRow(row, `state.rows[${index}]`));
  const ids = /* @__PURE__ */ new Set();
  for (const row of rows) {
    if (state.mode === "cold") {
      if (row.kind !== "Coverage" && row.kind !== "Issue") {
        decodeFailure(`state.rows.${row.id}`, "Coverage or Issue only in a cold pass");
      }
      if (row.author !== state.coldSeat) {
        decodeFailure(`state.rows.${row.id}.author`, `cold seat ${String(state.coldSeat)}`);
      }
    }
    if (ids.has(row.id)) decodeFailure("state.rows", `unique ids; ${row.id} repeats`);
    ids.add(row.id);
  }
  const requireExisting = (id, kind, path5) => {
    const target = rows.find((row) => row.id === id);
    if (!target || target.kind !== kind) decodeFailure(path5, `an existing ${kind} id`);
  };
  for (const row of rows) {
    if (row.kind === "Coverage" && row.issueId) requireExisting(row.issueId, "Issue", `${row.id}.issueId`);
    if (row.kind === "Issue") {
      row.parentIssueIds.forEach((id, index) => requireExisting(id, "Issue", `${row.id}.parentIssueIds[${index}]`));
      if (row.state === "duplicate") {
        requireExisting(row.duplicateOf, "Issue", `${row.id}.duplicateOf`);
        const target = rows.find((candidate) => candidate.id === row.duplicateOf && candidate.kind === "Issue");
        if (target?.state === "duplicate") decodeFailure(`${row.id}.duplicateOf`, "a non-duplicate Issue");
      }
      if (row.exit?.kind === "check-in") requireExisting(row.exit.checkInId, "Check-in", `${row.id}.exit.checkInId`);
    }
    if (row.kind === "Question") {
      row.issueIds.forEach((id, index) => requireExisting(id, "Issue", `${row.id}.issueIds[${index}]`));
      row.issueRefs.forEach((ref, index) => requireExisting(ref.id, "Issue", `${row.id}.issueRefs[${index}]`));
      if (row.proposedFixRef) {
        requireExisting(row.proposedFixRef.id, "Proposed fix", `${row.id}.proposedFixRef.id`);
      }
      if (row.shelvedFixRef) {
        requireExisting(row.shelvedFixRef.id, "Shelved fix", `${row.id}.shelvedFixRef.id`);
      }
    }
    if (row.kind === "Proposed fix") {
      row.issueRefs.forEach((ref, index) => requireExisting(ref.id, "Issue", `${row.id}.issueRefs[${index}]`));
      if (row.fix.originClass === "design-absence") {
        const reachesRestructure = (issueId, seen = /* @__PURE__ */ new Set()) => {
          if (seen.has(issueId)) return false;
          seen.add(issueId);
          const issue = rows.find((candidate) => candidate.kind === "Issue" && candidate.id === issueId);
          return issue !== void 0 && (issue.label === "Restructure" || issue.parentIssueIds.some((parentId) => reachesRestructure(parentId, seen)));
        };
        if (!row.issueRefs.some((ref) => reachesRestructure(ref.id))) {
          decodeFailure(`${row.id}.fix.originClass`, "design-absence linked to a Restructure Issue");
        }
      }
    }
    if (row.kind === "Shelved fix") {
      row.proposedFixRefs.forEach((ref, index) => requireExisting(ref.id, "Proposed fix", `${row.id}.proposedFixRefs[${index}]`));
      for (const ref of row.proposedFixRefs) {
        const proposed = rows.find(
          (candidate) => candidate.kind === "Proposed fix" && candidate.id === ref.id
        );
        if (proposed?.proposalKind === "direction") {
          decodeFailure(`${row.id}.proposedFixRefs`, "only proposals, never directions");
        }
      }
    }
    if (row.kind === "Check-in") {
      row.shelvedFixRefs.forEach((ref, index) => requireExisting(ref.id, "Shelved fix", `${row.id}.shelvedFixRefs[${index}]`));
    }
  }
  if (state.checkout !== null) {
    const checkout = objectAt(state.checkout, "state.checkout");
    seatAt(checkout.holder, "state.checkout.holder");
    nonemptyAt(checkout.purpose, "state.checkout.purpose");
    const checkoutRowIds = arrayAt(checkout.rowIds, "state.checkout.rowIds").map((id, index) => {
      const value3 = stringAt(id, `state.checkout.rowIds[${index}]`);
      if (!ids.has(value3)) decodeFailure(`state.checkout.rowIds[${index}]`, "an existing row id");
      return value3;
    });
    if (checkoutRowIds.length === 0 || new Set(checkoutRowIds).size !== checkoutRowIds.length) {
      decodeFailure("state.checkout.rowIds", "a non-empty distinct row-id list");
    }
    const targets = arrayAt(checkout.targets, "state.checkout.targets");
    if (targets.length !== checkoutRowIds.length) {
      decodeFailure("state.checkout.targets", "one target snapshot per checkout row");
    }
    targets.forEach((value3, index) => {
      const target = objectAt(value3, `state.checkout.targets[${index}]`);
      const id = stringAt(target.id, `state.checkout.targets[${index}].id`);
      if (id !== checkoutRowIds[index]) {
        decodeFailure(`state.checkout.targets[${index}].id`, String(checkoutRowIds[index]));
      }
      integerAt(target.revision, `state.checkout.targets[${index}].revision`);
      oneOfAt(target.state, [
        ...COVERAGE_STATES,
        ...ISSUE_STATES,
        ...QUESTION_STATES,
        ...PROPOSED_FIX_STATES,
        ...SHELVED_FIX_STATES,
        ...CHECK_IN_STATES
      ], `state.checkout.targets[${index}].state`);
      booleanAt(target.current, `state.checkout.targets[${index}].current`);
    });
    timestampAt(checkout.takenAt, "state.checkout.takenAt");
  }
  const issueTakeIds = /* @__PURE__ */ new Set();
  arrayAt(state.issueTakes, "state.issueTakes").forEach((value3, index) => {
    const take3 = objectAt(value3, `state.issueTakes[${index}]`);
    const id = idAt(take3.issueId, "Issue", `state.issueTakes[${index}].issueId`);
    if (issueTakeIds.has(id)) decodeFailure("state.issueTakes", `one take per Issue; ${id} repeats`);
    issueTakeIds.add(id);
    const issue = rows.find((row) => row.kind === "Issue" && row.id === id);
    if (!issue) decodeFailure(`state.issueTakes[${index}].issueId`, "an existing Issue id");
    const revision = integerAt(take3.issueRevision, `state.issueTakes[${index}].issueRevision`);
    if (revision !== issue.revision) decodeFailure(`state.issueTakes[${index}].issueRevision`, `${issue.revision}`);
    seatAt(take3.holder, `state.issueTakes[${index}].holder`);
    timestampAt(take3.takenAt, `state.issueTakes[${index}].takenAt`);
  });
  if (state.baseline !== null) {
    const baseline = objectAt(state.baseline, "state.baseline");
    seatAt(baseline.recordedBy, "state.baseline.recordedBy");
    nonemptyAt(baseline.buildLog, "state.baseline.buildLog");
    nonemptyAt(baseline.testLog, "state.baseline.testLog");
    timestampAt(baseline.recordedAt, "state.baseline.recordedAt");
  }
  const handoffs = objectAt(state.handoffs, "state.handoffs");
  for (const seat of ["A", "B"]) {
    if (handoffs[seat] !== null) {
      const handoff = objectAt(handoffs[seat], `state.handoffs.${seat}`);
      if (handoff.seat !== seat) decodeFailure(`state.handoffs.${seat}.seat`, seat);
      timestampAt(handoff.at, `state.handoffs.${seat}.at`);
    }
  }
  const imports = objectAt(state.imports, "state.imports");
  for (const seat of ["A", "B"]) booleanAt(imports[seat], `state.imports.${seat}`);
  if (state.reportCheckpoint !== null) {
    const checkpoint = objectAt(state.reportCheckpoint, "state.reportCheckpoint");
    const recordedBy = oneOfAt(checkpoint.recordedBy, ["A", "master"], "state.reportCheckpoint.recordedBy");
    if (state.mode === "single" && recordedBy !== "A") {
      decodeFailure("state.reportCheckpoint.recordedBy", "A in a single-seat run");
    }
    if (state.mode === "joint" && recordedBy !== "master") {
      decodeFailure("state.reportCheckpoint.recordedBy", "master in a joint run");
    }
    if (state.mode === "cold") decodeFailure("state.reportCheckpoint", "null in a cold run");
    timestampAt(checkpoint.recordedAt, "state.reportCheckpoint.recordedAt");
    const notesHash = stringAt(checkpoint.notesHash, "state.reportCheckpoint.notesHash");
    if (!/^[0-9a-f]{64}$/.test(notesHash)) {
      decodeFailure("state.reportCheckpoint.notesHash", "a lowercase SHA-256");
    }
  }
  arrayAt(state.notifications, "state.notifications").forEach((value3, index) => {
    const notice = objectAt(value3, `state.notifications[${index}]`);
    actorAt(notice.recipient, `state.notifications[${index}].recipient`);
    oneOfAt(notice.kind, ["ready-work", "handoff", "question", "answer", "no-ready-work-left"], `state.notifications[${index}].kind`);
    nonemptyAt(notice.message, `state.notifications[${index}].message`);
    stringsAt(notice.rowIds, `state.notifications[${index}].rowIds`);
    timestampAt(notice.at, `state.notifications[${index}].at`);
  });
  const decoded = input;
  for (const row of rows) {
    if (row.kind === "Question" && row.state === "open") {
      if (!refsCurrent(decoded, row.issueRefs, "Issue")) {
        decodeFailure(`${row.id}.issueRefs`, "current Issue revisions while open");
      }
      if (row.proposedFixRef && !refsCurrent(decoded, [row.proposedFixRef], "Proposed fix")) {
        decodeFailure(`${row.id}.proposedFixRef`, "a current Proposed-fix revision while open");
      }
      if (row.shelvedFixRef && !refsCurrent(decoded, [row.shelvedFixRef], "Shelved fix")) {
        decodeFailure(`${row.id}.shelvedFixRef`, "a current Shelved-fix revision while open");
      }
    }
    if (row.kind === "Shelved fix") {
      const noTestRefs = row.proposedFixRefs.filter(
        (ref) => normalizedAnswer(rowOfKind(decoded, ref.id, "Proposed fix").fix.testLocation ?? "") === "none"
      );
      if (noTestRefs.some((ref) => !allowsNoRedRun(decoded, [ref]))) {
        decodeFailure(`${row.id}.redRun`, `a current '${ALLOW_NO_RED_ANSWER}' answer for every no-test proposal`);
      }
      if (noTestRefs.length < row.proposedFixRefs.length && row.redRun === null) {
        decodeFailure(`${row.id}.redRun`, "a failing run for every testable proposal");
      }
      if (noTestRefs.length === row.proposedFixRefs.length && row.redRun !== null) {
        decodeFailure(`${row.id}.redRun`, "null when every proposal has a no-red exception");
      }
    }
  }
  return decoded;
}

// src/fields.ts
var InputError = class extends CliError_exports.UserError {
  constructor(message) {
    super({ cause: new Error(message), userMessage: message });
  }
};
function parseFields(tokens) {
  const positional = [];
  const fields = /* @__PURE__ */ new Map();
  for (const token of tokens) {
    const separator = token.indexOf("=");
    if (separator < 1) {
      positional.push(token);
      continue;
    }
    const key = token.slice(0, separator).trim();
    const value3 = token.slice(separator + 1);
    if (!key) throw new InputError(`invalid field '${token}'`);
    if (fields.has(key)) throw new InputError(`field '${key}' was provided twice`);
    fields.set(key, value3);
  }
  return { positional, fields };
}
function allowOnly(fields, allowed) {
  const accepted = new Set(allowed);
  for (const key of fields.keys()) {
    if (!accepted.has(key)) {
      throw new InputError(`unknown field '${key}'; allowed: ${allowed.join(", ")}`);
    }
  }
}
function required(fields, key) {
  const value3 = fields.get(key)?.trim() ?? "";
  if (!value3) throw new InputError(`missing ${key}=...`);
  return value3;
}
function optional6(fields, key, fallback = "") {
  return fields.get(key)?.trim() ?? fallback;
}
function requiredRevision(fields) {
  const raw = required(fields, "rev");
  if (!/^\d+$/.test(raw)) throw new InputError(`rev must be a non-negative integer (got '${raw}')`);
  return Number(raw);
}
function integerInRange(fields, key, minimum, maximum) {
  const raw = required(fields, key);
  if (!/^\d+$/.test(raw)) throw new InputError(`${key} must be an integer from ${minimum} to ${maximum}`);
  const value3 = Number(raw);
  if (value3 < minimum || value3 > maximum) {
    throw new InputError(`${key} must be an integer from ${minimum} to ${maximum}`);
  }
  return value3;
}
function booleanField(fields, key, fallback = false) {
  const raw = fields.get(key);
  if (raw === void 0) return fallback;
  if (raw === "yes" || raw === "true") return true;
  if (raw === "no" || raw === "false") return false;
  throw new InputError(`${key} must be yes or no`);
}
function listField(fields, key, requiredValue = true) {
  const raw = fields.get(key)?.trim() ?? "";
  if (!raw) {
    if (requiredValue) throw new InputError(`missing ${key}=...`);
    return [];
  }
  const values = raw.split(/[\s,]+/).map((value3) => value3.trim()).filter(Boolean);
  if (requiredValue && values.length === 0) throw new InputError(`${key} must not be empty`);
  return values;
}
function optionList(raw) {
  const starts = [...raw.matchAll(/(?:^|\s)(\([a-z]\))\s*/gi)];
  if (starts.length < 2) return raw.split(",").map((value3) => value3.trim()).filter(Boolean);
  const values = [];
  for (let index = 0; index < starts.length; index += 1) {
    const start = starts[index];
    const end = starts[index + 1]?.index ?? raw.length;
    const offset = (start.index ?? 0) + start[0].length;
    values.push(raw.slice(offset, end).trim());
  }
  return values;
}
function assertOnePositional(parsed, noun) {
  if (parsed.positional.length !== 1) {
    throw new InputError(`${noun} needs exactly one row id`);
  }
  return parsed.positional[0];
}
function assertNoPositionals(parsed, noun) {
  if (parsed.positional.length > 0) {
    throw new InputError(`${noun} does not accept positional arguments: ${parsed.positional.join(" ")}`);
  }
}

// src/report.ts
var ISSUE_ORDER = ["Bug", "Restructure", "Hardening", "telemetry-quality", "Nit"];
function escapeCell(value3) {
  return String(value3 ?? "").replaceAll("\\", "\\\\").replaceAll("|", "\\|").replace(/\r?\n/g, "<br>");
}
function code(value3) {
  return `\`${value3.replaceAll("`", "\\`")}\``;
}
function table2(headers, rows) {
  const lines2 = [
    `| ${headers.map(escapeCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`)
  ];
  return lines2.join("\n");
}
function joinOrNone(values) {
  return values.length > 0 ? values.join(", ") : "none";
}
function rowById2(state, id) {
  return state.rows.find((row) => row.id === id);
}
function issueById(state, id) {
  const row = rowById2(state, id);
  return row?.kind === "Issue" ? row : void 0;
}
function currentMark2(row) {
  return row.marks.find((mark) => mark.revision === row.revision);
}
function markSummary(state, row) {
  const mark = currentMark2(row);
  if (state.mode === "single" && row.kind !== "Shelved fix" && mark === void 0) return "single-seat";
  return mark ? `${mark.reviewer} at ${mark.at}` : "open";
}
function splitExactTokens(value3) {
  return parseClusterTokens(value3);
}
function coverageTokens(item) {
  return item.coverageKind === "cluster" ? splitExactTokens(item.target) : [item.target.trim()];
}
function coverageMatches(declared, observed) {
  if (declared.coverageKind !== observed.coverageKind) return false;
  const observedTokens = new Set(coverageTokens(observed));
  return coverageTokens(declared).every((token) => observedTokens.has(token));
}
function coverageStateFor(state, declared) {
  const matching = state.rows.filter(
    (row) => row.kind === "Coverage" && coverageMatches(declared, row)
  );
  if (matching.some((row) => row.state === "gap")) return "gap";
  const explainedByIssue = declared.coverageKind === "cluster" && state.rows.some(
    (row) => row.kind === "Issue" && (row.state === "verified" || row.state === "assumed") && row.clusters.some((cluster) => coverageMatches(declared, { coverageKind: "cluster", target: cluster }))
  );
  if (explainedByIssue || matching.some((row) => row.state === "covered")) return "covered";
  return "open";
}
function activeIssueClusterTokens(state) {
  return new Set(
    state.rows.flatMap((row) => {
      if (row.kind !== "Issue" || row.state !== "verified" && row.state !== "assumed") return [];
      return row.clusters.flatMap(splitExactTokens);
    })
  );
}
function uncoveredDeclaredClusters(state) {
  const explained = activeIssueClusterTokens(state);
  return state.declaredCoverage.filter((item) => item.coverageKind === "cluster").flatMap((item) => splitExactTokens(item.target)).filter((target, index, all3) => all3.indexOf(target) === index && !explained.has(target));
}
function countRows(state, kind, rowState) {
  return state.rows.filter((row) => row.kind === kind && row.state === rowState).length;
}
function stateCountRows(state) {
  const groups = [
    ["Coverage", COVERAGE_STATES],
    ["Issue", ISSUE_STATES],
    ["Question", QUESTION_STATES],
    ["Proposed fix", PROPOSED_FIX_STATES],
    ["Shelved fix", SHELVED_FIX_STATES],
    ["Check-in", CHECK_IN_STATES]
  ];
  return groups.flatMap(
    ([kind, states]) => states.map((rowState) => [kind, rowState, countRows(state, kind, rowState)])
  );
}
function revisionForReady(state, item) {
  return item.rowId === void 0 ? void 0 : rowById2(state, item.rowId)?.revision;
}
function readyCommand(state, item) {
  const id = item.rowId;
  const row = id === void 0 ? void 0 : rowById2(state, id);
  const rev = revisionForReady(state, item);
  const target = id === void 0 ? "" : ` ${id}${rev === void 0 ? "" : ` rev=${rev}`}`;
  switch (item.command) {
    case "coverage.cover":
      return `ledger coverage set${target} state=covered evidence=<path>`;
    case "coverage.gap":
      return `ledger coverage set${target} state=gap reason=<reason>`;
    case "issue.verify":
      if (row?.kind === "Issue") {
        const facts = [
          ["trigger", row.facts.trigger],
          ["cause", row.facts.cause],
          ["scope", row.facts.scope],
          ["frequency", row.facts.frequency],
          ["impact", row.facts.impact]
        ].filter(([, value3]) => !value3).map(([field]) => `${field}=<${field}>`);
        if (row.facts.impactRank === void 0) facts.push("impact_rank=<1-5>");
        const prefix = `ledger issue set${target}${facts.length === 0 ? "" : ` ${facts.join(" ")}`}`;
        return `${prefix} state=verified certainty=4 evidence=<path> | ${prefix} state=assumed certainty=<1-5> assumption=<fact> no_probe_reason=<reason> | ledger issue disprove${target} certainty=<2-5> evidence=<path>`;
      }
      return `ledger issue set${target} state=verified certainty=4 evidence=<path>`;
    case "issue.assume":
      return `ledger issue set${target} state=assumed certainty=<1-5> assumption=<fact> no_probe_reason=<reason>`;
    case "issue.edit":
      return `ledger issue set${target} <changed-field>=<value>`;
    case "issue.mark":
      return `ledger issue agree${target} | ledger issue contest${target} probe=<probe> | ledger issue disprove${target} certainty=<2-5> evidence=<path> | ledger issue duplicate${target} of=<issue-id> | ledger issue set${target} <correction>=<value>`;
    case "issue.contest":
      return `ledger issue contest${target} probe=<command-or-path>`;
    case "issue.disprove":
      return `ledger issue disprove${target} certainty=4 evidence=<path>`;
    case "issue.duplicate":
      return `ledger issue duplicate${target} of=<issue-id>`;
    case "issue.accept":
      return `ledger issue accept${target} reason=<reason>`;
    case "issue.take":
      return `ledger issue take${target}`;
    case "issue.release":
      return `ledger issue release${target}`;
    case "issue.probe":
      return `ledger issue probe${target} verdict=<verified-or-disproved> certainty=<4-5> evidence=<path>`;
    case "question.answer":
      return `ledger question answer${target} answer=<answer>`;
    case "question.add":
      if (row?.kind === "Proposed fix") {
        const noRed = row.fix.originClass === "design-absence" && row.fix.testLocation?.trim().toLowerCase() === "none";
        return `ledger question add issues=${row.issueRefs.map((reference) => reference.id).join(",")} proposed_fix=${row.id} purpose=${noRed ? "no-red" : "decision"} question=<question> options=${noRed ? "'(a) allow-no-red (b) require-test'" : "<options>"} recommendation=<choice> user_effect=<effect> code_cost=<cost>`;
      }
      if (row?.kind === "Shelved fix") {
        const issueIds = [...new Set(row.proposedFixRefs.flatMap((reference) => {
          const proposed = rowById2(state, reference.id);
          return proposed?.kind === "Proposed fix" ? proposed.issueRefs.map((issueRef) => issueRef.id) : [];
        }))];
        return `ledger question add issues=${issueIds.join(",")} shelved_fix=${row.id} purpose=decision question=<question> options=<options> recommendation=<choice> user_effect=<effect> code_cost=<cost>`;
      }
      return "ledger question add issues=<issue-ids> purpose=decision question=<question> options=<options> recommendation=<choice> user_effect=<effect> code_cost=<cost>";
    case "proposed-fix.add":
      return `ledger proposed-fix add issues=${id ?? "<issue-ids>"} kind=<proposal|direction> shape=<shape> cost=<cost> [origin_class=<class> sites=<sites> rulings=<rulings> test=<location> guardrail=<if-required> coordination=<if-needed>]`;
    case "proposed-fix.edit":
      return `ledger proposed-fix set${target} <changed-field>=<value>`;
    case "proposed-fix.mark":
      return `ledger proposed-fix mark${target} | ledger proposed-fix reject${target} reason=<condition>`;
    case "proposed-fix.reject":
      return `ledger proposed-fix reject${target} reason=<reason>`;
    case "shelved-fix.add":
      return `ledger shelved-fix add proposed_fixes=${id ?? "<ids>"} artifact=<shelve>${row?.kind === "Proposed fix" && allowsNoRedRun(state, [{ id: row.id, revision: row.revision }]) ? "" : " red=<path>"} green=<path>`;
    case "shelved-fix.edit":
      return `ledger shelved-fix set${target} artifact=<shelve>${row?.kind === "Shelved fix" && allowsNoRedRun(state, row.proposedFixRefs) ? "" : " red=<path>"} green=<path>`;
    case "shelved-fix.review":
      return `ledger shelved-fix review${target} | ledger shelved-fix conditions${target} conditions=<condition>`;
    case "check-in.record":
      return `ledger check-in record${target} changeset=<id> departures=<none-or-text>`;
    case "check-in.drop":
      return `ledger check-in drop${target} reason=<reason>`;
    case "checkout.take":
      if (row?.kind === "Issue" && row.state !== "contested") return `ledger issue take${target}`;
      return `ledger checkout take purpose=<purpose>${id === void 0 ? "" : ` rows=${id}`}`;
    case "checkout.baseline":
      return "ledger checkout baseline build=<path> test=<path>";
    case "checkout.release":
      return "ledger checkout release";
    case "handoff":
      return "ledger handoff";
    case "cold.import":
      return "ledger import";
    case "report.record":
      return "ledger report";
    case "coverage.add": {
      const match7 = item.reason.match(/^Cover (hunk|symptom|cluster|scenario) '(.+)'$/);
      return match7 === null ? "ledger coverage add kind=<kind> target=<target> state=covered evidence=<what-was-checked> | ledger coverage add kind=<kind> target=<target> state=gap reason=<gap>" : `ledger coverage add kind=${match7[1]} target=${JSON.stringify(match7[2])} state=covered evidence=<what-was-checked> | ledger coverage add kind=${match7[1]} target=${JSON.stringify(match7[2])} state=gap reason=<gap>`;
    }
    case "issue.add":
    case "check-in.approve":
      return `ledger ${item.command.replace(".", " ")}${target}`;
    case "issue.exit":
      return `ledger issue exit${target} kind=comment-or-assert reference=<comment-or-assert>`;
    default:
      return `ledger ${String(item.command).replace(".", " ")}${target}`;
  }
}
function readyForProjection(state, actor) {
  return readyWork(state, actor).filter((item) => {
    if (item.rowId === void 0) return true;
    const row = rowById2(state, item.rowId);
    return row?.kind !== "Issue" || row.label !== "Hardening" && row.label !== "Nit" && row.label !== "telemetry-quality";
  });
}
function formatReadyCommands(command) {
  return command.split(" | ").map((candidate) => candidate.replace(/^ledger\b/, '"$LEDGER_DIR/bin/ledger.ts"')).map(code).join(" or ");
}
var pinnedCommand = (arguments_) => `"$LEDGER_DIR/bin/ledger.ts" ${arguments_}`;
function readyBlock(state, actor) {
  const ready = readyForProjection(state, actor);
  if (ready.length > 0) {
    return ready.map((item) => `- ${item.rowId ? `${code(item.rowId)}: ` : ""}${escapeCell(item.reason)} \u2014 ${formatReadyCommands(readyCommand(state, item))}`).join("\n");
  }
  if (state.reportCheckpoint !== null) {
    return `- Final report recorded at ${state.reportCheckpoint.recordedAt}; await the user's check-in decision.`;
  }
  if (actor === "master") {
    if (state.mode === "single") return "- No master action is ready in a single-reviewer run.";
    const complete = state.handoffs.A !== null && state.handoffs.B !== null;
    return complete ? `- No reviewer-ready work remains. Next: ${code(pinnedCommand("report"))}` : "- No master action is ready. Wait for a Question or both reviewer handoffs.";
  }
  if (state.checkout?.holder === actor) {
    return `- Release the checkout before handoff: ${code(pinnedCommand("checkout release"))}`;
  }
  const takes = state.issueTakes.filter((take3) => take3.holder === actor);
  if (takes.length > 0) {
    return takes.map((take3) => {
      const revision = issueById(state, take3.issueId)?.revision;
      const command = pinnedCommand(`issue release ${take3.issueId}${revision === void 0 ? "" : ` rev=${revision}`}`);
      return `- Release ${code(take3.issueId)} before handoff: ${code(command)}`;
    }).join("\n");
  }
  if (state.handoffs[actor] !== null) {
    return "- Handed off; remain idle until the ledger sends new ready work.";
  }
  if (state.mode === "single") {
    return actor === "A" ? readyForProjection(state, "B").length > 0 ? `- Dispatch the fresh diff reviewer and give it seat B's command above.` : `- No ready work. Next: ${code(pinnedCommand("report"))}` : "- No fresh diff review is ready.";
  }
  if (state.mode === "cold") return `- Cold work complete. Next: ${code(pinnedCommand("import"))}`;
  return `- No ready work. Next: ${code(pinnedCommand("handoff"))}`;
}
function openQuestions(state) {
  return state.rows.filter(
    (row) => row.kind === "Question" && row.state === "open"
  );
}
function displayOptions(options) {
  return options.map((option4, index) => /^\s*\([a-z]\)\s+/i.test(option4) ? option4 : `(${String.fromCharCode(97 + index)}) ${option4}`).join("<br>");
}
function renderOpenQuestions(state) {
  const questions = openQuestions(state);
  if (questions.length === 0) return "None.";
  return table2(
    ["ID", "State", "Asked by", "Issues", "Fix revision", "Question", "Options", "User effect", "Code cost", "Recommendation"],
    questions.map((row) => [
      row.id,
      "open",
      state.names[row.author],
      joinOrNone(row.issueRefs.map((reference) => `${reference.id}@r${reference.revision}`)),
      row.proposedFixRef !== void 0 ? `${row.proposedFixRef.id}@r${row.proposedFixRef.revision}` : row.shelvedFixRef !== void 0 ? `${row.shelvedFixRef.id}@r${row.shelvedFixRef.revision}` : "none",
      row.question,
      displayOptions(row.options),
      row.userEffect,
      row.codeCost,
      row.recommendation
    ])
  );
}
function renderStatusIssues(state) {
  const issues = state.rows.filter((row) => row.kind === "Issue");
  if (issues.length === 0) return "None.";
  return table2(
    ["Issue", "Label", "State", "Take"],
    issues.map((issue) => {
      const take3 = state.issueTakes.find((candidate) => candidate.issueId === issue.id);
      return [
        `${issue.id} r${issue.revision}`,
        issue.label,
        issueStateSummary(issue),
        take3 === void 0 ? "none" : `taken by ${take3.holder} for r${take3.issueRevision} since ${take3.takenAt}; no expiry`
      ];
    })
  );
}
function renderStatus(state, context3 = {}) {
  const actor = context3.actor;
  const readyA = readyForProjection(state, "A");
  const readyB = readyForProjection(state, "B");
  const checkout = state.checkout === null ? "free" : `${state.names[state.checkout.holder]} (${state.checkout.holder}) \u2014 ${state.checkout.purpose}; since ${state.checkout.takenAt}; rows: ${joinOrNone(state.checkout.rowIds)}; no expiry`;
  const takes = state.issueTakes.length === 0 ? "None." : table2(
    ["Issue", "Taken by", "Since", "Expiry"],
    state.issueTakes.map((take3) => [
      `${take3.issueId}@r${take3.issueRevision}`,
      `${state.names[take3.holder]} (${take3.holder})`,
      take3.takenAt,
      "none"
    ])
  );
  const lines2 = [
    "# Ledger status",
    "",
    `Run: ${state.deep ? "deep " : state.route === "review" ? "quick " : "plain "}${state.route}; how far: ${state.policy}; topology: ${state.mode}.`,
    state.mode === "cold" ? "Cold independence: this is an isolated cold-pass database; shared derived coverage and peer rows are intentionally unavailable." : state.mode === "single" ? "Single-reviewer run: no cold peer import is required; seat B is used only for the fresh diff review of a Shelved fix." : `Cold imports: A ${state.imports.A ? "imported" : "pending"}; B ${state.imports.B ? "imported" : "pending"}.`,
    `A ready work: ${readyA.length}; B ready work: ${readyB.length}.`,
    state.mode === "single" ? "Handoff: not used in a single-reviewer run." : `Handoffs: A ${state.handoffs.A?.at ?? "working"}; B ${state.handoffs.B?.at ?? "working"}.`,
    `Checkout: ${checkout}.`,
    "",
    "## Rows by state",
    "",
    table2(["Row", "State", "Count"], stateCountRows(state)),
    "",
    "## Issue takes",
    "",
    takes,
    "",
    "## Issues",
    "",
    renderStatusIssues(state),
    "",
    "## Open questions",
    "",
    renderOpenQuestions(state),
    "",
    `## ${state.names.A} (A) ready work`,
    "",
    readyBlock(state, "A"),
    "",
    `## ${state.names.B} (B) ready work`,
    "",
    readyBlock(state, "B")
  ];
  if (actor !== void 0) {
    lines2.push("", `## Your next step (${state.names[actor]})`, "", readyBlock(state, actor));
  }
  return `${lines2.join("\n")}
`;
}
function isStoredEvent(event) {
  return "occurredAt" in event;
}
function friendlyAction(action2) {
  const names = {
    "coverage.cover": "coverage set",
    "coverage.gap": "coverage set",
    "issue.edit": "issue set",
    "issue.verify": "issue set",
    "issue.assume": "issue set",
    "issue.mark": "issue agree",
    "proposed-fix.edit": "proposed-fix set",
    "shelved-fix.edit": "shelved-fix set"
  };
  return names[action2] ?? action2.replace(".", " ");
}
function eventDetail(event) {
  switch (event.type) {
    case "run.changed":
      return `depth escalated; declared coverage now has ${event.declaredCoverage.length} targets`;
    case "row.changed":
      return event.reason;
    case "checkout.changed":
      if (event.checkout !== null) return event.checkout.purpose;
      return event.release?.forced ? `forced release: ${event.release.reason ?? "reason not recorded"}` : "released";
    case "handoff.changed":
      return event.handoff === null ? "work resumed" : "handed off";
    case "import.changed":
      return event.imported ? "cold rows imported" : "import cleared";
    case "issue-take.changed":
      return event.take === null ? "released" : `taken by ${event.take.holder}`;
    case "report.changed":
      return event.checkpoint === null ? "report checkpoint invalidated" : `report recorded by ${event.checkpoint.recordedBy}`;
    case "notification.requested":
      return `${event.notification.kind} \u2192 ${event.notification.recipient}`;
  }
}
function storedEventDetail(value3) {
  if (value3 === null || typeof value3 !== "object") return value3 === void 0 ? "" : String(value3);
  const detail = value3;
  switch (detail.type) {
    case "run.changed": {
      const declaredCoverage = Array.isArray(detail.declaredCoverage) ? detail.declaredCoverage : [];
      return `depth escalated; declared coverage now has ${declaredCoverage.length} targets`;
    }
    case "row.changed":
      return String(detail.reason ?? "command");
    case "checkout.changed": {
      const checkout = detail.checkout;
      if (checkout?.purpose !== void 0) return String(checkout.purpose);
      const release = detail.release;
      return release?.forced ? `forced release: ${String(release.reason ?? "reason not recorded")}` : "released";
    }
    case "handoff.changed":
      return detail.handoff == null ? "work resumed" : "handed off";
    case "import.changed":
      return detail.imported ? "cold rows imported" : "import cleared";
    case "issue-take.changed": {
      const take3 = detail.take;
      return take3?.holder === void 0 ? "released" : `taken by ${String(take3.holder)}`;
    }
    case "report.changed": {
      const checkpoint = detail.checkpoint;
      return checkpoint === null ? "report checkpoint invalidated" : `report recorded by ${String(checkpoint?.recordedBy ?? "unknown")}`;
    }
    case "notification.requested": {
      const notification = detail.notification;
      return `${String(notification?.kind ?? "notification")} \u2192 ${String(notification?.recipient ?? "unknown")}`;
    }
    default:
      return JSON.stringify(value3);
  }
}
function normalizeEvents(events) {
  return events.map((event, index) => {
    if (isStoredEvent(event)) {
      return {
        sequence: event.sequence,
        at: event.occurredAt,
        actor: event.actor,
        action: friendlyAction(event.action),
        rowKind: event.rowKind ?? "\u2014",
        rowId: event.rowId ?? "\u2014",
        from: event.fromState ?? "\u2014",
        to: event.toState ?? "\u2014",
        detail: storedEventDetail(event.detail)
      };
    }
    return {
      sequence: index + 1,
      at: event.at,
      actor: event.actor,
      action: friendlyAction(event.command),
      rowKind: event.type === "row.changed" ? event.rowKind : event.type.replace(".changed", ""),
      rowId: event.type === "row.changed" ? event.rowId : event.type === "issue-take.changed" ? event.issueId : "\u2014",
      from: event.from ?? "\u2014",
      to: event.to ?? "\u2014",
      detail: eventDetail(event)
    };
  }).sort((left, right) => left.sequence - right.sequence);
}
function renderTimeline(state, events, actor) {
  const actors = actor === void 0 ? ["A", "B", "master"] : [actor];
  const normalized = normalizeEvents(events);
  const sections = actors.flatMap((who) => {
    const own = normalized.filter((event) => event.actor === who);
    return [
      `## ${state.names[who]} (${who})`,
      "",
      own.length === 0 ? "No recorded transitions." : table2(
        ["#", "Timestamp", "Action", "Row", "From", "To", "Detail"],
        own.map((event) => [
          event.sequence,
          event.at,
          `${event.action} (${event.rowKind})`,
          event.rowId,
          event.from,
          event.to,
          event.detail
        ])
      ),
      ""
    ];
  });
  return `${sections.join("\n").trimEnd()}
`;
}
function proposedFixesForIssue2(state, issue) {
  return state.rows.filter(
    (row) => row.kind === "Proposed fix" && row.issueRefs.some((reference) => reference.id === issue.id && reference.revision === issue.revision)
  );
}
function shelvesForProposedFix(state, proposed) {
  return state.rows.filter(
    (row) => row.kind === "Shelved fix" && row.proposedFixRefs.some((reference) => reference.id === proposed.id && reference.revision === proposed.revision)
  );
}
function issueStateSummary(issue) {
  if (issue.exit !== void 0) return `${issue.state}; exited by ${issue.exit.kind}`;
  if (issue.state === "disproved" || issue.state === "duplicate" || issue.state === "accepted") {
    return issue.state;
  }
  return `open: ${issue.state}`;
}
function issueDisposition(issue) {
  const details = [];
  if (issue.labelChangeReason) details.push(`downgrade: ${issue.labelChangeReason}`);
  if (issue.exit?.kind === "user-drop") details.push(`user drop: ${issue.exit.reason}`);
  else if (issue.exit?.kind === "check-in") details.push(`checked in by ${issue.exit.checkInId}`);
  else if (issue.exit) details.push(`${issue.exit.kind}: ${issue.exit.reference}`);
  return details.length === 0 ? "none" : details.join("; ");
}
function issueEvidence(issue) {
  switch (issue.state) {
    case "verified":
    case "disproved":
      return issue.evidence;
    case "assumed":
      return `${issue.assumption}; no probe: ${issue.noProbeReason}`;
    case "contested":
      return `probe: ${issue.probe}`;
    case "duplicate":
      return `duplicate of ${issue.duplicateOf}`;
    case "accepted":
      return issue.reason;
    case "new":
      return "open";
  }
}
function renderCoverage(state) {
  const declared = state.declaredCoverage.map((item) => [
    item.coverageKind,
    item.target,
    coverageStateFor(state, item)
  ]);
  const gaps = state.rows.filter(
    (row) => row.kind === "Coverage" && row.state === "gap"
  );
  const uncovered = uncoveredDeclaredClusters(state);
  return [
    declared.length === 0 ? "No declared coverage targets." : table2(["Kind", "Declared target", "Coverage state"], declared),
    "",
    `Coverage gaps: ${gaps.length === 0 ? "none" : gaps.map((row) => `${row.id} (${row.target}: ${row.reason})`).join("; ")}.`,
    `Uncovered declared clusters: ${uncovered.length === 0 ? "none" : uncovered.join(", ")}.`
  ].join("\n");
}
function sortIssues(issues) {
  return [...issues].sort((left, right) => {
    const rank = (left.facts.impactRank ?? 6) - (right.facts.impactRank ?? 6);
    if (rank !== 0) return rank;
    const label = ISSUE_ORDER.indexOf(left.label) - ISSUE_ORDER.indexOf(right.label);
    return label === 0 ? left.id.localeCompare(right.id) : label;
  });
}
function issueTable(state, issues) {
  if (issues.length === 0) return "None.";
  return table2(
    [
      "ID",
      "Label",
      "Impact rank",
      "Certainty",
      "State",
      "Disposition / downgrade",
      "Issue",
      "Site / trigger",
      "Cause",
      "Scope / frequency",
      "Detector / gap",
      "Clusters / parents",
      "Impact",
      "Evidence",
      "Mark",
      "Proposed fixes",
      "Shelved fixes",
      "Take"
    ],
    sortIssues(issues).map((issue) => {
      const proposed = proposedFixesForIssue2(state, issue);
      const shelves = proposed.flatMap((fix) => shelvesForProposedFix(state, fix));
      const take3 = state.issueTakes.find((candidate) => candidate.issueId === issue.id);
      return [
        `${issue.id} r${issue.revision}`,
        issue.label,
        issue.facts.impactRank ?? "open",
        `step ${issue.certainty}`,
        issueStateSummary(issue),
        issueDisposition(issue),
        issue.facts.proposition,
        `${issue.facts.site}; ${issue.facts.trigger}`,
        issue.facts.cause,
        `${issue.facts.scope}; ${issue.facts.frequency}`,
        issue.facts.detector === void 0 ? "not recorded" : `${issue.facts.detector}; missed because: ${issue.facts.detectorGap}`,
        `clusters: ${joinOrNone(issue.clusters)}; parents: ${joinOrNone(issue.parentIssueIds)}`,
        issue.facts.impact,
        issueEvidence(issue),
        markSummary(state, issue),
        joinOrNone(proposed.map((fix) => `${fix.id} (${fix.state})`)),
        joinOrNone(shelves.map((shelf) => `${shelf.id} (${shelf.state}; ${shelf.artifact})`)),
        take3 === void 0 ? "none" : `taken by ${take3.holder} for r${take3.issueRevision} since ${take3.takenAt}; no expiry`
      ];
    })
  );
}
function renderIssues(state) {
  const issues = state.rows.filter((row) => row.kind === "Issue");
  if (issues.length === 0) return "None.";
  if (state.route === "diagnose") {
    const verified = issues.filter((issue) => issue.state === "verified");
    const hypotheses = issues.filter((issue) => issue.state === "new" || issue.state === "assumed" || issue.state === "contested");
    const dispositions = issues.filter((issue) => issue.state === "disproved" || issue.state === "duplicate" || issue.state === "accepted");
    return [
      "### Verified causes",
      "",
      issueTable(state, verified),
      "",
      "### Open and assumed hypotheses",
      "",
      issueTable(state, hypotheses),
      "",
      "### Dispositions",
      "",
      issueTable(state, dispositions)
    ].join("\n");
  }
  const substantive = issues.filter((issue) => issue.label === "Bug" || issue.label === "Restructure");
  const batches = ["Hardening", "telemetry-quality", "Nit"].flatMap((label) => {
    const rows = issues.filter((issue) => issue.label === label);
    return rows.length === 0 ? [] : ["", `### ${label} batch`, "", issueTable(state, rows)];
  });
  return ["### Issues ranked by user impact", "", issueTable(state, substantive), ...batches].join("\n");
}
function renderQuestions(state) {
  const questions = state.rows.filter((row) => row.kind === "Question");
  if (questions.length === 0) return "None.";
  return table2(
    ["ID", "State", "Issues", "Fix revision", "Question", "Options", "User effect", "Code cost", "Recommendation", "Answer"],
    questions.map((row) => [
      `${row.id} r${row.revision}`,
      row.state === "open" ? "open" : "answered",
      joinOrNone(row.issueRefs.map((reference) => `${reference.id}@r${reference.revision}`)),
      row.proposedFixRef !== void 0 ? `${row.proposedFixRef.id}@r${row.proposedFixRef.revision}` : row.shelvedFixRef !== void 0 ? `${row.shelvedFixRef.id}@r${row.shelvedFixRef.revision}` : "none",
      row.question,
      displayOptions(row.options),
      row.userEffect,
      row.codeCost,
      row.recommendation,
      row.state === "answered" ? row.answer : "open"
    ])
  );
}
function renderShelvedFixes(state) {
  const rows = state.rows.filter((row) => row.kind === "Shelved fix");
  if (rows.length === 0) return "None.";
  return table2(
    ["ID", "State / review", "Proposed fixes", "Artifact", "Red", "Green", "Conditions"],
    rows.map((row) => [
      `${row.id} r${row.revision}`,
      `${row.state}; ${markSummary(state, row)}`,
      joinOrNone(row.proposedFixRefs.map((reference) => `${reference.id}@r${reference.revision}`)),
      row.artifact,
      row.redRun?.path ?? "user-authorized no-red architecture case",
      row.greenRun.path,
      row.state === "conditions" ? row.conditions : "none"
    ])
  );
}
function renderCheckIns(state) {
  const rows = state.rows.filter((row) => row.kind === "Check-in");
  if (rows.length === 0) return "None.";
  return table2(
    ["ID", "State", "Shelved fixes", "Executor", "Approval", "Result"],
    rows.map((row) => [
      `${row.id} r${row.revision}`,
      row.state,
      joinOrNone(row.shelvedFixRefs.map((reference) => `${reference.id}@r${reference.revision}`)),
      state.names[row.executor],
      row.approval,
      row.state === "checked in" ? `${row.changeset}; departures: ${row.departures || "none"}` : row.state === "dropped" ? row.reason : "open"
    ])
  );
}
function renderNotes(state, notes) {
  const seats = state.mode === "single" ? ["A"] : ["A", "B"];
  return seats.map((seat) => {
    const body = notes?.[seat]?.trim();
    return `## Reviewer ${state.names[seat]} (${seat}) notes

${body || "Notes not supplied."}`;
  }).join("\n\n");
}
function eventAction(event) {
  return isStoredEvent(event) ? event.action : event.command;
}
function noRedQuestionIds(state, shelf) {
  if (!allowsNoRedRun(state, shelf.proposedFixRefs)) return [];
  return shelf.proposedFixRefs.flatMap((proposedRef) => {
    const proposed = rowById2(state, proposedRef.id);
    if (proposed?.kind !== "Proposed fix") return [];
    const question = state.rows.find(
      (row) => row.kind === "Question" && row.purpose === "no-red" && row.state === "answered" && row.answer.trim().toLowerCase() === "allow-no-red" && row.proposedFixRef?.id === proposedRef.id && row.proposedFixRef.revision === proposedRef.revision && proposed.issueRefs.every((issueRef) => row.issueRefs.some(
        (questionRef) => questionRef.id === issueRef.id && questionRef.revision === issueRef.revision
      ))
    );
    return question === void 0 ? [] : [question.id];
  });
}
function renderValidation(state, events) {
  const facts = [];
  if (state.baseline === null) {
    facts.push("Baseline build and test logs: not recorded.");
  } else {
    facts.push(`Baseline build ran; result retained in ${state.baseline.buildLog}.`);
    facts.push(`Baseline owning tests ran; result retained in ${state.baseline.testLog}.`);
  }
  const shelves = state.rows.filter((row) => row.kind === "Shelved fix");
  if (shelves.length === 0) {
    facts.push("Shelved-fix run logs: none recorded.");
  } else {
    for (const shelf of shelves) {
      const red2 = shelf.redRun === null ? `no red log; authorization Questions: ${joinOrNone(noRedQuestionIds(state, shelf))}` : `red run failed on the unfixed code as recorded in ${shelf.redRun.path}`;
      facts.push(`${shelf.id}: ${red2}; green run passed as recorded in ${shelf.greenRun.path}.`);
    }
  }
  if (state.checkout !== null) {
    facts.push(
      `Checkout: held by ${state.checkout.holder} for ${state.checkout.purpose} since ${state.checkout.takenAt}; no probe-free claim is available while held.`
    );
  } else {
    const releases = events.filter((event) => eventAction(event) === "checkout.release");
    const lastRelease = releases.at(-1);
    if (lastRelease === void 0) {
      facts.push("Checkout: free; no normal release declaration is recorded, so no probe-free claim is made.");
    } else if (lastRelease.actor === "A" || lastRelease.actor === "B") {
      facts.push(`Checkout: free; ${lastRelease.actor}'s recorded normal release declares that no probe remains.`);
    } else {
      facts.push("Checkout: free after a master release; no normal-release probe claim is inferred.");
    }
  }
  return `${facts.map((fact) => `- ${fact}`).join("\n")}

Validation: ${facts.join(" ")}`;
}
function renderFixTable(state) {
  const fixes = state.rows.filter((row) => row.kind === "Proposed fix");
  if (fixes.length === 0) return "None.";
  return table2(
    [
      "Proposed fix",
      "Kind",
      "Issues",
      "State / mark",
      "Origin",
      "Shape",
      "Sites walked",
      "Rulings checked",
      "Structural flags",
      "Guardrail / coordination",
      "Test",
      "Cost",
      "Shelved fixes"
    ],
    fixes.map((fix) => {
      const shelves = shelvesForProposedFix(state, fix);
      return [
        `${fix.id} r${fix.revision}`,
        fix.proposalKind,
        joinOrNone(fix.issueRefs.map((reference) => {
          const issue = issueById(state, reference.id);
          return `${reference.id}@r${reference.revision}${issue?.revision === reference.revision ? "" : " (stale)"}`;
        })),
        `${fix.state}; ${markSummary(state, fix)}`,
        fix.fix.originClass ?? "direction",
        fix.fix.shape,
        fix.fix.sitesWalked ?? "not applicable",
        fix.fix.rulingsChecked ?? "not applicable",
        `interface=${fix.fix.interfaceChange ?? false}; ownership=${fix.fix.ownershipChange ?? false}; risk=${fix.fix.riskSurface ?? false}`,
        `guardrail: ${fix.fix.guardrail ?? "none"}; coordination: ${fix.fix.coordination ?? "none"}`,
        fix.fix.testLocation ?? "not applicable",
        fix.fix.cost,
        joinOrNone(shelves.map((shelf) => `${shelf.id} (${shelf.state}; ${shelf.artifact})`))
      ];
    })
  );
}
function renderReport(state, context3 = {}) {
  const title = state.route === "review" ? "Review report" : "Diagnosis report";
  const checkout = state.checkout === null ? "free" : `${state.checkout.holder}: ${state.checkout.purpose} since ${state.checkout.takenAt}; no expiry`;
  const lines2 = [
    `# ${title}`,
    "",
    table2(
      ["Route", "Depth", "How far", "Topology", "Checkout", "A ready", "B ready"],
      [[
        state.route,
        state.deep ? "deep" : state.route === "review" ? "quick" : "plain",
        state.policy,
        state.mode,
        checkout,
        readyForProjection(state, "A").filter((item) => item.command !== "report.record").length,
        readyForProjection(state, "B").filter((item) => item.command !== "report.record").length
      ]]
    ),
    ...state.mode === "cold" ? ["", "Cold independence: this report contains only the isolated cold pass; it does not use shared derived coverage or peer rows."] : [],
    "",
    "## Coverage",
    "",
    renderCoverage(state),
    "",
    "## Issues",
    "",
    renderIssues(state),
    "",
    "## Questions",
    "",
    renderQuestions(state),
    "",
    "## Shelved fixes",
    "",
    renderShelvedFixes(state),
    "",
    "## Check-ins",
    "",
    renderCheckIns(state),
    "",
    "## Per-agent timeline",
    "",
    renderTimeline(state, context3.events ?? []).trimEnd()
  ];
  if (state.route === "review") {
    lines2.push(
      "",
      "## Validation",
      "",
      renderValidation(state, context3.events ?? []),
      ...state.deep ? ["", renderNotes(state, context3.notes)] : [],
      "",
      "## Fix table",
      "",
      renderFixTable(state)
    );
  } else {
    lines2.push(
      "",
      renderNotes(state, context3.notes),
      "",
      "## Fix table",
      "",
      renderFixTable(state),
      "",
      "## Validation",
      "",
      renderValidation(state, context3.events ?? [])
    );
  }
  return `${lines2.join("\n")}
`;
}

// node_modules/effect/dist/unstable/sql/SqlError.js
var TypeId41 = "~effect/sql/SqlError";
var ReasonTypeId = "~effect/sql/SqlError/Reason";
var ReasonFields = {
  cause: /* @__PURE__ */ Defect(),
  message: /* @__PURE__ */ optional2(String4),
  operation: /* @__PURE__ */ optional2(String4)
};
var ConnectionError = class extends (/* @__PURE__ */ TaggedError3("effect/sql/SqlError/ConnectionError")("ConnectionError", ReasonFields)) {
  /**
   * Marks this value as a structured SQL error reason for runtime guards.
   *
   * @since 4.0.0
   */
  [ReasonTypeId] = ReasonTypeId;
  /**
   * Indicates whether retrying the failed SQL operation may succeed.
   *
   * @since 4.0.0
   */
  get isRetryable() {
    return true;
  }
};
var AuthenticationError = class extends (/* @__PURE__ */ TaggedError3("effect/sql/SqlError/AuthenticationError")("AuthenticationError", ReasonFields)) {
  /**
   * Marks this value as a structured SQL error reason for runtime guards.
   *
   * @since 4.0.0
   */
  [ReasonTypeId] = ReasonTypeId;
  /**
   * Indicates whether retrying the failed SQL operation may succeed.
   *
   * @since 4.0.0
   */
  get isRetryable() {
    return false;
  }
};
var AuthorizationError = class extends (/* @__PURE__ */ TaggedError3("effect/sql/SqlError/AuthorizationError")("AuthorizationError", ReasonFields)) {
  /**
   * Marks this value as a structured SQL error reason for runtime guards.
   *
   * @since 4.0.0
   */
  [ReasonTypeId] = ReasonTypeId;
  /**
   * Indicates whether retrying the failed SQL operation may succeed.
   *
   * @since 4.0.0
   */
  get isRetryable() {
    return false;
  }
};
var SqlSyntaxError = class extends (/* @__PURE__ */ TaggedError3("effect/sql/SqlError/SqlSyntaxError")("SqlSyntaxError", ReasonFields)) {
  /**
   * Marks this value as a structured SQL error reason for runtime guards.
   *
   * @since 4.0.0
   */
  [ReasonTypeId] = ReasonTypeId;
  /**
   * Indicates whether retrying the failed SQL operation may succeed.
   *
   * @since 4.0.0
   */
  get isRetryable() {
    return false;
  }
};
var UniqueViolationFields = {
  ...ReasonFields,
  constraint: String4
};
var UniqueViolation = class extends (/* @__PURE__ */ TaggedError3("effect/sql/SqlError/UniqueViolation")("UniqueViolation", UniqueViolationFields)) {
  /**
   * Marks this value as a structured SQL error reason for runtime guards.
   *
   * @since 4.0.0
   */
  [ReasonTypeId] = ReasonTypeId;
  /**
   * Indicates whether retrying the failed SQL operation may succeed.
   *
   * @since 4.0.0
   */
  get isRetryable() {
    return false;
  }
};
var ConstraintError = class extends (/* @__PURE__ */ TaggedError3("effect/sql/SqlError/ConstraintError")("ConstraintError", ReasonFields)) {
  /**
   * Marks this value as a structured SQL error reason for runtime guards.
   *
   * @since 4.0.0
   */
  [ReasonTypeId] = ReasonTypeId;
  /**
   * Indicates whether retrying the failed SQL operation may succeed.
   *
   * @since 4.0.0
   */
  get isRetryable() {
    return false;
  }
};
var DeadlockError = class extends (/* @__PURE__ */ TaggedError3("effect/sql/SqlError/DeadlockError")("DeadlockError", ReasonFields)) {
  /**
   * Marks this value as a structured SQL error reason for runtime guards.
   *
   * @since 4.0.0
   */
  [ReasonTypeId] = ReasonTypeId;
  /**
   * Indicates whether retrying the failed SQL operation may succeed.
   *
   * @since 4.0.0
   */
  get isRetryable() {
    return true;
  }
};
var SerializationError = class extends (/* @__PURE__ */ TaggedError3("effect/sql/SqlError/SerializationError")("SerializationError", ReasonFields)) {
  /**
   * Marks this value as a structured SQL error reason for runtime guards.
   *
   * @since 4.0.0
   */
  [ReasonTypeId] = ReasonTypeId;
  /**
   * Indicates whether retrying the failed SQL operation may succeed.
   *
   * @since 4.0.0
   */
  get isRetryable() {
    return true;
  }
};
var LockTimeoutError = class extends (/* @__PURE__ */ TaggedError3("effect/sql/SqlError/LockTimeoutError")("LockTimeoutError", ReasonFields)) {
  /**
   * Marks this value as a structured SQL error reason for runtime guards.
   *
   * @since 4.0.0
   */
  [ReasonTypeId] = ReasonTypeId;
  /**
   * Indicates whether retrying the failed SQL operation may succeed.
   *
   * @since 4.0.0
   */
  get isRetryable() {
    return true;
  }
};
var StatementTimeoutError = class extends (/* @__PURE__ */ TaggedError3("effect/sql/SqlError/StatementTimeoutError")("StatementTimeoutError", ReasonFields)) {
  /**
   * Marks this value as a structured SQL error reason for runtime guards.
   *
   * @since 4.0.0
   */
  [ReasonTypeId] = ReasonTypeId;
  /**
   * Indicates whether retrying the failed SQL operation may succeed.
   *
   * @since 4.0.0
   */
  get isRetryable() {
    return true;
  }
};
var UnknownError3 = class extends (/* @__PURE__ */ TaggedError3("effect/sql/SqlError/UnknownError")("UnknownError", ReasonFields)) {
  /**
   * Marks this value as a structured SQL error reason for runtime guards.
   *
   * @since 4.0.0
   */
  [ReasonTypeId] = ReasonTypeId;
  /**
   * Indicates whether retrying the failed SQL operation may succeed.
   *
   * @since 4.0.0
   */
  get isRetryable() {
    return false;
  }
};
var SqlErrorReason = /* @__PURE__ */ Union2([ConnectionError, AuthenticationError, AuthorizationError, SqlSyntaxError, UniqueViolation, ConstraintError, DeadlockError, SerializationError, LockTimeoutError, StatementTimeoutError, UnknownError3]);
var SqlError = class extends (/* @__PURE__ */ TaggedError3("effect/sql/SqlError")("SqlError", {
  reason: SqlErrorReason
})) {
  /**
   * Marks this value as the top-level SQL error wrapper for runtime guards.
   *
   * @since 4.0.0
   */
  [TypeId41] = TypeId41;
  /**
   * Exposes the structured SQL reason as the JavaScript error cause.
   *
   * @since 4.0.0
   */
  cause = this.reason;
  /**
   * Uses the reason message when present, otherwise falls back to the reason tag.
   *
   * @since 4.0.0
   */
  get message() {
    return this.reason.message || this.reason._tag;
  }
  /**
   * Delegates retryability to the underlying SQL error reason.
   *
   * @since 4.0.0
   */
  get isRetryable() {
    return this.reason.isRetryable;
  }
};
var sqliteCodeFromCause = (cause) => {
  if (!hasProperty(cause, "code")) {
    return void 0;
  }
  const code2 = cause.code;
  return typeof code2 === "string" || typeof code2 === "number" ? code2 : void 0;
};
var sqliteNumericCodeFromCause = (cause) => {
  const code2 = sqliteCodeFromCause(cause);
  if (typeof code2 === "number") {
    return code2;
  }
  if (!hasProperty(cause, "errno")) {
    return void 0;
  }
  const errno = cause.errno;
  return typeof errno === "number" ? errno : void 0;
};
var matchesSqliteNumericCode = (cause, expected) => {
  const code2 = sqliteCodeFromCause(cause);
  if (code2 === expected) {
    return true;
  }
  if (!hasProperty(cause, "errno")) {
    return false;
  }
  return cause.errno === expected;
};
var matchesSqliteCode = (code2, expected) => code2 === expected || code2.startsWith(expected + "_");
var UNKNOWN_CONSTRAINT = "unknown";
var SQLITE_CONSTRAINT_UNIQUE = "SQLITE_CONSTRAINT_UNIQUE";
var SQLITE_CONSTRAINT_UNIQUE_CODE = 2067;
var normalizeConstraintIdentifier = (identifier3) => {
  if (typeof identifier3 !== "string") {
    return UNKNOWN_CONSTRAINT;
  }
  const trimmed = identifier3.trim();
  return trimmed.length === 0 ? UNKNOWN_CONSTRAINT : trimmed;
};
var sqliteUniqueConstraintFromCause = (cause) => {
  if (hasProperty(cause, "constraint")) {
    return normalizeConstraintIdentifier(cause.constraint);
  }
  if (!hasProperty(cause, "message")) {
    return UNKNOWN_CONSTRAINT;
  }
  const message = cause.message;
  if (typeof message !== "string") {
    return UNKNOWN_CONSTRAINT;
  }
  const prefix = "UNIQUE constraint failed:";
  const index = message.indexOf(prefix);
  return index === -1 ? UNKNOWN_CONSTRAINT : normalizeConstraintIdentifier(message.slice(index + prefix.length));
};
var classifySqliteError = (cause, {
  message,
  operation
} = {}) => {
  const props = {
    cause,
    message,
    operation
  };
  const code2 = sqliteCodeFromCause(cause);
  const numericCode = sqliteNumericCodeFromCause(cause);
  if (code2 === SQLITE_CONSTRAINT_UNIQUE || matchesSqliteNumericCode(cause, SQLITE_CONSTRAINT_UNIQUE_CODE)) {
    return new UniqueViolation({
      ...props,
      constraint: sqliteUniqueConstraintFromCause(cause)
    });
  }
  if (typeof code2 === "string") {
    if (matchesSqliteCode(code2, "SQLITE_AUTH")) {
      return new AuthenticationError(props);
    }
    if (matchesSqliteCode(code2, "SQLITE_PERM")) {
      return new AuthorizationError(props);
    }
    if (matchesSqliteCode(code2, "SQLITE_CONSTRAINT")) {
      return new ConstraintError(props);
    }
    if (matchesSqliteCode(code2, "SQLITE_BUSY") || matchesSqliteCode(code2, "SQLITE_LOCKED")) {
      return new LockTimeoutError(props);
    }
    if (matchesSqliteCode(code2, "SQLITE_CANTOPEN")) {
      return new ConnectionError(props);
    }
  }
  if (typeof numericCode === "number") {
    const code3 = numericCode & 255;
    switch (code3) {
      case 23:
        return new AuthenticationError(props);
      case 3:
        return new AuthorizationError(props);
      case 19:
        return new ConstraintError(props);
      case 5:
      case 6:
        return new LockTimeoutError(props);
      case 14:
        return new ConnectionError(props);
      default:
        return new UnknownError3(props);
    }
  }
  return new UnknownError3(props);
};

// node_modules/@effect/sql-sqlite-node/dist/SqliteClient.js
import { backup as backupDatabase, DatabaseSync } from "node:sqlite";
var ATTR_DB_SYSTEM_NAME = "db.system.name";
var MAX_BUSY_TIMEOUT = 2147483647;
var TypeId42 = "~@effect/sql-sqlite-node/SqliteClient";
var SqliteClient = /* @__PURE__ */ Service("@effect/sql-sqlite-node/SqliteClient");
var make35 = (options) => gen2(function* () {
  const compiler = makeCompilerSqlite(options.transformQueryNames);
  const transformRows = options.transformResultNames ? defaultTransforms(options.transformResultNames).array : void 0;
  const makeConnection = gen2(function* () {
    const scope3 = yield* scope2;
    const db = new DatabaseSync(options.filename, {
      readOnly: options.readonly ?? false,
      allowExtension: true
    });
    yield* addFinalizer2(scope3, sync2(() => db.close()));
    db.enableLoadExtension(false);
    const busyTimeout = Math.min(MAX_BUSY_TIMEOUT, Math.max(0, Math.round(toMillis(options.busyTimeout ?? seconds(5)))));
    db.exec(`PRAGMA busy_timeout = ${busyTimeout}`);
    if (options.disableWAL !== true) {
      db.exec("PRAGMA journal_mode = WAL");
    }
    const prepareCache = yield* make28({
      capacity: options.prepareCacheSize ?? 200,
      timeToLive: options.prepareCacheTTL ?? minutes(10),
      lookup: (sql) => try_2({
        try: () => db.prepare(sql),
        catch: (cause) => new SqlError({
          reason: classifyError(cause, "Failed to prepare statement", "prepare")
        })
      })
    });
    const runStatement = (statement2, params, raw) => withFiber2((fiber3) => {
      const useSafeIntegers = get(fiber3.context, SafeIntegers);
      return try_2({
        try: () => {
          statement2.setReadBigInts(useSafeIntegers);
          if (statement2.columns().length > 0) {
            return statement2.all(...params);
          }
          const result3 = statement2.run(...params);
          return raw ? {
            changes: result3.changes,
            lastInsertRowid: result3.lastInsertRowid
          } : [];
        },
        catch: (cause) => new SqlError({
          reason: classifyError(cause, "Failed to execute statement", "execute")
        })
      });
    });
    const runStatementValues = (statement2, params) => withFiber2((fiber3) => {
      const useSafeIntegers = get(fiber3.context, SafeIntegers);
      return try_2({
        try: () => {
          statement2.setReadBigInts(useSafeIntegers);
          if (statement2.columns().length > 0) {
            return statement2.all(...params);
          }
          statement2.run(...params);
          return [];
        },
        catch: (cause) => new SqlError({
          reason: classifyError(cause, "Failed to execute statement", "execute")
        })
      });
    });
    const runStatementValuesUnprepared = (statement2, params) => withFiber2((fiber3) => {
      const useSafeIntegers = get(fiber3.context, SafeIntegers);
      return try_2({
        try: () => {
          statement2.setReadBigInts(useSafeIntegers);
          statement2.setReturnArrays(true);
          if (statement2.columns().length > 0) {
            return statement2.all(...params);
          }
          statement2.run(...params);
          return [];
        },
        catch: (cause) => new SqlError({
          reason: classifyError(cause, "Failed to execute statement", "execute")
        })
      });
    });
    const run6 = (sql, params, raw = false) => flatMap3(get5(prepareCache, sql), (s) => runStatement(s, params, raw));
    const runValues = (sql, params) => acquireUseRelease2(get5(prepareCache, sql), (statement2) => {
      statement2.setReturnArrays(true);
      return runStatementValues(statement2, params);
    }, (statement2) => sync2(() => statement2.setReturnArrays(false)));
    const runValuesUnprepared = (sql, params) => runStatementValuesUnprepared(db.prepare(sql), params);
    return identity({
      execute(sql, params, transformRows2) {
        return transformRows2 ? map6(run6(sql, params), transformRows2) : run6(sql, params);
      },
      executeRaw(sql, params) {
        return run6(sql, params, true);
      },
      executeValues(sql, params) {
        return runValues(sql, params);
      },
      executeValuesUnprepared(sql, params) {
        return runValuesUnprepared(sql, params);
      },
      executeUnprepared(sql, params, transformRows2) {
        const effect2 = runStatement(db.prepare(sql), params ?? [], false);
        return transformRows2 ? map6(effect2, transformRows2) : effect2;
      },
      executeStream(_sql, _params) {
        return die6("executeStream not implemented");
      },
      backup(destination) {
        return suspend2(() => {
          let totalPages = 0;
          return tryPromise2({
            try: () => backupDatabase(db, destination, {
              progress: (progress) => {
                totalPages = progress.totalPages;
              }
            }).then((pages) => ({
              totalPages: totalPages || pages,
              remainingPages: 0
            })),
            catch: (cause) => new SqlError({
              reason: classifyError(cause, "Failed to backup database", "backup")
            })
          });
        });
      },
      loadExtension(path5) {
        return acquireUseRelease2(sync2(() => db.enableLoadExtension(true)), () => try_2({
          try: () => db.loadExtension(path5),
          catch: (cause) => new SqlError({
            reason: classifyError(cause, "Failed to load extension", "loadExtension")
          })
        }), () => sync2(() => db.enableLoadExtension(false)));
      }
    });
  });
  const semaphore = yield* make9(1);
  const connection = yield* makeConnection;
  const acquirer = semaphore.withPermits(1)(succeed6(connection));
  const transactionAcquirer = uninterruptibleMask2((restore) => {
    const fiber3 = getCurrent();
    const scope3 = getUnsafe(fiber3.context, Scope);
    return as2(tap2(restore(semaphore.take(1)), () => addFinalizer2(scope3, semaphore.release(1))), connection);
  });
  return Object.assign(yield* make33({
    acquirer,
    compiler,
    transactionAcquirer,
    beginTransaction: "BEGIN IMMEDIATE",
    spanAttributes: [...options.spanAttributes ? Object.entries(options.spanAttributes) : [], [ATTR_DB_SYSTEM_NAME, "sqlite"]],
    transformRows
  }), {
    [TypeId42]: TypeId42,
    config: options,
    backup: (destination) => flatMap3(acquirer, (_) => _.backup(destination)),
    loadExtension: (path5) => flatMap3(acquirer, (_) => _.loadExtension(path5))
  });
});
var layer14 = (config) => effectContext(map6(make35(config), (client) => make2(SqliteClient, client).pipe(add(SqlClient, client)))).pipe(provide2(layer13));
var classifyError = (cause, message, operation) => classifySqliteError(sqliteCauseWithErrno(cause), {
  message,
  operation
});
var sqliteCauseWithErrno = (cause) => {
  if (typeof cause !== "object" || cause === null || !("errcode" in cause) || "errno" in cause) {
    return cause;
  }
  const errcode = cause.errcode;
  if (typeof errcode !== "number") {
    return cause;
  }
  return Object.assign(cause, {
    errno: errcode
  });
};

// src/store.ts
import { existsSync, linkSync, mkdirSync, mkdtempSync, rmdirSync, unlinkSync } from "node:fs";
import { basename, dirname as dirname2, join as join3 } from "node:path";

// src/schema.ts
var STORE_APPLICATION_ID = "coding-ledger";
var STORE_SCHEMA_VERSION = 2;
var CREATE_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS ledger_meta (
  singleton          INTEGER PRIMARY KEY CHECK (singleton = 1),
  application_id     TEXT NOT NULL,
  store_schema       INTEGER NOT NULL,
  state_schema       INTEGER NOT NULL,
  storage_revision   INTEGER NOT NULL CHECK (storage_revision >= 0),
  state_json         TEXT NOT NULL,
  initialized_at     TEXT NOT NULL,
  updated_at         TEXT NOT NULL,
  sealed_at          TEXT,
  sealed_storage_revision INTEGER,
  CONSTRAINT seal_is_complete CHECK (
    (sealed_at IS NULL AND sealed_storage_revision IS NULL)
    OR (sealed_at IS NOT NULL AND sealed_storage_revision IS NOT NULL)
  )
)`,
  `CREATE TABLE IF NOT EXISTS ledger_events (
  sequence            INTEGER PRIMARY KEY AUTOINCREMENT,
  storage_revision    INTEGER NOT NULL CHECK (storage_revision >= 0),
  occurred_at         TEXT NOT NULL,
  actor               TEXT NOT NULL,
  action              TEXT NOT NULL,
  row_kind            TEXT,
  row_id              TEXT,
  from_state          TEXT,
  to_state            TEXT,
  detail_json         TEXT NOT NULL
)`,
  `CREATE INDEX IF NOT EXISTS ledger_events_actor_sequence
  ON ledger_events(actor, sequence)`,
  `CREATE TRIGGER IF NOT EXISTS ledger_events_are_immutable_on_update
BEFORE UPDATE ON ledger_events
BEGIN
  SELECT RAISE(ABORT, 'ledger events are immutable');
END`,
  `CREATE TRIGGER IF NOT EXISTS ledger_events_are_immutable_on_delete
BEFORE DELETE ON ledger_events
BEGIN
  SELECT RAISE(ABORT, 'ledger events are immutable');
END`
];

// src/store.ts
var StoreError = class extends Error {
  constructor(kind, message, cause) {
    super(message, cause === void 0 ? void 0 : { cause });
    this.kind = kind;
    this.cause = cause;
    this.name = "StoreError";
  }
  kind;
  cause;
  _tag = "StoreError";
};
var domainEventToTimelineEvent = (event) => ({
  occurredAt: event.at,
  actor: event.actor,
  action: event.command,
  ...event.type === "row.changed" ? { rowKind: event.rowKind, rowId: event.rowId } : event.type === "issue-take.changed" ? { rowKind: "Issue", rowId: event.issueId } : {},
  fromState: event.from,
  toState: event.to,
  detail: event
});
var makeProtocolEngine = (decode = decodeProtocolState) => ({
  schemaVersion: PROTOCOL_SCHEMA_VERSION,
  decode,
  reduce: (state, command) => {
    const result3 = transition(state, command);
    if (!result3.ok) {
      throw new StoreError(
        "ProtocolRejected",
        `${result3.error.command} refused (${result3.error.code}): ${result3.error.message}`
      );
    }
    return {
      state: result3.state,
      events: result3.events.map(domainEventToTimelineEvent)
    };
  }
});
var protocolEngine = makeProtocolEngine();
var importedEvent = /* @__PURE__ */ Symbol("coding-ledger/imported-event");
var importedEventsFrom = (bundle, sourceSeat) => bundle.events.map((event) => ({
  [importedEvent]: true,
  occurredAt: event.occurredAt,
  actor: event.actor,
  action: event.action,
  rowKind: event.rowKind ?? null,
  rowId: event.rowId ?? null,
  fromState: event.fromState ?? null,
  toState: event.toState ?? null,
  detail: {
    importedFrom: {
      seat: sourceSeat,
      sequence: event.sequence,
      storageRevision: event.storageRevision,
      bundleStorageRevision: bundle.storageRevision
    },
    event: event.detail
  }
}));
var databaseLayer = (path5, disableWAL = false) => layer14({
  filename: path5,
  busyTimeout: "5 seconds",
  disableWAL
});
var withDatabase = (path5, effect2, options = {}) => effect2.pipe(
  provide4(databaseLayer(path5, options.disableWAL ?? false)),
  mapError2(
    (cause) => cause instanceof StoreError ? cause : new StoreError("PersistenceFailure", `SQLite operation failed for ${path5}`, cause)
  ),
  catchDefect2(
    (cause) => fail6(new StoreError("PersistenceFailure", `SQLite defect for ${path5}`, cause))
  )
);
var requireExistingDatabase = (path5) => existsSync(path5) ? void_3 : fail6(new StoreError("NotInitialized", `ledger database does not exist: ${path5}`));
var decodeJson = (path5, stateJson, codec2) => try_2({
  try: () => codec2.decode(JSON.parse(stateJson)),
  catch: (cause) => new StoreError(
    "InvalidState",
    `stored protocol state in ${path5} does not match schema ${codec2.schemaVersion}`,
    cause
  )
});
var encodeJson = (value3, label) => try_2({
  try: () => {
    const encoded = JSON.stringify(value3, (_key, candidate) => {
      if (candidate === void 0 || typeof candidate === "function" || typeof candidate === "symbol" || typeof candidate === "bigint" || typeof candidate === "number" && !Number.isFinite(candidate)) {
        throw new TypeError(`${label} contains a value JSON cannot preserve`);
      }
      return candidate;
    });
    if (typeof encoded !== "string") {
      throw new TypeError(`${label} did not encode to a JSON value`);
    }
    return { json: encoded, value: JSON.parse(encoded) };
  },
  catch: (cause) => new StoreError("InvalidState", `${label} is not lossless JSON`, cause)
});
var encodeState = (state, codec2) => gen2(function* () {
  const validated = yield* try_2({
    try: () => codec2.decode(state),
    catch: (cause) => new StoreError("InvalidState", "protocol produced invalid state", cause)
  });
  const encoded = yield* encodeJson(validated, "protocol state");
  const canonical = yield* try_2({
    try: () => codec2.decode(encoded.value),
    catch: (cause) => new StoreError("InvalidState", "protocol state does not survive a JSON round trip", cause)
  });
  return { json: encoded.json, value: canonical };
});
var checkMeta = (path5, row, codec2) => {
  if (row === void 0) {
    return fail6(new StoreError("NotInitialized", `ledger metadata is missing from ${path5}`));
  }
  if (row.application_id !== STORE_APPLICATION_ID) {
    return fail6(new StoreError(
      "IncompatibleStore",
      `refusing ${path5}: application is ${row.application_id}, expected ${STORE_APPLICATION_ID}`
    ));
  }
  if (row.store_schema !== STORE_SCHEMA_VERSION) {
    return fail6(new StoreError(
      "IncompatibleStore",
      `refusing ${path5}: store schema is ${row.store_schema}, expected ${STORE_SCHEMA_VERSION}`
    ));
  }
  if (row.state_schema !== codec2.schemaVersion) {
    return fail6(new StoreError(
      "IncompatibleState",
      `refusing ${path5}: protocol schema is ${row.state_schema}, expected ${codec2.schemaVersion}`
    ));
  }
  if (row.sealed_at === null !== (row.sealed_storage_revision === null) || row.sealed_storage_revision !== null && row.sealed_storage_revision !== row.storage_revision) {
    return fail6(new StoreError("InvalidState", `ledger seal metadata is inconsistent in ${path5}`));
  }
  return succeed6(row);
};
var requireUnsealed = (path5, row) => row.sealed_at === null ? void_3 : fail6(new StoreError(
  "Sealed",
  `ledger is sealed at storage revision ${row.sealed_storage_revision} since ${row.sealed_at}: ${path5}`
));
var selectMeta = (sql) => map6(
  sql`
      SELECT application_id, store_schema, state_schema, storage_revision,
             state_json, initialized_at, updated_at, sealed_at,
             sealed_storage_revision
      FROM ledger_meta
      WHERE singleton = 1
    `,
  (rows) => rows[0]
);
var insertEvents = (sql, storageRevision, events) => gen2(function* () {
  const persisted = [];
  for (const event of events) {
    if (!event.actor.trim() || !event.action.trim() || !Number.isFinite(Date.parse(event.occurredAt))) {
      return yield* fail6(
        new StoreError("InvalidState", "timeline event needs a timestamp, actor, and action")
      );
    }
    const detail = yield* encodeJson(event.detail ?? {}, "timeline event detail");
    const result3 = yield* sql.unsafe(
      `INSERT INTO ledger_events (
           storage_revision, occurred_at, actor, action, row_kind, row_id,
           from_state, to_state, detail_json
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        storageRevision,
        event.occurredAt,
        event.actor,
        event.action,
        event.rowKind ?? null,
        event.rowId ?? null,
        event.fromState ?? null,
        event.toState ?? null,
        detail.json
      ]
    ).raw;
    const sequence = Number(result3.lastInsertRowid);
    persisted.push({ ...event, detail: detail.value, sequence, storageRevision });
  }
  return persisted;
});
var parseEventRow = (row) => try_2({
  try: () => ({
    sequence: Number(row.sequence),
    storageRevision: Number(row.storage_revision),
    occurredAt: row.occurred_at,
    actor: row.actor,
    action: row.action,
    rowKind: row.row_kind,
    rowId: row.row_id,
    fromState: row.from_state,
    toState: row.to_state,
    detail: JSON.parse(row.detail_json)
  }),
  catch: (cause) => new StoreError("InvalidState", `timeline event ${row.sequence} contains invalid JSON`, cause)
});
var initializeDatabase = (path5, state, codec2, options) => {
  if (existsSync(path5)) {
    return fail6(new StoreError("AlreadyInitialized", `refusing to overwrite existing ledger database: ${path5}`));
  }
  if (!Number.isFinite(Date.parse(options.occurredAt))) {
    return fail6(new StoreError("InvalidState", `invalid initialization timestamp: ${options.occurredAt}`));
  }
  return gen2(function* () {
    yield* try_2({
      try: () => mkdirSync(dirname2(path5), { recursive: true }),
      catch: (cause) => new StoreError("PersistenceFailure", `cannot create ${dirname2(path5)}`, cause)
    });
    const validated = yield* try_2({
      try: () => codec2.decode(state),
      catch: (cause) => new StoreError("InvalidState", `initial state does not match schema ${codec2.schemaVersion}`, cause)
    });
    const encoded = yield* encodeState(validated, codec2);
    return yield* acquireUseRelease2(
      try_2({
        try: () => {
          const directory4 = mkdtempSync(join3(dirname2(path5), `.${basename(path5)}.init-`));
          return { directory: directory4, database: join3(directory4, "ledger.db") };
        },
        catch: (cause) => new StoreError("PersistenceFailure", `cannot stage initialization for ${path5}`, cause)
      }),
      ({ database }) => gen2(function* () {
        const snapshot = yield* withDatabase(
          database,
          gen2(function* () {
            const sql = yield* SqlClient;
            return yield* sql.withTransaction(
              gen2(function* () {
                for (const statement2 of CREATE_SCHEMA_STATEMENTS) {
                  yield* sql.unsafe(statement2);
                }
                yield* sql.unsafe(
                  `INSERT INTO ledger_meta (
                     singleton, application_id, store_schema, state_schema,
                       storage_revision, state_json, initialized_at, updated_at,
                       sealed_at, sealed_storage_revision
                     ) VALUES (1, ?, ?, ?, 0, ?, ?, ?, NULL, NULL)`,
                  [
                    STORE_APPLICATION_ID,
                    STORE_SCHEMA_VERSION,
                    codec2.schemaVersion,
                    encoded.json,
                    options.occurredAt,
                    options.occurredAt
                  ]
                );
                yield* insertEvents(sql, 0, options.events ?? []);
                return {
                  state: encoded.value,
                  storageRevision: 0,
                  initializedAt: options.occurredAt,
                  updatedAt: options.occurredAt
                };
              })
            );
          }),
          { disableWAL: true }
        );
        yield* try_2({
          try: () => linkSync(database, path5),
          catch: (cause) => {
            const code2 = typeof cause === "object" && cause !== null && "code" in cause ? String(cause.code) : "";
            return code2 === "EEXIST" ? new StoreError("AlreadyInitialized", `refusing to overwrite existing ledger database: ${path5}`, cause) : new StoreError("PersistenceFailure", `cannot publish initialized ledger to ${path5}`, cause);
          }
        });
        return snapshot;
      }),
      ({ database, directory: directory4 }) => sync2(() => {
        for (const candidate of [database, `${database}-journal`, `${database}-wal`, `${database}-shm`]) {
          try {
            if (existsSync(candidate)) unlinkSync(candidate);
          } catch {
          }
        }
        try {
          rmdirSync(directory4);
        } catch {
        }
      })
    );
  });
};
var readSnapshot = (path5, codec2) => gen2(function* () {
  yield* requireExistingDatabase(path5);
  return yield* withDatabase(
    path5,
    gen2(function* () {
      const sql = yield* SqlClient;
      const row = yield* checkMeta(path5, yield* selectMeta(sql), codec2);
      const state = yield* decodeJson(path5, row.state_json, codec2);
      return {
        state,
        storageRevision: Number(row.storage_revision),
        initializedAt: row.initialized_at,
        updatedAt: row.updated_at
      };
    })
  );
});
var mutateDatabaseBuilt = (path5, engine, build, context3, options = {}) => gen2(function* () {
  yield* requireExistingDatabase(path5);
  return yield* withDatabase(
    path5,
    gen2(function* () {
      const sql = yield* SqlClient;
      return yield* sql.withTransaction(
        gen2(function* () {
          const row = yield* checkMeta(path5, yield* selectMeta(sql), engine);
          yield* requireUnsealed(path5, row);
          if (options.expectedStorageRevision !== void 0 && Number(row.storage_revision) !== options.expectedStorageRevision) {
            return yield* fail6(new StoreError(
              "RevisionConflict",
              `ledger changed after storage revision ${options.expectedStorageRevision}; retry from a fresh snapshot`
            ));
          }
          const previousState = yield* decodeJson(path5, row.state_json, engine);
          const commands = yield* try_2({
            try: () => {
              const built = build(previousState);
              const batch = Array.isArray(built) ? built : [built];
              if (batch.length === 0) {
                throw new StoreError("ProtocolRejected", "command batch must not be empty");
              }
              return batch;
            },
            catch: (cause) => cause instanceof StoreError ? cause : new StoreError(
              "ProtocolRejected",
              `command construction failed: ${cause instanceof Error ? cause.message : String(cause)}`,
              cause
            )
          });
          const mutation = yield* try_2({
            try: () => {
              let state = previousState;
              const events2 = [];
              for (const item of commands) {
                const result3 = engine.reduce(state, item, context3);
                state = result3.state;
                events2.push(...result3.events ?? []);
              }
              return { state, events: events2 };
            },
            catch: (cause) => cause instanceof StoreError ? cause : new StoreError("InvalidState", "protocol command was refused", cause)
          });
          const encoded = yield* encodeState(mutation.state, engine);
          const storageRevision = Number(row.storage_revision) + 1;
          const updatedAt = [
            row.updated_at,
            ...(mutation.events ?? []).map((event) => event.occurredAt),
            ...(options.additionalEvents ?? []).map((event) => event.occurredAt)
          ].reduce(
            (latest, candidate) => Date.parse(candidate) > Date.parse(latest) ? candidate : latest
          );
          const update2 = yield* sql.unsafe(
            `UPDATE ledger_meta
               SET storage_revision = ?, state_json = ?, updated_at = ?
               WHERE singleton = 1 AND storage_revision = ?`,
            [storageRevision, encoded.json, updatedAt, row.storage_revision]
          ).raw;
          if (Number(update2.changes) !== 1) {
            return yield* fail6(new StoreError(
              "RevisionConflict",
              `ledger changed while applying storage revision ${row.storage_revision}`
            ));
          }
          const events = yield* insertEvents(sql, storageRevision, [
            ...options.additionalEvents ?? [],
            ...mutation.events ?? []
          ]);
          return {
            state: encoded.value,
            previousState,
            storageRevision,
            initializedAt: row.initialized_at,
            updatedAt,
            events
          };
        })
      );
    })
  );
});
var mutateDatabase = (path5, engine, command, context3, options = {}) => mutateDatabaseBuilt(path5, engine, () => command, context3, options);
var mutateDatabaseFromState = (path5, engine, build, context3, options = {}) => mutateDatabaseBuilt(path5, engine, build, context3, options);
var readLedgerView = (path5, codec2) => gen2(function* () {
  yield* requireExistingDatabase(path5);
  return yield* withDatabase(
    path5,
    gen2(function* () {
      const sql = yield* SqlClient;
      return yield* sql.withTransaction(
        gen2(function* () {
          const row = yield* checkMeta(path5, yield* selectMeta(sql), codec2);
          const state = yield* decodeJson(path5, row.state_json, codec2);
          const eventRows = yield* sql`
              SELECT sequence, storage_revision, occurred_at, actor, action,
                     row_kind, row_id, from_state, to_state, detail_json
              FROM ledger_events ORDER BY sequence
            `;
          const events = yield* forEach2(eventRows, parseEventRow);
          return {
            state,
            storageRevision: Number(row.storage_revision),
            initializedAt: row.initialized_at,
            updatedAt: row.updated_at,
            events
          };
        })
      );
    })
  );
});
var sealImportBundle = (path5, codec2, occurredAt, options = {}) => {
  if (!Number.isFinite(Date.parse(occurredAt))) {
    return fail6(new StoreError("InvalidState", `invalid seal timestamp: ${occurredAt}`));
  }
  return gen2(function* () {
    yield* requireExistingDatabase(path5);
    return yield* withDatabase(
      path5,
      gen2(function* () {
        const sql = yield* SqlClient;
        return yield* sql.withTransaction(
          gen2(function* () {
            const row = yield* checkMeta(path5, yield* selectMeta(sql), codec2);
            const state = yield* decodeJson(path5, row.state_json, codec2);
            if (row.sealed_at === null && options.validate !== void 0) {
              yield* try_2({
                try: () => options.validate(state),
                catch: (cause) => new StoreError(
                  "ProtocolRejected",
                  `cold import is not ready: ${cause instanceof Error ? cause.message : String(cause)}`,
                  cause
                )
              });
            }
            const sealedAt = row.sealed_at ?? occurredAt;
            const updatedAt = Date.parse(sealedAt) > Date.parse(row.updated_at) ? sealedAt : row.updated_at;
            if (row.sealed_at === null) {
              const result3 = yield* sql.unsafe(
                `UPDATE ledger_meta
                 SET sealed_at = ?, sealed_storage_revision = storage_revision,
                     updated_at = ?
                 WHERE singleton = 1 AND storage_revision = ? AND sealed_at IS NULL`,
                [sealedAt, updatedAt, row.storage_revision]
              ).raw;
              if (Number(result3.changes) !== 1) {
                return yield* fail6(new StoreError(
                  "RevisionConflict",
                  `ledger changed while sealing storage revision ${row.storage_revision}`
                ));
              }
            }
            const eventRows = yield* sql`
              SELECT sequence, storage_revision, occurred_at, actor, action,
                     row_kind, row_id, from_state, to_state, detail_json
              FROM ledger_events ORDER BY sequence
            `;
            const events = yield* forEach2(eventRows, parseEventRow);
            return {
              state,
              storageRevision: Number(row.storage_revision),
              initializedAt: row.initialized_at,
              updatedAt,
              sealedAt,
              events
            };
          })
        );
      })
    );
  });
};

// src/runtime.ts
import { spawnSync } from "node:child_process";
import { createHash as createHash2 } from "node:crypto";
import {
  chmodSync,
  closeSync,
  copyFileSync,
  existsSync as existsSync2,
  fsyncSync,
  mkdirSync as mkdirSync2,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { basename as basename2, dirname as dirname3, extname, isAbsolute, join as join4, relative, resolve as resolve4, sep } from "node:path";
import { DatabaseSync as DatabaseSync2 } from "node:sqlite";
import { fileURLToPath as fileURLToPath2 } from "node:url";
var bundlePath = fileURLToPath2(import.meta.url);
var scriptsDirectory = dirname3(bundlePath);
var PIN_MANIFEST_NAME = "ledger.manifest.json";
function runDirectory() {
  return resolve4(process.env.LEDGER_DIR ?? ".");
}
function sharedDatabasePath() {
  return join4(runDirectory(), "ledger.db");
}
function coldDatabasePath(actor) {
  return join4(runDirectory(), `cold-${actor}.db`);
}
function pinManifestPath(directory4 = runDirectory()) {
  return join4(directory4, "bin", PIN_MANIFEST_NAME);
}
function samePath(left, right) {
  try {
    return realpathSync(left) === realpathSync(right);
  } catch {
    return resolve4(left) === resolve4(right);
  }
}
function conciseFailure(message) {
  process.stderr.write(`ledger: ${message}
`);
  process.exit(1);
}
function ledgerIdentity(path5) {
  let database;
  try {
    database = new DatabaseSync2(path5, { readOnly: true });
    const table3 = database.prepare(
      "SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = 'ledger_meta'"
    ).get();
    if (table3?.present === 1) {
      const row = database.prepare(
        "SELECT application_id, store_schema, state_schema FROM ledger_meta WHERE singleton = 1"
      ).get();
      if (row?.application_id === STORE_APPLICATION_ID && Number.isSafeInteger(row.store_schema) && Number(row.store_schema) >= 1 && Number.isSafeInteger(row.state_schema) && Number(row.state_schema) >= 1) {
        return {
          storeSchema: Number(row.store_schema),
          stateSchema: Number(row.state_schema)
        };
      }
      return null;
    }
    return null;
  } catch {
    return null;
  } finally {
    try {
      database?.close();
    } catch {
    }
  }
}
function decodePinManifest(path5) {
  try {
    const value3 = JSON.parse(readFileSync(path5, "utf8"));
    if (value3.format !== 1 || value3.applicationId !== STORE_APPLICATION_ID || !Number.isSafeInteger(value3.storeSchema) || Number(value3.storeSchema) < 1 || !Number.isSafeInteger(value3.protocolSchema) || value3.bundle !== "ledger.mjs" || !/^[0-9a-f]{64}$/.test(value3.sha256 ?? "") || value3.launcher !== "ledger.ts" || !/^[0-9a-f]{64}$/.test(value3.launcherSha256 ?? "")) {
      return null;
    }
    return value3;
  } catch {
    return null;
  }
}
function delegateToPinned() {
  const directory4 = runDirectory();
  const database = join4(directory4, "ledger.db");
  if (!existsSync2(database)) return;
  const identity2 = ledgerIdentity(database);
  if (identity2 === null) return;
  const pinnedBundle = join4(directory4, "bin", "ledger.mjs");
  const manifestPath = pinManifestPath(directory4);
  const manifest = decodePinManifest(manifestPath);
  if (manifest === null) conciseFailure(`live ledger pin is missing or invalid: ${manifestPath}`);
  if (manifest.protocolSchema !== identity2.stateSchema) {
    conciseFailure(
      `live ledger pin speaks protocol schema ${manifest.protocolSchema}, database needs ${identity2.stateSchema}`
    );
  }
  if (manifest.storeSchema !== identity2.storeSchema) {
    conciseFailure(
      `live ledger pin uses store schema ${manifest.storeSchema}, database needs ${identity2.storeSchema}`
    );
  }
  const pinnedLauncher = join4(directory4, "bin", manifest.launcher);
  if (!existsSync2(pinnedLauncher) || !statSync(pinnedLauncher).isFile()) {
    conciseFailure(`live ledger launcher is missing: ${pinnedLauncher}`);
  }
  const actualLauncherHash = fileHash(pinnedLauncher);
  if (actualLauncherHash !== manifest.launcherSha256) {
    conciseFailure(
      `live ledger launcher hash mismatch: ${pinnedLauncher} is ${actualLauncherHash}, expected ${manifest.launcherSha256}`
    );
  }
  if (!existsSync2(pinnedBundle) || !statSync(pinnedBundle).isFile()) {
    conciseFailure(`live ledger pin is missing: ${pinnedBundle}`);
  }
  const actualHash = fileHash(pinnedBundle);
  if (actualHash !== manifest.sha256) {
    conciseFailure(
      `live ledger pin hash mismatch: ${pinnedBundle} is ${actualHash}, expected ${manifest.sha256}`
    );
  }
  if (samePath(bundlePath, pinnedBundle)) return;
  const child = spawnSync(process.execPath, ["--no-warnings", pinnedBundle, ...process.argv.slice(2)], {
    env: process.env,
    stdio: "inherit"
  });
  process.exit(child.status ?? 1);
}
function writeManifestAtomically(path5, manifest) {
  const temporary = join4(dirname3(path5), `.${basename2(path5)}.${process.pid}.${Date.now()}.tmp`);
  try {
    writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}
`, { flag: "wx" });
    renameSync(temporary, path5);
  } finally {
    try {
      rmSync(temporary);
    } catch {
    }
  }
}
function pinCurrentHelper(directory4) {
  if (!existsSync2(bundlePath)) throw new Error(`built helper is missing at ${bundlePath}; run npm run build`);
  const bin = join4(directory4, "bin");
  mkdirSync2(bin, { recursive: true });
  const pinnedBundle = join4(bin, "ledger.mjs");
  if (!samePath(bundlePath, pinnedBundle)) copyFileSync(bundlePath, pinnedBundle);
  chmodSync(pinnedBundle, 493);
  const launcher = join4(bin, "ledger.ts");
  writeFileSync(launcher, "#!/usr/bin/env -S node --no-warnings\nimport './ledger.mjs'\n");
  chmodSync(launcher, 493);
  const hash2 = fileHash(pinnedBundle);
  const manifestPath = pinManifestPath(directory4);
  writeManifestAtomically(manifestPath, {
    format: 1,
    applicationId: STORE_APPLICATION_ID,
    storeSchema: STORE_SCHEMA_VERSION,
    protocolSchema: PROTOCOL_SCHEMA_VERSION,
    bundle: "ledger.mjs",
    sha256: hash2,
    launcher: "ledger.ts",
    launcherSha256: fileHash(launcher)
  });
  return { bundle: pinnedBundle, hash: hash2, manifest: manifestPath };
}
function fileHash(path5) {
  return createHash2("sha256").update(readFileSync(path5)).digest("hex");
}
function isWithin(parent, candidate) {
  const inside = relative(parent, candidate);
  return inside === "" || inside !== ".." && !inside.startsWith(`..${sep}`) && !isAbsolute(inside);
}
function assertSafeReportDestination(destination, directory4 = runDirectory()) {
  const candidate = resolve4(destination);
  const root2 = realpathSync(resolve4(directory4));
  const parent = realpathSync(dirname3(candidate));
  const effectiveCandidate = join4(parent, basename2(candidate));
  if (!isWithin(root2, effectiveCandidate)) {
    throw new Error(`report destination must stay inside ${root2}: ${candidate}`);
  }
  const protectedFiles = [
    join4(root2, "ledger.db"),
    join4(root2, "cold-A.db"),
    join4(root2, "cold-B.db"),
    join4(root2, "A-notes.md"),
    join4(root2, "B-notes.md")
  ];
  const bin = join4(root2, "bin");
  const protectedDirectory = existsSync2(bin) ? realpathSync(bin) : bin;
  if (protectedFiles.some((path5) => samePath(effectiveCandidate, path5)) || isWithin(protectedDirectory, effectiveCandidate)) {
    throw new Error(`report destination would overwrite ledger state: ${candidate}`);
  }
  if (extname(candidate).toLowerCase() !== ".md") throw new Error(`report destination must end in .md: ${candidate}`);
  return effectiveCandidate;
}
function writeReportAtomically(destination, content, directory4 = runDirectory()) {
  const target = assertSafeReportDestination(destination, directory4);
  const temporary = join4(dirname3(target), `.${basename2(target)}.${process.pid}.${Date.now()}.tmp`);
  let descriptor;
  try {
    descriptor = openSync(temporary, "wx", 384);
    writeFileSync(descriptor, content);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = void 0;
    renameSync(temporary, target);
    return target;
  } finally {
    if (descriptor !== void 0) {
      try {
        closeSync(descriptor);
      } catch {
      }
    }
    try {
      rmSync(temporary);
    } catch {
    }
  }
}
function actorFromEnvironment() {
  const value3 = process.env.LEDGER_ME ?? "";
  if (value3 === "A" || value3 === "B" || value3 === "master") return value3;
  throw new Error(`LEDGER_ME must be A, B, or master (got '${value3 || "unset"}')`);
}
function notificationTarget(notification, names) {
  return names[notification.recipient] || notification.recipient;
}
function deliverNotification(notification, names) {
  const target = notificationTarget(notification, names);
  const configured = (process.env.LEDGER_NOTIFY ?? "herdr agent prompt").trim();
  if (!configured || configured === "false" || configured === "true") return { ok: true };
  const [command, ...prefix] = configured.split(/\s+/);
  if (!command) return { ok: true };
  const child = spawnSync(command, [...prefix, target, notification.message], {
    encoding: "utf8",
    env: process.env,
    timeout: 1e4
  });
  if (!child.error && child.status === 0) return { ok: true };
  const detail = child.error?.message ?? child.stderr?.trim() ?? `exit ${child.status ?? "unknown"}`;
  return {
    ok: false,
    fallback: `notification failed (${detail}); send to ${target}: ${notification.message}`
  };
}

// src/cli.ts
delegateToPinned();
var VERSION = "2.0.0";
var codec = protocolEngine;
function now() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function asError(value3) {
  if (CliError_exports.isCliError(value3) && value3._tag === "UserError") return value3;
  const cause = value3 instanceof Error ? value3 : new Error(String(value3));
  return new CliError_exports.UserError({ cause, userMessage: cause.message });
}
function trySync(work) {
  return Effect_exports.try({ try: work, catch: asError });
}
function reviewer(actor, command) {
  if (actor === "A" || actor === "B") return actor;
  throw new InputError(`LEDGER_ME must be A or B for '${command}'`);
}
function master(actor, command) {
  if (actor === "master") return actor;
  throw new InputError(`LEDGER_ME must be master for '${command}'`);
}
function rowId(value3) {
  if (/^(?:C|I|Q|P|S)-(?:A|B)-\d+$/.test(value3) || /^K-M-\d+$/.test(value3)) return value3;
  throw new InputError(`invalid row id '${value3}'`);
}
function typedId(value3, prefix) {
  const id = rowId(value3);
  if (!id.startsWith(`${prefix}-`)) throw new InputError(`${value3} is not a ${prefix} row id`);
  return id;
}
function nextId(state, prefix, actor) {
  const owner = prefix === "K" ? "M" : actor;
  if (owner === "master") throw new InputError(`${prefix} rows cannot be authored by master`);
  const pattern = new RegExp(`^${prefix}-${owner}-(\\d+)$`);
  const current = state.rows.reduce((maximum, row) => {
    const found = pattern.exec(row.id);
    return found ? Math.max(maximum, Number(found[1])) : maximum;
  }, 0);
  return `${prefix}-${owner}-${current + 1}`;
}
function findRow(state, id, kind) {
  const row = state.rows.find((candidate) => candidate.id === id);
  if (!row) throw new InputError(`row ${id} does not exist`);
  if (row.kind !== kind) throw new InputError(`${id} is ${row.kind}, not ${kind}`);
  return row;
}
function runLogPath(value3, field) {
  const directory4 = runDirectory();
  const absolute = isAbsolute2(value3) ? resolve5(value3) : resolve5(directory4, value3);
  const inside = relative2(directory4, absolute);
  if (inside.startsWith("..") || isAbsolute2(inside)) {
    throw new InputError(`${field} must name a log inside ${directory4}`);
  }
  if (!existsSync3(absolute) || !statSync2(absolute).isFile()) {
    throw new InputError(`${field} log does not exist: ${value3}`);
  }
  const realDirectory = realpathSync2(directory4);
  const realLog = realpathSync2(absolute);
  const realInside = relative2(realDirectory, realLog);
  if (realInside.startsWith("..") || isAbsolute2(realInside)) {
    throw new InputError(`${field} must not escape ${directory4} through a symlink`);
  }
  return inside || value3;
}
function parseNames(raw, requireAll = false) {
  const names = { A: "A", B: "B", master: "master" };
  const seen = /* @__PURE__ */ new Set();
  const assignments = raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
  for (const assignment of assignments) {
    const separator = assignment.indexOf("=");
    if (separator < 1) throw new InputError(`--names entries are A=name, B=name, or master=name (got '${assignment}')`);
    const key = assignment.slice(0, separator);
    let value3 = assignment.slice(separator + 1);
    if (!ACTORS.includes(key)) throw new InputError(`unknown name '${key}'`);
    if (seen.has(key)) throw new InputError(`name ${key} was provided twice`);
    if (value3.startsWith('"') && value3.endsWith('"') || value3.startsWith("'") && value3.endsWith("'")) {
      value3 = value3.slice(1, -1);
    }
    if (!value3) throw new InputError(`name ${key} must not be empty`);
    seen.add(key);
    names[key] = value3;
  }
  if (requireAll) {
    const missing2 = ACTORS.filter((actor) => !seen.has(actor));
    if (missing2.length > 0) throw new InputError(`--names needs A, B, and master; missing ${missing2.join(", ")}`);
  }
  return names;
}
function parseDeclaredCoverage(input) {
  const exactTargets = (raw) => raw.split(/[\n,]+/).map((target) => target.trim()).filter(Boolean);
  return [
    ...exactTargets(input.hunks).map((target) => ({ coverageKind: "hunk", target })),
    ...exactTargets(input.symptoms).map((target) => ({ coverageKind: "symptom", target })),
    ...parseClusterTokens(input.clusters).map((target) => ({ coverageKind: "cluster", target })),
    ...exactTargets(input.scenarios).map((target) => ({ coverageKind: "scenario", target }))
  ];
}
function reportPath(value3) {
  const directory4 = runDirectory();
  const destination = resolve5(value3);
  const inside = relative2(directory4, destination);
  if (!inside || inside.startsWith("..") || isAbsolute2(inside)) {
    throw new InputError(`report path must be a Markdown file inside ${directory4}`);
  }
  if (extname2(destination).toLowerCase() !== ".md") {
    throw new InputError("report path must end in .md");
  }
  if (inside === "A-notes.md" || inside === "B-notes.md" || inside.startsWith(`bin${process.platform === "win32" ? "\\" : "/"}`)) {
    throw new InputError(`report path is reserved: ${destination}`);
  }
  return destination;
}
function sectionBody(notes, title) {
  const lines2 = notes.split(/\r?\n/);
  const heading = new RegExp(`^#{1,6}\\s+${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");
  const start = lines2.findIndex((line) => heading.test(line));
  if (start < 0) return null;
  const endOffset = lines2.slice(start + 1).findIndex((line) => /^#{1,6}\s+/.test(line));
  const end = endOffset < 0 ? lines2.length : start + 1 + endOffset;
  return lines2.slice(start + 1, end).join("\n").trim();
}
function validateNotes(notes, label) {
  const match7 = notes.match(/^passes:\s*(\d+)\s+sweeps,\s*(\d+)\s+lenses,\s*(\d+)\s+probes,\s*(\d+)\s+diff reviews\s*$/im);
  if (match7 === null) {
    throw new InputError(`${label} need 'passes: N sweeps, N lenses, N probes, N diff reviews'`);
  }
  const skipped = notes.match(/^skipped:\s*(\S.*)$/im)?.[1];
  const categories = ["sweeps", "lenses", "probes", "diff reviews"];
  const missingNames = categories.filter((category, index) => Number(match7[index + 1]) === 0 && (skipped === void 0 || !skipped.toLowerCase().includes(category)));
  if (missingNames.length > 0) {
    throw new InputError(`${label} need a skipped: line naming every zero-count pass: ${missingNames.join(", ")}`);
  }
  if (!/^retrospective:\s*\S/im.test(notes)) {
    throw new InputError(`${label} need a nonempty retrospective: line`);
  }
}
function validateReviewSections(notes, label) {
  if (!sectionBody(notes, "Goal closure")) throw new InputError(`${label} need a nonempty Goal closure section`);
  if (!sectionBody(notes, "Domain scenarios")) throw new InputError(`${label} need a nonempty Domain scenarios section`);
  if (!/^closed\s+\d+\s+issues:\s*\S.*\bby execution\b.*\bby proof\b.*\bby evidence\b/im.test(notes)) {
    throw new InputError(`${label} need 'closed N issues: X by execution, Y by proof, Z by evidence'`);
  }
}
function validateHandoffNotes(state, actor) {
  if (state.mode !== "joint") throw new InputError("handoff is only used by a two-reviewer joint run");
  const path5 = join5(runDirectory(), `${actor}-notes.md`);
  if (!existsSync3(path5) || !statSync2(path5).isFile()) {
    throw new InputError(`handoff needs ${path5}`);
  }
  const notes = readFileSync2(path5, "utf8");
  validateNotes(notes, "handoff notes");
  if (state.route === "review") validateReviewSections(notes, "review handoff notes");
}
function validateSingleReportNotes(state) {
  if (state.route === "review" && !state.deep) return;
  const path5 = join5(runDirectory(), "A-notes.md");
  if (!existsSync3(path5) || !statSync2(path5).isFile()) throw new InputError(`report needs ${path5}`);
  const notes = readFileSync2(path5, "utf8");
  validateNotes(notes, "report notes");
  if (state.deep && state.route === "review") validateReviewSections(notes, "deep review report notes");
}
function hashNotes(state, notes = readNotes(state)) {
  return createHash3("sha256").update(JSON.stringify([notes.A ?? null, notes.B ?? null])).digest("hex");
}
function freshNotifications(result3) {
  const start = result3.previousState.notifications.length;
  return result3.state.notifications.slice(start).filter((notification) => {
    if (notification.kind !== "ready-work") return true;
    return readyWork(result3.state, notification.recipient).length > 0;
  });
}
function printReadySummary(state, actor) {
  const pinned = '"$LEDGER_DIR/bin/ledger.ts"';
  const a = readyWork(state, "A");
  const b = readyWork(state, "B");
  const mine = readyWork(state, actor);
  console.log(`ready work: A ${a.length}, B ${b.length}`);
  if (mine.length > 0) {
    console.log(`next for ${actor}: run ${pinned} status for the exact command`);
  } else if (actor === "master") {
    const singleDone = state.mode === "single" && a.length === 0 && b.length === 0 && state.checkout === null && state.issueTakes.length === 0;
    const jointDone = state.mode === "joint" && state.handoffs.A !== null && state.handoffs.B !== null;
    console.log(`next for ${actor}: ${state.reportCheckpoint ? "wait for the user's check-in decision" : singleDone || jointDone ? `run ${pinned} report` : state.mode === "single" ? "wait for reviewer ready work to finish" : "wait for a Question or both reviewer handoffs"}`);
  } else if (state.mode === "single") {
    console.log(`next for ${actor}: ${state.reportCheckpoint ? "wait for the user's check-in decision" : actor === "A" && b.length > 0 ? `dispatch the fresh diff review shown by ${pinned} status` : actor === "A" ? `run ${pinned} report` : "no further fresh-review work"}`);
  } else if (state.mode === "cold") {
    console.log(`next for ${actor}: run ${pinned} import`);
  } else if (state.handoffs[actor] !== null) {
    console.log(`next for ${actor}: handoff already recorded; wait for new ready work`);
  } else {
    console.log(`next for ${actor}: run ${pinned} handoff`);
  }
}
function deliver(result3) {
  for (const notification of freshNotifications(result3)) {
    const delivery = deliverNotification(notification, result3.state.names);
    if (!delivery.ok && delivery.fallback) console.error(delivery.fallback);
  }
}
function mutate(path5, commands, success) {
  return mutateDatabase(path5, protocolEngine, commands, void 0).pipe(
    Effect_exports.tap((result3) => Effect_exports.sync(() => deliver(result3))),
    Effect_exports.tap((result3) => Console_exports.log(success(result3.state))),
    Effect_exports.tap((result3) => Effect_exports.sync(() => printReadySummary(result3.state, actorFromEnvironment()))),
    Effect_exports.asVoid,
    Effect_exports.mapError(asError)
  );
}
function activePath(actor) {
  const shared = sharedDatabasePath();
  if (!existsSync3(shared)) return Effect_exports.fail(new InputError(`no ledger at ${shared}; run ledger init first`));
  if (actor === "master") return Effect_exports.succeed(shared);
  const cold = coldDatabasePath(actor);
  if (!existsSync3(cold)) return Effect_exports.succeed(shared);
  return readSnapshot(shared, codec).pipe(
    Effect_exports.flatMap((sharedSnapshot) => {
      if (sharedSnapshot.state.imports[actor]) return Effect_exports.succeed(shared);
      return readSnapshot(cold, codec).pipe(
        Effect_exports.flatMap((coldSnapshot) => coldSnapshot.state.campaignId === sharedSnapshot.state.campaignId ? Effect_exports.succeed(cold) : Effect_exports.fail(new InputError(`cold ledger ${cold} belongs to a different campaign; move it aside before init --cold`)))
      );
    }),
    Effect_exports.mapError(asError)
  );
}
function withSnapshot(actor, work) {
  return Effect_exports.gen(function* () {
    const path5 = yield* activePath(actor);
    const snapshot = yield* readSnapshot(path5, codec).pipe(Effect_exports.mapError(asError));
    return yield* work(path5, snapshot.state);
  });
}
function mutationHandler(build, success) {
  return Effect_exports.gen(function* () {
    const actor = yield* trySync(actorFromEnvironment);
    const path5 = yield* activePath(actor);
    let submitted = [];
    const result3 = yield* mutateDatabaseFromState(path5, protocolEngine, (state) => {
      const built = build(actor, state);
      submitted = Array.isArray(built) ? built : [built];
      return submitted;
    }, void 0).pipe(Effect_exports.mapError(asError));
    yield* Effect_exports.sync(() => deliver(result3));
    yield* Console_exports.log(success(submitted));
    yield* Effect_exports.sync(() => printReadySummary(result3.state, actor));
  });
}
var initCommand = Command_exports.make("init", {
  single: Flag_exports.boolean("single").pipe(Flag_exports.withDescription("Create a one-reviewer run"), Flag_exports.withDefault(false)),
  cold: Flag_exports.boolean("cold").pipe(Flag_exports.withDescription("Create this reviewer's independent cold database"), Flag_exports.withDefault(false)),
  joint: Flag_exports.string("joint").pipe(Flag_exports.withDescription("Report path for a two-reviewer run"), Flag_exports.withDefault("")),
  route: Flag_exports.choice("route", ROUTES).pipe(Flag_exports.withDefault("review")),
  howFar: Flag_exports.choice("how-far", POLICIES).pipe(Flag_exports.withDefault(DEFAULT_POLICY)),
  deep: Flag_exports.boolean("deep").pipe(Flag_exports.withDescription("Use deep evidence and note gates in a single-reviewer run"), Flag_exports.withDefault(false)),
  names: Flag_exports.string("names").pipe(Flag_exports.withDescription("A=name B=name master=name"), Flag_exports.withDefault("")),
  hunks: Flag_exports.string("hunks").pipe(Flag_exports.withDescription("Comma-separated exact review hunk names"), Flag_exports.withDefault("")),
  symptoms: Flag_exports.string("symptoms").pipe(Flag_exports.withDescription("Comma-separated exact diagnosis symptom names"), Flag_exports.withDefault("")),
  clusters: Flag_exports.string("clusters").pipe(Flag_exports.withDescription("Whitespace- or comma-separated exact cluster names"), Flag_exports.withDefault("")),
  scenarios: Flag_exports.string("scenarios").pipe(Flag_exports.withDescription("Comma-separated exact domain scenario names"), Flag_exports.withDefault(""))
}, ({ single, cold, joint, route, howFar, deep, names, hunks, symptoms, clusters, scenarios }) => Effect_exports.gen(function* () {
  const actor = yield* trySync(actorFromEnvironment);
  const directory4 = runDirectory();
  const timestamp = now();
  if (cold) {
    const seat = yield* trySync(() => reviewer(actor, "init --cold"));
    if (single || joint) return yield* Effect_exports.fail(new InputError("--cold cannot be combined with --single or --joint"));
    const shared = yield* readSnapshot(sharedDatabasePath(), codec).pipe(Effect_exports.mapError(asError));
    if (shared.state.mode !== "joint") return yield* Effect_exports.fail(new InputError("--cold requires a joint run"));
    const state2 = yield* trySync(() => initialProtocolState({
      campaignId: shared.state.campaignId,
      mode: "cold",
      coldSeat: seat,
      route: shared.state.route,
      policy: shared.state.policy,
      reportPath: shared.state.reportPath,
      names: shared.state.names,
      declaredCoverage: shared.state.declaredCoverage
    }));
    yield* initializeDatabase(coldDatabasePath(seat), state2, codec, {
      occurredAt: timestamp,
      events: [{ occurredAt: timestamp, actor: seat, action: "init.cold", fromState: null, toState: "cold" }]
    }).pipe(Effect_exports.mapError(asError));
    yield* Console_exports.log(`initialized cold ledger for ${seat}: ${coldDatabasePath(seat)}`);
    yield* Effect_exports.sync(() => printReadySummary(state2, seat));
    return;
  }
  if (single === Boolean(joint)) {
    return yield* Effect_exports.fail(new InputError("init needs exactly one of --single or --joint <report path>"));
  }
  if (existsSync3(sharedDatabasePath())) {
    return yield* Effect_exports.fail(new InputError(`refusing to overwrite existing ledger: ${sharedDatabasePath()}`));
  }
  if (single && actor !== "A") return yield* Effect_exports.fail(new InputError("LEDGER_ME must be A for init --single"));
  if (joint) master(actor, "init --joint");
  const mode = single ? "single" : "joint";
  const state = yield* trySync(() => initialProtocolState({
    campaignId: randomUUID(),
    mode,
    deep,
    route,
    policy: howFar,
    reportPath: reportPath(joint || join5(directory4, `${route}-report.md`)),
    names: parseNames(names, mode === "joint"),
    declaredCoverage: parseDeclaredCoverage({ hunks, symptoms, clusters, scenarios })
  }));
  const pinned = yield* trySync(() => pinCurrentHelper(directory4));
  yield* initializeDatabase(sharedDatabasePath(), state, codec, {
    occurredAt: timestamp,
    events: [{ occurredAt: timestamp, actor, action: "init", fromState: null, toState: mode }]
  }).pipe(Effect_exports.mapError(asError));
  yield* Console_exports.log(`initialized ${mode} ${deep || mode === "joint" ? "deep " : ""}${route} ledger (${howFar}): ${sharedDatabasePath()}`);
  yield* Console_exports.log(`pinned helper: ${pinned.bundle} sha256=${pinned.hash}`);
  yield* Effect_exports.sync(() => printReadySummary(state, actor));
})).pipe(
  Command_exports.withDescription("Create a single, joint, or independent cold ledger. The default how-far is fix.")
);
var runCommand = Command_exports.make("run", {
  operation: Argument_exports.choice("operation", ["escalate"]).pipe(Argument_exports.withDescription("escalate")),
  values: Argument_exports.string("field").pipe(Argument_exports.withDescription("optional coverage declarations as key=value fields"), Argument_exports.variadic)
}, ({ operation: _, values }) => mutationHandler((who, state) => {
  const actor = reviewer(who, "run escalate");
  const parsed = parseFields(values);
  assertNoPositionals(parsed, "run escalate");
  allowOnly(parsed.fields, ["hunks", "symptoms", "clusters", "scenarios"]);
  return {
    type: "run.escalate",
    actor,
    at: now(),
    declaredCoverage: parseDeclaredCoverage({
      hunks: optional6(parsed.fields, "hunks"),
      symptoms: optional6(parsed.fields, "symptoms"),
      clusters: optional6(parsed.fields, "clusters"),
      scenarios: optional6(parsed.fields, "scenarios")
    })
  };
}, () => "Run escalated to deep")).pipe(Command_exports.withDescription(
  "escalate [hunks=<targets>] [symptoms=<targets>] [clusters=<targets>] [scenarios=<targets>] \u2014 monotonically change a quick or plain single-seat run to deep"
));
var coverageCommand = Command_exports.make("coverage", {
  operation: Argument_exports.choice("operation", ["add", "set"]).pipe(Argument_exports.withDescription("add | set")),
  values: Argument_exports.string("field").pipe(Argument_exports.withDescription("operation-specific key=value field"), Argument_exports.variadic)
}, ({ operation, values }) => mutationHandler((who, state) => {
  const actor = reviewer(who, `coverage ${operation}`);
  const parsed = parseFields(values);
  if (operation === "add") {
    assertNoPositionals(parsed, "coverage add");
    allowOnly(parsed.fields, ["kind", "target", "state", "issue", "evidence", "reason", "note"]);
    const id2 = nextId(state, "C", actor);
    const kind = required(parsed.fields, "kind");
    if (!["hunk", "symptom", "cluster", "scenario"].includes(kind)) throw new InputError(`invalid coverage kind '${kind}'`);
    const stateName2 = optional6(parsed.fields, "state", "open");
    if (!COVERAGE_STATES.includes(stateName2)) throw new InputError(`invalid Coverage state '${stateName2}'`);
    const result3 = stateName2 === "covered" ? optional6(parsed.fields, "evidence", optional6(parsed.fields, "note")) : stateName2 === "gap" ? optional6(parsed.fields, "reason", optional6(parsed.fields, "note")) : "";
    const add2 = {
      type: "coverage.add",
      actor,
      at: now(),
      id: id2,
      coverageKind: kind,
      target: required(parsed.fields, "target"),
      ...parsed.fields.has("issue") ? { issueId: typedId(required(parsed.fields, "issue"), "I") } : {},
      ...stateName2 === "covered" ? { initial: { state: "covered", evidence: result3 } } : stateName2 === "gap" ? { initial: { state: "gap", reason: result3 } } : {}
    };
    return add2;
  }
  const id = typedId(assertOnePositional(parsed, "coverage set"), "C");
  allowOnly(parsed.fields, ["rev", "state", "evidence", "reason", "note"]);
  const expectedRevision = requiredRevision(parsed.fields);
  const stateName = required(parsed.fields, "state");
  if (stateName === "covered") return {
    type: "coverage.cover",
    actor,
    at: now(),
    id,
    expectedRevision,
    evidence: optional6(parsed.fields, "evidence", optional6(parsed.fields, "note"))
  };
  if (stateName === "gap") return {
    type: "coverage.gap",
    actor,
    at: now(),
    id,
    expectedRevision,
    reason: optional6(parsed.fields, "reason", optional6(parsed.fields, "note"))
  };
  throw new InputError("coverage set state must be covered or gap");
}, (commands) => {
  const command = commands.at(-1);
  return `Coverage ${"id" in command ? command.id : "updated"}: ${command.type.split(".").at(-1)}`;
})).pipe(Command_exports.withDescription(
  "add kind=<hunk|symptom|cluster|scenario> target=<name> [state=<open|covered|gap>] [issue=<I-id>] [evidence=<text>|reason=<text>|note=<text>]\nset <C-id> rev=<N> state=<covered|gap> (evidence=<text>|reason=<text>|note=<text>)"
));
var ISSUE_FACT_KEYS = [
  "claim",
  "proposition",
  "site",
  "trigger",
  "cause",
  "scope",
  "frequency",
  "impact",
  "impact_rank",
  "detector",
  "detector_gap"
];
function issueFacts(fields, prior) {
  return {
    proposition: optional6(fields, "claim", optional6(fields, "proposition", prior?.proposition ?? "")),
    site: optional6(fields, "site", prior?.site ?? ""),
    trigger: optional6(fields, "trigger", prior?.trigger ?? ""),
    cause: optional6(fields, "cause", prior?.cause ?? ""),
    scope: optional6(fields, "scope", prior?.scope ?? ""),
    frequency: optional6(fields, "frequency", prior?.frequency ?? ""),
    impact: optional6(fields, "impact", prior?.impact ?? ""),
    ...fields.has("impact_rank") || prior?.impactRank !== void 0 ? { impactRank: fields.has("impact_rank") ? integerInRange(fields, "impact_rank", 1, 5) : prior.impactRank } : {},
    ...fields.has("detector") || prior?.detector !== void 0 ? { detector: optional6(fields, "detector", prior?.detector ?? "") } : {},
    ...fields.has("detector_gap") || prior?.detectorGap !== void 0 ? { detectorGap: optional6(fields, "detector_gap", prior?.detectorGap ?? "") } : {}
  };
}
function issueFactChanges(fields) {
  const changes = {};
  for (const key of ISSUE_FACT_KEYS) {
    if (!fields.has(key)) continue;
    if (key === "impact_rank") {
      changes.impactRank = integerInRange(fields, "impact_rank", 1, 5);
      continue;
    }
    const target = key === "claim" || key === "proposition" ? "proposition" : key === "detector_gap" ? "detectorGap" : key;
    changes[target] = optional6(fields, key);
  }
  return changes;
}
function issueCommandForAdd(actor, state, fields) {
  allowOnly(fields, [
    "label",
    "state",
    "certainty",
    ...ISSUE_FACT_KEYS,
    "evidence",
    "assumption",
    "no_probe_reason",
    "clusters",
    "parents",
    "reason"
  ]);
  const id = nextId(state, "I", actor);
  const label = required(fields, "label");
  if (!ISSUE_LABELS.includes(label)) throw new InputError(`invalid Issue label '${label}'`);
  const certainty = integerInRange(fields, "certainty", 1, 5);
  const timestamp = now();
  const requestedState = optional6(fields, "state", "new");
  const initial = requestedState === "verified" ? {
    state: "verified",
    certainty: (() => {
      if (certainty < 4) throw new InputError("verified Issue certainty must be 4 or 5");
      return certainty;
    })(),
    evidence: runLogPath(required(fields, "evidence"), "evidence")
  } : requestedState === "assumed" ? {
    state: "assumed",
    certainty,
    assumption: required(fields, "assumption"),
    noProbeReason: required(fields, "no_probe_reason")
  } : requestedState === "accepted" ? { state: "accepted", reason: required(fields, "reason") } : void 0;
  if (!["new", "verified", "assumed", "accepted"].includes(requestedState)) {
    throw new InputError("issue add state must be new, verified, assumed, or accepted");
  }
  const add2 = {
    type: "issue.add",
    actor,
    at: timestamp,
    id,
    label,
    certainty,
    facts: issueFacts(fields),
    clusters: parseClusterTokens(optional6(fields, "clusters")),
    parentIssueIds: listField(fields, "parents", false).map((value3) => typedId(value3, "I")),
    ...initial ? { initial } : {}
  };
  return [add2];
}
var issueOperations = ["add", "set", "agree", "contest", "probe", "disprove", "duplicate", "accept", "take", "release", "exit", "drop"];
var issueCommand = Command_exports.make("issue", {
  operation: Argument_exports.choice("operation", issueOperations).pipe(Argument_exports.withDescription(issueOperations.join(" | "))),
  values: Argument_exports.string("field").pipe(Argument_exports.withDescription("operation-specific row id or key=value field"), Argument_exports.variadic)
}, ({ operation, values }) => mutationHandler((who, state) => {
  const parsed = parseFields(values);
  if (operation === "drop") {
    const actor2 = master(who, "issue drop");
    const id2 = typedId(assertOnePositional(parsed, "issue drop"), "I");
    allowOnly(parsed.fields, ["rev", "reason"]);
    return {
      type: "issue.exit",
      actor: actor2,
      at: now(),
      id: id2,
      expectedRevision: requiredRevision(parsed.fields),
      exit: { kind: "user-drop", reason: required(parsed.fields, "reason") }
    };
  }
  const actor = reviewer(who, `issue ${operation}`);
  if (operation === "add") {
    assertNoPositionals(parsed, "issue add");
    return issueCommandForAdd(actor, state, parsed.fields);
  }
  const id = typedId(assertOnePositional(parsed, `issue ${operation}`), "I");
  const expectedRevision = requiredRevision(parsed.fields);
  const timestamp = now();
  if (operation === "set") {
    allowOnly(parsed.fields, [
      "rev",
      "state",
      "label",
      "label_reason",
      "clusters",
      "parents",
      "certainty",
      ...ISSUE_FACT_KEYS,
      "evidence",
      "assumption",
      "no_probe_reason"
    ]);
    const before = findRow(state, id, "Issue");
    const commands = [];
    let revision = expectedRevision;
    let effectiveState = before.state;
    const requestedState = optional6(parsed.fields, "state");
    if (requestedState && requestedState !== "verified" && requestedState !== "assumed") {
      throw new InputError("issue set state must be verified or assumed; use the named disposition command otherwise");
    }
    const stateTransition = requestedState !== "" && requestedState !== effectiveState;
    const hasContent = ISSUE_FACT_KEYS.some((key) => parsed.fields.has(key)) || parsed.fields.has("label") || parsed.fields.has("clusters") || parsed.fields.has("parents") || !stateTransition && ["certainty", "evidence", "assumption", "no_probe_reason"].some((key) => parsed.fields.has(key));
    if (hasContent) {
      const label = parsed.fields.has("label") ? required(parsed.fields, "label") : void 0;
      if (label !== void 0 && !ISSUE_LABELS.includes(label)) throw new InputError(`invalid Issue label '${label}'`);
      const edit = {
        type: "issue.edit",
        actor,
        at: timestamp,
        id,
        expectedRevision: revision,
        facts: issueFactChanges(parsed.fields),
        ...label === void 0 ? {} : { label },
        ...parsed.fields.has("label_reason") ? { labelChangeReason: required(parsed.fields, "label_reason") } : {},
        ...parsed.fields.has("clusters") ? { clusters: parseClusterTokens(optional6(parsed.fields, "clusters")) } : {},
        ...parsed.fields.has("parents") ? { parentIssueIds: listField(parsed.fields, "parents", false).map((value3) => typedId(value3, "I")) } : {},
        ...!stateTransition && parsed.fields.has("certainty") ? { certainty: integerInRange(parsed.fields, "certainty", 1, 5) } : {},
        ...!stateTransition && parsed.fields.has("evidence") ? { evidence: before.state === "verified" ? runLogPath(required(parsed.fields, "evidence"), "evidence") : required(parsed.fields, "evidence") } : {},
        ...!stateTransition && parsed.fields.has("assumption") ? { assumption: required(parsed.fields, "assumption") } : {},
        ...!stateTransition && parsed.fields.has("no_probe_reason") ? { noProbeReason: required(parsed.fields, "no_probe_reason") } : {}
      };
      commands.push(edit);
      revision += 1;
      if (effectiveState === "contested") effectiveState = "new";
    }
    if (requestedState === "verified" && effectiveState !== "verified") {
      const certainty = integerInRange(parsed.fields, "certainty", 4, 5);
      commands.push({
        type: "issue.verify",
        actor,
        at: timestamp,
        id,
        expectedRevision: revision,
        certainty,
        evidence: runLogPath(required(parsed.fields, "evidence"), "evidence")
      });
    } else if (requestedState === "assumed" && effectiveState !== "assumed") {
      commands.push({
        type: "issue.assume",
        actor,
        at: timestamp,
        id,
        expectedRevision: revision,
        certainty: integerInRange(parsed.fields, "certainty", 1, 5),
        assumption: required(parsed.fields, "assumption"),
        noProbeReason: required(parsed.fields, "no_probe_reason")
      });
    }
    if (commands.length === 0) throw new InputError("issue set did not change anything");
    return commands;
  }
  if (operation === "agree") {
    allowOnly(parsed.fields, ["rev"]);
    return { type: "issue.mark", actor, at: timestamp, id, expectedRevision };
  }
  if (operation === "contest") {
    allowOnly(parsed.fields, ["rev", "probe"]);
    return { type: "issue.contest", actor, at: timestamp, id, expectedRevision, probe: required(parsed.fields, "probe") };
  }
  if (operation === "probe") {
    allowOnly(parsed.fields, ["rev", "verdict", "certainty", "evidence"]);
    const verdict = required(parsed.fields, "verdict");
    if (verdict !== "verified" && verdict !== "disproved") throw new InputError("verdict must be verified or disproved");
    return {
      type: "issue.probe",
      actor,
      at: timestamp,
      id,
      expectedRevision,
      verdict,
      certainty: integerInRange(parsed.fields, "certainty", 4, 5),
      evidence: runLogPath(required(parsed.fields, "evidence"), "evidence")
    };
  }
  if (operation === "disprove") {
    allowOnly(parsed.fields, ["rev", "certainty", "evidence"]);
    return {
      type: "issue.disprove",
      actor,
      at: timestamp,
      id,
      expectedRevision,
      certainty: integerInRange(parsed.fields, "certainty", 2, 5),
      evidence: required(parsed.fields, "evidence")
    };
  }
  if (operation === "duplicate") {
    allowOnly(parsed.fields, ["rev", "of"]);
    return { type: "issue.duplicate", actor, at: timestamp, id, expectedRevision, duplicateOf: typedId(required(parsed.fields, "of"), "I") };
  }
  if (operation === "accept") {
    allowOnly(parsed.fields, ["rev", "reason"]);
    return { type: "issue.accept", actor, at: timestamp, id, expectedRevision, reason: required(parsed.fields, "reason") };
  }
  if (operation === "take" || operation === "release") {
    allowOnly(parsed.fields, ["rev"]);
    return { type: `issue.${operation}`, actor, at: timestamp, id, expectedRevision };
  }
  allowOnly(parsed.fields, ["rev", "kind", "reference", "reason"]);
  const kind = required(parsed.fields, "kind");
  if (kind === "user-drop") throw new InputError("only master may record a user-drop");
  if (kind !== "comment-or-assert" && kind !== "ruling-or-baseline" && kind !== "todo") {
    throw new InputError("exit kind must be comment-or-assert, ruling-or-baseline, or todo");
  }
  return {
    type: "issue.exit",
    actor,
    at: timestamp,
    id,
    expectedRevision,
    exit: { kind, reference: required(parsed.fields, "reference") }
  };
}, (commands) => {
  const command = commands.at(-1);
  return `Issue ${"id" in command ? command.id : "updated"}: ${command.type.split(".").at(-1)}`;
})).pipe(Command_exports.withDescription(
  "add label=<label> certainty=<1-5> claim=<text> [state=<new|verified|assumed|accepted>] plus site, trigger, cause, scope, frequency, impact, impact_rank=1..5, evidence/assumption/no_probe_reason/reason, clusters, parents\nset <I-id> rev=<N> with changed Issue fields, label_reason=<reason> on a downgrade, and optional state=<verified|assumed>; agree <I-id> rev=<N>; contest <I-id> rev=<N> probe=<text>; probe <I-id> rev=<N> verdict=<verified|disproved> certainty=<4|5> evidence=<path>\ndisprove <I-id> rev=<N> certainty=<2-5> evidence=<path>; duplicate <I-id> rev=<N> of=<I-id>; accept <I-id> rev=<N> reason=<text>; take|release <I-id> rev=<N>; exit <I-id> rev=<N> kind=<comment-or-assert|ruling-or-baseline|todo> reference=<text>; drop <I-id> rev=<N> reason=<text> (master)"
));
var questionCommand = Command_exports.make("question", {
  operation: Argument_exports.choice("operation", ["add", "answer"]).pipe(Argument_exports.withDescription("add | answer")),
  values: Argument_exports.string("field").pipe(Argument_exports.withDescription("operation-specific row id or key=value field"), Argument_exports.variadic)
}, ({ operation, values }) => Effect_exports.gen(function* () {
  const parsed = yield* trySync(() => parseFields(values));
  if (operation === "add") {
    const effect2 = mutationHandler((who, state) => {
      const actor2 = reviewer(who, "question add");
      assertNoPositionals(parsed, "question add");
      allowOnly(parsed.fields, ["issues", "proposed_fix", "shelved_fix", "purpose", "question", "options", "user_effect", "code_cost", "recommendation"]);
      const purpose = optional6(parsed.fields, "purpose", "decision");
      if (purpose !== "decision" && purpose !== "no-red") throw new InputError("purpose must be decision or no-red");
      let options = optionList(required(parsed.fields, "options"));
      if (purpose === "no-red" && !options.some((option4) => option4.trim().toLowerCase() === ALLOW_NO_RED_ANSWER)) {
        throw new InputError(`a no-red Question must offer the exact answer '${ALLOW_NO_RED_ANSWER}'`);
      }
      const id2 = nextId(state, "Q", actor2);
      const proposedFixId = parsed.fields.has("proposed_fix") ? typedId(required(parsed.fields, "proposed_fix"), "P") : void 0;
      const proposedFix = proposedFixId === void 0 ? void 0 : state.rows.find((row) => row.id === proposedFixId && row.kind === "Proposed fix");
      if (proposedFixId !== void 0 && proposedFix === void 0) {
        throw new InputError(`unknown Proposed fix ${proposedFixId}`);
      }
      const shelvedFixId = parsed.fields.has("shelved_fix") ? typedId(required(parsed.fields, "shelved_fix"), "S") : void 0;
      const shelvedFix = shelvedFixId === void 0 ? void 0 : state.rows.find((row) => row.id === shelvedFixId && row.kind === "Shelved fix");
      if (shelvedFixId !== void 0 && shelvedFix === void 0) {
        throw new InputError(`unknown Shelved fix ${shelvedFixId}`);
      }
      return {
        type: "question.add",
        actor: actor2,
        at: now(),
        id: id2,
        issueIds: listField(parsed.fields, "issues").map((value3) => typedId(value3, "I")),
        purpose,
        ...proposedFix === void 0 ? {} : { proposedFixRef: { id: proposedFixId, revision: proposedFix.revision } },
        ...shelvedFix === void 0 ? {} : { shelvedFixRef: { id: shelvedFixId, revision: shelvedFix.revision } },
        question: required(parsed.fields, "question"),
        options,
        userEffect: required(parsed.fields, "user_effect"),
        codeCost: required(parsed.fields, "code_cost"),
        recommendation: required(parsed.fields, "recommendation")
      };
    }, (commands) => `Question ${commands.at(-1).id}: open`);
    return yield* effect2;
  }
  const actor = yield* trySync(actorFromEnvironment);
  master(actor, "question answer");
  const id = typedId(assertOnePositional(parsed, "question answer"), "Q");
  allowOnly(parsed.fields, ["rev", "answer"]);
  return yield* withSnapshot(actor, (path5) => mutate(path5, {
    type: "question.answer",
    actor: "master",
    at: now(),
    id,
    expectedRevision: requiredRevision(parsed.fields),
    answer: required(parsed.fields, "answer")
  }, () => `Question ${id}: answered`));
})).pipe(Command_exports.withDescription(
  `add issues=<I-ids> [proposed_fix=<P-id>|shelved_fix=<S-id>] purpose=<decision|no-red> question=<text> options=<choices> user_effect=<text> code_cost=<text> recommendation=<choice>
answer <Q-id> rev=<N> answer=<choice> (master). Missing-red authorization requires purpose=no-red and the exact answer ${ALLOW_NO_RED_ANSWER}.`
));
var PROPOSED_FIX_KEYS = [
  "origin_class",
  "shape",
  "sites",
  "rulings",
  "test",
  "cost",
  "interface_change",
  "ownership_change",
  "risk_surface",
  "guardrail",
  "coordination"
];
function proposedFixShape(fields, proposalKind, prior) {
  const shape = optional6(fields, "shape", prior?.shape ?? "");
  const cost = optional6(fields, "cost", prior?.cost ?? "");
  if (proposalKind === "direction") {
    const notDirection = PROPOSED_FIX_KEYS.filter(
      (key) => key !== "shape" && key !== "cost" && key !== "coordination" && fields.has(key)
    );
    if (notDirection.length > 0) {
      throw new InputError(`a direction accepts only shape, cost, and coordination (got ${notDirection.join(", ")})`);
    }
    return {
      shape: shape || required(fields, "shape"),
      cost: cost || required(fields, "cost"),
      ...fields.has("coordination") || prior?.coordination !== void 0 ? { coordination: optional6(fields, "coordination", prior?.coordination ?? "") } : {}
    };
  }
  const originClass = optional6(fields, "origin_class", prior?.originClass ?? "");
  if (originClass !== "attention-miss" && originClass !== "self-consistency" && originClass !== "design-absence") {
    throw new InputError("origin_class must be attention-miss, self-consistency, or design-absence");
  }
  return {
    originClass,
    shape,
    sitesWalked: optional6(fields, "sites", prior?.sitesWalked ?? ""),
    rulingsChecked: optional6(fields, "rulings", prior?.rulingsChecked ?? ""),
    testLocation: optional6(fields, "test", prior?.testLocation ?? ""),
    cost,
    interfaceChange: fields.has("interface_change") ? booleanField(fields, "interface_change") : prior?.interfaceChange ?? false,
    ownershipChange: fields.has("ownership_change") ? booleanField(fields, "ownership_change") : prior?.ownershipChange ?? false,
    riskSurface: fields.has("risk_surface") ? booleanField(fields, "risk_surface") : prior?.riskSurface ?? false,
    ...fields.has("guardrail") || prior?.guardrail !== void 0 ? { guardrail: optional6(fields, "guardrail", prior?.guardrail ?? "") } : {},
    ...fields.has("coordination") || prior?.coordination !== void 0 ? { coordination: optional6(fields, "coordination", prior?.coordination ?? "") } : {}
  };
}
var proposedFixCommand = Command_exports.make("proposed-fix", {
  operation: Argument_exports.choice("operation", ["add", "set", "mark", "reject"]).pipe(Argument_exports.withDescription("add | set | mark | reject")),
  values: Argument_exports.string("field").pipe(Argument_exports.withDescription("operation-specific row id or key=value field"), Argument_exports.variadic)
}, ({ operation, values }) => mutationHandler((who, state) => {
  const actor = reviewer(who, `proposed-fix ${operation}`);
  const parsed = parseFields(values);
  const timestamp = now();
  if (operation === "add") {
    assertNoPositionals(parsed, "proposed-fix add");
    allowOnly(parsed.fields, ["issues", "kind", ...PROPOSED_FIX_KEYS]);
    const id2 = nextId(state, "P", actor);
    const proposalKind = optional6(parsed.fields, "kind", "proposal");
    if (proposalKind !== "proposal" && proposalKind !== "direction") throw new InputError("kind must be proposal or direction");
    return {
      type: "proposed-fix.add",
      actor,
      at: timestamp,
      id: id2,
      issueIds: listField(parsed.fields, "issues").map((value3) => typedId(value3, "I")),
      fix: proposedFixShape(parsed.fields, proposalKind),
      proposalKind
    };
  }
  const id = typedId(assertOnePositional(parsed, `proposed-fix ${operation}`), "P");
  const expectedRevision = requiredRevision(parsed.fields);
  if (operation === "set") {
    allowOnly(parsed.fields, ["rev", ...PROPOSED_FIX_KEYS]);
    const before = findRow(state, id, "Proposed fix");
    return {
      type: "proposed-fix.edit",
      actor,
      at: timestamp,
      id,
      expectedRevision,
      fix: proposedFixShape(parsed.fields, before.proposalKind, before.fix)
    };
  }
  if (operation === "mark") {
    allowOnly(parsed.fields, ["rev"]);
    return { type: "proposed-fix.mark", actor, at: timestamp, id, expectedRevision };
  }
  allowOnly(parsed.fields, ["rev", "reason"]);
  return { type: "proposed-fix.reject", actor, at: timestamp, id, expectedRevision, reason: required(parsed.fields, "reason") };
}, (commands) => {
  const command = commands.at(-1);
  return `Proposed fix ${"id" in command ? command.id : "updated"}: ${command.type.split(".").at(-1)}`;
})).pipe(Command_exports.withDescription(
  "add issues=<I-ids> kind=proposal origin_class=<attention-miss|self-consistency|design-absence> shape=<text> sites=<walked-sites> rulings=<checks> test=<location|none> cost=<text> [interface_change=<yes|no>] [ownership_change=<yes|no>] [risk_surface=<yes|no>] [guardrail=<text>] [coordination=<text>]\nadd issues=<I-ids> kind=direction shape=<summary> cost=<text> [coordination=<text>]; set <P-id> rev=<N> with fields for its existing kind; mark <P-id> rev=<N>; reject <P-id> rev=<N> reason=<text>"
));
var shelvedFixCommand = Command_exports.make("shelved-fix", {
  operation: Argument_exports.choice("operation", ["add", "set", "conditions", "review"]).pipe(Argument_exports.withDescription("add | set | conditions | review")),
  values: Argument_exports.string("field").pipe(Argument_exports.withDescription("operation-specific row id or key=value field"), Argument_exports.variadic)
}, ({ operation, values }) => mutationHandler((who, state) => {
  const actor = reviewer(who, `shelved-fix ${operation}`);
  const parsed = parseFields(values);
  const timestamp = now();
  if (operation === "add") {
    assertNoPositionals(parsed, "shelved-fix add");
    allowOnly(parsed.fields, ["proposed_fixes", "artifact", "red", "green"]);
    const id2 = nextId(state, "S", actor);
    const red2 = optional6(parsed.fields, "red");
    return {
      type: "shelved-fix.add",
      actor,
      at: timestamp,
      id: id2,
      proposedFixIds: listField(parsed.fields, "proposed_fixes").map((value3) => typedId(value3, "P")),
      artifact: required(parsed.fields, "artifact"),
      redRun: red2 ? { path: runLogPath(red2, "red") } : null,
      greenRun: { path: runLogPath(required(parsed.fields, "green"), "green") }
    };
  }
  const id = typedId(assertOnePositional(parsed, `shelved-fix ${operation}`), "S");
  const expectedRevision = requiredRevision(parsed.fields);
  if (operation === "set") {
    allowOnly(parsed.fields, ["rev", "artifact", "red", "green"]);
    const before = findRow(state, id, "Shelved fix");
    const red2 = parsed.fields.has("red") ? optional6(parsed.fields, "red") : before.redRun?.path ?? "";
    const green2 = optional6(parsed.fields, "green", before.greenRun.path);
    return {
      type: "shelved-fix.edit",
      actor,
      at: timestamp,
      id,
      expectedRevision,
      artifact: optional6(parsed.fields, "artifact", before.artifact),
      redRun: red2 ? { path: runLogPath(red2, "red") } : null,
      greenRun: { path: runLogPath(green2, "green") }
    };
  }
  if (operation === "conditions") {
    allowOnly(parsed.fields, ["rev", "conditions"]);
    return {
      type: "shelved-fix.review",
      actor,
      at: timestamp,
      id,
      expectedRevision,
      verdict: "conditions",
      conditions: required(parsed.fields, "conditions")
    };
  }
  allowOnly(parsed.fields, ["rev"]);
  return { type: "shelved-fix.review", actor, at: timestamp, id, expectedRevision, verdict: "reviewed" };
}, (commands) => {
  const command = commands.at(-1);
  return `Shelved fix ${"id" in command ? command.id : "updated"}: ${command.type.split(".").at(-1)}`;
})).pipe(Command_exports.withDescription(
  "add proposed_fixes=<P-ids> artifact=<shelve> red=<path> green=<path>; an answered no-red Question is the only red omission\nset <S-id> rev=<N> artifact=<shelve> [red=<path>] [green=<path>]; conditions <S-id> rev=<N> conditions=<text>; review <S-id> rev=<N>. Log paths stay inside the run directory."
));
var checkoutCommand = Command_exports.make("checkout", {
  operation: Argument_exports.choice("operation", ["take", "baseline", "release", "force-release"]).pipe(Argument_exports.withDescription("take | baseline | release | force-release")),
  values: Argument_exports.string("field").pipe(Argument_exports.withDescription("operation-specific key=value field"), Argument_exports.variadic)
}, ({ operation, values }) => mutationHandler((who) => {
  const parsed = parseFields(values);
  assertNoPositionals(parsed, `checkout ${operation}`);
  const timestamp = now();
  if (operation === "force-release") {
    const actor2 = master(who, "checkout force-release");
    allowOnly(parsed.fields, ["reason"]);
    return {
      type: "checkout.release",
      actor: actor2,
      at: timestamp,
      probesRemoved: true,
      shelvesRecorded: true,
      reason: required(parsed.fields, "reason")
    };
  }
  const actor = reviewer(who, `checkout ${operation}`);
  if (operation === "take") {
    allowOnly(parsed.fields, ["purpose", "rows"]);
    return {
      type: "checkout.take",
      actor,
      at: timestamp,
      purpose: required(parsed.fields, "purpose"),
      rowIds: listField(parsed.fields, "rows", false).map(rowId)
    };
  }
  if (operation === "baseline") {
    allowOnly(parsed.fields, ["build", "test"]);
    return {
      type: "checkout.baseline",
      actor,
      at: timestamp,
      buildLog: runLogPath(required(parsed.fields, "build"), "build"),
      testLog: runLogPath(required(parsed.fields, "test"), "test")
    };
  }
  allowOnly(parsed.fields, []);
  return { type: "checkout.release", actor, at: timestamp, probesRemoved: true, shelvesRecorded: true };
}, (commands) => `Checkout: ${commands.at(-1).type.split(".").at(-1)}`)).pipe(
  Command_exports.withDescription("Take the shared checkout, record its first baseline, or release it. `release` declares probes removed and shelves recorded. `force-release reason=...` is for master only, acting on the user's word; holds never expire.")
);
var checkInCommand = Command_exports.make("check-in", {
  operation: Argument_exports.choice("operation", ["approve", "record", "drop"]).pipe(Argument_exports.withDescription("approve | record | drop")),
  values: Argument_exports.string("field").pipe(Argument_exports.withDescription("operation-specific row id or key=value field"), Argument_exports.variadic)
}, ({ operation, values }) => mutationHandler((who, state) => {
  const parsed = parseFields(values);
  const timestamp = now();
  if (operation === "approve") {
    const actor2 = master(who, "check-in approve");
    assertNoPositionals(parsed, "check-in approve");
    allowOnly(parsed.fields, ["shelves", "executor", "approval"]);
    const executorName = optional6(parsed.fields, "executor", "master");
    if (!ACTORS.includes(executorName)) throw new InputError("executor must be A, B, or master");
    const id2 = nextId(state, "K", actor2);
    return {
      type: "check-in.approve",
      actor: actor2,
      at: timestamp,
      id: id2,
      shelvedFixIds: listField(parsed.fields, "shelves").map((value3) => typedId(value3, "S")),
      executor: executorName,
      approval: required(parsed.fields, "approval"),
      notesHash: hashNotes(state)
    };
  }
  const id = typedId(assertOnePositional(parsed, `check-in ${operation}`), "K");
  const expectedRevision = requiredRevision(parsed.fields);
  if (operation === "record") {
    allowOnly(parsed.fields, ["rev", "changeset", "departures"]);
    return {
      type: "check-in.record",
      actor: who,
      at: timestamp,
      id,
      expectedRevision,
      changeset: required(parsed.fields, "changeset"),
      departures: required(parsed.fields, "departures")
    };
  }
  const actor = master(who, "check-in drop");
  allowOnly(parsed.fields, ["rev", "reason"]);
  return { type: "check-in.drop", actor, at: timestamp, id, expectedRevision, reason: required(parsed.fields, "reason") };
}, (commands) => {
  const command = commands.at(-1);
  return `Check-in ${"id" in command ? command.id : "updated"}: ${command.type.split(".").at(-1)}`;
})).pipe(Command_exports.withDescription(
  "approve shelves=<S-ids> approval=<user words> [executor=<A|B|master>] (master); record <K-id> rev=<N> changeset=<id> departures=<none-or-text> (executor); drop <K-id> rev=<N> reason=<text> (master)"
));
var importCommand = Command_exports.make("import", {}, () => Effect_exports.gen(function* () {
  const actor = yield* trySync(actorFromEnvironment);
  const seat = yield* trySync(() => reviewer(actor, "import"));
  const cold = coldDatabasePath(seat);
  if (!existsSync3(cold)) return yield* Effect_exports.fail(new InputError(`cold ledger does not exist: ${cold}`));
  const timestamp = now();
  const bundle = yield* sealImportBundle(cold, codec, timestamp, {
    validate: (state) => {
      const pending = readyWork(state, seat).filter((item) => item.command !== "cold.import");
      if (pending.length > 0) {
        throw new InputError(`cold pass still has ready work: ${pending.map((item) => item.rowId ?? item.reason).join(", ")}`);
      }
    }
  }).pipe(Effect_exports.mapError(asError));
  const rows = bundle.state.rows.filter((row) => row.kind === "Coverage" || row.kind === "Issue");
  const additionalEvents = importedEventsFrom(bundle, seat);
  const result3 = yield* mutateDatabase(sharedDatabasePath(), protocolEngine, {
    type: "cold.import",
    actor: seat,
    at: timestamp,
    campaignId: bundle.state.campaignId,
    rows
  }, void 0, { additionalEvents }).pipe(Effect_exports.mapError(asError));
  yield* Effect_exports.sync(() => deliver(result3));
  yield* Console_exports.log(`imported ${seat}: ${rows.length} rows`);
  yield* Effect_exports.sync(() => printReadySummary(result3.state, seat));
})).pipe(Command_exports.withDescription("Atomically import this reviewer's cold Coverage and Issues into the shared database."));
var handoffCommand = Command_exports.make("handoff", {}, () => mutationHandler((who, state) => {
  const actor = reviewer(who, "handoff");
  validateHandoffNotes(state, actor);
  return { type: "handoff", actor, at: now() };
}, (commands) => `handoff recorded for ${commands[0].actor}`)).pipe(
  Command_exports.withDescription("Hand off only when ready work is empty and this reviewer holds neither checkout nor Issue take.")
);
function readNotes(state) {
  const notes = {};
  for (const seat of state.mode === "single" ? ["A"] : ["A", "B"]) {
    const path5 = join5(runDirectory(), `${seat}-notes.md`);
    if (existsSync3(path5) && statSync2(path5).isFile()) notes[seat] = readFileSync2(path5, "utf8");
  }
  return notes;
}
var statusCommand = Command_exports.make("status", {}, () => Effect_exports.gen(function* () {
  const actor = yield* trySync(actorFromEnvironment);
  const path5 = yield* activePath(actor);
  const view = yield* readLedgerView(path5, codec).pipe(Effect_exports.mapError(asError));
  yield* Console_exports.log(renderStatus(view.state, { actor, events: view.events, notes: readNotes(view.state) }).trimEnd());
})).pipe(Command_exports.withDescription("Show rows, ownership, questions, A/B ready counts, and the caller's next exact command."));
var reportCommand = Command_exports.make("report", {}, () => Effect_exports.gen(function* () {
  const actor = yield* trySync(actorFromEnvironment);
  const path5 = yield* activePath(actor);
  const view = yield* readLedgerView(path5, codec).pipe(Effect_exports.mapError(asError));
  if (view.state.mode === "cold") return yield* Effect_exports.fail(new InputError("import the cold pass before reporting"));
  if (view.state.mode === "joint") {
    yield* trySync(() => master(actor, "report"));
    for (const seat of ["A", "B"]) {
      if (view.state.handoffs[seat] !== null) yield* trySync(() => validateHandoffNotes(view.state, seat));
    }
  } else {
    if (actor !== "A") return yield* Effect_exports.fail(new InputError("LEDGER_ME must be A for a single-run report"));
    yield* trySync(() => validateSingleReportNotes(view.state));
  }
  const notes = readNotes(view.state);
  const notesHash = hashNotes(view.state, notes);
  const destination = view.state.reportPath === null ? null : yield* trySync(() => reportPath(view.state.reportPath));
  const recordsFinalReport = readyWork(view.state, actor).some((item) => item.command === "report.record") || view.state.reportCheckpoint !== null && view.state.reportCheckpoint.notesHash !== notesHash;
  const recorded = recordsFinalReport ? yield* mutateDatabase(path5, protocolEngine, {
    type: "report.record",
    actor,
    at: now(),
    notesHash
  }, void 0, { expectedStorageRevision: view.storageRevision }).pipe(Effect_exports.mapError(asError)) : null;
  if (recorded) yield* Effect_exports.sync(() => deliver(recorded));
  const reportState = recorded?.state ?? view.state;
  const reportEvents = recorded?.events ?? view.events;
  const report = renderReport(reportState, { events: reportEvents, notes });
  if (destination) yield* trySync(() => writeReportAtomically(destination, report, runDirectory()));
  yield* Console_exports.log(destination ? `report: ${destination}` : "report: stdout only");
  yield* Effect_exports.sync(() => printReadySummary(reportState, actor));
  yield* Console_exports.log(report.trimEnd());
})).pipe(Command_exports.withDescription("Print the current report. Open work stays visibly open; review reports end with the Fix table and diagnosis reports with Validation."));
var timelineCommand = Command_exports.make("timeline", {
  actors: Argument_exports.string("actor").pipe(Argument_exports.variadic({ max: 1 }))
}, ({ actors }) => Effect_exports.gen(function* () {
  const caller = yield* trySync(actorFromEnvironment);
  const selected = actors[0];
  if (selected !== void 0 && !ACTORS.includes(selected)) {
    return yield* Effect_exports.fail(new InputError("timeline actor must be A, B, or master"));
  }
  const path5 = yield* activePath(caller);
  const view = yield* readLedgerView(path5, codec).pipe(Effect_exports.mapError(asError));
  yield* Console_exports.log(renderTimeline(view.state, view.events, selected).trimEnd());
  yield* Effect_exports.sync(() => printReadySummary(view.state, caller));
})).pipe(Command_exports.withDescription("Print timestamped state transitions for A, B, master, or all actors."));
var root = Command_exports.make("ledger").pipe(
  Command_exports.withDescription("Typed review and diagnosis ledger"),
  Command_exports.withSubcommands([
    initCommand,
    runCommand,
    coverageCommand,
    issueCommand,
    questionCommand,
    proposedFixCommand,
    shelvedFixCommand,
    checkoutCommand,
    checkInCommand,
    importCommand,
    handoffCommand,
    statusCommand,
    reportCommand,
    timelineCommand
  ])
);
root.pipe(
  Command_exports.run({ version: VERSION }),
  Effect_exports.provide(layer12),
  runMain2
);
