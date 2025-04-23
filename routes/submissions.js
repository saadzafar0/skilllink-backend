const express = require('express');
const { sql, poolPromise } = require("../config/db");

const router = express.Router();
router.get('/job/:jobID', async (req, res) => {
    try {
        // Extract only the first number if there's a comma
        const jobIDStr = req.params.jobID.split(',')[0];
        const jobID = parseInt(jobIDStr);
        
        // Validate jobID
        if (isNaN(jobID)) {
            console.log(`Invalid jobID format: ${req.params.jobID}`);
            return res.status(400).json({ error: 'Invalid job ID format. Must be a number.' });
        }
        
        
        const pool = await poolPromise;
        const result = await pool.request()
            .input('jobID', sql.Int, jobID)
            .query(`
                SELECT s.submissionID, s.submissionDate, s.submissionText,
                       p.proposalID, p.freelancerID, p.bidAmount, p.pStatus,
                       u.Name as freelancerName
                FROM Submissions s
                JOIN Proposals p ON s.proposalID = p.proposalID
                JOIN Freelancers f ON p.freelancerID = f.freelancerID
                JOIN Users u ON f.freelancerID = u.userID
                WHERE p.jobID = @jobID
                ORDER BY s.submissionDate DESC
            `);
        
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// Create a new submission
router.post('/', async (req, res) => {
    const { proposalID, submissionText } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('proposalID', sql.Int, proposalID)
            .input('submissionText', sql.NVarChar, submissionText)
            .query(
                `INSERT INTO Submissions (proposalID, submissionText) 
                 VALUES (@proposalID, @submissionText); 
                 SELECT SCOPE_IDENTITY() AS submissionID;`
            );
        res.status(201).json({ submissionID: result.recordset[0].submissionID });
    } catch (error) {
        console.error('Error creating submission:', error);
        res.status(500).json({ error: 'Failed to create submission' });
    }
});

// Get all submissions
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`SELECT * FROM Submissions`);
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// Get a single submission by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM Submissions WHERE submissionID = @id`);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }
        res.status(200).json(result.recordset[0]);
    } catch (error) {
        console.error('Error fetching submission:', error);
        res.status(500).json({ error: 'Failed to fetch submission' });
    }
});

// Update a submission
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { submissionText } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('submissionText', sql.NVarChar, submissionText)
            .query(
                `UPDATE Submissions 
                 SET submissionText = @submissionText 
                 WHERE submissionID = @id`
            );
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }
        res.status(200).json({ message: 'Submission updated successfully' });
    } catch (error) {
        console.error('Error updating submission:', error);
        res.status(500).json({ error: 'Failed to update submission' });
    }
});

// Delete a submission
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM Submissions WHERE submissionID = @id`);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }
        res.status(200).json({ message: 'Submission deleted successfully' });
    } catch (error) {
        console.error('Error deleting submission:', error);
        res.status(500).json({ error: 'Failed to delete submission' });
    }
});

module.exports = router;