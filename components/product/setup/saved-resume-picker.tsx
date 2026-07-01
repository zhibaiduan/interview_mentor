import { Button } from "@/components/ui/button";

export function SavedResumePicker() {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-[var(--text-secondary)]">Reuse a saved resume when available.</p>
      <Button type="button" variant="secondary" size="sm">
        My resumes
      </Button>
    </div>
  );
}
