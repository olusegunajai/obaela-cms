export interface ThemeOptions {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
  glassOpacity: string;
  sidebarStyle: 'light' | 'dark' | 'glass';
  youtubeChannelId?: string;
  youtubeApiKey?: string;
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
      backgroundColor: '#f5f2ed',
      textColor: '#1a3a3a',
      fontFamily: 'Inter, serif',
      borderRadius: '1.5rem',
      glassOpacity: '0.1',
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
      backgroundColor: '#0f172a',
      textColor: '#ffffff',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '0.75rem',
      glassOpacity: '0.2',
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
      backgroundColor: '#ffffff',
      textColor: '#18181b',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '0.25rem',
      glassOpacity: '0.05',
      sidebarStyle: 'light'
    }
  }
];
