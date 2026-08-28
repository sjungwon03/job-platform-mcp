import { createMcpServer } from "@theorvane/type-mcp";
import { createMcpTestSession } from "@theorvane/type-mcp/testing";
import { describe, expect, it, vi } from "vitest";
import { SaraminMcpServer } from "../src/server.js";

describe("SaraminMcpServer", () => {
  it("registers both tools and validates input before API access", async () => {
    const instance = new SaraminMcpServer();
    instance.client = {
      get: vi.fn(async () => ({ jobs: { job: [] } })),
    } as never;
    const session = await createMcpTestSession(
      createMcpServer(SaraminMcpServer, {
        resolve: () => instance,
      }),
      { client: { name: "test-client", version: "1.0.0" } },
    );

    const tools = (await session.client.listTools()).tools;
    expect(tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "saramin_get_search_options" }),
        expect.objectContaining({ name: "saramin_search_jobs" }),
        expect.objectContaining({ name: "saramin_get_job" }),
      ]),
    );
    expect(
      tools.find(({ name }) => name === "saramin_search_jobs"),
    ).toMatchObject({
      description: expect.stringContaining("saramin_get_search_options"),
      inputSchema: {
        properties: {
          job_type: { description: expect.stringContaining("1~22") },
          edu_lv: { description: expect.stringContaining("0~9") },
          count: { default: 10, maximum: 110 },
          sort: {
            default: "pd",
            description: expect.stringContaining("지원자 수"),
          },
        },
      },
    });
    await expect(
      session.client.callTool({
        name: "saramin_get_search_options",
        arguments: {},
      }),
    ).resolves.toMatchObject({
      content: [
        { type: "text", text: expect.stringContaining("전문연구요원") },
      ],
    });
    await expect(
      session.client.callTool({
        name: "saramin_search_jobs",
        arguments: { count: 111 },
      }),
    ).resolves.toMatchObject({ isError: true });
    expect(instance.client.get).not.toHaveBeenCalled();

    await session.close();
  });
});
