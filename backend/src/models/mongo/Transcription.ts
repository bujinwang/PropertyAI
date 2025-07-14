import { Schema, model, Document } from 'mongoose';

interface ITranscription extends Document {
  voicemailId: string;
  transcript: string;
  languageCode: string;
  confidence: number;
  words: {
    word: string;
    startTime: number;
    endTime: number;
  }[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

const TranscriptionSchema = new Schema<ITranscription>(
  {
    voicemailId: { type: String, required: true, index: true },
    transcript: { type: String, required: true },
    languageCode: { type: String, required: true },
    confidence: { type: Number, required: true },
    words: [
      {
        word: { type: String, required: true },
        startTime: { type: Number, required: true },
        endTime: { type: Number, required: true },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export default model<ITranscription>('Transcription', TranscriptionSchema);
