import { Button } from "@/components/ui/button";

export function JDHistoryPicker() {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-[var(--text-secondary)]">Bring back a JD you practiced with before.</p>
      <Button type="button" variant="secondary" size="sm">
        JD history
      </Button>
    </div>
  );
}
