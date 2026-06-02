import { ChatPanel } from "@/components/ChatPanel";
import { Canvas } from "@/components/Canvas";
import { Toolbar } from "@/components/Toolbar";

export default function Home() {
  return (
    <div className="flex h-full bg-canvas">
      <div className="w-96 border-r border-border flex flex-col bg-panel shrink-0">
        <ChatPanel />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <Toolbar />
        <Canvas />
      </div>
    </div>
  );
}
