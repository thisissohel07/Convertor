const fs = require('fs');
const path = require('path');

// Clean files older than 30 minutes
const MAX_AGE = 30 * 60 * 1000; 

const cleanupDirectory = (dirPath) => {
    if (!fs.existsSync(dirPath)) return;
    
    fs.readdir(dirPath, (err, files) => {
        if (err) return console.error(`Failed to read directory ${dirPath}:`, err);
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return console.error(`Failed to stat file ${filePath}:`, err);
                if (now - stats.mtimeMs > MAX_AGE) {
                    fs.unlink(filePath, err => {
                        if (err) console.error(`Failed to delete old file ${filePath}:`, err);
                        else console.log(`Deleted old file: ${filePath}`);
                    });
                }
            });
        });
    });
};

const cleanupFiles = () => {
    console.log('Running scheduled cleanup task...');
    cleanupDirectory(path.join(__dirname, '../uploads'));
    cleanupDirectory(path.join(__dirname, '../converted'));
};

module.exports = { cleanupFiles };
