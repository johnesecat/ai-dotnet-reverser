// src/ai/anthropic-client.ts

/**
 * Anthropic Claude API integration for AI-assisted deobfuscation
 */

export class AnthropicClient {
  private apiKey: string;
  private baseURL = 'https://api.anthropic.com/v1/messages';
  private model = 'claude-sonnet-4-20250514';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeObfuscation(ilCode: string, context?: string): Promise<AIAnalysis> {
    const prompt = this.buildObfuscationPrompt(ilCode, context);

    try {
      const response = await this.sendRequest(prompt);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async suggestVariableNames(ilCode: string, variables: string[]): Promise<VariableSuggestion[]> {
    const prompt = this.buildNamingPrompt(ilCode, variables);

    try {
      const response = await this.sendRequest(prompt);
      return this.parseNamingResponse(response, variables);
    } catch (error) {
      console.error('Variable naming failed:', error);
      return variables.map(v => ({ original: v, suggested: v, confidence: 0 }));
    }
  }

  async explainMethod(methodName: string, ilCode: string): Promise<string> {
    const prompt = `Explain what this .NET method does:\n\nMethod: ${methodName}\n\nIL Code:\n${ilCode}\n\nProvide a clear, concise explanation of the method's purpose and behavior.`;

    try {
      const response = await this.sendRequest(prompt);
      return response.content[0]?.text || 'No explanation available';
    } catch (error) {
      return 'Failed to generate explanation';
    }
  }

  async detectMalware(assembly: any): Promise<MalwareAnalysis> {
    const prompt = this.buildMalwarePrompt(assembly);

    try {
      const response = await this.sendRequest(prompt);
      return this.parseMalwareResponse(response);
    } catch (error) {
      return {
        isSuspicious: false,
        confidence: 0,
        indicators: [],
        explanation: 'Analysis failed'
      };
    }
  }

  private async sendRequest(userPrompt: string): Promise<ClaudeResponse> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  private buildObfuscationPrompt(ilCode: string, context?: string): string {
    return `Analyze this obfuscated .NET IL code and identify obfuscation techniques:

${context ? `Context: ${context}\n\n` : ''}IL Code:
${ilCode}

Identify:
1. Obfuscation techniques used
2. Likely obfuscator
3. How to reverse the obfuscation
4. Confidence level (0-10)

Respond in JSON format:
{
  "obfuscator": "name",
  "techniques": ["technique1", "technique2"],
  "reversal_steps": ["step1", "step2"],
  "confidence": 8
}`;
  }

  private buildNamingPrompt(ilCode: string, variables: string[]): string {
    return `Given this IL code, suggest meaningful names for these variables: ${variables.join(', ')}

IL Code:
${ilCode}

For each variable, suggest a descriptive name based on its usage. Respond in JSON:
{
  "suggestions": [
    {"original": "a", "suggested": "userCount", "confidence": 9},
    {"original": "b", "suggested": "isValid", "confidence": 8}
  ]
}`;
  }

  private buildMalwarePrompt(assembly: any): string {
    const typeList = assembly.types.slice(0, 20).map((t: any) => t.fullName).join('\n');
    
    return `Analyze this .NET assembly for potential malware indicators:

Assembly: ${assembly.name}
Types (first 20):
${typeList}

Total types: ${assembly.types.length}
Total methods: ${assembly.methods.length}

Check for:
- Suspicious API usage (networking, file I/O, registry)
- Obfuscation indicators
- Known malware patterns
- Packing/encryption

Respond in JSON:
{
  "is_suspicious": true/false,
  "confidence": 0-10,
  "indicators": ["indicator1", "indicator2"],
  "explanation": "brief explanation"
}`;
  }

  private parseAnalysisResponse(response: ClaudeResponse): AIAnalysis {
    const text = response.content[0]?.text || '{}';
    
    try {
      // Extract JSON from response (may be wrapped in ```json)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          obfuscator: parsed.obfuscator || 'Unknown',
          techniques: parsed.techniques || [],
          reversalSteps: parsed.reversal_steps || [],
          confidence: parsed.confidence || 0
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
    }

    return {
      obfuscator: 'Unknown',
      techniques: [],
      reversalSteps: [],
      confidence: 0
    };
  }

  private parseNamingResponse(response: ClaudeResponse, originalVars: string[]): VariableSuggestion[] {
    const text = response.content[0]?.text || '{}';
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
          return parsed.suggestions;
        }
      }
    } catch (error) {
      console.error('Failed to parse naming response:', error);
    }

    return originalVars.map(v => ({ original: v, suggested: v, confidence: 0 }));
  }

  private parseMalwareResponse(response: ClaudeResponse): MalwareAnalysis {
    const text = response.content[0]?.text || '{}';
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isSuspicious: parsed.is_suspicious || false,
          confidence: parsed.confidence || 0,
          indicators: parsed.indicators || [],
          explanation: parsed.explanation || ''
        };
      }
    } catch (error) {
      console.error('Failed to parse malware response:', error);
    }

    return {
      isSuspicious: false,
      confidence: 0,
      indicators: [],
      explanation: 'Parse failed'
    };
  }
}

interface ClaudeResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface AIAnalysis {
  obfuscator: string;
  techniques: string[];
  reversalSteps: string[];
  confidence: number;
}

export interface VariableSuggestion {
  original: string;
  suggested: string;
  confidence: number;
}

export interface MalwareAnalysis {
  isSuspicious: boolean;
  confidence: number;
  indicators: string[];
  explanation: string;
}