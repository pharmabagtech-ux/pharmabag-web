"use client";

/**
 * Shows what a page says right now, next to the field that would replace it.
 *
 * These editors store OVERRIDES: a blank field means "keep what the page
 * generates". The generated wording was only ever a grey placeholder, which is
 * easy to miss, disappears the moment you type, and cannot be read at all on a
 * long intro. So the copy was technically on screen and practically invisible.
 *
 * "Use this" copies it into the field as a starting point rather than
 * pre-filling every field automatically — and that distinction matters. The
 * generated text arrives with live numbers already resolved ("430 ayurvedic
 * medicines"), so saving a copy of it freezes that number until someone edits
 * it again. Taking over should be a decision, not a side effect of opening the
 * editor. The token hint above the fields is the way to keep a number live in
 * your own wording.
 */
export default function CurrentCopy({
  text,
  onUse,
  label = "On the page now",
}: {
  text?: string | null;
  onUse: () => void;
  label?: string;
}) {
  const trimmed = text?.trim();
  if (!trimmed) return null;

  return (
    <div className="mt-1.5 flex items-start gap-3 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <p className="flex-1 leading-relaxed">
        <span className="font-medium text-foreground">{label}: </span>
        {trimmed}
      </p>
      <button
        type="button"
        onClick={onUse}
        className="shrink-0 font-medium text-primary transition hover:underline"
      >
        Use this
      </button>
    </div>
  );
}
