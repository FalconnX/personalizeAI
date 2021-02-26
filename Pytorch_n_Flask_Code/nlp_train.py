# Import Libraries
import boto3
import io
import pandas as pd
import random
import os, pickle
import torch, torchtext
from torchtext import data
import torch.nn as nn
import torch.nn.functional as F
import subprocess
from nlp_utils import *
from time import sleep

# Flask Libraries
from flask import Flask, jsonify, request, redirect, render_template
import os, pickle

def training_nlp_task(userid,N_EPOCHS=10, train_split=0.8, batch_size=32 ):
    # Manual Seed
    SEED = 43
    torch.manual_seed(SEED)

    # Download dataset
    keyname = "NLP/csv/" + userid + "/train.csv"
    s3 = boto3.client('s3', aws_access_key_id= AWS_ACCESS_KEY_ID,
                    aws_secret_access_key= AWS_SECRET_ACCESS_KEY)
    try:
        sleep(1)
        obj = s3.get_object(Bucket=AWS_S3_BUCKET, Key=keyname)
    except:
        print("except")
        sleep(5)
        obj = s3.get_object(Bucket=AWS_S3_BUCKET, Key=keyname)

    df = pd.read_csv(io.BytesIO(obj['Body'].read()))

    # s3 = boto3.client('s3', aws_access_key_id= 'AKIAJQ4G7Y5I3HD33SMA',
    #                 aws_secret_access_key= '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')
    # obj = s3.get_object(Bucket='tsaibucket', Key='tweets.csv')
    # df = pd.read_csv(io.BytesIO(obj['Body'].read()))

    print(df.shape)
    print(df.labels.value_counts())

    # Defining Fields

    Tweet = data.Field(sequential = True, tokenize = 'spacy', batch_first =True, include_lengths=True)
    Label = data.LabelField(tokenize ='spacy', is_target=True, batch_first =True, sequential =False)
    fields = [('tweets', Tweet),('labels',Label)]
    example = [data.Example.fromlist([df.tweets[i],df.labels[i]], fields) for i in range(df.shape[0])]
    twitterDataset = data.Dataset(example, fields)
    (train, valid) = twitterDataset.split(split_ratio=[train_split, 1-train_split], random_state=random.seed(SEED))
    print((len(train), len(valid)))

    print(vars(train.examples[10]))

    Tweet.build_vocab(train)
    Label.build_vocab(train)

    print('Size of input vocab : ', len(Tweet.vocab))
    print('Size of label vocab : ', len(Label.vocab))
    print('Top 10 words appreared repeatedly :', list(Tweet.vocab.freqs.most_common(10)))
    print('Labels : ', Label.vocab.stoi)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    train_iterator, valid_iterator = data.BucketIterator.splits((train, valid), batch_size = batch_size,
                                                                sort_key = lambda x: len(x.tweets),
                                                                sort_within_batch=True, device = device)

    # with open('/home/ubuntu/maulik/tweetsa/models/tokenizer.pkl', 'wb') as tokens:
    #     pickle.dump(Tweet.vocab.stoi, tokens)

    if (not os.path.isdir('/home/ubuntu/maulik/models')):
        cmd = 'mkdir /home/ubuntu/maulik/models'
        subprocess.run(cmd,shell=True)
    
    with open('/home/ubuntu/maulik/models/tokenizer.pkl', 'wb') as tokens:
        pickle.dump(Tweet.vocab.stoi, tokens)

    # Define hyperparameters
    size_of_vocab = len(Tweet.vocab)
    embedding_dim = 300
    num_hidden_nodes = 100
    num_output_nodes = len(Label.vocab)
    num_layers = 2
    dropout = 0.2

    # Instantiate the model
    model = classifier(size_of_vocab, embedding_dim, num_hidden_nodes, num_output_nodes, num_layers, dropout = dropout)
    print(model)

    print(f'The model has {count_parameters(model):,} trainable parameters')

    import torch.optim as optim

    # define optimizer and loss
    optimizer = optim.Adam(model.parameters(), lr=2e-4)
    criterion = nn.CrossEntropyLoss()


    # push to cuda if available
    model = model.to(device)
    criterion = criterion.to(device)

    best_valid_loss = float('inf')

    for epoch in range(N_EPOCHS):

        # train the model
        train_loss, train_acc = train_model(model, train_iterator, optimizer, criterion)

        # evaluate the model
        valid_loss, valid_acc = evaluate(model, valid_iterator, criterion)

        # save the best model
        if valid_loss < best_valid_loss:
            best_valid_loss = valid_loss
            # torch.save(model.state_dict(), '/home/ubuntu/maulik/tweetsa/models/saved_weights.pt')

        print(f'\tTrain Loss: {train_loss:.3f} | Train Acc: {train_acc * 100:.2f}%')
        print(f'\t Val. Loss: {valid_loss:.3f} |  Val. Acc: {valid_acc * 100:.2f}% \n')
    torch.save(model.state_dict(), '/home/ubuntu/maulik/models/saved_weights.pt')
    return size_of_vocab,num_output_nodes,train_acc,valid_acc

def train_model(model, iterator, optimizer, criterion):
    
    # initialize every epoch 
    epoch_loss = 0
    epoch_acc = 0
    
    # set the model in training phase
    model.train()  
    
    for batch in iterator:
        
        # resets the gradients after every batch
        optimizer.zero_grad()   
        
        # retrieve text and no. of words
        tweet, tweet_lengths = batch.tweets   
        
        # convert to 1D tensor
        predictions = model(tweet, tweet_lengths).squeeze()  
        
        # compute the loss
        loss = criterion(predictions, batch.labels)        
        
        # compute the binary accuracy
        acc = binary_accuracy(predictions, batch.labels)   
        
        # backpropage the loss and compute the gradients
        loss.backward()       
        
        # update the weights
        optimizer.step()      
        
        # loss and accuracy
        epoch_loss += loss.item()  
        epoch_acc += acc.item()    
        
    return epoch_loss / len(iterator), epoch_acc / len(iterator)

def evaluate(model, iterator, criterion):
    
    # initialize every epoch
    epoch_loss = 0
    epoch_acc = 0

    # deactivating dropout layers
    model.eval()
    
    # deactivates autograd
    with torch.no_grad():
    
        for batch in iterator:
        
            # retrieve text and no. of words
            tweet, tweet_lengths = batch.tweets
            
            # convert to 1d tensor
            predictions = model(tweet, tweet_lengths).squeeze()
            
            # compute loss and accuracy
            loss = criterion(predictions, batch.labels)
            acc = binary_accuracy(predictions, batch.labels)
            
            # keep track of loss and accuracy
            epoch_loss += loss.item()
            epoch_acc += acc.item()
        
    return epoch_loss / len(iterator), epoch_acc / len(iterator)

def S3_upload(file_name,userid):
    file_locate = '/home/ubuntu/maulik/models/'+file_name
    object_name = 'NLP/models/' + userid + "/" + file_name
    bucket = "orioncv"
    s3_client = boto3.client('s3')
    response = s3_client.upload_file(file_locate, bucket, object_name)
    print("response",response)
