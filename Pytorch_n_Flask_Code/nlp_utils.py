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
import torch.optim as optim

# AWS S3 Credentials
AWS_ACCESS_KEY_ID = 'KEY_ID'
AWS_SECRET_ACCESS_KEY = 'ACCESS_KEY'
AWS_S3_BUCKET = 'S3_BUCKET'

# define model
class classifier(nn.Module):

    # Define all the layers used in model
    def __init__(self, vocab_size, embedding_dim, hidden_dim, output_dim, n_layers, dropout):
        super().__init__()

        # Embedding layer
        self.embedding = nn.Embedding(vocab_size, embedding_dim)

        # LSTM layer
        self.encoder = nn.LSTM(embedding_dim,
                               hidden_dim,
                               num_layers=n_layers,
                               dropout=dropout,
                               batch_first=True)
        # try using nn.GRU or nn.RNN here and compare their performances
        # try bidirectional and compare their performances

        # Dense layer
        self.fc = nn.Linear(hidden_dim, output_dim)

    def forward(self, text, text_lengths):
        # text = [batch size, sent_length]
        embedded = self.embedding(text)
        # embedded = [batch size, sent_len, emb dim]

        # packed sequence
        packed_embedded = nn.utils.rnn.pack_padded_sequence(embedded, text_lengths.cpu(), batch_first=True)

        packed_output, (hidden, cell) = self.encoder(packed_embedded)
        # hidden = [batch size, num layers * num directions,hid dim]
        # cell = [batch size, num layers * num directions,hid dim]

        # Hidden = [batch size, hid dim * num directions]
        dense_outputs = self.fc(hidden)

        # Final activation function softmax
        output = F.softmax(dense_outputs[0], dim=1)

        return output

# No. of trianable parameters
def count_parameters(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


# define metric
def binary_accuracy(preds, y):
    # round predictions to the closest integer
    _, predictions = torch.max(preds, 1)

    correct = (predictions == y).float()
    acc = correct.sum() / len(correct)
    return acc


# train loop
def train(model, iterator, optimizer, criterion):
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


#evaluate loop
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

