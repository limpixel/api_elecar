require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./firebase/config');

const app = express();
app.use(cors());
app.use(express.json());

// import routes
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const carRoutes = require('./routes/cars');
const chartRoutes = require('./routes/charts');

app.use('/api', authRoutes); // untuk /api/token
app.use('/api', userRoutes); // untuk /api/users, dll
app.use('/api', carRoutes);
app.use('/api', chartRoutes);

app.get('/', (req, res) => {
  res.send('API Elecar dengan token aktif!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
