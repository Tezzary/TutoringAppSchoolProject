import logo from './logo.svg';
import { Fragment, useEffect, useState } from 'react';
import { FaSearch, FaArrowLeft } from 'react-icons/fa';
import './App.css';

function App() {
  const validPages = {
    searchPage: 0,
    optionsPage: 1,
    logInPage: 2,
    editProfilePage: 3
  }
  const [activePage, setActivePage] = useState(validPages.searchPage)
  const [validTutors, setValidTutors] = useState([])
  const [errorMessage, setErrorMessage] = useState("")
  const [username, setUserName] = useState("")
  const [validSubjects, setValidSubjects] = useState([])
  const [validYears, setValidYears] = useState([])
  async function getSelections(){
    let response = await fetch("http://localhost:8000/src/availableselections.json")
    let data = await response.json()
    setValidSubjects(data.subjects)
    setValidYears(data.years)
  }
  useEffect(() => {
    getSelections()
  }, [])
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
  function backToSearch(){
    setActivePage(validPages.searchPage)
  }
  function enterLogIn(){
    setActivePage(validPages.logInPage)
  }
  async function submitLogIn(event){
    event.preventDefault()
    let username = event.target.elements.username.value
    let password = event.target.elements.password.value
    console.log(username, password)
    let response = await fetch(`http://localhost:8000/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({username, password})
    })
    let data = await response.json()
    console.log(data)
    if(data.success){
      console.log("Logged In")
      window.localStorage.setItem("token", data.token)
      setUserName(username)
      setActivePage(validPages.editProfilePage)
    }
    else {
      setErrorMessage(data.message)
    }
  }
  return (
    <div className="App">
      {activePage == validPages.searchPage ? < SearchPage searchSubmit={searchSubmit} enterLogIn={enterLogIn} validSubjects={validSubjects} validYears={validYears}/> : null}
      {activePage == validPages.optionsPage ? < OptionsPage backToSearch={backToSearch} validTutors={validTutors}/> : null}
      {activePage == validPages.logInPage ? < LogInPage backToSearch={backToSearch} submitLogIn={submitLogIn}/> : null}
      {activePage == validPages.editProfilePage ? < EditProfilePage username={username} validSubjects={validSubjects} validYears={validYears}/> : null}
      {errorMessage != "" ? <ErrorPage errorMessage={errorMessage} disableErrorPage={() => setErrorMessage("")}/> : null}
    </div>
  );
}
function SearchPage({searchSubmit, enterLogIn, validSubjects, validYears}){
  return (
    <div className='SearchPage'>
      <div >
        <h1>Tutoring App</h1>
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
  const [accountData, setAccountData] = useState({imageUrl: "", name: "", year: "", cost: "", subjects: "", description: ""})
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
    console.log(image)
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
      setAccountData(data)
    })
  }
  useEffect(() => {
    getStartingData()
  }, [])
  return (
    <div className='EditProfilePage'>
      <div>
        <h1>Edit Profile</h1>
        <form className='EditProfileForm' onSubmit={submitChanges}>
          <img src={accountData.imageUrl}></img>
          <input type='file' name="image" onChange={readURL}></input>
          <input type='text' placeholder='Name' name="name"></input>
          {validYears.map(year => <input type='checkbox' name="years" value={year}></input>)}
          {validSubjects.map(subject => <input type='checkbox' name="subjects" value={subject}></input>)}
          <input type='number' placeholder='Cost' name="cost"></input>
          <input type='text' placeholder='Description' name="description"></input>
          <button type="submit">Save</button>
        </form>
      </div>
    </div>
  )
}
function OptionsPage({backToSearch, validTutors}){
  return (
    <div className='OptionsPage'>
      <div>
        <h1>Tutoring App</h1>
        {validTutors.map(tutor => {
          return (
            <Fragment>
              <div style={{display: "flex", padding: "10px", height: "150px", width: "600px"}}>
                <img style={{aspectRatio: "1", height: "100px", borderRadius: "10px", marginRight: "20px"}} src={"http://localhost:8000/profilepictures/" + tutor.id + ".png"}></img>
                <div style={{textAlign: 'left'}}>
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
function LogInPage({backToSearch, submitLogIn, registering}){
  return (
    <div className='LogInPage'>
      <div>
        <h1>Log In</h1>
        <form onSubmit={submitLogIn}>
          <input type='text' placeholder='Username' name='username'></input>
          <input type='password' placeholder='Password' name='password'></input>
          <button type="submit">Log In</button>
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
export default App;
