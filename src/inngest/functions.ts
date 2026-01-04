import {z} from "zod";
import {Sandbox} from "@e2b/code-interpreter";
import {openai, createAgent, createTool, createNetwork} from "@inngest/agent-kit";

import {PROMPT} from "@/prompt";
import {inngest} from "./client";
import {getSandbox, lastAssistantTextMessageContent} from "./utils";

export const helloWorld = inngest.createFunction(
    {id: "hello-world"},
    {event: "test/hello.world"},
    async ({event, step}) => {
        const sanboxId = await step.run("get-sandbox-id", async () => {
            const sandbox = await Sandbox.create("vibe-nextjs-zain-4");
            return sandbox.sandboxId;
        });

        const codeAgent = createAgent({
            name: "code-agent",
            description: "An expert coding agent.",
            system: PROMPT,
            model: openai({
                model: "gpt-5-mini",
            }),
            tools: [
                createTool({
                    name: "terminal",
                    description: "Use the terminal to run commands in the sandbox.",
                    parameters: z.object({
                        command: z.string().describe("The command to run in the terminal."),
                    }),
                    handler: async ({command}, {step}) => {
                        return await step?.run("terminal", async () => {
                            const buffers = {stdout: "", stderr: ""};

                            try {
                                const sandbox = await getSandbox(sanboxId);
                                const result = await sandbox.commands.run(command, {
                                    onStdout: (data: string) => {
                                        buffers.stdout += data;
                                    },
                                    onStderr: (data: string) => {
                                        buffers.stderr += data;
                                    }
                                });
                                return result.stdout;
                            } catch (err) {
                                console.error(`Error: ${err}\nStderr: ${buffers.stderr}\nStdout: ${buffers.stdout}`);
                                return `Error: ${err}\nStderr: ${buffers.stderr}\nStdout: ${buffers.stdout}`;
                            }
                        })
                    }
                }),
                createTool({
                    name: "createOrUpdateFiles",
                    description: "Create or update files in the sandbox.",
                    parameters: z.object({
                        files: z.array(
                            z.object({
                                path: z.string(),
                                content: z.string()
                            })
                        )
                    }),
                    handler: async ({files}, {step, network}) => {
                        const newFiles = await step?.run("createOrUpdateFiles", async () => {
                            try {
                                const updatedFiles = network.state.data.files || {};
                                const sandbox = await getSandbox(sanboxId);
                                for (const file of files) {
                                    await sandbox.files.write(file.path, file.content);
                                    updatedFiles[file.path] = file.content;
                                }
                                return updatedFiles;
                            } catch (err) {
                                return `Error: ${err}`;
                            }
                        });

                        if (typeof newFiles === "object") {
                            network.state.data.files = newFiles;
                        }
                    }
                }),
                createTool({
                    name: "readFiles",
                    description: "Read files from the sandbox.",
                    parameters: z.object({
                        paths: z.array(z.string())
                    }),
                    handler: async ({paths}, {step}) => {
                        return await step?.run("readFiles", async () => {
                            try {
                                const sandbox = await getSandbox(sanboxId);
                                let filesContent = [];
                                for (const path of paths) {
                                    const content = await sandbox.files.read(path);
                                    filesContent.push({
                                        path,
                                        content
                                    });
                                }
                                return JSON.stringify(filesContent);
                            } catch (err) {
                                return `Error: ${err}`;
                            }
                        });
                    }
                }),
            ],
            lifecycle: {
                onResponse: async ({result, network}) => {
                    const lastAssistantMessage = lastAssistantTextMessageContent(result);

                    if (lastAssistantMessage && network) {
                        if (lastAssistantMessage.includes("<task_summary>")) {
                            network.state.data.summary = lastAssistantMessage;
                        }
                    }

                    return result;
                },
            },
        });

        const network = createNetwork({
            name: "coding-agent-network",
            agents: [codeAgent],
            maxIter: 15,
            router: async ({network}) => {
                const summary = network.state.data.summary;
                if (summary) {
                    return
                }

                return codeAgent;
            },
        });

        // const result = await network.run(event.data.value);
        const result = await network.run("Create a calculator app.");

        const sandboxUrl = await step.run("get-sandbox-url", async () => {
            const sandbox = await getSandbox(sanboxId);
            const host = sandbox.getHost(3000);
            return `https://${host}`;
        });

        return {
            url: sandboxUrl,
            title: "Fragment",
            files: result.state.data.files,
            summary: result.state.data.summary,
        };
    },
);
