import dotenv from 'dotenv';
import { createSchema, dropSchema } from './lib/db.js';

dotenv.config();

export async function create() {
	const drop = await dropSchema();
	if (drop) {
		console.info('schema dropped');
	} else {
		console.info('schema not dropped, exiting');
		process.exit(-1)
	}
	const result = await createSchema();
	if (result) {
		console.info('schema created');
	} else {
		console.info('schema not created')
	}
}

create().catch((err) => {
	console.error('Error creating running setup', err);
});