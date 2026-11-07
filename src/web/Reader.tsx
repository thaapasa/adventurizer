import { useCallback, useEffect, useState } from 'react';

import type { Book, PageResponse } from '../shared/types.js';
import { api, imageUrl } from './api.js';
import { appStrings, strings } from './i18n.js';
import { coverPath, navigate, pagePath } from './router.js';
import { usePoll } from './usePoll.js';

export function Reader({
  bookId,
  pageId,
}: {
  bookId: string;
  pageId: string | null;
}) {
  const [book, setBook] = useState<Book | null>(null);
  const [current, setCurrent] = useState<PageResponse | null>(null);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startPageId, setStartPageId] = useState<string | null>(null);

  useEffect(() => {
    api
      .getBook(bookId)
      .then((res) => {
        setBook(res.book);
        setStartPageId(res.currentPageId);
      })
      .catch((e: Error) => setError(e.message));
  }, [bookId]);

  // Opening a book continues from the page where the reader left off. A
  // book that is still on page 1 opens on the cover.
  useEffect(() => {
    if (!pageId && book && startPageId) {
      navigate(
        startPageId === book.firstPageId
          ? coverPath(bookId)
          : pagePath(bookId, startPageId),
        { replace: true },
      );
    }
  }, [bookId, pageId, book, startPageId]);

  const loadPage = useCallback(() => {
    if (!pageId) return;
    setError(null);
    api
      .getPage(bookId, pageId)
      .then((res) => {
        setCurrent(res);
        window.scrollTo(0, 0);
        return api.setPosition(bookId, pageId);
      })
      .catch((e: Error) => setError(e.message));
  }, [bookId, pageId]);

  useEffect(loadPage, [loadPage]);

  // Checks whether the image of the page is ready.
  const pollImage = useCallback(() => {
    if (!pageId) return;
    api
      .getPage(bookId, pageId)
      .then((res) =>
        setCurrent((cur) =>
          cur?.page.id === res.page.id ? { ...cur, image: res.image } : cur,
        ),
      )
      .catch(() => undefined);
  }, [bookId, pageId]);
  usePoll(
    current?.page.id === pageId && current?.image === 'pending',
    pollImage,
  );

  const choose = async (index: number) => {
    if (!current || writing) return;
    setWriting(!current.written[index]);
    setError(null);
    try {
      const res = await api.choose(bookId, current.page.id, index);
      setCurrent(res);
      navigate(pagePath(bookId, res.page.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWriting(false);
    }
  };

  // The reader shows the app texts in the language of the book.
  const t = book ? strings[book.settings.language] : appStrings;
  const page = current?.page.id === pageId ? current.page : null;
  // Page 1 goes back to the cover.
  const goBack = () =>
    navigate(
      page?.parentId ? pagePath(bookId, page.parentId) : coverPath(bookId),
    );

  return (
    <main className="screen reader" lang={book?.settings.language}>
      <nav className="toolbar">
        <button onClick={() => navigate('/')}>{t.allBooks}</button>
        {book && page && page.id !== book.firstPageId && (
          <button onClick={() => navigate(coverPath(bookId))}>
            {t.startOver}
          </button>
        )}
      </nav>
      {book && <h1 className="book-heading">{book.title}</h1>}
      {!page && !error && <p className="muted">{t.loading}</p>}
      {page && current && (
        <article>
          <p className="page-number">
            {t.page} {current.depth}
          </p>
          {page.choice && <p className="choice">{page.choice}</p>}
          {current.image === 'ready' ? (
            <img
              className="page-image"
              src={imageUrl(bookId, page.id)}
              alt=""
            />
          ) : (
            current.image === 'pending' && (
              <p className="working image-placeholder">{t.drawingImage}</p>
            )
          )}
          <div className="page-text">
            {page.text.split(/\n\s*\n/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {writing ? (
            <p className="working">{t.writingPage}</p>
          ) : page.actions.length > 0 ? (
            <ol className="actions">
              {page.actions.map((action, i) => (
                <li key={i}>
                  <button onClick={() => void choose(i)}>
                    {action}
                    {current.written[i] && (
                      <span className="read-mark"> · {t.read}</span>
                    )}
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <div className="dead-end">
              <p>{t.deadEnd}</p>
              {page.parentId && (
                <button className="primary" onClick={goBack}>
                  {t.goBack}
                </button>
              )}
            </div>
          )}
          {!writing && page.actions.length > 0 && (
            <button className="back" onClick={goBack}>
              ← {page.parentId ? t.back : t.cover}
            </button>
          )}
          <details className="image-prompt">
            <summary>{t.imagePrompt}</summary>
            <p>{page.imagePrompt}</p>
          </details>
        </article>
      )}
      {error && (
        <div className="error">
          <p>
            {t.error}: {error}
          </p>
          <button onClick={loadPage}>{t.tryAgain}</button>
        </div>
      )}
    </main>
  );
}
