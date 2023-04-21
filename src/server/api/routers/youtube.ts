import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "~/env.mjs";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const youtubeRouter = createTRPCRouter({
  getChannelIdFromCustomUrl: publicProcedure
    .input(z.object({ customUrl: z.string() }))
    .query(async ({ input }) => {
      const youtubeChannelPageResponse = await fetch(
        `https://www.youtube.com/${input.customUrl}`,
        {
          method: "GET",
          headers: {
            Accept: "text/html",
          },
        }
      );

      if (!youtubeChannelPageResponse.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch YouTube channel's HTML page. Recieved: ${
            youtubeChannelPageResponse.status
          }, ${await youtubeChannelPageResponse.text()}`,
        });
      }

      const youtubeChannelPageHtml = await youtubeChannelPageResponse.text();

      // Extract the YouTube Channel ID from the following meta HTML tag
      // <meta property="og:url" content="https://www.youtube.com/channel/UCry1ZVKLslbZXuQgsf-3TXg">

      const META_PROPERTY = '"og:url"';

      const start = youtubeChannelPageHtml.indexOf(META_PROPERTY);
      const end = youtubeChannelPageHtml.indexOf(
        ">",
        start + META_PROPERTY.length
      );

      const metaContent = youtubeChannelPageHtml
        .slice(start + META_PROPERTY.length, end)
        .trim();

      let youtubeUrl = metaContent.split("=").at(-1);
      if (!youtubeUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to find the YouTube channel URL containing the channel ID",
        });
      }
      youtubeUrl = youtubeUrl.substring(1, youtubeUrl.length - 1);

      const youtubeChannelId = youtubeUrl.split("/").at(-1);
      if (!youtubeChannelId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to find YouTube channel ID from youtube channel URL",
        });
      }

      return {
        channelId: youtubeChannelId,
      };
    }),

  getRandomVideoFromChannel: publicProcedure
    .input(
      z.object({
        channelId: z.string(),
        publishedBefore: z.date().optional(),
        publishedAfter: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      if (
        input.publishedBefore &&
        input.publishedAfter &&
        input.publishedAfter < input.publishedBefore
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Publish after date "${input.publishedAfter.toLocaleString()}" occurs before publish before date "${input.publishedBefore.toLocaleString()}"`,
        });
      }

      const youtubeSearchApiUrl = new URL(
        "https://youtube.googleapis.com/youtube/v3/search"
      );
      youtubeSearchApiUrl.searchParams.append("key", env.GOOGLE_CLOUD_API_KEY);
      youtubeSearchApiUrl.searchParams.append("order", "date");
      youtubeSearchApiUrl.searchParams.append("part", "id");
      youtubeSearchApiUrl.searchParams.append("part", "snippet");

      youtubeSearchApiUrl.searchParams.append("channelId", input.channelId);

      if (input.publishedBefore) {
        youtubeSearchApiUrl.searchParams.append(
          "publishedBefore",
          input.publishedBefore.toISOString()
        );
      }

      if (input.publishedAfter) {
        youtubeSearchApiUrl.searchParams.append(
          "publishedAfter",
          input.publishedAfter.toISOString()
        );
      }

      const youtubeSearchApiResponse = await fetch(youtubeSearchApiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!youtubeSearchApiResponse.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `YouTube API request failed. Recieved: ${
            youtubeSearchApiResponse.status
          }, ${await youtubeSearchApiResponse.text()}`,
        });
      }

      const youtubeSearchApiJson =
        (await youtubeSearchApiResponse.json()) as YouTubeSearchApiResponseBody;

      if (youtubeSearchApiJson.items.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No videos found matching given criteria",
        });
      }

      const chosenVideo =
        youtubeSearchApiJson.items[
          Math.floor(Math.random() * youtubeSearchApiJson.items.length)
        ];

      if (!chosenVideo) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to pick a random video.",
        });
      }

      return {
        video: {
          id: chosenVideo.id.videoId,
          title: chosenVideo.snippet.title,
          thumbnail: chosenVideo.snippet.thumbnails.high.url,
        },
      };
    }),
});

type YouTubeSearchApiResponseBody = {
  kind: string;
  etag: string;
  nextPageToken: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPage: number;
  };
  items: {
    kind: string;
    etag: string;
    id: {
      kind: string;
      videoId: string;
    };
    snippet: {
      publishedAt: string;
      channelId: string;
      title: string;
      description: string;
      thumbnails: {
        default: {
          url: string;
          width: number;
          height: number;
        };
        medium: {
          url: string;
          width: number;
          height: number;
        };
        high: {
          url: string;
          width: number;
          height: number;
        };
      };
      channelTitle: string;
      liveBroadcastContent: string;
      publishTime: string;
    };
  }[];
};
