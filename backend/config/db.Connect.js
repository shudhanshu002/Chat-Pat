const mongoose = require('mongoose');

const connectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`DB CONNECTED !!`)
    } catch (err){
        console.log('Error connecting with database',err.message)
    }
}

module.exports = connectDB;