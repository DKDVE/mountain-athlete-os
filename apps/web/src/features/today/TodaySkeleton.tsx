import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TodaySkeleton() {
  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <Skeleton className="h-[120px] w-[120px] rounded-full" />
        <Card className="flex-1">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-11 w-32" />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        <Card><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        <Card><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
      </div>
    </div>
  );
}
