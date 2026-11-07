import { useCallback, useEffect, useState } from 'react';

import type { BookSummary } from '../shared/types.js';
import { api, imageUrl } from './api.js';
import { appStrings as t, languageNames } from './i18n.js';
import { navigate } from './router.js';
import { usePoll } from './usePoll.js';

export function BookList() {
  const [books, setBooks] = useState<BookSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .listBooks()
      .then(setBooks)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(load, [load]);
  usePoll(books?.some((b) => b.cover === 'pending') ?? false, load, 5000);

  return (
    <main className="screen">
      <h1>{t.appName}</h1>
      <div className="toolbar">
        <h2>{t.books}</h2>
        <button className="primary" onClick={() => navigate('/new')}>
          {t.newBook}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {books === null && !error && <p className="muted">{t.loading}</p>}
      {books?.length === 0 && <p className="muted">{t.noBooks}</p>}
      <ul className="book-list">
        {books?.map((book) => (
          <li key={book.id}>
            <button
              className="book-card"
              onClick={() => navigate(`/books/${book.id}`)}
            >
              {book.cover === 'ready' ? (
                <img
                  className="book-thumbnail"
                  src={imageUrl(book.id, 'cover')}
                  alt=""
                />
              ) : (
                <span className="book-thumbnail" />
              )}
              <span className="book-info">
                <span className="book-title">{book.title}</span>
                <span className="muted">
                  {[
                    book.settings.genre,
                    book.settings.style,
                    languageNames[book.settings.language],
                  ].join(' · ')}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
