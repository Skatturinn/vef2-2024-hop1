import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import xss from 'xss';
import { getUserByUsername, getGroupById, getProjectById } from './db.js';

export const stringValidator = ({
  field = '',
  minLength = 0,
  maxLength = 0,
  optional = false,
} = {}) => {
    const stringValidator = body(field);
    if (minLength) {
        stringValidator.isLength({ min: minLength });
    }
    if (maxLength) {
        stringValidator.isLength({ max: maxLength });
    }
    if (!optional) {
        stringValidator.exists();
    }
    return stringValidator;
};

// User  validator
export const usernameMustBeUnique = body('username').custom(async (username) => {
  const result = await getUserByUsername(username);
  if (result !== null && result.rowCount !== null && result.rowCount > 0) {
    return Promise.reject(new Error('Username already exists'));
  }
});


// Project validator 
export const validateProjectStatus = body('status')
    .isInt({ min: 0, max: 5 })
    .withMessage('Status must be an integer between 0 and 5.');

// XSS sanitizer 
export const xssSanitizer = (param: string) =>
  body(param).customSanitizer((v) => xss(v));


export const validationCheck = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const validation = validationResult(req);
  if (!validation.isEmpty()) {
    return res.status(400).json({ errors: validation.array() });
  }
  return next();
};

export const groupMustExist = body('groupId').custom(async (groupId) => {
  const group = await getGroupById(groupId);
  if (!group) {
    return Promise.reject(new Error('Group does not exist'));
  }
});


export const projectMustExist = body('projectId').custom(async (projectId) => {
  const project = await getProjectById(projectId);
  if (!project) {
    return Promise.reject(new Error('Project does not exist'));
  }
});


