"use client";

import {useTRPC} from "@/trpc/client";
import {useMutation} from "@tanstack/react-query";
import {Button} from "@/components/ui/button";

const Home = async () => {
    const trpc = useTRPC();
    const invoke = useMutation(trpc.invoke.mutationOptions({}));

    return (
        <div>
            <Button onClick={() => invoke.mutate({ text: "Create button" })}>
                Test
            </Button>
        </div>
    );
};

export default Home;
