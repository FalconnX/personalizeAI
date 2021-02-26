import { Component } from "react";
import React from "react";
import axios from "axios";

class Training extends Component {
  constructor(props) {
    super(props);
    this.restartEvent = this.restartEvent.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.renderTrain = this.renderTrain.bind(this);
    this.state = {
      copied_usertoken: "",
      training_started_done: false,
      model_ready: false,
      train_acc: null,
      test_acc: null,
    };
  }

  handleSubmit = (event) => {
    event.preventDefault();
    console.log("customModelfile", this.props.customModelfile);
    if (this.props.upload_done && this.props.dlmodel_done) {
      //Rest API, refernce:https://stackoverflow.com/questions/50774176/sending-file-and-json-in-post-multipart-form-data-request-with-axios
      this.setState({ copied_usertoken: this.props.usertoken, training_started_done: true }, () => {
        this.props.training_metadata(this.state.training_started_done, this.state.train_acc, this.state.test_acc);
      });
      var error = document.getElementById("error_training");
      error.textContent = "";
      var txtinput = document.getElementById("tokentxt"); // inference.js
      txtinput.value = "";
      var newTokenUpdate = document.getElementById("newTokenUpdate"); //inference.js
      newTokenUpdate.textContent = "";
      var noImgWarning = document.getElementById("noImgWarning");
      noImgWarning.textContent = "";

      let formData = new FormData();
      let datadict = {
        type: "cv",
        usertoken: this.props.usertoken,
        upload_done: this.props.upload_done,
        dlmodel_done: this.props.dlmodel_done,
        num_class: this.props.num_class,
        train_split: this.props.train_split,
        learningrate: this.props.learningrate,
        optimizer: this.props.optimizer,
        epoch: this.props.epoch,
        pretrainedmodel: this.props.pretrainedmodel,
        customModel: this.props.customModel,
        horizonalFlip: this.props.horizonalFlip,
        rotate: this.props.rotate,
        shift: this.props.shift,
        verticalFlip: this.props.verticalFlip,
        classimbalance: this.props.classimbalance,
      };
      let datadict_json = JSON.stringify(datadict);
      let datadict_blob = new Blob([datadict_json], {
        type: "application/json",
      });
      formData.append("customModelfile", this.props.customModelfile);
      formData.append("datadict", datadict_blob);

      // send data info to django using REST API
      // axios
      // .post(`http://34.192.74.163/request/`, {
      //   type: "cv",
      //   usertoken: this.props.usertoken,
      //   upload_done: this.props.upload_done,
      //   dlmodel_done: this.props.dlmodel_done,
      //   num_class: this.props.num_class,
      //   learningrate: this.props.learningrate,
      //   optimizer: this.props.optimizer,
      //   epoch: this.props.epoch,
      //   pretrainedmodel: this.props.pretrainedmodel,
      //   customModel: this.props.customModel,
      //   customModelfile: this.props.customModelfile,
      //   horizonalFlip: this.props.horizonalFlip,
      //   rotate: this.props.rotate,
      //   shift: this.props.shift,
      //   verticalFlip: this.props.verticalFlip,
      // })
      axios
        .post(`http://34.192.74.163/request/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((res) => {
          console.log("Response from django to react:", res);
          if (res.status == 200) {
            this.setState({ model_ready: true, train_acc: res.data["train_acc"], test_acc: res.data["test_acc"] }, () => {
              this.props.training_metadata(this.state.training_started_done, this.state.model_ready, this.state.train_acc, this.state.test_acc);
            });
          } else {
            var error = document.getElementById("error_training");
            error.textContent = "Something went wrong. Please restart again";
            error.style.color = "blue";
            alert("something went wrong");
          }
          console.log(res.data);
        })
        .catch((res) => {
          var myerror = document.getElementById("error_training");
          myerror.textContent = "Disconnected.Copy token, Refresh & try inference after 5 min";
          myerror.style.color = "blue";
          alert("Disconnected. Save your token, Refresh Page, Enter Token & try inference after 5-10 min");
        });
    } else {
      var error = document.getElementById("error_training");
      error.textContent = "Finish Step1 & Step2";
      error.style.color = "red";
      alert("Finish Step1 & Step2");
    }
    // let myprops = this.props;
    // console.log("all training props", this.props);
  };

  restartEvent = (event) => {
    console.log("restartEvent of Training.js");
    this.setState({ copied_usertoken: "", training_started_done: false, model_ready: false, train_acc: null, test_acc: null });
    var error = document.getElementById("error_training");
    error.textContent = "";
  };

  renderTrain() {
    if (this.state.model_ready) {
      return (
        <div style={{ color: "green", fontWeight: "bold" }}>
          Training Done. Train Accuracy:{this.state.train_acc.toFixed(2)} and Test Accuracy:{this.state.test_acc.toFixed(2)}
        </div>
      );
    } else if (this.state.training_started_done) {
      return <div style={{ color: "#d1ab2e", fontWeight: "bold" }}>Training Started.....</div>;
    } else {
      return "";
    }
  }

  render() {
    return (
      <React.Fragment>
        <form onSubmit={this.handleSubmit}>
          <div className="row justify-content-start pt-0 pb-0">
            <h3> Step 3: Start Training Model </h3>
          </div>
          <div className="row justify-content-start mx-auto pt-0 pb-2">Copy your token: {this.state.copied_usertoken}</div>

          <div className="row justify-content-around ml-5 pl-5 ">
            <input type="submit" className="btn btn-primary" value="Start training" disabled={this.state.training_started_done} />
            <br />
            &nbsp;<span id="error_training"></span>
          </div>

          <div className="row justify-content-start">{this.renderTrain()}</div>
        </form>
      </React.Fragment>
    );
  }
}
export default Training;
