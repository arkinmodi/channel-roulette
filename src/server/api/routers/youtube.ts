import { TRPCError } from "@trpc/server";
import { z } from "zod";
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
});
