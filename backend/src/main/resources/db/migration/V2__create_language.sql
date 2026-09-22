CREATE TABLE language
(
    id   SMALLSERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL
);

INSERT INTO language (code, name)
VALUES ('en', 'English'),
       ('zh', 'Chinese'),
       ('ja', 'Japanese');
