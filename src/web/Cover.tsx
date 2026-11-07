import { useCallback, useEffect, useState } from 'react';

import type { BookResponse } from '../shared/types.js';
import { api, imageUrl } from './api.js';
import { appStrings, strings } from './i18n.js';
import { navigate, pagePath } from './router.js';
import { usePoll } from './usePoll.js';

/** The cover page, which comes before page 1. */
export function Cover({ bookId }: { bookId: string }) {
  const [data, setData] = useState<BookResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .getBook(bookId)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [bookId]);

  useEffect(load, [load]);
  usePoll(data?.cover === 'pending', load);

  const book = data?.book;
  const t = book ? strings[book.settings.language] : appStrings;
  const read = (pageId: string) => navigate(pagePath(bookId, pageId));

  return (
    <main className="screen cover" lang={book?.settings.language}>
      <nav className="toolbar">
        <button onClick={() => navigate('/')}>{t.allBooks}</button>
      </nav>
      {!data && !error && <p className="muted">{t.loading}</p>}
      {error && <p className="error">{error}</p>}
      {book && data && (
        <>
          <h1 className="cover-title">{book.title}</h1>
          {data.cover === 'ready' ? (
            <img
              className="page-image"
              src={imageUrl(bookId, 'cover')}
              alt=""
            />
          ) : (
            data.cover === 'pending' && (
              <p className="working image-placeholder">{t.drawingImage}</p>
            )
          )}
          <p className="cover-details muted">
            {book.settings.genre} · {book.settings.style}
            {book.settings.author && (
              <>
                <br />
                {t.authorStyle}: {book.settings.author}
              </>
            )}
          </p>
          <div className="cover-actions">
            {data.currentPageId !== book.firstPageId && (
              <button
                className="primary"
                onClick={() => read(data.currentPageId)}
              >
                {t.continueReading}
              </button>
            )}
            <button
              className={
                data.currentPageId === book.firstPageId ? 'primary' : ''
              }
              onClick={() => read(book.firstPageId)}
            >
              {t.startReading}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
