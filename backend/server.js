//backend library imports
const cors = require('cors')
const mysql = require("mysql2")
const express = require('express')
const app = express()
const dotenv = require("dotenv")
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')
const fs = require('fs');

//dotenv allows us to use environment variables not too useful in this project but good to have if ever became production project and needed to hide sensitive information
dotenv.config()

//dbconfig is the configuration for the mysql database allowing us to be verified and connect to it
const dbConfig = {
    host: "db",
    port: 3306,
    user: "root",
    password: process.env.MYSQL_PASSWORD,
    database: "tutorapp",
  };
//key variable dbConnection is used to query the database
let dbConnection

//function to connect to database and handle reconnecting if connection is lost, sets the dbConnection variable and uses the dbConfig variable to connect
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

//starting up the server on port 8000 to listen to http requests
const port = 8000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

//cors allows us to make requests from the frontend to the backend (needed as they are served on different ports) otherwise web browsers block the request
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:*', "http://localhost"],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

//different middleware used to parse the requests and serve static files
app.use(cors(corsOptions))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.static('public'))

//tutors array gets updated automatically and is used to store all the tutors in the database to be sent to the frontend upon request
let tutors = []

//search route called from frontend to search for tutors based on selected year and subject
app.get('/api/search', (req, res) => {
    //gather sent information from request
    let selectedYear = req.query.selectedYear
    let selectedSubject = req.query.selectedSubject
    //create array to store valid tutors
    let validTutors = []
    //linear search over all tutors and insert into validTutors if they fit frontends filter inputs
    for(let i = 0; i < tutors.length; i++){
        let validYear = false
        let validSubject = false
        //linear search over years tutored of tutor to see if they match the selected year
        if(tutors[i].years){
            for(let j = 0; j < tutors[i].years.length; j++){
                if(tutors[i].years[j] === selectedYear){
                    validYear = true
                    break
                }
            }
        }
        //linear search over subjects tutored of tutor to see if they match the selected subject
        if(tutors[i].subjects){
            for(let j = 0; j < tutors[i].subjects.length; j++){
                if(tutors[i].subjects[j] === selectedSubject){
                    validSubject = true
                    break
                }
            }
        }
        //if tutor matches both selected year and subject then they pass all filters and are added to validTutors
        if(validYear && validSubject){
            validTutors.push(tutors[i])
        }
    }
    //send validTutors back to frontend
    res.send({validTutors})
})
//login route called from frontend to attempt to log in to account as tutor
app.post("/login", (req, res) => {
    //gather sent information from request
    let username = req.body.username
    let password = req.body.password
    //query database to see if tutor with username and password exists
    dbConnection.query(`SELECT * FROM tutors WHERE username = '${username}' AND password = '${password}'`, (error, results) => {
        //check for errors/invalid username or password
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
        //if tutor exists then create a token for them to be used to access the account as they are verified
        let token = jwt.sign({username}, process.env.ACCESS_TOKEN_SECRET)
        res.json({success: true, token})
    })
})
app.post("/register", (req, res) => {
    //gather sent information from request
    let username = req.body.username
    let password = req.body.password

    //query database to see if tutor with username already exists
    dbConnection.query(`SELECT * FROM tutors WHERE username = '${username}'`, (error, results) => {
        //check for errors/invalid username or password
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
        //if tutor does not exist then create a new tutor with the username and password given by frontend
        dbConnection.query(`INSERT INTO tutors (username, password, name, description, cost, contactInformation) VALUES ('${username}', '${password}', '${username}', 'Hi my name is ${username} and I am a tutor!', 0, '')`, (error, results) => {

            if(error){
                console.log(error)
                res.json({success: false, message: "Server Error"})
                return
            }
            //if tutor is created successfully then we need to grab their id and create a token for them to be used to access the account and give them a default profile picture
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
                /*
                We now know the new tutors id and can use it to upload a profile picture for them
                copying default profile picture to new tutor's profile picture at the given id
                'public/profilepictures/0.png' contains the default profile picture that needs to be copied
                */
                try {
                    //grab the default profile picture at profilepictures/0.png and copy it to the new tutor's id png file
                    fs.copyFile('public/profilepictures/0.png', `public/profilepictures/${tutorId}.png`, (err) => {
                        if (err) throw err;
                        console.log('source.txt was copied to destination.txt');
                    });
                    //create a token for the new tutor to be used to access the account as they are verified as they just registered
                    let token = jwt.sign({username}, process.env.ACCESS_TOKEN_SECRET)
                    res.json({success: true, token})
                }
                catch(err) {
                    //any errors create an access token anyway as they were already verified earlier
                    let token = jwt.sign({username}, process.env.ACCESS_TOKEN_SECRET)
                    res.json({success: true, token})
                }
            })
        })
    })
})
//route called from frontend to submit a tutors new updated profile
app.post("/editProfile", (req, res) => {
    //gather sent information from request
    let token = req.body.token
    let name = req.body.name
    let description = req.body.description
    let cost = req.body.cost
    let years = req.body.years
    let subjects = req.body.subjects
    let imageBase64 = req.body.image
    let contactInformation = req.body.contactInformation

    //verify token to make sure user is logged in and has a valid token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err){
          res.json({success: false, message: "Invalid token"})
          return
        }
        let username = user.username
        //once verified we need to grab the tutor's id from the database for updating their profile
        dbConnection.query(`SELECT * FROM tutors WHERE username = '${username}'`, (error, results) => {
            if(error){
                console.log(error)
                res.json({success: false, message: "Error saving your profile, database error"})
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
            //set basic information for tutor, strings, and ints more complex data types are handled later
            dbConnection.query(`UPDATE tutors SET name = '${name}', description = '${description}', cost = ${cost}, contactInformation = '${contactInformation}' WHERE id = '${tutorId}'`, (error, results) => {
                if (error){
                    console.log(error)
                    res.json({success: false, message: "Error changing Profile, check you name, description, cost and contact information field. Ensure no special characters are used in these fields."})
                    return
                }
                //update years for tutor by first deleting all years for tutor and then adding the new years after
                dbConnection.query(`DELETE FROM tutorsYears WHERE tutorId = '${tutorId}'`, (error, results) => {
                    if (error){
                        console.log(error)
                        res.json({success: false, message: "Error Changing Profile, check your years selected field"})
                        return
                    }
                    for(let i = 0; i < years.length; i++){
                        dbConnection.query(`INSERT INTO tutorsYears (tutorId, year) VALUES ('${tutorId}', '${years[i]}')`, (error, results) => {
                            if (error){
                                console.log(error)
                                res.json({success: false, message: "Error Changing Profile, check your years selected field"})
                                return
                            }
                        })
                    }
                })
                //update subjects for tutor by first deleting all subjects for tutor and then adding the new subjects after
                dbConnection.query(`DELETE FROM tutorsSubjects WHERE tutorId = '${tutorId}'`, (error, results) => {
                    if (error){
                        console.log(error)
                        res.json({success: false, message: "Error Changing Profile, check your subjects selected field"})
                        return
                    }
                    for(let i = 0; i < subjects.length; i++){
                        dbConnection.query(`INSERT INTO tutorsSubjects (tutorId, subject) VALUES ('${tutorId}', '${subjects[i]}')`, (error, results) => {
                            if (error){
                                console.log(error)
                                res.json({success: false, message: "Error Changing Profile, check your subjects selected field"})
                                return
                            }
                        })
                    }
                })
                //send success message to frontend to confirm profile was updated
                res.json({success: true, message: "Profile updated"})
                return
            })
        })
    })
})
//route called from frontend to get a specific tutor's profile data
app.get("/api/getProfileData/:username", (req, res) => {
    //grab username from request
    let username = req.params.username
    //grab tutor's information from database
    dbConnection.query(`SELECT * FROM tutors WHERE username = '${username}'`, (error, results) => {
        //if error send error message to frontend
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
        //grab basic information from tutor
        let tutorId = results[0].id
        let name = results[0].name
        let description = results[0].description
        let cost = results[0].cost
        let contactInformation = results[0].contactInformation

        //grab years and subjects for tutor this requires two seperate queries as they are stored in seperate tables
        dbConnection.query(`SELECT * FROM tutorsYears WHERE tutorId = '${tutorId}'`, (error, results) => {
            if(error){
                console.log(error)
                res.json({success: false, message: "Server Error"})
                return
            }
            let years = []
            //linear search through results to grab all years
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
                //linear search through results to grab all subjects
                for(let i = 0; i < results.length; i++){
                    subjects.push(results[i].subject)
                }
                res.json({success: true, imageUrl: `http://localhost:8000/profilepictures/${tutorId}.png`, name, description, cost, contactInformation, years, subjects})
            })
        })
    })
})

//tutors query to get all tutors and their information, this combines the tutors table with the tutorsYears and tutorsSubjects tables to get all the information needed, in a much more manageable format
const tutorsQuery = `
SELECT tutors.id, tutors.username, tutors.name, tutors.description, tutors.cost, tutors.contactInformation, GROUP_CONCAT(DISTINCT tutorsYears.year SEPARATOR ',') as years, GROUP_CONCAT(DISTINCT tutorsSubjects.subject SEPARATOR ',') AS subjects
FROM tutors
LEFT JOIN tutorsSubjects ON tutors.id = tutorsSubjects.tutorId
LEFT JOIN tutorsYears ON tutors.id = tutorsYears.tutorId
GROUP BY tutors.id, tutors.name;
`
//tutors array to store all tutors, this is updated every 5 seconds to ensure that the array is always up to date upon userbase becoming larger this will need to have a longer interval
function updateTutors(){
    //Creating temporary tutor array to avoid tutor array being empty while query happens, causing other queries to think no one is signed up
    let tempTutors = []
    dbConnection.query(tutorsQuery, (error, results) => {
        if(error){
            console.log(error)
            return
        }
        //linear search through results to grab all tutors to add to tempTutors
        for(let i = 0; i < results.length; i++){
            //query returns the years and subjects as a string separated by commas, so we split them into arrays for ease of use in future
            if(results[i].years){
                results[i].years = results[i].years.split(",")
            }
            if(results[i].subjects){
                results[i].subjects = results[i].subjects.split(",")
            }
            tempTutors.push(results[i])
        }
        //once tempTutors array is complete we set tutors array to tempTutors
        tutors = tempTutors
    })
}

//automatically update tutors every 5 seconds as stated above upon database becoming larger this will need to have a longer interval
setInterval(() => {
    updateTutors()
}, 5000);