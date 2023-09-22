# zdv-training-scheduler

[![CI](https://github.com/Celeo/zdv-training-scheduler/actions/workflows/ci.yml/badge.svg)](https://github.com/Celeo/zdv-training-scheduler/actions/workflows/ci.yml)

Website for scheduling training sessions for the [VATSIM](https://vatsim.net/) [Denver ARTCC](https://zdvartcc.org/).

## Tech

- [Astro](https://astro.build/)
- [Tailwind](https://tailwindcss.com/) with help from [Flowbite](https://flowbite.com/) and [Realtime Colors](https://realtimecolors.com/)
- [React](https://react.dev/)
- [Prisma](https://www.prisma.io/)
- [SQLite](https://www.sqlite.org/index.html)
- [TypeScript](https://www.typescriptlang.org/)
- [Node](https://nodejs.org/en)

This is first and foremost an Astro project, allowing the site to utilize [SSR](https://docs.astro.build/en/guides/server-side-rendering/) to build a [MPA](https://docs.astro.build/en/concepts/why-astro/#server-first) site (rather than SPA from just React) with backend included. React is used for client-side functionality. Prisma and SQLite provide storage. OAuth via ZDV provides authentication and authorization. Once [Bun](https://bun.sh/) in Astro stabilizes, this project will likely uptake it to replace Node.

## Building

1. Install Node 16.12.0 or later
1. Clone the repo
1. Run `npm ci` to install dependencies
1. Prepare the configuration by copying ".config.example.toml" to ".config.toml" and populate
1. Run `npm run dev` to run the dev server

## Contribution

This project is currently not open to outside contributions as it is actively in-dev.

## License

- Project under MIT or Apache-2.0
- Libraries in use under their respective licenses
