import { test, expect } from '@playwright/test';
import {
  brandsListResponseSchema,
  productsListResponseSchema,
  searchProductResponseSchema,
} from '../../../data/api-schemas.data';

function getProductsCount(value: unknown): number | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    'products' in value &&
    Array.isArray(value.products)
  ) {
    return value.products.length;
  }

  return null;
}

test.describe('API Catalog Endpoints', () => {
  test('[API-4] GET /productsList - Get all products list @high', async ({ request }) => {
    const response = await request.get('/api/productsList');
    const body = productsListResponseSchema.parse(await response.json());

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(200);
    expect(body.products.length).toBeGreaterThan(0);
    for (const product of body.products.slice(0, 3)) {
      expect(product.price).toMatch(/Rs\.\s*\d+/);
    }
  });

  test('[API-5] POST /searchProduct - Search for a product @high', async ({
    request,
  }, testInfo) => {
    const searchTerm = 'dress';

    const response = await request.post('/api/searchProduct', {
      form: {
        search_product: searchTerm,
      },
    });
    const body = searchProductResponseSchema.parse(await response.json());
    testInfo.annotations.push({
      type: 'Test Data',
      description: `Search term: ${searchTerm} | Results: ${body.products.length}`,
    });

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(200);
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
        `Product "${product.name}" does not look related to search term "${searchTerm}"`,
      ).toContain(searchTerm);
    }
  });

  test('[API-8] GET /brandsList - Get all brands list @medium', async ({ request }) => {
    const response = await request.get('/api/brandsList');
    const body = brandsListResponseSchema.parse(await response.json());

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(200);
    expect(body.brands.length).toBeGreaterThan(0);
    expect(body.brands[0].brand.length).toBeGreaterThan(0);
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

  test('[API-13] POST /searchProduct - Reject request without search_product @medium', async ({
    request,
  }) => {
    const response = await request.post('/api/searchProduct');
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(400);
    expect(body.message).toBe('Bad request, search_product parameter is missing in POST request.');
  });

  test('[API-28] POST /searchProduct - Reject empty search_product value @medium', async ({
    request,
  }, testInfo) => {
    test.fail(
      true,
      'Known defect: POST /searchProduct treats an empty search_product value as a valid search and returns products.',
    );

    const productsListResponse = await request.get('/api/productsList');
    const productsListBody = productsListResponseSchema.parse(await productsListResponse.json());
    const response = await request.post('/api/searchProduct', {
      form: {
        search_product: '',
      },
    });
    const body: unknown = await response.json();
    const productsCount = getProductsCount(body);
    const responseCode =
      typeof body === 'object' && body !== null && 'responseCode' in body
        ? body.responseCode
        : '<missing>';
    const message =
      typeof body === 'object' && body !== null && 'message' in body ? body.message : '';

    testInfo.annotations.push({
      type: 'Finding',
      description: [
        `searchProduct=http:${response.status()},responseCode:${responseCode}`,
        `emptySearchResults:${productsCount ?? '<missing>'}`,
        `allProducts:${productsListBody.products.length}`,
      ].join(' | '),
    });

    expect(response.status()).toBe(200);
    expect(responseCode).toBe(400);
    expect(message).toContain('search_product');
  });
});
