import { useCallback, useEffect, useState } from 'react';

import type { Book, PageResponse } from '../shared/types.js';
import { api } from './api.js';
import { appStrings, strings } from './i18n.js';
import { navigate, pagePath } from './router.js';

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

  // Opening a book continues from the page where the reader left off.
  useEffect(() => {
    if (!pageId && startPageId) {
      navigate(pagePath(bookId, startPageId), { replace: true });
    }
  }, [bookId, pageId, startPageId]);

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
  const goBack = () =>
    page?.parentId && navigate(pagePath(bookId, page.parentId));

  return (
    <main className="screen reader" lang={book?.settings.language}>
      <nav className="toolbar">
        <button onClick={() => navigate('/')}>{t.allBooks}</button>
        {book && page && page.id !== book.firstPageId && (
          <button onClick={() => navigate(pagePath(bookId, book.firstPageId))}>
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
          {!writing && page.parentId && page.actions.length > 0 && (
            <button className="back" onClick={goBack}>
              ← {t.back}
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
