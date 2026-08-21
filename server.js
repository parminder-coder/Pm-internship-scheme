require('dotenv').config();
const serve = require('./src/app');
const db = require('./src/config/db'); 

async function startServer() {
    const connected = await db();

    if (!connected) {
        process.exit(1);
    }

    serve.listen(3000,() => {
        console.log("Server is running on port 3000");
    });
}

startServer();
