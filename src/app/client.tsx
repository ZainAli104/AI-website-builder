"use client";

import {useTRPC} from "@/trpc/client";
import {useSuspenseQuery} from "@tanstack/react-query";

export const Client = () => {
    const trpc = useTRPC();
    const {data} = useSuspenseQuery(trpc.createAI.queryOptions({text: "world1"}));

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <h1 className="text-4xl font-bold">{JSON.stringify(data)}</h1>
        </main>
    );
}