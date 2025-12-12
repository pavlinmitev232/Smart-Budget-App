# Smart-Budget-App - Phase 3: UI Customization & Localization

**Author:** pavlin
**Date:** 2025-12-12
**Project Level:** Level 2 (BMad Method)
**Target Scale:** 3 Epics, ~12-14 Stories

---

## Overview

This document provides the epic and story breakdown for Smart-Budget-App Phase 3, focusing on user interface customization and internationalization features. Building upon the completed Phase 2 (AI features, goal tracking, bill comparison), this phase adds personalization and localization capabilities.

**Phase 3 Epics:**

1. **Epic 13: Dark Mode** - Theme switching with light/dark modes
2. **Epic 14: Currency System** - Multi-currency support (USD, EUR, BGN)
3. **Epic 15: Internationalization (i18n)** - Language support (English, Bulgarian)

Each epic delivers independent value and maintains the system in a deployable state.

---

## Phase 3 Implementation Sequence

### **Phase 3A: Theme & Display** (Epic 13)
1. Epic 13 - Dark Mode ⭐ (Most requested UX feature)

### **Phase 3B: Currency & Localization** (Epics 14-15)
2. Epic 14 - Currency System (Financial formatting)
3. Epic 15 - Internationalization (Language support)

---

## Epic 13: Dark Mode

**Goal:** Implement light/dark theme switching with system preference detection and user preference persistence.

**Value:** Reduces eye strain in low-light conditions, improves accessibility, and provides a modern user experience. One of the most requested features in modern web applications.

**Scope:** Theme toggle, CSS variables for colors, system preference detection, preference persistence, smooth transitions.

**Dependencies:** None (independent feature)

**Technical Notes:**
- Use CSS custom properties (variables) for theming
- Detect system preference with `prefers-color-scheme`
- Store user preference in localStorage and database
- Tailwind CSS dark mode utilities
- Smooth color transitions

---

### Story 13.1: Implement Theme Context and Provider

As a developer,
I want a centralized theme management system,
So that theme state is accessible throughout the application.

**Acceptance Criteria:**

**Given** the application needs theme switching
**When** I create the theme infrastructure
**Then** a React context manages theme state

**And** ThemeContext is implemented:
```typescript
// frontend/src/contexts/ThemeContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('theme') as Theme;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored;
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Detect system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateResolvedTheme = () => {
      if (theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();
    mediaQuery.addEventListener('change', updateResolvedTheme);

    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);

    // Update meta theme-color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', resolvedTheme === 'dark' ? '#1f2937' : '#ffffff');
    }
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

**And** ThemeProvider wraps the application:
```typescript
// frontend/src/App.tsx
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      {/* ... rest of app */}
    </ThemeProvider>
  );
}
```

**And** system preference is detected automatically

**And** user preference persists across sessions

**Prerequisites:** None

**Technical Notes:**
- Use localStorage for immediate persistence
- Sync with user database preference (Story 13.3)
- Handle SSR if applicable (check window exists)
- Prevent flash of wrong theme on load

---

### Story 13.2: Create CSS Theme Variables and Dark Mode Styles

As a user,
I want consistent dark mode colors throughout the app,
So that the experience is polished and easy on the eyes.

**Acceptance Criteria:**

**Given** dark mode is enabled
**When** I view the application
**Then** all components display with dark theme colors

**And** CSS custom properties define the color palette:
```css
/* frontend/src/styles/theme.css */

:root {
  /* Light theme (default) */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-tertiary: #f3f4f6;
  --color-bg-card: #ffffff;

  --color-text-primary: #111827;
  --color-text-secondary: #4b5563;
  --color-text-tertiary: #6b7280;
  --color-text-muted: #9ca3af;

  --color-border: #e5e7eb;
  --color-border-hover: #d1d5db;

  --color-accent: #3b82f6;
  --color-accent-hover: #2563eb;

  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  --color-income: #10b981;
  --color-expense: #ef4444;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.dark {
  /* Dark theme */
  --color-bg-primary: #111827;
  --color-bg-secondary: #1f2937;
  --color-bg-tertiary: #374151;
  --color-bg-card: #1f2937;

  --color-text-primary: #f9fafb;
  --color-text-secondary: #e5e7eb;
  --color-text-tertiary: #d1d5db;
  --color-text-muted: #9ca3af;

  --color-border: #374151;
  --color-border-hover: #4b5563;

  --color-accent: #60a5fa;
  --color-accent-hover: #3b82f6;

  --color-success: #34d399;
  --color-warning: #fbbf24;
  --color-error: #f87171;

  --color-income: #34d399;
  --color-expense: #f87171;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
}

/* Smooth transitions */
* {
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.15s ease;
}
```

**And** Tailwind config extended for dark mode:
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
          card: 'var(--color-bg-card)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          muted: 'var(--color-text-muted)',
        },
        // ... other custom colors
      },
    },
  },
};
```

**And** components use theme variables:
```tsx
<div className="bg-bg-primary text-text-primary border-border">
  <h1 className="text-text-primary">Dashboard</h1>
  <p className="text-text-secondary">Welcome back!</p>
</div>
```

**And** charts and graphs support dark mode colors

**And** images with transparency work on both themes

**Prerequisites:** Story 13.1 (theme context)

**Technical Notes:**
- Use CSS variables for maximum flexibility
- Avoid hardcoded colors in components
- Test all components in both themes
- Consider reduced motion preferences
- Update chart libraries to use theme colors

---

### Story 13.3: Build Theme Toggle UI Component

As a user,
I want to easily switch between light and dark modes,
So that I can choose my preferred viewing experience.

**Acceptance Criteria:**

**Given** I am using the application
**When** I want to change the theme
**Then** I can access a theme toggle in the navigation/settings

**And** ThemeToggle component is implemented:
```typescript
// frontend/src/components/ThemeToggle.tsx

import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

interface ThemeToggleProps {
  showLabel?: boolean;
  variant?: 'icon' | 'dropdown' | 'segmented';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  variant = 'icon'
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
        aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
      >
        {resolvedTheme === 'light' ? (
          <MoonIcon className="w-5 h-5 text-text-secondary" />
        ) : (
          <SunIcon className="w-5 h-5 text-text-secondary" />
        )}
        {showLabel && (
          <span className="ml-2 text-text-secondary">
            {resolvedTheme === 'light' ? 'Dark' : 'Light'}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'segmented') {
    return (
      <div className="flex bg-bg-tertiary rounded-lg p-1">
        <button
          onClick={() => setTheme('light')}
          className={`flex items-center px-3 py-1.5 rounded-md transition-colors ${
            theme === 'light' ? 'bg-bg-card shadow-sm' : ''
          }`}
        >
          <SunIcon className="w-4 h-4" />
          {showLabel && <span className="ml-1.5 text-sm">Light</span>}
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`flex items-center px-3 py-1.5 rounded-md transition-colors ${
            theme === 'system' ? 'bg-bg-card shadow-sm' : ''
          }`}
        >
          <ComputerDesktopIcon className="w-4 h-4" />
          {showLabel && <span className="ml-1.5 text-sm">System</span>}
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`flex items-center px-3 py-1.5 rounded-md transition-colors ${
            theme === 'dark' ? 'bg-bg-card shadow-sm' : ''
          }`}
        >
          <MoonIcon className="w-4 h-4" />
          {showLabel && <span className="ml-1.5 text-sm">Dark</span>}
        </button>
      </div>
    );
  }

  // Dropdown variant
  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
      className="bg-bg-secondary border border-border rounded-lg px-3 py-2"
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
};
```

**And** toggle is placed in:
- Navigation header (icon variant)
- Settings page (segmented variant with labels)
- Mobile menu (icon with label)

**And** theme preference has 3 options:
- Light
- Dark
- System (follows OS preference)

**And** current selection is clearly indicated

**And** keyboard accessible (Tab + Enter)

**Prerequisites:** Story 13.1 (theme context), Story 13.2 (CSS variables)

**Technical Notes:**
- Use aria-label for accessibility
- Show tooltip on hover
- Animate icon transition (sun/moon)
- Consider reduced motion preferences

---

### Story 13.4: Persist Theme Preference to User Profile

As a user,
I want my theme preference saved to my account,
So that it follows me across devices.

**Acceptance Criteria:**

**Given** I am logged in
**When** I change my theme preference
**Then** it is saved to my user profile

**And** database schema extended:
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN theme_preference VARCHAR(10) DEFAULT 'system';
```

**And** API endpoint exists:
```typescript
// PATCH /api/user/preferences
{
  "theme": "dark" // 'light' | 'dark' | 'system'
}

// Response
{
  "success": true,
  "data": {
    "theme": "dark"
  }
}
```

**And** theme syncs on login:
```typescript
// On successful login
const userPrefs = await api.getUserPreferences();
if (userPrefs.theme) {
  setTheme(userPrefs.theme);
}
```

**And** theme updates are debounced (avoid API spam)

**And** localStorage serves as fallback for logged-out users

**Prerequisites:** Story 13.3 (theme toggle)

**Technical Notes:**
- Debounce API calls (500ms)
- Merge with other user preferences
- Handle offline scenarios gracefully
- Sync on app focus (if changed on another device)

---

## Epic 14: Currency System

**Goal:** Implement multi-currency support allowing users to select their preferred currency for displaying amounts.

**Value:** Serves international users by displaying amounts in familiar currency formats. Essential for users in different regions (USD, EUR, BGN).

**Scope:** Currency selection, number formatting, currency symbols, exchange rate display (optional), preference persistence.

**Dependencies:** Epic 13 (user preferences infrastructure)

**Technical Notes:**
- Use Intl.NumberFormat for locale-aware formatting
- Store preference in user profile
- All amounts stored in original currency (no conversion)
- Display symbol and formatting based on preference
- Support: USD ($), EUR (€), BGN (лв)

---

### Story 14.1: Create Currency Context and Formatting Utilities

As a developer,
I want centralized currency formatting,
So that amounts display consistently throughout the app.

**Acceptance Criteria:**

**Given** the application needs multi-currency support
**When** I create the currency infrastructure
**Then** a React context manages currency state

**And** CurrencyContext is implemented:
```typescript
// frontend/src/contexts/CurrencyContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'USD' | 'EUR' | 'BGN';

interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
  position: 'before' | 'after';
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', position: 'before' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', position: 'before' },
  BGN: { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', locale: 'bg-BG', position: 'after' },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  currencyConfig: CurrencyConfig;
  setCurrency: (currency: CurrencyCode) => void;
  formatAmount: (amount: number, options?: FormatOptions) => string;
  formatCompact: (amount: number) => string;
}

interface FormatOptions {
  showSymbol?: boolean;
  showSign?: boolean;
  decimals?: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const stored = localStorage.getItem('currency') as CurrencyCode;
    if (stored && CURRENCIES[stored]) {
      return stored;
    }
    return 'USD';
  });

  const currencyConfig = CURRENCIES[currency];

  const formatAmount = (amount: number, options: FormatOptions = {}): string => {
    const { showSymbol = true, showSign = false, decimals = 2 } = options;

    const formatted = new Intl.NumberFormat(currencyConfig.locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Math.abs(amount));

    const sign = showSign && amount !== 0 ? (amount > 0 ? '+' : '-') : (amount < 0 ? '-' : '');

    return `${sign}${formatted}`.replace('-', ''); // Remove double negative
  };

  const formatCompact = (amount: number): string => {
    if (Math.abs(amount) >= 1000000) {
      return `${currencyConfig.symbol}${(amount / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1000) {
      return `${currencyConfig.symbol}${(amount / 1000).toFixed(1)}K`;
    }
    return formatAmount(amount);
  };

  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, currencyConfig, setCurrency, formatAmount, formatCompact }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
```

**And** formatting utility hook:
```typescript
// Usage in components
const { formatAmount, currency } = useCurrency();

// Examples:
formatAmount(1234.56)              // "$1,234.56" (USD)
formatAmount(1234.56)              // "1.234,56 €" (EUR)
formatAmount(1234.56)              // "1 234,56 лв" (BGN)
formatAmount(-50, { showSign: true }) // "-$50.00"
formatCompact(1500000)             // "$1.5M"
```

**Prerequisites:** None

**Technical Notes:**
- Use Intl.NumberFormat for proper locale formatting
- Handle negative amounts correctly
- Support compact notation for large numbers
- Consider RTL languages for future

---

### Story 14.2: Build Currency Selector Component

As a user,
I want to select my preferred currency,
So that amounts are displayed in a format familiar to me.

**Acceptance Criteria:**

**Given** I want to change my currency preference
**When** I access the currency selector
**Then** I can choose from available currencies

**And** CurrencySelector component:
```typescript
// frontend/src/components/CurrencySelector.tsx

import { useCurrency, CURRENCIES, CurrencyCode } from '../contexts/CurrencyContext';

interface CurrencySelectorProps {
  variant?: 'dropdown' | 'cards' | 'inline';
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  variant = 'dropdown'
}) => {
  const { currency, setCurrency } = useCurrency();

  if (variant === 'dropdown') {
    return (
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        className="bg-bg-secondary border border-border rounded-lg px-3 py-2"
      >
        {Object.values(CURRENCIES).map((curr) => (
          <option key={curr.code} value={curr.code}>
            {curr.symbol} {curr.code} - {curr.name}
          </option>
        ))}
      </select>
    );
  }

  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-3 gap-3">
        {Object.values(CURRENCIES).map((curr) => (
          <button
            key={curr.code}
            onClick={() => setCurrency(curr.code)}
            className={`p-4 rounded-lg border-2 transition-all ${
              currency === curr.code
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-accent/50'
            }`}
          >
            <div className="text-2xl font-bold">{curr.symbol}</div>
            <div className="text-sm text-text-secondary">{curr.code}</div>
            <div className="text-xs text-text-muted">{curr.name}</div>
          </button>
        ))}
      </div>
    );
  }

  // Inline variant
  return (
    <div className="flex gap-2">
      {Object.values(CURRENCIES).map((curr) => (
        <button
          key={curr.code}
          onClick={() => setCurrency(curr.code)}
          className={`px-3 py-1 rounded-full text-sm ${
            currency === curr.code
              ? 'bg-accent text-white'
              : 'bg-bg-tertiary hover:bg-accent/20'
          }`}
        >
          {curr.symbol} {curr.code}
        </button>
      ))}
    </div>
  );
};
```

**And** selector is placed in:
- Settings page (cards variant)
- Header/quick settings (dropdown)

**And** current selection is clearly highlighted

**And** preview shows example formatting: "Example: $1,234.56"

**Prerequisites:** Story 14.1 (currency context)

**Technical Notes:**
- Show currency symbol prominently
- Display name for clarity
- Consider adding country flags
- Keyboard accessible

---

### Story 14.3: Update All Amount Displays to Use Currency Formatting

As a user,
I want all monetary amounts formatted in my selected currency,
So that the experience is consistent.

**Acceptance Criteria:**

**Given** I have selected a currency
**When** I view any amount in the application
**Then** it is formatted according to my preference

**And** all components updated:
- Dashboard summary cards (total income, expenses, balance)
- Transaction list amounts
- Transaction form input
- Analytics charts (axis labels, tooltips)
- Goal progress amounts
- Bill comparison prices
- AI insights monetary values

**And** Amount component created for consistency:
```typescript
// frontend/src/components/Amount.tsx

import { useCurrency } from '../contexts/CurrencyContext';

interface AmountProps {
  value: number;
  type?: 'income' | 'expense' | 'neutral';
  showSign?: boolean;
  compact?: boolean;
  className?: string;
}

export const Amount: React.FC<AmountProps> = ({
  value,
  type = 'neutral',
  showSign = false,
  compact = false,
  className = '',
}) => {
  const { formatAmount, formatCompact } = useCurrency();

  const formatted = compact ? formatCompact(value) : formatAmount(value, { showSign });

  const colorClass = type === 'income'
    ? 'text-income'
    : type === 'expense'
      ? 'text-expense'
      : 'text-text-primary';

  return (
    <span className={`${colorClass} ${className}`}>
      {formatted}
    </span>
  );
};

// Usage
<Amount value={1234.56} type="income" />
<Amount value={-500} type="expense" showSign />
<Amount value={1500000} compact />
```

**And** chart libraries use currency formatting:
```typescript
// Recharts example
<YAxis
  tickFormatter={(value) => formatCompact(value)}
/>
<Tooltip
  formatter={(value) => formatAmount(value as number)}
/>
```

**Prerequisites:** Story 14.1 (currency context), Story 14.2 (selector)

**Technical Notes:**
- Create reusable Amount component
- Update all hardcoded $ symbols
- Test with different amount ranges
- Handle edge cases (0, negative, very large)

---

### Story 14.4: Persist Currency Preference to User Profile

As a user,
I want my currency preference saved to my account,
So that it follows me across devices.

**Acceptance Criteria:**

**Given** I am logged in
**When** I change my currency preference
**Then** it is saved to my user profile

**And** database schema extended:
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN currency_preference VARCHAR(3) DEFAULT 'USD';
```

**And** API endpoint updated:
```typescript
// PATCH /api/user/preferences
{
  "currency": "EUR" // 'USD' | 'EUR' | 'BGN'
}
```

**And** currency syncs on login

**And** defaults to USD for new users

**Prerequisites:** Story 14.2 (currency selector)

**Technical Notes:**
- Reuse preferences API from Epic 13
- Validate currency code on backend
- Consider browser locale detection for defaults

---

## Epic 15: Internationalization (i18n)

**Goal:** Implement multi-language support starting with English and Bulgarian.

**Value:** Makes the application accessible to Bulgarian-speaking users and establishes infrastructure for future language additions.

**Scope:** Translation system, language switching, date/time formatting, RTL preparation (future).

**Dependencies:** Epic 13 (user preferences), Epic 14 (locale-aware formatting)

**Technical Notes:**
- Use react-i18next for translations
- JSON translation files per language
- Lazy load language bundles
- Support: English (en), Bulgarian (bg)
- Date formatting follows language locale

---

### Story 15.1: Set Up i18n Infrastructure with react-i18next

As a developer,
I want a translation infrastructure,
So that the app can support multiple languages.

**Acceptance Criteria:**

**Given** the application needs multi-language support
**When** I set up i18n
**Then** react-i18next is configured and ready

**And** dependencies installed:
```bash
npm install i18next react-i18next i18next-browser-languagedetector i18next-http-backend
```

**And** i18n configuration:
```typescript
// frontend/src/i18n/index.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import bgTranslations from './locales/bg.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      bg: { translation: bgTranslations },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'bg'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

**And** translation files structure:
```json
// frontend/src/i18n/locales/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "error": "An error occurred"
  },
  "nav": {
    "dashboard": "Dashboard",
    "transactions": "Transactions",
    "analytics": "Analytics",
    "goals": "Goals",
    "settings": "Settings",
    "logout": "Logout"
  },
  "auth": {
    "login": "Log In",
    "register": "Sign Up",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot Password?",
    "noAccount": "Don't have an account?",
    "hasAccount": "Already have an account?"
  },
  "dashboard": {
    "welcome": "Welcome back, {{name}}!",
    "totalIncome": "Total Income",
    "totalExpenses": "Total Expenses",
    "balance": "Balance",
    "recentTransactions": "Recent Transactions"
  },
  "transactions": {
    "title": "Transactions",
    "addNew": "Add Transaction",
    "type": "Type",
    "income": "Income",
    "expense": "Expense",
    "amount": "Amount",
    "category": "Category",
    "date": "Date",
    "description": "Description",
    "noTransactions": "No transactions yet"
  },
  "settings": {
    "title": "Settings",
    "appearance": "Appearance",
    "theme": "Theme",
    "language": "Language",
    "currency": "Currency"
  }
}
```

```json
// frontend/src/i18n/locales/bg.json
{
  "common": {
    "save": "Запази",
    "cancel": "Отказ",
    "delete": "Изтрий",
    "edit": "Редактирай",
    "loading": "Зареждане...",
    "error": "Възникна грешка"
  },
  "nav": {
    "dashboard": "Табло",
    "transactions": "Транзакции",
    "analytics": "Анализи",
    "goals": "Цели",
    "settings": "Настройки",
    "logout": "Изход"
  },
  "auth": {
    "login": "Вход",
    "register": "Регистрация",
    "email": "Имейл",
    "password": "Парола",
    "forgotPassword": "Забравена парола?",
    "noAccount": "Нямате акаунт?",
    "hasAccount": "Вече имате акаунт?"
  },
  "dashboard": {
    "welcome": "Добре дошъл, {{name}}!",
    "totalIncome": "Общ приход",
    "totalExpenses": "Общи разходи",
    "balance": "Баланс",
    "recentTransactions": "Последни транзакции"
  },
  "transactions": {
    "title": "Транзакции",
    "addNew": "Добави транзакция",
    "type": "Тип",
    "income": "Приход",
    "expense": "Разход",
    "amount": "Сума",
    "category": "Категория",
    "date": "Дата",
    "description": "Описание",
    "noTransactions": "Все още няма транзакции"
  },
  "settings": {
    "title": "Настройки",
    "appearance": "Външен вид",
    "theme": "Тема",
    "language": "Език",
    "currency": "Валута"
  }
}
```

**And** i18n initialized in app entry:
```typescript
// frontend/src/main.tsx
import './i18n';
```

**Prerequisites:** None

**Technical Notes:**
- Use namespaces for large apps
- Consider lazy loading translations
- Set up extraction tools for developers
- Plan for pluralization rules

---

### Story 15.2: Build Language Selector Component

As a user,
I want to select my preferred language,
So that the application displays in my language.

**Acceptance Criteria:**

**Given** I want to change the language
**When** I access the language selector
**Then** I can choose from available languages

**And** LanguageSelector component:
```typescript
// frontend/src/components/LanguageSelector.tsx

import { useTranslation } from 'react-i18next';

interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬' },
];

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'buttons' | 'flags';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown'
}) => {
  const { i18n } = useTranslation();

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
  };

  if (variant === 'dropdown') {
    return (
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-bg-secondary border border-border rounded-lg px-3 py-2"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.nativeName}
          </option>
        ))}
      </select>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className="flex gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              i18n.language === lang.code
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border hover:border-accent/50'
            }`}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.nativeName}
          </button>
        ))}
      </div>
    );
  }

  // Flags variant (compact)
  return (
    <div className="flex gap-1">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`text-2xl p-1 rounded ${
            i18n.language === lang.code ? 'ring-2 ring-accent' : ''
          }`}
          title={lang.nativeName}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  );
};
```

**And** selector is placed in:
- Settings page
- Footer or header (compact flag variant)

**And** language changes immediately (no page reload)

**Prerequisites:** Story 15.1 (i18n setup)

**Technical Notes:**
- Show native language names
- Consider emoji flags or SVG icons
- Persist to localStorage immediately

---

### Story 15.3: Translate All UI Components

As a user,
I want all text in the application translated,
So that I can use it entirely in my language.

**Acceptance Criteria:**

**Given** I have selected a language
**When** I use the application
**Then** all UI text is translated

**And** all components use useTranslation hook:
```typescript
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.welcome', { name: user.name })}</h1>
      <Card title={t('dashboard.totalIncome')}>
        <Amount value={income} />
      </Card>
    </div>
  );
};
```

**And** translations cover:
- Navigation labels
- Page titles
- Form labels and placeholders
- Button text
- Error messages
- Toast notifications
- Modal titles and content
- Empty states
- Category names

**And** category translations:
```json
// en.json
{
  "categories": {
    "income": {
      "Salary": "Salary",
      "Freelance": "Freelance",
      "Investments": "Investments"
    },
    "expense": {
      "Food & Dining": "Food & Dining",
      "Transportation": "Transportation",
      "Healthcare": "Healthcare"
    }
  }
}

// bg.json
{
  "categories": {
    "income": {
      "Salary": "Заплата",
      "Freelance": "Свободна практика",
      "Investments": "Инвестиции"
    },
    "expense": {
      "Food & Dining": "Храна и хранене",
      "Transportation": "Транспорт",
      "Healthcare": "Здравеопазване"
    }
  }
}
```

**And** date formatting follows locale:
```typescript
const { i18n } = useTranslation();

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};
```

**Prerequisites:** Story 15.1 (i18n setup), Story 15.2 (language selector)

**Technical Notes:**
- Use translation keys consistently
- Handle interpolation for dynamic values
- Consider translation management tools
- Test all pages in both languages

---

### Story 15.4: Persist Language Preference to User Profile

As a user,
I want my language preference saved to my account,
So that it follows me across devices.

**Acceptance Criteria:**

**Given** I am logged in
**When** I change my language preference
**Then** it is saved to my user profile

**And** database schema extended:
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN language_preference VARCHAR(5) DEFAULT 'en';
```

**And** API endpoint updated:
```typescript
// PATCH /api/user/preferences
{
  "language": "bg" // 'en' | 'bg'
}
```

**And** language syncs on login:
```typescript
// After login
const prefs = await api.getUserPreferences();
if (prefs.language) {
  i18n.changeLanguage(prefs.language);
}
```

**And** browser language detection as fallback for new users

**Prerequisites:** Story 15.3 (translations complete)

**Technical Notes:**
- Reuse preferences API
- Consider Accept-Language header
- Validate language code on backend

---

### Story 15.5: Translate Email Templates

As a user,
I want emails sent in my preferred language,
So that communication is consistent.

**Acceptance Criteria:**

**Given** I have set a language preference
**When** the system sends me an email
**Then** it is in my preferred language

**And** email templates exist for both languages:
- Password reset
- Contact form confirmation
- Overspending alerts

**And** email service selects template based on user preference:
```typescript
async sendPasswordResetEmail(email: string, token: string, language: string) {
  const template = language === 'bg'
    ? passwordResetTemplateBG
    : passwordResetTemplateEN;

  // ...send email with selected template
}
```

**Prerequisites:** Story 15.4 (language persistence)

**Technical Notes:**
- Create separate template files per language
- Consider template engine with i18n support
- Test email rendering in both languages

---

## Summary

**Phase 3 Total: 3 Epics, 13 Stories**

| Epic | Stories | Description |
|------|---------|-------------|
| Epic 13: Dark Mode | 4 | Theme context, CSS variables, toggle UI, persistence |
| Epic 14: Currency System | 4 | Currency context, selector, formatting, persistence |
| Epic 15: Internationalization | 5 | i18n setup, language selector, translations, persistence, emails |

**Implementation Order:**
1. Epic 13 (Dark Mode) - Independent, high user value
2. Epic 14 (Currency) - Builds on preferences infrastructure
3. Epic 15 (i18n) - Most complex, builds on previous

**Technical Stack:**
- Theming: CSS Custom Properties + Tailwind dark mode
- Currency: Intl.NumberFormat
- i18n: react-i18next

---

_Phase 3: UI Customization & Localization_
