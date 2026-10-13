import { ShopRequestError } from './errors';

export const readOrder = async (id: string) => {
	const response = await fetch(`https://shop.example/orders/${id}`);
	if (!response.ok) throw new ShopRequestError('readOrder', response.status);
	return (await response.json()) as { id: string; item: string };
};
