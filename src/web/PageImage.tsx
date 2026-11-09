import { useState } from 'react';

import type { ImageStatus } from '../shared/types.js';
import { api, imageUrl } from './api.js';

/**
 * The image of a page or a cover, with a button that deletes it and makes a
 * new one. `imageId` is a page ID, or `cover` for the cover of the book.
 */
export function PageImage({
  bookId,
  imageId,
  status,
  onStatus,
  onError,
  texts,
}: {
  bookId: string;
  imageId: string;
  status: ImageStatus;
  onStatus: (status: ImageStatus) => void;
  onError: (message: string) => void;
  texts: { drawingImage: string; newImage: string };
}) {
  const [busy, setBusy] = useState(false);

  const regenerate = async () => {
    setBusy(true);
    try {
      const res = await api.regenerateImage(bookId, imageId);
      onStatus(res.image);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (status === 'pending') {
    return <p className="working image-placeholder">{texts.drawingImage}</p>;
  }
  if (status === 'none') return null;
  return (
    <div className="image-frame">
      <img className="page-image" src={imageUrl(bookId, imageId)} alt="" />
      <button
        className="new-image"
        onClick={() => void regenerate()}
        disabled={busy}
        title={texts.newImage}
        aria-label={texts.newImage}
      >
        ↻
      </button>
    </div>
  );
}
