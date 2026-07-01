import { Textarea } from "@/components/ui/textarea";

export function ResumeTextarea() {
  return (
    <label className="grid gap-2 text-sm font-medium">
      Resume
      <Textarea
        name="resume_text"
        placeholder="Paste the resume or experience notes you want to practice from."
      />
      <span className="text-xs font-normal text-[var(--text-muted)]">
        MVP uses pasted text. PDF parsing comes later.
      </span>
    </label>
  );
}
