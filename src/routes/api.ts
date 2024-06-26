import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { loginUser } from '../lib/db.js';
import { authenticate, isAdmin } from '../lib/auth.js';
import { catchErrors } from '../lib/catch-errors.js';
import {
	getProjects,
	getProjectByIdHandler,
	deleteProjectHandler,
	createUserHandler,
	deleteUserHandler,
	getUserByIdHandler,
	createGroupHandler,
	deleteGroupHandler,
	getGroupByIdHandler,
	getUsers,
	getGroupsResponse,
	patchProject,
	patchUser,
	patchGroup,
	postProject
} from '../lib/crud.js';

dotenv.config();

export const router = express.Router();

export async function index(req: Request, res: Response) {
	res.json([
		{
			href: '/projects',
			method: ['GET', 'POST'],
			filtering: {
				description: 'GET query filters',
				parameters: {
					status: {
						description: 'leita út frá stöðu verkefnis',
						href: '/projects?status=1'
					},
					group_id: {
						description: 'Leita af verkefnum út frá hóp',
						href: '/projects?group_id=1'
					},
					assigned_id: {
						description: 'Leita af verkefnum út frá notanda',
						href: '/projects?assigned_id=1'
					},
					page: {
						description: 'Hámark 10 lausnir per síðu',
						href: '/?page=1'
					}
				}
			}
		}, {
			href: '/projects/:projectId',
			method: ['GET', 'PATCH', 'DELETE'],
		}, {
			href: '/users',
			method: ['GET', 'POST'],
			filtering: {
				description: 'GET query filters',
				parameters: {
					group_id: {
						descripiton: 'Leita af notendum út frá hóp',
						href: '/users?group_id=1'
					},
					isadmin: {
						description: 'Leita af notendum út frá admin',
						href: '/users?isadmin=false'

					},
					page: {
						description: 'Hámark 10 lausnir per síðu',
						href: '/?page=1'
					}
				}
			}
		}, {
			href: '/users/:userId',
			method: ['GET', 'PATCH', 'DELETE'],
		}, {
			href: '/groups',
			method: ['GET', 'POST'],
			filtering: {
				description: 'GET query filters',
				parameters: {
					admin_id: {
						description: 'Leita af hópum eftir stjórnendum',
						href: '/groups?admin_id=1'
					},
					page: {
						description: 'Hámark 10 lausnir per síðu',
						href: '/?page=1'
					}
				}
			}
		}, {
			href: '/groups/:groupId',
			method: ['GET', 'PATCH', 'DELETE'],
		},
		{
			href: '/login',
			method: ['POST'],
		},
		{
			href: '/authenticate',
			method: ['POST'],
			description: 'Authenticates user for forntend'
		}
	])
}


router.get('/', catchErrors(index));

// Authentication routes
router.post('/login', async (req, res) => {
	const { username, password } = req.body;
	const user = await loginUser(username);
	if (!user) {
		return res.status(401).json({ error: 'Notendanafn ekki til á skrá' });
	}

	const secret = process.env.JWT_SECRET || 'default-secret';
	const match = await bcrypt.compare(password, user.password);
	if (match) {
		const token = jwt.sign({ id: user.id, isAdmin: user.isadmin }, secret, { expiresIn: '1h' });
		res.status(200).json({ token, isAdmin: user.isadmin, id: user.id });
	} else {
		res.status(401).json({ error: 'Rangt lykilorð' });
	}
});
router.post('/authenticate', authenticate,
	(req, res) => {
		if (req.user) return res.status(200).json({ admin: req.user.isadmin })
		return res.status(401).json({ message: 'unauthorized' })
	}
)

// Project routes
router.get('/projects', catchErrors(getProjects));
router.post('/projects', authenticate, postProject);
router.delete('/projects/:projectId', authenticate, isAdmin, deleteProjectHandler);
router.get('/projects/:projectId', getProjectByIdHandler);
router.patch('/projects/:projectId', authenticate, patchProject);

// User routes
router.get('/users', catchErrors(getUsers));
router.post('/users', createUserHandler);
router.delete('/users/:userId', authenticate, isAdmin, deleteUserHandler);
router.get('/users/:userId', getUserByIdHandler);
router.patch('/users/:userId', authenticate, patchUser);

// Group routes
router.get('/groups', catchErrors(getGroupsResponse));
router.post('/groups', authenticate, isAdmin, createGroupHandler);
router.delete('/groups/:groupId', authenticate, isAdmin, deleteGroupHandler);
router.get('/groups/:groupId', getGroupByIdHandler);
router.patch('/groups/:groupId', authenticate, isAdmin, patchGroup);
