import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { title, content, tags } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Question title is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create a comprehensive prompt
    const prompt = `
As an expert developer and technical advisor, please provide a detailed, helpful answer to the following programming question:

**Question Title:** ${title}

**Question Details:** ${content || 'No additional details provided.'}

**Related Technologies/Tags:** ${tags?.join(', ') || 'General programming'}

Please provide:
1. A clear, step-by-step solution
2. Code examples when applicable (with proper syntax highlighting)
3. Best practices and considerations
4. Potential pitfalls to avoid
5. Alternative approaches if relevant

Format your response in markdown for better readability. Use code blocks with appropriate language tags for any code examples.
`;

    // Generate the response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      answer: text,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error generating AI answer:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate AI answer',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
