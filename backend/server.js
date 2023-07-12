const cors = require('cors')
const accounts = require('./accounts.js')
const mysql = require("mysql2")
const express = require('express')
const app = express()
const dotenv = require("dotenv")
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')
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
app.use(bodyParser.json())
app.use(express.static('public'))

let tutors = []

app.get('/api/search', (req, res) => {
    let selectedYear = req.query.selectedYear
    let selectedSubject = req.query.selectedSubject
    let validTutors = []
    for(let i = 0; i < tutors.length; i++){
        let validYear = false
        let validSubject = false
        for(let j = 0; j < tutors[i].years.length; j++){
            if(tutors[i].years[j] === selectedYear){
                validYear = true
                break
            }
        }
        for(let j = 0; j < tutors[i].subjects.length; j++){
            if(tutors[i].subjects[j] === selectedSubject){
                validSubject = true
                break
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

const tutorsQuery = `
SELECT tutors.id, tutors.name, tutors.description, tutors.cost, tutors.educationLevel, GROUP_CONCAT(DISTINCT tutorsYears.year SEPARATOR ',') as years, GROUP_CONCAT(DISTINCT tutorsSubjects.subject SEPARATOR ',') AS subjects
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
            results[i].years = results[i].years.split(",")
            results[i].subjects = results[i].subjects.split(",")
            
            tempTutors.push(results[i])
        }
        tutors = tempTutors
    })
}

//automatically update tutors every 5 seconds
setInterval(() => {
    updateTutors()
}, 5000);