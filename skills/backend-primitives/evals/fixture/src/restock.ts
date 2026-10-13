import { connect } from '@planetscale/database';
import { recordRestock } from './ledger';

const db = connect({ url: process.env['DATABASE_URL'] ?? '' });

export const handler = async () => {
	const result = await db.execute('SELECT sku, count FROM stock WHERE count < 5');
	for (const row of result.rows as { sku: string; count: number }[]) {
		await db.execute('UPDATE stock SET count = ? WHERE sku = ?', [row.count + 20, row.sku]);
		await recordRestock(row.sku, 20);
	}
};
