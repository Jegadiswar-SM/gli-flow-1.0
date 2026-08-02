import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

test("beginner run screen is wired to the backend", async () => {
  const source = await readFile(new URL("../src/RunDesignPage.jsx", import.meta.url), "utf8")
  assert.match(source, /\/api\/run/)
  assert.match(source, /Run design/)
  assert.match(source, /Mock mode/)
})

test("run details expose evidence and prediction endpoints", async () => {
  const source = await readFile(new URL("../src/RunDetail.jsx", import.meta.url), "utf8")
  assert.match(source, /\/prediction/)
  assert.match(source, /report\/reproducibility/)
  assert.match(source, /Reproducibility/)
})

test("dashboard keeps accessible labels for core inputs", async () => {
  const source = await readFile(new URL("../src/WorkbenchPage.jsx", import.meta.url), "utf8")
  assert.match(source, /aria-label="Design folder path"/)
  assert.match(source, /focus-visible:outline/)
})
