import { useEffect, useState } from 'react';

import type { BookSummary } from '../shared/types.js';
import { api } from './api.js';
import { appStrings as t, languageNames } from './i18n.js';
import { navigate } from './router.js';

export function BookList() {
  const [books, setBooks] = useState<BookSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listBooks()
      .then(setBooks)
      .catch((e: Error) => setError(e.message));
  }, []);

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
              <span className="book-title">{book.title}</span>
              <span className="muted">
                {[
                  book.settings.genre,
                  book.settings.style,
                  languageNames[book.settings.language],
                ].join(' · ')}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
