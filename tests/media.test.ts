import { describe, it, expect } from "vitest";
import { isMediaKey, isVideoKey, isImageKey, extractMediaKey, usedMediaKeys, formatBytes } from "@/lib/media";

describe("media helpers", () => {
  it("distingue chave de mídia de contador de anti-spam", () => {
    expect(isMediaKey("1785799602673-dce5b5a8.webp")).toBe(true);
    expect(isMediaKey("1785799602673-dce5b5a8.mp4")).toBe(true);
    expect(isMediaKey("login:fail:admin@x.com")).toBe(false);
    expect(isMediaKey("rl:login-ip:1.2.3.4")).toBe(false);
  });

  it("separa imagem de vídeo", () => {
    expect(isVideoKey("a.mp4")).toBe(true);
    expect(isVideoKey("a.webp")).toBe(false);
    expect(isImageKey("a.webp")).toBe(true);
    expect(isImageKey("a.mov")).toBe(false);
  });

  it("extrai a chave de uma URL servida", () => {
    expect(extractMediaKey("/api/media/123-ab.webp")).toBe("123-ab.webp");
    expect(extractMediaKey("https://x/api/media/123-ab.png?y=1")).toBe("123-ab.png");
    expect(extractMediaKey(undefined)).toBeNull();
    expect(extractMediaKey("https://res.cloudinary.com/x.jpg")).toBeNull();
  });

  it("acha TODAS as chaves referenciadas em qualquer campo/edição", () => {
    const content = {
      editions: [
        { branding: { logo: "/api/media/logo-1.webp", favicon: "/api/media/fav-2.png" } },
        {
          customSections: [
            { blocks: [{ heroCarousels: [{ slides: [{ image: "/api/media/hero-3.webp" }] }] }] },
          ],
        },
      ],
    };
    const used = usedMediaKeys(content);
    expect(used.has("logo-1.webp")).toBe(true);
    expect(used.has("fav-2.png")).toBe(true);
    expect(used.has("hero-3.webp")).toBe(true);
    expect(used.has("nao-existe.webp")).toBe(false);
    expect(used.size).toBe(3);
  });

  it("formata bytes", () => {
    expect(formatBytes(0)).toBe("—");
    expect(formatBytes(undefined)).toBe("—");
    expect(formatBytes(182 * 1024)).toBe("182 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
