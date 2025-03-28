
import React from 'react';
import { PromptBuilderFormData, usePromptBuilder } from '@/hooks/use-prompt-builder';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PromptBuilderStepperProps {
  currentStep: number;
  formData: PromptBuilderFormData;
  updateFormData: (field: string, value: string) => void;
}

const PromptBuilderStepper: React.FC<PromptBuilderStepperProps> = ({
  currentStep,
  formData,
  updateFormData,
}) => {
  const { useTemplates, useSnippets } = usePromptBuilder();
  const { data: templates } = useTemplates();
  
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
      
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">4. Prompt Playground</h2>
            <p className="text-muted-foreground mb-4">Test and refine your prompt</p>
            
            <div className="border rounded-md p-4 bg-muted/50">
              <Label htmlFor="sample-input">Sample Input</Label>
              <Textarea
                id="sample-input"
                placeholder="Enter a sample input to test with your prompt..."
                className="mt-1"
                rows={3}
              />
              
              <div className="mt-4">
                <Label>Generated Output</Label>
                <div className="border rounded-md p-3 mt-1 bg-background min-h-[100px]">
                  <p className="text-muted-foreground text-sm italic">
                    Output will appear here after testing. In a real implementation, this would connect to an AI service.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      
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
              className={`rounded-full h-8 w-8 flex items-center justify-center ${
                currentStep === step
                  ? 'bg-primary text-primary-foreground'
                  : currentStep > step
                  ? 'bg-primary/80 text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
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
