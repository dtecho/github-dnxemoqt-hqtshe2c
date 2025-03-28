import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import EchoHomeMap, { RoomType } from "~/components/EchoHomeMap";
import { useState } from "react";

export async function loader() {
  return json({
    title: "Echo Home Map",
    description: "Navigate the cognitive architecture of Deep Tree Echo"
  });
}

export default function MapPage() {
  const { title, description } = useLoaderData<typeof loader>();
  const [activeRoom, setActiveRoom] = useState<RoomType>('overview');
  
  const handleRoomSelect = (room: RoomType) => {
    setActiveRoom(room);
  };
  
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-card text-card-foreground px-6 py-4 border-b border-border">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm opacity-70">{description}</p>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <EchoHomeMap onRoomSelect={handleRoomSelect} />
      </main>
      
      <footer className="bg-card text-card-foreground px-6 py-3 border-t border-border text-sm">
        <div className="flex justify-between items-center">
          <div>
            Current location: <span className="font-medium">{activeRoom}</span>
          </div>
          <div className="opacity-70">
            Deep Tree Echo • Cognitive Architecture Map
          </div>
        </div>
      </footer>
    </div>
  );
}