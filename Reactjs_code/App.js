import "bootstrap/dist/css/bootstrap.min.css";

import logo from "./logo.svg";
import "./App.css";
// import Topicsbar from "./Topics.js";
// import Upload from "./Upload.js";
// import FileList from "./FileList.js";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Navigator from "./NavigationBar.js";
import DLModel from "./DLModel.js";
import ObjectClassification from "./ObjectClassification.js";
import TextClassification from "./TextClassification.js";

import Particles from "react-particles-js";
import particlesConfig from "./config/particlesConfig";
import { Navbar } from "react-bootstrap";

function App() {
  return (
    <div className="App">
      <div id="particles">
        <Particles height="100vh" width="100vw" params={particlesConfig} />
      </div>
      {/* <Topicsbar /> */}
      {/* <DLModel /> */}
      <Router>
        <Navigator />

        <Switch>
          <Route path="/" exact component={ObjectClassification}></Route>
          <Route path="/TextClassification" component={TextClassification}></Route>
        </Switch>
      </Router>
      <Navbar fixed="fixed" bg="dark">
        <div className="footer">Website & Inference: EC2 C5n CPU-Xeon using Django,React & Nginx</div>
        <div className="footer">
          Training: EC2 P2 GPU-K80 using Flask & Nginx
          <div className="footer col-*-1">Me: Maulik</div>
        </div>
      </Navbar>
    </div>
  );
}

export default App;

// <Route path="/" exact component={FileList}></Route>
// <Route path="/ObjectClassification" component={ObjectClassification}></Route>
//       <Navbar fixed="bottom" bg="dark">
// <div className="footer">Brand text</div>
// </Navbar>
