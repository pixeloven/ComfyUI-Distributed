# ComfyUI-Distributed React UI

Modern React-based user interface for ComfyUI-Distributed, built with TypeScript, Vite, and comprehensive development tooling.

## 🚀 Quick Start

1. **Install dependencies:**
```bash
cd ui
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Build for production:**
```bash
npm run build
```

## 📋 Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run preview          # Preview production build

# Building
npm run build            # Production build (TypeScript + Vite)
npm run clean            # Clean dist and coverage directories

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Run ESLint with auto-fix
npm run format           # Format code with Prettier
npm run format:check     # Check Prettier formatting
npm run type-check       # TypeScript type checking

# Testing
npm run test             # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report

# CI Pipeline
npm run ci               # Full CI pipeline (lint + type-check + test + build)
```

## 🏗️ Architecture

### Core Technologies
- **React 18** - UI framework with hooks and modern patterns
- **TypeScript 5** - Type safety and better developer experience
- **Vite** - Fast build tool and development server
- **Zustand** - Lightweight state management
- **React i18next** - Internationalization framework

### Development Tools
- **ESLint** - Code quality and standards enforcement
- **Prettier** - Consistent code formatting
- **Jest + React Testing Library** - Comprehensive testing framework
- **Husky** - Git hooks for quality gates
- **GitHub Actions** - CI/CD pipeline automation

### Directory Structure
```
ui/
├── src/
│   ├── components/         # React UI components
│   ├── stores/            # Zustand state management
│   ├── services/          # API clients and external services
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions and constants
│   ├── locales/           # Internationalization files
│   │   ├── en/           # English translations
│   │   └── index.ts      # i18n configuration
│   ├── __tests__/        # Test files
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── dist/                  # Production build output
├── coverage/              # Test coverage reports
├── public/                # Static assets
├── package.json          # Dependencies and scripts
├── jest.config.js        # Jest configuration
├── .eslintrc.cjs         # ESLint rules
├── .prettierrc           # Prettier configuration
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite build configuration
```

### Key Components

#### State Management (`stores/appStore.ts`)
- Centralized application state using Zustand
- Worker management (add, update, remove, status tracking)
- Execution state (progress, errors, batch tracking)
- Connection state (master IP, connection status)

#### API Client (`services/apiClient.ts`)
- TypeScript interfaces for all API responses
- Retry logic with exponential backoff
- Proper error handling and timeout management
- Support for status checking and batch operations

#### UI Components
- **WorkerManagementPanel** - Main worker list and controls
- **WorkerCard** - Individual worker status and management
- **ConnectionInput** - Master IP configuration and validation
- **ExecutionPanel** - Execution progress and control buttons

## 🌍 Internationalization

The UI supports multiple languages using React i18next:

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('workers.title')}</h1>;
}
```

**Translation files:** `src/locales/en/common.json`

## 🧪 Testing

### Running Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage report
```

### Writing Tests
- Place tests in `src/__tests__/` directory
- Use `.test.tsx` or `.spec.tsx` extensions
- Follow React Testing Library best practices

### Example Test
```tsx
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello World')).toBeInTheDocument();
});
```

## 🔧 Code Quality

### Pre-commit Hooks
Automatic quality checks run before each commit:
- ESLint with auto-fix
- Prettier formatting
- TypeScript type checking

### ESLint Rules
- React and TypeScript best practices
- Accessibility checks (jsx-a11y)
- Import/export standards
- Code quality enforcement

### Prettier Configuration
- Single quotes, semicolons
- 2-space indentation
- 100 character line width
- Consistent formatting

## 🚀 CI/CD Pipeline

### GitHub Actions Workflows

#### Pull Request & Push (`ci.yml`)
- Runs on every push and PR
- Tests on Node.js 18 and 20
- Lint, type-check, test, and build
- Upload coverage to Codecov
- Security audit

#### Release (`release.yml`)
- Triggers on main branch merges
- Creates GitHub releases
- Uploads build artifacts
- Semantic versioning

### Build Output
- **Development:** `http://localhost:3000` with hot reload
- **Production:** `./dist/` directory (standard React convention)
- **Integration:** ComfyUI loads directly from `ui/dist/main.js`

## 🔗 ComfyUI Integration

The React UI integrates seamlessly with ComfyUI:

1. **Sidebar Tab Registration** - Registers as a ComfyUI sidebar extension
2. **Lifecycle Management** - Proper mount/unmount when panel opens/closes
3. **API Integration** - Uses existing ComfyUI distributed API endpoints
4. **Event Handling** - Integrates with ComfyUI's execution and status systems

## 📦 Migration from Vanilla JS

This React UI maintains full compatibility with the existing vanilla JavaScript implementation:

- ✅ All API endpoints remain unchanged
- ✅ Configuration file formats are preserved
- ✅ Existing workflows continue working
- ✅ Feature parity with original implementation

**Improvements:**
- Modern React development experience
- TypeScript for better code quality
- Comprehensive testing framework
- Automated CI/CD pipeline
- Internationalization support
- Enhanced accessibility

## 🤝 Contributing

1. **Fork and clone** the repository
2. **Install dependencies:** `cd ui && npm install`
3. **Create feature branch:** `git checkout -b feature/amazing-feature`
4. **Make changes** and ensure tests pass: `npm run ci`
5. **Commit with conventional format:** `feat: add amazing feature`
6. **Push and create** pull request

### Development Guidelines
- Follow existing code style (enforced by ESLint/Prettier)
- Write tests for new functionality
- Update documentation as needed
- Use semantic commit messages
- Ensure CI pipeline passes