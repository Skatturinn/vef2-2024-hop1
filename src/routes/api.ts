import dotenv from 'dotenv';
import express, {Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { loginUser } from '../lib/db.js';
import { authenticate, isAdmin } from '../lib/auth.js';
import { catchErrors } from '../lib/catch-errors.js';
import {
    getAllProjects,
    getProjectByIdHandler, 
    createProjectHandler,
    deleteProjectHandler,
    getProjectsByGroupIdHandler,
    getProjectsByUserIdHandler,
    getProjectsByStatusHandler,
    updateProjectStatusHandler,
    createUserHandler,
    deleteUserHandler,
    getUserByIdHandler,
    createGroupHandler,
    deleteGroupHandler,
    getGroupByIdHandler,
    joinGroupHandler,
     } from '../lib/crud.js';

dotenv.config();

export const router = express.Router();

export async function error() {
    throw new Error('error');
}

export async function index(req: Request, res: Response) {
    res.json([
        {
            href: '/projects',
            method: ['POST'],
        }, {
            href: '/projects/:projectId',
            method: ['GET'],
        }, {
            href: '/projects/:projectId',
            method: ['PATCH'],
        }, {
            href: '/projects/group/:groupId',
            method: ['GET'],
        }, {
            href: '/projects/user/:userId',
            method: ['GET'],
        }, {
            href: '/projects/status/:status',
            method: ['GET'],
        }, {
            href: '/users',
            method: ['POST'],
        }, {
            href: '/users/:userId',
            method: ['GET'],
        }, {
            href: '/groups',
            method: ['POST'],
        }, {
            href: '/groups/:groupId',
            method: ['GET'],
        }, {
            href: '/groups/:groupId',
            method: ['PATCH'],
        }, {
            href: '/groups/join',
            method: ['POST'],
        }
    ])
}


router.get('/', catchErrors(index));

// Authentication routes
router.post('/login', async (req, res) => {
    console.log('/login route hit');
    const { username, password } = req.body;
    const user = await loginUser(username); 
    if (!user) {
        return res.status(401).json({ error: 'Login failed' });
    }

    const secret = process.env.JWT_SECRET || 'default-secret'; 
    const match = await bcrypt.compare(password, user.password);
    if (match) {
        const token = jwt.sign({ id: user.id, isAdmin: user.isadmin }, secret, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Login failed' });
    }
});

// Project routes
router.get('/projects', getAllProjects);
router.post('/projects', createProjectHandler);
router.delete('/projects/:projectId', authenticate, isAdmin, deleteProjectHandler);
router.get('/projects/group/:groupId', getProjectsByGroupIdHandler);
router.get('/projects/user/:userId', getProjectsByUserIdHandler);
router.get('/projects/status/:status', getProjectsByStatusHandler);
router.get('/projects/:projectId', getProjectByIdHandler);
router.patch('/projects/:projectId', updateProjectStatusHandler);

// User routes
router.post('/users', createUserHandler);
router.delete('/users/:userId', authenticate, isAdmin, deleteUserHandler);
router.get('/users/:userId', getUserByIdHandler);

// Group routes
router.post('/groups', createGroupHandler);
router.delete('/groups/:groupId', authenticate, isAdmin, deleteGroupHandler);
router.get('/groups/:groupId', getGroupByIdHandler);
router.post('/groups/join', joinGroupHandler);

