import { useState } from 'react';

import { settingSuggestions } from '../shared/suggestions.js';
import {
  type AuthorSuggestion,
  type BookLength,
  bookLengths,
  type BookPitch,
  type BookSettings,
  type Language,
  languages,
  lengthPages,
  type ToneSuggestions,
} from '../shared/types.js';
import { api } from './api.js';
import { appStrings, languageNames, type Strings, strings } from './i18n.js';
import { coverPath, navigate } from './router.js';

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
  return <BookSetup language={language} onBack={() => setLanguage(null)} />;
}

type Step = 'settings' | 'idea' | 'pitch';

const emptySettings = (language: Language): BookSettings => ({
  language,
  genre: '',
  style: '',
  realism: '',
  audience: '',
  darkness: '',
  artStyle: '',
  author: null,
  length: 'medium',
});

/** The steps after the language: settings, idea, and the title and blurb. */
function BookSetup({
  language,
  onBack,
}: {
  language: Language;
  onBack: () => void;
}) {
  const t = strings[language];
  const [step, setStep] = useState<Step>('settings');
  const [settings, setSettings] = useState(() => emptySettings(language));
  const [idea, setIdea] = useState('');
  /** Null for "surprise me", which lets the agent come up with the idea. */
  const [pitchIdea, setPitchIdea] = useState<string | null>(null);
  const [pitch, setPitch] = useState<BookPitch>({ title: '', blurb: '' });
  const [comments, setComments] = useState('');
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (message: string, task: () => Promise<void>) => {
    setWorking(message);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking(null);
    }
  };

  const writePitch = (ideaText: string | null) =>
    run(t.writingBlurb, async () => {
      const next = await api.writePitch({ settings, idea: ideaText });
      setPitchIdea(ideaText);
      setPitch(next);
      setComments('');
      setStep('pitch');
    });

  const rewritePitch = () =>
    run(t.writingBlurb, async () => {
      const next = await api.writePitch({
        settings,
        idea: pitchIdea,
        current: pitch,
        comments: comments.trim() || undefined,
      });
      setPitch(next);
      setComments('');
    });

  const create = () =>
    run(t.writingFirstPage, async () => {
      const { book } = await api.createBook({
        settings,
        idea: pitchIdea,
        ...pitch,
      });
      navigate(coverPath(book.id), { replace: true });
    });

  if (working) {
    return (
      <main className="screen" lang={language}>
        <h1>{t.newBook}</h1>
        <p className="working">{working}</p>
      </main>
    );
  }

  return (
    <main className="screen" lang={language}>
      <h1>{t.newBook}</h1>
      {step === 'settings' && (
        <SettingsStep
          t={t}
          settings={settings}
          onChange={setSettings}
          onBack={onBack}
          onNext={() => setStep('idea')}
          onError={setError}
        />
      )}
      {step === 'idea' && (
        <>
          <label className="field">
            <span>{t.idea}</span>
            <textarea
              rows={6}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            />
            <small className="muted">{t.ideaHint}</small>
          </label>
          <div className="toolbar">
            <button onClick={() => setStep('settings')}>{t.cancel}</button>
            <span className="toolbar-group">
              <button onClick={() => void writePitch(null)}>
                {t.surpriseMe}
              </button>
              <button
                className="primary"
                disabled={idea.trim() === ''}
                onClick={() => void writePitch(idea.trim())}
              >
                {t.writeBlurb}
              </button>
            </span>
          </div>
        </>
      )}
      {step === 'pitch' && (
        <>
          <label className="field">
            <span>{t.title}</span>
            <input
              value={pitch.title}
              onChange={(e) => setPitch({ ...pitch, title: e.target.value })}
            />
          </label>
          <label className="field">
            <span>{t.blurb}</span>
            <textarea
              className="blurb-input"
              rows={10}
              value={pitch.blurb}
              onChange={(e) => setPitch({ ...pitch, blurb: e.target.value })}
            />
          </label>
          <label className="field">
            <span>{t.comments}</span>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
            <small className="muted">{t.commentsHint}</small>
          </label>
          <div className="toolbar">
            <button onClick={() => setStep('idea')}>{t.cancel}</button>
            <span className="toolbar-group">
              <button
                disabled={!pitch.title.trim() || !pitch.blurb.trim()}
                onClick={() => void rewritePitch()}
              >
                {t.newVersion}
              </button>
              <button
                className="primary"
                disabled={!pitch.title.trim() || !pitch.blurb.trim()}
                onClick={() => void create()}
              >
                {t.createBook}
              </button>
            </span>
          </div>
        </>
      )}
      {error && <p className="error">{error}</p>}
    </main>
  );
}

function SettingsStep({
  t,
  settings,
  onChange,
  onBack,
  onNext,
  onError,
}: {
  t: Strings;
  settings: BookSettings;
  onChange: (settings: BookSettings) => void;
  onBack: () => void;
  onNext: () => void;
  onError: (error: string | null) => void;
}) {
  const { language, genre, style } = settings;
  const suggestions = settingSuggestions[language];
  const set = (patch: Partial<BookSettings>) =>
    onChange({ ...settings, ...patch });

  // The tone and author suggestions depend on the genre and the style, so
  // they are fetched again when either changes.
  const genreKey = `${genre.trim()}|${style.trim()}`;
  const canSuggest = genre.trim() !== '' && style.trim() !== '';
  const tone = useSuggestions(genreKey, () =>
    api.suggestTone(language, genre, style),
  );
  const authors = useSuggestions(
    genreKey,
    async () => (await api.suggestAuthors(language, genre, style)).authors,
  );
  const load = (s: Suggestions<unknown>) => {
    if (canSuggest) void s.load().catch((e: Error) => onError(e.message));
  };

  const toneField = (key: keyof ToneSuggestions, label: string) => (
    <Field
      label={label}
      value={settings[key]}
      onChange={(v) => set({ [key]: v })}
      onFocus={() => load(tone)}
      suggestions={tone.value?.[key] ?? []}
    />
  );

  const canNext = canSuggest && settings.artStyle.trim() !== '';

  return (
    <>
      <Field
        label={t.genre}
        value={genre}
        onChange={(v) => set({ genre: v })}
        suggestions={suggestions.genres}
      />
      <Field
        label={t.style}
        value={style}
        onChange={(v) => set({ style: v })}
        suggestions={suggestions.styles}
      />
      <h2>{t.tone}</h2>
      {!tone.value && (
        <button
          disabled={!canSuggest || tone.loading}
          onClick={() => load(tone)}
        >
          {tone.loading ? t.suggestingTone : t.suggestTone}
        </button>
      )}
      {toneField('realism', t.realism)}
      {toneField('audience', t.audience)}
      {toneField('darkness', t.darkness)}
      <div className="field">
        <span>{t.length}</span>
        <div className="chips">
          {bookLengths.map((l) => (
            <button
              key={l}
              className={l === settings.length ? 'chip selected' : 'chip'}
              onClick={() => set({ length: l })}
            >
              {lengthLabel(t, l)}
            </button>
          ))}
        </div>
      </div>
      <Field
        label={t.artStyle}
        value={settings.artStyle}
        onChange={(v) => set({ artStyle: v })}
        suggestions={suggestions.artStyles}
      />
      <label className="field">
        <span>{t.author}</span>
        <input
          value={settings.author ?? ''}
          onChange={(e) => set({ author: e.target.value || null })}
          onFocus={() => load(authors)}
        />
        <small className="muted">{t.authorHint}</small>
      </label>
      {authors.value ? (
        <AuthorList
          authors={authors.value}
          selected={settings.author}
          onPick={(a) => set({ author: a })}
        />
      ) : (
        <button
          disabled={!canSuggest || authors.loading}
          onClick={() => load(authors)}
        >
          {authors.loading ? t.suggestingAuthors : t.suggestAuthors}
        </button>
      )}
      <div className="toolbar">
        <button onClick={onBack}>{t.cancel}</button>
        <button className="primary" disabled={!canNext} onClick={onNext}>
          {t.next}
        </button>
      </div>
    </>
  );
}

function lengthLabel(t: Strings, length: BookLength): string {
  const [min, max] = lengthPages[length];
  return `${t.lengths[length]} (${min}–${max} ${t.pages})`;
}

interface Suggestions<T> {
  /** Null until loaded, and again after the key changes. */
  value: T | null;
  loading: boolean;
  load: () => Promise<void>;
}

/** Suggestions that are fetched once for each key. */
function useSuggestions<T>(
  key: string,
  fetch: () => Promise<T>,
): Suggestions<T> {
  const [loaded, setLoaded] = useState<{ key: string; value: T } | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const value = loaded?.key === key ? loaded.value : null;
  const loading = loadingKey === key;
  const load = async () => {
    if (value !== null || loading) return;
    setLoadingKey(key);
    try {
      setLoaded({ key, value: await fetch() });
    } finally {
      setLoadingKey(null);
    }
  };
  return { value, loading, load };
}

function AuthorList({
  authors,
  selected,
  onPick,
}: {
  authors: AuthorSuggestion[];
  selected: string | null;
  onPick: (author: string) => void;
}) {
  return (
    <ul className="author-list">
      {authors.map((a) => (
        <li key={a.name}>
          <button
            className={a.name === selected ? 'chip selected' : 'chip'}
            onClick={() => onPick(a.name)}
          >
            <strong>{a.name}</strong> <span>{a.note}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Field({
  label,
  value,
  onChange,
  onFocus,
  suggestions,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  suggestions: string[];
}) {
  return (
    <div className="field">
      <label>
        <span>{label}</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
        />
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
