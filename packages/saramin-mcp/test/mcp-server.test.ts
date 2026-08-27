import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "@theorvane/type-mcp";
import { describe, expect, it, vi } from "vitest";
import { SaraminMcpServer } from "../src/server.js";

describe("SaraminMcpServer", () => {
  it("registers both tools and validates input before API access", async () => {
    const instance = new SaraminMcpServer();
    instance.client = {
      get: vi.fn(async () => ({ jobs: { job: [] } })),
    } as never;
    const server = await createMcpServer(SaraminMcpServer, {
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
        expect.objectContaining({ name: "saramin_search_jobs" }),
        expect.objectContaining({ name: "saramin_get_job" }),
      ]),
    });
    await expect(
      client.callTool({
        name: "saramin_search_jobs",
        arguments: { count: 111 },
      }),
    ).resolves.toMatchObject({ isError: true });
    expect(instance.client.get).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });
});
