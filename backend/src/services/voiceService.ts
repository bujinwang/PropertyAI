import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export const makeCall = async (to: string, from: string, url: string) => {
  await client.calls.create({
    url,
    to,
    from,
  });
};

export const convertVoiceToText = async (audioBuffer: Buffer): Promise<string> => {
  const speech = require('@google-cloud/speech');
  const client = new speech.SpeechClient();

  const audio = {
    content: audioBuffer.toString('base64'),
  };
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };
  const request = {
    audio: audio,
    config: config,
  };

  const [response] = await client.recognize(request);
  const transcription = response.results
    .map((result: any) => result.alternatives[0].transcript)
    .join('\n');
  return transcription;
};
