import React, { Component, useState } from "react";
import { Link } from "react-router-dom";

// import Button from "react-bootstrap/Button";
// import ButtonGroup from "react-bootstrap/Button";
// import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup' ;
// import ToggleButton from "react-bootstrap/ToggleButton";
// import DropdownButton from 'react-bootstrap/DropdownButton'
// import Dropdown from 'react-bootstrap/Dropdown'

class DLModel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      learningrate: "0.01",
      optimizer: "SGD",
      epoch: "10",
      pretrainedmodel: "ResNet",
      customModel: false,
      customModelfile: null,
      dlmodel_done: false,
      classimbalance: false,
      horizonalFlip: false,
      rotate: false,
      shift: false,
      verticalFlip: false,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.lrChange = this.lrChange.bind(this);
    this.optimizerChange = this.optimizerChange.bind(this);
    this.epochChange = this.epochChange.bind(this);
    this.pretrainedChange = this.pretrainedChange.bind(this);
    this.customChange = this.customChange.bind(this);
    this.restartEvent = this.restartEvent.bind(this);
    this.horizonalFlipChange = this.horizonalFlipChange.bind(this);
    this.rotateChange = this.rotateChange.bind(this);
    this.classimbalanceChange = this.classimbalanceChange.bind(this);
    this.shiftChange = this.shiftChange.bind(this);
    this.verticalFlipChange = this.verticalFlipChange.bind(this);
    this.renderModelDetail = this.renderModelDetail.bind(this);
  }
  horizonalFlipChange = (event) => {
    console.log("horizonalFlip event:", event.target.checked);
    this.setState({ horizonalFlip: event.target.checked });
  };

  classimbalanceChange = (event) => {
    this.setState({ classimbalance: event.target.checked });
  };

  rotateChange = (event) => {
    this.setState({ rotate: event.target.checked });
  };

  shiftChange = (event) => {
    this.setState({ shift: event.target.checked });
  };

  verticalFlipChange = (event) => {
    this.setState({ verticalFlip: event.target.checked });
  };

  restartEvent = (event) => {
    console.log("restartEvent of DLModel.js");
    this.setState({
      learningrate: "0.01",
      optimizer: "SGD",
      epoch: "10",
      pretrainedmodel: "ResNet",
      customModel: false,
      customModelfile: null,
      dlmodel_done: false,
      classimbalance: false,
      horizonalFlip: false,
      rotate: false,
      shift: false,
      verticalFlip: false,
    });
    document.getElementById("inlineCheckbox1").checked = false; //Uncheck checkbox on reset
    document.getElementById("inlineCheckbox2").checked = false;
    document.getElementById("inlineCheckbox3").checked = false;
    document.getElementById("inlineCheckbox4").checked = false;
    document.getElementById("inlineCheckbox9").checked = false;
    var error = document.getElementById("error_dlmodel");
    error.textContent = "";
  };

  handleSubmit = (event) => {
    event.preventDefault();
    // alert("Your favorite flavor is: " + this.state.value);
    if (this.props.upload_done) {
      console.log("DLModel.js states:", this.state);
      this.setState({ dlmodel_done: true }, () => {
        this.props.dlmodel_metadata(
          this.state.dlmodel_done,
          this.state.learningrate,
          this.state.optimizer,
          this.state.epoch,
          this.state.pretrainedmodel,
          this.state.customModel,
          this.state.customModelfile,
          this.state.horizonalFlip,
          this.state.rotate,
          this.state.shift,
          this.state.verticalFlip,
          this.state.classimbalance
        );
      });
      var error = document.getElementById("error_dlmodel");
      error.textContent = "";
      var error_training = document.getElementById("error_training");
      error_training.textContent = "";
    } else {
      var error = document.getElementById("error_dlmodel");
      error.textContent = "Finish Step 1";
      error.style.color = "red";
      alert("Finish Step 1");
    }
  };

  lrChange = (event) => {
    this.setState({ learningrate: event.target.value });
  };
  optimizerChange = (event) => {
    this.setState({ optimizer: event.target.value });
  };
  epochChange = (event) => {
    this.setState({ epoch: event.target.value });
  };
  pretrainedChange = (event) => {
    this.setState({ pretrainedmodel: event.target.value });
  };
  customChange = (event) => {
    this.setState({ customModel: true, customModelfile: event.target.files[0] });
    console.log("modelfile", event.target.files[0]);
  };

  renderModelDetail() {
    if (this.props.upload_done && this.state.customModel) {
      return <span style={{ color: "#3d6da1" }}>&nbsp;Selected Custom Model</span>;
    } else if (this.props.upload_done) {
      return <span style={{ color: "#3d6da1" }}>&nbsp;Selected Pretrained</span>;
    } else {
      return "";
    }
  }

  render() {
    return (
      <React.Fragment>
        <form onSubmit={this.handleSubmit}>
          <div className="row justify-content-start">
            <h3>Step 2: Define Model And Parameters </h3>
          </div>

          <div className="row justify-content-around">
            <div className="col-*-2 mx-auto">
              <label>
                lr:&nbsp;
                <select value={this.state.learningrate} onChange={this.lrChange}>
                  <option learningrate="0.01">0.01</option>
                  <option learningrate="0.005">0.005</option>
                  <option learningrate="0.001">0.001</option>
                  <option learningrate="0.0005">0.0005</option>
                  <option learningrate="0.0001">0.0001</option>
                </select>
              </label>
            </div>

            <div className="col-*-2 mx-auto">
              <label>
                Optimizer:&nbsp;
                <select value={this.state.optimizer} onChange={this.optimizerChange}>
                  <option optimizer="SGD">SGD</option>
                  <option optimizer="ADAM">ADAM</option>
                </select>
              </label>
            </div>

            <div className="col-*-2 mx-auto">
              <label>
                Epoch:&nbsp;
                <select value={this.state.epoch} onChange={this.epochChange}>
                  <option epoch="5">5</option>
                  <option epoch="10">10</option>
                  <option epoch="15">15</option>
                  <option epoch="20">20</option>
                </select>
              </label>
            </div>
          </div>
          <div className="row justify-content-start pb-0 px-3">
            <div className="col-*-2 ">
              <label>
                Pretrained:&nbsp;
                <select value={this.state.pretrainedmodel} onChange={this.pretrainedChange}>
                  <option pretrainedmodel="ResNet">ResNet</option>
                  <option pretrainedmodel="MobileNet">MobileNet</option>
                </select>
              </label>
            </div>
            <div className="col-*-2 ">
              &nbsp;Or&nbsp;Custom&nbsp;
              <input type="file" id="custom_model" accept=".py" className="visually-hidden" onChange={this.customChange} />
              <button type="button" class="btn btn-secondary" style={{ height: "70%" }}>
                <label htmlFor="custom_model"> Upload .py</label>
              </button>
            </div>

            <div className="col-*-2 ">
              <a style={{ display: "table-cell" }} target="_blank" href={"https://gist.github.com/AIKungfu/2e814549e2aaedeb21fc8261777ab410"}>
                &nbsp;Sample Code
              </a>
            </div>
          </div>
          <div>
            <input class="form-check-input9" style={{ marginRight: 10 }} type="checkbox" id="inlineCheckbox9" value={this.state.classimbalance} onChange={this.classimbalanceChange} />
            <label style={{ marginRight: 20 }} for="inlineCheckbox9" value={this.state.classimbalanceChange}>
              Handle Class Imbalance
            </label>
          </div>
          <div>
            <label style={{ marginRight: 20 }}>Data Augumentation:</label>
            <input class="form-check-input1" style={{ marginRight: 10 }} type="checkbox" id="inlineCheckbox1" value={this.state.horizonalFlip} onChange={this.horizonalFlipChange} />
            <label class="form-check-label1" style={{ marginRight: 20 }} for="inlineCheckbox1" value={this.state.horizonalFlip}>
              HorizontalFlip
            </label>
            <input class="form-check-input4" style={{ marginRight: 10 }} type="checkbox" id="inlineCheckbox4" value={this.state.rotate} onChange={this.rotateChange} />
            <label for="inlineCheckbox4" style={{ marginRight: 20 }}>
              Rotate-5
            </label>
          </div>
          <div>
            <input class="form-check-input3" style={{ marginRight: 10 }} type="checkbox" id="inlineCheckbox3" value={this.state.shift} onChange={this.shiftChange} />
            <label for="inlineCheckbox3" style={{ marginRight: 20 }}>
              Shift-13
            </label>

            <input class="form-check-input2" style={{ marginRight: 10 }} type="checkbox" id="inlineCheckbox2" value={this.state.verticalFlip} onChange={this.verticalFlipChange} />
            <label class="form-check-label2" for="inlineCheckbox2" style={{ marginRight: 20 }}>
              RandomverticalFlip
            </label>
          </div>
          <div className="row pl-5 ml-5">
            <input type="submit" className="btn btn-primary" value="Submit detail" disabled={this.state.dlmodel_done} />
            {this.renderModelDetail()}
          </div>
          <span id="error_dlmodel"></span>
        </form>
      </React.Fragment>
    );
  }
}

// class learningrate extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       value: 0.01,
//     };

//     this.handleSubmit = this.handleSubmit.bind(this);
//   }

//   handleSubmit(event) {
//     alert("Your favorite flavor is: " + this.state.value);
//     // console.log(this.state.value);
//     event.preventDefault();
//   }

//   handleChange = (event) => {
//     this.setState({ value: event.target.value });
//     <DLModel LR={this.state.value} />;
//     // console.log(this.state.value);
//   };

//   render() {
//     return (
//       <form onSubmit={this.handleSubmit}>
//         <label>
//           Pick your favorite flavor:
//           <select value={this.state.value} onChange={this.handleChange}>
//             <option value="0.05">0.05</option>
//             <option value="0.01">0.01</option>
//             <option value="0.005">0.005</option>
//             <option value="0.001">0.001</option>
//             <option value="0.0005">0.0005</option>
//             <option value="0.0001">0.0001</option>
//           </select>
//         </label>
//         <br />
//         <br />
//         {/* <label>
//           Looping through Array
//           <select>
//             {this.state.countries.map((item) => (
//               <option key={item.id} value={item.country}>
//                 {item.country}
//               </option>
//             ))}
//             {console.log(this.state.countries)}
//           </select>
//         </label> */}
//         <input type="submit" value="Submit2" />
//       </form>
//     );
//   }
// }

// function Checkbox() {
//   const [checked, setChecked] = useState(false);
//   const [radioValue, setRadioValue] = useState("1");

//   const radios = [
//     { name: "Active", value: "1" },
//     { name: "Radio", value: "2" },
//     { name: "Radio", value: "3" },
//   ];
//   return (
//     <div>
//       <ButtonGroup toggle className="mb-2">
//         <ToggleButton
//           type="checkbox"
//           variant="secondary"
//           checked={checked}
//           value="1"
//           onChange={(e) => setChecked(e.currentTarget.checked)}
//         >
//           Checked
//         </ToggleButton>
//       </ButtonGroup>
//       <br />
//       <ButtonGroup toggle>
//         {radios.map((radio, idx) => (
//           <ToggleButton
//             key={idx}
//             type="radio"
//             variant="secondary"
//             name="radio"
//             value={radio.value}
//             checked={radioValue === radio.value}
//             onChange={(e) => setRadioValue(e.currentTarget.value)}
//           >
//             {radio.name}
//           </ToggleButton>
//         ))}
//       </ButtonGroup>
//     </div>
//   );
// }

export default DLModel;
