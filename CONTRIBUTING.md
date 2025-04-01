# Contributing to Promptiverse

Thank you for your interest in contributing to Promptiverse! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Contributing to Promptiverse](#contributing-to-promptiverse)
  - [Table of Contents](#table-of-contents)
  - [Code of Conduct](#code-of-conduct)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
  - [Development Workflow](#development-workflow)
    - [Keeping Your Fork Updated](#keeping-your-fork-updated)
  - [Pull Request Process](#pull-request-process)
  - [Coding Standards](#coding-standards)
    - [General Guidelines](#general-guidelines)
    - [TypeScript](#typescript)
    - [React](#react)
    - [CSS/Styling](#cssstyling)
  - [Testing](#testing)
    - [Running Tests](#running-tests)
    - [Types of Tests](#types-of-tests)
  - [Documentation](#documentation)
  - [Issue Reporting](#issue-reporting)
    - [Bug Reports](#bug-reports)
    - [Feature Requests](#feature-requests)
    - [Submitting Feature Requests](#submitting-feature-requests)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read it before contributing.

- Be respectful and inclusive
- Be patient and welcoming
- Be thoughtful
- Be collaborative
- When disagreeing, try to understand why

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, or bun
- Git
- Supabase account
- API keys for AI providers (optional for development)

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:

   ```bash
   git clone https://github.com/KPrince-coder/promptiverse.git
   cd promptiverse
   ```

3. Add the original repository as a remote:

   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/promptiverse.git
   ```

4. Install dependencies:

   ```bash
   npm install
   ```

5. Copy the environment file and configure it:

   ```bash
   cp .env.example .env
   ```

6. Set up Supabase:
   - Create a new Supabase project
   - Run the migration script in `supabase/migrations/user_profiles_and_prompts_management.sql`
7. Start the development server:

   ```bash
   npm run dev
   ```

## Development Workflow

1. Create a new branch for your feature or bugfix:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-you-are-fixing
   ```

2. Make your changes
3. Commit your changes with a descriptive commit message:

   ```bash
   git commit -m "Add feature: your feature description"
   ```

4. Push your branch to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

5. Create a Pull Request from your fork to the original repository

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update the documentation if necessary
3. Include tests for new features
4. Ensure all tests pass
5. Make sure your branch is up to date with the main branch
6. Fill out the Pull Request template completely
7. Request a review from a maintainer

## Coding Standards

### General Guidelines

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Keep functions small and focused
- Comment complex logic
- Use async/await for asynchronous code

### TypeScript

- Use proper type annotations
- Avoid using `any` type when possible
- Use interfaces for object shapes
- Use type guards for runtime type checking

### React

- Use functional components with hooks
- Keep components small and focused
- Use proper prop types
- Follow the React hooks rules
- Use React Query for data fetching
- Use React Context for global state

### CSS/Styling

- Use Tailwind CSS for styling
- Follow the existing component design patterns
- Use the shadcn/ui component library when possible
- Ensure responsive design for all screen sizes

## Testing

We use Vitest for testing. Please write tests for new features and ensure existing tests pass.

### Running Tests

```bash
npm run test
```

### Types of Tests

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete user flows

## Documentation

Good documentation is crucial for the project. Please update documentation when:

- Adding new features
- Changing existing functionality
- Fixing bugs that might affect user experience

Documentation should be clear, concise, and include examples when appropriate.

## Issue Reporting

### Bug Reports

When reporting a bug, please include:

1. A clear and descriptive title
2. Steps to reproduce the bug
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable
6. Environment information (browser, OS, etc.)

### Feature Requests

When requesting a feature, please include:

1. A clear and descriptive title
2. A detailed description of the feature
3. Why this feature would be beneficial
4. Any alternatives you've considered
5. Mockups or examples if applicable

### Submitting Feature Requests

We welcome feature requests! Please use the issue tracker to submit feature requests, following the guidelines above.

---

Thank you for contributing to Promptiverse! Your efforts help make this project better for everyone.
