import React from "react";
import { vi } from "vitest";
import { find, elements, HookHarness } from "../u1-company-notes/hookHarness";
export {
  HookHarness,
  button,
  find,
  invoke,
  text,
  elements,
} from "../u1-company-notes/hookHarness";
export const named = (tree: React.ReactNode, name: string) =>
  find(tree, (e) => typeof e.type === "function" && e.type.name === name);
export const field = (tree: React.ReactNode, id: string) =>
  find(tree, (e) => e.props["data-testid"] === id);
export const change = (value: string) => ({ target: { value } });
/** Mount the actual child with fresh hooks after conditional removal by its parent. */
export class ConditionalChild<P extends object> {
  private element: React.ReactElement<P> | null = null;
  private child: HookHarness | null = null;
  mounts = 0;
  unmounts = 0;
  constructor(private readonly component: (props: P) => React.ReactNode) {}
  get tree() {
    return this.child?.tree ?? null;
  }
  async sync(parent: React.ReactNode) {
    this.element = (elements(parent).find((e) => e.type === this.component) ??
      null) as React.ReactElement<P> | null;
    if (!this.element) {
      if (this.child) {
        this.child.unmount();
        this.unmounts++;
        this.child = null;
      }
      return;
    }
    if (!this.child) {
      this.child = new HookHarness(() => this.component(this.element!.props));
      this.mounts++;
    }
    this.child.render();
    await this.child.settle();
  }
  unmount() {
    this.child?.unmount();
    this.child = null;
  }
}
/** Node callback fixtures only; this is not a DOM or browser runner. */
export function browserGlobals() {
  vi.stubGlobal(
    "window",
    Object.assign(new EventTarget(), {
      location: new URL("http://localhost/"),
      setTimeout,
      clearTimeout,
    }),
  );
  vi.stubGlobal(
    "document",
    Object.assign(new EventTarget(), {
      activeElement: null,
      querySelector: () => null,
      body: { appendChild: vi.fn() },
      createElement: () => ({
        click: vi.fn(),
        remove: vi.fn(),
        href: "",
        download: "",
        rel: "",
      }),
    }),
  );
}
