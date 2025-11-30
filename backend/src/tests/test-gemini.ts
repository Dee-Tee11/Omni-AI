import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './config.js';

async function testGemini() {
    console.log('Testing Gemini API...');
    if (!env.GEMINI_API_KEY) {
        console.error('Error: GEMINI_API_KEY is missing');
        return;
    }

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const modelName = 'gemini-2.5-pro';
    console.log(`Using model: ${modelName}`);

    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello, are you working?');
        const response = await result.response;
        console.log('Response:', response.text());
        console.log('Success!');
    } catch (error: any) {
        console.error('Error testing Gemini:', error.message);
        if (error.response) {
            console.error('Error details:', JSON.stringify(error.response, null, 2));
        }
    }
}

testGemini();
