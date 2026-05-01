# AutocodeLLM

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FJyf0214%2FAutocodeLLM.svg?type=small)](https://app.fossa.com/projects/git%2Bgithub.com%2FJyf0214%2FAutocodeLLM?ref=badge_small)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FJyf0214%2FAutocodeLLM.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2FJyf0214%2FAutocodeLLM?ref=badge_shield&issueType=security)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FJyf0214%2FAutocodeLLM.svg?type=large&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2FJyf0214%2FAutocodeLLM?ref=badge_large&issueType=license)

## Overview

AutocodeLLM is a full-stack 项目 management platform with AI integration capabilities. It provides:

- Multi-项目 management with isolated environments
- Model Context Protocol (MCP) server configuration
- AI provider and model management
- WebDAV cloud storage integration
- Built-in terminal, chat, logging, and backup systems
- Extensible skills and agents system for LLM enhancement
- Environment variable management for shell and terminal operations
。
## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Ant Design, Zustand
- **Backend**: Node.js, Prisma ORM (MySQL)
- **DevOps**: Docker, Bun runtime, GitHub Actions
- **AI Integration**: MCP protocol, Function calling, Custom skills

## Getting Started

1. Install dependencies: `bun install`
2. Set up environment: Copy `.env.example` to `.env` and configure
3. Generate Prisma client: `bun run db:generate`
4. Push database schema: `bun run db:push`
5. Start development server: `bun run dev`

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run typecheck` - Run TypeScript check
- `bun run test` - Run Vitest tests
- `bun run db:generate` - Generate Prisma client
- `bun run db:push` - Push schema to database
- `bun run db:studio` - Open Prisma Studio

## Documentation

- Project architecture and routing: See `skills/autocodellm-dev/SKILL.md`
- Comprehensive project documentation: See `PROJECT.md`
- API references: Inline JSDoc/TSDoc
- Database schema: `prisma/schema.prisma`

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## Security

Please report security vulnerabilities privately to project maintainers. Do NOT disclose security issues publicly until they have been addressed.
yy