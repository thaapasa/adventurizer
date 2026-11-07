import { useState } from 'react';

import { settingSuggestions } from '../shared/suggestions.js';
import {
  type AuthorSuggestion,
  type Language,
  languages,
} from '../shared/types.js';
import { api } from './api.js';
import { appStrings, languageNames, strings } from './i18n.js';
import { navigate, pagePath } from './router.js';

export function NewBook() {
  const [language, setLanguage] = useState<Language | null>(null);

  if (!language) {
    return (
      <main className="screen">
        <h1>{appStrings.newBook}</h1>
        <p>{languages.map((l) => strings[l].chooseLanguage).join(' / ')}</p>
        <div className="language-choice">
          {languages.map((l) => (
            <button key={l} className="primary" onClick={() => setLanguage(l)}>
              {languageNames[l]}
            </button>
          ))}
        </div>
        <button onClick={() => navigate('/')}>{appStrings.cancel}</button>
      </main>
    );
  }
  return <BookForm language={language} onBack={() => setLanguage(null)} />;
}

function BookForm({
  language,
  onBack,
}: {
  language: Language;
  onBack: () => void;
}) {
  const t = strings[language];
  const suggestions = settingSuggestions[language];
  const [genre, setGenre] = useState('');
  const [style, setStyle] = useState('');
  const [artStyle, setArtStyle] = useState('');
  const [author, setAuthor] = useState('');
  const [authors, setAuthors] = useState<AuthorSuggestion[]>([]);
  const [authorsFor, setAuthorsFor] = useState('');
  const [loadingAuthors, setLoadingAuthors] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authorKey = `${genre.trim()}|${style.trim()}`;
  const canSuggest = genre.trim() !== '' && style.trim() !== '';
  const canCreate = canSuggest && artStyle.trim() !== '' && !creating;

  const loadAuthors = async () => {
    if (!canSuggest || loadingAuthors || authorsFor === authorKey) return;
    setLoadingAuthors(true);
    setError(null);
    try {
      const res = await api.suggestAuthors(language, genre, style);
      setAuthors(res.authors);
      setAuthorsFor(authorKey);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingAuthors(false);
    }
  };

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const { book } = await api.createBook({
        language,
        genre,
        style,
        artStyle,
        author: author.trim() || null,
      });
      navigate(pagePath(book.id, book.firstPageId), { replace: true });
    } catch (e) {
      setError((e as Error).message);
      setCreating(false);
    }
  };

  if (creating) {
    return (
      <main className="screen">
        <h1>{t.newBook}</h1>
        <p className="working">{t.writingFirstPage}</p>
      </main>
    );
  }

  return (
    <main className="screen" lang={language}>
      <h1>{t.newBook}</h1>
      <Field
        label={t.genre}
        value={genre}
        onChange={setGenre}
        suggestions={suggestions.genres}
      />
      <Field
        label={t.style}
        value={style}
        onChange={setStyle}
        suggestions={suggestions.styles}
      />
      <Field
        label={t.artStyle}
        value={artStyle}
        onChange={setArtStyle}
        suggestions={suggestions.artStyles}
      />
      <label className="field">
        <span>{t.author}</span>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          onFocus={() => void loadAuthors()}
        />
        <small className="muted">{t.authorHint}</small>
      </label>
      {authors.length > 0 && authorsFor === authorKey ? (
        <ul className="author-list">
          {authors.map((a) => (
            <li key={a.name}>
              <button
                className={a.name === author ? 'chip selected' : 'chip'}
                onClick={() => setAuthor(a.name)}
              >
                <strong>{a.name}</strong> <span>{a.note}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <button
          disabled={!canSuggest || loadingAuthors}
          onClick={() => void loadAuthors()}
        >
          {loadingAuthors ? t.suggestingAuthors : t.suggestAuthors}
        </button>
      )}
      {error && <p className="error">{error}</p>}
      <div className="toolbar">
        <button onClick={onBack}>{t.cancel}</button>
        <button
          className="primary"
          disabled={!canCreate}
          onClick={() => void create()}
        >
          {t.createBook}
        </button>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  suggestions,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
}) {
  return (
    <div className="field">
      <label>
        <span>{label}</span>
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
      <div className="chips">
        {suggestions.map((s) => (
          <button
            key={s}
            className={s === value ? 'chip selected' : 'chip'}
            onClick={() => onChange(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
