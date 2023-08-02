import logo from './logo.png';
import photoOfMe from './me.png';
import { Fragment, useEffect, useState } from 'react';
import { FaSearch, FaArrowLeft } from 'react-icons/fa';
import './App.css';

function App() {

  //Enum of all valid pages that can be displayed in the program to simplify changing between pages
  const validPages = {
    searchPage: 0,
    optionsPage: 1,
    logInPage: 2,
    editProfilePage: 3,
    fullProfileView: 4,
  }
  //defining variables to be used and updated throughout the program
  const [activePage, setActivePage] = useState(validPages.searchPage)
  const [validTutors, setValidTutors] = useState([])
  const [errorMessage, setErrorMessage] = useState("")
  const [username, setUserName] = useState("")
  const [validSubjects, setValidSubjects] = useState([])
  const [validYears, setValidYears] = useState([])
  const [selectedTutor, setSelectedTutor] = useState({})
  const [registering, setRegistering] = useState(false)

  //function to get the valid subjects and years from the server
  async function getSelections(){
    let response = await fetch("http://localhost:8000/src/availableselections.json")
    let data = await response.json()
    setValidSubjects(data.subjects)
    setValidYears(data.years)
  }
  //useeffect runs on program start to query valid subjects and years from the server
  useEffect(() => {
    getSelections()
  }, [])

  //function to handle the search submit event to get tutors fitting criteria
  function searchSubmit(event){
    event.preventDefault()
    let selectedYear = event.target.elements.yearSelect.value
    let selectedSubject = event.target.elements.subjectSelect.value
    fetch(`http://localhost:8000/api/search?selectedYear=${selectedYear}&selectedSubject=${selectedSubject}`)
    .then(response => response.json())
    .then(data => {
      setActivePage(validPages.optionsPage)
      setValidTutors(data.validTutors)
    })
  }
  //function to handle the back button being pressed to return to the search page
  function backToSearch(){
    setActivePage(validPages.searchPage)
  }
  //function to handle the log in button being pressed to enter the log in page
  function enterLogIn(){
    setActivePage(validPages.logInPage)
  }
  //function to handle the log in form being submitted and handle the response from the server
  async function submitLogIn(event){
    event.preventDefault()
    let username = event.target.elements.username.value
    let password = event.target.elements.password.value
    let response = await fetch(`http://localhost:8000/${registering ? "register" : "login"}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({username, password})
    })
    let data = await response.json()
    if(data.success){
      window.localStorage.setItem("token", data.token)
      setUserName(username)
      setActivePage(validPages.editProfilePage)
    }
    else {
      setErrorMessage(data.message)
    }
  }
  //function to handle the full profile view button being pressed to enter the full profile view page and show more information about a tutor
  function fullProfileView(tutor){
    console.log(tutor)
    setSelectedTutor(tutor)
    setActivePage(validPages.fullProfileView)
  }
  //html this function needs to render being all of the sites pages conditionally based on activePage
  return (
    <div className="App">
      {activePage == validPages.searchPage ? < SearchPage searchSubmit={searchSubmit} enterLogIn={enterLogIn} validSubjects={validSubjects} validYears={validYears}/> : null}
      {activePage == validPages.optionsPage ? < OptionsPage backToSearch={backToSearch} validTutors={validTutors} fullProfileView={fullProfileView}/> : null}
      {activePage == validPages.logInPage ? < LogInPage backToSearch={backToSearch} submitLogIn={submitLogIn} registering={registering} setRegistering={setRegistering}/> : null}
      {activePage == validPages.editProfilePage ? < EditProfilePage username={username} validSubjects={validSubjects} validYears={validYears}/> : null}
      {activePage == validPages.fullProfileView ? < FullProfileView backToSearch={backToSearch} tutor={selectedTutor}/> : null}
      {errorMessage != "" ? <ErrorPage errorMessage={errorMessage} disableErrorPage={() => setErrorMessage("")}/> : null}
    </div>
  )
}

//Logo display function displays the logo and the two divs on either side of it called in html of most pages to render logo at top of page
function LogoDisplay(){
  return (
    <div className='Flex LogoDisplay'>
      <div className='LeftDiv'></div>
      <img src={logo} className="SiteLogo" alt="logo" />
      <div className='RightDiv'> </div>
    </div>
  )
}
//Search page to 
function SearchPage({searchSubmit, enterLogIn, validSubjects, validYears}){
  return (
    <div className='SearchPage'>
      <div className='Flex Column'>
        <div className='Flex'>
          
          {/*<img src={photoOfMe} className="PhotoOfMe" alt="photoOfMe" />*/}
        </div>
        <LogoDisplay />
        <h2>Star Tutors Is The Fastest And Easiest Way to Find Quality and Experienced Tutors For<br></br> Primary and High School Aged Students In All Subjects</h2>
        <form onSubmit={searchSubmit} className='SearchBar'>
          <select name="yearSelect">
            <option selected disabled hidden>Year</option>
            {validYears.map(year => <option>{year}</option>)}

          </select>
          <div></div>
          <select name="subjectSelect">
            <option selected disabled hidden>Subject</option>
            {validSubjects.map(subject => <option>{subject}</option>)}
          </select>
          <div></div>
          <button>
            <FaSearch />
          </button>
        </form>
      </div> 
      <button onClick={enterLogIn} className='LogInPageButton'>Log In</button>
    </div>
    
  )
}

function convertToBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.replace(/^data:.+;base64,/, ''));
    reader.onerror = error => reject(error);
  });
}
function EditProfilePage({username, validYears, validSubjects}){
  const [accountData, setAccountData] = useState({imageUrl: "", name: "", years: [], subjects: [], cost: 0, description: ""})
  function readURL(event) {
    if(event.target.files && event.target.files[0]){
      var reader = new FileReader();
  
      reader.onload = function (e) {
        let tempAccountData = {...accountData}
        tempAccountData.imageUrl = e.target.result
        setAccountData(tempAccountData)
      };
      
      reader.readAsDataURL(event.target.files[0]);
    }
  }
  async function submitChanges(event){
    event.preventDefault()
    let name = event.target.elements.name.value
    let cost = event.target.elements.cost.value
    let description = event.target.elements.description.value

    let tempYears = event.target.elements.years
    let years = []
    for(let i = 0; i < tempYears.length; i++){
      if(tempYears[i].checked){
        years.push(tempYears[i].value)
      }
    }
    let tempSubjects = event.target.elements.subjects
    let subjects = []
    for(let i = 0; i < tempSubjects.length; i++){
      if(tempSubjects[i].checked){
        subjects.push(tempSubjects[i].value)
      }
    }
    let image = event.target.elements.image.files[0]
    if(image){
      image = await convertToBase64(image)
    }
    let response = await fetch(`http://localhost:8000/editProfile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify({token: window.localStorage.getItem("token"), name, years, cost, subjects, description, image})
    })
    let data = await response.json()
    console.log(data)
  }
  function getStartingData(){
    console.log(username)
    fetch(`http://localhost:8000/api/getProfileData/${username}`)
    .then(response => response.json())
    .then(data => {
      console.log(data.cost)
      console.log(typeof(data.cost))
      setAccountData(data)
    })
  }
  //some sort of bug with react where you cant set default value of number input so this work around is needed to update the cost field using value instead of defaultValue
  function costUpdated(event){
    let tempAccountData = {...accountData}
    tempAccountData.cost = event.target.value
    setAccountData(tempAccountData)
  }
  useEffect(() => {
    getStartingData()
  }, [])

  return (
    <div className='EditProfilePage'>
      <div>
        <form className='EditProfileForm' onSubmit={submitChanges}>
          <LogoDisplay />
          <div className='Flex'>
            <img className='ProfilePicture' src={accountData.imageUrl}></img>
            <input type='file' name="image" accept="image/*" onChange={readURL} style={{color: "transparent", width: "90px"}}></input>
            <label>Use image with 1:1 aspect ratio to avoid stretching</label>
          </div>
          
          <input type='text' placeholder='Name' name="name" defaultValue={accountData.name}></input>
          <div className='EditProfileSubjectYearParent'>
            <div>
              <h4>Years Tutored:</h4>
              {validYears.map(year => <div><label>{year}</label><input defaultChecked={accountData.years.find(yearName => year == yearName)} type='checkbox' name="years" value={year}></input></div>)}
            </div>
            <div>
              <h4>Subjects Tutored:</h4>
              {validSubjects.map(subject =><div><label>{subject}</label><input defaultChecked={accountData.subjects.find(subjectName => subject == subjectName)} type='checkbox' name="subjects" value={subject}></input></div>)}
            </div>
          </div>
          
          <div className='Flex'>
            <div>Cost: $</div>
            <input type='number' placeholder='Cost' name="cost" value={accountData.cost} onChange={costUpdated}></input>
          </div>
          <div className='Flex'>
            <div>Description:</div>
            <input type='text' placeholder='Description' name="description" defaultValue={accountData.description}></input>
          </div>
          
          <button type="submit">Save</button>
        </form>
      </div>
    </div>
  )
}
function OptionsPage({backToSearch, validTutors, fullProfileView}){
  return (
    <div className='OptionsPage Column'>
      < LogoDisplay />
      <div className='Flex Column'>
        
        {validTutors.map(tutor => {
          return (
            <Fragment>
              <div style={{display: "flex", padding: "10px", height: "150px", width: "600px"}} onClick={() => fullProfileView(tutor)}>
                <img className='ProfilePicture' src={"http://localhost:8000/profilepictures/" + tutor.id + ".png"}></img>
                <div style={{textAlign: 'left', marginLeft: "10px"}}>
                  <h3>Name: {tutor.name}</h3>
                  <p>Subjects Tutored: {tutor.subjects.map((subject, index) => {
                    return (`${subject}${index != tutor.subjects.length - 1 ? ", " : ""}`)
                  })}</p>
                  <p>{tutor.description}</p>
                </div>
              </div>
              <hr></hr>
            </Fragment>
            
            
          )
        })}
        <button onClick={backToSearch} className='BackButton'><FaArrowLeft/>Back</button>
      </div>
    </div>
  )
}
function LogInPage({backToSearch, submitLogIn, registering, setRegistering}){

  return (
    <div className='LogInPage Column Flex'>
      < LogoDisplay />
      <div style={{width: "500px"}}>
        <form onSubmit={submitLogIn} className='LoginForm'>
          <h2>Log In</h2>
          <input type='text' placeholder='Username' name='username'></input>
          <input type='password' placeholder='Password' name='password'></input>
          <button type="submit">{registering ? "Register" : "Log In"}</button>
          <button type="button" onClick={() => setRegistering(!registering)}>{registering ? "Log In Instead" : "Register Instead"}</button>
        </form>
        
      </div>
      <button onClick={backToSearch} className='BackButton'>Back</button>
    </div>
  )
}
function ErrorPage({errorMessage, disableErrorPage}){
  return (
    <div className='ErrorPage'>
      <div>
        <h1>Error</h1>
        <p>{errorMessage}</p>
        <button onClick={disableErrorPage}>Back</button>
      </div>
    </div>
  )
}
function FullProfileView({backToSearch, tutor}){
  return (
    <div className='FullProfileView'>
      <div className='Flex Column'>
        <h1>{tutor.name}</h1>
        <img className='ProfilePicture' src={"http://localhost:8000/profilepictures/" + tutor.id + ".png"}></img>
        <h3>Years Tutored: {tutor.years.map((year, index) => {
          return (`${year}${index != tutor.years.length - 1 ? ", " : ""}`)
        })}</h3>
        <h3>Subjects Tutored: {tutor.subjects.map((subject, index) => {
          return (`${subject}${index != tutor.subjects.length - 1 ? ", " : ""}`)
        })}</h3>
        <h3>Cost: ${tutor.cost}</h3>
        <p>{tutor.description}</p>
        <button onClick={backToSearch} className='BackButton'>Back</button>
      </div>
    </div>
  )
}
export default App;
