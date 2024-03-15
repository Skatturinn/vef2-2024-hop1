import { Request, Response, NextFunction } from 'express';
import { hashPassword } from './authUtils.js';
import { 
    createProject, 
    delProject,
    updateProjectStatus,
    getProjectById,
    getProjectsByGroupId,
    getProjectsByUserId,
    getProjectsByStatus,
    createUser,
    delUser, 
    getUserById,
    createGroup,
    delGroup,
    joinGroup, 
    getGroupById,
    getProjectsHandler,
     } from './db.js';
import { 
    stringValidator, 
    usernameMustBeUnique, 
    validateProjectStatus, 
    groupMustExist, 
    projectMustExist, 
    validationCheck, 
    xssSanitizer } from './validation.js';
import { uploadImage } from '../cloudinary.js';

// Middleware fyrir projects

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
	const { status, groupId, userId, creatorId } = req.query
	const fields = [
		Number.isInteger(Number(groupId)) && groupId ? 'group_id' : null,
		Number.isInteger(Number(status)) && status ? 'status' : null,
		Number.isInteger(Number(userId)) && userId ? 'assigned_id' : null,
		Number.isInteger(Number(creatorId)) && creatorId ? 'creator_id' : null
	]
	const values = [
		Number.isInteger(Number(groupId)) && groupId ? Number(groupId) : null,
		Number.isInteger(Number(status)) && status ? Number(status) : null,
		Number.isInteger(Number(userId)) && userId ? Number(userId) : null,
		Number.isInteger(Number(creatorId)) && creatorId ? Number(creatorId) : null
	]
	const villur = [];
	if ((groupId && !Number.isInteger(Number(groupId)))) {
		villur.push('groupId')
	}
	if (status && !Number.isInteger(Number(status))) {
		villur.push('status')
	}
	if (userId && !Number.isInteger(Number(userId))) {
		villur.push('userId')
	}
	if (creatorId && !Number.isInteger(Number(creatorId))) {
		villur.push('creatorId')
	}
	if (villur.length > 0) {
		throw new Error(`leitar stiki á vitlausu formi: ${villur.join(', ')}`)
	}
	try {
		const projects = await getProjectsHandler(fields, values);
		res.status(200).json(projects);
	} catch (error) {
		next(error);
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
  groupMustExist,
  validateProjectStatus,
  stringValidator({ field: 'description', optional: true }),
  xssSanitizer('description'),
  validationCheck,

  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { groupId, creatorId, status, description } = req.body;
      const project = await createProject(groupId, creatorId, status, description);
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

export const getProjectsByGroupIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId } = req.params; // Assuming you're using route parameters
        const projects = await getProjectsByGroupId(parseInt(groupId));
        res.status(200).json(projects);
    } catch (error) {
        next(error);
    }
};

export const getProjectsByUserIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params; // Assuming you're using route parameters
        const projects = await getProjectsByUserId(parseInt(userId));
        res.status(200).json(projects);
    } catch (error) {
        next(error);
    }
};

export const getProjectsByStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status } = req.params; // Assuming you're using route parameters
        const projects = await getProjectsByStatus(status);
        res.status(200).json(projects);
    } catch (error) {
        next(error);
    }
};

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
export const createUserHandler = [
  usernameMustBeUnique,
  stringValidator({ field: 'username', minLength: 3, maxLength: 255 }),
  stringValidator({ field: 'password', minLength: 6 }), 
  xssSanitizer('username'),
  validationCheck,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {isAdmin, username, password, avatar } = req.body;
      const hashedPassword = await hashPassword(password);
      let avatarUrl = '';
      if (avatar) {
        const uploadResult = await uploadImage(avatar);
        if (typeof uploadResult === 'string') {
          avatarUrl = uploadResult;
        } else {
          avatarUrl = uploadResult;
        }
      }
      const user = await createUser(isAdmin, username, hashedPassword, avatarUrl);
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
        const user = await getUserById(parseInt(userId));
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
        const { groupId } = req.params; 
        await delGroup(parseInt(groupId));
        res.status(204).end();
    } catch (error) {
        next(error);
    }
}

export const getGroupByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId } = req.params; 
        const group = await getGroupById(parseInt(groupId));
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
      const { userId, groupId } = req.body;
      const user = await joinGroup(userId, groupId);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
];

