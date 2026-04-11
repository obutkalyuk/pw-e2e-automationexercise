import { test, expect } from '@playwright/test';

test.describe('API Catalog Endpoints', () => {
  test('[API-4] GET /productsList - Get all products list @high', async ({ request }) => {
    const response = await request.get('/api/productsList');
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(200);
    expect(Array.isArray(body.products)).toBeTruthy();
    expect(body.products.length).toBeGreaterThan(0);

    expect(body.products[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
        price: expect.any(String),
        brand: expect.any(String),
        category: expect.objectContaining({
          usertype: expect.objectContaining({
            usertype: expect.any(String),
          }),
          category: expect.any(String),
        }),
      })
    );
  });

  test('[API-5] POST /searchProduct - Search for a product @high', async ({ request }, testInfo) => {
    const searchTerm = 'dress';

    const response = await request.post('/api/searchProduct', {
      form: {
        search_product: searchTerm,
      },
    });
    const body = await response.json();
    testInfo.annotations.push({
      type: 'Test Data',
      description: `Search term: ${searchTerm} | Results: ${body.products.length}`,
    });

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(200);
    expect(Array.isArray(body.products)).toBeTruthy();
    expect(body.products.length).toBeGreaterThan(0);

    for (const product of body.products) {
      const searchableText = [
        product.name,
        product.brand,
        product.category?.category,
        product.category?.usertype?.usertype,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      expect(
        searchableText,
        `Product "${product.name}" does not look related to search term "${searchTerm}"`
      ).toContain(searchTerm);
    }
  });

  test('[API-8] GET /brandsList - Get all brands list @medium', async ({ request }) => {
    const response = await request.get('/api/brandsList');
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(200);
    expect(Array.isArray(body.brands)).toBeTruthy();
    expect(body.brands.length).toBeGreaterThan(0);

    expect(body.brands[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        brand: expect.any(String),
      })
    );
  });

  test('[API-11] POST /productsList - Reject unsupported method @medium', async ({ request }) => {
    const response = await request.post('/api/productsList');
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(405);
    expect(body.message).toBe('This request method is not supported.');
  });

  test('[API-12] PUT /brandsList - Reject unsupported method @medium', async ({ request }) => {
    const response = await request.put('/api/brandsList');
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(405);
    expect(body.message).toBe('This request method is not supported.');
  });

  test('[API-13] POST /searchProduct - Reject request without search_product @medium', async ({ request }) => {
    const response = await request.post('/api/searchProduct');
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(400);
    expect(body.message).toBe('Bad request, search_product parameter is missing in POST request.');
  });
});
