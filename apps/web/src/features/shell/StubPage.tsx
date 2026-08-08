import { EmptyState } from '@/components/ui/empty-state';

export function StubPage({ title }: { title: string }) {
  return (
    <EmptyState
      title={title}
      description="This section ships in a later phase. Use ⌘K to navigate elsewhere."
    />
  );
}
