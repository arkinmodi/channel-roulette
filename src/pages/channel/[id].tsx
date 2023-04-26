import { type DehydratedState } from "@tanstack/react-query";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { type TRPCError, type inferRouterOutputs } from "@trpc/server";
import {
  type GetServerSidePropsContext,
  type InferGetServerSidePropsType,
} from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import superjson from "superjson";
import {
  type YoutubeRouter,
  youtubeRouter,
} from "~/server/api/routers/youtube";

const RandomVideo = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>
          {props.success ? props.data.channelTitle : "Channel Roulette"}
        </title>
        <meta name="description" content="" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-purple-900">
        {props.success ? (
          <>
            <YouTubeEmbed videoId={props.data.video.id} />
            <p className="text-center text-xl font-bold text-white">
              {props.data.video.title}
            </p>
            <p className="text-center text-lg font-semibold text-white">
              {props.data.channelTitle}
            </p>
            <div className="mt-2">
              <button
                onClick={() => router.reload()}
                className="flex w-full justify-center rounded-md bg-pink-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-pink-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Shuffle
              </button>
            </div>
          </>
        ) : (
          <div className="mt-2 flex flex-col items-center rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-pink-500 sm:max-w-md">
            <span className="items-center text-white font-semibold sm:text-sm">
              Error: Invalid YouTube Channel ID
            </span>
            <span className="p-3 items-center text-white sm:text-sm">
              {props.error}
            </span>
          </div>
        )}
      </main>
    </>
  );
};

const YouTubeEmbed: React.FC<{ videoId: string }> = (props) => {
  return (
    <div>
      <iframe
        height="720"
        width="1280"
        src={`https://www.youtube.com/embed/${props.videoId}`}
      />
    </div>
  );
};

type YoutubeRouterOutput = inferRouterOutputs<YoutubeRouter>;

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ id: string }>
): Promise<
  | {
      props: {
        trpcState: DehydratedState;
        success: true;
        data: YoutubeRouterOutput["getRandomVideoFromChannel"];
      };
    }
  | { props: { trpcState: DehydratedState; success: false; error: string } }
> {
  const helpers = createServerSideHelpers({
    router: youtubeRouter,
    ctx: {},
    transformer: superjson,
  });

  const id = context.params?.id as string;
  try {
    const data = await helpers.getRandomVideoFromChannel.fetch({
      channelId: id,
    });
    return {
      props: {
        trpcState: helpers.dehydrate(),
        success: true,
        data,
      },
    };
  } catch (e) {
    return {
      props: {
        trpcState: helpers.dehydrate(),
        success: false,
        error: (e as TRPCError).message,
      },
    };
  }
}

export default RandomVideo;
