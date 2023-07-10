import logo from './logo.svg';
import { Fragment, useState } from 'react';
import './App.css';

function App() {
  const validPages = {
    searchPage: 0,
    optionsPage: 1
  }
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [activePage, setActivePage] = useState(validPages.searchPage)
  const [validTutors, setValidTutors] = useState([])
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
  return (
    <div className="App">
      {activePage == validPages.searchPage ? < SearchPage searchSubmit={searchSubmit}/> : null}
      {activePage == validPages.optionsPage ? < OptionsPage backToSearch={backToSearch} validTutors={validTutors}/> : null}
    </div>
  );
}
function SearchPage({searchSubmit}){
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
                <img style={{aspectRatio: "1", height: "100%", borderRadius: "10px", marginRight: "20px"}} src={tutor.image}></img>
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
      </div>
    </div>
  )
}
export default App;
