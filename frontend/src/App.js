import logo from './logo.svg';
import { Fragment, useState } from 'react';
import './App.css';

function App() {
  const validPages = {
    searchPage: 0,
    optionsPage: 1,
    logInPage: 2
  }
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [activePage, setActivePage] = useState(validPages.searchPage)
  const [validTutors, setValidTutors] = useState([])
  const [errorMessage, setErrorMessage] = useState("")
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
    }
    else {
      setErrorMessage(data.message)
    }
  }
  return (
    <div className="App">
      {activePage == validPages.searchPage ? < SearchPage searchSubmit={searchSubmit} enterLogIn={enterLogIn}/> : null}
      {activePage == validPages.optionsPage ? < OptionsPage backToSearch={backToSearch} validTutors={validTutors}/> : null}
      {activePage == validPages.logInPage ? < LogInPage backToSearch={backToSearch} submitLogIn={submitLogIn}/> : null}
      {errorMessage != "" ? <ErrorPage errorMessage={errorMessage} disableErrorPage={() => setErrorMessage("")}/> : null}
    </div>
  );
}
function SearchPage({searchSubmit, enterLogIn}){
  return (
    <div className='SearchPage'>
      <div >
        <h1>Tutoring App</h1>
        <form onSubmit={searchSubmit} className='SearchBar'>
          <select name="yearSelect">
            <option selected disabled hidden>Year</option>
            <option>Prep-2</option>
            <option>3-4</option>
            <option>5-6</option>
            <option>7-8</option>
            <option>9-10</option>
            <option>11-12</option>
          </select>
          <div></div>
          <select name="subjectSelect">
            <option selected disabled hidden>Subject</option>
            <option>Maths</option>
            <option>English</option>
            <option>Science</option>
            <option>History</option>
            <option>Geography</option>
            <option>French</option>
            <option>German</option>
            <option>Spanish</option>
            <option>Italian</option>
            <option>Chinese</option>
            <option>Japanese</option>
            <option>Indonesian</option>
          </select>
          <div></div>
          <button>
            <img></img>
          </button>
        </form>
      </div> 
      <button onClick={enterLogIn} className='LogInPageButton'>Log In</button>
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
                <img style={{aspectRatio: "1", height: "100%", borderRadius: "10px", marginRight: "20px"}} src={"http://localhost:8000/profilepictures/" + tutor.id + ".png"}></img>
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
        <button onClick={backToSearch} className='BackButton'>Back</button>
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
