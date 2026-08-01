import { readdir, stat } from "node:fs/promises"
import { join } from "node:path"

const dist = new URL("../dist/assets/", import.meta.url)
// Monaco is self-hosted and the Workbench is intentionally lazy-loaded. The
// editor API is the largest asset; keep enough headroom for dependency updates
// without hiding an accidental eager import in the main application bundle.
const maxChunkBytes = 3_200 * 1024
const maxTotalBytes = 4_750 * 1024
const files = (await readdir(dist)).filter((name) => /\.(js|css)$/.test(name))
const sizes = await Promise.all(files.map(async (name) => [name, (await stat(join(dist.pathname, name))).size]))
const total = sizes.reduce((sum, [, size]) => sum + size, 0)
const largest = Math.max(...sizes.map(([, size]) => size), 0)
for (const [name, size] of sizes.sort((a, b) => b[1] - a[1])) console.log(`${name}: ${size} bytes`)
console.log(`bundle total: ${total} bytes (budget ${maxTotalBytes})`)
if (largest > maxChunkBytes || total > maxTotalBytes) {
  console.error(`Bundle budget exceeded: largest=${largest}, total=${total}`)
  process.exit(1)
}
