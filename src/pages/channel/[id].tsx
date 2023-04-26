import { type DehydratedState } from "@tanstack/react-query";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { type TRPCError, type inferRouterOutputs } from "@trpc/server";
import {
  type GetServerSidePropsContext,
  type InferGetServerSidePropsType,
} from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import superjson from "superjson";
import {
  type YoutubeRouter,
  youtubeRouter,
} from "~/server/api/routers/youtube";

const RandomVideo = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
  const [isLoading, setIsLoading] = useState(false);

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
                onClick={() => {
                  setIsLoading(true);
                  router.reload();
                }}
                className="text-white bg-pink-500 hover:bg-pink-400 focus:ring-4 focus:outline-none focus:ring-pink-300 font-medium rounded-md text-sm px-5 py-2.5 text-center mr-2 inline-flex items-center"
              >
                {isLoading ? (
                  <>
                    <svg
                      aria-hidden="true"
                      role="status"
                      className="inline mr-3 w-4 h-4 text-white animate-spin"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="#E5E7EB"
                      ></path>
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentColor"
                      ></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>Shuffle</>
                )}
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
  const [playerSize, setPlayerSize] = useState({
    height: 720,
    width: 1280,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = Math.floor(window.outerWidth * 0.8);
      const height = Math.floor(width * 0.5625);
      setPlayerSize({ width, height });
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      <iframe
        height={playerSize.height}
        width={playerSize.width}
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
