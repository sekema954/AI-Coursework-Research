// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet'); 
const os = require('os');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3200;

app.use(
  helmet({
  contentSecurityPolicy: false
  })
);

// CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3200", "https://researcherz.com"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("/*splat", cors());

// JSON parser
app.use(express.json());

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));


app.get('/health', (req, res) => {
  const uptimeSeconds = process.uptime(); 
  const memoryUsage = process.memoryUsage(); // bytes
  const loadAvg = os.loadavg(); // 1,5,15 min averages
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const usedMem = totalMem - freeMem;

  // Convert seconds to HH:MM:SS
  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  // Convert bytes to human-readable
  const formatBytes = (bytes) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  res.json({
    status: 'OK',
    uptime: formatUptime(uptimeSeconds),
    memory: {
      rss: formatBytes(memoryUsage.rss),
      heapTotal: formatBytes(memoryUsage.heapTotal),
      heapUsed: formatBytes(memoryUsage.heapUsed),
      external: formatBytes(memoryUsage.external),
      totalMem: formatBytes(totalMem),
      usedMem: formatBytes(usedMem),
      freeMem: formatBytes(freeMem),
    },
    loadAvg: loadAvg.map((n) => n.toFixed(2)), // optional rounding
    timestamp: new Date().toISOString()
  });
});

app.use(express.static(path.join(__dirname, '..', 'dist')));
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

const readData = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath));
};
const writeData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`check server health at http://localhost:${PORT}/health`)
});