CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    isadmin BOOLEAN NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    group_id INTEGER
);

CREATE TABLE Groups (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE Projects (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    creator_id INTEGER NOT NULL,
    assigned_id INTEGER,
    date_created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
    title VARCHAR(64) NOT NULL,
    status INTEGER NOT NULL CHECK (status BETWEEN 0 AND 5),
    description TEXT
);

ALTER TABLE Users
    ADD CONSTRAINT fk_group_id FOREIGN KEY (group_id) REFERENCES Groups(id) ON DELETE SET NULL;   

ALTER TABLE Groups
    ADD CONSTRAINT fk_admin_id FOREIGN KEY (admin_id) REFERENCES Users(id) ON DELETE SET NULL;    

ALTER TABLE Projects
    ADD CONSTRAINT fk_group_id FOREIGN KEY (group_id) REFERENCES Groups(id) ON DELETE CASCADE;    

ALTER TABLE Projects
    ADD CONSTRAINT fk_creator_id FOREIGN KEY (creator_id) REFERENCES Users(id) ON DELETE CASCADE;
