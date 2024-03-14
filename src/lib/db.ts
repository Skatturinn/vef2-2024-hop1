import pg from 'pg';
import { environment } from './environment.js';
import { logger } from './logger.js';
import { readFile } from 'fs/promises';
// import { ILogger, logger as loggerSingleton } from './logger.js';

const SCHEMA_FILE = './sql/schema.sql';
const DROP_SCHEMA_FILE = './sql/drop.sql';

interface IUser {
	id: number;
	isadmin: boolean;
	username: string;
	password: string;
	avatar?: string;
	group_id?: number;
}

// declare global {
// 	namespace Express {
// 		interface User extends IUser { }
// 	}
// }

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
	ssl: process.env.NODE_ENV === 'production' ? true : sslConfig,
});

pool.on('error', (err: Error) => {
	console.error('Unexpected error on idle client', err);
	process.exit(-1);
});

export async function query(q: string, values: Array<number | string | boolean | Date> = []) {
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

export async function createProject(groupId: number, creatorId: number, status: number, description: string, title: string) {
	const queryText = `INSERT INTO projects(group_id, creator_id, date_created, status, description, title) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5) RETURNING *;`;
	const result = query(queryText, [groupId, creatorId, status, description, title]);
	return result || null;
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
	values: Array<number | null>
) {
	const filteredFields = fields.filter((i) => typeof i === 'string');
	const filteredValues = values.filter(
		(i): i is number => typeof i === 'number',
	);
	console.log(filteredFields, filteredValues)
	let p = '';
	if (filteredFields.length !== 0) {
		const params = filteredFields.map((field, i) => `${field} = $${i + 1}`);
		p = `WHERE ${params.join(', ')}`
	}
	if (filteredFields.length !== filteredValues.length) {
		throw new Error('fields and values must be of equal length');
	}
	const queryText = `SELECT * FROM projects ${p};`;
	const result = await query(queryText, filteredValues);
	if (result && result.rows) {
		return result.rows
	}
	throw new Error('Ekki tókst að sækja verkefni')
}

export async function updateProjectStatus(projectId: number, newStatus: string, description: string) {
	const queryText = `UPDATE projects SET status = $2, description = COALESCE($3, description) WHERE id = $1 RETURNING *;`;
	return query(queryText, [projectId, newStatus, description]);
}

export async function getProjectsByGroupId(groupId: number) {
	const queryText = `SELECT * FROM projects WHERE group_id = $1;`;
	return query(queryText, [groupId]);
}

export async function getProjectsByUserId(userId: number) {
	const queryText = `SELECT * FROM projects WHERE creator_id = $1;`;
	return query(queryText, [userId]);
}

export async function getProjectById(projectId: number) {
	const queryText = `SELECT * FROM projects WHERE id = $1;`;
	return query(queryText, [projectId]);
}

export async function getProjectsByStatus(status: string) {
	const queryText = `SELECT * FROM projects WHERE status = $1;`;
	return query(queryText, [status]);
}

// User functions

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

export async function createUser(isAdmin: boolean, username: string, password: string, avatar: string) {
	console.log(`Executing query with params:`, { isAdmin, username, password, avatar });
	const queryText = `INSERT INTO Users(isAdmin, username, password, avatar) VALUES ($1, $2, $3, $4) RETURNING id;`;
	return query(queryText, [isAdmin, username, password, avatar]);
}

export async function delUser(userId: number) {
	const queryText = `DELETE FROM Users WHERE id = $1;`;
	return query(queryText, [userId]);
}

export async function getUserById(userId: number) {
	const queryText = `SELECT * FROM Users WHERE id = $1;`;
	return query(queryText, [userId]);
}

export async function getUserByUsername(username: string) {
	const queryText = `SELECT * FROM Users WHERE username = $1;`;
	return query(queryText, [username]);
}

// Group functions

export async function createGroup(id: number, admin_id: number) {
	const queryText = `INSERT INTO Groups(id, admin_id, admin_avatar) VALUES ($1, $2, $3) RETURNING id;`;
	return query(queryText, [id, admin_id, 'default.jpg']);
}

export async function delGroup(groupId: number) {
	const queryText = `DELETE FROM Groups WHERE id = $1;`;
	return query(queryText, [groupId]);
}

export async function joinGroup(userId: number, groupId: number) {
	const queryText = `UPDATE Users SET group_id = $2 WHERE id = $1 RETURNING *;`;
	return query(queryText, [userId, groupId]);
}

export async function getGroupById(groupId: number) {
	const queryText = `SELECT * FROM Groups WHERE id = $1;`;
	return query(queryText, [groupId]);
}

export async function dropSchema(dropFile = DROP_SCHEMA_FILE) {
	const data = await readFile(dropFile);

	return query(data.toString('utf-8'));
}

export async function createSchema(schemaFile = SCHEMA_FILE) {
	const data = await readFile(schemaFile);
	return query(data.toString('utf-8'));
}