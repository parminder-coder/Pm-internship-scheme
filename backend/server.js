require('dotenv').config();
const serve = require('./src/app');
const db = require('./src/config/db');

const PORT = process.env.PORT || 3000;

serve.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

db();
