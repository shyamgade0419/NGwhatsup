import { useEffect } from 'react';

/**
 * Custom hook to set document title dynamically.
 * Automatically appends " | NG by NovaGade" suffix.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | NG by NovaGade`;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
