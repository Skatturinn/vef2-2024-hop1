import pg from 'pg';
import { environment } from './environment.js';
import { logger } from './logger.js';
import { deleteImage } from '../cloudinary.js';
import { readFile } from 'fs/promises';
// import { ILogger, logger as loggerSingleton } from './logger.js';

const SCHEMA_FILE = './sql/schema.sql';
const DROP_SCHEMA_FILE = './sql/drop.sql';
const INSERT_SCHEMA_FILE = './sql/insert.sql';

interface IUser {
	id: number;
	isadmin: boolean;
	username: string;
	password: string;
	avatar?: string;
	group_id?: number;
}

const env = environment(process.env, logger);

const sslConfig = {
	rejectUnauthorized: false,
};

if (!env?.connectionString) {
	logger.error('No connection string');
	process.exit(1);
}

const { connectionString } = env;

export const pool = new pg.Pool({
	connectionString,
	ssl:  sslConfig,
});

pool.on('error', (err: Error) => {
	console.error('Unexpected error on idle client', err);
	process.exit(-1);
});

export async function query(q: string, values: Array<number | string | boolean | Date | null> = []) {
	let client;
	try {
		client = await pool.connect();
	} catch (e) {
		console.error('unable to get client from pool', e);
		return null;
	}

	try {
		const result = values.length === 0 ? await client.query(q) : await client.query(q, values);
		return result;
	} catch (e) {
		console.error('unable to query', e);
		console.info(q, values);
		return null;
	} finally {
		client.release();
	}
}

// Project functions

export async function createProject(groupId: number, creatorId: number, assigned_id: number | null, title: string, status: number, description: string) {
	const queryText = `INSERT INTO projects(group_id, creator_id, assigned_id, date_created, title, status,  description) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6) RETURNING id;`;
	const result = await query(queryText, [groupId, creatorId, assigned_id, title, status, description]);
	return result && result.rows[0] || null
}

export async function delProject(projectId: number) {
	const queryText = `DELETE FROM projects WHERE id = $1;`;
	return query(queryText, [projectId]);
}

export async function getAllProjectsHandler() {
	const queryText = `SELECT * FROM projects;`;
	const result = await query(queryText);
	if (result && result.rows) {
		return result.rows
	}
	return null;
}

export async function getProjectsHandler(
	fields: Array<string | null>,
	values: Array<number | null>,
	page: number
) {
	const filteredFields = fields.filter((i) => typeof i === 'string');
	const filteredValues = values.filter(
		(i): i is number => typeof i === 'number',
	);
	let p = '';
	if (filteredFields.length !== 0) {
		const params = filteredFields.map((field, i) => `${field} = $${i + 1}`);
		p = `WHERE ${params.join(' AND ')}`
	}
	if (filteredFields.length !== filteredValues.length) {
		throw new Error('fields and values must be of equal length');
	}

	const queryText = `SELECT * FROM projects ${p} OFFSET ${page - 1 > 0 ? (page - 1) * 10 : 0}  LIMIT 10;`;
	const result = await query(queryText, filteredValues);
	if (result && result.rows) {
		return result.rows
	}
}

export async function getProjectById(projectId: number) {
	if (Number.isNaN(projectId)) {
		return null
	}
	const queryText = `SELECT * FROM projects WHERE id = $1;`;
	const result = await query(queryText, [projectId])
	return result && result?.rows[0] || null;
}

// User functions

export async function getUsersPage(page: number = 0) {
	const queryText = `SELECT id, isadmin, username, avatar, group_id FROM users OFFSET ${page - 1 > 0 ? (page - 1) * 10 : 0}  LIMIT 10;`
	const result = await query(queryText);
	if (result && result?.rows) {
		return result.rows
	}
	return null
}

export async function loginUser(username: string): Promise<IUser | null> {
	const queryText = 'SELECT * FROM Users WHERE username = $1';
	try {
		const { rows } = await pool.query<IUser>(queryText, [username]);
		if (rows.length === 0) return null;
		return rows[0];
	} catch (error) {
		console.error('Failed to retrieve user by username:', error);
		throw error;
	}
}

export async function createUser(isadmin: boolean | '', username: string, password: string, avatarUrl: string, group_id: number | null) {
	const queryText = `INSERT INTO Users(isadmin, username, password, avatar, group_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, isadmin, username, avatar, group_id;`;
	const result = await query(queryText, [isadmin, username, password, avatarUrl, group_id])
	return result && result.rows[0] || null;
}

export async function delUser(userId: number) {
	if (Number.isNaN(userId)) {
		return null
	}
	const userRes = await query('SELECT avatar FROM Users WHERE id = $1', [userId]);
	const avatarPublicId = userRes?.rows[0]?.avatar;
	if (avatarPublicId) {
		await deleteImage(avatarPublicId);
	}
	const queryText = `DELETE FROM Users WHERE id = $1;`;
	return query(queryText, [userId]);
}

export async function getUserById(userId: number) {
	if (Number.isNaN(userId)) {
		return null
	}
	const queryText = `SELECT * FROM Users WHERE id = $1;`;
	const result = await query(queryText, [userId]);
	return result && result.rows[0] || null;
}

export async function getUserByUsername(username: string) {
	const queryText = `SELECT * FROM Users WHERE username = $1;`;
	const result = await query(queryText, [username]);
	return result && result.rows[0] || null
}

// Group functions

export async function getGroups(page: number, admin_id: false | number) {
	const queryText = `SELECT * FROM groups ${admin_id ? `WHERE admin_id = $1` : ''} OFFSET ${page - 1 > 0 ? (page - 1) * 10 : 0} LIMIT 10;`
	const result = admin_id ? await query(queryText, [admin_id]) : await query(queryText)
	return result?.rows
}

export async function createGroup(admin_id: number, name: string) {
	if (Number.isNaN(admin_id)) {
		return null
	}
	const queryText = `INSERT INTO Groups(admin_id, name) VALUES ($1, $2) RETURNING id;`;
	const result = await query(queryText, [admin_id, name])
	return result && result?.rows[0] || null;
}

export async function delGroup(groupId: number) {
	if (!(Number(groupId) > 0)) {
		return null
	}
	const queryText = `DELETE FROM Groups WHERE id = $1;`;
	return query(queryText, [groupId]);
}

export async function getGroupById(groupId: number) {
	if (Number.isNaN(groupId)) {
		return null
	}
	const queryText = `SELECT * FROM Groups WHERE id = $1;`;
	const result = await query(queryText, [groupId]);
	return result && result.rows[0] || null;
}

export async function dropSchema(dropFile = DROP_SCHEMA_FILE) {
	const data = await readFile(dropFile);

	return query(data.toString('utf-8'));
}

export async function createSchema(schemaFile = SCHEMA_FILE) {
	const data = await readFile(schemaFile);
	return query(data.toString('utf-8'));
}

export async function insertSchema(schemaFile = INSERT_SCHEMA_FILE) {
	const data = await readFile(schemaFile);
	return query(data.toString('utf-8'));
}

// Conditional update fyrir patch requests

export async function conditionalUpdate(
	table: 'users' | 'projects' | 'groups',
	id: number,
	fields: Array<string | null>,
	values: Array<string | number | null>,
) {
	if (table === 'users' && fields.includes('avatar')) {
		const userRes = await query('SELECT avatar FROM Users WHERE id = $1', [id]);
		const avatarPublicId = userRes && userRes?.rows[0]?.avatar;
		avatarPublicId && await deleteImage(avatarPublicId)
	}
	const filteredFields = fields.filter((i) => typeof i === 'string');
	const filteredValues = values.filter(
		(i): i is string | number => typeof i === 'string' || typeof i === 'number',
	);

	if (filteredFields.length === 0) {
		return false;
	}

	if (filteredFields.length !== filteredValues.length) {
		throw new Error('fields and values must be of equal length');
	}

	// id is field = 1
	const updates = filteredFields.map((field, i) => `${field} = $${i + 2}`);

	const q = `
	  UPDATE ${table}
		SET ${updates.join(', ')}
	  WHERE
		id = $1
	  RETURNING 
	  ${table === 'users' ? ' id, isadmin, username, avatar, group_id' : '*'}
	  `;

	const queryValues: Array<string | number> = (
		[id] as Array<string | number>
	).concat(filteredValues);
	const result = await query(q, queryValues);

	return result && result.rows[0] || null;
}
