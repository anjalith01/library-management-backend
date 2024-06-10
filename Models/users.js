const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required:true,
      },
      email: {
        type: String,
        trim: true,
        required:true,
        unique:true,
      },
      password: String,
      joined: { type: Date, default: Date.now() },
      bookIssueInfo: [
        {
          book_info: {
            id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Issue",
            },
          },
        },
      ],
      violationFlag: { type: Boolean, default: false },
      fines: { type: Number, default: 0 },
      isAdmin: { type: Boolean, default: true },
})
module.exports=mongoose.model("user",userSchema)