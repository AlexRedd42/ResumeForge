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

// Foreign keys must be enabled for each SQLite connection so related job details stay connected to valid jobs.
dbResumeForge.run('PRAGMA foreign_keys = ON');

// Create the normalized starter tables required for the resume builder foundation.
// These tables intentionally stay small now so later resume-selection tables can reference them cleanly.
dbResumeForge.serialize(() => {
    const strCreateJobsTable = `
        CREATE TABLE IF NOT EXISTS jobs (
            job_id TEXT PRIMARY KEY,
            company_name TEXT NOT NULL,
            job_title TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT
        )
    `;

    const strCreateJobDetailsTable = `
        CREATE TABLE IF NOT EXISTS job_details (
            detail_id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            description TEXT NOT NULL,
            FOREIGN KEY (job_id) REFERENCES jobs (job_id) ON DELETE CASCADE
        )
    `;

    const strCreateSkillsTable = `
        CREATE TABLE IF NOT EXISTS skills (
            skill_id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            name TEXT NOT NULL
        )
    `;

    dbResumeForge.run(strCreateJobsTable);
    dbResumeForge.run(strCreateJobDetailsTable);
    dbResumeForge.run(strCreateSkillsTable);
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
