import {Sandbox} from "@e2b/code-interpreter";
import {Agent, openai, createAgent} from "@inngest/agent-kit";

import {inngest} from "./client";

export const helloWorld = inngest.createFunction(
    {id: "hello-world"},
    {event: "test/hello.world"},
    async ({event, step}) => {
        const sanboxId = await step.run("get-sandbox-id", async () => {
            const sandbox = await Sandbox.create("vibe-nextjs-zain-3");
            return sandbox.sandboxId;
        });

        const codeAgent = createAgent({
            name: "code-agent",
            system: "You are an expert Next.js developer. You write readable, maintainable, and efficient code." +
                " You write simple Next.js & React snippets.",
            model: openai({model: "gpt-4o-mini"}),
        });

        const {output} = await codeAgent.run(
            `Write the following snippet: ${event.data.value}`,
        );

        // const sandboxUrl = await step.run("get-sandbox-url", async () => {
        //     const sandbox =
        // });

        return {output};
    },
);
