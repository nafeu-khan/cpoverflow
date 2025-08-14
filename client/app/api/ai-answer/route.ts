import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize the AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { questionTitle, questionContent } = await request.json();

    if (!questionTitle || !questionContent) {
      return NextResponse.json(
        { error: 'Question title and content are required' },
        { status: 400 }
      );
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create a comprehensive prompt for generating a helpful answer
    const prompt = `
      As a helpful programming assistant, please provide a comprehensive answer to the following question:
      
      Question Title: ${questionTitle}
      
      Question Details: ${questionContent}
      
      Please provide:
      1. A clear, step-by-step solution
      2. Code examples if applicable (with proper syntax highlighting)
      3. Best practices and recommendations
      4. Any potential pitfalls to avoid
      5. Additional resources or documentation links if relevant
      
      Format your response in markdown for better readability.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error generating AI answer:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI answer. Please try again.' },
      { status: 500 }
    );
  }
}
