import { describe, expect, it } from "vitest";
import { buildUserMessage } from "../../src/agent/messages.js";

describe("buildUserMessage", () => {
  it("composes text-only message", () => {
    const msg = buildUserMessage({
      question: "이 페이지 API 알려줘",
      url: "https://stage.babitalk.com/hospital/3",
    });
    expect(msg.role).toBe("user");
    expect(Array.isArray(msg.content)).toBe(true);
    const textPart = (msg.content as Array<{ type: string; text?: string }>).find(
      (c) => c.type === "text"
    );
    expect(textPart?.text).toContain("이 페이지 API 알려줘");
    expect(textPart?.text).toContain(
      "https://stage.babitalk.com/hospital/3"
    );
  });

  it("includes image block when imageBase64 provided", () => {
    const msg = buildUserMessage({
      question: "이거 뭐야",
      imageBase64: "iVBORw0KGgo=",
      imageMediaType: "image/png",
    });
    const imagePart = (msg.content as Array<{ type: string }>).find(
      (c) => c.type === "image"
    );
    expect(imagePart).toBeDefined();
  });
});
