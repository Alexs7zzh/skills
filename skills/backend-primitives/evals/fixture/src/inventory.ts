import { connect } from '@planetscale/database';
import { StockUpdateError } from './errors';

const db = connect({ url: process.env['DATABASE_URL'] ?? '' });

export const reserveStock = async (sku: string, quantity: number) => {
	const result = await db.execute('SELECT count FROM stock WHERE sku = ?', [sku]);
	const row = result.rows[0] as { count: number } | undefined;
	if (row == null) throw new StockUpdateError('reserveStock', 404);
	await db.execute('UPDATE stock SET count = ? WHERE sku = ?', [row.count - quantity, sku]);
};
