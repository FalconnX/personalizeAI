import React from "react";
// import S3 from "react-aws-s3";
// import { Alert } from "react-native";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Resizer from "react-image-file-resizer";

class Upload extends React.Component {
  constructor(props) {
    super(props);
    this.fileInput1 = React.createRef();
    this.fileInput2 = React.createRef();
    this.fileInput3 = React.createRef();
    this.fileInput4 = React.createRef();
    this.fileInput5 = React.createRef();
    this.fileInput6 = React.createRef();
    this.fileInput7 = React.createRef();
    this.fileInput8 = React.createRef();
    this.fileInput9 = React.createRef();
    this.fileInput10 = React.createRef();

    this.numclassChange = this.numclassChange.bind(this);
    this.trainsplitChange = this.trainsplitChange.bind(this);
    this.handleClick = this.handleClick.bind(this); // Resize imgs & Upload to AWS S3
    this.class1_Handler = this.class1_Handler.bind(this); // Remove Duplicate imgs
    this.class2_Handler = this.class2_Handler.bind(this);
    this.class3_Handler = this.class3_Handler.bind(this);
    this.class4_Handler = this.class4_Handler.bind(this);
    this.class5_Handler = this.class5_Handler.bind(this);
    this.class6_Handler = this.class6_Handler.bind(this);
    this.class7_Handler = this.class7_Handler.bind(this);
    this.class8_Handler = this.class8_Handler.bind(this);
    this.class9_Handler = this.class9_Handler.bind(this);
    this.class10_Handler = this.class10_Handler.bind(this);

    this.resizeImage = this.resizeImage.bind(this);
    this.resizeImages = this.resizeImages.bind(this);
    this.S3upload = this.S3upload.bind(this);

    this.restartEvent = this.restartEvent.bind(this);

    this.state = {
      num_class: 2,
      train_split: 0.9,
      myuserid: "",
      class1_imgs: [],
      class2_imgs: [],
      class3_imgs: [],
      class4_imgs: [],
      class5_imgs: [],
      class6_imgs: [],
      class7_imgs: [],
      class8_imgs: [],
      class9_imgs: [],
      class10_imgs: [],

      disable3: true,
      disable4: true,
      disable5: true,
      disable6: true,
      disable7: true,
      disable8: true,
      disable9: true,
      disable10: true,
      upload_done: false,
      min_image: 10,
      max_image: 100,
    };
  }

  restartEvent = (event) => {
    this.setState({
      myuserid: "",
      upload_done: false,
      num_class: 2,
      train_split: 0.9,
      class1_imgs: [],
      class2_imgs: [],
      class3_imgs: [],
      class4_imgs: [],
      class5_imgs: [],
      class6_imgs: [],
      class7_imgs: [],
      class8_imgs: [],
      class9_imgs: [],
      class10_imgs: [],
      disable3: true,
      disable4: true,
      disable5: true,
      disable6: true,
      disable7: true,
      disable8: true,
      disable9: true,
      disable10: true,
    });
    console.log("restartEvent of Upload.js");
    var error = document.getElementById("error_upload");
    error.textContent = "";
  };

  trainsplitChange = (event) => {
    event.preventDefault();
    this.setState({ train_split: event.target.value });
    console.log("trainsplit value", event.target.value);
  };

  numclassChange = (event) => {
    event.preventDefault();
    this.setState({ num_class: parseInt(event.target.value) }); // Update num_class state
    this.setState({ disable3: true }); // Default all button disbale except first two
    this.setState({ disable4: true });
    this.setState({ disable5: true });
    this.setState({ disable6: true });
    this.setState({ disable7: true });
    this.setState({ disable8: true });
    this.setState({ disable9: true });
    this.setState({ disable10: true });

    // Activate class upload based on latest num_class value
    if (parseInt(event.target.value) >= 3) {
      this.setState({ disable3: false });
    }
    if (parseInt(event.target.value) >= 4) {
      this.setState({ disable4: false });
    }
    if (parseInt(event.target.value) >= 5) {
      this.setState({ disable5: false });
    }
    if (parseInt(event.target.value) >= 6) {
      this.setState({ disable6: false });
    }
    if (parseInt(event.target.value) >= 7) {
      this.setState({ disable7: false });
    }
    if (parseInt(event.target.value) >= 8) {
      this.setState({ disable8: false });
    }
    if (parseInt(event.target.value) >= 9) {
      this.setState({ disable9: false });
    }
    if (parseInt(event.target.value) >= 10) {
      this.setState({ disable10: false });
    }
    // console.log(typeof this.state.num_class);
    // console.log(this.state.num_class);
  };

  resizeImage = (file) => {
    return new Promise((resolve, reject) => {
      Resizer.imageFileResizer(file, 400, 400, "JPEG", 100, 0, (uri) => resolve(uri), "base64");
    });
  };

  resizeImages = async (files) => {
    let resized = [];
    for (let i = 0; i < files.length; i++) resized.push(this.resizeImage(files[i]));
    // console.log(resized);
    return resized;
  };

  S3upload = (promisefile, classnum) => {
    // console.log("promisefile ", promisefile);
    promisefile.then((result) => {
      // console.log("promisefile value:", result);
      var AWS_ACCESS_KEY = process.env.REACT_APP_AWSAccessKeyId;
      var AWS_SECRET_ACCESS_KEY = process.env.REACT_APP_AWSSecretKey;
      var S3_BUCKET = process.env.REACT_APP_S3_BUCKET;
      // console.log("S3_BUCKET: ", S3_BUCKET);
      // console.log("S3_BUCKET: ", AWS_ACCESS_KEY);

      var AWS = require("aws-sdk");
      var s3 = new AWS.S3({
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      });

      var base64Data = new Buffer.from(result.replace(/^data:image\/\w+;base64,/, ""), "base64");
      var unique_filename = uuidv4().replace(/-/g, "");
      // console.log("keyname: ", keyname);
      var type = result.split(";")[0].split("/")[1];
      var keyname = this.state.myuserid + "/" + classnum + "/" + unique_filename + "." + type;
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
  };

  // Upload to AWS S3 Bucket
  handleClick = (event) => {
    event.preventDefault();
    // var newArr1 = this.fileInput1.current.files;
    // var newArr2 = this.fileInput2.current.files;
    // var newArr3 = this.fileInput3.current.files;
    // var newArr4 = this.fileInput4.current.files;
    // var newArr5 = this.fileInput5.current.files;
    // var newArr6 = this.fileInput6.current.files;
    // var newArr7 = this.fileInput7.current.files;
    // var newArr8 = this.fileInput8.current.files;
    // var newArr9 = this.fileInput9.current.files;
    // var newArr10 = this.fileInput10.current.files;

    // flag = true if min < total_image < max
    // var flag1 = newArr1.length < this.state.max_image && newArr1.length > this.state.min_image;
    // var flag2 = newArr2.length < this.state.max_image && newArr2.length > this.state.min_image;
    // var flag3 = newArr3.length < this.state.max_image && newArr3.length > this.state.min_image;
    // var flag4 = newArr4.length < this.state.max_image && newArr4.length > this.state.min_image;
    // var flag5 = newArr5.length < this.state.max_image && newArr5.length > this.state.min_image;
    // var flag6 = newArr6.length < this.state.max_image && newArr6.length > this.state.min_image;
    // var flag7 = newArr7.length < this.state.max_image && newArr7.length > this.state.min_image;
    // var flag8 = newArr8.length < this.state.max_image && newArr8.length > this.state.min_image;
    // var flag9 = newArr9.length < this.state.max_image && newArr9.length > this.state.min_image;
    // var flag10 = newArr10.length < this.state.max_image && newArr10.length > this.state.min_image;

    var flag1 = this.state.class1_imgs.length <= this.state.max_image && this.state.class1_imgs.length >= this.state.min_image;
    var flag2 = this.state.class2_imgs.length <= this.state.max_image && this.state.class2_imgs.length >= this.state.min_image;
    var flag3 = this.state.class3_imgs.length <= this.state.max_image && this.state.class3_imgs.length >= this.state.min_image;
    var flag4 = this.state.class4_imgs.length <= this.state.max_image && this.state.class4_imgs.length >= this.state.min_image;
    var flag5 = this.state.class5_imgs.length <= this.state.max_image && this.state.class5_imgs.length >= this.state.min_image;
    var flag6 = this.state.class6_imgs.length <= this.state.max_image && this.state.class6_imgs.length >= this.state.min_image;
    var flag7 = this.state.class7_imgs.length <= this.state.max_image && this.state.class7_imgs.length >= this.state.min_image;
    var flag8 = this.state.class8_imgs.length <= this.state.max_image && this.state.class8_imgs.length >= this.state.min_image;
    var flag9 = this.state.class9_imgs.length <= this.state.max_image && this.state.class9_imgs.length >= this.state.min_image;
    var flag10 = this.state.class10_imgs.length <= this.state.max_image && this.state.class10_imgs.length >= this.state.min_image;

    // Create list of all flags
    var flag = [flag1, flag2, flag3, flag4, flag5, flag6, flag7, flag8, flag9, flag10];
    // Initial value of final_flag, true:all imgs for given class are satisfied condition
    var final_flag = true;

    console.log("flag", flag);
    console.log("");

    // Display alert msg if any class imgs are not satisfied condition
    for (let i = 0; i < this.state.num_class; i++) {
      final_flag = flag[i] && final_flag;
      if (!flag[i]) {
        let n = i;
        var error = document.getElementById("error_upload");
        error.textContent = "Upload min 10 & max 100 image for Class:" + n;
        error.style.color = "red";
        alert("Upload min 10 & max 100 image for Class" + n);
        break;
      }
    }

    // Check if all imgs present --> then only upload all on AWS S3
    if (final_flag) {
      console.log("Uploading to AWS S3");
      var error = document.getElementById("error_upload");
      error.textContent = "";
      var error_dlmodel = document.getElementById("error_dlmodel");
      error_dlmodel.textContent = "";
      var error_training = document.getElementById("error_training");
      error_training.textContent = "";

      var classdict = {
        class1: this.state.class1_imgs,
        class2: this.state.class2_imgs,
        class3: this.state.class3_imgs,
        class4: this.state.class4_imgs,
        class5: this.state.class5_imgs,
        class6: this.state.class6_imgs,
        class7: this.state.class7_imgs,
        class8: this.state.class8_imgs,
        class9: this.state.class9_imgs,
        class10: this.state.class10_imgs,
      };

      console.log(this.state.class1_imgs[0]);

      var classdict_values = Object.values(classdict); // All value of classdict dictonary in list style / dict values
      let gen_username = uuidv4().replace(/-/g, ""); // Create Unique User ID
      this.setState({ myuserid: gen_username, upload_done: true }, () => {
        this.props.upload_metadata(this.state.myuserid, this.state.upload_done, this.state.num_class, this.state.train_split);
      });

      for (let i = 0; i < this.state.num_class; i++) {
        // Each class

        // var promiseA = this.resizeImages(classdict_values[i]);
        for (let img = 0; img < classdict_values[i].length; img++) {
          //Every image file for given class
          var promisefile = this.resizeImage(classdict_values[i][img]); // CHANGE HERE
          var classnum = i;
          let status = this.S3upload(promisefile, classnum);
        }
      }
    }

    // console.log(newArr[0].size)
    // for (let i = 0; i < newArr.length; i++) {
    //   handleUpload(newArr[i]);
    // }
    // axios
    //   .post(`http://34.192.74.163/request/`, {
    //     myreact: "Hello msg from React app",
    //   })
    //   .then((res) => {
    //     console.log(res);
    //     console.log(res.data);
    //   });
  };

  class1_Handler = (e) => {
    var tmp1_class = [...this.state.class1_imgs, ...e.target.files];
    var tmp2_class = tmp1_class.filter((ele, ind) => ind === tmp1_class.findIndex((elem) => elem.size === ele.size));
    this.setState({
      class1_imgs: tmp2_class,
    });
  };
  class2_Handler = (e) => {
    var tmp1_class = [...this.state.class2_imgs, ...e.target.files];
    var tmp2_class = tmp1_class.filter((ele, ind) => ind === tmp1_class.findIndex((elem) => elem.size === ele.size));
    this.setState({
      class2_imgs: tmp2_class,
    });
  };
  class3_Handler = (e) => {
    var tmp1_class = [...this.state.class3_imgs, ...e.target.files];
    var tmp2_class = tmp1_class.filter((ele, ind) => ind === tmp1_class.findIndex((elem) => elem.size === ele.size));
    this.setState({
      class3_imgs: tmp2_class,
    });
  };
  class4_Handler = (e) => {
    var tmp1_class = [...this.state.class4_imgs, ...e.target.files];
    var tmp2_class = tmp1_class.filter((ele, ind) => ind === tmp1_class.findIndex((elem) => elem.size === ele.size));
    this.setState({
      class4_imgs: tmp2_class,
    });
  };
  class5_Handler = (e) => {
    var tmp1_class = [...this.state.class5_imgs, ...e.target.files];
    var tmp2_class = tmp1_class.filter((ele, ind) => ind === tmp1_class.findIndex((elem) => elem.size === ele.size));
    this.setState({
      class5_imgs: tmp2_class,
    });
  };
  class6_Handler = (e) => {
    var tmp1_class = [...this.state.class6_imgs, ...e.target.files];
    var tmp2_class = tmp1_class.filter((ele, ind) => ind === tmp1_class.findIndex((elem) => elem.size === ele.size));
    this.setState({
      class6_imgs: tmp2_class,
    });
  };
  class7_Handler = (e) => {
    var tmp1_class = [...this.state.class7_imgs, ...e.target.files];
    var tmp2_class = tmp1_class.filter((ele, ind) => ind === tmp1_class.findIndex((elem) => elem.size === ele.size));
    this.setState({
      class7_imgs: tmp2_class,
    });
  };
  class8_Handler = (e) => {
    var tmp1_class = [...this.state.class8_imgs, ...e.target.files];
    var tmp2_class = tmp1_class.filter((ele, ind) => ind === tmp1_class.findIndex((elem) => elem.size === ele.size));
    this.setState({
      class8_imgs: tmp2_class,
    });
  };
  class9_Handler = (e) => {
    var tmp1_class = [...this.state.class9_imgs, ...e.target.files];
    var tmp2_class = tmp1_class.filter((ele, ind) => ind === tmp1_class.findIndex((elem) => elem.size === ele.size));
    this.setState({
      class9_imgs: tmp2_class,
    });
  };
  class10_Handler = (e) => {
    var tmp1_class = [...this.state.class10_imgs, ...e.target.files];
    var tmp2_class = tmp1_class.filter((ele, ind) => ind === tmp1_class.findIndex((elem) => elem.size === ele.size));
    this.setState({
      class10_imgs: tmp2_class,
    });
  };

  render() {
    return (
      <React.Fragment>
        <form className="upload-steps" onSubmit={this.handleClick}>
          <div className="row  justify-content-start ">
            <h4>
              Step 1: Upload JPEG Images
              <h6>
                (min: {this.state.min_image} to max:{this.state.max_image})
              </h6>
            </h4>
          </div>
          <div className="row  justify-content-start ">
            <div className="col-*-2 ">
              <label>
                No of Class:&nbsp;
                <select value={this.state.num_class} onChange={this.numclassChange}>
                  <option num_class="2">2</option>
                  <option num_class="3">3</option>
                  <option num_class="4">4</option>
                  <option num_class="5">5</option>
                  <option num_class="6">6</option>
                  <option num_class="7">7</option>
                  <option num_class="8">8</option>
                  <option num_class="9">9</option>
                  <option num_class="10">10</option>
                </select>
              </label>
            </div>

            <div className="col-*-2 ">
              <label>
                &nbsp;Train_Test_Split:&nbsp;
                <select value={this.state.train_split} onChange={this.trainsplitChange}>
                  <option train_split="0.90">90:10</option>
                  <option train_split="0.80">80:20</option>
                  <option train_split="0.70">70:30</option>
                </select>
              </label>
            </div>
          </div>
          <div className="row justify-content-between start ">
            <label>
              Class 0:
              <input type="file" id="class1" accept="image/jpeg" className="visually-hidden" onChange={this.class1_Handler} multiple ref={this.fileInput1} />
              <button class="btn btn-secondary " type="button" style={{ height: "70%" }}>
                <label htmlFor="class1"> Select Images </label>
              </button>
              &nbsp;selected unique images {this.state.class1_imgs.length}
            </label>
            <br />
          </div>
          <div className="row justify-content-between start">
            <label>
              Class 1:
              <input type="file" id="class2" accept="image/jpeg" className="visually-hidden" onChange={this.class2_Handler} multiple ref={this.fileInput2} />
              <button class="btn btn-secondary " type="button" style={{ height: "70%" }}>
                <label htmlFor="class2"> Select Images </label>
              </button>
              &nbsp;selected unique images {this.state.class2_imgs.length}
            </label>
            <br />
          </div>
          <div className="row justify-content-between start">
            <label>
              Class 2:
              <input type="file" id="class3" accept="image/jpeg" className="visually-hidden" disabled={this.state.disable3} onChange={this.class3_Handler} multiple ref={this.fileInput3} />
              <button class="btn btn-secondary " type="button" style={{ height: "70%" }} disabled={this.state.disable3}>
                <label htmlFor="class3"> Select Images </label>
              </button>
              &nbsp;selected unique images {this.state.class3_imgs.length}
            </label>
            <br />
          </div>
          <div className="row justify-content-between start">
            <label>
              Class 3:
              <input type="file" id="class4" accept="image/jpeg" className="visually-hidden" disabled={this.state.disable4} onChange={this.class4_Handler} multiple ref={this.fileInput4} />
              <button class="btn btn-secondary " type="button" style={{ height: "70%" }} disabled={this.state.disable4}>
                <label htmlFor="class4"> Select Images </label>
              </button>
              &nbsp;selected unique images {this.state.class4_imgs.length}
            </label>
            <br />
          </div>
          <div className="row justify-content-between start">
            <label>
              Class 4:
              <input type="file" id="class5" accept="image/jpeg" className="visually-hidden" disabled={this.state.disable5} onChange={this.class5_Handler} multiple ref={this.fileInput5} />
              <button class="btn btn-secondary " type="button" style={{ height: "70%" }} disabled={this.state.disable5}>
                <label htmlFor="class5"> Select Images </label>
              </button>
              &nbsp;selected unique images {this.state.class5_imgs.length}
            </label>
            <br />
          </div>
          <div className="row justify-content-between start">
            <label>
              Class 5:
              <input type="file" id="class6" accept="image/jpeg" className="visually-hidden" disabled={this.state.disable6} onChange={this.class6_Handler} multiple ref={this.fileInput6} />
              <button class="btn btn-secondary " type="button" style={{ height: "70%" }} disabled={this.state.disable6}>
                <label htmlFor="class6"> Select Images </label>
              </button>
              &nbsp;selected unique images {this.state.class6_imgs.length}
            </label>
            <br />
          </div>
          <div className="row justify-content-between start">
            <label>
              Class 6:
              <input type="file" id="class7" accept="image/jpeg" className="visually-hidden" disabled={this.state.disable7} onChange={this.class7_Handler} multiple ref={this.fileInput7} />
              <button class="btn btn-secondary " type="button" style={{ height: "70%" }} disabled={this.state.disable7}>
                <label htmlFor="class7"> Select Images </label>
              </button>
              &nbsp;selected unique images {this.state.class7_imgs.length}
            </label>
            <br />
          </div>
          <div className="row justify-content-between start">
            <label>
              Class 7:
              <input type="file" id="class8" accept="image/jpeg" className="visually-hidden" disabled={this.state.disable8} onChange={this.class8_Handler} multiple ref={this.fileInput8} />
              <button class="btn btn-secondary " type="button" style={{ height: "70%" }} disabled={this.state.disable8}>
                <label htmlFor="class8"> Select Images </label>
              </button>
              &nbsp;selected unique images {this.state.class8_imgs.length}
            </label>
            <br />
          </div>
          <div className="row justify-content-between start">
            <label>
              Class 8:
              <input type="file" id="class9" accept="image/jpeg" className="visually-hidden" disabled={this.state.disable9} onChange={this.class9_Handler} multiple ref={this.fileInput9} />
              <button class="btn btn-secondary " type="button" style={{ height: "70%" }} disabled={this.state.disable9}>
                <label htmlFor="class9"> Select Images </label>
              </button>
              &nbsp;selected unique images {this.state.class9_imgs.length}
            </label>
            <br />
          </div>
          <div className="row justify-content-between start">
            <label>
              Class 9:
              <input type="file" id="class10" accept="image/jpeg" className="visually-hidden" disabled={this.state.disable10} onChange={this.class10_Handler} multiple ref={this.fileInput10} />
              <button class="btn btn-secondary " type="button" style={{ height: "70%" }} disabled={this.state.disable10}>
                <label htmlFor="class10"> Select Images </label>
              </button>
              &nbsp;selected unique images {this.state.class10_imgs.length}
            </label>
            <br />
          </div>
          <button type="submit" className="btn btn-primary" disabled={this.state.upload_done}>
            Upload
          </button>
          <br />
          &nbsp;<span id="error_upload"></span>
          <div className="row justify-content-start font-weight-bold">Total Training Time:</div>
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
          <div className="row justify-content-start font-weight-bold">
            <label>Features:</label> <br />
          </div>
          <div>
            <label className="row justify-content-start">
              <input type="checkbox" style={{ marginRight: 10 }} defaultChecked={true} disabled={true} />
              Custom Model
            </label>
          </div>
          <div>
            <label className="row justify-content-start">
              <input type="checkbox" style={{ marginRight: 10 }} defaultChecked={true} disabled={true} />
              HyperParamer Tuning
            </label>
          </div>
          <div>
            <label className="row justify-content-start">
              <input type="checkbox" style={{ marginRight: 10 }} defaultChecked={true} disabled={true} />
              Handle Class Imbalance
            </label>
          </div>
          <div>
            <label className="row justify-content-start">
              <input type="checkbox" style={{ marginRight: 10 }} defaultChecked={true} disabled={true} />
              Concurrent Requests Handling
            </label>
          </div>
          <div>
            <label className="row justify-content-start">
              <input type="checkbox" style={{ marginRight: 10 }} defaultChecked={true} disabled={true} />
              Error Handling
            </label>
          </div>
          <div>
            <label className="row justify-content-start font-weight-bold" style={{ color: "#42cef5" }}>
              <input type="checkbox" style={{ marginRight: 10 }} defaultChecked={true} disabled={true} />
              Fast, Robust, Scalable & Customizable
            </label>
          </div>
          <br />
          <div className="row justify-content-start font-weight-bold">Recommendation & Tips:</div>
          <div className="text-left mx-auto">
            <ul style={{ margin: 5, padding: 0 }}>
              <li>lr 0.01 or less for SGD</li>
              <li>lr 0.001 or less for ADAM</li>
              <li>Carefully use VerticalFlip & Rotate. May cause bad accuracy</li>
              <li>
                If uploading custom model
                <ul>
                  <li>Go through sample code by clicking on link</li>
                  <li>Read rule mentioned in sample code</li>
                  <li>In case of error, ResNet18 will be chosen by default</li>
                </ul>
              </li>
              <li>Test acc may not be good if dataset big not enough</li>
            </ul>
          </div>
          <br />
          {/* <ul>
              <li>Coffee</li>
              <li>Tea</li>
              <li>Milk</li>
            </ul> */}
        </form>
      </React.Fragment>
    );
  }
}
export default Upload;
