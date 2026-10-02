import { expect, type Locator, type Page } from '@playwright/test'

// The character API is stubbed: the suite must not depend on the network.
const CHARACTERS = {
  data: {
    characters: {
      results: [
        {
          id: '1',
          name: 'Rick Sanchez',
          image: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
          species: 'Human',
          status: 'Alive',
        },
      ],
    },
  },
}

/** Stubs the character API and opens the app. */
export async function openBoard(page: Page) {
  await page.route('https://rickandmortyapi.com/graphql', (route) =>
    route.fulfill({ json: CHARACTERS }),
  )
  await page.goto('/')
}

export const column = (page: Page, name: 'To Do' | 'Doing' | 'Done') =>
  page.getByRole('region', { name })
export const card = (scope: Page | Locator, title: string) =>
  scope.getByRole('article').filter({ hasText: title })
export const titles = (scope: Locator) => scope.getByRole('heading', { level: 3 })
/** The draggable card body, a button named "{title}, assigned to {character}". */
export const draggable = (scope: Page | Locator, title: string) =>
  scope.getByRole('button', { name: new RegExp(`^${title}, assigned to `) })

/** Creates a card through the form. New cards land at the top of To Do. */
export async function addCard(page: Page, title: string) {
  await page.getByLabel('Title').fill(title)
  await page.getByRole('radiogroup', { name: 'Character' }).getByText('Rick Sanchez').click()
  await page.getByRole('button', { name: 'Add to To Do' }).click()
  await expect(card(column(page, 'To Do'), title)).toBeVisible()
}

// Keyboard dragging

/**
 * Gives dnd-kit two frames to catch up. Its keyboard sensor starts listening for arrow keys
 * just after pick-up, and works out each move from the card's rendered position, so a key
 * sent in the same tick as the previous one is lost. No person types that fast.
 */
const settle = (page: Page) =>
  page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  )

/** Focuses a card and picks it up with Space. */
export async function pickUp(page: Page, title: string) {
  await draggable(page, title).focus()
  await page.keyboard.press('Space')
  await expect(draggable(page, title)).toHaveAttribute('aria-pressed', 'true')
  await settle(page)
}

export async function arrow(page: Page, key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') {
  await page.keyboard.press(key)
  await settle(page)
}

export async function drop(page: Page, title: string) {
  await page.keyboard.press('Space')
  await expect(draggable(page, title)).not.toHaveAttribute('aria-pressed', 'true')
  // Wait out the drop animation; a new drag can't start until the lifted copy is gone.
  await expect(page.locator('[data-state="dragging"]')).toHaveCount(0)
}
