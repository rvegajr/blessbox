import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import compress from "astro-compress";
import partytown from "@astrojs/partytown";
import sitemap from "@astrojs/sitemap";
// https://astro.build/config
export default defineConfig({
   site: 'https://supremeuikits.com',
  integrations: [tailwind(), image({
    // By default, transformed images will be cached to ./node_modules/.astro/image. This can be configured in the integration’s config options. may be useful if your hosting provider allows caching between CI builds
    cacheDir: "./.cache/image"
  }), compress(), partytown(), sitemap()]
});