import express, { NextFunction, Request, Response } from 'express';
import {router} from './routes/api.js';
import { catchErrors } from './lib/catch-errors.js';

export const app = express();

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

function cors (req: Request, res: Response, next: Function) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization',
	);
    next();
}

app.use(express.json());

app.use(cors);
app.get('/', catchErrors(index));
app.use(router);

const port = process.env.PORT || 3000;

app.use((_req: Request, res: Response) => {
	res.status(404).json({ error: 'not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	if (
		err instanceof SyntaxError &&
		'status' in err &&
		err.status === 400 &&
		'body' in err
	) {
		return res.status(400).json({ error: 'invalid json' });
	}
	return res
		.status(500)
		.json({ error: err.message ?? 'internal server error' });
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}/`);
});