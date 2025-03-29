
import React, { useState } from 'react';
import { PromptBuilderFormData, usePromptBuilder } from '@/hooks/use-prompt-builder';
import { useAIServices } from '@/hooks/use-ai-services';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PromptBuilderStepperProps {
  currentStep: number;
  formData: PromptBuilderFormData;
  updateFormData: (field: string, value: string) => void;
  generatedPrompt?: string;
}

const PromptBuilderStepper: React.FC<PromptBuilderStepperProps> = ({
  currentStep,
  formData,
  updateFormData,
  generatedPrompt,
}) => {
  const { useSnippets } = usePromptBuilder();
  const { generateWithProvider, getAvailableProviders } = useAIServices();

  const [sampleInput, setSampleInput] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [isTestingPrompt, setIsTestingPrompt] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Set default provider when available providers change
  const availableProviders = getAvailableProviders();
  React.useEffect(() => {
    if (availableProviders.length > 0 && !selectedProvider) {
      setSelectedProvider(availableProviders[0]);
    }
  }, [availableProviders, selectedProvider]);

  // Helper function to get step style
  const getStepStyle = (currentStep: number, step: number): string => {
    if (currentStep === step) {
      return 'bg-primary text-primary-foreground';
    } else if (currentStep > step) {
      return 'bg-primary/80 text-primary-foreground';
    } else {
      return 'bg-muted text-muted-foreground';
    }
  };

  // Handle testing the prompt with AI
  const handleTestPrompt = async () => {
    if (!selectedProvider || !sampleInput || !generatedPrompt) return;

    setIsTestingPrompt(true);
    setAiOutput('');

    try {
      console.log('Testing prompt with:', selectedProvider);
      console.log('Prompt:', generatedPrompt);
      console.log('Sample input:', sampleInput);

      // Create a combined prompt with the generated prompt and sample input
      const combinedPrompt = `${generatedPrompt}\n\nInput: ${sampleInput}`;

      // Call the AI service with the combined prompt
      const result = await generateWithProvider(
        selectedProvider,
        {
          prompt: combinedPrompt,
          category: formData.category,
          tone: formData.tone,
          audience: formData.audience,
          goal: formData.goal,
          components: formData.components,
          step: currentStep
        },
        'test'
      ) as string;

      console.log('AI response:', result);
      setAiOutput(result);
    } catch (error) {
      console.error('Error testing prompt:', error);
      setAiOutput('Error generating response. Please try again.');
    } finally {
      setIsTestingPrompt(false);
    }
  };

  // Get snippets based on current category
  const { data: introSnippets } = useSnippets(formData.category, 'intro');
  const { data: contextSnippets } = useSnippets(formData.category, 'context');
  const { data: instructionSnippets } = useSnippets(formData.category, 'instruction');

  const categories = [
    { id: 'creative_writing', name: 'Creative Writing' },
    { id: 'business', name: 'Business' },
    { id: 'academic', name: 'Academic' },
    { id: 'coding', name: 'Coding' },
    { id: 'marketing', name: 'Marketing' },
  ];

  const tones = [
    { id: 'professional', name: 'Professional' },
    { id: 'casual', name: 'Casual' },
    { id: 'formal', name: 'Formal' },
    { id: 'friendly', name: 'Friendly' },
    { id: 'technical', name: 'Technical' },
    { id: 'persuasive', name: 'Persuasive' },
  ];

  const audiences = [
    { id: 'general', name: 'General Audience' },
    { id: 'professionals', name: 'Professionals' },
    { id: 'students', name: 'Students' },
    { id: 'developers', name: 'Developers' },
    { id: 'customers', name: 'Customers' },
    { id: 'managers', name: 'Managers' },
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">1. Select a Category</h2>
            <p className="text-muted-foreground mb-4">Choose the type of prompt you want to create</p>

            <RadioGroup
              value={formData.category}
              onValueChange={(value) => updateFormData('category', value)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {categories.map((category) => (
                <div key={category.id} className="flex items-start space-x-2">
                  <RadioGroupItem value={category.id} id={`category-${category.id}`} />
                  <Label htmlFor={`category-${category.id}`} className="font-normal">
                    {category.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">2. Set Tone and Audience</h2>
            <p className="text-muted-foreground mb-4">Define who you're writing for and how it should sound</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <RadioGroup
                  value={formData.tone}
                  onValueChange={(value) => updateFormData('tone', value)}
                  className="space-y-1"
                >
                  {tones.map((tone) => (
                    <div key={tone.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={tone.id} id={`tone-${tone.id}`} />
                      <Label htmlFor={`tone-${tone.id}`} className="font-normal">
                        {tone.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <RadioGroup
                  value={formData.audience}
                  onValueChange={(value) => updateFormData('audience', value)}
                  className="space-y-1"
                >
                  {audiences.map((audience) => (
                    <div key={audience.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={audience.id} id={`audience-${audience.id}`} />
                      <Label htmlFor={`audience-${audience.id}`} className="font-normal">
                        {audience.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">3. Prompt Details</h2>
            <p className="text-muted-foreground mb-4">Add specific details based on your chosen category</p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="goal">What's your goal?</Label>
                <Textarea
                  id="goal"
                  placeholder="Describe what you want to achieve with this prompt"
                  value={formData.goal || ''}
                  onChange={(e) => updateFormData('goal', e.target.value)}
                  className="mt-1"
                />
                {introSnippets && introSnippets.length > 0 && (
                  <div className="mt-1">
                    <p className="text-xs text-muted-foreground">Suggestions:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {introSnippets.slice(0, 2).map((snippet) => (
                        <button
                          type="button"
                          key={snippet.id}
                          className="text-xs px-2 py-1 bg-muted rounded-md hover:bg-muted/80"
                          onClick={() => updateFormData('goal', snippet.snippet_text)}
                        >
                          {snippet.snippet_text.substring(0, 40)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {formData.category === 'creative_writing' && (
                <>
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Input
                      id="theme"
                      placeholder="E.g., 'redemption', 'coming of age', 'survival'"
                      value={formData.components.theme || ''}
                      onChange={(e) => updateFormData('component.theme', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="character">Main Character</Label>
                    <Input
                      id="character"
                      placeholder="Describe the main character"
                      value={formData.components.character || ''}
                      onChange={(e) => updateFormData('component.character', e.target.value)}
                      className="mt-1"
                    />
                    {instructionSnippets && instructionSnippets.length > 0 && (
                      <div className="mt-1">
                        <p className="text-xs text-muted-foreground">Suggestions:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {instructionSnippets.slice(0, 2).map((snippet) => (
                            <button
                              type="button"
                              key={snippet.id}
                              className="text-xs px-2 py-1 bg-muted rounded-md hover:bg-muted/80"
                              onClick={() => updateFormData('component.character', snippet.snippet_text)}
                            >
                              {snippet.snippet_text.substring(0, 40)}...
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="setting">Setting</Label>
                    <Input
                      id="setting"
                      placeholder="Describe the setting/world"
                      value={formData.components.setting || ''}
                      onChange={(e) => updateFormData('component.setting', e.target.value)}
                      className="mt-1"
                    />
                    {contextSnippets && contextSnippets.length > 0 && (
                      <div className="mt-1">
                        <p className="text-xs text-muted-foreground">Suggestions:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {contextSnippets.slice(0, 2).map((snippet) => (
                            <button
                              type="button"
                              key={snippet.id}
                              className="text-xs px-2 py-1 bg-muted rounded-md hover:bg-muted/80"
                              onClick={() => updateFormData('component.setting', snippet.snippet_text)}
                            >
                              {snippet.snippet_text.substring(0, 40)}...
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {formData.category === 'business' && (
                <>
                  <div>
                    <Label htmlFor="documentType">Document Type</Label>
                    <Input
                      id="documentType"
                      placeholder="E.g., 'business plan', 'proposal', 'report'"
                      value={formData.components.documentType || ''}
                      onChange={(e) => updateFormData('component.documentType', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="topic">Topic</Label>
                    <Input
                      id="topic"
                      placeholder="What is this document about?"
                      value={formData.components.topic || ''}
                      onChange={(e) => updateFormData('component.topic', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sections">Key Sections</Label>
                    <Textarea
                      id="sections"
                      placeholder="What sections should be included?"
                      value={formData.components.sections || ''}
                      onChange={(e) => updateFormData('component.sections', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              {formData.category === 'coding' && (
                <>
                  <div>
                    <Label htmlFor="language">Language/Framework</Label>
                    <Input
                      id="language"
                      placeholder="E.g., 'Python', 'React', 'SQL'"
                      value={formData.components.language || ''}
                      onChange={(e) => updateFormData('component.language', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="functionality">Functionality</Label>
                    <Textarea
                      id="functionality"
                      placeholder="What should the code do?"
                      value={formData.components.functionality || ''}
                      onChange={(e) => updateFormData('component.functionality', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="implementation">Implementation Details</Label>
                    <Textarea
                      id="implementation"
                      placeholder="Any specific requirements for the implementation?"
                      value={formData.components.implementation || ''}
                      onChange={(e) => updateFormData('component.implementation', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 3: {
        // Render the playground UI
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">4. Prompt Playground</h2>
            <p className="text-muted-foreground mb-4">Test and refine your prompt</p>

            <div className="border rounded-md p-4 bg-muted/50">
              <div className="mb-4">
                <Label htmlFor="current-prompt">Current Prompt</Label>
                <div className="border rounded-md p-3 mt-1 bg-background">
                  <p className="whitespace-pre-wrap text-sm">
                    {generatedPrompt || 'Complete previous steps to generate a prompt'}
                  </p>
                </div>
              </div>

              <Label htmlFor="sample-input">Sample Input</Label>
              <Textarea
                id="sample-input"
                placeholder="Enter a sample input to test with your prompt..."
                className="mt-1"
                rows={3}
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
              />

              <div className="flex items-center justify-between mt-4">
                <Label>AI Provider</Label>
                <div className="flex gap-2">
                  {availableProviders.length > 0 ? (
                    availableProviders.map(provider => (
                      <Button
                        key={provider}
                        size="sm"
                        variant={selectedProvider === provider ? 'default' : 'outline'}
                        onClick={() => setSelectedProvider(provider)}
                        disabled={isTestingPrompt}
                        type="button"
                      >
                        {provider}
                      </Button>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No AI providers available. Add API keys in settings.
                    </p>
                  )}
                </div>
              </div>

              <Button
                className="w-full mt-4"
                onClick={handleTestPrompt}
                disabled={isTestingPrompt || !selectedProvider || !sampleInput || !generatedPrompt}
                type="button"
              >
                {isTestingPrompt ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Prompt...
                  </>
                ) : (
                  'Test Prompt with AI'
                )}
              </Button>

              <div className="mt-4">
                <Label>AI Response</Label>
                <div className="border rounded-md p-3 mt-1 bg-background min-h-[150px]">
                  {aiOutput ? (
                    <p className="whitespace-pre-wrap text-sm">{aiOutput}</p>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">
                      {isTestingPrompt
                        ? 'Generating response...'
                        : 'AI response will appear here after testing'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex mb-6">
        {[0, 1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`rounded-full h-8 w-8 flex items-center justify-center ${getStepStyle(currentStep, step)}`}
            >
              {step + 1}
            </div>

            {step < 3 && (
              <div
                className={`h-1 w-8 ${
                  currentStep > step ? 'bg-primary/80' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {renderStep()}
    </div>
  );
};

export default PromptBuilderStepper;
