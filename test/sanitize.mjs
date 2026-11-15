// Run after `npm run build`: node test/sanitize.mjs
import assert from "node:assert/strict";
import { sanitizeAnswer } from "../dist/notebooklm/chat.js";

assert.equal(
  sanitizeAnswer("Shrinks visceral fat\n1\n.\nKey details:\nHIIT works\n2\nmore_horiz\n."),
  "Shrinks visceral fat [1].\nKey details:\nHIIT works [2]."
);
assert.equal(sanitizeAnswer("A\n1\n2\n,\nB"), "A [1] [2],\nB");
assert.equal(sanitizeAnswer("more_vert\nPlain answer."), "Plain answer.");
console.log("sanitize: ok");
