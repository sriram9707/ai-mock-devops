'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
})

export interface ParsedJD {
    role: string
    level: string // "Entry", "Mid", "Senior", "Principal"
    requiredSkills: string[]
    preferredSkills: string[]
    tools: string[] // Technologies, frameworks, platforms
    companyCulture?: string // Brief description of company culture/work style
    teamSize?: string // "Small (2-5)", "Medium (6-15)", "Large (16+)"
    responsibilities: string[]
    qualifications: string[]
    experienceYears?: number
    location?: string
    remote?: boolean
    keywords: string[]
    industry?: string
    companyStage?: string // "Startup", "Scale-up", "Enterprise"
    technicalRequirements?: string[] // Specific technical requirements from JD
    keyResponsibilities?: string[] // Key responsibilities that should be tested
    certifications?: string[] // Mentioned certifications
}

export async function parseJobDescription(jdText: string): Promise<ParsedJD> {
    const prompt = `You are an expert at parsing job descriptions. Extract structured information from the following job description.

Return ONLY valid JSON in this exact format:
{
  "role": "exact job title",
  "level": "Entry|Mid|Senior|Principal",
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "tools": ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD tools"],
  "companyCulture": "brief description if mentioned",
  "teamSize": "Small (2-5)|Medium (6-15)|Large (16+)|Unknown",
  "responsibilities": ["responsibility1", "responsibility2"],
  "qualifications": ["qualification1", "qualification2"],
  "experienceYears": number or null,
  "location": "city, state/country" or null,
  "remote": true|false|null,
  "keywords": ["keyword1", "keyword2"],
  "industry": "industry name" or null,
  "companyStage": "Startup|Scale-up|Enterprise|Unknown",
  "technicalRequirements": ["specific technical requirement 1", "specific technical requirement 2"],
  "keyResponsibilities": ["key responsibility 1", "key responsibility 2"],
  "certifications": ["certification1", "certification2"]
}

IMPORTANT:
- Extract ALL technologies, tools, and platforms mentioned (AWS, Azure, GCP, Kubernetes, Terraform, CI/CD tools, etc.)
- Extract ALL technical requirements mentioned in "Technical Requirements" or "Requirements" sections
- Extract key responsibilities that should be tested in an interview
- Extract any certifications mentioned
- Be thorough - this information will be used to construct interview questions

Job Description:
${jdText}

Return ONLY the JSON object, no markdown, no explanation.`

    try {
        console.log('🔍 Calling OpenAI to parse JD...')
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a JSON parser. Return only valid JSON, no markdown formatting, no explanations.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
        })
        console.log('✅ OpenAI response received')

        const content = response.choices[0]?.message?.content
        if (!content) {
            throw new Error('No response from OpenAI')
        }

        const parsed = JSON.parse(content) as ParsedJD
        
        // Validate and set defaults
        return {
            role: parsed.role || 'Software Engineer',
            level: parsed.level || 'Mid',
            requiredSkills: parsed.requiredSkills || [],
            preferredSkills: parsed.preferredSkills || [],
            tools: parsed.tools || [],
            companyCulture: parsed.companyCulture,
            teamSize: parsed.teamSize || 'Unknown',
            responsibilities: parsed.responsibilities || [],
            qualifications: parsed.qualifications || [],
            experienceYears: parsed.experienceYears ?? undefined,
            location: parsed.location || undefined,
            remote: parsed.remote ?? undefined,
            keywords: parsed.keywords || [],
            industry: parsed.industry || undefined,
            companyStage: parsed.companyStage || 'Unknown',
            technicalRequirements: parsed.technicalRequirements || [],
            keyResponsibilities: parsed.keyResponsibilities || [],
            certifications: parsed.certifications || []
        }
    } catch (error) {
        console.error('Error parsing JD:', error)
        // Fallback to basic parsing
        return {
            role: 'Software Engineer',
            level: 'Mid',
            requiredSkills: [],
            preferredSkills: [],
            tools: [],
            teamSize: 'Unknown',
            responsibilities: [],
            qualifications: [],
            keywords: extractKeywordsFallback(jdText),
            companyStage: 'Unknown',
            technicalRequirements: [],
            keyResponsibilities: [],
            certifications: []
        }
    }
}

function extractKeywordsFallback(text: string): string[] {
    const commonTechKeywords = [
        'AWS', 'Azure', 'GCP', 'Kubernetes', 'Docker', 'Terraform', 'Ansible',
        'CI/CD', 'Jenkins', 'GitLab', 'GitHub Actions', 'Python', 'Go', 'Java',
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'MongoDB',
        'Redis', 'Kafka', 'Elasticsearch', 'Prometheus', 'Grafana', 'Splunk'
    ]
    
    const keywords: string[] = []
    const lowerText = text.toLowerCase()
    
    commonTechKeywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
            keywords.push(keyword)
        }
    })
    
    return keywords
}

