export class ShopRequestError extends Error {
	constructor(
		readonly operation: string,
		readonly status: number,
	) {
		super(`${operation} failed with ${status}`);
	}
}

export class StockUpdateError extends Error {
	constructor(
		readonly operation: string,
		readonly status: number,
	) {
		super(`${operation} failed with ${status}`);
	}
}
