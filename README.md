- Uppsetning


  				npm install

- Keyrir 


				npm run dev

  
- test


				npm run test

  
- lint


				npm run lint

# Kanban Borð

Arnar Eyðunsson Simonsen: @AddiSim, aes53@hi.is 

Elías Lúðvíksson: @Skatturinn, ell9@hi.is

# Admin login og Authorization

				"username": "admin"
				"password": "admin123"

Færð Authorization key, fyrir admin only aðferðir þá þarf að fara í Headers á postman og velja Authorization undir key og value er Bearer _TOKEN_

				"Authorization": `Bearer ${token}`

# API Reference

## Authentication

- **POST /login**: Authenticate á user

  
					body: 	{
						username: string,
						password: string
						}

## Users

- **GET /users**: Skilar öllum users með stuðning við filters með queries.
- **POST /users**: Búa til nýjan user.


  					body:	{
							isadmin: boolean,
							username: string,
							password: string,
  							avatar: string, // optional hlekkur á mynd
  							avatar64: string, // optional mynd sem base64 strengur
  							group_id: number // heiltala stærri en 0 sem bendir á hvaða hóp einstaklingur er í
						}
- **GET /users/:userId**: Get á user.
- **PATCH /users/:userID**: Patch á user (Admin or user owner only)


					  body: {
					  group_id: number // eða eitthvað annað af fyrrnefndu sem vill breyta
					  }
- **DELETE /users/:userId**: Delete user (Admin only).

## Groups

- **GET /groups**: Skilar öllum hópum með stuðning við filters með queries.
- **POST /groups**: Búa til nýjan hóp.


					  body: {
						admin_id: number,
						name: string
						}
- **GET /groups/:groupId**: Get á hóp.
- **PATCH /groups/:groupId**: Breyta hóp.


					  body: { name: string }
- **DELETE /groups/:groupId**: Delete hóp (Admin only).

## Projects

- **GET /projects**: Skilar öllum verkefnum með stuðning við filters með queries.
- **POST /projects**: Búa til nýtt verkefni.


						body: {
							status: 0, // required: staða verkefni
							title: string, // required: heiti verkefnis
  							group_id: number, // númer hóps, default það sama og notandans
  							creator_id: number, // default sama og notandans
  							assigned_id: number, // optional id notanda verkefnis
  							description: string // optional lýsing á verkefni
							}
- **GET /projects/:projectId**: Get á verkefni.
- **PATCH /projects/:projectId**: Breyta verkefni (Admin or group member only).


						  body: {
							status: 1 // eða eh annað af fyrrnefndu
							}
- **DELETE /projects/:projectId**: Eyðir verkefni (Admin only).
