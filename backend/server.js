const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const convertRoutes = require('./routes/convert');
const { cleanupFiles } = require('./utils/cleanup');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure directories exist
const dirs = ['uploads', 'converted'];
dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Routes
app.use('/api/convert', convertRoutes);

// Static route to serve converted files if needed, or we just sendfile
// app.use('/download', express.static(path.join(__dirname, 'converted')));

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Something went wrong on the server!' });
});

// Start cleanup scheduler (runs every 15 minutes)
setInterval(cleanupFiles, 15 * 60 * 1000);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
