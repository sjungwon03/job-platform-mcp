import { createMcpServer } from "@theorvane/type-mcp";
import { createMcpTestSession } from "@theorvane/type-mcp/testing";
import { describe, expect, it, vi } from "vitest";
import { JobKoreaMcpServer } from "../src/server.js";

describe("JobKoreaMcpServer", () => {
  it("registers visible-browser tools and validates consent before launch", async () => {
    const instance = new JobKoreaMcpServer();
    instance.client = {
      search: vi.fn(async () => ({
        provider: "jobkorea",
        mode: "visible-browser",
        searchUrl: "https://example.invalid",
        resultCount: 0,
        results: [],
      })),
    } as never;
    const session = await createMcpTestSession(
      createMcpServer(JobKoreaMcpServer, {
        resolve: () => instance,
      }),
      { client: { name: "test-client", version: "1.0.0" } },
    );

    const tools = (await session.client.listTools()).tools;
    expect(tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "jobkorea_get_search_options" }),
        expect.objectContaining({
          name: "jobkorea_search_jobs",
          description: expect.stringContaining("화면이 보이는 브라우저"),
        }),
      ]),
    );
    expect(
      tools.find(({ name }) => name === "jobkorea_search_jobs"),
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
        name: "jobkorea_search_jobs",
        arguments: { query: "백엔드" },
      }),
    ).resolves.toMatchObject({ isError: true });
    expect(instance.client.search).not.toHaveBeenCalled();

    await session.close();
  });
});
