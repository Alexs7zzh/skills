import { createOrder } from './orders';
import { listAll } from './list';
import { saveReceipt } from './receipts';
import { reserveStock } from './inventory';
import { appendFile } from 'node:fs/promises';

export const handler = async (event: { body: string }) => {
	const cache = new Map<string, string>();
	try {
		const { item } = JSON.parse(event.body) as { item: string };
		const order = await createOrder(item);
		await reserveStock(item, 1);
		cache.set(order.id, item);
		await saveReceipt(order.id, JSON.stringify(order));
		await appendFile('/tmp/orders.log', `${order.id}\n`);
		return { statusCode: 200, body: JSON.stringify(order) };
	} catch (error) {
		console.warn('order failed', error);
		return { statusCode: 200, body: '{}' };
	}
};

export const sweep = async () => {
	const ids = await listAll();
	await Promise.all(ids.map(id => fetch(`https://shop.example/orders/${id}`, { method: 'DELETE' })));
};
