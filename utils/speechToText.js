const openai = require('../config/openai');

const transcribeAudio = async (audioBuffer) => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioBuffer,
      model: "whisper-1",
    });
    
    return transcription.text;
  } catch (error) {
    throw new Error('Failed to transcribe audio');
  }
};

module.exports = { transcribeAudio };
