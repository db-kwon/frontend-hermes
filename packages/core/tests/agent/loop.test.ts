import { describe, expect, it, vi } from "vitest";
import { runAgent } from "../../src/agent/index.js";
import type { Retriever } from "../../src/retriever/index.js";

function makeFakeClient(responses: any[]) {
  let i = 0;
  return {
    messages: {
      create: vi.fn(async () => responses[i++]),
    },
  } as any;
}

describe("runAgent", () => {
  it("executes one tool call then stops", async () => {
    const fakeRetriever = {
      routeFromUrl: () => ({ app: "admin", path: "/x", componentPath: "x.tsx" }),
    } as unknown as Retriever;

    const client = makeFakeClient([
      {
        stop_reason: "tool_use",
        content: [
          {
            type: "tool_use",
            id: "tu_1",
            name: "route_from_url",
            input: { url: "https://x/" },
          },
        ],
      },
      {
        stop_reason: "end_turn",
        content: [{ type: "text", text: "## 답변\nOK\n\n## 근거\n- x.tsx:1" }],
      },
    ]);

    const result = await runAgent({
      client,
      retriever: fakeRetriever,
      model: "claude-sonnet-4-6",
      input: { question: "test", url: "https://x/" },
    });

    expect(client.messages.create).toHaveBeenCalledTimes(2);
    expect(result.text).toContain("## 답변");
  });

  it("forces a final answer after maxIterations instead of throwing", async () => {
    const fakeRetriever = {
      routeFromUrl: () => null,
    } as unknown as Retriever;
    const toolLoop = {
      stop_reason: "tool_use",
      content: [
        {
          type: "tool_use",
          id: "tu_x",
          name: "route_from_url",
          input: { url: "https://x/" },
        },
      ],
    };
    // 2 tool-using iterations, then a final no-tools call yields the answer.
    const client = makeFakeClient([
      toolLoop,
      toolLoop,
      {
        stop_reason: "end_turn",
        content: [{ type: "text", text: "근거 부족: 확인했으나 단정 불가" }],
      },
    ]);

    const result = await runAgent({
      client,
      retriever: fakeRetriever,
      model: "claude-sonnet-4-6",
      input: { question: "loop" },
      maxIterations: 2,
    });

    // 2 loop iterations + 1 forced final call = 3
    expect(client.messages.create).toHaveBeenCalledTimes(3);
    expect(result.text).toContain("단정 불가");
  });

  it("returns a not-found message when the forced final answer is empty", async () => {
    const fakeRetriever = {
      routeFromUrl: () => null,
    } as unknown as Retriever;
    const toolLoop = {
      stop_reason: "tool_use",
      content: [
        { type: "tool_use", id: "tu_x", name: "route_from_url", input: {} },
      ],
    };
    const client = makeFakeClient([
      toolLoop,
      // forced final call returns no text blocks
      { stop_reason: "end_turn", content: [] },
    ]);

    const result = await runAgent({
      client,
      retriever: fakeRetriever,
      model: "claude-sonnet-4-6",
      input: { question: "loop" },
      maxIterations: 1,
    });

    expect(result.text).toContain("찾지 못했습니다");
  });
});
