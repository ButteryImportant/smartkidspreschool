import { onRequest as handleRoute } from './index.js';

export async function onRequest(context) {
  return handleRoute(context);
}
