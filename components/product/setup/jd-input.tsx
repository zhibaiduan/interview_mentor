import { Textarea } from "@/components/ui/textarea";

export function JDInput() {
  return (
    <label className="grid gap-2 text-sm font-medium">
      Job description
      <Textarea
        name="jd_text"
        placeholder="Paste the JD, or leave it light and choose a generic role later."
      />
    </label>
  );
}
