import type Anthropic from "@anthropic-ai/sdk";
import type { Retriever } from "../retriever/index.js";
import { TOOL_DEFINITIONS, executeTool } from "../tools/index.js";
import { SYSTEM_PROMPT } from "./systemPrompt.js";
import { buildUserMessage, type UserMessageInput } from "./messages.js";

export type AgentInput = UserMessageInput;

export type AgentResult = {
  text: string;
  toolCalls: { name: string; input: unknown }[];
};

export type RunAgentArgs = {
  client: Anthropic;
  retriever: Retriever;
  model: string;
  input: AgentInput;
  maxIterations?: number;
  onTrace?: (event:
    | { kind: "tool_use"; name: string; input: unknown }
    | { kind: "tool_result"; name: string; result: unknown }
    | { kind: "text"; text: string }
  ) => void;
};

export async function runAgent(args: RunAgentArgs): Promise<AgentResult> {
  const max = args.maxIterations ?? 10;
  const messages: any[] = [buildUserMessage(args.input)];
  const toolCalls: { name: string; input: unknown }[] = [];

  for (let i = 0; i < max; i++) {
    const response = await args.client.messages.create({
      model: args.model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: TOOL_DEFINITIONS as any,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "tool_use") {
      const toolResults: any[] = [];
      for (const block of response.content) {
        if ((block as any).type !== "tool_use") continue;
        const tu = block as { id: string; name: string; input: unknown };
        toolCalls.push({ name: tu.name, input: tu.input });
        args.onTrace?.({ kind: "tool_use", name: tu.name, input: tu.input });
        try {
          const result = await executeTool(args.retriever, tu.name, tu.input);
          args.onTrace?.({
            kind: "tool_result",
            name: tu.name,
            result,
          });
          toolResults.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify(result ?? null),
          });
        } catch (err) {
          const message = String((err as Error).message);
          args.onTrace?.({
            kind: "tool_result",
            name: tu.name,
            result: { error: message },
          });
          toolResults.push({
            type: "tool_result",
            tool_use_id: tu.id,
            is_error: true,
            content: message,
          });
        }
      }
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    if (response.stop_reason === "max_tokens") {
      throw new Error(
        "Response truncated: stop_reason=max_tokens. Consider raising max_tokens."
      );
    }

    const text = response.content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("\n");
    args.onTrace?.({ kind: "text", text });
    return { text, toolCalls };
  }

  throw new Error(`Agent exceeded maxIterations=${max}`);
}
