import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';

/** The 5-minute demo, end to end, as a brand-new resident. */

const stamp = Date.now();
const email = `demo${stamp}@example.org`;

async function photo(colour: string) {
  return { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: await sharp({ create: { width: 1200, height: 900, channels: 3, background: colour } }).jpeg().toBuffer() };
}

async function noAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

async function logInAs(page: Page, who: 'Aina · resident' | 'Dr Siti · organiser') {
  await page.goto('/login');
  await page.getByRole('button', { name: who }).click();
  await page.waitForURL('/');
}

test('logged-out visitors only see the welcome, sign-up and login pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /sign up|join/i }).first()).toBeVisible();
  await noAxeViolations(page);
  for (const path of ['/activities', '/workshops', '/profile']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=/);
  }
});

test('sign up → profile → feed → post → activities → workshops → recycling → neighbour', async ({ page, request }) => {
  // 1. Sign up with a house address (kept private).
  await page.goto('/signup');
  await page.getByLabel('Your name').fill('Jackson Tan');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('elmina-2026');
  await page.getByLabel('House address').fill('12 Jalan Ficus U15/2');
  await page.getByLabel('Area in City of Elmina').selectOption('Elmina West');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();

  // 2. Set up a profile with a photo and bio.
  await page.waitForURL('/welcome');
  await page.locator('input[type=file][name=photo]').setInputFiles(await photo('#c2410c'));
  await page.getByLabel('A little about you').fill('New to Elmina West. Love futsal and morning walks.');
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await page.waitForURL('/');

  // 3. The feed: like and comment on a neighbour's post.
  const first = page.getByRole('article').first();
  await first.getByRole('button', { name: 'Like' }).click();
  await expect(first.getByRole('button', { name: 'Unlike' })).toBeVisible();
  await first.getByLabel('Add a comment').fill('Lovely photo!');
  await first.getByRole('button', { name: 'Post', exact: true }).click();
  await expect(first.getByText('Lovely photo!')).toBeVisible();

  // 4. Join an activity hosted by a neighbour.
  await page.goto('/activities');
  await page.getByRole('link', { name: /Futsal night/ }).first().click();
  await page.getByRole('button', { name: 'Join activity' }).click();
  await expect(page.getByText('You’re going! See you there.')).toBeVisible();
  await expect(page.getByText('1 of 12 spots left')).toBeVisible();

  // 5. Share a photo from it.
  await page.getByRole('link', { name: 'Share a photo from this' }).click();
  await expect(page.getByLabel('Tag an activity or workshop (optional)').locator('option:checked')).toHaveText(/Futsal night/);
  await page.locator('input[type=file][name=photo]').setInputFiles(await photo('#166534'));
  await page.getByLabel('Caption').fill('Can’t wait for futsal night ⚽');
  await page.getByRole('button', { name: 'Share post' }).click();
  await page.waitForURL('/');
  const mine = page.getByRole('article', { name: 'Post by Jackson Tan' }).first();
  await expect(mine.getByText('Can’t wait for futsal night')).toBeVisible();
  await expect(mine.getByRole('link', { name: /Futsal night/ })).toBeVisible();

  // 6. Host your own activity.
  await page.goto('/activities/new');
  await page.getByLabel('Title').fill('Evening badminton for beginners');
  await page.getByRole('combobox', { name: 'Category' }).selectOption('Sports');
  await page.getByLabel('Where in City of Elmina').selectOption({ index: 1 });
  await page.getByLabel('Description').fill('Relaxed games, rackets to share.');
  await page.getByRole('button', { name: 'Publish activity' }).click();
  await page.waitForURL(/\/activities\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { name: 'Evening badminton for beginners' })).toBeVisible();
  await expect(page.getByText('You’re hosting this activity.')).toBeVisible();

  // 7. Workshops: this month's climate theme, then join one.
  await page.goto('/workshops');
  await expect(page.getByText('this month’s climate theme')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'This month’s climate workshops' })).toBeVisible();
  await page.getByRole('link', { name: /Recycle right: what goes where/ }).first().click();
  await page.getByRole('button', { name: 'Join workshop' }).click();
  await expect(page.getByText('You’re going! See you there.')).toBeVisible();
  // Residents can't host workshops.
  await page.goto('/workshops/new');
  await expect(page.getByRole('button', { name: 'Publish workshop' })).toHaveCount(0);

  // 8. Profile: posts, joined, hosting, and the recycling tracker.
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Jackson Tan', level: 1 })).toBeVisible();
  await expect(page.getByText('New to Elmina West. Love futsal and morning walks.')).toBeVisible();
  await expect(page.getByText('12 Jalan Ficus')).toHaveCount(0);
  // Uploaded photos load for residents only (a logged-out request can't even tell they exist).
  const avatar = (await page.locator('.profile-head .avatar img').getAttribute('src'))!;
  expect((await page.request.get(avatar)).headers()['content-type']).toBe('image/jpeg');
  expect((await request.get(avatar)).status()).toBe(404);
  await page.getByRole('combobox', { name: 'Material' }).selectOption('plastic');
  await page.getByRole('spinbutton', { name: 'Kilograms' }).fill('1.5');
  await page.getByRole('button', { name: 'Add to my tracker' }).click();
  await expect(page.locator('.recycle-total')).toHaveText('1.5 kg');
  await page.getByRole('link', { name: 'Joined' }).click();
  await expect(page.getByRole('link', { name: /Futsal night/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Recycle right/ })).toBeVisible();
  await page.getByRole('link', { name: 'Hosting' }).click();
  await expect(page.getByRole('link', { name: /Evening badminton for beginners/ })).toBeVisible();
  await noAxeViolations(page);

  // 9. A neighbour's profile: no recycling tracker and no address.
  await page.goto('/activities');
  await page.getByRole('link', { name: /Futsal night/ }).first().click();
  await page.getByRole('link', { name: /Hafiz/ }).first().click();
  await page.waitForURL(/\/u\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hafiz');
  await expect(page.getByText('My recycling')).toHaveCount(0);
  await expect(page.getByText(/Sample address/)).toHaveCount(0);
  await noAxeViolations(page);
});

test('an organiser hosts a monthly climate workshop', async ({ page }) => {
  await logInAs(page, 'Dr Siti · organiser');
  await page.goto('/workshops/new');
  await page.getByLabel('Title').fill('Heat-smart homes: keep cool for less');
  await page.getByRole('combobox', { name: 'Topic' }).selectOption('Climate');
  await page.getByRole('checkbox', { name: /Part of this month’s climate theme/ }).check();
  await page.getByLabel('Where in City of Elmina').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Publish workshop' }).click();
  await page.waitForURL(/\/workshops\/[0-9a-f-]{36}$/);
  await page.goto('/workshops');
  await expect(page.locator('section', { has: page.getByRole('heading', { name: 'This month’s climate workshops' }) }).getByRole('link', { name: /Heat-smart homes/ })).toBeVisible();
});

test('every main screen passes axe and fits a 360px phone without sideways scrolling', async ({ page }) => {
  await logInAs(page, 'Aina · resident');
  await page.setViewportSize({ width: 360, height: 780 });
  for (const path of ['/', '/activities', '/workshops', '/profile', '/post/new', '/activities/new']) {
    await page.goto(path);
    await expect(page.locator('main h1, main [aria-label="Create a new post"]').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(360);
    await noAxeViolations(page);
  }
  await page.locator('summary[aria-label="Create"]').click();
  await expect(page.getByRole('link', { name: /New post/ })).toBeVisible();
});
