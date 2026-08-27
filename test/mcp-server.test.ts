import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "@theorvane/type-mcp";
import { describe, expect, it, vi } from "vitest";
import { WantedMcpServer } from "../src/server.js";

describe("WantedMcpServer", () => {
  it("registers the jobs tool and validates input before API access", async () => {
    const instance = new WantedMcpServer();
    instance.client = {
      get: vi.fn(async () => ({ items: [] })),
    } as never;
    const server = await createMcpServer(WantedMcpServer, {
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
        expect.objectContaining({ name: "wanted_list_jobs" }),
      ]),
    });
    await expect(
      client.callTool({
        name: "wanted_list_jobs",
        arguments: { skill_tags: [1, 2, 3, 4, 5, 6] },
      }),
    ).resolves.toMatchObject({ isError: true });
    expect(instance.client.get).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });
});
