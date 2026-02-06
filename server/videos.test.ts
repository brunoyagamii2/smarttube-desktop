import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
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

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("videos procedures", () => {
  it("should list videos for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.videos.list({ limit: 10, offset: 0 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should search videos by query", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.videos.search({ query: "test", limit: 10 });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("playlists procedures", () => {
  it("should list playlists for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.playlists.list();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("history procedures", () => {
  it("should list watch history for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.history.list({ limit: 10 });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("settings procedures", () => {
  it("should get user settings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.settings.get();

    expect(result).toBeDefined();
    expect(typeof result.defaultPlaybackSpeed).toBe("number");
    expect(typeof result.autoplay).toBe("boolean");
    expect(typeof result.sponsorBlockEnabled).toBe("boolean");
  });
});
