import { Card, CardHeader } from "./ui/card";

const PointSeparator = () => {
  return (
    <div className="w-full border-t border-gray-300 my-4">
      <Card>
        <CardHeader>
          <div className="w-full flex justify-center"></div>
        </CardHeader>
      </Card>
    </div>
  );
};

export default PointSeparator;
