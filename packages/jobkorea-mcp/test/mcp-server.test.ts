import { createMcpServer } from "@theorvane/type-mcp";
import { createMcpTestSession } from "@theorvane/type-mcp/testing";
import { describe, expect, it, vi } from "vitest";
import { JobKoreaMcpServer } from "../src/server.js";

describe("JobKoreaMcpServer", () => {
  it("registers both feeds and rejects unsafe parameter names", async () => {
    const instance = new JobKoreaMcpServer();
    instance.client = {
      fetchFeed: vi.fn(async () => ({ jobs: [] })),
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
        expect.objectContaining({ name: "jobkorea_fetch_jobs" }),
        expect.objectContaining({ name: "jobkorea_fetch_entry_jobs" }),
      ]),
    );
    expect(
      tools.find(({ name }) => name === "jobkorea_fetch_jobs"),
    ).toMatchObject({
      description: expect.stringContaining("사용자별 가이드"),
      inputSchema: {
        properties: {
          parameters: {
            description: expect.stringContaining("덮어쓸 수 없음"),
          },
        },
      },
    });
    await expect(
      session.client.callTool({
        name: "jobkorea_get_search_options",
        arguments: {},
      }),
    ).resolves.toMatchObject({
      content: [
        {
          type: "text",
          text: expect.stringContaining("공통 공개 파라미터 명세가 없으므로"),
        },
      ],
    });
    await expect(
      session.client.callTool({
        name: "jobkorea_fetch_jobs",
        arguments: { parameters: { "bad parameter": "value" } },
      }),
    ).resolves.toMatchObject({ isError: true });
    expect(instance.client.fetchFeed).not.toHaveBeenCalled();

    await session.close();
  });
});
