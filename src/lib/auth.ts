import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from "passport-jwt";
import { Request, Response, NextFunction } from "express";
import { pool, getProjectById } from "./db.js";

interface IUser {
	id: number;
	isadmin: boolean;
	username: string;
	password: string;
	avatar?: string;
	group_id?: number;
}

declare global {
	namespace Express {
		interface User extends IUser { }
	}
}

const options: StrategyOptions = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: process.env.JWT_SECRET as string,
};
interface JwtPayload {
	[key: string]: number | string;
}
passport.use(new JwtStrategy(options, async (jwt_payload: JwtPayload, done) => {
	try {
		const { rows } = await pool.query<IUser>('SELECT * FROM Users WHERE id = $1', [jwt_payload.id]);
		if (rows.length > 0) {
			const user = rows[0];
			const normalizedUser = {
				...user,
				isAdmin: user.isadmin
			};
			return done(null, normalizedUser);
		}
		return done(null, false);
	} catch (error) {
		return done(error, false);
	}
}));

export function isAdmin(req: Request, res: Response, next: NextFunction): void {
	if (req.user && req.user.isadmin) {
		next();
	} else {
		res.status(403).json({ message: "Insufficient permissions" });
	}
}

export async function isInGroup(req: Request, res: Response, next: NextFunction) {
	const { projectId } = req.params;
	const project = await getProjectById(parseInt(projectId, 10));

	if (!project) {
		return res.status(404).send('Project not found');
	}

	if (!req.user || req.user.group_id !== project.group_id) {
		return res.status(403).send('Insufficient permissions: not in the project\'s group');
	}

	next();
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
	passport.authenticate('jwt', { session: false }, (err: Error, user: Express.User | null) => {
		if (err) {
			return res.status(400).json({ message: err.message });
		}
		if (!user) {
			return res.status(401).json({ message: 'Unauthorized' });
		}
		req.user = user;
		next();
	})(req, res, next);
}