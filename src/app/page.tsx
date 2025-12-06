import TextEditor from "@/components/TextEditor";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans">
      <div className="w-full min-h-screen p-4">
        <TextEditor />
      </div>
    </div>
  );
}
