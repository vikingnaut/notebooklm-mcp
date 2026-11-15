/**
 * Read the notebooks in the signed-in Google account from the NotebookLM
 * home page, so they can be queried without collecting share links first.
 */

import type { BrowserContext } from "patchright";
import type { AuthManager } from "../auth/auth-manager.js";
import { isNotebookLmUrl } from "../config.js";
import { Selectors } from "./selectors.js";
import { log } from "../utils/logger.js";

export interface AccountNotebook {
  title: string;
  /** Absolute notebook URL; pass it as `notebook_url` or to `add_notebook`. */
  url: string;
  /** As shown on the card, e.g. "Oct 25, 2026". */
  date: string | null;
  sources: number | null;
  emoji: string | null;
}

const HOME_URL = "https://notebooklm.google.com/"; // Google forwards to notebook.google.com where needed

export async function listAccountNotebooks(
  context: BrowserContext,
  authManager: AuthManager
): Promise<AccountNotebook[]> {
  if (!(await authManager.validateCookiesExpiry(context))) {
    const statePath = await authManager.getValidStatePath();
    if (statePath) await authManager.loadAuthState(context, statePath);
  }

  const page = await context.newPage();
  try {
    await page.goto(HOME_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
    if (!isNotebookLmUrl(page.url())) {
      throw new Error(`Not signed in to NotebookLM (landed on ${page.url()}). Run setup_auth.`);
    }

    const h = Selectors.home;
    // An empty account has no cards, so a missing card is not an error.
    await page.waitForSelector(h.card, { timeout: 30_000 }).catch(() => undefined);

    const seeAll = page.locator(h.seeAll).first();
    if (await seeAll.isVisible().catch(() => false)) {
      await seeAll.click();
      await page.waitForTimeout(2_000);
    }
    // The full list can load in pages as it scrolls; stop once the count holds.
    let previous = -1;
    for (let i = 0; i < 30; i++) {
      const count = await page.locator(h.card).count();
      if (count === previous) break;
      previous = count;
      await page
        .locator(h.card)
        .last()
        .scrollIntoViewIfNeeded()
        .catch(() => undefined);
      await page.waitForTimeout(1_000);
    }

    const notebooks = await page.evaluate((s) => {
      const text = (root: Element, sel: string) =>
        (root.querySelector<HTMLElement>(sel)?.innerText ?? "").trim() || null;
      return Array.from(document.querySelectorAll(s.card)).flatMap((card) => {
        const href = card.querySelector<HTMLAnchorElement>(s.link)?.href;
        if (!href) return [];
        const sources = text(card, s.sources)?.match(/\d+/);
        return [
          {
            title: text(card, s.title) ?? "Untitled notebook",
            url: href,
            date: text(card, s.date),
            sources: sources ? Number(sources[0]) : null,
            emoji: text(card, s.icon),
          },
        ];
      });
    }, h);
    log.success(`  📚 Found ${notebooks.length} notebooks in the account`);
    return notebooks;
  } finally {
    await page.close().catch(() => undefined);
  }
}
