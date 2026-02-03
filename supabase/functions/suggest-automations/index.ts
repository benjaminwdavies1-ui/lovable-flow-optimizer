import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sop_id, user_id, mock_steps, sop_title } = await req.json();

    // Handle mock steps for testing (no database needed)
    const isMockRequest = mock_steps && Array.isArray(mock_steps);

    if (!isMockRequest && (!sop_id || !user_id)) {
      return new Response(
        JSON.stringify({ error: 'sop_id and user_id are required (or mock_steps for testing)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sopContext: string;
    let steps: any[] = [];

    if (isMockRequest) {
      // Use mock steps directly
      steps = mock_steps;
      sopContext = `
SOP Title: ${sop_title || 'Sample SOP'}
SOP Description: A workflow to analyze for automation opportunities

Steps:
${mock_steps.map((step: any, i: number) => `${i + 1}. ${step.title || 'Untitled step'}: ${step.description || 'No description'}`).join('\n')}
`;
    } else {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch the SOP and its steps
      const { data: sop, error: sopError } = await supabase
        .from('sops')
        .select('*')
        .eq('id', sop_id)
        .single();

      if (sopError || !sop) {
        return new Response(
          JSON.stringify({ error: 'SOP not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: dbSteps, error: stepsError } = await supabase
        .from('sop_steps')
        .select('*')
        .eq('sop_id', sop_id)
        .order('order_number');

      if (stepsError) {
        console.error('Error fetching steps:', stepsError);
      }
      
      steps = dbSteps || [];

      sopContext = `
SOP Title: ${sop.title}
SOP Description: ${sop.description || 'No description'}

Steps:
${steps.map((step, i) => `${i + 1}. ${step.title || 'Untitled step'}: ${step.description || 'No description'}`).join('\n')}
`;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      // Return mock suggestions if no API key
      const mockSuggestions = [
        {
          title: "Automate notification sending",
          description: "This step involves sending notifications which can be automated using Zapier or n8n to trigger emails/Slack messages automatically.",
          automation_type: "zapier",
          integration_tools: ["Slack", "Email"],
          estimated_time_saved: "2-3 minutes per execution",
          implementation_difficulty: "easy"
        },
        {
          title: "Auto-generate reports with Google Sheets",
          description: "Report generation can be automated by connecting your data source to Google Sheets and using Apps Script or Make.com.",
          automation_type: "make",
          integration_tools: ["Google Sheets", "Data Source"],
          estimated_time_saved: "10-15 minutes per report",
          implementation_difficulty: "medium"
        }
      ];

      // Only store in database if not a mock request
      if (!isMockRequest && user_id && sop_id) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        for (const suggestion of mockSuggestions) {
          await supabase.from('automation_suggestions').insert({
            user_id,
            sop_id,
            ...suggestion
          });
        }
      }

      return new Response(
        JSON.stringify({ suggestions: mockSuggestions, message: 'Generated mock suggestions (no AI key)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Lovable AI to analyze and suggest automations
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an automation expert. Analyze SOPs (Standard Operating Procedures) and suggest automation opportunities.

For each automation opportunity, provide:
- title: Short, descriptive name for the automation
- description: Detailed explanation of what can be automated and how
- automation_type: One of 'zapier', 'n8n', 'make', 'api', 'script', 'other'
- integration_tools: Array of tools/services involved (e.g., ['Slack', 'Google Sheets'])
- estimated_time_saved: Human-readable time estimate (e.g., '5 minutes per execution')
- implementation_difficulty: 'easy', 'medium', or 'hard'
- step_index: Which step number this relates to (1-indexed), or null if it's a general suggestion

Focus on practical, implementable automations using popular tools like Zapier, n8n, Make.com, or custom APIs.`
          },
          {
            role: 'user',
            content: `Analyze this SOP and suggest automation opportunities:\n\n${sopContext}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_automations',
              description: 'Return automation suggestions for the SOP',
              parameters: {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        automation_type: { type: 'string', enum: ['zapier', 'n8n', 'make', 'api', 'script', 'other'] },
                        integration_tools: { type: 'array', items: { type: 'string' } },
                        estimated_time_saved: { type: 'string' },
                        implementation_difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                        step_index: { type: 'number', nullable: true }
                      },
                      required: ['title', 'description', 'automation_type', 'integration_tools', 'estimated_time_saved', 'implementation_difficulty']
                    }
                  }
                },
                required: ['suggestions']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_automations' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI service unavailable');
    }

    const aiResponse = await response.json();
    console.log('AI Response:', JSON.stringify(aiResponse, null, 2));

    // Extract suggestions from tool call response
    let suggestions = [];
    const toolCalls = aiResponse.choices?.[0]?.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      const args = JSON.parse(toolCalls[0].function.arguments);
      suggestions = args.suggestions || [];
    }

    // Map step_index to actual step_id if available
    const stepsArray = steps || [];
    
    // Store suggestions in database only if not a mock request
    if (!isMockRequest && user_id && sop_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      for (const suggestion of suggestions) {
        const stepId = suggestion.step_index && stepsArray[suggestion.step_index - 1] 
          ? stepsArray[suggestion.step_index - 1].id 
          : null;

        await supabase.from('automation_suggestions').insert({
          user_id,
          sop_id,
          step_id: stepId,
          title: suggestion.title,
          description: suggestion.description,
          automation_type: suggestion.automation_type,
          integration_tools: suggestion.integration_tools,
          estimated_time_saved: suggestion.estimated_time_saved,
          implementation_difficulty: suggestion.implementation_difficulty
        });
      }
    }

    return new Response(
      JSON.stringify({ suggestions, message: `Generated ${suggestions.length} automation suggestions` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-automations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
