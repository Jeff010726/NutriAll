import { expect, test } from '@playwright/test';

async function mock(page) {
  const writes = [];
  let contact = { id: 'cnt_abcdef', email: 'alex@example.com', name: 'Alex', phone: '', language: '', notes: '', subscription_status: 'subscribed', revision: 1, tags: 'Imported September 19th, 2026', sources: 'kit,bookings', original_subscribed_at: '2025-01-01T00:00:00Z' };
  const tags = [{ id: 'kit_tag_1', name: 'Imported September 19th, 2026', contact_count: 1 }];
  await page.route('**/api/newsletter-manage/**', async (route) => {
    const request = route.request(), path = new URL(request.url()).pathname, method = request.method();
    if (path.endsWith('/auth/me')) return route.fulfill({ json: { admin: { email: 'owner@example.com' } } });
    if (path.endsWith('/tags')) return route.fulfill({ json: { tags } });
    if (path.endsWith('/summary')) return route.fulfill({ json: { contacts: [{ status: 'subscribed', count: 1 }], broadcasts: [{ source: 'kit', status: 'completed', count: 1 }], imports: [], tagCount: { count: 1 }, sending: { configured: false, reason: 'Test sending disabled.' } } });
    if (path.endsWith('/contacts')) return route.fulfill({ json: { contacts: [contact], total: 1, page: 1, pageSize: 50 } });
    if (path.endsWith('/contacts/cnt_abcdef')) {
      if (method === 'PUT') { const data = request.postDataJSON(); writes.push(data); contact = { ...contact, ...data, revision: contact.revision + 1 }; return route.fulfill({ json: { ok: true } }); }
      return route.fulfill({ json: { contact, tags, sources: [{ source: 'kit', source_id: '1' }, { source: 'bookings', source_id: '2' }], events: [] } });
    }
    if (path.endsWith('/broadcasts') && method === 'POST') { const data = request.postDataJSON(); writes.push(data); return route.fulfill({ json: { broadcast: { ...data, id: 'nbl_abcdef', revision: 1, status: 'draft' } } }); }
    if (path.endsWith('/broadcasts')) return route.fulfill({ json: { broadcasts: [{ id: 'kit_1', subject: 'Historical newsletter', source: 'kit', stats_json: JSON.stringify({ recipients: 100, open_rate: 35.6, click_rate: 1.2, unsubscribes: 2 }) }] } });
    if (path.endsWith('/broadcasts/kit_1')) return route.fulfill({ json: { broadcast: { id: 'kit_1', subject: 'Historical newsletter', source: 'kit', revision: 1, content_html: '<h2>Welcome</h2><script>parent.location="https://untrusted.example"</script><img src="https://untrusted.example/track">', stats_json: '{}' } } });
    return route.fulfill({ status: 404, json: { error: 'Not found' } });
  });
  return writes;
}
test('desktop workspace can find and edit an existing customer while preserving subscription and source records', async ({ page }) => {
  const writes = await mock(page);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/newsletter-admin');
  await expect(page.getByRole('heading', { name: '总览', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '客户与订阅者', exact: true }).click();
  await page.getByRole('button', { name: '查看', exact: true }).click();
  await page.getByLabel('姓名', { exact: true }).fill('Alex updated');
  await page.getByLabel('内部备注').fill('Follow up next week');
  await page.getByRole('button', { name: '保存客户资料' }).click();
  await expect(page.getByRole('status')).toContainText('客户资料已保存');
  await expect(page.getByLabel('姓名', { exact: true })).toHaveValue('Alex updated');
  expect(writes[0].subscription_status).toBe('subscribed');
  await expect(page.getByText('预约记录保留在原后台', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '关闭客户详情' }).click();
  await page.screenshot({ path: 'test-results/newsletter-desktop.png', fullPage: true });
});
test('archived HTML is sandboxed, tracking images do not load, and a duplicate can be saved as a new draft', async ({ page }) => {
  const writes = await mock(page), external = [];
  page.on('request', (request) => { if (request.url().includes('untrusted.example')) external.push(request.url()); });
  await page.goto('/newsletter-admin');
  await page.getByRole('button', { name: '群发邮件', exact: true }).click();
  await page.getByRole('button', { name: '打开', exact: true }).click();
  await expect(page.getByTitle('邮件内容预览')).toHaveAttribute('sandbox', '');
  await expect(page.getByTitle('邮件内容预览')).toHaveAttribute('srcdoc', /default-src 'none'/);
  await page.getByRole('button', { name: '复制为新草稿' }).click();
  await page.getByRole('button', { name: '保存草稿' }).click();
  await expect(page.getByRole('status')).toContainText('草稿已保存');
  expect(writes[0].id).toBeUndefined();
  expect(external).toEqual([]);
});
test('mobile navigation, customer drawer and filters fit a phone viewport', async ({ page }) => {
  await mock(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/newsletter-admin');
  await expect(page.getByRole('heading', { name: '总览', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/newsletter-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole('button', { name: '客户与订阅者', exact: true }).click();
  await page.getByRole('button', { name: '查看', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '客户详情' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
