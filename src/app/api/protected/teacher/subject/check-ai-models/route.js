import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    await requireAuth(['teacher', 'admin']);

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY not configured in environment variables',
        configured: false
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
      // Try to list available models
      const models = await genAI.listModels();
      
      return NextResponse.json({
        success: true,
        configured: true,
        availableModels: models.map(m => ({
          name: m.name,
          displayName: m.displayName,
          description: m.description,
          supportedMethods: m.supportedGenerationMethods
        })),
        recommendedModel: 'gemini-1.5-flash' // Fast and efficient
      });
    } catch (listError) {
      // If listing fails, try to test a single model
      const testModels = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro'
      ];

      const workingModels = [];

      for (const modelName of testModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent('Say "test"');
          await result.response;
          workingModels.push(modelName);
        } catch (e) {
          console.log(`Model ${modelName} not available:`, e.message);
        }
      }

      return NextResponse.json({
        success: true,
        configured: true,
        availableModels: workingModels.map(name => ({ name })),
        recommendedModel: workingModels[0] || null,
        note: 'Limited model information available'
      });
    }
  } catch (error) {
    console.error('Check AI models error:', error);
    return NextResponse.json({
      success: false,
      configured: !!process.env.GEMINI_API_KEY,
      error: error.message,
      troubleshooting: {
        steps: [
          'Verify GEMINI_API_KEY is set in .env file',
          'Check API key is valid at https://makersuite.google.com/app/apikey',
          'Ensure you have internet connectivity',
          'Try regenerating your API key if it\'s old'
        ]
      }
    }, { status: 500 });
  }
}
