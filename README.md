# Kanban Borð

Arnar Eyðunsson Simonsen: AddiSim, aes53@hi.is 

Elías Lúðvíksson: Skatturinn, ell9@hi.is

# Admin login og Authorization

username: "admin"
password: "admin123"

Færð Authorization key, fyrir admin only aðferðir þá þarf að fara í Headers á postman og velja Authorization undir key og value er Bearer _TOKEN_

# API Reference

## Authentication

- **POST /login**: Authenticate á user

## Users

- **GET /users**: Skilar öllum users með stuðning við filters með queries.
- **POST /users**: Búa til nýjan user.
- **GET /users/:userId**: Get á user.
- **PATCH /users/:userID**: Patch á user (Admin or user owner only)
- **DELETE /users/:userId**: Delete user (Admin only).

## Groups

- **GET /groups**: Skilar öllum hópum með stuðning við filters með queries.
- **POST /groups**: Búa til nýjan hóp.
- **GET /groups/:groupId**: Get á hóp.
- **DELETE /groups/:groupId**: Delete hóp (Admin only).

## Projects

- **GET /projects**: Skilar öllum verkefnum með stuðning við filters með queries.
- **POST /projects**: Búa til nýtt verkefni.
- **GET /projects/:projectId**: Get á verkefni.
- **PATCH /projects/:projectId**: Breyta verkefni (Admin or group member only).
- **DELETE /projects/:projectId**: Eyðir verkefni (Admin only).
