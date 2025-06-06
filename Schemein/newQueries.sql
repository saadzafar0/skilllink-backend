--Views for active job
GO
CREATE VIEW ActiveJobs AS
SELECT jobID, Title, description, postedOn 
FROM Jobs 
WHERE proposalsReceived;
GO
SELECT * FROM ActiveJobs;


-- transactions history
GO
CREATE VIEW TransactionsHistory AS
SELECT t.transactionID, t.jID, j.Title, t.Amount, t.tStatus, t.transactionOn
FROM Transactions t
JOIN Jobs j ON t.jID = j.jobID;
GO
SELECT * FROM TransactionsHistory;



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