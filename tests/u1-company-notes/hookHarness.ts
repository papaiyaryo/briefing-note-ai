import React from "react";
import { vi } from "vitest";
interface Dispatcher {
  state: (initial: unknown) => [unknown, (value: unknown) => void];
  ref: (initial: unknown) => { current: unknown };
  memo: (factory: () => unknown, deps?: readonly unknown[]) => unknown;
  effect: (
    effect: () => void | (() => void),
    deps?: readonly unknown[],
  ) => void;
  context: unknown;
  id: () => string;
}
const control = vi.hoisted(() => ({ active: null as Dispatcher | null }));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  const overrides = {
    useState: (initial: unknown) =>
      control.active ? control.active.state(initial) : actual.useState(initial),
    useRef: (initial: unknown) =>
      control.active ? control.active.ref(initial) : actual.useRef(initial),
    useMemo: (factory: () => unknown, deps?: readonly unknown[]) =>
      control.active
        ? control.active.memo(factory, deps)
        : actual.useMemo(factory, deps!),
    useCallback: (callback: () => unknown, deps?: readonly unknown[]) =>
      control.active
        ? control.active.memo(() => callback, deps)
        : actual.useCallback(callback, deps!),
    useEffect: (
      effect: () => void | (() => void),
      deps?: readonly unknown[],
    ) =>
      control.active
        ? control.active.effect(effect, deps)
        : actual.useEffect(effect, deps),
    useContext: (context: React.Context<unknown>) =>
      control.active ? control.active.context : actual.useContext(context),
    useId: () => (control.active ? control.active.id() : actual.useId()),
  };
  return {
    ...actual,
    ...overrides,
    default: { ...actual, ...overrides },
  };
});
type Slot = {
  value?: unknown;
  deps?: readonly unknown[];
  cleanup?: () => void;
};
const same = (a?: readonly unknown[], b?: readonly unknown[]) =>
  !!a &&
  !!b &&
  a.length === b.length &&
  a.every((item, index) => Object.is(item, b[index]));
/** Node単体試験の状態制御。DOM・focus・browser受入は再現しない。 */
export class HookHarness implements Dispatcher {
  private slots: Slot[] = [];
  private cursor = 0;
  private effects: (() => void)[] = [];
  tree: React.ReactNode = null;
  constructor(
    private readonly component: () => React.ReactNode,
    readonly context: unknown = null,
  ) {}
  state(initial: unknown): [unknown, (value: unknown) => void] {
    const index = this.cursor++;
    if (!this.slots[index])
      this.slots[index] = {
        value:
          typeof initial === "function"
            ? (initial as () => unknown)()
            : initial,
      };
    const slot = this.slots[index];
    return [
      slot.value,
      (value) => {
        slot.value =
          typeof value === "function"
            ? (value as (previous: unknown) => unknown)(slot.value)
            : value;
      },
    ];
  }
  ref(initial: unknown) {
    const index = this.cursor++;
    if (!this.slots[index]) this.slots[index] = { value: { current: initial } };
    return this.slots[index].value as { current: unknown };
  }
  memo(factory: () => unknown, deps?: readonly unknown[]) {
    const index = this.cursor++,
      prior = this.slots[index];
    if (!prior || !same(prior.deps, deps))
      this.slots[index] = { value: factory(), deps };
    return this.slots[index].value;
  }
  effect(effect: () => void | (() => void), deps?: readonly unknown[]) {
    const index = this.cursor++,
      prior = this.slots[index];
    if (!prior || !same(prior.deps, deps)) {
      this.slots[index] = { deps };
      this.effects.push(() => {
        prior?.cleanup?.();
        const cleanup = effect();
        if (cleanup) this.slots[index].cleanup = cleanup;
      });
    }
  }
  id() {
    const index = this.cursor++;
    return `unit-control-${index}`;
  }
  render() {
    this.cursor = 0;
    control.active = this;
    try {
      this.tree = this.component();
      return this.tree;
    } finally {
      control.active = null;
    }
  }
  async settle(microtaskPasses = 12) {
    for (let pass = 0; pass < microtaskPasses; pass++) {
      for (const effect of this.effects.splice(0)) effect();
      await Promise.resolve();
      this.render();
    }
    // Response.jsonを含む直列mock処理のmicrotaskを1turnだけ排出する。
    // 実I/Oの完了待ちや製品側のtimeout・再試行を代行しない。
    await new Promise<void>((resolve) => setImmediate(resolve));
    this.render();
  }
  unmount() {
    for (const slot of this.slots) slot?.cleanup?.();
  }
}
export type Element = React.ReactElement<Record<string, unknown>>;
export function elements(tree: React.ReactNode): Element[] {
  if (Array.isArray(tree)) return tree.flatMap(elements);
  if (!React.isValidElement(tree)) return [];
  const element = tree as Element;
  return [element, ...elements(element.props.children as React.ReactNode)];
}
export function text(tree: React.ReactNode): string {
  if (typeof tree === "string" || typeof tree === "number") return String(tree);
  if (Array.isArray(tree)) return tree.map(text).join("");
  if (React.isValidElement(tree))
    return text((tree.props as { children?: React.ReactNode }).children);
  return "";
}
export function find(
  tree: React.ReactNode,
  predicate: (element: Element) => boolean,
): Element {
  const result = elements(tree).find(predicate);
  if (!result) throw new Error("expected visible control missing");
  return result;
}
export function button(tree: React.ReactNode, label: string) {
  return find(
    tree,
    (element) =>
      (element.type === "button" || typeof element.type === "function") &&
      text(element.props.children as React.ReactNode) === label,
  );
}
export async function invoke(
  element: Element,
  name: string,
  ...args: unknown[]
) {
  const callback = element.props[name];
  if (typeof callback !== "function") throw new Error(`control lacks ${name}`);
  return await callback(...args);
}
