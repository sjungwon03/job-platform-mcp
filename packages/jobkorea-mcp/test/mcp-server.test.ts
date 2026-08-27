import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "@theorvane/type-mcp";
import { describe, expect, it, vi } from "vitest";
import { JobKoreaMcpServer } from "../src/server.js";

describe("JobKoreaMcpServer", () => {
  it("registers both feeds and rejects unsafe parameter names", async () => {
    const instance = new JobKoreaMcpServer();
    instance.client = {
      fetchFeed: vi.fn(async () => ({ jobs: [] })),
    } as never;
    const server = await createMcpServer(JobKoreaMcpServer, {
      resolve: () => instance,
    });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "1.0.0" });

    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    await expect(client.listTools()).resolves.toMatchObject({
      tools: expect.arrayContaining([
        expect.objectContaining({ name: "jobkorea_fetch_jobs" }),
        expect.objectContaining({ name: "jobkorea_fetch_entry_jobs" }),
      ]),
    });
    await expect(
      client.callTool({
        name: "jobkorea_fetch_jobs",
        arguments: { parameters: { "bad parameter": "value" } },
      }),
    ).resolves.toMatchObject({ isError: true });
    expect(instance.client.fetchFeed).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });
});
