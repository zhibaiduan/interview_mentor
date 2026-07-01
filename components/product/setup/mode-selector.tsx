import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

export function ModeSelector() {
  return (
    <Panel className="grid gap-4">
      <div className="grid gap-2">
        <Badge variant="growing">Focused</Badge>
        <h2 className="font-display text-xl leading-heading">Choose practice mode</h2>
      </div>
      <label className="grid gap-2 rounded-md bg-[var(--bg-surface)] p-4 shadow-[inset_0_0_0_1px_var(--border-subtle)]">
        <span className="flex items-center gap-3">
          <input name="mode" type="radio" value="focused" defaultChecked />
          <span className="text-sm font-medium">Focused interview</span>
        </span>
        <span className="pl-6 text-sm text-[var(--text-secondary)]">
          Three tailored questions with follow-ups and feedback.
        </span>
      </label>
    </Panel>
  );
}
