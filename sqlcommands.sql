CREATE DATABASE IF NOT EXISTS `tutorapp`;
USE `tutorapp`;

CREATE TABLE IF NOT EXISTS tutors(
	id INT NOT NULL auto_increment,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(2048) NOT NULL,
    cost INT NOT NULL,
    educationLevel VARCHAR(255) NOT NULL,
    PRIMARY KEY(id),
    UNIQUE(id),
    UNIQUE(username)
);
CREATE TABLE IF NOT EXISTS tutorsSubjects(
    id INT NOT NULL auto_increment,
    tutorId INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    PRIMARY KEY(id),
    UNIQUE(id),
    FOREIGN KEY(tutorId) REFERENCES tutors(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS tutorsYears(
    id INT NOT NULL auto_increment,
    tutorId INT NOT NULL,
    year VARCHAR(255) NOT NULL,
    PRIMARY KEY(id),
    UNIQUE(id),
    FOREIGN KEY(tutorId) REFERENCES tutors(id) ON DELETE CASCADE
);
DROP TABLE tutorsSubjects;
SELECT * FROM tutorsYears;
INSERT INTO tutors(password, username, name, description, cost, educationLevel) VALUES('123', 'JanesAccount', 'Jane', 'I am a good tutor', 0, 'educationLevel');
INSERT INTO tutorsSubjects(tutorId, subject) VALUES(1, 'Maths');
INSERT INTO tutorsSubjects(tutorId, subject) VALUES(1, 'English');
INSERT INTO tutorsYears(tutorId, year) VALUES(1, 'Prep-2');
SELECT tutors.id, tutors.name, tutors.description, tutors.cost, tutors.educationLevel, GROUP_CONCAT(DISTINCT tutorsYears.year SEPARATOR ',') as years, GROUP_CONCAT(DISTINCT tutorsSubjects.subject SEPARATOR ',') AS subjects
FROM tutors
LEFT JOIN tutorsSubjects ON tutors.id = tutorsSubjects.tutorId
LEFT JOIN tutorsYears ON tutors.id = tutorsYears.tutorId
GROUP BY tutors.id, tutors.name;