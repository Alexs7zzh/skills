import { test } from 'node:test';
import { createOrder } from '../src/orders';

test('creates an order', async () => {
	globalThis.fetch = async () => new Response(JSON.stringify({ id: 'o1' }));
	await createOrder('book');
});
