-- Reference data, not learning content: courses point at it by code.
CREATE TABLE language
(
    id      SMALLSERIAL PRIMARY KEY,
    code    VARCHAR(10) NOT NULL UNIQUE,
    name    VARCHAR(50) NOT NULL,
    enabled BOOLEAN     NOT NULL
);

INSERT INTO language (code, name, enabled)
VALUES ('ja', 'Japanese', true);
