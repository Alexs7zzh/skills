export const listAll = async () => {
	const ids: string[] = [];
	let nextToken: string | undefined;
	do {
		const response = await fetch(`https://shop.example/orders?token=${nextToken ?? ''}`);
		const page = (await response.json()) as { ids: string[]; nextToken?: string };
		ids.push(...page.ids);
		nextToken = page.nextToken;
	} while (nextToken != null);
	return ids;
};
