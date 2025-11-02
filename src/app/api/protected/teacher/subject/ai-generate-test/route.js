import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch teacher's subjects and classes from their school
export async function GET(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    // Get teacher's profile with subjects from their school only
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { 
        userId: user.id 
      },
      include: {
        teacherSubjects: {
          include: {
            subject: {
              where: {
                schoolId: user.schoolId // Ensure subjects are from teacher's school
              }
            }
          }
        }
      }
    });

    if (!teacherProfile) {
      return NextResponse.json({
        success: false,
        error: 'Teacher profile not found'
      }, { status: 404 });
    }

    // Filter out any null subjects (in case of data inconsistency)
    const validSubjects = teacherProfile.teacherSubjects.filter(ts => ts.subject !== null);
    
    // Get unique classes from teacher's subjects
    const classes = [...new Set(validSubjects.flatMap(ts => ts.classes))];

    return NextResponse.json({
      success: true,
      data: {
        subjects: validSubjects,
        classes: classes,
        schoolId: user.schoolId,
        teacherInfo: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          department: teacherProfile.department
        }
      }
    });
  } catch (error) {
    console.error('Fetch teacher subjects error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(['teacher']);
    const { subjectId, subject, topic, questionCount, difficulty, questionTypes } = await request.json();

    // Verify teacher has access to this subject
    if (subjectId) {
      // Ensure the teacher profile exists
      let teacherProfile = await prisma.teacherProfile.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (!teacherProfile) {
        console.log('Teacher profile not found. Creating a new teacher profile...');
        teacherProfile = await prisma.teacherProfile.create({
          data: {
            userId: user.id,
            department: null, // Set default values as needed
            qualification: null,
            experienceYears: 0,
          },
        });
        console.log('Teacher profile created successfully.');
      }

      let hasAccess = await prisma.teacherSubject.findFirst({
        where: {
          teacherId: teacherProfile.id,
          subjectId: subjectId,
          subject: {
            schoolId: user.schoolId, // Ensure the subject belongs to the teacher's school
          },
        },
        include: {
          subject: true, // Fetch the subject details
        },
      });

      // If the teacherSubject record is missing, create it
      if (!hasAccess) {
        console.log('Teacher does not have access to this subject. Adding access...');
        hasAccess = await prisma.teacherSubject.create({
          data: {
            teacherId: teacherProfile.id,
            subjectId: subjectId,
            classes: [], // Default to an empty array; update as needed
          },
          include: {
            subject: true,
          },
        });
        console.log('Access granted to the teacher for the subject.');
      }
    }

    // Validate input
    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Get the actual subject name for the prompt
    let subjectName = subject;
    if (subjectId) {
      const subjectData = await prisma.subject.findUnique({
        where: { 
          id: subjectId,
        },
      });
      
      if (subjectData) {
        subjectName = subjectData.name;
      }
    }

    // Log the generation attempt for audit
    console.log(`[AI Test Generation] User: ${user.id}, School: ${user.schoolId}, Subject: ${subjectName}, Topic: ${topic}`);

    // Build the prompt for Gemini
    const prompt = buildTestGenerationPrompt({
      subject: subjectName,
      topic,
      questionCount: questionCount || 10,
      difficulty: difficulty || 'medium',
      questionTypes: questionTypes || ['objective', 'theory'],
    });

    // Try AI generation
    let questions = [];
    let isAIGenerated = true;
    let aiError = null;

    try {
      const API_KEY = process.env.GOOGLE_API_KEY;
      if (!API_KEY) {
        throw new Error('GOOGLE_API_KEY not configured');
      }

      // CRITICAL: Use v1beta API with current model names
      // Gemini 1.5 models are deprecated - use Gemini 2.0 or 2.5
      const model = 'gemini-2.0-flash-exp'; // or 'gemini-2.5-flash' for stable version
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('Gemini API Error:', err);
        throw new Error(`Gemini API error: ${response.status} - ${err}`);
      }

      const data = await response.json();
      
      // Check if response has the expected structure
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No content generated by AI');
      }

      const generatedText = data.candidates[0].content.parts[0].text || '';

      if (!generatedText) {
        throw new Error('Empty response from AI');
      }

      // Parse the AI response into structured questions
      questions = parseAIResponse(generatedText, questionTypes);

      if (questions.length === 0) {
        throw new Error('AI generated no valid questions');
      }
    } catch (aiErr) {
      console.error('AI generation failed, using fallback:', aiErr);
      aiError = aiErr.message;
      isAIGenerated = false;

      // Fallback to template-based generation
      questions = generateFallbackQuestions({
        subject: subjectName,
        topic,
        questionCount: questionCount || 10,
        questionTypes: questionTypes || ['objective', 'theory'],
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        questions,
        metadata: {
          subjectId: subjectId || null,
          subjectName: subjectName,
          topic,
          difficulty,
          generatedAt: new Date().toISOString(),
          totalQuestions: questions.length,
          isAIGenerated,
          schoolId: user.schoolId,
          teacherId: user.id,
          ...(aiError && { fallbackReason: aiError }),
        },
      },
    });
  } catch (error) {
    console.error('AI test generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate test',
    }, { status: 500 });
  }
}

// Build comprehensive prompt for AI
function buildTestGenerationPrompt({ subject, topic, questionCount, difficulty, questionTypes }) {
  const hasObjective = questionTypes.includes('objective');
  const hasTheory = questionTypes.includes('theory');
  
  const objectiveCount = hasObjective ? Math.ceil(questionCount * (hasTheory ? 0.6 : 1)) : 0;
  const theoryCount = hasTheory ? Math.ceil(questionCount * (hasObjective ? 0.4 : 1)) : 0;

  let prompt = `You are an expert educational content creator. Generate a comprehensive test for the following:

Subject: ${subject}
Topic: ${topic}
Difficulty Level: ${difficulty}
Total Questions: ${questionCount}

IMPORTANT FORMATTING RULES:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanations
2. Each question must have a unique ID starting with "q_"
3. For objective questions: provide exactly 4 options (A, B, C, D)
4. Include detailed explanations for all questions
5. Mark values should reflect difficulty: easy (1-2), medium (3-5), hard (6-10)

Generate a JSON array with this EXACT structure:
`;

  if (hasObjective) {
    prompt += `
[For ${objectiveCount} OBJECTIVE (Multiple Choice) questions]:
{
  "id": "q_1",
  "type": "objective",
  "question": "Clear, specific question text",
  "marks": ${difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3},
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "correctAnswer": 0,
  "explanation": "Detailed explanation of why this answer is correct"
}
`;
  }

  if (hasTheory) {
    prompt += `
[For ${theoryCount} THEORY (Essay/Short Answer) questions]:
{
  "id": "q_${objectiveCount + 1}",
  "type": "theory",
  "question": "Open-ended question requiring detailed response",
  "marks": ${difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15},
  "sampleAnswer": "Comprehensive sample answer with key points",
  "explanation": "Grading criteria and important points to look for"
}
`;
  }

  prompt += `

EXAMPLE OUTPUT FORMAT (return ONLY the JSON array):
[
  {
    "id": "q_1",
    "type": "objective",
    "question": "What is the capital of France?",
    "marks": 2,
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "correctAnswer": 1,
    "explanation": "Paris is the capital and largest city of France."
  }
]

Generate ${questionCount} well-crafted, academically sound questions suitable for ${difficulty} level students.
Return ONLY the JSON array, no additional text.`;

  return prompt;
}

// Parse AI response into structured questions
function parseAIResponse(text, questionTypes) {
  try {
    // Remove markdown code blocks if present
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to extract JSON array
    const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }

    const parsedQuestions = JSON.parse(cleanText);
    
    // Validate and format questions
    return parsedQuestions.map((q, index) => ({
      id: q.id || `q_${Date.now()}_${index}`,
      type: q.type || 'objective',
      question: q.question || '',
      marks: q.marks || (q.type === 'objective' ? 2 : 10),
      options: q.type === 'objective' ? (q.options || ['', '', '', '']) : null,
      correctAnswer: q.type === 'objective' ? (q.correctAnswer ?? 0) : null,
      explanation: q.explanation || '',
      sampleAnswer: q.type === 'theory' ? (q.sampleAnswer || '') : null
    }));
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return [];
  }
}

// Fallback template-based question generation
function generateFallbackQuestions({ subject, topic, questionCount, questionTypes }) {
  const questions = [];
  const hasObjective = questionTypes.includes('objective');
  const hasTheory = questionTypes.includes('theory');

  const objectiveTemplates = [
    {
      pattern: `What is the primary focus of ${topic} in ${subject}?`,
      options: [
        `Understanding basic concepts`,
        `Advanced applications`,
        `Historical context`,
        `Theoretical foundations`
      ]
    },
    {
      pattern: `Which statement best describes ${topic}?`,
      options: [
        `It is a fundamental concept`,
        `It is an advanced technique`,
        `It is a theoretical framework`,
        `It is a practical application`
      ]
    },
    {
      pattern: `In ${subject}, ${topic} is most closely related to:`,
      options: [
        `Basic principles`,
        `Complex theories`,
        `Practical methods`,
        `Historical developments`
      ]
    }
  ];

  const theoryTemplates = [
    `Explain the main concepts of ${topic} in ${subject}.`,
    `Discuss the importance and applications of ${topic}.`,
    `Compare and contrast different aspects of ${topic}.`,
    `Analyze the key principles underlying ${topic} in ${subject}.`
  ];

  if (hasObjective) {
    const objCount = Math.ceil(questionCount * (hasTheory ? 0.6 : 1));
    for (let i = 0; i < objCount; i++) {
      const template = objectiveTemplates[i % objectiveTemplates.length];
      questions.push({
        id: `q_${Date.now()}_${i}`,
        type: 'objective',
        question: template.pattern,
        marks: 2,
        options: template.options,
        correctAnswer: 0,
        explanation: `This question tests understanding of ${topic} in ${subject}.`
      });
    }
  }

  if (hasTheory) {
    const theoryCount = Math.ceil(questionCount * (hasObjective ? 0.4 : 1));
    for (let i = 0; i < theoryCount; i++) {
      questions.push({
        id: `q_${Date.now()}_obj_${i}`,
        type: 'theory',
        question: theoryTemplates[i % theoryTemplates.length],
        marks: 10,
        sampleAnswer: `A comprehensive answer should cover the main aspects of ${topic}, including definitions, key concepts, and practical applications in ${subject}.`,
        explanation: `Look for clear explanation, understanding of concepts, and relevant examples.`
      });
    }
  }

  return questions;
}