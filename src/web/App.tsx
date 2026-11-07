import { BookList } from './BookList.js';
import { NewBook } from './NewBook.js';
import { Reader } from './Reader.js';
import { useRoute } from './router.js';

export function App() {
  const route = useRoute();
  switch (route.name) {
    case 'books':
      return <BookList />;
    case 'new':
      return <NewBook />;
    case 'book':
    case 'page':
      return (
        <Reader
          key={route.bookId}
          bookId={route.bookId}
          pageId={route.name === 'page' ? route.pageId : null}
        />
      );
  }
}
