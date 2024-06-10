const express = require('express')
const app = express()
app.use(express.json())
const bcrypt = require('bcrypt')
const User = require('./Models/users')
const Issue = require('./Models/Issue')
const Book = require('./Models/Book')
const Limit = require('./Models/Limit')
const mongoose = require('mongoose')
const dbUrl = "mongodb://0.0.0.0:27017/book-system"
const jwt = require('jsonwebtoken')
const { requiredLogin } = require('./auth/Authentication')
const jwtKey = 'book-mgmt'

mongoose.connect(dbUrl)
    .then(res => {
        app.listen(8000, () => {
            console.log("listening to port 8000")
        })
        console.log("database connected!")
    })
    .catch(d => console.log(data))
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    next();
});
app.post('/register', async (req, res) => {
    const user = await User.find({ email: req.body.email })
    console.log("user........", user)
    console.log(req.body)
    const { name, email, pass, confirmPass } = req.body
    if (user.length > 0) {
        res.status(400).send({ message: "user found with this mail Id" })
    }
    else {
        if (pass != confirmPass) {
            res.status(400).send({ message: "Password and confirm password does not match!" })
        }
        else {
            const hash_pass = await bcrypt.hash(pass, 10)
            const userData = new User({
                isAdmin: false,
                name: name,
                email: email,
                password: hash_pass
            })
            userData.save().
                then((result) => {

                    res.send({ result, msg: "User registered successfully" })

                })
                .catch((err) => console.log(err))
        }


    }
}

)

app.post('/login', async (req, res) => {
    const { email, pass, isAdmin } = req.body
    const user = await User.findOne({ email })
    console.log(user)
    if (!user) {
        res.status(400).send({ msg: "user not found" })
    }
    else {
        const isMatch = await bcrypt.compare(pass, user.password)
        console.log(isMatch)
        if (isMatch) {

            jwt.sign({ user }, jwtKey, { expiresIn: '1h' }, (err, token) => {
                if (err) {
                    console.log(err)
                }
                res.send({ user: user, msg: "user logged in successfully", token: token })
            })
        }
        else {
            res.status(400).send("email or password is incorrect")
        }
    }
})

app.post('/add-new-book', requiredLogin, async (req, res) => {
    console.log(req.body)
    const { title, author, category, stock, description, _id } = req.body
    const user = await User.findById(_id)
    if (!user) {
        res.status(400).send({ msg: 'unauthorized user' })
    }
    else {
        const isDuplicate = await Book.find({ title: title, author: author, category: category });
        console.log("duplicate>>>>>>", isDuplicate)
        if (isDuplicate.length > 0) {
            res.status(400).send({ msg: "This book is already registered in inventory" });
        }
        else {
            const newBook = await new Book({ title, author, category, stock, description })
            newBook.save()
                .then((result) => {
                    res.send({ result, msg: 'book created successfully' })
                })
                .catch((e) => { console.log(e) })
        }
    }
})

app.post('/book-list', requiredLogin, async (req, res) => {
    const user = await User.findById(req.body.id)
    if (!user) {
        res.status(400).send({ msg: "Unautharised user !" });
    }
    else {
        await Book.find().then(
            (result) => {
                res.send({ result, msg: 'book list fetched successfully' })
            }
        ).catch(
            (err) => {
                console.log(err)
            }
        )

    }
})

app.post('/book/:id', requiredLogin, async (req, res) => {
    const { _id } = req.body
    const user = await User.findById(_id)
    console.log(user)
    if (!user) {
        res.status(400).send({ msg: "Unauthorised user !" })
    }
    else {
        if (user.isAdmin) {
            await Book.findById({ _id: req.params.id })
                .then((result) => {
                    console.log(result)
                    res.send({ result: result })
                })
                .catch((e) => {
                    console.log(e)
                })
        }
    }
})
app.post('/update-book/:id', requiredLogin, async (req, res) => {
    const { title, author, category, stock, description, _id } = req.body
    const user = await User.findById(_id)
    console.log(user)
    if (!user) {
        res.status(400).send({ msg: "Unauthorised user !" })
    }
    else {
        const isDuplicate = await Book.find({ title: title, author: author, category: category });
        console.log("duplicate>>>>>>", isDuplicate)
        if (isDuplicate.length > 0) {
            res.status(400).send({ msg: "This book is already registered in inventory" });
        }
        else {
            if (user.isAdmin) {
                await Book.updateOne({ _id: req.params.id }, { $set: { title, author, category, stock, description } })
                    .then((result) => {
                        res.send({ result: result, msg: 'book updated successfully' })
                    })
                    .catch((e) => console.log(e))
            }

        }
    }
})

app.post('/delete-book/:id', requiredLogin, async (req, res) => {
    console.log("req::::::::::::::::", req.body)
    const user = await User.findById({ _id: req.body._id })
    if (!user) {
        res.status(400).send({ msg: "Unauthorised user !" })
    }
    else {
        if (user.isAdmin) {
            await Book.deleteOne({ _id: req.params.id })
                .then(() => {
                    res.send({ msg: 'book deleted successfully' })
                })
                .catch(e => console.log(e))
        }
        else {
            res.status(400).send({ msg: "Only admin can delete user !" });
        }
    }
})

app.post('/user-list', requiredLogin, async (req, res) => {
    const user = await User.findById(req.body._id)
    if (!user) {
        res.status(400).send({ msg: "Unauthorised user !" })
    }
    else {
        if (user.isAdmin) {
            await User.find({ isAdmin: false })
                .then((result) => res.send({ result, msg: 'Users list fetched successfully' }))
                .catch(e => console.log(e))
        }
        else {
            res.status(400).send({ msg: "Only admin can delete user !" });
        }
    }
})

app.post('/user/:id', requiredLogin, async (req, res) => {
    const user = await User.findById(req.body._id)
    if (!user) {
        res.status(400).send({ msg: "Unauthorised user !" })
    }
    else {
        if (user.isAdmin) {
            User.findById({ _id: req.params.id })
                .then((result => {
                    res.send({ result, msg: 'user fetched successfully' })
                }))
                .catch((e) => console.log(e))
        }
        else {
            res.status(400).send({ msg: "Only admin can update user !" });
        }
    }
})

app.post('/update-user/:id', requiredLogin, async (req, res) => {
    const user = await User.findById(req.body._id)
    if (!user) {
        res.status(400).send({ msg: "Unauthorised user !" })
    }
    else {
        if (user.isAdmin) {
            await User.updateOne({ _id: req.params.id }, { $set: { name: req.body.name, email: req.body.email } })
                .then(async () => {
                    const updateUser = await User.findById(req.params.id)
                    console.log("user::::::::", updateUser)
                    if (updateUser) {
                        res.send({ result: updateUser, msg: 'user updated successfully' })
                    }
                })
                .catch(e => console.log(e))
        }
        else {
            res.status(400).send({ msg: "Only admin can update user !" });
        }
    }
})

app.post('/delete/:id', requiredLogin, async (req, res) => {
    const user = await User.findById(req.body._id)
    if (!user) {
        res.status(400).send({ msg: "Unauthorised user !" })
    }
    else {
        if (user.isAdmin) {
            await User.deleteOne({ _id: req.params.id })
                .then(() => {
                    res.send({ msg: 'user deleted successfully' })
                })
                .catch(e => console.log(e))
        }
        else {
            res.status(400).send({ msg: "Only admin can delete user !" });
        }
    }
})

app.post('/add-limit-per-user', requiredLogin, async (req, res) => {
    const user = await User.findById(req.body._id)
    if (!user) {
        res.status(400).send({ msg: "Unauthorised user !" })
    }
    else {
        if (user.isAdmin) {
            const isLimit = await Limit.find()
            console.log(isLimit)
            if (isLimit.length == 0) {
                const newLimit = await Limit({ number: req.body.number })
                newLimit.save()
                    .then(() => {
                        res.send({ msg: "updated successfully" })
                    })
                    .catch(e => console.log(e))
            }
            else {
                await Limit.updateOne({ _id: isLimit[0]._id }, { $set: { number: req.body.number } })
                    .then(() => {
                        res.send({ msg: "updated successfully" })
                    })
                    .catch(e => console.log(e))
            }
        }
        else {
            res.status(400).send({ msg: "Only admin can set limit !" });
        }
    }
})

app.post('/get-limit', requiredLogin, async (req, res) => {
    const user = await User.findById(req.body._id)
    if (!user) {
        res.status(400).send({ msg: "Unauthorised user !" })
    }
    else {
        if (user.isAdmin) {
            await Limit.find()
                .then((result) => {
                    res.send({ result, msg: "fetched successfully" })
                })
                .catch(e => console.log(e))
        }
        else {
            res.status(400).send({ msg: "Only admin can set limit !" });
        }
    }
})

app.post('/admin-list', requiredLogin, async (req, res) => {
    const user = await User.findById(req.body._id)
    if (!user) {
        res.status(400).send({ msg: "Unauthorised user !" })
    }
    else {
        if (user.isAdmin) {
            await User.find({ isAdmin: true })
                .then((result) => {
                    res.send({ result, msg: "fetched successfully" })
                })
                .catch(e => console.log(e))
        }
        else {
            res.status(400).send({ msg: "Only admin can set limit !" });
        }
    }
})

app.post('/add-user', requiredLogin, async (req, res) => {
    const user = await User.find({ email: req.body.email })
    console.log("user........", user)
    console.log(req.body)
    const { name, email, pass, confirmPass, isAdmin } = req.body
    if (user.length > 0) {
        res.status(400).send({ message: "user found with this mail Id" })
    }
    else {

        if (pass != confirmPass) {
            res.status(400).send({ message: "Password and confirm password does not match!" })
        }
        else {
            const hash_pass = await bcrypt.hash(pass, 10)
            const userData = new User({
                isAdmin: isAdmin,
                name: name,
                email: email,
                password: hash_pass
            })
            userData.save().
                then((result) => {

                    res.send({ result, msg: "User registered successfully" })

                })
                .catch((err) => console.log(err))
        }
    }
}
)

app.post('/dashboard-count', requiredLogin, async (req, res) => {
    const user = await User.findById(req.body._id)
    console.log(user)
    if (user) {
        if (user.isAdmin) {
            const bookCount = await Book.find().countDocuments()
            const adminCount = await User.find({ isAdmin: true }).countDocuments()
            const userCount = await User.find({ isAdmin: false }).countDocuments()
            let limitOfBookPerUser = ''
            await Limit.find()
                .then((result) => {
                    console.log("result>>>>>>", limitOfBookPerUser)
                    limitOfBookPerUser = result[0].number
                })
            res.send({ bookCount, adminCount, userCount, limitOfBookPerUser })
        }
        else {
            res.status(400).send({ msg: "Only admin can get dashboard count !" });
        }
    }
})

app.post('/issue-book/:book_id', requiredLogin, async (req, res) => {
    const user = await User.findById(req.body._id)
    console.log("user:::::::::", user)
    if (user.violationFlag) {
        res.status(400).send({ msg: "You are flagged for violating rules/delay on returning books/paying fines. Untill the flag is lifted, You can't issue any books" });
    }
      const bookLimit = await Limit.find()
      console.log("issue info::::::::", user.bookIssueInfo)
    if (user.bookIssueInfo.length > bookLimit[0].number) {
        res.status(400).send({ msg: `You can't issue more than ${bookLimit[0].number} books at a time` });
    }

    for (let bookId of user.bookIssueInfo) {
       
        if (bookId.id == req.params.book_id) {
            console.log("bookid:::::::::", bookId.id)
            // console.log("params:::::::",req.params.book_id)
            res.statusCode=400
            await res.send({ msg: "You already have this book in your issued book !!" });
            break;
        }
    }

    const book = await Book.findById(req.params.book_id)
    if (book.stock == 0) {
        res.status(400).send({ msg: "This book is out of stock !!" });
    }
    book.stock -= 1;
    const issue = new Issue({
        book_info: {
            id: book._id,
            title: book.title,
            author: book.author,
            category: book.category,
            stock: book.stock,
        },
        user_id: {
            id: user._id,
            email: user.email,
        }
    })
    user.bookIssueInfo.push(book._id)
    await book.save()
    await issue.save()
    await user.save()
    .then(async(r)=>await res.send({ msg: 'book issued successfully' }))
    .catch(async()=>await res.send({msg:'something went wrong'}))
     
})

app.post('/get-issued-book', requiredLogin, async (req, res) => {
    const user = await User.findById(req.body._id)
    console.log(user)
    if (!user) {
        res.status(400).send("Unauthorized user !")
    }
    else {
        const searchObj = {
            "user_id.id": req.body._id,
        }
        const issued = await Issue.find(searchObj)

        console.log("issued::::::::", issued)
        for (let issue of issued) {
            if (issue.book_info.returnDate < Date.now()) {
                user.violationFlag = true;
                const diffTime = Math.abs(Date.now() - issue.book_info.returnDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                user.fines = diffDays * 2;
                user.save();
                break;
            }
        }
        //console.log(await issue,req.user._id)
        res.send({ msg: 'books fetched successfully', "books": issued, "user": user })

    }
})

app.post('/get-fined-users', requiredLogin, async (req, res) => {
    const user = await User.findById(req.body._id)
    if (!user) {
        res.status(400).send("Unauthorized user !")
    }
    else {
        const users = await User.find({ isAdmin: false, violationFlag: false })
        for (let bookUser of users) {
            let searchObj = {
                "user_id.id": bookUser._id
            }
            const issues = await Issue.find(searchObj)
            console.log("ISsues::::::::", issues)
            for (let issue of issues) {
                if (issue.book_info.returnDate < Date.now()) {
                    bookUser.violationFlag = true
                    const diffTime = Math.abs(Date.now() - issue.book_info.returnDate);
                    console.log("diffTime:::::::::", diffTime)
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    console.log("diffDays:::::::::::", diffDays)
                    bookUser.fines = diffDays * 2;
                    bookUser.save();

                }
            }
        }
        const finedUsers = await User.find({ violationFlag: true })
        res.send({ msg: 'list fetchd successfully', fined_users: finedUsers })
    }
})

app.post('/remove-fined-user/:id', requiredLogin, async (req, res) => {
    const user = await User.findById(req.body._id)
    if (!user) {
        res.status(400).send("Unauthorized user !")
    }
    else {
        if (user.isAdmin) {
            const finedUser = await User.findById(req.params.id)
            const searchObj = {
                "user_id.id": req.params.id
            }
            const issues = await Issue.find(searchObj)
            console.log("issueeeeeeeee", issues)
            for (let issue of issues) {
                if (issue.book_info.returnDate < Date.now()) {

                    const book_id = issue.book_info.id
                    const bookIndex = await finedUser.bookIssueInfo.indexOf(book_id)
                    const book = await Book.findById(book_id)
                    book.stock = book.stock + 1
                    await book.save()
                        .then((result) => {
                            console.log("result11::::::::::::", result)
                            //res.status(400).send("something went wrong")
                        })
                        .catch((e) => console.log(e))
                    await Issue.find().deleteOne({ _id: issue._id })
                        .then((result) => {
                            console.log("result22::::::::::::", result)
                            //res.status(400).send("something went wrong")
                        })
                        .catch((e) => console.log(e))
                    await issue.save()
                        .then((result) => {
                            console.log("result333::::::::::::", result)
                            //res.status(400).send("something went wrong")
                        })
                        .catch((e) => console.log(e))
                    finedUser.violationFlag = false
                    finedUser.fines = 0
                    await finedUser.bookIssueInfo.splice(bookIndex, 1)
                    await finedUser.save()
                        .then((result) => {
                            console.log("result44::::::::::::", result)
                            //res.status(400).send("something went wrong")
                        })
                        .catch((e) => console.log(e))
                }
            }
            res.send({ msg: 'removed successfully' })
        }
        else {
            res.status(400).send("Only admin can remove fined users !")
        }
    }
})

app.post('/renew-book/:book_id', requiredLogin, async (req, res) => {
    const user = await User.findById(req.body._id)
    if (!user) {
        res.status(400).send({ msg: 'Unauthorized user !' })
    }
    else {
        if (user.violationFlag) {
            res.status(400).send({ msg: "You are flagged for violating rules/delay on returning books/paying fines. Untill the flag is lifted, You can't renew any books" });
        }

        else {
            await Issue.updateOne({
                "book_info.id": req.params.book_id,
                "user_id.id": user._id,
            }, {
                $set:
                {
                    "book_info.issueDate": Date.now(),
                    "book_info.returnDate": Date.now() + 7 * 24 * 60 * 60 * 1000,
                    "book_info.isRenewed": true
                }
            }).then((result) => {
                console.log("result:::::::", result)
                if (result.acknowledged) {
                    res.send({ msg: 'book renewed successfully' })
                }
                else {
                    res.send({ msg: 'something went wrong' })
                }
            })
                .catch((e) => console.log(e))

        }
    }
})

app.post('/return-book/:book_id', requiredLogin, async (req, res) => {
    const user = await User.findById(req.body._id)
    if (!user) {
        res.status(400).send({ msg: 'Unauthorized user !' })
    }
    else {

        const book = await Book.findById(req.params.book_id)
        book.stock = book.stock + 1
        await book.save()
        await Issue.deleteOne({ "book_info.id": book._id, 'user_id.id': user._id })
        const book_index = user.bookIssueInfo.indexOf(req.params.book_id)
        user.bookIssueInfo.splice(book_index, 1)
        await user.save()
        await res.send({ msg: 'book return successfully' })
    }
})

app.post('/user-home', requiredLogin, async (req, res) => {

    const user = await User.findById(req.body.user._id)
    console.log(user)
    if (!user) {
        res.status(400).send({ msg: 'Unauthorized user !' })
    }
    else {
        const book_count = await Book.find()
        const topFiveBooks = book_count.slice(book_count.length - 5, book_count.length)
        console.log("boooooook", book_count.slice(book_count.length - 5, book_count.length))
        const limit = await Limit.find()
        const issues = await Issue.find()
        for (let issue of issues) {
            if (issue.book_info.returnDate < Date.now()) {
                user.violatonFlag = true;
                const diffTime = Math.abs(Date.now() - issue.book_info.returnDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                user.fines = diffDays * 2;
                user.save();
                break;
            }
        }
        res.send({ msg: 'home', books: topFiveBooks, limitOfBooksPerUser: limit[0], user: user })
    }

})