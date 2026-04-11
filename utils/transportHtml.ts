import { expect } from '@playwright/test';

export type TransportCartProduct = {
  id: string;
  name: string;
  price: string;
  quantity: number;
  total: string;
};

export function extractCsrfToken(html: string): string {
  const match = html.match(/name=["']csrfmiddlewaretoken["']\s+value=["']([^"']+)["']/i);

  expect(match, 'CSRF token was not found in HTML response').not.toBeNull();
  return match![1];
}

export function extractOrderIdFromLocation(location: string): string {
  const match = location.match(/\/payment_done\/(\d+)/);

  expect(location, 'Payment redirect location should contain order id').toMatch(/\/payment_done\/\d+/);
  return match![1];
}

export function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export function parseCartProducts(html: string): TransportCartProduct[] {
  const products: TransportCartProduct[] = [];
  const rowPattern = /<tr[^>]+id=["']product-(\d+)["'][\s\S]*?<\/tr>/gi;

  for (const rowMatch of html.matchAll(rowPattern)) {
    const rowHtml = rowMatch[0];
    const id = rowMatch[1];
    const nameMatch = rowHtml.match(/class=["'][^"']*cart_description[^"']*["'][\s\S]*?<h4>\s*<a[^>]*>([\s\S]*?)<\/a>/i);
    const priceMatch = rowHtml.match(/class=["'][^"']*cart_price[^"']*["'][\s\S]*?<p>([\s\S]*?)<\/p>/i);
    const quantityMatch = rowHtml.match(/class=["'][^"']*cart_quantity[^"']*["'][\s\S]*?<button[^>]*>(\d+)<\/button>/i);
    const totalMatch = rowHtml.match(/class=["'][^"']*cart_total_price[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);

    expect(nameMatch, `Expected cart row for product ${id} to contain product name`).toBeTruthy();
    expect(priceMatch, `Expected cart row for product ${id} to contain product price`).toBeTruthy();
    expect(quantityMatch, `Expected cart row for product ${id} to contain product quantity`).toBeTruthy();
    expect(totalMatch, `Expected cart row for product ${id} to contain product total`).toBeTruthy();

    products.push({
      id,
      name: stripHtml(nameMatch![1]),
      price: stripHtml(priceMatch![1]),
      quantity: Number(quantityMatch![1]),
      total: stripHtml(totalMatch![1]),
    });
  }

  return products;
}
