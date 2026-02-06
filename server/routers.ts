import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { generateImage } from "./_core/imageGeneration";
import { transcribeAudio } from "./_core/voiceTranscription";
import { callDataApi } from "./_core/dataApi";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";

// ============= YouTube API Types =============
interface YouTubeVideoResult {
  type: string;
  video?: {
    videoId: string;
    title: string;
    author?: {
      title: string;
      channelId: string;
      avatar?: Array<{ url: string; width: number; height: number }>;
      badges?: Array<{ text: string; type: string }>;
    };
    thumbnails?: Array<{ url: string; width: number; height: number }>;
    movingThumbnails?: Array<{ url: string; width: number; height: number }>;
    lengthSeconds?: number;
    publishedTimeText?: string;
    stats?: { views: number };
    descriptionSnippet?: string;
    badges?: string[];
    isLiveNow?: boolean;
  };
}

interface YouTubeSearchResponse {
  contents: YouTubeVideoResult[];
  cursorNext?: string;
  estimatedResults?: number;
  refinements?: string[];
}

function formatYouTubeVideo(item: YouTubeVideoResult) {
  const v = item.video;
  if (!v) return null;
  return {
    videoId: v.videoId,
    title: v.title || "Sem título",
    channelName: v.author?.title || "Canal desconhecido",
    channelId: v.author?.channelId || "",
    channelAvatar: v.author?.avatar?.[0]?.url || "",
    channelVerified: v.author?.badges?.some(b => b.type === "VERIFIED_CHANNEL") || false,
    thumbnailUrl: v.thumbnails?.[v.thumbnails.length - 1]?.url || v.thumbnails?.[0]?.url || "",
    duration: v.lengthSeconds || 0,
    publishedTimeText: v.publishedTimeText || "",
    views: v.stats?.views || 0,
    description: v.descriptionSnippet || "",
    isLive: v.isLiveNow || false,
  };
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  playlists: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getPlaylistsByUserId(ctx.user.id);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlaylistById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        isPublic: z.boolean().optional().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createPlaylist({
          ...input,
          userId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return await db.updatePlaylist(id, updates);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deletePlaylist(input.id);
      }),

    getItems: protectedProcedure
      .input(z.object({ playlistId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlaylistItems(input.playlistId);
      }),

    addVideo: protectedProcedure
      .input(z.object({
        playlistId: z.number(),
        videoId: z.number(),
        position: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.addVideoToPlaylist(input);
      }),

    removeVideo: protectedProcedure
      .input(z.object({ playlistItemId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.removeVideoFromPlaylist(input.playlistItemId);
      }),

    reorderItems: protectedProcedure
      .input(z.object({
        playlistId: z.number(),
        items: z.array(z.object({
          id: z.number(),
          position: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        return await db.reorderPlaylistItems(input.playlistId, input.items);
      }),
  }),

  settings: router({
    get: publicProcedure
      .query(async ({ ctx }) => {
        if (ctx.user) {
          const settings = await db.getUserSettings(ctx.user.id);
          if (settings) return settings;
        }
        // Return default settings for unauthenticated users
        return {
          userId: ctx.user?.id || 0,
          defaultPlaybackSpeed: 1.0,
          defaultQuality: "auto",
          autoplay: true,
          sponsorBlockEnabled: true,
          sponsorBlockCategories: ["sponsor", "intro", "outro", "selfpromo"],
          autoGenerateCaptions: false,
          theme: "dark" as const,
        };
      }),

    update: protectedProcedure
      .input(z.object({
        defaultPlaybackSpeed: z.number().optional(),
        defaultQuality: z.string().optional(),
        autoplay: z.boolean().optional(),
        sponsorBlockEnabled: z.boolean().optional(),
        sponsorBlockCategories: z.array(z.string()).optional(),
        autoGenerateCaptions: z.boolean().optional(),
        theme: z.enum(["light", "dark", "system"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.upsertUserSettings({
          userId: ctx.user.id,
          ...input,
        });
      }),
  }),

  sponsorBlock: router({
    getSegments: publicProcedure
      .input(z.object({
        videoId: z.string(),
        categories: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        const categories = input.categories || ["sponsor", "intro", "outro", "selfpromo"];
        const url = `https://sponsor.ajay.app/api/skipSegments?videoID=${input.videoId}&categories=${JSON.stringify(categories)}`;
        try {
          const response = await fetch(url);
          if (!response.ok) return [];
          const data = await response.json();
          return data;
        } catch (error) {
          console.error("SponsorBlock API error:", error);
          return [];
        }
      }),
  }),

  youtubeHistory: router({
    save: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        youtubeVideoId: z.string(),
        title: z.string(),
        channelName: z.string().optional(),
        channelId: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        duration: z.number().default(0),
        currentTime: z.number().default(0),
        completed: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        return await db.upsertYouTubeHistory(input);
      }),

    list: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        limit: z.number().optional().default(50),
      }))
      .query(async ({ input }) => {
        return await db.getYouTubeHistory(input.sessionId, input.limit);
      }),

    getForVideo: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        youtubeVideoId: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getYouTubeHistoryByVideoId(input.sessionId, input.youtubeVideoId);
      }),
  }),

  youtube: router({
    autocomplete: publicProcedure
      .input(z.object({
        query: z.string().min(1),
        language: z.string().optional().default("pt"),
        country: z.string().optional().default("BR"),
      }))
      .query(async ({ input }) => {
        try {
          const url = `https://clients1.google.com/complete/search?client=youtube&hl=${input.language}&gl=${input.country}&ds=yt&q=${encodeURIComponent(input.query)}`;
          const response = await fetch(url);
          const text = await response.text();

          const jsonStr = text.replace(/^window\.google\.ac\.h\(/, "").replace(/\)$/, "");
          const data = JSON.parse(jsonStr);
          const suggestions: string[] = (data[1] || []).map((item: any[]) => item[0]);

          return { suggestions };
        } catch (error) {
          console.error("YouTube autocomplete error:", error);
          return { suggestions: [] };
        }
      }),

    search: publicProcedure
      .input(z.object({
        query: z.string().min(1),
        cursor: z.string().optional(),
        language: z.string().optional().default("pt"),
        country: z.string().optional().default("BR"),
      }))
      .query(async ({ input }) => {
        try {
          const result = await callDataApi("Youtube/search", {
            query: {
              q: input.query,
              hl: input.language,
              gl: input.country,
              ...(input.cursor ? { cursor: input.cursor } : {}),
            },
          }) as YouTubeSearchResponse;

          const videos = (result.contents || [])
            .filter((item) => item.type === "video" && item.video)
            .map(formatYouTubeVideo)
            .filter(Boolean);

          return {
            videos,
            cursorNext: result.cursorNext || null,
            estimatedResults: result.estimatedResults || 0,
            refinements: result.refinements || [],
          };
        } catch (error) {
          console.error("YouTube search error:", error);
          return { videos: [], cursorNext: null, estimatedResults: 0, refinements: [] };
        }
      }),

    trending: publicProcedure
      .input(z.object({
        language: z.string().optional().default("pt"),
        country: z.string().optional().default("BR"),
      }))
      .query(async ({ input }) => {
        try {
          const result = await callDataApi("Youtube/search", {
            query: {
              q: "trending",
              hl: input.language,
              gl: input.country,
            },
          }) as YouTubeSearchResponse;

          const videos = (result.contents || [])
            .filter((item) => item.type === "video" && item.video)
            .map(formatYouTubeVideo)
            .filter(Boolean);

          return { videos };
        } catch (error) {
          console.error("YouTube trending error:", error);
          return { videos: [] };
        }
      }),

    channelVideos: publicProcedure
      .input(z.object({
        channelId: z.string(),
        cursor: z.string().optional(),
        language: z.string().optional().default("pt"),
        country: z.string().optional().default("BR"),
      }))
      .query(async ({ input }) => {
        try {
          const result = await callDataApi("Youtube/get_channel_videos", {
            query: {
              id: input.channelId,
              filter: "videos_latest",
              hl: input.language,
              gl: input.country,
              ...(input.cursor ? { cursor: input.cursor } : {}),
            },
          }) as YouTubeSearchResponse;

          const videos = (result.contents || [])
            .filter((item) => item.type === "video" && item.video)
            .map(formatYouTubeVideo)
            .filter(Boolean);

          return {
            videos,
            cursorNext: result.cursorNext || null,
          };
        } catch (error) {
          console.error("YouTube channel videos error:", error);
          return { videos: [], cursorNext: null };
        }
      }),

    suggestions: publicProcedure
      .input(z.object({
        sessionId: z.string().optional(),
        language: z.string().optional().default("pt"),
        country: z.string().optional().default("BR"),
      }))
      .query(async ({ input }) => {
        try {
          let watchedTitles: string[] = [];

          // Get YouTube watch history for suggestions
          if (input.sessionId) {
            const history = await db.getYouTubeHistory(input.sessionId, 20);
            watchedTitles = history
              .map(h => h.title)
              .filter(Boolean)
              .slice(0, 10);
          }

          let searchQueries: string[] = [];

          if (watchedTitles.length > 0) {
            try {
              const response = await invokeLLM({
                messages: [
                  {
                    role: "system",
                    content: "You are a video recommendation engine. Given a list of recently watched video titles, generate 4 diverse YouTube search queries that the user would likely enjoy. Return ONLY a JSON array of strings, nothing else. Each query should be 2-5 words. Mix between similar content and discovery.",
                  },
                  {
                    role: "user",
                    content: `Recently watched videos:\n${watchedTitles.join("\n")}\n\nGenerate 4 search queries in ${input.language === "pt" ? "Portuguese" : "English"}:`,
                  },
                ],
                response_format: {
                  type: "json_schema",
                  json_schema: {
                    name: "search_queries",
                    strict: true,
                    schema: {
                      type: "object",
                      properties: {
                        queries: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                      required: ["queries"],
                      additionalProperties: false,
                    },
                  },
                },
              });

              const rawContent = response.choices[0]?.message?.content;
              const contentStr = typeof rawContent === "string" ? rawContent : "{}";
              const parsed = JSON.parse(contentStr);
              searchQueries = parsed.queries || [];
            } catch (llmError) {
              console.error("LLM suggestion error:", llmError);
              searchQueries = watchedTitles.slice(0, 4);
            }
          } else {
            searchQueries = [
              "melhores vídeos tecnologia 2026",
              "tutoriais programação",
              "música para estudar",
              "documentários interessantes",
            ];
          }

          const allResults = await Promise.all(
            searchQueries.slice(0, 4).map(async (query) => {
              try {
                const result = await callDataApi("Youtube/search", {
                  query: {
                    q: query,
                    hl: input.language,
                    gl: input.country,
                  },
                }) as YouTubeSearchResponse;

                const videos = (result.contents || [])
                  .filter((item) => item.type === "video" && item.video)
                  .map(formatYouTubeVideo)
                  .filter(Boolean)
                  .slice(0, 6);

                return { category: query, videos };
              } catch {
                return { category: query, videos: [] };
              }
            })
          );

          return {
            sections: allResults.filter(r => r.videos.length > 0),
            basedOnHistory: watchedTitles.length > 0,
          };
        } catch (error) {
          console.error("YouTube suggestions error:", error);
          return { sections: [], basedOnHistory: false };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;

// Helper function to format time for VTT
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
