import { Request, Response, NextFunction } from 'express';
import { hashPassword } from './authUtils.js';
import {
	createProject,
	delProject,
	updateProjectStatus,
	getProjectById,
	createUser,
	delUser,
	getUserById,
	createGroup,
	delGroup,
	joinGroup,
	getGroupById,
	getProjectsHandler,
	getUsersPage
} from './db.js';
import {
	stringValidator,
	usernameMustBeUnique,
	validateProjectStatus,
	groupMustExist,
	projectMustExist,
	validationCheck,
	xssSanitizer
} from './validation.js';

// Middleware fyrir projects

export const getProjects = async (req: Request, res: Response) => {
	const { status, group_id, assigned_id, creator_id, page } = req.query
	const stikar: {
		[key: string]: false | number
	} = {
		status: Number(status) > 0 && Number.parseInt(String(status)),
		group_id: Number(group_id) > 0 && Number.parseInt(String(group_id)),
		assigned_id: Number(assigned_id) > 0 && Number.parseInt(String(assigned_id)),
		creator_id: Number(creator_id) > 0 && Number.parseInt(String(creator_id)),
		page: Number(page) > 0 && Number.parseInt(String(page))
	}
	const fields = [
		stikar.group_id ? 'group_id' : null,
		stikar.status ? 'status' : null,
		stikar.assigned_id ? 'assigned_id' : null,
		stikar.creator_id ? 'creator_id' : null
	]
	const values = [
		stikar.group_id || null,
		stikar.status || null,
		stikar.assigned_id || null,
		stikar.creator_id || null
	]
	const villur: Array<string> = [];
	Object.keys(stikar).forEach(key => !stikar[key] && req.query[key] && villur.push(key))
	Object.keys(stikar).forEach(key => !stikar[key] && req.query[key] && villur.push(key))

	if (villur.length > 0) {
		res.status(400).json({ error: `leitar stiki eiga að vera heiltölur stærri en 0: ${villur.join(', ')}` });
	} else {
		const projects = await getProjectsHandler(fields, values, stikar.page || 0);
		if (!projects) {
			res.status(500).json({ error: 'villa við að sækja umbeðin verkefni, vinsamlegast reynið aftur' })
		} else {
			res.status(200).json(projects?.length > 0 ? projects : { message: 'Engar niðurstöður' });
		}
	}
}

export const getProjectByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { projectId } = req.params; // Assuming you're using route parameters
		const project = await getProjectById(parseInt(projectId));
		if (!project) {
			return res.status(404).json({ message: 'Project not found' });
		}
		res.status(200).json(project);
	} catch (error) {
		next(error);
	}
};

export const createProjectHandler = [
	stringValidator({ field: 'description', optional: true }),
	groupMustExist,
	validateProjectStatus,
	xssSanitizer('description'),
	validationCheck,

	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { group_id, creator_id, status, description, title } = req.body;
			const project = await createProject(group_id, creator_id, status, description, title);
			res.status(201).json(project);
		} catch (error) {
			next(error);
		}
	}
];

export const deleteProjectHandler = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { projectId } = req.params;
		await delProject(parseInt(projectId));
		res.status(204).end();
	} catch (error) {
		next(error);
	}
}

export const updateProjectStatusHandler = [
	projectMustExist,
	validateProjectStatus,
	stringValidator({ field: 'description', optional: true }),
	xssSanitizer('description'),
	validationCheck,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { projectId, newStatus, description } = req.body;
			const updatedProject = await updateProjectStatus(projectId, newStatus, description);
			res.status(200).json(updatedProject);
		} catch (error) {
			next(error);
		}
	}
];

// Middleware fyrir users
export const getUsers = async (req: Request, res: Response) => {
	const { page, group_id, isadmin } = req.query;
	const stikar: {
		[key: string]: boolean | number | string
	} = {
		page: Number(page) > 0 && Number.parseInt(String(page)),
		group_id: Number(group_id) > 0 && Number.parseInt(String(group_id)),
		isadmin: typeof isadmin !== 'undefined' && String(isadmin)
	};
	const villur: Array<string> = [];
	Object.keys(stikar).forEach(key => !stikar[key] && req.query[key] && villur.push(key))
	if (villur.length > 0) {
		res.status(400).json({ error: `leitar stiki eiga að vera heiltölur stærri en 0: ${villur.join(', ')}` });
	} else {
		const pageFiltered = Number(page) > 0 && Number.parseInt(String(page));
		const users = await getUsersPage(pageFiltered || 0);
		res.status(200).json(users)
	}
}


export const createUserHandler = [
	usernameMustBeUnique,
	stringValidator({ field: 'username', minLength: 3, maxLength: 255 }),
	stringValidator({ field: 'password', minLength: 6 }),
	xssSanitizer('username'),
	validationCheck,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { isAdmin, username, password, avatar } = req.body;
			const hashedPassword = await hashPassword(password);
			const user = await createUser(isAdmin, username, hashedPassword, avatar);
			res.status(201).json(user);
		} catch (error) {
			next(error);
		}
	}
];


export const deleteUserHandler = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { userId } = req.params;
		await delUser(parseInt(userId));
		res.status(204).end();
	} catch (error) {
		next(error);
	}
}

export const getUserByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { userId } = req.params;
		const user = await getUserById(Number.parseInt(userId));
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}
		res.status(200).json(user);
	} catch (error) {
		next(error);
	}
};


// Middleware fyrir groups

export const createGroupHandler = [
	validationCheck,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id, admin_id } = req.body;
			const group = await createGroup(id, admin_id);
			res.status(201).json(group);
		} catch (error) {
			next(error);
		}
	}
];

export const deleteGroupHandler = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { group_id } = req.params;
		await delGroup(parseInt(group_id));
		res.status(204).end();
	} catch (error) {
		next(error);
	}
}

export const getGroupByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { group_id } = req.params;
		const group = await getGroupById(parseInt(group_id));
		if (!group) {
			return res.status(404).json({ message: 'Group not found' });
		}
		res.status(200).json(group);
	} catch (error) {
		next(error);
	}
};

export const joinGroupHandler = [
	groupMustExist,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { userId, group_id } = req.body;
			const user = await joinGroup(userId, group_id);
			res.status(200).json(user);
		} catch (error) {
			next(error);
		}
	}
];

