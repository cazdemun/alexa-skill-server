import * as Alexa from 'ask-sdk-core';

export const LaunchRequestHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput: Alexa.HandlerInput) {
    const speechText = 'Bienvenido!';
    const repromptText = 'Hola, sigo escuchando';
    
    console.info(`[Alexa] ${speechText}`);
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  }
};

export const HelpIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput: Alexa.HandlerInput) {
    const speechText = 'Puedo responder preguntas o contar chistes. ¿Qué quieres hacer?';
    const repromptText = 'Si necesitas más ayuda, por favor dime.';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  }
};

export const CancelIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent';
  },
  handle(handlerInput: Alexa.HandlerInput) {
    const speechText = 'Estoy lista para escuchar de nuevo!';
    const repromptText = 'Si necesitas más ayuda, por favor dime.';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  }
};

export const StopIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent'
  },
  handle(handlerInput: Alexa.HandlerInput) {
    const speechText = 'Hasta luego!';
    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  }
};

export const NavigateHomeIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NavigateHomeIntent';
  },
  handle(handlerInput: Alexa.HandlerInput) {
    const speechText = 'Volvemos al inicio.';
    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  }
};

export const SessionEndedRequestHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput: Alexa.HandlerInput) {
    console.log('[Server] Goodbye!');
    const speechText = 'Hasta luego!';
    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  }
};
