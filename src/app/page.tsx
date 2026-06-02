import { ChatPanel } from "@/components/ChatPanel";
import { Canvas } from "@/components/Canvas";
import { Toolbar } from "@/components/Toolbar";

export default function Home() {
  return (
    <div className="flex h-full">
      <div className="w-96 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        <ChatPanel />
      </div>
      <div className="flex-1 flex flex-col">
        <Toolbar />
        <Canvas />
      </div>
    </div>
  );
}
