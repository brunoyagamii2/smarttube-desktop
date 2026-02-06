import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("youtube router (public access)", () => {
  it("search procedure works without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.youtube.search({ query: "test", language: "pt", country: "BR" });
      expect(result).toHaveProperty("videos");
      expect(result).toHaveProperty("cursorNext");
      expect(result).toHaveProperty("estimatedResults");
      expect(Array.isArray(result.videos)).toBe(true);
    } catch (error: any) {
      expect(error.message).not.toContain("No \"query\" found");
    }
  });

  it("trending procedure works without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.youtube.trending({ language: "pt", country: "BR" });
      expect(result).toHaveProperty("videos");
      expect(Array.isArray(result.videos)).toBe(true);
    } catch (error: any) {
      expect(error.message).not.toContain("No \"query\" found");
    }
  });

  it("suggestions procedure works without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.youtube.suggestions({ language: "pt", country: "BR" });
      expect(result).toHaveProperty("sections");
      expect(result).toHaveProperty("basedOnHistory");
      expect(Array.isArray(result.sections)).toBe(true);
    } catch (error: any) {
      expect(error.message).not.toContain("No \"query\" found");
    }
  });

  it("autocomplete procedure works without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.youtube.autocomplete({ query: "programação", language: "pt", country: "BR" });
      expect(result).toHaveProperty("suggestions");
      expect(Array.isArray(result.suggestions)).toBe(true);
    } catch (error: any) {
      expect(error.message).not.toContain("No \"query\" found");
    }
  });
});

describe("sponsorBlock router (public access)", () => {
  it("getSegments works without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.sponsorBlock.getSegments({
        videoId: "dQw4w9WgXcQ",
        categories: ["sponsor"],
      });
      expect(Array.isArray(result)).toBe(true);
    } catch (error: any) {
      expect(error.message).not.toContain("No \"query\" found");
    }
  });
});

describe("settings router (public access)", () => {
  it("get returns default settings without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.settings.get();
    expect(result).toHaveProperty("sponsorBlockEnabled", true);
    expect(result).toHaveProperty("defaultPlaybackSpeed", 1.0);
    expect(result).toHaveProperty("autoplay", true);
    expect(result).toHaveProperty("theme", "dark");
  });
});

describe("auth router", () => {
  it("me returns null for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toHaveProperty("id", 1);
    expect(result).toHaveProperty("name", "Test User");
  });

  it("logout clears cookie", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});
