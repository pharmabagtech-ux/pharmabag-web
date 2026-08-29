"use client";
import { useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Heading2,
  Heading3,
  Pilcrow,
} from "lucide-react";
import toast from "react-hot-toast";
import { uploadBlogImage } from "@/api/blog.api";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

/**
 * The buyer storefront renders post content as raw HTML
 * (dangerouslySetInnerHTML), so this editor's output format IS the storage
 * format: a plain HTML string.
 *
 * The admin app has no Tailwind typography plugin, so the editable area
 * styles its semantic elements via arbitrary variants instead of `prose`.
 */
const EDITOR_CLASSES =
  "min-h-[320px] p-4 text-sm leading-relaxed text-gray-800 focus:outline-none " +
  "[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-1 " +
  "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 " +
  "[&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:text-gray-600 " +
  "[&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg";

export default function RichTextEditor({ value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: EDITOR_CLASSES },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const onPickImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      try {
        const url = await uploadBlogImage(file);
        editor
          .chain()
          .focus()
          .setImage({ src: url, alt: file.name.replace(/\.[a-z]+$/i, "") })
          .run();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Image upload failed");
      }
    },
    [editor],
  );

  if (!editor) return null;

  const btn = (active: boolean) =>
    cn(
      "p-2 rounded-lg transition-colors",
      active ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100",
    );

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 p-2">
        <button type="button" title="Paragraph" className={btn(editor.isActive("paragraph") && !editor.isActive("heading"))} onClick={() => editor.chain().focus().setParagraph().run()}>
          <Pilcrow className="h-4 w-4" />
        </button>
        <button type="button" title="Heading 2" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" title="Heading 3" className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-gray-200" />
        <button type="button" title="Bold" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" title="Italic" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-gray-200" />
        <button type="button" title="Bullet list" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" title="Numbered list" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" title="Quote" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-gray-200" />
        <button type="button" title="Link" className={btn(editor.isActive("link"))} onClick={setLink}>
          <Link2 className="h-4 w-4" />
        </button>
        <button type="button" title="Insert image" className={btn(false)} onClick={() => fileInputRef.current?.click()}>
          <ImageIcon className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-gray-200" />
        <button type="button" title="Undo" className={btn(false)} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" title="Redo" className={btn(false)} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onPickImage(f);
            e.target.value = "";
          }}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
