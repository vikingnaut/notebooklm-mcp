// Dev harness: spawn the built server over stdio, call one tool, print the
// result. Server logs stream to this process's stderr.
// Usage: node scripts/probe-ask.mjs <tool> '<json args>'
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const [tool = "get_health", args = "{}"] = process.argv.slice(2);
const transport = new StdioClientTransport({
  command: "node",
  args: [new URL("../dist/index.js", import.meta.url).pathname],
  stderr: "inherit",
  env: { ...process.env, ...(process.env.PROBE_ENV ? JSON.parse(process.env.PROBE_ENV) : {}) },
});
const client = new Client({ name: "probe", version: "0" });
await client.connect(transport);
const t0 = Date.now();
const res = await client.callTool({ name: tool, arguments: JSON.parse(args) }, undefined, {
  timeout: 900_000,
});
console.log(`\n=== ${tool} (${((Date.now() - t0) / 1000).toFixed(1)}s) ===`);
console.log(JSON.stringify(res, null, 2).slice(0, 20000));
await client.close();
