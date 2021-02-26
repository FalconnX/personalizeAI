import { Component } from "react";
import React from "react";
import Button from "react-bootstrap/Button";

import DLModel from "./DLModel.js";
import Upload from "./Upload.js";
import Training from "./Training.js";
import Inference from "./Inference.js";

class ObjectClassification extends Component {
  constructor(props) {
    super(props);
    this.Upload_ref = React.createRef();
    this.DLModel_ref = React.createRef();
    this.Training_ref = React.createRef();
    this.Inference_ref = React.createRef();
    this.restartClick = this.restartClick.bind(this);
    this.uploadMetaData = this.uploadMetaData.bind(this);
    this.dlmodelMetaData = this.dlmodelMetaData.bind(this);
    this.trainingMetaData = this.trainingMetaData.bind(this);
    this.state = {
      usertoken: "", //Getting from upload.js myuserid
      upload_done: false,
      dlmodel_done: false,
      training_started_done: false,
      model_ready: false,
      train_acc: null,
      test_acc: null,
      num_class: 2,
      train_split: 0.9,
      learningrate: "0.01",
      optimizer: "SGD",
      epoch: "10",
      pretrainedmodel: "ResNet",
      customModel: false,
      customModelfile: null,
      horizonalFlip: false,
      rotate: false,
      shift: false,
      verticalFlip: false,
      classimbalance: false,
    };
  }

  uploadMetaData = (myuserid, upload_done, num_class, train_split) => {
    console.log("get token & upload_done", myuserid, upload_done);
    this.setState({ usertoken: myuserid, upload_done: upload_done, num_class: num_class, train_split: train_split });

    this.setState({ model_ready: false, train_acc: null, test_acc: null });
  };

  dlmodelMetaData = (dlmodel_done, learningrate, optimizer, epoch, pretrainedmodel, customModel, customModelfile, horizonalFlip, rotate, shift, verticalFlip, classimbalance) => {
    console.log("dlmodel_done", dlmodel_done);
    this.setState({
      dlmodel_done: dlmodel_done,
      learningrate: learningrate,
      optimizer: optimizer,
      epoch: epoch,
      pretrainedmodel: pretrainedmodel,
      customModel: customModel,
      customModelfile: customModelfile,
      horizonalFlip: horizonalFlip,
      rotate: rotate,
      shift: shift,
      verticalFlip: verticalFlip,
      classimbalance: classimbalance,
    });

    this.setState({ model_ready: false, train_acc: null, test_acc: null });
  };

  trainingMetaData = (training_started_done, model_ready, train_acc, test_acc) => {
    this.setState({
      training_started_done: training_started_done,
      model_ready: model_ready,
      train_acc: train_acc,
      test_acc: test_acc,
    });
  };

  restartClick = (e) => {
    console.log("restart button pressed");
    console.log("props", this.props);
    this.setState({
      usertoken: "",
      upload_done: false,
      dlmodel_done: false,
      training_started_done: false,
      model_ready: false,
      test_acc: null,
      train_acc: null,
      num_class: 2,
      train_split: 0.9,
      learningrate: "0.01",
      optimizer: "SGD",
      epoch: "10",
      pretrainedmodel: "ResNet",
      customModel: false,
      customModelfile: null,
      horizonalFlip: false,
      rotate: false,
      shift: false,
      verticalFlip: false,
      classimbalance: false,
    });
    this.Upload_ref.current.restartEvent();
    this.DLModel_ref.current.restartEvent();
    this.Training_ref.current.restartEvent();
    this.Inference_ref.current.restartEvent();
  };

  render() {
    return (
      <div className="container">
        <div className="row justify-content-around mx-auto pt-3">
          <h5>
            <span style={{ color: this.state.upload_done ? "green" : "gray" }}> 1:Upload Images -> </span>
            <span style={{ color: this.state.dlmodel_done ? "green" : "gray" }}> 2:Set Model & Params -> </span>
            <span style={{ color: this.state.training_started_done ? "green" : "gray" }}> 3:Start Training -> </span>
            <span style={{ color: this.state.model_ready ? "green" : "gray" }}> 4:Model Ready for Prediction</span>
          </h5>
        </div>
        <div>
          <h5>
            <span style={{ color: "#546356" }}>If already have token, Skip to Step 4</span>
          </h5>
        </div>
        {/* <div className="row justify-content-around mx-auto pt-1 pb-2">Copy your token: {this.state.usertoken}</div> */}
        <button type="button" className="btn btn-info btn-lg " onClick={this.restartClick}>
          Reset / Start again
        </button>
        <div className="row justify-content-around mx-auto pt-4">
          <div className="col-*-6  ">
            <Upload upload_metadata={this.uploadMetaData} ref={this.Upload_ref} />
          </div>

          <div className="col-*-6 ">
            <div className="row justify-content-start">
              <DLModel dlmodel_metadata={this.dlmodelMetaData} upload_done={this.state.upload_done} ref={this.DLModel_ref} />
            </div>
            <br />
            <div className="row justify-content-start">
              <Training
                training_metadata={this.trainingMetaData}
                usertoken={this.state.usertoken}
                upload_done={this.state.upload_done}
                dlmodel_done={this.state.dlmodel_done}
                num_class={this.state.num_class}
                train_split={this.state.train_split}
                learningrate={this.state.learningrate}
                optimizer={this.state.optimizer}
                epoch={this.state.epoch}
                pretrainedmodel={this.state.pretrainedmodel}
                customModel={this.state.customModel}
                customModelfile={this.state.customModelfile}
                horizonalFlip={this.state.horizonalFlip}
                rotate={this.state.rotate}
                classimbalance={this.state.classimbalance}
                shift={this.state.shift}
                verticalFlip={this.state.verticalFlip}
                ref={this.Training_ref}
              />
            </div>
            <br />
            <div className="row justify-content-start">
              <Inference usertoken={this.state.usertoken} model_ready={this.state.model_ready} training_started_done={this.state.training_started_done} ref={this.Inference_ref} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ObjectClassification;
