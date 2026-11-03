import { cp } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

/** Vinext build tidak selalu menyalin semua aset `public/` ke `dist/client` — favicon wajib ada di edge. */
const PUBLIC_ICON_FILES = [
  "favicon.ico",
  "favicon.svg",
  "icon.png",
  "apple-touch-icon.png",
] as const;

export function copyPublicIconsPlugin(): Plugin {
  let root = process.cwd();
  let command: "build" | "serve" = "build";

  return {
    name: "workrecord-copy-public-icons",
    configResolved(config) {
      root = config.root;
      command = config.command;
    },
    async closeBundle() {
      if (command !== "build") return;

      const clientDir = resolve(root, "dist", "client");
      const publicDir = resolve(root, "public");

      for (const name of PUBLIC_ICON_FILES) {
        await cp(resolve(publicDir, name), resolve(clientDir, name), {
          force: true,
        });
      }

      await cp(
        resolve(publicDir, "favicon.svg"),
        resolve(clientDir, "brand", "favicon.svg"),
        { force: true },
      );
    },
  };
}
