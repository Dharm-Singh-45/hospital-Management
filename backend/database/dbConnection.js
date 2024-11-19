import mongoose from "mongoose";

export const dbConnection = () =>{
    mongoose.connect(process.env.MONGO_URI,{
        dbName : "HOSPITAL-MANAGEMENT-SYSTEM"
    }).then(()=>console.log('connected to database')).catch((err)=>console.log(`some error while connecting to db ${err}`))
}