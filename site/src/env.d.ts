/// <reference types="astro/client" />

// TODO if handling TZ conversion on client, do I need this?
declare namespace App {
  interface Locals {
    timezone: string;
  }
}
