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

// Create and migrate the normalized tables required for the resume builder foundation.
// The job_details migration preserves earlier plain-text descriptions by moving them into the new HTML content field.
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

    const strCreateSkillsTable = `
        CREATE TABLE IF NOT EXISTS skills (
            skill_id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            name TEXT NOT NULL
        )
    `;

    const strCreateResumesTable = `
        CREATE TABLE IF NOT EXISTS resumes (
            resume_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    `;

    const strCreateResumeJobsTable = `
        CREATE TABLE IF NOT EXISTS resume_jobs (
            resume_id TEXT NOT NULL,
            job_id TEXT NOT NULL,
            PRIMARY KEY (resume_id, job_id),
            FOREIGN KEY (resume_id) REFERENCES resumes (resume_id) ON DELETE CASCADE,
            FOREIGN KEY (job_id) REFERENCES jobs (job_id) ON DELETE CASCADE
        )
    `;

    const strCreateResumeJobDetailsTable = `
        CREATE TABLE IF NOT EXISTS resume_job_details (
            resume_id TEXT NOT NULL,
            detail_id TEXT NOT NULL,
            PRIMARY KEY (resume_id, detail_id),
            FOREIGN KEY (resume_id) REFERENCES resumes (resume_id) ON DELETE CASCADE,
            FOREIGN KEY (detail_id) REFERENCES job_details (detail_id) ON DELETE CASCADE
        )
    `;

    const strCreateResumeSkillsTable = `
        CREATE TABLE IF NOT EXISTS resume_skills (
            resume_id TEXT NOT NULL,
            skill_id TEXT NOT NULL,
            PRIMARY KEY (resume_id, skill_id),
            FOREIGN KEY (resume_id) REFERENCES resumes (resume_id) ON DELETE CASCADE,
            FOREIGN KEY (skill_id) REFERENCES skills (skill_id) ON DELETE CASCADE
        )
    `;

    dbResumeForge.run(strCreateJobsTable);
    dbResumeForge.run(strCreateSkillsTable);
    migrateJobDetailsTable();
    dbResumeForge.run(strCreateResumesTable);
    dbResumeForge.run(strCreateResumeJobsTable);
    dbResumeForge.run(strCreateResumeJobDetailsTable);
    dbResumeForge.run(strCreateResumeSkillsTable);
});

function migrateJobDetailsTable() {
    dbResumeForge.all("PRAGMA table_info(job_details)", [], (error, arrColumns) => {
        if (error) {
            console.error('Job details migration error:', error.message);
            return;
        }

        const arrColumnNames = arrColumns.map((objColumn) => objColumn.name);
        const boolTableExists = arrColumns.length > 0;
        const boolHasContentColumn = arrColumnNames.includes('content');
        const boolHasCreatedAtColumn = arrColumnNames.includes('created_at');

        if (boolTableExists && boolHasContentColumn && boolHasCreatedAtColumn) {
            return;
        }

        const strContentSelect = arrColumnNames.includes('content') ? 'content' : 'description';
        const strCreatedAtSelect = arrColumnNames.includes('created_at') ? 'created_at' : "datetime('now')";

        dbResumeForge.serialize(() => {
            dbResumeForge.run('PRAGMA foreign_keys = OFF');

            dbResumeForge.run(`
                CREATE TABLE IF NOT EXISTS job_details_new (
                    detail_id TEXT PRIMARY KEY,
                    job_id TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (job_id) REFERENCES jobs (job_id) ON DELETE CASCADE
                )
            `);

            if (boolTableExists) {
                dbResumeForge.run(`
                    INSERT OR IGNORE INTO job_details_new
                        (detail_id, job_id, content, created_at)
                    SELECT
                        detail_id,
                        job_id,
                        ${strContentSelect},
                        ${strCreatedAtSelect}
                    FROM job_details
                `);
            }

            dbResumeForge.run('DROP TABLE IF EXISTS job_details');
            dbResumeForge.run('ALTER TABLE job_details_new RENAME TO job_details');
            dbResumeForge.run('PRAGMA foreign_keys = ON');
        });
    });
}

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
