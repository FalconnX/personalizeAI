import { Component } from "react";
import React from "react";
import axios from "axios";
import Resizer from "react-image-file-resizer";
import { v4 as uuidv4 } from "uuid";

class Inference extends Component {
  constructor(props) {
    super(props);
    this.state = {
      uploadimg: null,
      imgobjectURL: null,
      userid: this.props.usertoken,
      newtoken: "",
      newtokenSubmited: "",
      inference_ready: false,
      img_name: "",
      prediction: null,
    };
    this.restartEvent = this.restartEvent.bind(this);
    this.uploadimgChage = this.uploadimgChage.bind(this);
    this.predictClick = this.predictClick.bind(this);
    this.resizeImage = this.resizeImage.bind(this);
    this.newtokenChange = this.newtokenChange.bind(this);
    this.newtokenSubmit = this.newtokenSubmit.bind(this);
    this.renderOutput = this.renderOutput.bind(this);
  }
  newtokenChange = (event) => {
    this.setState({ newtoken: event.target.value });
  };

  newtokenSubmit = (event) => {
    event.preventDefault();
    this.setState({
      userid: this.state.newtoken,
      newtokenSubmited: this.state.newtoken,
    });
    var newTokenUpdate = document.getElementById("newTokenUpdate");
    newTokenUpdate.textContent = "New Token: " + this.state.newtoken;
    newTokenUpdate.style.color = "green";
    var noImgWarning = document.getElementById("noImgWarning");
    noImgWarning.textContent = "";
  };

  resizeImage = (file) => {
    return new Promise((resolve, reject) => {
      Resizer.imageFileResizer(file, 400, 400, "JPEG", 100, 0, (uri) => resolve(uri), "base64");
    });
  };

  restartEvent = (event) => {
    // console.log("restartEvent of Inference.js");
    this.setState({
      uploadimg: null,
      imgobjectURL: null,
      userid: this.props.usertoken,
      newtoken: "",
      newtokenSubmited: "",
      inference_ready: false,
      prediction: null,
      img_name: "",
    });
    var fileinput = document.getElementById("fileinput");
    fileinput.textContent = "";
    fileinput.value = null;
    var txtinput = document.getElementById("tokentxt");
    txtinput.value = "";
    var newTokenUpdate = document.getElementById("newTokenUpdate");
    newTokenUpdate.textContent = "";
    var noImgWarning = document.getElementById("noImgWarning");
    noImgWarning.textContent = "";
  };

  uploadimgChage = (event) => {
    event.preventDefault();
    // console.log("this.state.userid", this.state.userid);
    if (this.state.newtokenSubmited == "") {
      this.setState({ userid: this.props.usertoken });
    }
    this.setState({
      uploadimg: event.target.files[0],
      imgobjectURL: URL.createObjectURL(event.target.files[0]),
      inference_ready: false,
      prediction: null,
      img_name: uuidv4().replace(/-/g, "") + ".jpg",
    });
    var noImgWarning = document.getElementById("noImgWarning");
    noImgWarning.textContent = "";
    console.log("inference event.target.files[0]", event.target.files[0]);
    console.log("newtoken", this.state.newtoken);
    console.log("userid", this.state.userid);
    // } else {
    //   var noImgWarning = document.getElementById("noImgWarning");
    //   noImgWarning.textContent = "Train model / Enter Valid Token";
    //   noImgWarning.style.color = "red";
    //   var fileinput = document.getElementById("fileinput");
    //   fileinput.value = "";
    // }
  };

  predictClick = (event) => {
    event.preventDefault();
    if (this.state.uploadimg != null) {
      console.log("predictsubmit", event);
      var noImgWarning = document.getElementById("noImgWarning");
      noImgWarning.textContent = "";
      this.setState({
        inference_ready: false,
        prediction: null,
      });
      var promisefile = this.resizeImage(this.state.uploadimg);
      var unique_filename;
      promisefile.then((result) => {
        var AWS_ACCESS_KEY = process.env.REACT_APP_AWSAccessKeyId;
        var AWS_SECRET_ACCESS_KEY = process.env.REACT_APP_AWSSecretKey;
        var S3_BUCKET = process.env.REACT_APP_S3_BUCKET;
        var AWS = require("aws-sdk");
        var s3 = new AWS.S3({
          accessKeyId: AWS_ACCESS_KEY,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        });

        var base64Data = new Buffer.from(result.replace(/^data:image\/\w+;base64,/, ""), "base64");
        var type = result.split(";")[0].split("/")[1];
        console.log("type", type);
        console.log("result", result);
        unique_filename = this.state.img_name;
        // var keyname = this.state.myuserid + "/" + classnum + "/" + filename + "." + type;
        // var keyname = "CV/predict/" + this.props.usertoken + "/" + unique_filename;
        var keyname = "CV/predict/" + this.state.userid + "/" + unique_filename;
        var params = {
          Bucket: S3_BUCKET,
          Key: keyname,
          // Key: `${userId}.${type}`, // type is not required
          ACL: "private",
          Body: base64Data,
          // ACL: "public-read",
          ContentEncoding: "base64", // required
          ContentType: `image/${type}`, // required. Notice the back ticks
        };

        try {
          let status = s3.upload(params).promise();
        } catch (error) {
          alert(error);
        }
      });

      var formData = new FormData();
      // formData.append("image", this.state.uploadimg);
      // formData.append("userid", this.props.usertoken);
      var jsonData = {
        // image: this.state.uploadimg,
        userid: this.state.userid,
        imageName: this.state.img_name,
      };
      console.log("jsonData", jsonData);

      axios
        .post(`http://34.192.74.163/cv_predict/`, jsonData, {
          headers: {
            // "Content-Type": "multipart/form-data",
            "Content-Type": "application/json",
          },
        })
        .then((res) => {
          console.log("Response from django to react:", res);
          if (res.status == 200) {
            this.setState({ inference_ready: true, prediction: res.data["prediction"] });
          }
          console.log("res.data", res.data);
          console.log("cv prediction", res.data["prediction"]);
        })
        .catch((error) => {
          var noImgWarning = document.getElementById("noImgWarning");
          noImgWarning.textContent = "Some Wrong or Incorrect Token";
          noImgWarning.style.color = "red";
          alert("Some Wrong or Incorrect Token");
        });
    } else {
      var noImgWarning = document.getElementById("noImgWarning");
      noImgWarning.textContent = "upload image";
      noImgWarning.style.color = "red";
      alert("upload image");
    }
  };
  //style={{ width: 224, aspectRatio: 1 }}
  // <div className="row justify-content-around pt-4 pb-5">
  // </div>
  renderOutput() {
    if (this.state.inference_ready) {
      return (
        <div className="row mt-5">
          <div className="col">
            <div className="card mx-auto" style={{ width: "15rem" }}>
              <img className="card-img-top" src={this.state.imgobjectURL} />
            </div>
            <div className="card-body">
              <h5 className="card-title">Prediction</h5>
              <p className="card-text">class{this.state.prediction}</p>
            </div>
          </div>
        </div>
      );
    } else {
      return "";
    }
  }

  render() {
    return (
      <React.Fragment>
        <form>
          <div className="row justify-content-start pt-0 pb-0">
            <h3> Step 4: Enter Saved Token for Inference </h3>
          </div>
          <div className="row justify-content-around pt-1">
            <input type="text-lg" id="tokentxt" className="tokeninput" placeholder={this.props.usertoken} disabled={this.props.training_started_done} onChange={this.newtokenChange} />

            <button onClick={this.newtokenSubmit} className="btn btn-primary" disabled={this.props.training_started_done}>
              ChangeToken
            </button>
          </div>
          <div className="row justify-content-start">
            &nbsp;<span id="newTokenUpdate"></span>
          </div>

          <div className="row justify-content-start pt-1.5 pb-0">
            <h3> Step 5: Prediction </h3>
          </div>
          <div className="row justify-content-start pt-1 pb-0">
            <input type="file" id="fileinput" accept="image/jpeg" disabled={this.state.newtoken === "" && this.props.model_ready === false} onChange={this.uploadimgChage} />
            <button onClick={this.predictClick} className="btn btn-primary">
              Predict
            </button>
          </div>
          <div className="row justify-content-centre">
            &nbsp;<span id="noImgWarning"></span>
          </div>
          {this.renderOutput()}
          <div className="row justify-content-start pt-5 pb-5"></div>
        </form>
      </React.Fragment>
    );
  }
}
export default Inference;
