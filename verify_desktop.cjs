const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('BROWSER ' + m.type().toUpperCase() + ':', m.text()); });
  page.on('pageerror', e => { errors.push(e.message); console.log('BROWSER PAGEERROR:', e.message); });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  // Click Recipes tab
  const recipesTab = page.locator('button[role="tab"]').filter({ hasText: /^(Recipes|Recetas)$/ });
  await recipesTab.first().click();
  await page.waitForTimeout(500);

  const info = await page.evaluate(() => {
    const app = document.querySelector('.app');
    const cs = app ? getComputedStyle(app) : {};
    const sections = Array.from(document.querySelectorAll('section'));
    const recipesList = document.querySelector('.recipes-list');
    const recipeCards = document.querySelectorAll('.recipe-card');
    const methodCards = document.querySelectorAll('.method-card');
    return {
      appDisplay: cs.display,
      appGridTemplateColumns: cs.gridTemplateColumns,
      nSections: sections.length,
      sections: sections.map(s => ({ class: s.className, style: s.getAttribute('style'), gridColumn: getComputedStyle(s).gridColumn, visible: s.offsetParent ? 'yes' : 'no' })),
      recipesListVisible: recipesList ? 'yes' : 'no',
      recipesListGrid: recipesList ? getComputedStyle(recipesList).gridTemplateColumns : 'n/a',
      nRecipeCards: recipeCards.length,
      nMethodCards: methodCards.length,
      bodyTextLen: document.body.innerText.length,
      hasRecipesTitle: !!document.querySelector('h2').textContent.includes('Receta'),
      visibleText: document.body.innerText.slice(0, 2000),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  console.log('ERRORS:', errors);
  await browser.close();
})();
