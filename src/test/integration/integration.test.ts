import { describe, expect, test } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app';
import crypto from "crypto"
// - fjóra endapunkta, þar sem
// - a.m.k. einn krefst auðkenningar
// - a.m.k. einn tekur við gögnum
export function randomValue() {
	return crypto.randomBytes(16).toString('hex');
}

describe('integration', () => {
	describe('GET /projects, /groups & /users', () => {
		test('GET /projects returns 200', async () => {
			const response = await request(app).get('/projects');
			expect(response.statusCode).toBe(200)
		}),
			test('GET /users returns 200', async () => {
				const response = await request(app).get('/users');
				expect(response.statusCode).toBe(200)
			}),
			test('GET /groups returns 200', async () => {
				const response = await request(app).get('/groups');
				expect(response.statusCode).toBe(200)
			})
	}),
		describe('Notenda umsjón', () => {
			const rnd = randomValue();
			const userAuth: { [key: string]: string } = {};
			const username = `notandi${rnd}`;
			const password = `lykilord${rnd}`;
			const isadmin = true;
			test('POST /users býr til admin notanda', async () => {
				const response = await request(app)
					.post('/users')
					.send(
						{
							isadmin,
							username,
							password
						}
					)
				expect(response.statusCode).toBe(201)
				expect(typeof response.body.id).toBe('number')
				userAuth['id'] = response.body?.id;
			})
			test('POST /login gefur token', async () => {
				const response = await request(app)
					.post('/login')
					.send(
						{
							username,
							password
						}
					);
				expect(response.statusCode).toBe(200);
				expect(typeof response.body.token).toBe('string');
				userAuth['token'] = `Bearer ${response.body?.token}`
			});
			test('POST /groups býr til hóp', async () => {
				const response = await request(app)
					.post('/groups')
					.set('Authorization', `${userAuth.token}`)
					.send({
						admin_id: userAuth.id,
						name: `hopur${rnd}`
					});
				expect(response.statusCode).toBe(201)
				userAuth['group_id'] = response.body.id
				expect(typeof response.body.id).toBe('number')
			});
			test('PATCH /groups breytir nafni hóps', async () => {
				const response = await request(app)
					.patch(`/groups/${userAuth.group_id}`)
					.set('Authorization', `${userAuth.token}`)
					.send({
						name: `nytt nafn ${rnd}`
					});
				expect(response.statusCode).toBe(200)

			})
			test('PATCH /users/:userId leyfir sjálfum sér að breyta hóp', async () => {
				const response = await request(app)
					.patch(`/users/${userAuth.id}`)
					.set('Authorization', `${userAuth.token}`)
					.send({
						group_id: userAuth.group_id,
						avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"
					});
				expect(response.statusCode).toBe(200);

			});
			const project: { [key: string]: string } = {};
			test('POST /projects býr til verkefni', async () => {
				const response = await request(app)
					.post('/projects')
					.set('Authorization', `${userAuth.token}`)
					.send({
						status: 0,
						title: `test${rnd}`
					});
				expect(response.statusCode).toBe(201);
				project['id'] = response.body.id;
			});
			test('PATCH /projects/:projectId breytir verkefni', async () => {
				const response = await request(app)
					.patch(`/projects/${project.id}`)
					.set('Authorization', `${userAuth.token}`)
					.send(
						{
							status: 1
						}
					);
				expect(response.statusCode).toBe(200)
			});
			test('DELETE /projects/:prjocetId eyðir verkefni', async () => {
				const response = await request(app)
					.delete(`/projects/${project.id}`)
					.set('Authorization', `${userAuth.token}`);
				expect(response.statusCode).toBe(204);
			});
			test('DELETE /groups/:groupId eyðir hop', async () => {
				const response = await request(app)
					.delete(`/users/${userAuth.group_id}`)
					.set('Authorization', `${userAuth.token}`);
				expect(response.statusCode).toBe(204)
				expect(response.body).toBeDefined()
			})
			test('DELETE /users/:userId eyðir notanda', async () => {
				const response = await request(app)
					.delete(`/users/${userAuth.id}`)
					.set('Authorization', userAuth.token);
				expect(response.statusCode).toBe(204)
				expect(response.body).toBeDefined()
			})
		}
		)
}
)