import React from "react";
import { vi } from "vitest";
import { find } from "../u1-company-notes/hookHarness";
export {
  HookHarness,
  button,
  find,
  invoke,
  text,
  elements,
} from "../u1-company-notes/hookHarness";
export const control = (tree: React.ReactNode, id: string) =>
  find(tree, (e) => e.props["data-testid"] === id);
export const change = (value: string) => ({ target: { value } });
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
