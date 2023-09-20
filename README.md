# zdv_training_scheduler

A simple website for scheduling training sessions for the [VATSIM](https://vatsim.net/) [Denver ARTCC](https://zdvartcc.org/).

## Tech

- [Astro](https://astro.build/)
- [Tailwind](https://tailwindcss.com/) with help from [Flowbite](https://flowbite.com/) and [Realtime Colors](https://realtimecolors.com/)
- [React](https://react.dev/)
- [Prisma](https://www.prisma.io/)
- [SQLite](https://www.sqlite.org/index.html)
- [TypeScript](https://www.typescriptlang.org/)
- [Node](https://nodejs.org/en)

This is first and foremost an Astro project, allowing the site to utilize [SSR](https://docs.astro.build/en/guides/server-side-rendering/) to build a [MPA](https://docs.astro.build/en/concepts/why-astro/#server-first) site (rather than SPA from just React) with backend included. React is used for client-side functionality. Prisma and SQLite provide storage. OAuth with ZDV's OAuth provides authentication and authorization. Once [Bun](https://bun.sh/) in Astro stabilizes, this project will likely it in over Node.

## Building

1. Install Node 16.12.0 or later
1. Clone the repo
1. Run `npm ci` to install dependencies
1. Populate the environment variables (you can store them in a `.env` file at the project level):

    - ZDV_OAUTH_CLIENT_ID - the OAuth client ID (from ZDV DB)
    - ZDV_OAUTH_CLIENT_SECRET - the OAuth client ID (from ZDB DB)
    - ZDV_OAUTH_REDIRECT_URI - your site URL then "/sso/callback"

1. Run `npm run dev` to run the dev server

## Contribution

This project is currently **not** open to outside contributions.

## License

MIT or Apache-2.0
