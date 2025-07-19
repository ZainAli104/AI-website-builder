import {Suspense} from "react";
import {dehydrate, HydrationBoundary} from "@tanstack/react-query";

import {Client} from "@/app/client";
import {getQueryClient, trpc} from "@/trpc/server";

const Home = async () => {
    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(trpc.createAI.queryOptions({text: "world1"}));

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<p>Loading...</p>}>
                <Client/>
            </Suspense>
        </HydrationBoundary>
    );
};

export default Home;
