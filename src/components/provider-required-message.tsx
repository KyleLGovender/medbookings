import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProviderRequiredMessageProps {
  title?: string;
  description?: string;
  className?: string;
}

export function ProviderRequiredMessage({
  title = "Provider Profile Required",
  description = "To access this feature, you need to complete your provider profile setup.",
  className = "container mx-auto py-6"
}: ProviderRequiredMessageProps) {
  return (
    <div className={className}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Provider Access Required</h1>
        <p className="mt-2 text-sm text-gray-600">
          Complete your provider registration to access this feature
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-orange-600">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {description}
          </p>
          <div className="flex gap-3">
            <Button onClick={() => window.location.href = '/profile'}>
              Complete Provider Setup
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}