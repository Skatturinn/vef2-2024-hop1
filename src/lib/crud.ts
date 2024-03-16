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
	getUsersPage,
	getGroups,
	conditionalUpdate
} from './db.js';
import {
	stringValidator,
	usernameMustBeUnique,
	validateProjectStatus,
	groupMustExist,
	validationCheck,
	xssSanitizer,
	genericSanitizer,
	atLeastOneBodyValueValidator
} from './validation.js';
import { body } from 'express-validator';

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

export async function updateProject(
	req: Request,
	res: Response
) {
	const { ProjectId } = req.params;
	const id = Number.parseInt(ProjectId)
	const project = await getProjectById(id);
	if (!project && !project?.rows[0]) {
		res.status(400).json('fann ekki verkefni með umbeðið id');
		return
	}
	const { title, description, group_id, assigned_id, status } = req.body;
	const fields = [
		typeof title === 'string' && title ? 'title' : null,
		typeof description === 'string' && description ? 'description' : null,
		typeof group_id === 'string' && group_id ? 'group_id' : null,
		typeof assigned_id === 'string' && assigned_id ? 'assigned_id' : null,
		typeof status === 'string' && status ? 'status' : null
	]
	const villa = [];
	assigned_id && await getUserById(Number.parseInt(assigned_id)) && villa.push('notanda fyrir assigned_id')
	group_id && await getGroupById(Number.parseInt(group_id)) && villa.push('hóp fyrir group_id');
	if (villa.length > 0) {
		res.status(400).json({ error: `fann ekki eftirfarandi: ${villa.join(', ')}` })
		return
	}
	const values = [
		typeof title === 'string' && title || null,
		typeof description === 'string' && description || null,
		typeof group_id === 'string' && Number.parseInt(group_id) || null,
		typeof assigned_id === 'string' && Number.parseInt(assigned_id) || null,
		typeof status === 'string' && Number.parseInt(status) || null
	]

	const updated = await conditionalUpdate(
		'projects',
		id,
		fields,
		values
	)

	if (!updated) {
		res.status(500).json({ error: 'Ekki tókt að uppfæra project' });
		return
	}
	res.status(200).json(updated);
	return
}

export const patchProject = [
	atLeastOneBodyValueValidator(['title', 'description', 'group_id', 'id', 'assigned_id', 'status']),
	stringValidator({ field: 'title', minLength: 3, maxLength: 64, optional: false }), // min 3 max 128
	stringValidator({ field: 'description', optional: true }),
	body('group_id')
		.trim()
		.isInt({ min: 1 })
		.withMessage('group_id þarf að vera heiltala stærri en 0')
		.optional(true),
	body('assigned_id')
		.trim()
		.isInt({ min: 1 })
		.withMessage('assigned_id þarf að vera heiltala stærri en 0')
		.optional(true),
	body('status')
		.trim()
		.isInt({ min: 0, max: 3 })
		.withMessage('status þarf að vera heiltala á bilinu 0 til 3')
		.optional(true),
	xssSanitizer('title'),
	xssSanitizer('description'),
	xssSanitizer('group_id'),
	xssSanitizer('assigned_id'),
	xssSanitizer('status'),
	validationCheck,
	genericSanitizer('title'),
	genericSanitizer('description'),
	genericSanitizer('group_id'),
	genericSanitizer('assigned_id'),
	genericSanitizer('status'),
	updateProject
]


// Middleware fyrir users
export const getUsers = async (req: Request, res: Response) => {
	const { page, group_id, isAdmin } = req.query;
	const stikar: {
		[key: string]: boolean | number | string
	} = {
		page: Number(page) > 0 && Number.parseInt(String(page)),
		group_id: Number(group_id) > 0 && Number.parseInt(String(group_id)),
		isAdmin: typeof isAdmin !== 'undefined' && String(isAdmin)
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
export async function updateUser(req: Request, res: Response, next: NextFunction) {
	const { userId } = req.params;
	const user = Number(userId) > 0 && await getUserById(Number.parseInt(userId));
	if (!user) {
		res.status(400).json({ error: 'notandi fannst ekki á skrá með id=userId' });
		return
	}

	const { isAdmin, username, password, avatar, group_id } = req.body;

	const fields = [
		typeof isAdmin === 'string' && isAdmin ? 'isAdmin' : null,
		typeof username === 'string' && username ? 'username' : null,
		typeof password === 'string' && password ? 'password' : null,
		typeof avatar === 'string' && avatar ? 'avatar' : null,
		typeof group_id === 'string' && group_id ? 'group_id' : null
	]
	const villa = group_id && await getGroupById(Number.parseInt(group_id));
	if (villa) {
		res.status(400).json({ error: 'Hópur með viðeigandi group_id fannst ekki á skrá.' });
		return
	}
	const values = [
		typeof isAdmin === 'string' && JSON.parse(isAdmin) || null,
		typeof username === 'string' && username || null,
		typeof password === 'string' && password || null,
		typeof avatar === 'string' && avatar || null,
		typeof group_id === 'string' && group_id || null
	];

	const updated = await conditionalUpdate(
		'users',
		Number.parseInt(userId),
		fields,
		values
	)

	if (!updated) {
		return next(new Error('unable to update team'));
	}

	res.status(200).json(updated)

}
export const patchUser = [
	atLeastOneBodyValueValidator(['isAdmin', 'username', 'password', 'avatar', 'group_id']),
	stringValidator({ field: 'username', minLength: 3, maxLength: 255, optional: true }),
	stringValidator({ field: 'password', minLength: 3, maxLength: 255, optional: true }),
	stringValidator({ field: 'avatar', minLength: 3, maxLength: 255, optional: true }),
	body('group_id')
		.trim()
		.isInt({ min: 1 })
		.withMessage('group_id þarf að vera heiltala stærri en 1')
		.optional(true),
	body('isAdmin')
		.trim()
		.isBoolean()
		.optional(true),
	xssSanitizer('isAdmin'),
	xssSanitizer('username'),
	xssSanitizer('password'),
	xssSanitizer('avatar'),
	xssSanitizer('group_id'),
	validationCheck,
	genericSanitizer('isAdmin'),
	genericSanitizer('username'),
	genericSanitizer('password'),
	genericSanitizer('avatar'),
	genericSanitizer('group_id'),
	updateUser
]


// Middleware fyrir groups
export const getGroupsResponse = async (req: Request, res: Response) => {
	const { page, admin_id } = req.query;
	const stikar: {
		[key: string]: false | number
	} = {
		page: Number(page) > 0 && Number.parseInt(String(page)),
		admin_id: Number(admin_id) > 0 && Number.parseInt(String(admin_id)),
	}
	const villur: Array<string> = [];
	Object.keys(stikar).forEach(key => !stikar[key] && req.query[key] && villur.push(key))
	if (villur.length > 0) {
		res.status(400).json({ error: `leitar stiki eiga að vera heiltölur stærri en 0: ${villur.join(', ')}` });
	} else {
		const pageFiltered = Number(page) > 0 && Number.parseInt(String(page)) || 0;
		const groups = await getGroups(pageFiltered, stikar.admin_id);
		res.status(200).json(groups)
	}
}

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

export async function updateGroup(req: Request, res: Response, next: NextFunction) {
	const { groupId } = req.params;
	const id = Number.parseInt(groupId);
	const group = await getGroupById(id);
	if (!group) {
		res.status(400).json('fann ekki hóp með viðeigandi id');
		return
	}
	const { admin_id, admin_avatar } = req.body;
	const fields = [
		typeof admin_id === 'string' && admin_id ? 'admin_id' : null,
		typeof admin_avatar === 'string' && admin_avatar ? 'admin_avatar' : null
	];
	const values = [
		typeof admin_id === 'string' && admin_id || null,
		typeof admin_avatar === 'string' && admin_avatar || null
	]
	const updated = await conditionalUpdate(
		'groups',
		id,
		fields,
		values
	)

	if (!updated) {
		res.status(500).json({ error: 'Ekki tókst að uppfæra hóp' });
		return
	}
	res.status(200).json(updated);
	return

}

export const patchGroup = [
	atLeastOneBodyValueValidator(['admin_id', 'admin_avatar']),
	stringValidator({ field: 'admin_avatar', minLength: 0, maxLength: 255, optional: true }),
	body('admin_id')
		.trim()
		.isInt({ min: 1 })
		.withMessage('adming_id þarf að vera heiltala stærri en 1'),
	xssSanitizer('admin_id'),
	xssSanitizer('admin_avatar'),
	validationCheck,
	genericSanitizer('admin_id'),
	genericSanitizer('admin_avatar'),
	updateGroup
]

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

