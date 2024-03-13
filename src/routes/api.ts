import dotenv from 'dotenv';
import express from 'express';
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
    updateGroupDescriptionHandler,
    getGroupByIdHandler,
    joinGroupHandler,
     } from '../lib/crud.js';

dotenv.config();

export const router = express.Router();

export async function error() {
    throw new Error('error');
}

// Project routes
router.get('/projects', getAllProjects);
router.post('/projects', createProjectHandler);
router.delete('/projects/:projectId', deleteProjectHandler);
router.get('/projects/group/:groupId', getProjectsByGroupIdHandler);
router.get('/projects/user/:userId', getProjectsByUserIdHandler);
router.get('/projects/status/:status', getProjectsByStatusHandler);
router.get('/projects/:projectId', getProjectByIdHandler);
router.put('/projects/:projectId', updateProjectStatusHandler);

// User routes
router.post('/users', createUserHandler);
router.delete('/users/:userId', deleteUserHandler);
router.get('/users/:userId', getUserByIdHandler);

// Group routes
router.post('/groups', createGroupHandler);
router.delete('/groups/:groupId', deleteGroupHandler);
router.put('/groups/:groupId', updateGroupDescriptionHandler);
router.get('/groups/:groupId', getGroupByIdHandler);
router.post('/groups/join', joinGroupHandler);

