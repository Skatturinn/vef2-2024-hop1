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
	const val = body(field)
		.trim()
		.isString()
		.isLength({
			min: minLength || undefined,
			max: maxLength || undefined,
		})
		.withMessage(
			[
				field,
				minLength ? `min ${minLength} character` : '',
				maxLength ? `max ${maxLength} characters` : '',
			]
				.filter((i) => Boolean(i))
				.join(' '),
		);

	if (optional) {
		return val.optional();
	}

	return val;
};

export const genericSanitizer = (param: string) => { return body(param).trim().escape() };

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

// body value validator
export function atLeastOneBodyValueValidator(fields: Array<string>) {
	return body().custom(async (value, { req }) => {
		const { body: reqBody } = req;

		let valid = false;

		for (let i = 0; i < fields.length; i += 1) {
			const field = fields[i];

			if (field in reqBody && reqBody[field] != null) {
				valid = true;
				break;
			}
		}

		if (!valid) {
			return Promise.reject(
				new Error(`require at least one value of: ${fields.join(', ')}`),
			);
		}
		return Promise.resolve();
	});
}

export const heiltalaStaerri = (field: string, optional: boolean = false) => {
	return body(field)
		.trim()
		.isInt({ min: 1 })
		.withMessage(`${field} þarf að vera heiltala stærri en 0`)
		.optional(optional)
}


