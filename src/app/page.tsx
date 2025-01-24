import { Card, CardContent } from "@/components/ui/card";

export default async function Home() {
  return (
    <Card className="mx-auto mt-4 max-w-md">
      <CardContent className="pt-6 text-center">
        <h1>Next.js Starter</h1>
        <p>A simple starter for Next.js</p>
      </CardContent>
    </Card>
  );
}
