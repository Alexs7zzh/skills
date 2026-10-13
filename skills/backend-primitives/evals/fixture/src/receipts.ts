import { writeFile } from 'node:fs/promises';

export const saveReceipt = async (id: string, body: string) => {
	await writeFile(`/tmp/receipts/${id}.json`, body);
};
