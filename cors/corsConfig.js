const cors = require('cors');
const allowedOrigins = [process.env.CLIENT_URL]
const corsConfig = {
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders:["Access-Control-Allow-Origin", "Content-Type","Authorization","Set-Cookie"]
}

module.exports = cors(corsConfig);