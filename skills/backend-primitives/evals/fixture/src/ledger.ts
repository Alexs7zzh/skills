import { connect } from '@planetscale/database';

const db = connect({ url: process.env['DATABASE_URL'] ?? '' });

export const recordRestock = async (sku: string, amount: number) => {
	await db.execute('INSERT INTO restocks (sku, amount) VALUES (?, ?)', [sku, amount]);
	await fetch('https://slack.com/api/chat.postMessage', {
		method: 'POST',
		headers: { authorization: `Bearer ${process.env['SLACK_TOKEN']}` },
		body: JSON.stringify({ channel: 'C0STOCK', text: `Restocked ${sku} by ${amount}` }),
	});
};
