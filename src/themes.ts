export interface ThemeOptions {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: string;
  sidebarStyle: 'light' | 'dark' | 'glass';
}

export interface Theme {
  id: string;
  name: string;
  options: ThemeOptions;
}

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Royal Forest',
    options: {
      primaryColor: '#1a3a3a',
      secondaryColor: '#f5f2ed',
      accentColor: '#c5a059',
      fontFamily: 'Inter, serif',
      borderRadius: '1.5rem',
      sidebarStyle: 'light'
    }
  },
  {
    id: 'midnight',
    name: 'Midnight Gold',
    options: {
      primaryColor: '#0f172a',
      secondaryColor: '#1e293b',
      accentColor: '#fbbf24',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '0.75rem',
      sidebarStyle: 'dark'
    }
  },
  {
    id: 'minimal',
    name: 'Minimalist',
    options: {
      primaryColor: '#18181b',
      secondaryColor: '#ffffff',
      accentColor: '#3f3f46',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '0.25rem',
      sidebarStyle: 'light'
    }
  }
];
