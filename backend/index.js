const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db.Connect.js');
const bodyParser = require('body-parser');
const authRoute = require('./routes/authRoute.route.js');
const chatRoute = require('./routes/chatRoute.js')
const statusRoute = require('./routes/statusRoute.js')
const http = require('http')
const initializeSocket = require('./services/socketService.js')

dotenv.config();

const PORT = process.env.PORT;
const app = express();

const corsOption = {
    origin: process.env.FRONTEND_URL,
    credentials: true
}

// Apply CORS before routes
app.use(cors(corsOption));

//Middlewares
app.use(express.json());
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}));


//db
connectDB()


//server
const server = http.createServer(app)

const io = initializeSocket(server)


//apply socket middleware before routes
app.use((req,res,next) => {
    req.io = io;
    req.socketUserMap = io.socketUserMap
    next();
})

//routes
app.use('/api/auth',authRoute);
app.use('/api/chats',chatRoute);
app.use('/api/status', statusRoute)

server.listen(PORT, ()=> {
    console.log(`server running on this port ${PORT}`);
})