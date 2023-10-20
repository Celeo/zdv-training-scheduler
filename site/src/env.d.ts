/// <reference types="astro/client" />

// I don't know why I can't just import the ZdvInfo type from auth.ts

declare namespace App {
  interface Locals {
    timezone: string;
    auth: null | {
      cid: number;
      email: string;
      first_name: string;
      last_name: string;
      operating_initials: string;
      roles: Array<string>;
    };
  }
}
