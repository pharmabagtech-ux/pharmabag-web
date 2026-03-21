"use client";
import React, { useRef, useState } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  error?: string;
  maxFiles?: number;
}

export function ImageUploader({ value = [], onChange, error, maxFiles = 5 }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulateUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Limit file size to 5MB
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error("File size must be less than 5MB"));
        return;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Simulate network delay
        setTimeout(() => resolve(reader.result as string), 800 + Math.random() * 1000);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (value.length + files.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} images.`);
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = files.map(simulateUpload);
      const newUrls = await Promise.all(uploadPromises);
      onChange([...value, ...newUrls]);
    } catch (err: any) {
      alert(err.message || "Failed to upload images");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newArr = [...value];
    newArr.splice(index, 1);
    onChange(newArr);
  };

  return (
    <div className="space-y-3">
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-colors cursor-pointer",
          error ? "border-red-400 bg-red-50/50" : "border-border hover:bg-accent/40 hover:border-primary/50",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept="image/png, image/jpeg, image/webp" 
          onChange={handleFileChange} 
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">Uploading images...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Click to upload images</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 5MB</p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 font-medium" role="alert">{error}</p>}

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 pt-4">
          {value.map((url, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border border-border bg-muted/20 aspect-square flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Preview ${i}`} className="object-cover w-full h-full" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
