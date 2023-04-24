import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";

const Home: NextPage = () => {
  const [youtubeCustomUrl, setYoutubeCustomUrl] = useState("");
  const [youtubeChannelId, setYoutubeChannelId] = useState("");

  const router = useRouter();

  const { refetch } = api.youtube.getChannelIdFromCustomUrl.useQuery(
    { customUrl: youtubeCustomUrl },
    {
      enabled: false,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      onSuccess: (data) => setYoutubeChannelId(data.channelId),
    }
  );

  useEffect(() => {
    if (youtubeChannelId !== "") {
      localStorage.setItem(youtubeCustomUrl, youtubeChannelId);
      router
        .push(`/channel/${youtubeChannelId}`)
        .catch((e) => console.log("router failed???", e));
    }
  }, [router, youtubeChannelId, youtubeCustomUrl]);

  const submitYoutubeCustomUrl = () => {
    const channelId = localStorage.getItem(youtubeCustomUrl);
    if (!channelId) {
      refetch().catch((e) => console.log("idk what happened", e));
    } else {
      setYoutubeChannelId(channelId);
    }
  };

  return (
    <>
      <Head>
        <title>Channel Roulette</title>
        <meta
          name="description"
          content="Watch a random YouTube video from a specific channel"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-purple-900">
        <div className="mt-2">
          <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-pink-500 sm:max-w-md">
            <span className="flex select-none items-center pl-3 text-white sm:text-sm">
              youtube.com/@
            </span>
            <input
              type="text"
              name="youtubeCustomUrl"
              id="youtubeCustomUrl"
              className="block flex-1 border-0 bg-transparent py-1.5 pl-0 text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
              placeholder="youtubecreators"
              onChange={(e) => setYoutubeCustomUrl(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-2">
          <button
            type="submit"
            className="flex w-full justify-center rounded-md bg-pink-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-pink-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            onClick={submitYoutubeCustomUrl}
          >
            Submit
          </button>
        </div>
      </main>
    </>
  );
};

export default Home;
