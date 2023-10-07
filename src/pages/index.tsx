import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";

const Home: NextPage = () => {
  const [youtubeCustomUrl, setYoutubeCustomUrl] = useState("");
  const [youtubeChannelId, setYoutubeChannelId] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [publishedBeforeDate, setPublishBeforeDate] = useState<Date | null>(
    null,
  );
  const [publishedAfterDate, setPublishAfterDate] = useState<Date | null>(null);

  const router = useRouter();

  const { refetch } = api.youtube.getChannelIdFromCustomUrl.useQuery(
    { customUrl: youtubeCustomUrl },
    {
      enabled: false,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
      onSuccess: (data) => setYoutubeChannelId(data.channelId),
      onError: (error) => {
        setIsLoading(false);
        setErrorMessage(error.message);
      },
    },
  );

  useEffect(() => {
    if (youtubeChannelId !== "") {
      localStorage.setItem(youtubeCustomUrl, youtubeChannelId);

      let queryParams = "";
      if (publishedBeforeDate || publishedAfterDate) {
        queryParams = "?";
        if (publishedBeforeDate) {
          queryParams = `${queryParams}publishedBefore=${publishedBeforeDate.toISOString()}&`;
        }

        if (publishedAfterDate) {
          queryParams = `${queryParams}publishedAfter=${publishedAfterDate.toISOString()}`;
        }
      }

      router
        .push(`/channel/${youtubeChannelId}${queryParams}`)
        .catch((e) => console.log("router failed???", e));
    }
  }, [
    publishedAfterDate,
    publishedBeforeDate,
    router,
    youtubeChannelId,
    youtubeCustomUrl,
  ]);

  const submitYoutubeCustomUrl = () => {
    if (!youtubeCustomUrl) {
      setErrorMessage("No YouTube Custom URL provided.");
      return;
    }

    const channelId = localStorage.getItem(youtubeCustomUrl);
    if (!channelId) {
      setIsLoading(true);
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
          <div className="flex rounded-md px-3 shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-pink-500 sm:max-w-md">
            <span className="flex select-none items-center py-1.5 pr-3 text-white sm:text-sm">
              Published Before (Optional):
            </span>
            <input
              name="publishedBefore"
              type="date"
              onChange={(e) =>
                setPublishBeforeDate(new Date(e.target.value.replace("-", "/")))
              }
              className="block flex-1 border-0 bg-transparent py-1.5 text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex rounded-md px-3 shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-pink-500 sm:max-w-md">
            <span className="flex select-none items-center py-1.5 pr-3 text-white sm:text-sm">
              Published After (Optional):
            </span>
            <input
              name="publishedAfter"
              type="date"
              onChange={(e) =>
                setPublishAfterDate(new Date(e.target.value.replace("-", "/")))
              }
              className="block flex-1 border-0 bg-transparent py-1.5 text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
        <div className="mt-2">
          <button
            disabled={isLoading}
            type="button"
            className="mr-2 inline-flex items-center rounded-md bg-pink-500 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-pink-400 focus:outline-none focus:ring-4 focus:ring-pink-300"
            onClick={submitYoutubeCustomUrl}
          >
            {isLoading ? (
              <>
                <svg
                  aria-hidden="true"
                  role="status"
                  className="mr-3 inline h-4 w-4 animate-spin text-white"
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
              <>Submit</>
            )}
          </button>
        </div>
        {errorMessage && (
          <div className="mt-2 flex flex-col items-center rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-pink-500 sm:max-w-md">
            <span className="items-center font-semibold text-white sm:text-sm">
              Error
            </span>
            <span className="items-center p-3 text-white sm:text-sm">
              {errorMessage}
            </span>
          </div>
        )}
      </main>
    </>
  );
};

export default Home;
