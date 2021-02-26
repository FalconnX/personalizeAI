''' 
pip3 install opencv-python
sudo apt install libgl1-mesa-glx
'''
# import sys
# sys.path.append('/home/ubuntu/.local/lib/python3.8/site-packages/')

import torchvision

# Import CV library
from cv_train import * 
from nlp_train import * 

# Flask Libraries
from flask import Flask, jsonify, request, redirect, render_template

app = Flask(__name__)
app.secret_key = "secret key"

# URL Routes
@app.route('/')
def index():
    return jsonify({
            "msg" : "i am running man"
        })
#     return render_template('home.html')

# Object Classification / CV 
@app.route('/', methods=['POST'])
def cv_predict():
      if request.method == 'POST':
        print(request)
        print("request.content_type",request.content_type)
        # print("request data",request.data)
        print("request json",request.json)
        if ("multipart/form-data" in request.content_type):
          print(request.files['file'])
          print(dir(request.files['file']))
          if (os.path.isfile('./Custom.py') ): # Remove old file
            os.remove('./Custom.py')
          request.files['file'].save('Custom.py')
          return jsonify({
            "msg" : "Got Custom Model"
          })
        
        if ("application/json" in request.content_type ):
          datadict = json.loads(request.json)
          S3_download(datadict["usertoken"]) # Download Dataset
          sleep(5)
          filename = "model_"+ datadict["usertoken"] + ".pt"
          train_acc, test_acc = start_training(datadict,filename) # Train & upload model.pt on S3
          return jsonify({
            "train_acc" : train_acc, 
            "test_acc" : test_acc
        })

# Text Classification / NLP
@app.route('/nlp_train', methods=['POST'])
def nlp_predict():
    if request.method == 'POST':
        print("NLP Request JSON",request.json)
        userid = request.json['userid']
        epoch = int(request.json['epoch'])
        split_str = request.json['train_nlp_split']
        print("split_str",split_str)
        temp_dict = {"0.9":0.90,'90:10': 0.90, '80:20':0.80, '70:30':0.70}
        train_nlp_split = temp_dict[str(split_str)]
        print("train_nlp_split",train_nlp_split)
        size_of_vocab, num_output_nodes, train_acc, valid_acc = training_nlp_task(userid=userid,N_EPOCHS=epoch, train_split=train_nlp_split)
        S3_upload('tokenizer.pkl',userid)
        S3_upload('saved_weights.pt',userid)
        
    return jsonify({'size_of_vocab':size_of_vocab,
                    'num_output_nodes':num_output_nodes,
                    'train_acc':train_acc*100,
                    'valid_acc':valid_acc*100})

if __name__ == "__main__":
    app.run(host='0.0.0.0')