import { expect, test, type Locator, type Page } from '@playwright/test'
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

// Drag and drop needs real layout, which jsdom doesn't have, so it is tested here in a browser.
test.beforeEach(({ page }) => openBoard(page))

async function centre(locator: Locator) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('element has no bounding box')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

/** Picks up `source` and carries it over `target` in small steps, without releasing. */
async function dragOver(page: Page, source: Locator, target: Locator) {
  const from = await centre(source)
  const to = await centre(target)
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  // A first nudge past the sensor's 5px activation distance starts the drag.
  await page.mouse.move(from.x + 10, from.y, { steps: 5 })
  await page.mouse.move(to.x, to.y, { steps: 15 })
  // dnd-kit measures on pointer moves; a final move lets the last collision settle.
  await page.mouse.move(to.x, to.y + 1, { steps: 2 })
}

async function dragAndDrop(page: Page, source: Locator, target: Locator) {
  await dragOver(page, source, target)
  await page.mouse.up()
}

test('moves a card to another column', async ({ page }) => {
  await addCard(page, 'Fix the portal gun')

  await dragAndDrop(
    page,
    draggable(page, 'Fix the portal gun'),
    column(page, 'Doing').getByRole('list'),
  )

  await expect(card(column(page, 'Doing'), 'Fix the portal gun')).toBeVisible()
  await expect(card(column(page, 'To Do'), 'Fix the portal gun')).toHaveCount(0)
})

test('reorders cards within a column', async ({ page }) => {
  await addCard(page, 'Alpha')
  await addCard(page, 'Beta')
  const todo = column(page, 'To Do')
  await expect(titles(todo)).toHaveText(['Beta', 'Alpha'])

  await dragAndDrop(page, draggable(todo, 'Beta'), card(todo, 'Alpha'))

  await expect(titles(todo)).toHaveText(['Alpha', 'Beta'])
})

test('inserts a card between the cards of another column', async ({ page }) => {
  await addCard(page, 'Alpha')
  await addCard(page, 'Beta')
  const doing = column(page, 'Doing')
  await dragAndDrop(page, draggable(page, 'Alpha'), doing.getByRole('list'))
  await expect(titles(doing)).toHaveText(['Alpha'])

  // Dropped on Alpha's upper half, so Beta goes above it.
  const alpha = await card(doing, 'Alpha').boundingBox()
  if (!alpha) throw new Error('Alpha has no bounding box')
  const beta = await centre(draggable(page, 'Beta'))
  await page.mouse.move(beta.x, beta.y)
  await page.mouse.down()
  await page.mouse.move(beta.x + 10, beta.y, { steps: 5 })
  await page.mouse.move(alpha.x + alpha.width / 2, alpha.y + 4, { steps: 15 })
  await page.mouse.move(alpha.x + alpha.width / 2, alpha.y + 5, { steps: 2 })
  await page.mouse.up()

  await expect(titles(doing)).toHaveText(['Beta', 'Alpha'])
})

test('celebrates when a card enters Done, but not when it is reordered there', async ({ page }) => {
  await addCard(page, 'Alpha')
  await addCard(page, 'Beta')
  const done = column(page, 'Done')

  await dragAndDrop(page, draggable(page, 'Alpha'), done.getByRole('list'))
  await expect(card(done, 'Alpha')).toHaveAttribute('data-state', 'celebrating')
  // The celebration clears itself.
  await expect(card(done, 'Alpha')).toHaveAttribute('data-state', 'default')

  await dragAndDrop(page, draggable(page, 'Beta'), done.getByRole('list'))
  await expect(card(done, 'Beta')).toHaveAttribute('data-state', 'default')
  await expect(titles(done)).toHaveCount(2)

  const [first, second] = await titles(done).allTextContents()
  await dragAndDrop(page, draggable(done, first), card(done, second))
  await expect(titles(done)).toHaveText([second, first])
  await expect(card(done, first)).toHaveAttribute('data-state', 'default')
})

test('an empty column catches a card even when the columns are tall', async ({ page }) => {
  // Twelve cards make every column taller than the window. With dnd-kit's closestCorners an
  // empty column this tall loses to the cards beside it.
  for (let i = 1; i <= 12; i++) await addCard(page, `Card ${i}`)
  const doing = column(page, 'Doing')

  // Carry the top card straight sideways, level with where it started.
  const from = await centre(draggable(page, 'Card 12'))
  const list = await doing.getByRole('list').boundingBox()
  if (!list) throw new Error('Doing has no bounding box')
  const x = list.x + list.width / 2
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(from.x + 10, from.y, { steps: 5 })
  await page.mouse.move(x, from.y, { steps: 15 })
  await page.mouse.move(x, from.y + 1, { steps: 2 })
  await page.mouse.up()

  await expect(titles(doing)).toHaveText(['Card 12'])
  await expect(titles(column(page, 'To Do'))).toHaveCount(11)
})

test('Escape cancels a drag and puts the card back', async ({ page }) => {
  await addCard(page, 'Stay put')
  const doing = column(page, 'Doing')

  await dragOver(page, draggable(page, 'Stay put'), doing.getByRole('list'))
  // Mid-drag the card has already moved: this is the live preview.
  await expect(titles(doing)).toHaveText(['Stay put'])

  await page.keyboard.press('Escape')
  await page.mouse.up()

  await expect(titles(column(page, 'To Do'))).toHaveText(['Stay put'])
  await expect(titles(doing)).toHaveCount(0)
})

test.describe('keyboard', () => {
  test('moves a card into an empty column', async ({ page }) => {
    await addCard(page, 'Solo')
    const doing = column(page, 'Doing')

    await pickUp(page, 'Solo')
    await arrow(page, 'ArrowRight')
    await expect(titles(doing)).toHaveText(['Solo'])
    await drop(page, 'Solo')

    await expect(titles(doing)).toHaveText(['Solo'])
    await expect(titles(column(page, 'To Do'))).toHaveCount(0)
  })

  test('reorders a card down and back up within a column', async ({ page }) => {
    await addCard(page, 'Alpha')
    await addCard(page, 'Beta')
    await addCard(page, 'Gamma')
    const todo = column(page, 'To Do')
    await expect(titles(todo)).toHaveText(['Gamma', 'Beta', 'Alpha'])

    await pickUp(page, 'Gamma')
    await arrow(page, 'ArrowDown')
    await arrow(page, 'ArrowDown')
    await drop(page, 'Gamma')
    await expect(titles(todo)).toHaveText(['Beta', 'Alpha', 'Gamma'])

    await pickUp(page, 'Gamma')
    await arrow(page, 'ArrowUp')
    await drop(page, 'Gamma')
    await expect(titles(todo)).toHaveText(['Beta', 'Gamma', 'Alpha'])
  })

  test('moves a card into a column that already has cards', async ({ page }) => {
    await addCard(page, 'Alpha')
    await addCard(page, 'Beta')
    const doing = column(page, 'Doing')
    await pickUp(page, 'Alpha')
    await arrow(page, 'ArrowRight')
    await drop(page, 'Alpha')
    await expect(titles(doing)).toHaveText(['Alpha'])

    await pickUp(page, 'Beta')
    await arrow(page, 'ArrowRight')
    await drop(page, 'Beta')

    await expect(titles(doing)).toHaveCount(2)
    await expect(titles(column(page, 'To Do'))).toHaveCount(0)
  })

  test('moves the second card in a column sideways', async ({ page }) => {
    await addCard(page, 'Alpha')
    await addCard(page, 'Beta')
    await expect(titles(column(page, 'To Do'))).toHaveText(['Beta', 'Alpha'])

    await pickUp(page, 'Alpha')
    await arrow(page, 'ArrowRight')
    await drop(page, 'Alpha')

    await expect(titles(column(page, 'Doing'))).toHaveText(['Alpha'])
    await expect(titles(column(page, 'To Do'))).toHaveText(['Beta'])
  })

  test('moves a card into a tall empty column', async ({ page }) => {
    for (let i = 1; i <= 12; i++) await addCard(page, `Card ${i}`)

    await pickUp(page, 'Card 12')
    await arrow(page, 'ArrowRight')
    await drop(page, 'Card 12')

    await expect(titles(column(page, 'Doing'))).toHaveText(['Card 12'])
  })

  test('moves a card across the board to Done and celebrates', async ({ page }) => {
    await addCard(page, 'Finisher')
    const done = column(page, 'Done')

    await pickUp(page, 'Finisher')
    await arrow(page, 'ArrowRight')
    await expect(titles(column(page, 'Doing'))).toHaveText(['Finisher'])
    await arrow(page, 'ArrowRight')
    await expect(titles(done)).toHaveText(['Finisher'])
    await drop(page, 'Finisher')

    await expect(card(done, 'Finisher')).toHaveAttribute('data-state', 'celebrating')
  })

  test('moves a card back to the left', async ({ page }) => {
    await addCard(page, 'Boomerang')
    await pickUp(page, 'Boomerang')
    await arrow(page, 'ArrowRight')
    await drop(page, 'Boomerang')
    await expect(titles(column(page, 'Doing'))).toHaveText(['Boomerang'])

    await pickUp(page, 'Boomerang')
    await arrow(page, 'ArrowLeft')
    await drop(page, 'Boomerang')

    await expect(titles(column(page, 'To Do'))).toHaveText(['Boomerang'])
    await expect(titles(column(page, 'Doing'))).toHaveCount(0)
  })

  test('Escape cancels a keyboard move', async ({ page }) => {
    await addCard(page, 'Stay put')
    await pickUp(page, 'Stay put')
    await arrow(page, 'ArrowRight')
    await expect(titles(column(page, 'Doing'))).toHaveText(['Stay put'])

    await page.keyboard.press('Escape')

    await expect(titles(column(page, 'To Do'))).toHaveText(['Stay put'])
    await expect(titles(column(page, 'Doing'))).toHaveCount(0)
  })
})

// A drag dispatches a move for every column it crosses. Undo treats it as one step.
test.describe('undo', () => {
  const undoButton = (page: Page) => page.getByRole('button', { name: 'Undo', exact: true })

  /**
   * Clicks Undo once the lifted copy has landed. dnd-kit swallows clicks for 50ms after a
   * pointer drag ends, so that releasing a card does not click what is under it.
   */
  async function undo(page: Page) {
    await expect(page.locator('[data-state="dragging"]')).toHaveCount(0)
    await undoButton(page).click()
  }

  test('one undo puts back a card dragged across two columns', async ({ page }) => {
    await addCard(page, 'Alpha')
    await addCard(page, 'Beta')
    const todo = column(page, 'To Do')
    const done = column(page, 'Done')

    // The straight path from To Do to Done passes over Doing.
    await dragAndDrop(page, draggable(page, 'Beta'), done.getByRole('list'))
    await expect(titles(done)).toHaveText(['Beta'])

    await undo(page)

    await expect(titles(todo)).toHaveText(['Beta', 'Alpha'])
    await expect(titles(column(page, 'Doing'))).toHaveCount(0)
    await expect(titles(done)).toHaveCount(0)
  })

  test('undoes a reorder', async ({ page }) => {
    await addCard(page, 'Alpha')
    await addCard(page, 'Beta')
    const todo = column(page, 'To Do')
    await dragAndDrop(page, draggable(todo, 'Beta'), card(todo, 'Alpha'))
    await expect(titles(todo)).toHaveText(['Alpha', 'Beta'])

    await undo(page)

    await expect(titles(todo)).toHaveText(['Beta', 'Alpha'])
  })

  test('a cancelled drag is not a step', async ({ page }) => {
    await addCard(page, 'Stay put')
    await dragOver(page, draggable(page, 'Stay put'), column(page, 'Doing').getByRole('list'))
    await page.keyboard.press('Escape')
    await page.mouse.up()
    await expect(titles(column(page, 'To Do'))).toHaveText(['Stay put'])

    // The only step is creating the card, so one undo empties the board.
    await undo(page)

    await expect(page.getByRole('article')).toHaveCount(0)
    await expect(undoButton(page)).toHaveAttribute('aria-disabled', 'true')
  })

  test('one undo puts back a card moved two columns with the keyboard', async ({ page }) => {
    await addCard(page, 'Alpha')
    await addCard(page, 'Beta')
    await pickUp(page, 'Alpha')
    await arrow(page, 'ArrowRight')
    await arrow(page, 'ArrowRight')
    await drop(page, 'Alpha')
    await expect(titles(column(page, 'Done'))).toHaveText(['Alpha'])

    await undo(page)

    await expect(titles(column(page, 'To Do'))).toHaveText(['Beta', 'Alpha'])
    await expect(titles(column(page, 'Done'))).toHaveCount(0)
  })
})
