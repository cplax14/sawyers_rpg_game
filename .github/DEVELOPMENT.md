# Development Workflow

## Branch Strategy

### Main Branches
- `main` - Production-ready code
- `react_port` - Current hybrid implementation
- `feature/react-rewrite` - Complete React rewrite development

### Feature Branch Workflow
1. Create feature branch from `feature/react-rewrite`
   ```bash
   git checkout feature/react-rewrite
   git pull origin feature/react-rewrite
   git checkout -b feature/task-1.1-button-component
   ```

2. Make changes and commit with descriptive messages
   ```bash
   git add .
   git commit -m "feat: implement Button atom component with fantasy styling"
   ```

3. Push to remote and create PR to `feature/react-rewrite`
   ```bash
   git push origin feature/task-1.1-button-component
   ```

## Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Build process or auxiliary tool changes

### Examples
```
feat(atoms): add Button component with fantasy styling
fix(molecules): resolve CharacterClassCard hover state issue
docs(readme): update installation instructions
test(organisms): add WorldMap component tests
```

## Code Review Process
1. All changes must go through PR review
2. PRs require at least one approval
3. All tests must pass
4. ESLint and Prettier checks must pass
5. No merge conflicts

## Testing Requirements
- Unit tests for all components
- Integration tests for complex workflows
- Coverage threshold: 80%
- All tests must pass before merge

## Development Commands
```bash
# Development server
npm run dev

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Linting and formatting
npm run lint
npm run lint:fix
npm run format
npm run format:check

# Build
npm run build
npm run preview
```