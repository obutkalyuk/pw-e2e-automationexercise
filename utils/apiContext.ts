import { APIRequestContext, request as playwrightRequest } from '@playwright/test';
import 'dotenv/config';

const baseURL = process.env.BASE_URL;
let apiContext: APIRequestContext | undefined;

export async function getApiContext(): Promise<APIRequestContext> {
  if (!apiContext) {
    apiContext = await playwrightRequest.newContext({
      baseURL: baseURL,
    
    });
  }
  return apiContext;
}

export async function disposeApiContext() {
  if (apiContext) {
    await apiContext.dispose();
    apiContext = undefined;
  }
}
