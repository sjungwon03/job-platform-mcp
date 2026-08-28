import { createMcpServer } from "@theorvane/type-mcp";
import { createMcpTestSession } from "@theorvane/type-mcp/testing";
import { describe, expect, it, vi } from "vitest";
import { WantedMcpServer } from "../src/server.js";

describe("WantedMcpServer", () => {
  it("registers visible-browser tools and validates consent before launch", async () => {
    const instance = new WantedMcpServer();
    instance.client = {
      search: vi.fn(async () => ({
        provider: "wanted",
        mode: "visible-browser",
        searchUrl: "https://example.invalid",
        resultCount: 0,
        results: [],
      })),
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
        expect.objectContaining({
          name: "wanted_search_jobs",
          description: expect.stringContaining("화면이 보이는 브라우저"),
        }),
      ]),
    );
    expect(
      tools.find(({ name }) => name === "wanted_search_jobs"),
    ).toMatchObject({
      inputSchema: {
        properties: {
          locations: { maxItems: 5 },
          limit: { default: 10, maximum: 20 },
          acknowledgePersonalUse: {
            description: expect.stringContaining("개인·비상업용"),
          },
        },
      },
    });

    await expect(
      session.client.callTool({
        name: "wanted_search_jobs",
        arguments: { query: "백엔드" },
      }),
    ).resolves.toMatchObject({ isError: true });
    expect(instance.client.search).not.toHaveBeenCalled();

    await session.close();
  });
});
