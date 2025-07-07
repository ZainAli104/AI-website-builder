import {Button} from "@/components/ui/button";

const Home = () => {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <h1 className="text-4xl font-bold">Welcome to My Next.js App!</h1>
            <p className="mt-4 text-lg">This is a simple example of a Next.js application.</p>
            <Button>Test</Button>
        </main>
    );
};

export default Home;
