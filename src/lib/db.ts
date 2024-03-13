import { readFile } from 'fs/promises';
import pg from 'pg';
import environment1 from './environment.js';
import { logger } from './logger.js';

const SCHEMA_FILE = './sql/schema.sql';
const DROP_SCHEMA_FILE = './sql/drop.sql';

const env = environment1(process.env, logger);

const sslConfig = {
    rejectUnauthorized: false, 
};

if (!env?.connectionString) {
    logger.error('No connection string');
    process.exit(1);
}

const {connectionString} = env;

const pool = new pg.Pool({
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

export async function createProject(groupId: number, creatorId: number, status: string, description: string) {
    const queryText = `INSERT INTO projects(group_id, creator_id, date_created, status, description) VALUES ($1, $2, CURRENT_DATE, $3, $4) RETURNING id;`;
    return query(queryText, [groupId, creatorId, status, description]);
}

export async function delProject(projectId: number) {
	const queryText = `DELETE FROM projects WHERE id = $1;`;
	return query(queryText, [projectId]);
}

export async function getAllProjectsHandler() {
	const queryText = `SELECT * FROM projects;`;
	return query(queryText);
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
export async function createUser(username: string, password: string, isAdmin: boolean, avatar: string) {
    const queryText = `INSERT INTO Users(username, password, isAdmin, avatar) VALUES ($1, $2, $3, $4) RETURNING id;`;
    return query(queryText, [username, password, isAdmin, avatar]);
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

export async function createGroup(name: string, description: string) {
	const queryText = `INSERT INTO Groups(name, description, date_created) VALUES ($1, $2, CURRENT_DATE) RETURNING id;`;
	return query(queryText, [name, description]);
}

export async function delGroup(groupId: number) {
	const queryText = `DELETE FROM Groups WHERE id = $1;`;
	return query(queryText, [groupId]);
}

export async function updateGroupDescription(groupId: number, newDescription: string) {
	const queryText = `UPDATE Groups SET description = $2 WHERE id = $1 RETURNING *;`;
	return query(queryText, [groupId, newDescription]);
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