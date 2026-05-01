const objPath = require('path');
const sqlite3 = require('sqlite3').verbose();

const strDatabasePath = objPath.join(__dirname, 'resumeforge.sqlite');

const dbResumeForge = new sqlite3.Database(strDatabasePath, (error) => {
    if (error) {
        console.error('Database connection error:', error.message);
    } else {
        console.log('Connected to the ResumeForge SQLite database.');
    }
});

// Create the first normalized table needed by the starter jobs API.
// Additional tables for responsibilities, skills, awards, resumes, and selections will be added in later steps.
dbResumeForge.serialize(() => {
    const strCreateJobsTable = `
        CREATE TABLE IF NOT EXISTS tblJobs (
            JobID TEXT PRIMARY KEY,
            CompanyName TEXT NOT NULL,
            JobTitle TEXT NOT NULL,
            StartDate TEXT NOT NULL,
            EndDate TEXT,
            Location TEXT,
            CreatedAt TEXT NOT NULL
        )
    `;

    dbResumeForge.run(strCreateJobsTable);
});

function runAsync(strQuery, arrParameters = []) {
    return new Promise((resolve, reject) => {
        dbResumeForge.run(strQuery, arrParameters, function(error) {
            if (error) {
                reject(error);
            } else {
                resolve({
                    intChanges: this.changes,
                    intLastID: this.lastID
                });
            }
        });
    });
}

function getAsync(strQuery, arrParameters = []) {
    return new Promise((resolve, reject) => {
        dbResumeForge.get(strQuery, arrParameters, (error, objRow) => {
            if (error) {
                reject(error);
            } else {
                resolve(objRow);
            }
        });
    });
}

function allAsync(strQuery, arrParameters = []) {
    return new Promise((resolve, reject) => {
        dbResumeForge.all(strQuery, arrParameters, (error, arrRows) => {
            if (error) {
                reject(error);
            } else {
                resolve(arrRows);
            }
        });
    });
}

module.exports = {
    dbResumeForge,
    runAsync,
    getAsync,
    allAsync
};
