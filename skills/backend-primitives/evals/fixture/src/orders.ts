import { token } from './config';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createOrder = async (item: string) => {
	for (let attempt = 0; attempt < 3; attempt++) {
		const response = await fetch('https://shop.example/orders', {
			method: 'POST',
			headers: { authorization: `Bearer ${token()}` },
			body: JSON.stringify({ item }),
		});
		if (response.ok) return (await response.json()) as { id: string };
		await sleep(100 * 2 ** attempt);
	}
	throw new Error('order failed');
};

export const getOrder = async (id: string, signal: AbortSignal) => {
	const response = await fetch(`https://shop.example/orders/${id}`, { signal });
	return (await response.json()) as { id: string; item: string };
};
