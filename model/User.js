const mongoose = require("mongoose")
const Schema = mongoose.Schema
// 需要存入数据库的数据
const UserSchema = new Schema ({
    username :{
        type:String,
        required:true
    },
    password :{
        type:String,
        required:true
    },
    mail :{
        type:String,
        required:true
    },
    phone :{
        type:String,
        required:true
    },
    createDate :{
        type:Date,
        default:Date.now
    },
    //头像
    avatar: {
        type: String
    }
})

module.exports = mongoose.model("user",UserSchema)