import { createServerSideHelpers } from "@trpc/react-query/server";
import {
  type GetServerSidePropsContext,
  type InferGetServerSidePropsType,
} from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import superjson from "superjson";
import { youtubeRouter } from "~/server/api/routers/youtube";

const RandomVideo = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
  const router = useRouter();
  const { data } = props;

  return (
    <>
      <Head>
        <title>{data ? data.channelTitle : "Channel Roulette"}</title>
        <meta name="description" content="" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-purple-900">
        {data && (
          <>
            <YouTubeEmbed videoId={data.video.id} />
            <p className="text-center text-xl font-bold text-white">
              {data.video.title}
            </p>
            <p className="text-center text-lg font-semibold text-white">
              {data.channelTitle}
            </p>
          </>
        )}
        <div className="mt-2">
          <button
            onClick={() => router.reload()}
            className="flex w-full justify-center rounded-md bg-pink-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-pink-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Shuffle
          </button>
        </div>
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

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ id: string }>
) {
  const helpers = createServerSideHelpers({
    router: youtubeRouter,
    ctx: {},
    transformer: superjson,
  });

  const id = context.params?.id as string;
  const data = await helpers.getRandomVideoFromChannel.fetch({
    channelId: id,
  });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      data,
    },
  };
}

export default RandomVideo;
