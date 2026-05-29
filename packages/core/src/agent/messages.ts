export type UserMessageInput = {
  question: string;
  url?: string;
  imageBase64?: string;
  imageMediaType?: "image/png" | "image/jpeg" | "image/webp";
};

type Content =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: string;
        data: string;
      };
    };

export function buildUserMessage(input: UserMessageInput): {
  role: "user";
  content: Content[];
} {
  const blocks: Content[] = [];
  if (input.imageBase64) {
    blocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: input.imageMediaType ?? "image/png",
        data: input.imageBase64,
      },
    });
  }
  const lines: string[] = [];
  if (input.url) lines.push(`URL: ${input.url}`);
  lines.push(`질문: ${input.question}`);
  blocks.push({ type: "text", text: lines.join("\n") });
  return { role: "user", content: blocks };
}
