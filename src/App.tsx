import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Survey from './pages/survey'

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Survey/>}/>
      </Routes>
    </Router>
  )
}

export default App
