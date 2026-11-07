import { useEffect, useState } from 'react';

export type Route =
  | { name: 'books' }
  | { name: 'new' }
  | { name: 'book'; bookId: string }
  | { name: 'page'; bookId: string; pageId: string };

export function parseRoute(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'new') return { name: 'new' };
  if (parts[0] === 'books' && parts[1]) {
    if (parts[2] === 'pages' && parts[3]) {
      return { name: 'page', bookId: parts[1], pageId: parts[3] };
    }
    return { name: 'book', bookId: parts[1] };
  }
  return { name: 'books' };
}

export function navigate(path: string, options?: { replace?: boolean }) {
  if (options?.replace) window.history.replaceState(null, '', path);
  else window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.pathname));
  useEffect(() => {
    const update = () => setRoute(parseRoute(location.pathname));
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  return route;
}

export function pagePath(bookId: string, pageId: string): string {
  return `/books/${bookId}/pages/${pageId}`;
}
