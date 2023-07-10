const cors = require('cors')
const accounts = require('./accounts.js')
const mysql = require("mysql2")
const express = require('express');
const app = express();
const dotenv = require("dotenv")
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


const port = 8000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:*', "http://localhost"],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions))

class Tutor {
    constructor(name, rate, educationLevel, description, image, subjects, years) {
        this.name = name
        this.rate = rate
        this.educationLevel = educationLevel
        this.description = description
        this.image = image
        this.subjects = subjects
        this.years = years
    }
}
let tutors = []

tutors.push(new Tutor("John", 20, "Bachelor of Science", "I am a tutor", "https://www.w3schools.com/howto/img_avatar.png", ["Maths", "English"], ["Prep-2", "5-6", "7-8", "9-10", "11-12"]))
tutors.push(new Tutor("Jane", 30, "Bachelor of Arts", "I am a tutor", "https://www.w3schools.com/howto/img_avatar.png", ["Maths", "English"], ["Prep-2", "3-4", "5-6", "7-8", "9-10", "11-12"]))
tutors.push(new Tutor("Jack", 40, "Bachelor of Commerce", "I am a tutor", "https://www.w3schools.com/howto/img_avatar.png", ["Maths", "English"], ["7-8", "9-10", "11-12"]))
tutors.push(new Tutor("Jill", 50, "Bachelor of Engineering", "I am a tutor", "https://www.w3schools.com/howto/img_avatar.png", ["Maths", "English"], ["Prep-2", "3-4", "9-10", "11-12"]))
tutors.push(new Tutor("James", 60, "Bachelor of Science", "I am a tutor", "https://www.w3schools.com/howto/img_avatar.png", ["Maths", "English"], ["Prep-2", "3-4", "5-6", "7-8", "9-10", "11-12"]))
tutors.push(new Tutor("Jenny", 70, "Bachelor of Arts", "I am a tutor", "https://www.w3schools.com/howto/img_avatar.png", ["Maths", "English", "Japanese"], ["Prep-2", "3-4", "5-6", "7-8", "9-10", "11-12"]))
tutors.push(new Tutor("Josh", 80, "Bachelor of Commerce", "I am a tutor", "https://www.w3schools.com/howto/img_avatar.png", ["English", "Japanese"], ["Prep-2", "3-4", "9-10", "11-12"]))
tutors.push(new Tutor("Jade", 90, "Bachelor of Engineering", "I am a tutor", "https://www.w3schools.com/howto/img_avatar.png", ["Maths", "English", "Japanese"], ["5-6", "7-8", "9-10", "11-12"]))


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
            results[i].years = results[i].years.split(",")
            results[i].subjects = results[i].subjects.split(",")
            tempTutors.push(results[i])
        }
        tutors = tempTutors
        console.log(tutors)
    })
}
setInterval(() => {
    updateTutors()
}, 5000);