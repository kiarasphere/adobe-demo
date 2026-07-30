import {useEffect} from 'react';

export function useDocumentColorScheme(isLightMode: boolean) {
  useEffect(() => {
    let colorScheme = isLightMode ? 'light' : 'dark';
    document.documentElement.dataset.colorScheme = colorScheme;
    document.documentElement.style.colorScheme = colorScheme;
    document.body.dataset.colorScheme = colorScheme;
  }, [isLightMode]);
}
