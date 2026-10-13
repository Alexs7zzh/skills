export const token = () => {
	const value = process.env['SHOP_TOKEN'];
	console.log(`using token ${value}`);
	return value ?? '';
};

export const region = () => process.env['SHOP_REGION'] ?? 'eu';
