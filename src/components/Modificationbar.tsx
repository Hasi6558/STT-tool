import {Card, CardContent, CardHeader} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ModificationbarProps {
    accumulatedTranscript: string;
}

export default function Modificationbar({accumulatedTranscript}: ModificationbarProps) {
  return (
    <div className="">
      <Card className="min-h-screen">
        <CardHeader className="flex items-center border-b-1 border-b-gray-300 justify-center pb-4  ">
          <Button>Clean Up</Button>
          <Button>Enhance</Button>
          <Button>Boook Style</Button>
        </CardHeader>
          <CardContent className="flex items-center border-b-1 border-b-gray-300 justify-center pb-4  ">
          </CardContent>
      </Card>
    </div>
  );
}
