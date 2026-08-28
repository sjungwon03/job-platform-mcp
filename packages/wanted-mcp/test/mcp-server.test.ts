import { createMcpServer } from "@theorvane/type-mcp";
import { createMcpTestSession } from "@theorvane/type-mcp/testing";
import { describe, expect, it, vi } from "vitest";
import { WantedMcpServer } from "../src/server.js";

describe("WantedMcpServer", () => {
  it("registers the jobs tool and validates input before API access", async () => {
    const instance = new WantedMcpServer();
    instance.client = {
      get: vi.fn(async () => ({ items: [] })),
    } as never;
    const session = await createMcpTestSession(
      createMcpServer(WantedMcpServer, {
        resolve: () => instance,
      }),
      { client: { name: "test-client", version: "1.0.0" } },
    );

    const tools = (await session.client.listTools()).tools;
    expect(tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "wanted_get_search_options" }),
        expect.objectContaining({ name: "wanted_list_jobs" }),
      ]),
    );
    expect(tools.find(({ name }) => name === "wanted_list_jobs")).toMatchObject(
      {
        description: expect.stringContaining("wanted_get_search_options"),
        inputSchema: {
          properties: {
            skill_tags: { maxItems: 5 },
            years: { maxItems: 2 },
            sort: {
              default: "job.latest_order",
              description: expect.stringContaining("기업 응답률순"),
            },
          },
        },
      },
    );
    await expect(
      session.client.callTool({
        name: "wanted_get_search_options",
        arguments: {},
      }),
    ).resolves.toMatchObject({
      content: [
        { type: "text", text: expect.stringContaining("job.latest_order") },
      ],
    });
    await expect(
      session.client.callTool({
        name: "wanted_list_jobs",
        arguments: { skill_tags: [1, 2, 3, 4, 5, 6] },
      }),
    ).resolves.toMatchObject({ isError: true });
    expect(instance.client.get).not.toHaveBeenCalled();

    await session.close();
  });
});
