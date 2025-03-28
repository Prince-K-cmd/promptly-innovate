
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePrompts } from '@/hooks/use-prompts';
import { usePromptBuilder, PromptBuilderFormData } from '@/hooks/use-prompt-builder';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/lib/performance';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import SEO from '@/components/SEO';
import PromptBuilderStepper from '@/components/PromptBuilderStepper';
import PromptBuilderPreview from '@/components/PromptBuilderPreview';
import PromptBuilderSuggestions from '@/components/PromptBuilderSuggestions';
import LoginPrompt from '@/components/LoginPrompt';

const defaultFormData: PromptBuilderFormData = {
  category: '',
  tone: '',
  audience: '',
  goal: '',
  components: {},
};

const PromptBuilderPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createPrompt } = usePrompts();
  const { saveBuilderHistory, getSuggestions } = usePromptBuilder();
  
  const [formData, setFormData] = useState<PromptBuilderFormData>(defaultFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  const debouncedFormData = useDebounce(formData, 500);
  
  // If not authenticated, show login prompt
  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
    }
  }, [isAuthenticated]);
  
  // Generate suggestions when form data changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (isAuthenticated) {
        const results = await getSuggestions(debouncedFormData);
        setSuggestions(results);
      }
    };
    
    fetchSuggestions();
  }, [debouncedFormData, isAuthenticated]);
  
  // Update form data
  const updateFormData = (field: string, value: string) => {
    setFormData(prev => {
      if (field.startsWith('component.')) {
        const componentKey = field.replace('component.', '');
        return {
          ...prev,
          components: {
            ...prev.components,
            [componentKey]: value
          }
        };
      }
      
      return { ...prev, [field]: value };
    });
  };
  
  // Generate prompt from form data
  const generatePrompt = () => {
    let prompt = '';
    
    // Basic template based on category
    if (formData.category === 'creative_writing') {
      prompt = `Write a creative story`;
      if (formData.components.theme) {
        prompt += ` about ${formData.components.theme}`;
      }
      if (formData.tone) {
        prompt += ` with a ${formData.tone} tone`;
      }
      if (formData.components.character) {
        prompt += `. The main character is ${formData.components.character}`;
      }
      if (formData.components.setting) {
        prompt += ` set in ${formData.components.setting}`;
      }
    } else if (formData.category === 'business') {
      prompt = `Create a ${formData.components.documentType || 'document'}`;
      if (formData.components.topic) {
        prompt += ` about ${formData.components.topic}`;
      }
      if (formData.audience) {
        prompt += ` for ${formData.audience}`;
      }
      if (formData.components.sections) {
        prompt += `. Include sections on ${formData.components.sections}`;
      }
    } else if (formData.category === 'coding') {
      prompt = `Write ${formData.components.language || 'code'}`;
      if (formData.components.functionality) {
        prompt += ` that ${formData.components.functionality}`;
      }
      if (formData.components.implementation) {
        prompt += `. Implementation details: ${formData.components.implementation}`;
      }
    } else {
      // Generic template
      prompt = `Create content`;
      if (formData.category) {
        prompt += ` for ${formData.category}`;
      }
      if (formData.tone) {
        prompt += ` with a ${formData.tone} tone`;
      }
      if (formData.audience) {
        prompt += ` targeted at ${formData.audience}`;
      }
      if (formData.goal) {
        prompt += `. The goal is to ${formData.goal}`;
      }
    }
    
    prompt += '.';
    
    setGeneratedPrompt(prompt);
    return prompt;
  };
  
  // Save progress
  const saveProgress = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    try {
      await saveBuilderHistory.mutateAsync(formData);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };
  
  // Save as prompt
  const saveAsPrompt = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    try {
      const finalPrompt = generatedPrompt || generatePrompt();
      await createPrompt({
        title: `${formData.category} prompt - ${new Date().toLocaleDateString()}`,
        text: finalPrompt,
        category: formData.category || 'general',
        is_public: false,
        tags: [formData.category, formData.tone, formData.audience].filter(Boolean) as string[],
        description: `Generated with Prompt Builder. Category: ${formData.category}, Tone: ${formData.tone}, Audience: ${formData.audience}`
      });
      
      toast({
        title: "Prompt saved",
        description: "Your custom prompt has been saved to your library",
      });
      
      // Navigate to library
      navigate('/library');
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        variant: "destructive",
        title: "Failed to save prompt",
        description: error.message || "An unexpected error occurred",
      });
    }
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.type === 'category') {
      updateFormData('category', suggestion.value);
    } else if (suggestion.type === 'tone') {
      updateFormData('tone', suggestion.value);
    } else if (suggestion.type === 'snippet' && suggestion.snippet) {
      // Add snippet to appropriate field based on its type
      const snippet = suggestion.snippet;
      if (snippet.type === 'intro') {
        updateFormData('goal', suggestion.text);
      } else if (snippet.type === 'context' && formData.category === 'creative_writing') {
        updateFormData('component.setting', suggestion.text);
      } else if (snippet.type === 'instruction' && formData.category === 'creative_writing') {
        updateFormData('component.character', suggestion.text);
      }
    }
  };
  
  // Next step
  const handleNextStep = () => {
    if (currentStep === 0 && !formData.category) {
      toast({
        variant: "destructive",
        title: "Category required",
        description: "Please select a category before proceeding",
      });
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      
      // Generate prompt at the preview step
      if (currentStep === 2) {
        generatePrompt();
      }
    }
  };
  
  // Previous step
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (showLoginPrompt) {
    return <LoginPrompt message="Log in to build and save your custom prompts with personalized suggestions!" onClose={() => setShowLoginPrompt(false)} />;
  }

  return (
    <div className="container py-8">
      <SEO 
        title="Interactive Prompt Builder" 
        description="Build custom prompts with AI-powered personalized suggestions" 
      />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text mb-2">Interactive Prompt Builder</h1>
        <p className="text-muted-foreground">Create custom prompts with personalized suggestions</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <PromptBuilderStepper 
              currentStep={currentStep}
              formData={formData}
              updateFormData={updateFormData}
            />
            
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={handlePrevStep}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={saveProgress}
                >
                  Save Progress
                </Button>
                
                {currentStep === 3 ? (
                  <Button 
                    variant="default" 
                    onClick={saveAsPrompt}
                  >
                    Save as Prompt
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    onClick={handleNextStep}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
        
        <div className="space-y-6">
          <PromptBuilderPreview 
            formData={formData}
            generatedPrompt={generatedPrompt}
          />
          
          <PromptBuilderSuggestions 
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>
      </div>
    </div>
  );
};

export default PromptBuilderPage;
