# Backend api

> A `typescript` production-grade backend API service. Built with node20. Designed for container deployment.

## Quick Start

### Prerequisites
- Node.js node20
- npm or yarn

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Testing

```bash
npm test
```

## Building

```bash
npm run build
```

## Deployment

This project is containerized. Build and deploy using:

```bash
docker build -t app .
docker run -p 8080:8080 app
```

## Code Standards

This project enforces strict code standards:
- **Linting**: ESLint for code style
- **Testing**: All changes must have tests
- **Type Safety**: TypeScript strict mode
- **Security**: Automated dependency scanning

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## CI/CD

This repository uses GitHub Actions for:
- Continuous Integration (testing, linting, type-checking)
- Security scanning (CodeQL, dependency scanning)
- Automated releases

See [.github/workflows/](./.github/workflows/) for workflow definitions.

## Support

For issues, questions, or suggestions, please [open an issue](../../issues).

## License

MIT
