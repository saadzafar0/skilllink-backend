
USE skilllink;
Go


-- Retrieve all data from all tables
SELECT * FROM Users;
SELECT * FROM Freelancers;
SELECT * FROM Clients;
SELECT * FROM Jobs;
SELECT * FROM Proposals;
SELECT * FROM Reviews;
SELECT * FROM Skills;
SELECT * FROM FreelancerSkills;
SELECT * FROM Transactions;
SELECT * FROM Messages;
SELECT * from Submissions;

SELECT earned FROM Freelancers;



-- Users Table
CREATE TABLE Users (
    userID INT PRIMARY KEY IDENTITY(1,1),
    Name VARCHAR(255) NOT NULL,
    accType VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQue NOT NULL,
    Country VARCHAR(100),
	password VARCHAR(255) NOT NULL,
    createdAt DATE DEFAULT GETDATE()
);

-- Clients Table
CREATE TABLE Clients (
    cID INT PRIMARY KEY FOREIGN KEY REFERENCES Users(userID),
    companyName VARCHAR(40),
	companyAddress varchar(255),
	qualification varchar(100),
	about varchar(255),
	amount money default 50.0,
	spent money default 0,
	rating float default 0.0,
	totalReviews int default 0
);


-- Freelancers Table
CREATE TABLE Freelancers (
    freelancerID INT PRIMARY key FOREIGN KEY REFERENCES Users(userID),
    niche VARCHAR(255),
    hourlyRate FLOAT NOT NULL,
    totalConnects INT default 80,
    rating float default 0.0,
	qualification varchar(100),
	amount money default 50.0,
	earned money default 0,
	withdrawn money default 0,
	about varchar(255),
	totalReviews int default 0
);


-- Jobs Table
--drop table Jobs;
--select * from Jobs;
CREATE TABLE Jobs (
    jobID INT PRIMARY KEY IDENTITY(1,1),
    cID INT FOREIGN KEY REFERENCES Clients(cID),
    Title VARCHAR(255) NOT NULL,
    description TEXT,
    targetSkills VARCHAR(255),
    connectsRequired INT,
    estTime VARCHAR(50),
    jobLevel VARCHAR(50),
    proposalsReceived INT DEFAULT 0,
    postedOn smalldatetime default getdate()
);

-- Proposals Table
--drop table Proposals;
CREATE TABLE Proposals (
    proposalID INT PRIMARY KEY IDENTITY(1,1),
    freelancerID INT FOREIGN KEY REFERENCES Freelancers(freelancerID),
    jobID INT FOREIGN KEY REFERENCES Jobs(jobID),
    bidAmount int default 0,
    coverLetter TEXT,
    pStatus VARCHAR(50) ,
    submittedOn smalldatetime default getdate()
);
---Pending
use skilllink
ALTER TABLE Proposals
ADD CONSTRAINT DF_Proposals_pStatus DEFAULT 'Pending' FOR pStatus;

-- Reviews Table
--drop table Reviews;
CREATE TABLE Reviews (
    reviewID INT PRIMARY KEY IDENTITY(1,1),
    jobID INT FOREIGN KEY REFERENCES Jobs(jobID),
    clientRating INT,
    freelancerRating INT,
    Comments TEXT,
    reviewedOn smalldatetime default getdate()
);

-- Skills Table
CREATE TABLE Skills (
    skillID INT PRIMARY KEY IDENTITY(1,1),
    skillName VARCHAR(255) NOT NULL
);

-- Freelancer_Skills Table (Many-to-Many Relationship)
CREATE TABLE FreelancerSkills (
    fID INT FOREIGN KEY REFERENCES Freelancers(freelancerID),
    skillID INT FOREIGN KEY REFERENCES Skills(skillID),
    PRIMARY KEY (fID, skillID)
);

-- Transactions Table
--drop table Transactions;
CREATE TABLE Transactions (
    transactionID INT PRIMARY KEY IDENTITY(1,1),
    jID INT FOREIGN KEY REFERENCES Jobs(jobID),
    Amount DECIMAL(10, 2),
    tStatus VARCHAR(50),
    transactionOn smalldatetime default getdate()
);

-- LinkCoins Table	(No need of this table)
--drop table LinkCoins;
--CREATE TABLE LinkCoins (
--    linkID INT PRIMARY KEY IDENTITY(1,1),
--    fID INT FOREIGN KEY REFERENCES Freelancers(freelancerID),
--    jID INT FOREIGN KEY REFERENCES Jobs(jobID),
--    linksUsed INT,
--    pID INT FOREIGN KEY REFERENCES Proposals(proposalID)
--);

-- Messages Table
--drop table Messages;
	-- Not final version
CREATE TABLE Messages (	
    messageID INT PRIMARY KEY IDENTITY(1,1),
    senderID INT FOREIGN KEY REFERENCES Users(userID),
    receiverID INT FOREIGN KEY REFERENCES Users(userID),
    jID INT FOREIGN KEY REFERENCES Jobs(jobID),
    messages TEXT,
    sentOn smalldatetime default getdate(),
	isRead bit DEFAULT 0
);

GO
--------------CONSTRAINTS---------------------------------
-- the password must contain at least one number
ALTER TABLE Users
ADD CONSTRAINT chkPasswordHasNumber
CHECK (password LIKE '%[0-9]%');

-- account Type Constraint
ALTER TABLE Users
add constraint userType check(accType IN('Freelancer', 'Client'));

ALTER TABLE Clients
ADD CONSTRAINT fkClients
FOREIGN KEY (cID) REFERENCES Users(userID) ON UPDATE CASCADE ON DELETE CASCADE;


ALTER TABLE Freelancers
ADD CONSTRAINT fkFreelancers
FOREIGN KEY (freelancerID) REFERENCES Users(userID) ON UPDATE CASCADE ON DELETE CASCADE;

-- Price attribute in Jobs
ALTER TABLE Jobs
ADD price MONEY CONSTRAINT DF_Jobs_Price DEFAULT 10;

-- update the Prices in Jobs
UPDATE Jobs
SET price = CAST(ABS(CHECKSUM(NEWID())) % 901 + 100 AS MONEY)
WHERE jobID IN (
    1, 2, 3, 4, 1002, 1003, 1004, 1005, 1006, 
    1007, 1008, 1009, 2002, 2003, 2004, 2005
);



-- Trigger to increment the proposalsReceived variable
GO
Create trigger trgAfterInsertProposal ON Proposals
after INSERT as
begin
    -- Update the proposalsReceived count in the Jobs table
    update Jobs
    set proposalsReceived = proposalsReceived + 1
    where jobID IN (SELECT jobID FROM inserted);
END;
GO


-- Triggers to cascade deleate/update jobs
CREATE TRIGGER trgDeleteClient ON Clients
FOR DELETE AS
BEGIN
    DELETE FROM Jobs
    WHERE cID IN (SELECT cID FROM deleted);
END;

GO
CREATE TRIGGER trgUpdateClient ON Clients
FOR UPDATE AS
BEGIN
    UPDATE Jobs
    SET cID = (SELECT cID FROM inserted)
    WHERE cID IN (SELECT cID FROM deleted);
END;

GO
-- Triggers to cascade deleate/update jobs
CREATE TRIGGER trgDeleteJob ON Jobs
FOR DELETE AS
BEGIN
    DELETE FROM Proposals
    WHERE Proposals.jobID IN (SELECT jobID FROM deleted);
END;
GO

-- -- Disable the trigger
-- DISABLE TRIGGER trgUpdateJob ON Jobs;

-- Re-enable the trigger
ENABLE TRIGGER trgUpdateJob ON Jobs;

CREATE TRIGGER trgUpdateJob ON Jobs
FOR UPDATE AS
BEGIN
    UPDATE Proposals
    SET Proposals.jobID = (SELECT jobID FROM inserted)
    WHERE Proposals.jobID IN (SELECT jobID FROM deleted);
END;


Alter Table Transactions
Add Constraint fkTransactions
Foreign Key (jID) References Jobs(jobID) On Update No Action On Delete No Action;


Alter Table Reviews
Add Constraint fkReviews
Foreign Key (jobID) References Jobs(jobID) On Update No Action On Delete No Action;


Alter Table FreelancerSkills
Add Constraint fkSkill
Foreign Key (skillID) References Skills(skillID) On Update Cascade On Delete No Action;

GO
-- Triggers to cascade deleate/update FreelancerSkill
CREATE TRIGGER trgDeleteSkill ON Freelancers
FOR DELETE AS
BEGIN
    DELETE FROM FreelancerSkills
    WHERE FreelancerSkills.fID IN (SELECT freelancerID FROM deleted);
END;

GO
CREATE TRIGGER trgUpdateSkill ON Freelancers
FOR UPDATE AS
BEGIN
    UPDATE FreelancerSkills
    SET fID = (SELECT freelancerID FROM inserted)
    WHERE fID IN (SELECT freelancerID FROM deleted);
END;
GO

INSERT INTO Proposals (freelancerID, jobID, bidAmount, coverLetter) VALUES
(1, 1, 1000, 'I am interested in this project and have the required skills.'),
(2, 2, 1500, 'I can deliver this project within the deadline.'),
(3, 3, 1200, 'I have experience in similar projects.')
-------------------------------INSERTIONS-------------------------------------
select * from Users;
INSERT INTO Users(Name, accType, email, Country, Users.password)VALUES
('Ahmad', 'Freelancer', 'ahmad@gmail.com', 'Pakistan', 'ahmad1'),
('Amjad', 'Freelancer', 'amjad@gmail.com', 'Pakistan', 'amjad1'),
('Jogesh P.', 'Freelancer', 'jogesh.pajeet@gmail.com', 'India', 'jogesh1'),
('Henry H.', 'Client', 'henrry@gmail.com', 'Australia', 'henry1'),
('James', 'Client', 'james@gmail.com', 'Finland', 'james1'),
('Larry B.', 'Client', 'evil.larry@gmail.com', 'US', 'explosion1'),
('Arslan', 'Freelancer', 'arslan@gmail.com', 'Nepal', 'arslan1');


select * from Skills;
select * from Users;
select * from Freelancers;
INSERT INTO Skills(skillName)VALUES
('Graphic Design'),
('Web Development'),
('Mobile App Development'),
('Content Writing'),
('Digital Marketing'),
('Video Editing'),
('Social Media Management'),
('SEO (Search Engine Optimization)'),
('Data Entry'),
('UI/UX Design'),
('Photography'),
('Copywriting'),
('Translation'),
('E-commerce Development'),
('Project Management');


INSERT INTO Freelancers(freelancerID, niche, hourlyRate, qualification, about)Values
(1, 'Graphic Design', 25.0, 'Bachelor of Fine Arts', 'Experienced graphic designer with 5+ years of experience in creating logos, branding, and marketing materials.'),
(2, 'Web Development', 50.0, 'Bachelor of Computer Science', 'Full-stack web developer specializing in React, Node.js, and MongoDB.'),
(3, 'Digital Marketing', 35.0, 'MBA in Marketing', 'Digital marketing expert with a focus on SEO, PPC, and social media campaigns.'),
(7, 'Video Editing', 40.0, 'Diploma in Film Production', 'Professional video editor with expertise in Adobe Premiere Pro and After Effects.');

INSERT INTO FreelancerSkills(fID, skillID) VALUES
(1, 1),  -- Freelancer 1 (Graphic Designer)
(2, 2),  -- Freelancer 2 (Web Developer)
(3, 5),  -- Freelancer 3 (Digital Marketer)
(7, 6);  -- Freelancer 7 (Video Editor) 


select * from Clients;
INSERT INTO Clients(cID, companyName, companyAddress, qualification, about) Values
(4, 'Henry Solutions', '123 Sydney St, Sydney', 'MBA in Business', 'A leading provider of business solutions in Australia.'),
(5, 'James Tech', '456 Helsinki St, Helsinki', 'MSc in Computer Science', 'Innovative tech company specializing in software development.'),
(6, 'Larry Enterprises', '789 New York St, New York', 'PhD in Engineering', 'Global engineering and technology firm.');


select * from Jobs;
INSERT INTO Jobs (cID, Title, description, targetSkills, connectsRequired, estTime, jobLevel,price)VALUES
(4, 'Business Consulting', 'Need a consultant for business strategy.', 'Business Strategy, Consulting', 10, '2 weeks', 'Advanced',100),
(5, 'Software Development', 'Looking for a developer to build a web app.', 'React, Node.js, MongoDB', 15, '1 month', 'Intermediate',200),
(6, 'Engineering Project', 'Require an engineer for a construction project.', 'Civil Engineering, Project Management', 20, '3 months', 'Expert',300);

GO


-- Insert new users
INSERT INTO Users(Name, accType, email, Country, Users.password) VALUES
('Alice', 'Freelancer', 'alice@gmail.com', 'USA', 'alice1'),
('Bob', 'Freelancer', 'bob@gmail.com', 'Canada', 'bob1'),
('Charlie', 'Freelancer', 'charlie@gmail.com', 'UK', 'charlie1'),
('David', 'Freelancer', 'david@gmail.com', 'Australia', 'david1'),
('Eve', 'Freelancer', 'eve@gmail.com', 'New Zealand', 'eve1'),
('Frank', 'Client', 'frank@gmail.com', 'Germany', 'frank1'),
('Grace', 'Client', 'grace@gmail.com', 'France', 'grace1'),
('Heidi', 'Client', 'heidi@gmail.com', 'Italy', 'heidi1'),
('Ivan', 'Client', 'ivan@gmail.com', 'Russia', 'ivan1'),
('Judy', 'Client', 'judy@gmail.com', 'Spain', 'judy1'),
('Mallory', 'Freelancer', 'mallory@gmail.com', 'Brazil', 'mallory1'),
('Oscar', 'Freelancer', 'oscar@gmail.com', 'Mexico', 'oscar1');

-- Link new users with freelancers
INSERT INTO Freelancers(freelancerID, niche, hourlyRate, qualification, about) VALUES
(8, 'Graphic Design', 30.0, 'Bachelor of Arts', 'Creative graphic designer with a passion for visual storytelling.'),
(9, 'Web Development', 45.0, 'Bachelor of Computer Science', 'Experienced web developer with a focus on front-end technologies.'),
(10, 'Content Writing', 20.0, 'Bachelor of English', 'Professional content writer with expertise in SEO and digital marketing.'),
(11, 'Digital Marketing', 40.0, 'MBA in Marketing', 'Digital marketing specialist with a track record of successful campaigns.'),
(12, 'Video Editing', 35.0, 'Diploma in Film Production', 'Skilled video editor with experience in various editing software.'),
(13, 'Graphic Design', 28.0, 'Bachelor of Fine Arts', 'Innovative graphic designer with a unique approach to branding.'),
(18, 'Web Development', 50.0, 'Master of Computer Science', 'Full-stack developer with expertise in modern web technologies.');

-- Link new users with clients
INSERT INTO Clients(cID, companyName, companyAddress, qualification, about) VALUES
(14, 'Frank Solutions', '123 Berlin St, Berlin', 'MBA in Business', 'Leading business solutions provider in Germany.'),
(15, 'Grace Innovations', '456 Paris St, Paris', 'MSc in Innovation', 'Innovative company specializing in tech solutions.'),
(16, 'Heidi Enterprises', '789 Rome St, Rome', 'PhD in Engineering', 'Global engineering and technology firm.'),
(17, 'Ivan Tech', '101 Moscow St, Moscow', 'MSc in Computer Science', 'Tech company focusing on software development.'),
(19, 'Judy Consulting', '202 Madrid St, Madrid', 'MBA in Consulting', 'Consulting firm with a focus on business strategy.');


-- Update ratings for existing freelancers
UPDATE Freelancers SET rating = 4.5 WHERE freelancerID = 1;
UPDATE Freelancers SET rating = 4.7 WHERE freelancerID = 2;
UPDATE Freelancers SET rating = 4.2 WHERE freelancerID = 3;
UPDATE Freelancers SET rating = 4.8 WHERE freelancerID = 7;
UPDATE Freelancers SET rating = 4.3 WHERE freelancerID = 8;
UPDATE Freelancers SET rating = 4.6 WHERE freelancerID = 9;
UPDATE Freelancers SET rating = 4.1 WHERE freelancerID = 10;
UPDATE Freelancers SET rating = 4.9 WHERE freelancerID = 11;
UPDATE Freelancers SET rating = 4.4 WHERE freelancerID = 12;
UPDATE Freelancers SET rating = 4.0 WHERE freelancerID = 13;
UPDATE Freelancers SET rating = 4.7 WHERE freelancerID = 18;

-- Update ratings for existing clients
UPDATE Clients SET rating = 4.5 WHERE cID = 4;
UPDATE Clients SET rating = 4.6 WHERE cID = 5;
UPDATE Clients SET rating = 4.4 WHERE cID = 6;
UPDATE Clients SET rating = 4.3 WHERE cID = 14;
UPDATE Clients SET rating = 4.7 WHERE cID = 15;
UPDATE Clients SET rating = 4.8 WHERE cID = 16;
UPDATE Clients SET rating = 4.2 WHERE cID = 17;
UPDATE Clients SET rating = 4.1 WHERE cID = 19;

-------------------------- Retrieves ------------------------------------------
-- Retrieve client details along with their posted jobs
SELECT c.cID, c.companyName, j.Title, j.description
FROM Clients c
INNER JOIN Jobs j ON c.cID = j.cID;



INSERT INTO Jobs (cID, Title, description, targetSkills, connectsRequired, estTime, jobLevel) VALUES
(4, 'Market Research', 'Need a market researcher for a new product launch.', 'Market Research, Data Analysis', 12, '3 weeks', 'Intermediate'),
(5, 'Mobile App Development', 'Looking for a developer to create a mobile app.', 'iOS, Android, React Native', 20, '2 months', 'Advanced'),
(6, 'Content Creation', 'Require a content writer for blog posts and articles.', 'Content Writing, SEO', 8, '1 month', 'Beginner'),
(14, 'Graphic Design', 'Need a graphic designer for branding materials.', 'Graphic Design, Adobe Illustrator', 10, '2 weeks', 'Intermediate'),
(15, 'SEO Optimization', 'Looking for an SEO expert to improve website ranking.', 'SEO, Digital Marketing', 15, '1 month', 'Advanced'),
(16, 'Project Management', 'Require a project manager for a construction project.', 'Project Management, Civil Engineering', 18, '6 months', 'Expert'),
(17, 'Software Testing', 'Need a QA tester for a web application.', 'Software Testing, Automation', 10, '1 month', 'Intermediate'),
(19, 'Business Analysis', 'Looking for a business analyst for process improvement.', 'Business Analysis, Data Analysis', 12, '2 months', 'Advanced');