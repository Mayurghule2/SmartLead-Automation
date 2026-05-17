require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const leadRoutes = require('./routes/leadRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
    })
    .catch((error) => {
        console.error('❌ MongoDB Error:', error.message);
        process.exit(1); // Exit if database connection fails
    });

// Routes
app.use('/api/leads', leadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});