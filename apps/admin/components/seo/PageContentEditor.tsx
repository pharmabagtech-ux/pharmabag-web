"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import RichTextEditor from "@/components/blog/RichTextEditor";
import SeoFieldsPanel from "@/components/seo/SeoFieldsPanel";
import CurrentCopy from "@/components/seo/CurrentCopy";
import {
  useDeletePageSeo,
  usePageDefaults,
  usePageSeo,
  useUpsertPageSeo,
} from "@/hooks/usePageSeo";
import { PageNotGeneratedError, type FaqPair } from "@/api/page-seo.api";

/**
 * Editor for one landing page.
 *
 * The central idea: an empty field is not missing content, it is GENERATED
 * content. Every field shows the live generated text as its placeholder, so an
 * editor can read what the page says today and only override what they want to
 * change. Clearing a field puts the page back on its generated text.
 */

interface Props {
  path: string;
  label: string;
  onClose: () => void;
  onSaved?: () => void;
}

const TOKENS = ["{{product_count}}", "{{name}}", "{{min_order_value}}"];

const ROBOTS_OPTIONS = [
  { value: "", label: "Default (indexed)" },
  { value: "noindex,follow", label: "Hide from search (noindex, follow)" },
  { value: "index,nofollow", label: "Index, do not follow links" },
  { value: "noindex,nofollow", label: "Hide entirely (noindex, nofollow)" },
];

export default function PageContentEditor({ path, label, onClose, onSaved }: Props) {
  const { data: stored, isLoading: loadingStored } = usePageSeo(path);
  const { data: generated, isLoading: loadingDefaults, error: defaultsError } =
    usePageDefaults(path);
  /*
    A 404 is not a failure. It means the storefront generates no page here yet,
    which is the normal state for a category or dosage form with no products —
    and it is why the fields are blank. Saying "could not read the page" there
    describes a problem that does not exist.
  */
  const notGenerated = defaultsError instanceof PageNotGeneratedError;
  const upsert = useUpsertPageSeo();
  const remove = useDeletePageSeo();

  const [h1, setH1] = useState("");
  const [intro, setIntro] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [robots, setRobots] = useState("");
  const [faq, setFaq] = useState<FaqPair[]>([]);
  const [useCustomFaq, setUseCustomFaq] = useState(false);
  const [seo, setSeo] = useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [] as string[],
    canonicalUrl: "",
    ogImage: "",
  });

  /* Stored values populate the form; generated values stay as placeholders. */
  useEffect(() => {
    if (loadingStored) return;
    setH1(stored?.h1 ?? "");
    setIntro(stored?.intro ?? "");
    setBodyHtml(stored?.bodyHtml ?? "");
    setRobots(stored?.robots ?? "");
    setFaq(stored?.faq ?? []);
    setUseCustomFaq(Boolean(stored?.faq?.length));
    setSeo({
      metaTitle: stored?.title ?? "",
      metaDescription: stored?.description ?? "",
      metaKeywords: stored?.secondaryKeywords ?? [],
      canonicalUrl: stored?.canonicalUrl ?? "",
      ogImage: stored?.ogImage ?? "",
    });
  }, [stored, loadingStored]);

  const defaults = generated?.defaults;
  const loading = loadingStored || loadingDefaults;

  const faqRows = useMemo(
    () => (useCustomFaq ? faq : (defaults?.faq ?? [])),
    [useCustomFaq, faq, defaults],
  );

  const save = async () => {
    try {
      await upsert.mutateAsync({
        path,
        payload: {
          entityType: generated?.pageType ?? null,
          title: seo.metaTitle,
          description: seo.metaDescription,
          canonicalUrl: seo.canonicalUrl,
          ogImage: seo.ogImage,
          secondaryKeywords: seo.metaKeywords,
          h1,
          intro,
          bodyHtml,
          robots,
          // Sending an empty array clears the override back to the generated
          // FAQ list; sending the generated list verbatim would freeze it.
          faq: useCustomFaq ? faq.filter((f) => f.question.trim() && f.answer.trim()) : [],
        },
      });
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  };

  const resetToAuto = async () => {
    if (
      !window.confirm(
        `Remove all custom content for ${label}? The page goes back to its generated text.`,
      )
    )
      return;
    try {
      await remove.mutateAsync(path);
      toast.success("Reverted to generated content");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not revert");
    }
  };

  return (
    <Modal open onClose={onClose} title={`Edit content — ${label}`} maxWidth="max-w-3xl">
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
          Reading what this page says now…
        </div>
      ) : (
        <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
          <p className="font-mono text-xs text-muted-foreground">{path}</p>

          {notGenerated ? (
            <div className="rounded-lg border border-blue-300 bg-blue-50 p-3 text-xs text-blue-900 dark:bg-blue-900/20 dark:text-blue-100">
              <p className="font-medium">This page is not live yet.</p>
              <p className="mt-1">
                A category or dosage form gets its page once at least one
                product sits in it — an empty page would be thin content, so the
                storefront does not publish one. That is why the fields below
                are blank: there is no generated wording to show yet.
              </p>
              <p className="mt-1">
                Anything you write here is saved now and applies the moment the
                page goes live.
              </p>
            </div>
          ) : defaultsError ? (
            <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100">
              Could not read the page&apos;s current text from the storefront, so
              the placeholders below are empty. Anything you save still works;
              you just cannot see the generated wording right now.
            </div>
          ) : null}

          <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
            Leave a field blank to keep the text the page generates. Use{" "}
            {TOKENS.map((t) => (
              <code key={t} className="mx-0.5 rounded bg-background px-1 py-0.5">
                {t}
              </code>
            ))}{" "}
            to keep live numbers in your own wording.
          </div>

          <div>
            <Input
              label="Page heading (H1)"
              value={h1}
              onChange={(e) => setH1(e.target.value)}
              placeholder={defaults?.h1 ?? ""}
            />
            <CurrentCopy text={defaults?.h1} onUse={() => setH1(defaults?.h1 ?? "")} />
          </div>

          <div>
            <Textarea
              label="Intro paragraph"
              rows={4}
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder={defaults?.intro ?? ""}
            />
            <CurrentCopy
              text={defaults?.intro}
              onUse={() => setIntro(defaults?.intro ?? "")}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Body — appears below the product grid
            </label>
            <RichTextEditor value={bodyHtml} onChange={setBodyHtml} />
            {defaults?.bodyHtml ? (
              <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">
                    On the page now
                  </span>
                  <button
                    type="button"
                    onClick={() => setBodyHtml(defaults.bodyHtml ?? "")}
                    className="shrink-0 font-medium text-primary transition hover:underline"
                  >
                    Use this
                  </button>
                </div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: defaults.bodyHtml }}
                />
              </div>
            ) : null}
          </div>

          <SeoFieldsPanel
            value={seo}
            onChange={setSeo}
            fallbackTitle={defaults?.title ?? ""}
            fallbackDescription={defaults?.description ?? ""}
            fallbackKeywords={defaults?.keywords ?? []}
            showCurrentCopy
            previewUrl={`pharmabag.in${path}`}
          />

          <Select
            label="Search engine visibility"
            value={robots}
            onChange={(e) => setRobots(e.target.value)}
          >
            {ROBOTS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">
                FAQs
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  also published as FAQ structured data
                </span>
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={useCustomFaq}
                  onChange={(e) => {
                    setUseCustomFaq(e.target.checked);
                    if (e.target.checked && faq.length === 0) {
                      setFaq(defaults?.faq ?? []);
                    }
                  }}
                />
                Write my own
              </label>
            </div>

            {faqRows.map((row, i) => (
              <div key={i} className="space-y-1.5 rounded-lg border border-border/60 p-3">
                <Input
                  value={row.question}
                  disabled={!useCustomFaq}
                  placeholder="Question"
                  onChange={(e) =>
                    setFaq((prev) =>
                      prev.map((r, j) => (j === i ? { ...r, question: e.target.value } : r)),
                    )
                  }
                />
                <Textarea
                  rows={2}
                  value={row.answer}
                  disabled={!useCustomFaq}
                  placeholder="Answer"
                  onChange={(e) =>
                    setFaq((prev) =>
                      prev.map((r, j) => (j === i ? { ...r, answer: e.target.value } : r)),
                    )
                  }
                />
                {useCustomFaq ? (
                  <button
                    type="button"
                    onClick={() => setFaq((prev) => prev.filter((_, j) => j !== i))}
                    className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                ) : null}
              </div>
            ))}

            {useCustomFaq ? (
              <Button
                variant="ghost"
                type="button"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setFaq((prev) => [...prev, { question: "", answer: "" }])}
              >
                Add question
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Generated automatically from the catalogue. Tick “Write my own” to
                take over.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-4">
            <Button
              variant="ghost"
              type="button"
              leftIcon={<RotateCcw className="h-4 w-4" />}
              onClick={resetToAuto}
              loading={remove.isPending}
            >
              Reset to auto
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={save} loading={upsert.isPending}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
