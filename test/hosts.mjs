// Run after `npm run build`: node test/hosts.mjs
import assert from "node:assert/strict";
import { isNotebookLmUrl } from "../dist/config.js";

assert.ok(isNotebookLmUrl("https://notebooklm.google.com/"));
assert.ok(isNotebookLmUrl("https://notebook.google.com/notebook/2b44cf51-21c0-4931-a8e9-7bf29401943d"));
assert.ok(!isNotebookLmUrl("https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fnotebook.google.com%2F"));
assert.ok(!isNotebookLmUrl("http://notebook.google.com/"));
assert.ok(!isNotebookLmUrl("https://notebook.google.com.evil.example/"));
assert.ok(!isNotebookLmUrl("not a url"));
console.log("hosts: ok");
