require('dotenv').config();
const serve = require('./src/app');
const db = require('./src/config/db'); 
db(); 
serve.listen(3000,() => {
    console.log("Server is running on port 3000");
})
