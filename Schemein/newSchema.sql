CREATE DATABASE skilllink;
GO
USE [skilllink];
GO

-- USERS TABLE
CREATE TABLE Users (
    userID INT PRIMARY KEY IDENTITY(1,1),
    Name VARCHAR(255) NOT NULL,
    accType VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    Country VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    createdAt DATE DEFAULT GETDATE(),

    CONSTRAINT chkPasswordHasNumber CHECK (password LIKE '%[0-9]%'),
    CONSTRAINT chkUserType CHECK (accType IN ('Freelancer', 'Client'))
);

-- CLIENTS TABLE
CREATE TABLE Clients (
    cID INT PRIMARY KEY,
    companyName VARCHAR(40),
    companyAddress VARCHAR(255),
    qualification VARCHAR(100),
    about VARCHAR(255),
    amount MONEY DEFAULT 50.0,
    spent MONEY DEFAULT 0,
    rating FLOAT DEFAULT 0.0,
    totalReviews INT DEFAULT 0,
    CONSTRAINT fk_Client_User FOREIGN KEY (cID) 
        REFERENCES Users(userID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- FREELANCERS TABLE
CREATE TABLE Freelancers (
    freelancerID INT PRIMARY KEY,
    niche VARCHAR(255),
    hourlyRate FLOAT NOT NULL,
    totalConnects INT DEFAULT 80,
    rating FLOAT DEFAULT 0.0,
    qualification VARCHAR(100),
    amount MONEY DEFAULT 50.0,
    earned MONEY DEFAULT 0,
    withdrawn MONEY DEFAULT 0,
    about VARCHAR(255),
    totalReviews INT DEFAULT 0,
    CONSTRAINT fk_Freelancer_User FOREIGN KEY (freelancerID) 
        REFERENCES Users(userID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- JOBS TABLE
CREATE TABLE Jobs (
    jobID INT PRIMARY KEY IDENTITY(1,1),
    cID INT,
    Title VARCHAR(255) NOT NULL,
    description TEXT,
    price MONEY DEFAULT 10.0,
    targetSkills VARCHAR(255),
    connectsRequired INT,
    estTime VARCHAR(50),
    jobLevel VARCHAR(50),
    proposalsReceived INT DEFAULT 0,
    postedOn SMALLDATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_Job_Client FOREIGN KEY (cID) 
        REFERENCES Clients(cID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

CREATE TABLE Proposals (
    proposalID INT PRIMARY KEY IDENTITY(1,1),
    freelancerID INT,
    jobID INT NULL,
    bidAmount INT DEFAULT 0,
    coverLetter TEXT,
    pStatus VARCHAR(50) DEFAULT 'Pending',
    submittedOn smalldatetime DEFAULT GETDATE(),

    CONSTRAINT fk_Proposal_Freelancer FOREIGN KEY (freelancerID)
        REFERENCES Freelancers(freelancerID)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_Proposal_Job FOREIGN KEY (jobID)
        REFERENCES Jobs(jobID)
        ON DELETE NO ACTION ON UPDATE no action
);



-- REVIEWS TABLE
CREATE TABLE Reviews (
    reviewID INT PRIMARY KEY IDENTITY(1,1),
    jobID INT,
    clientRating INT,
    freelancerRating INT,
    Comments TEXT,
    reviewedOn SMALLDATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_Review_Job FOREIGN KEY (jobID) 
        REFERENCES Jobs(jobID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- TRANSACTIONS TABLE
CREATE TABLE Transactions (
    transactionID INT PRIMARY KEY IDENTITY(1,1),
    jID INT,
    Amount DECIMAL(10, 2),
    tStatus VARCHAR(50),
    transactionOn SMALLDATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_Transaction_Job FOREIGN KEY (jID) 
        REFERENCES Jobs(jobID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

CREATE TABLE Messages (
    messageID INT PRIMARY KEY IDENTITY(1,1),
    senderID INT,
    receiverID INT,
    jID INT,
    messages TEXT,
    sentOn SMALLDATETIME DEFAULT GETDATE(),
    isRead BIT DEFAULT 0,

    CONSTRAINT fk_Message_Sender FOREIGN KEY (senderID) 
        REFERENCES Users(userID) 
        ON DELETE no action 
        ON UPDATE no action,

    CONSTRAINT fk_Message_Receiver FOREIGN KEY (receiverID) 
        REFERENCES Users(userID) 
        ON DELETE no action 
        ON UPDATE no action,

    CONSTRAINT fk_Message_Job FOREIGN KEY (jID) 
        REFERENCES Jobs(jobID) 
        ON DELETE no action
        ON UPDATE no action
);
GO

CREATE TABLE Submissions(
    submissionID INT PRIMARY KEY IDENTITY(1,1),
    proposalID INT,
    submissionDate SMALLDATETIME DEFAULT GETDATE(),
    submissionText VARCHAR(255),
    CONSTRAINT fk_Submission_Proposal FOREIGN KEY (proposalID) 
        REFERENCES Proposals(proposalID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

------------------------ INSERTION ------------------------------------------------------

-- USERS (5 Freelancers, 5 Clients)
INSERT INTO Users (Name, accType, email, Country, password)
VALUES
('Alice Johnson', 'Freelancer', 'alice@freemail.com', 'USA', 'pass1234'),
('Bob Smith', 'Client', 'bob@clientmail.com', 'Canada', 'secure567'),
('Charlie King', 'Freelancer', 'charlie@freeworld.com', 'UK', 'charlie9'),
('Diana Prince', 'Client', 'diana@bizmail.com', 'Germany', 'wonder8'),
('Ethan Ray', 'Freelancer', 'ethan@devmail.com', 'India', 'ethan2024'),
('Fiona Stone', 'Client', 'fiona@corp.com', 'USA', 'fiona22'),
('George Lee', 'Freelancer', 'george@designs.com', 'Australia', 'glee123'),
('Hannah Miles', 'Client', 'hannah@biz.org', 'France', 'hmiles456'),
('Ivan Brooks', 'Freelancer', 'ivan@data.com', 'Spain', 'ivan999'),
('Julia Kent', 'Client', 'julia@ventures.com', 'Italy', 'julia777');

-- CLIENTS
INSERT INTO Clients (cID, companyName, companyAddress, qualification, about)
VALUES
(2, 'TechWave Inc', '123 Maple St, Toronto', 'MBA', 'Software innovation'),
(4, 'GlobalBiz Ltd', '456 Oak Ave, Berlin', 'PhD', 'Business solutions'),
(6, 'DesignCore', '22 Elm St, NYC', 'MBA', 'Creative agency'),
(8, 'InsightPartners', '78 Rue de Rivoli, Paris', 'MSc', 'Market analytics'),
(10, 'NextGen Solutions', 'Via Roma 33, Rome', 'MBA', 'IT services');

-- FREELANCERS
INSERT INTO Freelancers (freelancerID, niche, hourlyRate, qualification, about)
VALUES
(1, 'Web Development', 45.0, 'BSc CS', 'Frontend wizard'),
(3, 'Graphic Design', 30.0, 'BA Design', 'Logos & branding'),
(5, 'Data Science', 50.0, 'MSc Analytics', 'AI & ML projects'),
(7, 'UI/UX Design', 35.0, 'BDes', 'Mobile & Web UI'),
(9, 'Business Analysis', 40.0, 'MBA', 'Process optimization');

-- JOBS
INSERT INTO Jobs (cID, Title, description, price, targetSkills, connectsRequired, estTime, jobLevel)
VALUES
(2, 'Company Website', 'Build a responsive company site.', 500, 'HTML,CSS,JS', 5, '2 weeks', 'Intermediate'),
(2, 'Logo Design', 'Need a unique logo for our brand.', 150, 'Photoshop,Illustrator', 3, '1 week', 'Entry'),
(4, 'Power BI Dashboard', 'Visualize sales data.', 700, 'Power BI,DAX', 6, '3 weeks', 'Advanced'),
(6, 'Social Media Kit', 'Graphics for Instagram and LinkedIn.', 200, 'Canva,Figma', 4, '1 week', 'Entry'),
(6, 'Landing Page', 'Design & dev a product landing page.', 400, 'HTML,CSS,React', 5, '1.5 weeks', 'Intermediate'),
(8, 'Data Cleaning Script', 'Clean customer data using Python.', 300, 'Python,Pandas', 4, '1 week', 'Intermediate'),
(10, 'Pitch Deck Design', 'Stylish slide deck needed.', 250, 'PowerPoint,Figma', 3, '4 days', 'Entry'),
(4, 'Ad Copywriting', 'Create copy for ads.', 180, 'Copywriting,SEO', 3, '3 days', 'Entry'),
(8, 'UX Audit', 'Audit website for UX flaws.', 320, 'UX,Figma', 5, '1 week', 'Intermediate'),
(10, 'AI Chatbot', 'Develop a basic NLP chatbot.', 1000, 'Python,NLP', 8, '4 weeks', 'Advanced');

-- PROPOSALS
INSERT INTO Proposals (freelancerID, jobID, bidAmount, coverLetter, pStatus)
VALUES
(1, 1, 480, 'Expert in web dev.', 'Submitted'),
(3, 2, 140, 'Let me design your logo.', 'Accepted'),
(5, 3, 690, 'Expert in dashboards.', 'Under Review'),
(7, 4, 190, 'I do social graphics.', 'Submitted'),
(1, 5, 390, 'Landing page samples ready.', 'Submitted'),
(9, 6, 290, 'Experienced in cleaning data.', 'Accepted'),
(3, 7, 230, 'Presentation work is my forte.', 'Under Review'),
(9, 8, 170, 'SEO-trained copywriting.', 'Rejected'),
(7, 9, 310, 'UX report in 5 days.', 'Submitted'),
(5, 10, 990, 'Worked on NLP bots before.', 'Submitted');

-- REVIEWS
INSERT INTO Reviews (jobID, clientRating, freelancerRating, Comments)
VALUES
(1, 5, 5, 'Brilliant site!'),
(2, 4, 4, 'Good effort.'),
(3, 5, 5, 'Very professional.'),
(4, 4, 4, 'Nice graphics.'),
(5, 5, 5, 'Love the layout.'),
(6, 5, 5, 'Cleaned everything!'),
(7, 4, 4, 'Stylish deck.'),
(8, 3, 3, 'Not bad.'),
(9, 5, 5, 'Great analysis.'),
(10, 5, 5, 'Chatbot works well.');

-- TRANSACTIONS
INSERT INTO Transactions (jID, Amount, tStatus)
VALUES
(1, 500, 'Completed'),
(2, 150, 'Completed'),
(3, 700, 'Completed'),
(4, 200, 'Completed'),
(5, 400, 'Pending'),
(6, 300, 'Completed'),
(7, 250, 'Completed'),
(8, 180, 'Failed'),
(9, 320, 'Completed'),
(10, 1000, 'Pending');

-- MESSAGES
INSERT INTO Messages (senderID, receiverID, jID, messages)
VALUES
(2, 1, 1, 'Can we have the homepage first?'),
(1, 2, 1, 'Sure, working on it.'),
(4, 5, 3, 'Is the dashboard interactive?'),
(5, 4, 3, 'Yes, fully.'),
(6, 3, 2, 'Let�s review logo drafts.'),
(3, 6, 2, 'Sent you 3 options.'),
(8, 9, 6, 'Script runs perfectly.'),
(9, 8, 6, 'Happy to help.'),
(10, 5, 10, 'Chatbot delivery ETA?'),
(5, 10, 10, '2 more days max.');
