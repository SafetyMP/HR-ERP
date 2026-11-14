import { describe, expect, it } from "vitest";

import deepmerge from "deepmerge";

function protoPayload(marker: string): Record<string, unknown> {
  return JSON.parse(`{"__proto__":{"marker":"${marker}"}}`);
}

function expectSafeResult(result: object, marker: string) {
  expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  expect(Reflect.get(result, "marker")).toBeUndefined();
  expect(Object.getOwnPropertyDescriptor(result, "__proto__")).toEqual({
    value: { marker },
    enumerable: true,
    configurable: true,
    writable: true,
  });
  expect(Object.hasOwn(Object.prototype, "marker")).toBe(false);
}

describe("vendored deepmerge prototype-poisoning regression", () => {
  it("keeps target-copy __proto__ as own data instead of changing the destination prototype", () => {
    const target = protoPayload("target-copy");
    const result = deepmerge(target, {});

    expectSafeResult(result, "target-copy");
    expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
    expect(Reflect.get(result, "__proto__")).not.toBe(
      Reflect.get(target, "__proto__"),
    );
  });

  it("keeps source-copy __proto__ safe when the target has no prototype", () => {
    const target: Record<string, unknown> = Object.create(null);
    const result = deepmerge(target, protoPayload("source-copy"));

    expectSafeResult(result, "source-copy");
    expect(Object.getPrototypeOf(target)).toBeNull();
    expect(Object.keys(target)).toEqual([]);
  });

  it("protects recursive merging of enumerable own __proto__ on both inputs", () => {
    const target: Record<string, unknown> = JSON.parse(
      '{"__proto__":{"left":true}}',
    );
    const source: Record<string, unknown> = JSON.parse(
      '{"__proto__":{"right":true}}',
    );
    const result = deepmerge(target, source);

    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.getOwnPropertyDescriptor(result, "__proto__")?.value).toEqual(
      {
        left: true,
        right: true,
      },
    );
    expect(Reflect.get(result, "left")).toBeUndefined();
    expect(Reflect.get(result, "right")).toBeUndefined();
  });

  it("protects the customMerge write path as an own data property", () => {
    const result = deepmerge(protoPayload("target"), protoPayload("source"), {
      customMerge: (key) =>
        key === "__proto__" ? () => ({ marker: "custom-merge" }) : undefined,
    });

    expectSafeResult(result, "custom-merge");
  });

  it("preserves the source guard against inherited and nonenumerable target keys", () => {
    const source: Record<string, unknown> = JSON.parse(
      '{"__proto__":{"marker":"blocked"},"constructor":{"prototype":{"marker":"blocked"}},"toString":"blocked","private":"blocked","safe":1}',
    );
    const target = Object.defineProperty({}, "private", {
      value: "original",
      enumerable: false,
    });
    const result = deepmerge(target, source);

    expect(result).toEqual({ safe: 1 });
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    for (const key of ["__proto__", "constructor", "toString", "private"]) {
      expect(Object.hasOwn(result, key)).toBe(false);
    }
  });

  it("protects nested target clones and source copies with clone disabled", () => {
    const nested = deepmerge({ profile: protoPayload("nested") }, {});
    // A nested clone starts with {}, so the existing source guard drops this key.
    expect(Object.getPrototypeOf(nested.profile)).toBe(Object.prototype);
    expect(Object.hasOwn(nested.profile, "__proto__")).toBe(false);
    expect(Reflect.get(nested.profile, "marker")).toBeUndefined();

    const source = protoPayload("no-clone");
    const result = deepmerge(Object.create(null), source, { clone: false });
    expectSafeResult(result, "no-clone");
    expect(Reflect.get(result, "__proto__")).toBe(
      Reflect.get(source, "__proto__"),
    );
  });
});

describe("vendored deepmerge compatibility", () => {
  it("merges nested settings, concatenates arrays, and does not mutate either input", () => {
    const target = { flags: { left: true }, rows: [{ id: 1 }] };
    const source = { flags: { right: true }, rows: [{ id: 2 }] };
    const result = deepmerge(target, source);

    expect(result).toEqual({
      flags: { left: true, right: true },
      rows: [{ id: 1 }, { id: 2 }],
    });
    expect(result.rows[0]).not.toBe(target.rows[0]);
    expect(result.rows[1]).not.toBe(source.rows[0]);
    expect(target).toEqual({ flags: { left: true }, rows: [{ id: 1 }] });
    expect(source).toEqual({ flags: { right: true }, rows: [{ id: 2 }] });
  });

  it("merges enumerable symbols and omits nonenumerable symbols", () => {
    const visible = Symbol("visible");
    const hidden = Symbol("hidden");
    const target = { [visible]: { left: true } };
    Object.defineProperty(target, hidden, { value: "private" });
    const result = deepmerge(target, { [visible]: { right: true } });

    expect(result[visible]).toEqual({ left: true, right: true });
    expect(Object.hasOwn(result, hidden)).toBe(false);
  });

  it("preserves custom arrayMerge and its cloning helper", () => {
    const source = [{ value: 2 }];
    const result = deepmerge([{ value: 1 }], source, {
      arrayMerge: (_target, values, options) =>
        values.map((value) =>
          options?.cloneUnlessOtherwiseSpecified(value, options),
        ),
    });

    expect(result).toEqual([{ value: 2 }]);
    expect(result[0]).not.toBe(source[0]);
  });

  it("preserves customMerge, mergeability, and clone:false behavior", () => {
    const merged = deepmerge(
      { labels: ["one"], settings: { left: true } },
      { labels: ["two"], settings: { right: true } },
      {
        customMerge: (key) =>
          key === "labels" ? (_target, source) => source : undefined,
      },
    );
    expect(merged).toEqual({
      labels: ["two"],
      settings: { left: true, right: true },
    });
    const opaque = { value: 1 };
    expect(
      deepmerge({}, { opaque }, { isMergeableObject: () => false }).opaque,
    ).toBe(opaque);
    expect(deepmerge({}, { opaque }, { clone: false }).opaque).toBe(opaque);
  });

  it("preserves special values and mismatched array/object handling", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    const pattern = /sample/i;
    const result = deepmerge({}, { date, pattern });
    expect(result.date).toBe(date);
    expect(result.pattern).toBe(pattern);
    expect(deepmerge({ left: 1 }, [2])).toEqual([2]);
    expect(deepmerge([1], { right: 2 })).toEqual({ right: 2 });
  });

  it("supports all() and rejects a non-array argument", () => {
    expect(deepmerge.all([{ a: 1 }, { b: 2 }, { a: 3 }])).toEqual({
      a: 3,
      b: 2,
    });
    expect(deepmerge.all([])).toEqual({});
    expect(() => Reflect.apply(deepmerge.all, undefined, [{}])).toThrow(
      "first argument should be an array",
    );
  });
});
