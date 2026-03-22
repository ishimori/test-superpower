import { resolveRowClass, resolveNumberClass } from "@/components/ui/row-color-resolver";

test("null status_flag returns empty string", () => {
  expect(resolveRowClass(null)).toBe("");
});

test("unknown status_flag returns empty string", () => {
  expect(resolveRowClass("unknown_value")).toBe("");
});

test("negative number returns red class", () => {
  expect(resolveNumberClass(-1000)).toContain("text-red-600");
});

test("positive number returns empty string", () => {
  expect(resolveNumberClass(1000)).toBe("");
});
