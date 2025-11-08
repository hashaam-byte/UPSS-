// src/app/api/protected/teacher/subject/ai-generate-test/route.js
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch teacher's subjects and classes
export async function GET(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: {
        teacherSubjects: {
          include: {
            subject: {
              where: { schoolId: user.schoolId }
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

    const validSubjects = teacherProfile.teacherSubjects.filter(ts => ts.subject !== null);
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
    const { 
      subjectId, 
      subject, 
      topic, 
      questionCount, 
      difficulty, 
      questionTypes,
      examType,        // NEW: jamb, waec, utme, common_entrance, school_exam
      targetClass,     // NEW: ss1, ss2, ss3, jss1, jss2, jss3, custom
      customPrompt     // NEW: User's custom instructions
    } = await request.json();

    // Verify teacher has access to this subject
    if (subjectId) {
      let teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: user.id },
      });

      if (!teacherProfile) {
        teacherProfile = await prisma.teacherProfile.create({
          data: {
            userId: user.id,
            department: null,
            qualification: null,
            experienceYears: 0,
          },
        });
      }

      let hasAccess = await prisma.teacherSubject.findFirst({
        where: {
          teacherId: teacherProfile.id,
          subjectId: subjectId,
          subject: { schoolId: user.schoolId },
        },
        include: { subject: true },
      });

      if (!hasAccess) {
        hasAccess = await prisma.teacherSubject.create({
          data: {
            teacherId: teacherProfile.id,
            subjectId: subjectId,
            classes: [],
          },
          include: { subject: true },
        });
      }
    }

    // Validate input
    if (!topic && !customPrompt) {
      return NextResponse.json(
        { success: false, error: 'Topic or custom prompt is required' },
        { status: 400 }
      );
    }

    // Get the actual subject name
    let subjectName = subject;
    if (subjectId) {
      const subjectData = await prisma.subject.findUnique({
        where: { id: subjectId },
      });
      if (subjectData) {
        subjectName = subjectData.name;
      }
    }

    console.log(`[AI Test Generation] User: ${user.id}, Subject: ${subjectName}, ExamType: ${examType}, Class: ${targetClass}`);

    // Build enhanced prompt
    const prompt = buildEnhancedTestPrompt({
      subject: subjectName,
      topic,
      questionCount: questionCount || 10,
      difficulty: difficulty || 'medium',
      questionTypes: questionTypes || ['objective', 'theory'],
      examType: examType || 'school_exam',
      targetClass: targetClass || 'ss1',
      customPrompt: customPrompt || ''
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

      const model = 'gemini-2.0-flash-exp';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
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
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No content generated by AI');
      }

      const generatedText = data.candidates[0].content.parts[0].text || '';
      if (!generatedText) {
        throw new Error('Empty response from AI');
      }

      questions = parseAIResponse(generatedText, questionTypes);

      if (questions.length === 0) {
        throw new Error('AI generated no valid questions');
      }
    } catch (aiErr) {
      console.error('AI generation failed, using fallback:', aiErr);
      aiError = aiErr.message;
      isAIGenerated = false;

      questions = generateFallbackQuestions({
        subject: subjectName,
        topic,
        questionCount: questionCount || 10,
        questionTypes: questionTypes || ['objective', 'theory'],
        examType,
        targetClass
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
          examType,
          targetClass,
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

// Enhanced prompt builder
function buildEnhancedTestPrompt({ 
  subject, 
  topic, 
  questionCount, 
  difficulty, 
  questionTypes,
  examType,
  targetClass,
  customPrompt 
}) {
  const hasObjective = questionTypes.includes('objective');
  const hasTheory = questionTypes.includes('theory');
  
  const objectiveCount = hasObjective ? Math.ceil(questionCount * (hasTheory ? 0.6 : 1)) : 0;
  const theoryCount = hasTheory ? Math.ceil(questionCount * (hasObjective ? 0.4 : 1)) : 0;

  // Exam-specific guidelines
  const examGuidelines = {
    jamb: "Follow JAMB (Joint Admissions and Matriculation Board) style: 4 options per question, standard Nigerian university entrance exam format, clear and unambiguous questions.",
    waec: "Follow WAEC (West African Examinations Council) style: Standard West African secondary school format, both objective and essay questions testing comprehensive understanding.",
    utme: "Follow UTME (Unified Tertiary Matriculation Examination) style: University entrance level, rigorous questioning, testing deep understanding and application.",
    common_entrance: "Follow Common Entrance style: Junior secondary entrance level, age-appropriate vocabulary, testing fundamental concepts for transition to secondary school.",
    school_exam: "Follow standard school examination format: Balanced difficulty, curriculum-aligned, suitable for continuous assessment."
  };

  // Class-specific context
  const classContext = {
    jss1: "Junior Secondary 1 level - Introduce foundational concepts, simple language, basic examples",
    jss2: "Junior Secondary 2 level - Build on foundations, moderate complexity, practical applications",
    jss3: "Junior Secondary 3 level - Prepare for senior secondary, comprehensive coverage, exam preparation",
    ss1: "Senior Secondary 1 level - Advanced concepts introduction, analytical thinking required",
    ss2: "Senior Secondary 2 level - Deep subject mastery, complex problem-solving",
    ss3: "Senior Secondary 3 level - Exam preparation, comprehensive revision, application-focused",
    custom: "Adaptable level based on topic complexity"
  };

  let prompt = `You are an expert Nigerian educational content creator specializing in ${subject}.

EXAMINATION CONTEXT:
- Exam Type: ${examType.toUpperCase().replace('_', ' ')}
- Target Class: ${targetClass.toUpperCase()}
- ${examGuidelines[examType] || examGuidelines.school_exam}
- ${classContext[targetClass] || classContext.custom}

SUBJECT AND TOPIC:
- Subject: ${subject}
- Topic: ${topic || 'As specified in custom instructions'}
- Difficulty Level: ${difficulty}
- Total Questions: ${questionCount}

${customPrompt ? `\nCUSTOM INSTRUCTIONS FROM TEACHER:\n${customPrompt}\n` : ''}

CRITICAL FORMATTING RULES:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanations
2. Each question must have a unique ID starting with "q_"
3. For objective questions: provide exactly 4 options (A, B, C, D)
4. Questions must be appropriate for ${targetClass.toUpperCase()} students
5. Follow ${examType.toUpperCase()} examination standards strictly
6. Include detailed explanations for all questions
7. Mark values should reflect difficulty: easy (1-2), medium (3-5), hard (6-10)

NIGERIAN CURRICULUM ALIGNMENT:
- Use Nigerian examples, names, locations where relevant
- Reference Nigerian context (currency: Naira, locations: Lagos, Abuja, etc.)
- Follow Nigerian educational standards and terminology
- Use British English spelling and grammar

Generate a JSON array with this EXACT structure:
`;

  if (hasObjective) {
    prompt += `
[For ${objectiveCount} OBJECTIVE (Multiple Choice) questions]:
{
  "id": "q_1",
  "type": "objective",
  "question": "Clear, specific question text appropriate for ${targetClass} level",
  "marks": ${difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3},
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "correctAnswer": 0,
  "explanation": "Detailed explanation of why this answer is correct, suitable for ${targetClass} understanding",
  "examTip": "Optional: Tip for answering similar questions in ${examType} exams"
}
`;
  }

  if (hasTheory) {
    prompt += `
[For ${theoryCount} THEORY (Essay/Short Answer) questions]:
{
  "id": "q_${objectiveCount + 1}",
  "type": "theory",
  "question": "Open-ended question requiring detailed response, ${examType} style",
  "marks": ${difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15},
  "sampleAnswer": "Comprehensive sample answer with key points that ${targetClass} students should include",
  "explanation": "Grading criteria and important points to look for",
  "markingScheme": "Break down of how marks should be allocated (e.g., 3 marks for introduction, 5 marks for main points, 2 marks for conclusion)"
}
`;
  }

  prompt += `

EXAMPLE OUTPUT FORMAT (return ONLY the JSON array):
[
  {
    "id": "q_1",
    "type": "objective",
    "question": "Lagos is the capital city of which Nigerian state?",
    "marks": 2,
    "options": ["Lagos State", "Oyo State", "Ogun State", "Rivers State"],
    "correctAnswer": 0,
    "explanation": "Lagos is both a city and a state. Lagos State has Ikeja as its capital, but Lagos city (formerly the federal capital) is within Lagos State.",
    "examTip": "Remember state capitals vs city names in Nigerian geography."
  }
]

${customPrompt ? '\nIMPORTANT: Prioritize the custom instructions provided by the teacher while maintaining exam standards.\n' : ''}

Generate ${questionCount} well-crafted, academically sound questions suitable for ${targetClass} ${difficulty} level ${examType} examination.
Return ONLY the JSON array, no additional text.`;

  return prompt;
}

// Parse AI response
function parseAIResponse(text, questionTypes) {
  try {
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }

    const parsedQuestions = JSON.parse(cleanText);
    
    return parsedQuestions.map((q, index) => ({
      id: q.id || `q_${Date.now()}_${index}`,
      type: q.type || 'objective',
      question: q.question || '',
      marks: q.marks || (q.type === 'objective' ? 2 : 10),
      options: q.type === 'objective' ? (q.options || ['', '', '', '']) : null,
      correctAnswer: q.type === 'objective' ? (q.correctAnswer ?? 0) : null,
      explanation: q.explanation || '',
      sampleAnswer: q.type === 'theory' ? (q.sampleAnswer || '') : null,
      examTip: q.examTip || null,
      markingScheme: q.markingScheme || null
    }));
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return [];
  }
}

// Enhanced fallback generation
function generateFallbackQuestions({ subject, topic, questionCount, questionTypes, examType, targetClass }) {
  const questions = [];
  const hasObjective = questionTypes.includes('objective');
  const hasTheory = questionTypes.includes('theory');

  const objectiveTemplates = [
    {
      pattern: `What is the primary concept of ${topic} in ${subject}?`,
      options: [
        `Understanding basic principles`,
        `Advanced applications only`,
        `Historical context exclusively`,
        `Theoretical foundations`
      ]
    },
    {
      pattern: `Which statement best describes ${topic}?`,
      options: [
        `It is a fundamental concept in ${subject}`,
        `It is an advanced technique`,
        `It is purely theoretical`,
        `It has no practical application`
      ]
    }
  ];

  const theoryTemplates = [
    `Explain the main concepts of ${topic} in ${subject}. Provide examples relevant to ${targetClass} level.`,
    `Discuss the importance and applications of ${topic} in ${subject}.`,
    `With reference to ${topic}, analyze the key principles. (Suitable for ${examType} examination)`
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
        explanation: `This question tests understanding of ${topic} at ${targetClass} level for ${examType} examination.`,
        examTip: `Review ${topic} thoroughly before the exam.`
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
        sampleAnswer: `A comprehensive answer should cover: 1) Definition of ${topic}, 2) Key principles, 3) Practical applications in ${subject}, 4) Relevant examples for ${targetClass} level.`,
        explanation: `Look for clear explanation, understanding of concepts, and relevant examples.`,
        markingScheme: `Introduction (2 marks), Main points (5 marks), Examples (2 marks), Conclusion (1 mark)`
      });
    }
  }

  return questions;
}