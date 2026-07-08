import { describe, it, expect } from "vitest";
import { isHoneypotTripped, clientIp, allowRequest } from "@/lib/antispam";

describe("isHoneypotTripped", () => {
  it("passes real submissions (honeypot empty/absent)", () => {
    expect(isHoneypotTripped({})).toBe(false);
    expect(isHoneypotTripped({ website: "" })).toBe(false);
    expect(isHoneypotTripped({ website: "   " })).toBe(false);
  });

  it("flags bot submissions (honeypot filled)", () => {
    expect(isHoneypotTripped({ website: "http://spam.example" })).toBe(true);
    expect(isHoneypotTripped({ website: "anything" })).toBe(true);
  });

  it("ignores non-string honeypot values", () => {
    expect(isHoneypotTripped({ website: 123 as unknown as string })).toBe(false);
  });
});

describe("clientIp", () => {
  it("prefers CF-Connecting-IP", () => {
    const req = new Request("https://x/", { headers: { "CF-Connecting-IP": "1.2.3.4" } });
    expect(clientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to the first x-forwarded-for entry", () => {
    const req = new Request("https://x/", { headers: { "x-forwarded-for": "5.6.7.8, 9.9.9.9" } });
    expect(clientIp(req)).toBe("5.6.7.8");
  });

  it("returns 'unknown' when no IP header is present", () => {
    expect(clientIp(new Request("https://x/"))).toBe("unknown");
  });
});

describe("allowRequest", () => {
  it("allows when KV is unavailable (no binding, e.g. tests/dev)", async () => {
    await expect(allowRequest("test", "id", 1, 60)).resolves.toBe(true);
  });
});
