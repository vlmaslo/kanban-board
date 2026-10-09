import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import {
  addCard,
  arrow,
  card,
  column,
  drop,
  draggable,
  openBoard,
  pickUp,
  titles,
} from './helpers.ts'

// axe checks the WCAG A and AA rules a machine can check; the specs below it cover things axe
// cannot see. Passing these is not a conformance claim.
const WCAG_22_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze()
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([])
}

test.beforeEach(({ page }) => openBoard(page))

test.describe('axe: no automated WCAG A/AA violations', () => {
  test('empty board', async ({ page }) => {
    await expectNoViolations(page)
  })

  test('board with cards in every column', async ({ page }) => {
    for (const title of ['Alpha', 'Beta', 'Gamma']) await addCard(page, title)
    await pickUp(page, 'Beta')
    await arrow(page, 'ArrowRight')
    await drop(page, 'Beta')
    await pickUp(page, 'Alpha')
    await arrow(page, 'ArrowRight')
    await arrow(page, 'ArrowRight')
    await drop(page, 'Alpha')
    await expect(titles(column(page, 'Done'))).toHaveText(['Alpha'])
    // Let the celebration finish so the card is measured at rest.
    await expect(card(page, 'Alpha')).toHaveAttribute('data-state', 'default')
    await expectNoViolations(page)
  })

  test('form showing validation errors', async ({ page }) => {
    await page.getByRole('button', { name: 'Add to To Do' }).click()
    await expect(page.getByText('Give the task a title')).toBeVisible()
    await expectNoViolations(page)
  })

  test('form with a character chosen', async ({ page }) => {
    await page.getByRole('radiogroup', { name: 'Character' }).getByText('Rick Sanchez').click()
    await expect(page.getByRole('radio', { name: /Rick Sanchez/ })).toBeChecked()
    await expectNoViolations(page)
  })
})

test('a card is a list item whose body is a named button, with delete beside it', async ({
  page,
}) => {
  await addCard(page, 'Alpha')
  const item = column(page, 'To Do').getByRole('listitem')
  await expect(item).toHaveCount(1)
  await expect(draggable(item, 'Alpha')).toHaveAccessibleName('Alpha, assigned to Rick Sanchez')
  // Not nested: a button inside a button is unreachable for assistive tech.
  await expect(draggable(item, 'Alpha').getByRole('button')).toHaveCount(0)
  await expect(item.getByRole('button', { name: 'Delete Alpha' })).toBeVisible()
})

test('every control on a card is at least 24 by 24 pixels (2.5.8)', async ({ page }) => {
  await addCard(page, 'Alpha')
  const controls = card(page, 'Alpha').getByRole('button')
  await expect(controls).toHaveCount(2)
  for (const control of await controls.all()) {
    const box = await control.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(24)
    expect(box?.height).toBeGreaterThanOrEqual(24)
  }
})

test('drag announcements name the card and the column', async ({ page }) => {
  await addCard(page, 'Alpha')
  await draggable(page, 'Alpha').focus()
  await page.keyboard.press('Space')
  // "Picked up…" is replaced at once by the first "is over…" message, so accept either.
  const liveRegion = page.getByRole('status').filter({ hasText: 'Alpha' })
  await expect(liveRegion).toHaveText(/^(Picked up Alpha in To Do|Alpha is over To Do)\.$/)
  await page.keyboard.press('Escape')
  await expect(liveRegion).toHaveText('Moving Alpha was cancelled. It was put back.')
})

test('undo is a big enough target, keeps focus and announces what it undid', async ({ page }) => {
  const undo = page.getByRole('button', { name: 'Undo', exact: true })
  await expect(undo).toHaveAttribute('aria-disabled', 'true')
  const box = await undo.boundingBox()
  expect(box?.width).toBeGreaterThanOrEqual(24)
  expect(box?.height).toBeGreaterThanOrEqual(24)

  await addCard(page, 'Alpha')
  await pickUp(page, 'Alpha')
  await arrow(page, 'ArrowRight')
  await drop(page, 'Alpha')
  await undo.click()
  await expect(page.getByRole('status').filter({ hasText: 'Undid' })).toHaveText(
    'Undid: moved Alpha to Doing.',
  )

  await undo.click()
  await expect(page.getByRole('status').filter({ hasText: 'Undid' })).toHaveText(
    'Undid: added Alpha.',
  )
  await expect(undo).toHaveAttribute('aria-disabled', 'true')
  await expect(undo).toBeFocused()
  await expectNoViolations(page)
})

test.describe('narrow screen', () => {
  test.use({ viewport: { width: 320, height: 640 } })

  test('fits 320px wide without sideways scrolling (1.4.10)', async ({ page }) => {
    await addCard(page, 'A fairly long card title to wrap on a small screen')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
    await expectNoViolations(page)
  })
})
