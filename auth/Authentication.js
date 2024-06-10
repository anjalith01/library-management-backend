const jwt = require('jsonwebtoken')
const jwtKey = 'book-mgmt'
exports.requiredLogin = (req, res, next) => {

    if (req.headers['authorization']) {

        const token = req.headers['authorization'].split(' ')[1]
        jwt.verify(token, jwtKey, (err, valid) => {

            if (err) {
                console.log("err:", err)
                res.status(400).send({ msg: 'Please enter valid token' })
            }
            else {
                if (!valid) {
                    res.send({ msg: 'session expired' })
                    next()
                }
                else {

                    next()
                }
            }
        })
    }
    else {
        console.log("err:::::::::")
        res.status(400).send({ msg: 'Please enter valid token' })
    }

}