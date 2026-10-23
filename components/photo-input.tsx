'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX = 5 * 1024 * 1024;

/**
 * Photo picker with an instant preview in the final shape (square, 16:9 or round). The server still validates
 * and re-saves every file; this only gives quick feedback.
 */
export function PhotoInput({ name, label, shape = 'square', initialUrl }: { name: string; label: string; shape?: 'square' | 'video' | 'round'; initialUrl?: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => () => { if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);
  const clear = () => { if (input.current) input.current.value = ''; setPreview(initialUrl ?? null); setError(null); };
  const frame = shape === 'video' ? 'media media-video rounded-[14px]' : shape === 'round' ? 'media media-square rounded-full w-28' : 'media media-square rounded-[14px]';
  return (
    <div className="field">
      <span>{label}</span>
      <div className={frame}>
        {preview ? <img src={preview} alt="Selected photo preview" /> : <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted"><ImagePlus size={28} aria-hidden /><span className="small">Add a photo</span></div>}
      </div>
      <div className="row">
        <label className="btn btn-secondary">
          <ImagePlus size={18} aria-hidden />{preview ? 'Change photo' : 'Choose photo'}
          <input ref={input} type="file" name={name} accept={TYPES.join(',')} className="sr-only" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (!TYPES.includes(file.type) || file.size > MAX) { setError('Please choose a JPEG, PNG or WebP photo under 5 MB.'); event.target.value = ''; return; }
            setError(null);
            setPreview(URL.createObjectURL(file));
          }} />
        </label>
        {preview && preview !== initialUrl && <button type="button" className="btn btn-ghost" onClick={clear}><X size={18} aria-hidden />Remove</button>}
      </div>
      <span className="field-hint">JPEG, PNG or WebP, up to 5 MB. Location and camera details are removed when you upload.</span>
      {error && <span role="alert" className="notice notice-error">{error}</span>}
    </div>
  );
}
