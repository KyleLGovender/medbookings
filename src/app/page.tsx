import { Card, CardContent } from '@/components/ui/card';

export default async function Home() {
  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="mx-auto mt-4 max-w-md">
          <CardContent className="pt-6 text-center">
            <h1>Next.js Starter</h1>
            <p>A simple starter for Next.js</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
