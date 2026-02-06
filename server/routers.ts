import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { generateImage } from "./_core/imageGeneration";
import { transcribeAudio } from "./_core/voiceTranscription";
import * as db from "./db";

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

  videos: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getVideosByUserId(ctx.user.id, input.limit, input.offset);
      }),

    search: protectedProcedure
      .input(z.object({
        query: z.string(),
        limit: z.number().optional().default(50),
      }))
      .query(async ({ ctx, input }) => {
        return await db.searchVideos(ctx.user.id, input.query, input.limit);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getVideoById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        videoUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        duration: z.number(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
        quality: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createVideo({
          ...input,
          userId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        thumbnailUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return await db.updateVideo(id, updates);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteVideo(input.id);
      }),

    incrementViews: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.incrementVideoViews(input.id);
      }),

    generateThumbnail: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        prompt: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { url } = await generateImage({
          prompt: input.prompt,
        });
        
        await db.updateVideo(input.videoId, {
          thumbnailUrl: url,
        });

        return { thumbnailUrl: url };
      }),

    transcribe: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        audioUrl: z.string(),
        language: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: input.language,
        });

        // Check if transcription failed
        if ('error' in result) {
          throw new Error(result.error);
        }

        // Convert to VTT format
        let vttContent = "WEBVTT\n\n";
        if (result.segments) {
          for (const segment of result.segments) {
            const start = formatTime(segment.start);
            const end = formatTime(segment.end);
            vttContent += `${start} --> ${end}\n${segment.text.trim()}\n\n`;
          }
        }

        await db.createVideoTranscription({
          videoId: input.videoId,
          language: result.language || input.language || "en",
          transcription: vttContent,
          generatedBy: "whisper",
        });

        return { transcription: vttContent, language: result.language };
      }),

    getTranscriptions: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getVideoTranscriptions(input.videoId);
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

  history: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getWatchHistory(ctx.user.id, input.limit);
      }),

    getForVideo: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getVideoWatchHistory(ctx.user.id, input.videoId);
      }),

    update: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        currentTime: z.number(),
        duration: z.number(),
        completed: z.boolean().optional().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.upsertWatchHistory({
          userId: ctx.user.id,
          videoId: input.videoId,
          currentTime: input.currentTime,
          duration: input.duration,
          completed: input.completed,
        });
      }),
  }),

  settings: router({
    get: protectedProcedure
      .query(async ({ ctx }) => {
        const settings = await db.getUserSettings(ctx.user.id);
        if (!settings) {
          // Return default settings
          return {
            userId: ctx.user.id,
            defaultPlaybackSpeed: 1.0,
            defaultQuality: "auto",
            autoplay: true,
            sponsorBlockEnabled: true,
            sponsorBlockCategories: ["sponsor", "intro", "outro", "selfpromo"],
            autoGenerateCaptions: false,
            theme: "dark" as const,
          };
        }
        return settings;
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
    getSegments: protectedProcedure
      .input(z.object({
        videoId: z.string(), // YouTube video ID
        categories: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        // Call SponsorBlock API
        const categories = input.categories || ["sponsor", "intro", "outro", "selfpromo"];
        const url = `https://sponsor.ajay.app/api/skipSegments?videoID=${input.videoId}&categories=${JSON.stringify(categories)}`;
        
        try {
          const response = await fetch(url);
          if (!response.ok) {
            return [];
          }
          const data = await response.json();
          return data;
        } catch (error) {
          console.error("SponsorBlock API error:", error);
          return [];
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
