# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 frontend application using the App Router pattern. Built with React 19, TypeScript (strict mode), and Tailwind CSS 4.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Create production build
npm start        # Run production server
npm run lint     # Run ESLint
```

## Architecture

- **App Router**: Uses `/app` directory with file-based routing (page.tsx, layout.tsx)
- **Styling**: Tailwind CSS with CSS variables for theming; dark mode via prefers-color-scheme
- **Fonts**: Geist font family (sans & mono) via next/font
- **Path alias**: `@/*` maps to project root

## Key Files

- `app/layout.tsx` - Root layout with metadata and global font configuration
- `app/page.tsx` - Home page component
- `app/globals.css` - Global styles and CSS custom properties for theming
