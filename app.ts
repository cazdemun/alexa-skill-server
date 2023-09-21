import express from 'express';
import bodyParser from 'body-parser';
import * as Alexa from 'ask-sdk-core';
import * as https from 'https';
import * as fs from 'fs';
import { IntentRequest, Slot, Response } from 'ask-sdk-model';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import { HelpIntentHandler, CancelIntentHandler, LaunchRequestHandler, StopIntentHandler, NavigateHomeIntentHandler, SessionEndedRequestHandler } from './handlers';

dotenv.config();

// TODO: Define the duration of pauses during speech (ex. i wanna... [pause] do this)
// TODO: Determine the duration for audio capture
// TODO: Set the timeout duration for awaiting a response

const privateKey = fs.readFileSync('./certificates/key.pem', 'utf8');
const certificate = fs.readFileSync('./certificates/cert.pem', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate
};

const wss = new WebSocket.Server({ noServer: true });
const wsConnections: WebSocket[] = []; // Global list of WebSocket connections

wss.on('connection', (ws: WebSocket) => {
  wsConnections.push(ws);
  console.info("[INFO] WS connection detected");
  ws.on('close', () => {
    const index = wsConnections.indexOf(ws);
    if (index > -1) {
      wsConnections.splice(index, 1); // Remove closed connection from list
      console.info("[INFO] WS connection removed");
    }
  });
});

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const WS_TOKEN = process.env.WS_TOKEN;

function sendMessage(ws: WebSocket, messageToSend: string): Promise<{ input_text: string, response_text: string }> {
  return new Promise((resolve, reject) => {
    const responseListener = (message: string) => {
      ws.removeListener('message', responseListener); // Remove this listener after getting the response
      resolve(JSON.parse(message));
    };

    ws.on('message', responseListener); // Temporary listener for the response

    ws.send(messageToSend);

    // Set a timeout in case we don't get a response in a timely manner
    setTimeout(() => {
      ws.removeListener('message', responseListener); // Remove the listener if it's still waiting
      reject(new Error('Response timeout'));
    }, 10000); // E.g., wait for 10 seconds (you can adjust this)
  });
}

const ConverseIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'ConverseIntent';
  },
  async handle(handlerInput: Alexa.HandlerInput): Promise<Response> {
    const request = handlerInput.requestEnvelope.request as IntentRequest;
    const userUtterance = (request.intent.slots as { [key: string]: Slot; })['UserInput'].value;
    const repromptText = 'Sigo escuchando';
    console.info(`[UserInput] ${userUtterance}`);

    if (wsConnections.length === 0) {
      return Promise.resolve(
        handlerInput.responseBuilder
          .speak('No hay un servidor chat gpt disponible')
          .reprompt(repromptText)
          .getResponse()
      );
    } else {
      const ws = wsConnections[0]; // Using the first connection as an example
      try {
        const responseMessage = await sendMessage(ws, userUtterance || '');
        console.info(`[GPTInput] ${responseMessage.response_text}`);
        return handlerInput.responseBuilder
          .speak(responseMessage.response_text)
          .reprompt(repromptText)
          .getResponse();
      } catch (error) {
        console.error(error);
        return handlerInput.responseBuilder
          .speak('La respuesta tardó demasiado tiempo. Intenta de nuevo.')
          .reprompt(repromptText)
          .getResponse();
      }
    }
  }
};

const skillBuilder = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    ConverseIntentHandler,
    HelpIntentHandler,
    CancelIntentHandler,
    StopIntentHandler,
    NavigateHomeIntentHandler,
    SessionEndedRequestHandler,
  );

const skill = skillBuilder.create();

app.post('/testhandshake', async (req, res) => {
  console.info("[Server] Can connect");
  res.status(200).send('Connection successful!');
});

app.post('/coggy', async (req, res) => {
  try {
    skill.invoke(req.body)
      .then(function (responseBody) {
        res.json(responseBody);
      })
      .catch(function (error) {
        console.log(error);
        res.status(500).send('Error during the request');
      });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

// Assuming you're using the 'http' module to create the server
// const server = app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

const server = https
  .createServer(credentials, app)  // Pass the credentials here
  .listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
  });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const token = url.searchParams.get('token');

  if (token === WS_TOKEN) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    console.info("[INFO] WS connection not authorized");
    socket.destroy(); // Destroy the connection if not authenticated
  }
});