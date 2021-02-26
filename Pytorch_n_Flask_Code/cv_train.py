import torch
import os, pickle
import torch.nn as nn
import torch.nn.functional as F
import random

import torch 
import torchvision
from torch.utils.data import Dataset,DataLoader
from torchvision import transforms
import numpy as np
from torch import nn
import torch.nn as nn
import torch.optim as optim
import torchvision.models as models
import os
import json
import boto3
import subprocess
import cv2
import glob
from time import sleep


import albumentations as A 
from albumentations.pytorch import ToTensor


total_images = 0  # Global Variable

# Handling imbalance dataset throguh sampler
def make_weights_for_balanced_classes(train_dataset, num_class):                        
  total_dataset_image = len(train_dataset)
  count = [0] * num_class  
  for idx in range (total_dataset_image):
    image, label = train_dataset[idx]
    count[label] += 1
  print("[INFO]count",count)

  weight_per_class = [0.] * num_class
  N = float(sum(count)) #total_dataset_image in float
  for i in range(num_class):                                                   
    weight_per_class[i] = N/float(count[i]+0.001)
  weight = [0] * total_dataset_image
  print("[INFO]weight_per_class",weight_per_class)

  for idx in range(total_dataset_image):
    image, label = train_dataset[idx]
    weight[idx] = weight_per_class[label]
  return weight 

# define model
def count_parameters(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)

# Count total file in S3 Object
def count_obj_in_S3Bucket(objects):
    num = 0
    for obj in objects:
        num +=1
    return num

def S3_download(user_id):
    s3_bucket = boto3.resource('s3').Bucket('orioncv')
    objects = s3_bucket.objects.filter(Prefix=user_id)

    #----- Wait till uploading done in S3-------
    prev_count = 0
    sleep(4) # 4 sec
    while True:
        count = count_obj_in_S3Bucket(s3_bucket.objects.filter(Prefix=user_id))  #Note: pass new s3_bucket object evertime
        if prev_count == count:
          break
        else:
          print("[INFO]else of while loop")
          prev_count = count
          sleep(4)
    print("out of while loop")
    # -------------------------------

    #---- Start Downloading -------
    global total_images
    total_images = 0
    for obj in objects:
        user_id,class_name,file_name = obj.key.split("/")
        total_images += 1
        if not os.path.exists(user_id):
            os.makedirs(user_id)
        if not os.path.exists(os.path.join(user_id,class_name)):
            os.makedirs(os.path.join(user_id,class_name))
        s3_bucket.download_file(obj.key, obj.key)

def S3_upload(file_name):
    object_name = "CV/models/" + file_name
    src_path = file_name
    bucket = "orioncv"
    s3_client = boto3.client('s3')
    response = s3_client.upload_file(src_path, bucket, object_name)
    print("response",response)

def start_training(mydata,filename):
  user_id = mydata['usertoken']
  root_dir = user_id
  
  # ------------------ 0. Wait till all images are downloaded -------------
  print("[INFO] Waiting for downloaded images")
  while True:
    dataset_count = len(glob.glob(root_dir+"/**/*.jp*",recursive=True))
    sleep(1)
    if total_images == dataset_count:
      sleep(1)
      break
  print("[INFO] Complete downloading")
  print("total images on S3:",total_images)
  print("total downladed from S3",dataset_count)
  # ------------------ 1. Input Parameters------------------------
  training_type = mydata['type']
  user_id = mydata['usertoken']
  num_class = int(mydata['num_class'])
  learningrate = float(mydata['learningrate'])
  optimizer = mydata['optimizer']
  EPOCHS = int(mydata['epoch'])
  pretrainedmodel = mydata['pretrainedmodel']
  split_str = mydata['train_split']
  temp_dict = {"0.9":0.90,'90:10': 0.90, '80:20':0.80, '70:30':0.70}
  train_split = temp_dict[str(split_str)]
  print("cv split_str:",split_str)
  print("train_split:", train_split)

  customModel = mydata['customModel']  # CHANGE
  print("customModel",customModel)
  horizonalFlip = mydata['horizonalFlip']
  rotate = mydata['rotate']
  shift = mydata['shift']
  verticalFlip = mydata['verticalFlip']
  classimbalance = mydata['classimbalance']

  if horizonalFlip:
    p_hf = 0.5
  else:
    p_hf = 0.0

  if rotate:
    p_rt = 0.5
  else:
    p_rt = 0.0

  if shift:
    p_sl = 0.5
  else:
    p_sl = 0.0

  if verticalFlip:
    p_vf = 0.25
  else:
    p_vf = 0.0

  # --------------- 2. Batch Size & Device type --------------------
  batch_size = 36
  use_cuda = torch.cuda.is_available()
  device = torch.device("cuda" if use_cuda else "cpu")

  class CustomDataset(Dataset):
    def __init__(self, image_list, transform):                            
        self.image_list = image_list
        self.transform = transform

    def __len__(self):
        return len(self.image_list)

    def __getitem__(self, idx):
        image_filepath = self.image_list[idx] # e.g. 18700a51c756442eb87e07377ba13fcf/1/6c7853bb7c4a49d0b53e5a9e500e2dc3.jpeg
        # print("image_filepath",image_filepath)
        image = cv2.imread(image_filepath)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        label = int(image_filepath.split("/")[-2]) #e.g. 1
        # print("label",label)
        image = self.transform(image=image)["image"]
        return image, label

  train_albumentations_transform = A.Compose([
              A.HorizontalFlip(p=p_hf),
              A.ShiftScaleRotate (shift_limit=(0.1,0.1),p=p_sl),
              A.ShiftScaleRotate (rotate_limit=(-5, 5),p=p_rt),
              A.VerticalFlip(p=p_vf),
              A.Resize(height=224, width=224, interpolation=1, p=1),
              ToTensor()])
  test_albumentations_transform = A.Compose([
              A.Resize(height=224, width=224, interpolation=1, p=1),
              ToTensor()])
  
  total_train_imgs = int(float(train_split) * total_images)
  # print(root_dir)                                                   #e.g. root_dir ='18700a51c756442eb87e07377ba13fcf'
  total_images_list = glob.glob(root_dir+"/**/*jp*",recursive=True)   #e.g. ['18700a51c756442eb87e07377ba13fcf/1/6c7853bb7c4a49d0b53e5a9e500e2dc3.jpeg', '18700a51c756442eb87e07377ba13fcf/1/83ff93ee75414879946d08fa9816c03e.jpeg', ........ ]
  random.shuffle(total_images_list)
  train_images_list = total_images_list[:total_train_imgs]
  test_images_list  = total_images_list[total_train_imgs:]

  # train_dataset   = CustomDataset(root_dir=root_dir, transform=albumentations_transform)
  train_dataset   = CustomDataset(image_list=train_images_list, transform=train_albumentations_transform)
  test_dataset   = CustomDataset(image_list=test_images_list, transform=test_albumentations_transform)
  test_loader  = torch.utils.data.DataLoader(dataset=test_dataset, batch_size=batch_size, shuffle=False)
  if (classimbalance):
    print("classimbalance",classimbalance)
    weights = make_weights_for_balanced_classes(train_dataset, num_class)                                                                
    weights = torch.DoubleTensor(weights)                                       
    sampler = torch.utils.data.sampler.WeightedRandomSampler(weights, len(weights))   # provide a weight value for each sample in dataset
    train_loader = torch.utils.data.DataLoader(dataset=train_dataset, batch_size=batch_size, sampler=sampler)
  else:
    train_loader = torch.utils.data.DataLoader(dataset=train_dataset, batch_size=batch_size, shuffle=True)

  print("[INFO] Total Train_dataset:",len(train_dataset))
  print("[INFO] Total Test_dataset:",len(test_dataset))

  # ---------------- 4. Define net/model -------------------------
  if (customModel):
    try:
      from Custom import Custom
      mydnn = Custom().to(device)
      total_params = count_parameters(mydnn)
      print(total_params)
      print("removing")
      # os.remove('Custom*') # cause exception
      x = torch.randn(1, 3, 224, 224).to(device)
      custom_correct_define = ( mydnn(x).shape == torch.Size([1,num_class]) )
      if (custom_correct_define and total_params < 62192808 ): # 11689512
        net = mydnn
        print("[INFO] Custom Model selected")
      else:
        net = torch.hub.load('pytorch/vision:v0.6.0', 'resnet18', pretrained=True)
        net.fc = nn.Linear(net.fc.in_features,num_class)
        net = net.to(device)
        print("[INFO] Custom Model Big, So ResNet selected")
    except:
      print("exception")
      net = torch.hub.load('pytorch/vision:v0.6.0', 'resnet18', pretrained=True)
      net.fc = nn.Linear(net.fc.in_features,num_class)
      net = net.to(device)
      print("[INFO] Custom Failed, So ResNet selected")
      # net.fc.out_features = num_class

  else:
    if (pretrainedmodel == 'ResNet'): 
      net = torch.hub.load('pytorch/vision:v0.6.0', 'resnet18', pretrained=True)
      net.fc = nn.Linear(net.fc.in_features,num_class)
      net = net.to(device)
      print("[INFO] ResNet selected")
    else:
      net = torch.hub.load('pytorch/vision:v0.6.0', 'mobilenet_v2', pretrained=True) #MobileNet
      net.classifier[1] = nn.Linear(net.classifier[1].in_features,num_class)
      net = net.to(device)
      print("[INFO] MobilenetV2 selected")

  # --------------- 5. Loss func & Optimizer -------------
  criterion = nn.CrossEntropyLoss()
  if (optimizer == 'SGD'):
    myoptimizer = optim.SGD(net.parameters(), lr=learningrate, momentum=0.9 ) 
  else:
    myoptimizer = optim.Adam(net.parameters(), lr=learningrate)

  from my_train import my_train
  train = my_train()
  from my_test import my_test
  test = my_test()

  # ---------------6. Start Training -------------
  for epoch in range(EPOCHS):
    print("EPOCH:", epoch)
    train(net, device, train_loader, myoptimizer,criterion, epoch)
    training_loss = np.mean(np.array(train.train_losses))
    print("Mean Training_loss for a epoch: ",training_loss)
    print("Training Accurarcy:",100.*train.correct/train.total)
  train_acc = train.train_acc[-1]
  test(net, device, test_loader,criterion, epoch)
  test_acc = test.test_acc[-1]
  
  # ------------- 7. Save Checkpoint -------------
  net.eval()
  with torch.no_grad():
      m = torch.jit.trace(net.to('cpu'), torch.rand(1, 3, 224, 224).to('cpu'))
  m.save(filename)

  # -------------8. Upload S3 --------
  S3_upload(filename)

  # -------------9. Delete Checkpoint & Dataset ---------
  cmd = "rm -rf " + root_dir
  subprocess.run(cmd,shell=True)
  cmd = "rm -rf " + filename
  subprocess.run(cmd,shell=True)
  return train_acc, test_acc

