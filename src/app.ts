import express, { NextFunction, Request, Response } from 'express';
import { router } from './routes/api.js';
import { catchErrors } from './lib/catch-errors.js';

export const app = express();

export async function index(req: Request, res: Response) {
	res.json([
		{
			href: '/projects',
			methods: ['GET', 'POST'],
		}, {
			href: '/projects/:projectId',
			methods: ['GET', 'PATCH', 'DELETE'],
		}, {
			href: '/projects/:groupSlug/:userId/:status',
			methods: ['GET']
		},
		{
			href: '/projects/group/:groupId',
			methods: ['GET'],
		}, {
			href: '/projects/user/:userId',
			methods: ['GET'],
		}, {
			href: '/projects/status/:status',
			methods: ['GET'],
		}, {
			href: '/users',
			methods: ['GET', 'POST'],
		}, {
			href: '/users/:userId',
			methods: ['GET', 'PATCH', 'DELETE'],
		}, {
			href: '/groups',
			methods: ['GET', 'POST'],
		}, {
			href: '/groups/:groupId',
			methods: ['GET', 'PATCH', 'DELETE'],
		}
	])
}

function cors(req: Request, res: Response, next: Function) {
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