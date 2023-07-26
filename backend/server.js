const cors = require('cors')
const accounts = require('./accounts.js')
const mysql = require("mysql2")
const express = require('express')
const app = express()
const dotenv = require("dotenv")
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')
const fs = require('fs');
const multer = require('multer');

const upload = multer({ dest: 'public/profilepictures' });

dotenv.config()

const dbConfig = {
    host: "db",
    port: 3306,
    user: "root",
    password: process.env.MYSQL_PASSWORD,
    database: "tutorapp",
  };
let dbConnection
function ConnectToDB(){
  console.log("Connecting To DB")
  dbConnection = mysql.createConnection(dbConfig)
  dbConnection.on('error', function onError(err) {
    console.log('db error', err);
    setTimeout(ConnectToDB, 1000) 
  });
  dbConnection.connect((error) => {
    if(!error){
      console.log("Connected To DB Successfully")
    }
  })
}
ConnectToDB()

//starting up server on port given
const port = 8000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

//cors allows us to make requests from the frontend to the backend (needed as they are served on different ports) otherwise web browsers block the request
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:*', "http://localhost"],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.static('public'))

let tutors = []

app.get('/api/search', (req, res) => {
    let selectedYear = req.query.selectedYear
    let selectedSubject = req.query.selectedSubject
    let validTutors = []
    for(let i = 0; i < tutors.length; i++){
        let validYear = false
        let validSubject = false
        if(tutors[i].years){
            for(let j = 0; j < tutors[i].years.length; j++){
                if(tutors[i].years[j] === selectedYear){
                    validYear = true
                    break
                }
            }
        }
        if(tutors[i].subjects){
            for(let j = 0; j < tutors[i].subjects.length; j++){
                if(tutors[i].subjects[j] === selectedSubject){
                    validSubject = true
                    break
                }
            }
        }
        if(validYear && validSubject){
            validTutors.push(tutors[i])
        }
    }
    res.send({validTutors})
})
app.post("/login", (req, res) => {
    let username = req.body.username
    let password = req.body.password
    dbConnection.query(`SELECT * FROM tutors WHERE username = '${username}' AND password = '${password}'`, (error, results) => {
        if(error){
            console.log(error)
            res.json({success: false, message: "Server Error"})
            return
        }
        if(results.length == 0){
            console.log("no results")
            res.json({success: false, message: "Invalid username or password"})
            return
        }
        console.log("success")
        let token = jwt.sign({username}, process.env.ACCESS_TOKEN_SECRET)
        res.json({success: true, token})
    })
    //let response = accounts.login(dbConnection, username, password)
    //res.send(response)
})
app.post("/register", (req, res) => {
    let username = req.body.username
    let password = req.body.password

    dbConnection.query(`SELECT * FROM tutors WHERE username = '${username}'`, (error, results) => {
        if(error){
            console.log(error)
            res.json({success: false, message: "Server Error"})
            return
        }
        if(results.length > 0){
            console.log("username taken")
            res.json({success: false, message: "Username taken"})
            return
        }
        dbConnection.query(`INSERT INTO tutors (username, password, name, description, educationLevel, cost) VALUES ('${username}', '${password}', '${username}', 'Hi my name is ${username} and I am a tutor!', '', 0)`, (error, results) => {

            if(error){
                console.log(error)
                res.json({success: false, message: "Server Error"})
                return
            }
            console.log("success")
            dbConnection.query(`SELECT * FROM tutors WHERE username = '${username}'`, (error, results) => {
                if(error){
                    console.log(error)
                    res.json({success: false, message: "Server Error"})
                    return
                }
                if(results.length == 0){
                    console.log("no results")
                    res.json({success: false, message: "Server Error"})
                    return
                }
                let tutorId = results[0].id
                try {
                    //grab the base profile picture at profilepictures/0.png and copy it to the new tutor's profile picture
                    fs.copyFile('public/profilepictures/0.png', `public/profilepictures/${tutorId}.png`, (err) => {
                        if (err) throw err;
                        console.log('source.txt was copied to destination.txt');
                    });
                    let token = jwt.sign({username}, process.env.ACCESS_TOKEN_SECRET)
                    res.json({success: true, token})
                }
                catch(err) {
                    console.log(err)
                    let token = jwt.sign({username}, process.env.ACCESS_TOKEN_SECRET)
                    res.json({success: true, token})
                }
            })
        })
    })
})
app.post("/editProfile", (req, res) => {
    let token = req.body.token
    let name = req.body.name
    let description = req.body.description
    let cost = req.body.cost
    //let educationLevel = req.body.educationLevel
    let years = req.body.years
    let subjects = req.body.subjects
    let imageBase64 = req.body.image
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err){
          res.json({success: false, message: "Invalid token"})
          return
        }
        let username = user.username
        dbConnection.query(`SELECT * FROM tutors WHERE username = '${username}'`, (error, results) => {
            if(error){
                console.log(error)
                res.json({success: false, message: "Server Error"})
                return
            }
            if(results.length == 0){
                console.log("no results")
                res.json({success: false, message: "Invalid token"})
                return
            }
            
            let tutorId = results[0].id
            try {
                fs.writeFile(`public/profilepictures/${tutorId}.png`, imageBase64, 'base64', function(err) {
                    console.log(err);
                });
            }
            catch(err) {
                console.log(err)
            }
            dbConnection.query(`UPDATE tutors SET name = '${name}', description = '${description}', cost = ${cost} WHERE id = '${tutorId}'`, (error, results) => {
                if (error){
                    console.log(error)
                    res.json({success: false, message: "Server Error"})
                    return
                }
                dbConnection.query(`DELETE FROM tutorsYears WHERE tutorId = '${tutorId}'`, (error, results) => {
                    if (error){
                        console.log(error)
                        res.json({success: false, message: "Server Error"})
                        return
                    }
                    console.log(years)
                    for(let i = 0; i < years.length; i++){
                        dbConnection.query(`INSERT INTO tutorsYears (tutorId, year) VALUES ('${tutorId}', '${years[i]}')`, (error, results) => {
                            if (error){
                                console.log(error)
                                res.json({success: false, message: "Server Error"})
                                return
                            }
                        })
                    }
                })
                dbConnection.query(`DELETE FROM tutorsSubjects WHERE tutorId = '${tutorId}'`, (error, results) => {
                    if (error){
                        console.log(error)
                        res.json({success: false, message: "Server Error"})
                        return
                    }
                    for(let i = 0; i < subjects.length; i++){
                        dbConnection.query(`INSERT INTO tutorsSubjects (tutorId, subject) VALUES ('${tutorId}', '${subjects[i]}')`, (error, results) => {
                            if (error){
                                console.log(error)
                                res.json({success: false, message: "Server Error"})
                                return
                            }
                        })
                    }
                })
                res.json({success: true, message: "Profile updated"})
                return
            })
        })
    })
})
app.get("/api/getProfileData/:username", (req, res) => {
    let username = req.params.username
    dbConnection.query(`SELECT * FROM tutors WHERE username = '${username}'`, (error, results) => {
        if(error){
            console.log(error)
            res.json({success: false, message: "Server Error"})
            return
        }
        if(results.length == 0){
            console.log("no results")
            res.json({success: false, message: "Invalid username"})
            return
        }
        let tutorId = results[0].id
        let name = results[0].name
        let description = results[0].description
        let cost = results[0].cost
        let educationLevel = results[0].educationLevel

        dbConnection.query(`SELECT * FROM tutorsYears WHERE tutorId = '${tutorId}'`, (error, results) => {
            if(error){
                console.log(error)
                res.json({success: false, message: "Server Error"})
                return
            }
            let years = []
            for(let i = 0; i < results.length; i++){
                years.push(results[i].year)
            }
            dbConnection.query(`SELECT * FROM tutorsSubjects WHERE tutorId = '${tutorId}'`, (error, results) => {
                if(error){
                    console.log(error)
                    res.json({success: false, message: "Server Error"})
                    return
                }
                let subjects = []
                for(let i = 0; i < results.length; i++){
                    subjects.push(results[i].subject)
                }
                res.json({success: true, imageUrl: `http://localhost:8000/profilepictures/${tutorId}.png`, name, description, cost, educationLevel, years, subjects})
            })
        })
    })
})

const tutorsQuery = `
SELECT tutors.id, tutors.username, tutors.name, tutors.description, tutors.cost, tutors.educationLevel, GROUP_CONCAT(DISTINCT tutorsYears.year SEPARATOR ',') as years, GROUP_CONCAT(DISTINCT tutorsSubjects.subject SEPARATOR ',') AS subjects
FROM tutors
LEFT JOIN tutorsSubjects ON tutors.id = tutorsSubjects.tutorId
LEFT JOIN tutorsYears ON tutors.id = tutorsYears.tutorId
GROUP BY tutors.id, tutors.name;
`
function updateTutors(){
    //Creating temporary tutor array to avoid tutor array being empty while query happens, causing other queries to think no one is signed up
    let tempTutors = []
    dbConnection.query(tutorsQuery, (error, results) => {
        if(error){
            console.log(error)
            return
        }
        for(let i = 0; i < results.length; i++){
            //query returns the years and subjects as a string separated by commas, so we split them into arrays
            if(results[i].years){
                results[i].years = results[i].years.split(",")
            }
            if(results[i].subjects){
                results[i].subjects = results[i].subjects.split(",")
            }
            tempTutors.push(results[i])
        }
        tutors = tempTutors
    })
}

//automatically update tutors every 5 seconds
setInterval(() => {
    updateTutors()
}, 5000);