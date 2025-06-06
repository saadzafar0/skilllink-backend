USE skilllink;
GO

SELECT 
            T.transactionID,
            T.Amount,
            T.tStatus,
            T.transactionOn,
            J.jobID,
            J.Title AS JobTitle,
            C.cID AS ClientID,
            U.Name AS ClientName,
            C.companyName
        FROM Transactions T
        JOIN Jobs J ON T.jID = J.jobID
        JOIN Clients C ON J.cID = C.cID
        JOIN Users U ON C.cID = U.userID
        WHERE C.cID = 5
        ORDER BY T.transactionOn DESC;


-- Section: Top Freelancers
--Top 5 highest-rated freelancers
SELECT TOP 5 freelancerID, Name, rating, totalReviews  
FROM Freelancers  
JOIN Users ON Freelancers.freelancerID = Users.userID  
ORDER BY rating DESC, totalReviews DESC;

--Freelancers With Specific Skills
SELECT f.freelancerID, f.niche, f.hourlyRate 
FROM Freelancers f
JOIN FreelancerSkills fs ON f.freelancerID = fs.fID
JOIN Skills s ON fs.skillID = s.skillID
WHERE s.skillName = 'Graphic Design';

--Freelancers with 4.5-star+ rating
GO
CREATE VIEW TopFreelancers AS
SELECT freelancerID, niche, hourlyRate, rating 
FROM Freelancers 
WHERE rating > 4.5;
GO
SELECT * FROM TopFreelancers;

--Total Earnings of a Freelancer
SELECT f.freelancerID, SUM(t.Amount) AS totalEarnings
FROM Freelancers f
JOIN Proposals p ON f.freelancerID = p.freelancerID
JOIN Jobs j ON p.jobID = j.jobID
JOIN Transactions t ON j.jobID = t.jID
GROUP BY f.freelancerID;

--All freelancers with their skills
SELECT f.freelancerID, u.Name, s.skillName
FROM Freelancers f
JOIN FreelancerSkills fs ON f.freelancerID = fs.fID
JOIN Skills s ON fs.skillID = s.skillID
JOIN Users u ON f.freelancerID = u.userID;

-- Section: Top Clients
-- Top 5 active clients (by job posting)
SELECT TOP 5 cID, COUNT(jobID) AS totalJobs 
FROM Jobs 
GROUP BY cID 
ORDER BY totalJobs DESC;

-- Section: Jobs
--Average Bid Amount on a Job
SELECT jobID, AVG(bidAmount) AS avgBid 
FROM Proposals 
GROUP BY jobID;

-- Count the number of proposals per job
SELECT j.jobID, j.Title, COUNT(p.proposalID) AS proposalCount
FROM Jobs j
LEFT JOIN Proposals p ON j.jobID = p.jobID
GROUP BY j.jobID, j.Title;

-- Count the number of reviews per job
SELECT j.jobID, j.Title, COUNT(r.reviewID) AS reviewCount
FROM Jobs j
LEFT JOIN Reviews r ON j.jobID = r.jobID
GROUP BY j.jobID, j.Title;

--Views for active job
GO
CREATE VIEW ActiveJobs AS
SELECT jobID, Title, description, postedOn 
FROM Jobs 
WHERE proposalsReceived;
GO
SELECT * FROM ActiveJobs;

-- Section: Transactions
--Total Earnings of Freelancers
GO
CREATE VIEW FreelancerEarnings AS  
SELECT Freelancers.freelancerID, Users.Name, SUM(Transactions.Amount) AS totalEarnings  
FROM Transactions  
JOIN Jobs ON Transactions.jID = Jobs.jobID  
JOIN Proposals ON Jobs.jobID = Proposals.jobID  
JOIN Freelancers ON Proposals.freelancerID = Freelancers.freelancerID  
JOIN Users ON Freelancers.freelancerID = Users.userID  
GROUP BY Freelancers.freelancerID, Users.Name;
GO
SELECT * FROM FreelancerEarnings;

-- transactions history
GO
CREATE VIEW TransactionsHistory AS
SELECT t.transactionID, t.jID, j.Title, t.Amount, t.tStatus, t.transactionOn
FROM Transactions t
JOIN Jobs j ON t.jID = j.jobID;
GO
SELECT * FROM TransactionsHistory;

-- Section: Stored Procedures
--Add new User

GO

CREATE PROCEDURE sp_AddUser
    @Name VARCHAR(255),
    @accType VARCHAR(50),
    @email VARCHAR(255),
    @Country VARCHAR(100),
    @userPassword VARCHAR(255)
AS
BEGIN
    INSERT INTO Users(Name, accType, email, Country, password)
    VALUES (@Name, @accType, @email, @Country, @userPassword);
END;
GO

--Add new Freelancer
CREATE PROCEDURE sp_AddFreelancer
    @userID INT,
    @niche VARCHAR(255),
    @hourlyRate FLOAT,
    @qualification VARCHAR(100),
    @about VARCHAR(255)
AS
BEGIN
    INSERT INTO Freelancers(freelancerID, niche, hourlyRate, qualification, about)
    VALUES (@userID, @niche, @hourlyRate, @qualification, @about);
END;
GO

-- Add new Client
CREATE PROCEDURE sp_AddClient
    @userID INT,
    @companyName VARCHAR(40),
    @companyAddress VARCHAR(255),
    @qualification VARCHAR(100),
    @about VARCHAR(255)
AS
BEGIN
    INSERT INTO Clients(cID, companyName, companyAddress, qualification, about)
    VALUES (@userID, @companyName, @companyAddress, @qualification, @about);
END;
GO

-- Add a new job
CREATE PROCEDURE sp_PostJob
    @cID INT,
    @Title VARCHAR(255),
    @description TEXT,
    @targetSkills VARCHAR(255),
    @connectsRequired INT,
    @estTime VARCHAR(50),
    @jobLevel VARCHAR(50)
AS
BEGIN
    INSERT INTO Jobs(cID, Title, description, targetSkills, connectsRequired, estTime, jobLevel)
    VALUES (@cID, @Title, @description, @targetSkills, @connectsRequired, @estTime, @jobLevel);
END;
GO

-- Submit a proposal
CREATE PROCEDURE sp_SubmitProposal
    @freelancerID INT,
    @jobID INT,
    @bidAmount INT,
    @coverLetter TEXT,
    @pStatus VARCHAR(50)
AS
BEGIN
    INSERT INTO Proposals(freelancerID, jobID, bidAmount, coverLetter, pStatus)
    VALUES (@freelancerID, @jobID, @bidAmount, @coverLetter, @pStatus);
END;
GO

-- Process Job Payment
CREATE PROCEDURE sp_ProcessTransaction
    @jobID INT,
    @Amount DECIMAL(10,2),
    @tStatus VARCHAR(50)
AS
BEGIN
    INSERT INTO Transactions(jID, Amount, tStatus)
    VALUES (@jobID, @Amount, @tStatus);
END;
GO

-- Execute Stored Procedures
EXEC sp_AddUser 'Qatada', 'Freelancer', 'qatada@goat.com', 'Pakistan', 'qatada123';
EXEC sp_AddFreelancer 1, 'Web Development', 50.0, 'Bachelor of Science', 'Experienced web developer';
EXEC sp_AddClient 2, 'Tech Corp', '123 Tech Street', 'Master of Business Administration', 'Leading tech company';
EXEC sp_PostJob 2, 'Website Development', 'Develop a new company website', 'Web Development, HTML, CSS', 5, '2 weeks', 'Intermediate';
EXEC sp_SubmitProposal 1, 1, 500, 'I am the best fit for this job because...', 'Pending';
EXEC sp_ProcessTransaction 1, 500.00, 'Completed';
--Top 5 highest-rated freelancers
SELECT TOP 5 freelancerID, Name, rating, totalReviews  
FROM Freelancers  
JOIN Users ON Freelancers.freelancerID = Users.userID  
ORDER BY rating DESC, totalReviews DESC;

-- Top 5 active clients (by job posting)
SELECT TOP 5 cID, COUNT(jobID) AS totalJobs 
FROM Jobs 
GROUP BY cID 
ORDER BY totalJobs DESC;

--Freelancers With Specific Skills
SELECT f.freelancerID, f.niche, f.hourlyRate 
FROM Freelancers f
JOIN FreelancerSkills fs ON f.freelancerID = fs.fID
JOIN Skills s ON fs.skillID = s.skillID
WHERE s.skillName = 'Graphic Design';

--Average Bid Amount on a Job
SELECT jobID, AVG(bidAmount) AS avgBid 
FROM Proposals 
GROUP BY jobID;

--Total Earnings of a Freelancer
SELECT f.freelancerID, SUM(t.Amount) AS totalEarnings
FROM Freelancers f
JOIN Proposals p ON f.freelancerID = p.freelancerID
JOIN Jobs j ON p.jobID = j.jobID
JOIN Transactions t ON j.jobID = t.jID
GROUP BY f.freelancerID;

--Views for active job
GO
CREATE VIEW ActiveJobs AS
SELECT jobID, Title, description, postedOn 
FROM Jobs 
WHERE proposalsReceived < 5;
GO
SELECT * FROM ActiveJobs;

--Freelancers with 4,5-star+ rating
GO
CREATE VIEW TopFreelancers AS
SELECT freelancerID, niche, hourlyRate, rating 
FROM Freelancers 
WHERE rating > 4.5;
GO

SELECT * FROM TopFreelancers;
GO

--Total Earnings of Freelancers
CREATE VIEW FreelancerEarnings AS  
SELECT Freelancers.freelancerID, Users.Name, SUM(Transactions.Amount) AS totalEarnings  
FROM Transactions  
JOIN Jobs ON Transactions.jID = Jobs.jobID  
JOIN Proposals ON Jobs.jobID = Proposals.jobID  
JOIN Freelancers ON Proposals.freelancerID = Freelancers.freelancerID  
JOIN Users ON Freelancers.freelancerID = Users.userID  
GROUP BY Freelancers.freelancerID, Users.Name;
GO
SELECT * FROM FreelancerEarnings;
GO

--All freelancers with their skills
SELECT f.freelancerID, u.Name, s.skillName
FROM Freelancers f
JOIN FreelancerSkills fs ON f.freelancerID = fs.fID
JOIN Skills s ON fs.skillID = s.skillID
JOIN Users u ON f.freelancerID = u.userID;

-- Count the number of proposals per job
SELECT j.jobID, j.Title, COUNT(p.proposalID) AS proposalCount
FROM Jobs j
LEFT JOIN Proposals p ON j.jobID = p.jobID
GROUP BY j.jobID, j.Title;

-- Count the number of reviews per job
SELECT j.jobID, j.Title, COUNT(r.reviewID) AS reviewCount
FROM Jobs j
LEFT JOIN Reviews r ON j.jobID = r.jobID
GROUP BY j.jobID, j.Title;

-- transactions history
GO
CREATE VIEW TransactionsHistory AS
SELECT t.transactionID, t.jID, j.Title, t.Amount, t.tStatus, t.transactionOn
FROM Transactions t
JOIN Jobs j ON t.jID = j.jobID;
GO
SELECT * FROM TransactionsHistory;

-- Stored Procedures
GO
--Add new User

-- CREATE PROCEDURE sp_AddUser
--     @Name VARCHAR(255),
--     @accType VARCHAR(50),
--     @email VARCHAR(255),
--     @Country VARCHAR(100),
--     @userPassword VARCHAR(255)
-- AS
-- BEGIN
--     INSERT INTO Users(Name, accType, email, Country, [password])
--     VALUES (@Name, @accType, @email, @Country, @userPassword);
-- END;
-- GO

--Add new Freelancer
CREATE PROCEDURE sp_AddFreelancer
    @userID INT,
    @niche VARCHAR(255),
    @hourlyRate FLOAT,
    @qualification VARCHAR(100),
    @about VARCHAR(255)
AS
BEGIN
    INSERT INTO Freelancers(freelancerID, niche, hourlyRate, qualification, about)
    VALUES (@userID, @niche, @hourlyRate, @qualification, @about);
END;
GO

-- Add new Client
CREATE PROCEDURE sp_AddClient
    @userID INT,
    @companyName VARCHAR(40),
    @companyAddress VARCHAR(255),
    @qualification VARCHAR(100),
    @about VARCHAR(255)
AS
BEGIN
    INSERT INTO Clients(cID, companyName, companyAddress, qualification, about)
    VALUES (@userID, @companyName, @companyAddress, @qualification, @about);
END;
GO

-- Add a new job
CREATE PROCEDURE sp_PostJob
    @cID INT,
    @Title VARCHAR(255),
    @description TEXT,
    @targetSkills VARCHAR(255),
    @connectsRequired INT,
    @estTime VARCHAR(50),
    @jobLevel VARCHAR(50)
AS
BEGIN
    INSERT INTO Jobs(cID, Title, description, targetSkills, connectsRequired, estTime, jobLevel)
    VALUES (@cID, @Title, @description, @targetSkills, @connectsRequired, @estTime, @jobLevel);
END;
GO

-- Submit a proposal
CREATE PROCEDURE sp_SubmitProposal
    @freelancerID INT,
    @jobID INT,
    @bidAmount INT,
    @coverLetter TEXT,
    @pStatus VARCHAR(50)
AS
BEGIN
    INSERT INTO Proposals(freelancerID, jobID, bidAmount, coverLetter, pStatus)
    VALUES (@freelancerID, @jobID, @bidAmount, @coverLetter, @pStatus);
END;
GO

-- Process Job Payment
CREATE PROCEDURE sp_ProcessTransaction
    @jobID INT,
    @Amount DECIMAL(10,2),
    @tStatus VARCHAR(50)
AS
BEGIN
    INSERT INTO Transactions(jID, Amount, tStatus)
    VALUES (@jobID, @Amount, @tStatus);
END;
GO

-- Execute Stored Procedures
-- Execute Stored Procedures
--EXEC sp_AddUser 'Qatada', 'Freelancer', 'qatada@goat.com', 'Pakistan', 'qatada123';
EXEC sp_AddFreelancer 1, 'Web Development', 50.0, 'Bachelor of Science', 'Experienced web developer';
EXEC sp_AddClient 2, 'Tech Corp', '123 Tech Street', 'Master of Business Administration', 'Leading tech company';
EXEC sp_PostJob 2, 'Website Development', 'Develop a new company website', 'Web Development, HTML, CSS', 5, '2 weeks', 'Intermediate';
EXEC sp_SubmitProposal 1, 1, 500, 'I am the best fit for this job because...', 'Pending';
EXEC sp_ProcessTransaction 1, 500.00, 'Completed';