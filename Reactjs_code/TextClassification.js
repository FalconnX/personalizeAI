import React, { Component, useEffect } from "react";
import S3 from "react-aws-s3";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

class TextClassification extends React.Component {
  constructor(props) {
    // require("dotenv").config();
    super(props);
    this.state = {
      csvfile: null,
      csvuploaded: false,
      start_training: false,
      nlp_ready: false,
      input_txt: "",
      userid: "",
      copyuserid: "",
      epoch: "10",
      train_nlp_split: 0.9,
      nlp_inference_output_ready: false,
      prediction: "",
      size_of_vocab: 0,
      num_output_nodes: 0,
      train_acc: 0,
      valid_acc: 0,
    };
    this.fileUpload = this.fileUpload.bind(this);
    this.trainClick = this.trainClick.bind(this);
    this.restartnlpClick = this.restartnlpClick.bind(this);
    this.txtChange = this.txtChange.bind(this);
    this.predictSubmit = this.predictSubmit.bind(this);
    this.s3UploadCSV = this.s3UploadCSV.bind(this);
    this.epochChange = this.epochChange.bind(this);
    this.trainsplitnlpChange = this.trainsplitnlpChange.bind(this);
    this.renderOutput = this.renderOutput.bind(this);
    this.renderTrainingStatus = this.renderTrainingStatus.bind(this);
  }

  trainsplitnlpChange = (event) => {
    this.setState({ train_nlp_split: event.target.value });
  };

  epochChange = (event) => {
    this.setState({ epoch: event.target.value });
  };

  s3UploadCSV = (file, dirname) => {
    // npm install dotenv --save. Ref:https://stackoverflow.com/questions/49579028/adding-an-env-file-to-react-project ; https://create-react-app.dev/docs/adding-custom-environment-variables/

    var AWS_ACCESS_KEY = process.env.REACT_APP_AWSAccessKeyId;
    var AWS_SECRET_ACCESS_KEY = process.env.REACT_APP_AWSSecretKey;
    var S3_BUCKET = process.env.REACT_APP_S3_BUCKET;
    var AWS = require("aws-sdk");
    var s3 = new AWS.S3({
      accessKeyId: AWS_ACCESS_KEY,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    });

    var params = {
      Bucket: S3_BUCKET,
      Key: dirname,
      ACL: "private",
      Body: file,
    };

    s3.upload(params, function (err, data) {
      console.log(err, data);
    });
  };

  predictSubmit = () => {
    // console.log("Predict Button Submit");
    if (this.state.csvuploaded && this.state.start_training) {
      var nlpPredict = { type: "nlp", userid: this.state.userid, testdata: this.state.input_txt, size_of_vocab: this.state.size_of_vocab, num_output_nodes: this.state.num_output_nodes }; // Send Trainig resquest to Django
      axios
        .post(`http://34.192.74.163/nlp_predict/`, nlpPredict)
        .then((res) => {
          console.log("Response from django to react:", res);
          console.log(res.data);
          console.log("res.data[prediction]", res.data["prediction"]);
          if (res.status == 200) {
            this.setState({
              prediction: res.data["prediction"],
              nlp_inference_output_ready: true,
            });
          }
          var error = document.getElementById("error_text_prediction");
          error.textContent = "";
        })
        .catch((res) => {
          var error = document.getElementById("error_text_prediction");
          error.textContent = "Something went wrong. Try Again";
          error.style.color = "red";
          alert("Something went wrong or Incorrect Token");
        });
    } else {
      this.setState({ prediction: "", nlp_inference_output_ready: false });
      var error = document.getElementById("error_text_prediction"); // Reference: https://www.geeksforgeeks.org/how-to-display-error-without-alert-box-using-javascript/
      error.textContent = "Finish Step 1 & 2";
      error.style.color = "red";
      alert("Finish Step 1 & 2");
    }
  };
  txtChange = (event) => {
    console.log(event.target.value);
    this.setState({
      input_txt: event.target.value,
      nlp_inference_output_ready: false,
      prediction: "",
    });
  };
  restartnlpClick = (event) => {
    // console.log("window.screen.width", window.screen.width);
    // console.log("window.screen.height", window.screen.height);
    // console.log("NLP Restart click");
    this.setState({
      csvfile: null,
      csvuploaded: false,
      start_training: false,
      nlp_ready: false,
      epoch: "10",
      train_nlp_split: 0.9,
      input_txt: "",
      userid: "",
      copyuserid: "",
      nlp_inference_output_ready: false,
      prediction: "",
      size_of_vocab: 0,
      num_output_nodes: 0,
      train_acc: 0,
      valid_acc: 0,
    });
    this.fileInput.value = ""; // clear filename display from browse.. button
    var txtinput = document.getElementById("txtinput");
    txtinput.value = "";
    var error_text_training = document.getElementById("error_text_training");
    error_text_training.textContent = "";
    var error_text_prediction = document.getElementById("error_text_prediction");
    error_text_prediction.textContent = "";
  };

  fileUpload = (event) => {
    console.log("csv uploaded", event.target.files[0]);
    let gen_username = uuidv4().replace(/-/g, "");
    this.setState({
      csvfile: event.target.files[0],
      csvuploaded: true,
      userid: gen_username,
      nlp_inference_output_ready: false,
      prediction: "",
      nlp_ready: false,
      start_training: false,
      size_of_vocab: 0,
      num_output_nodes: 0,
      train_acc: 0,
      valid_acc: 0,
    });
    var file = event.target.files[0];
    var dirname = "NLP/csv/" + gen_username + "/train.csv";
    this.s3UploadCSV(file, dirname); // Ref: https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-creating-buckets.html

    var error = document.getElementById("error_text_training");
    error.textContent = "";
    var error_text_prediction = document.getElementById("error_text_prediction");
    error_text_prediction.textContent = "";
  };

  trainClick = (event) => {
    console.log("trainClick", event);
    if (this.state.csvuploaded) {
      this.setState({
        start_training: true,
        copyuserid: this.state.userid,
        nlp_inference_output_ready: false,
        prediction: "",
      });

      var nlpData = { type: "nlp", userid: this.state.userid, epoch: this.state.epoch, train_nlp_split: this.state.train_nlp_split }; // Send Trainig resquest to Django
      axios
        .post(`http://34.192.74.163/nlp/`, nlpData)
        .then((res) => {
          console.log("Response from django to react:", res);
          console.log(res.data);
          if (res.status == 200) {
            this.setState({
              nlp_ready: true,
              size_of_vocab: res.data["size_of_vocab"],
              num_output_nodes: res.data["num_output_nodes"],
              train_acc: res.data["train_acc"],
              valid_acc: res.data["valid_acc"],
            });
            var error_text_prediction = document.getElementById("error_text_prediction");
            error_text_prediction.textContent = "";
            var error_text_training = document.getElementById("error_text_training");
            error_text_training.textContent = "";
          }
        })
        .catch((res) => {
          if (res.status == 504) {
            var error_text_training = document.getElementById("Disnnected. Try smaller csv file");
            error_text_training.textContent = "Disnnected. Try smaller csv";
            error_text_training.style.color = "blue";
          } else {
            var error_text_training = document.getElementById("error_text_training");
            error_text_training.textContent = "something went wrong. Try Again";
            error_text_training.style.color = "red";
            alert("something went wrong");
          }
        });
    } else {
      var error = document.getElementById("error_text_training"); // Reference: https://www.geeksforgeeks.org/how-to-display-error-without-alert-box-using-javascript/
      error.textContent = "Finish Step 1";
      error.style.color = "red";
      alert("Finish Step 1");
    }
  };

  renderOutput() {
    if (this.state.nlp_inference_output_ready) {
      return <div>Final Prediction:{this.state.prediction}</div>;
    } else {
      return "";
    }
  }

  renderTrainingStatus() {
    if (this.state.start_training && !this.state.nlp_ready) {
      return <div style={{ color: "#d1ab2e", fontWeight: "bold" }}>Training Started ....</div>;
    } else if (this.state.nlp_ready) {
      return (
        <div style={{ color: "green", fontWeight: "bold" }}>
          Training Done. Training Accuracy:{this.state.train_acc.toFixed(2)} and Test Accuracy:{this.state.valid_acc.toFixed(2)}
        </div>
      );
    } else {
      return "";
    }
  }

  render() {
    return (
      <div className="container">
        <div className="row justify-content-around mx-auto pt-3">
          <h5>
            <span style={{ color: this.state.csvuploaded ? "green" : "gray" }}> 1:Upload CSV file -> </span>
            <span style={{ color: this.state.start_training ? "green" : "gray" }}> 2:Start Training -> </span>
            <span style={{ color: this.state.nlp_ready ? "green" : "gray" }}> 3:Model Ready for Prediction</span>
          </h5>
          {/* <h6>Better to keep 5min gap between new requests as GPU EC2 P2 Instance taking ~5 min to shutdown in rare case</h6> */}
        </div>
        <button type="button" className="btn btn-info btn-lg " onClick={this.restartnlpClick}>
          Reset / Start Again
        </button>
        <div className="row justify-content-start pt-3 pb-1 ">
          <div className="col-*-1">
            <h4>Step 1: Upload CSV file</h4>
          </div>
          <div className="col-*-1 ">
            <span className="csvinfo">&nbsp;(with 2 column "tweets" & "labels")</span>
          </div>
        </div>
        <div className="row justify-content-start">
          <input type="file" id="fileid" accept=".csv" disabled={this.state.csvuploaded} onChange={this.fileUpload} ref={(ref) => (this.fileInput = ref)} />
        </div>
        <div className="row justify-content-start pt-1">
          <a style={{ display: "table-cell" }} target="_blank" href={"https://gist.github.com/AIKungfu/78165116502bc097cf5c721580be3826"}>
            &nbsp;sample .csv file
          </a>
        </div>

        <div className="row justify-content-start pt-4">
          <h4>Step 2: Start Training</h4>
        </div>

        <div className="row justify-content-start pb-1">
          <div className="col-*-2 ">
            <label>
              Epoch:&nbsp;
              <select value={this.state.epoch} onChange={this.epochChange}>
                <option epoch="5">5</option>
                <option epoch="10">10</option>
                <option epoch="15">15</option>
                <option epoch="20">20</option>
                <option epoch="30">30</option>
              </select>
            </label>
          </div>
          <div className="col-*-2 ">
            <label>
              &nbsp; &nbsp;Train_Test_Split:&nbsp;
              <select value={this.state.train_nlp_split} onChange={this.trainsplitnlpChange}>
                <option train_nlp_split="0.90">90:10</option>
                <option train_nlp_split="0.80">80:20</option>
                <option train_nlp_split="0.70">70:30</option>
              </select>
            </label>
          </div>
        </div>

        {/* <button className="btn btn-primary" value="Start training"></button> */}
        <div className="row justify-content-start pb-1">Your token: {this.state.copyuserid}</div>
        <div className="row pl-5 ml-5">
          <input type="submit" className="btn btn-primary" value="Start training" disabled={this.state.start_training} onClick={this.trainClick} />
          <br />
          &nbsp;<span id="error_text_training"></span>
        </div>
        <div className="row justify-content-start">{this.renderTrainingStatus()}</div>
        <div className="row justify-content-start pt-4">
          <h4>Step 3: Prediction</h4>
        </div>

        <div className="row justify-content-start pt-3">
          <input type="text" id="txtinput" onChange={this.txtChange} />
          <button onClick={this.predictSubmit} className="btn btn-primary">
            Predict
          </button>
          <br />
          &nbsp;<span id="error_text_prediction"></span>
        </div>
        <div className="row justify-content-start">{this.renderOutput()}</div>
        <br />
        <div className="row justify-content-start  font-weight-bold">Total Training Time:</div>
        <div className="row justify-content-start">
          <div className="col-*-4">
            <table class="table">
              <thead class="thead-light">
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">First Request</th>
                  <th scope="col">Subsequent Requests</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Boot Time</th>
                  <td>90sec</td>
                  <td>10sec</td>
                </tr>
                <tr>
                  <th scope="row">Training Time</th>
                  <td>90s + GPU training </td>
                  <td>10s + GPU training </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="row justify-content-start font-weight-bold">Recommendation & Tips:</div>
        <div className="text-left mx-auto">
          <ul style={{ margin: 5, padding: 0 }}>
            <li>
              Uploaded CSV file should have 2 coloum
              <ul>
                <li>Column name should be "tweets" & "labels"</li>
                <li>"labels" coloum contain int value & "tweets" contain string</li>
              </ul>
            </li>
            <li>Test acc may not be good if dataset is not enough</li>
            <li>For better accurarcy, increase epoch</li>
          </ul>
        </div>
        <br />
      </div>
    );
  }
}

export default TextClassification;
