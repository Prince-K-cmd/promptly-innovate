
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePrompts } from '@/hooks/use-prompts';
import { usePromptBuilder, PromptBuilderFormData } from '@/hooks/use-prompt-builder';
import { useAIServices } from '@/hooks/use-ai-services';
import { useApiKeys } from '@/hooks/use-api-keys';
import { AISuggestion } from '@/services/ai';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/lib/performance';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import SeoComponent from '@/components/SEO';
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
  const { saveBuilderHistory } = usePromptBuilder();
  const { apiKeys } = useApiKeys();
  const {
    isGenerating,
    generateSuggestions,
    generatePrompt: generateAIPrompt,
    getAvailableProviders
  } = useAIServices();

  // Load saved form data from localStorage if available
  const loadSavedFormData = (): PromptBuilderFormData => {
    try {
      const savedData = localStorage.getItem('promptBuilderFormData');

      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Error loading saved form data:', error);
    }
    return defaultFormData;
  };

  const [formData, setFormData] = useState<PromptBuilderFormData>(loadSavedFormData());
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const savedStep = localStorage.getItem('promptBuilderStep');
      return savedStep ? parseInt(savedStep, 10) : 0;
    } catch (error) {
      return 0;
    }
  });
  const [generatedPrompt, setGeneratedPrompt] = useState(() => {
    try {
      return localStorage.getItem('promptBuilderGeneratedPrompt') || '';
    } catch (error) {
      return '';
    }
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const debouncedFormData = useDebounce(formData, 500);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('promptBuilderFormData', JSON.stringify(formData));
    } catch (error) {
      console.error('Error saving form data to localStorage:', error);
    }
  }, [formData]);

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('promptBuilderStep', currentStep.toString());
    } catch (error) {
      console.error('Error saving step to localStorage:', error);
    }
  }, [currentStep]);

  // Save generated prompt to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('promptBuilderGeneratedPrompt', generatedPrompt);
    } catch (error) {
      console.error('Error saving generated prompt to localStorage:', error);
    }
  }, [generatedPrompt]);

  // Initialize page and handle authentication state
  useEffect(() => {
    // Show login prompt if not authenticated
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
    }

    // Set page as loaded after a short delay to ensure all state is properly initialized
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // Load initial suggestions only once when the component mounts
  useEffect(() => {
    // Only load suggestions if authenticated and page is ready
    if (!isAuthenticated || isPageLoading) {
      return;
    }

    // Use a flag to prevent multiple calls
    let isMounted = true;

    const loadInitialSuggestions = async () => {
      // Don't load if we already have suggestions
      if (suggestions.length > 0) {
        return;
      }

      try {
        // Make sure we have the current form data
        console.log('Loading initial suggestions for step:', currentStep);
        console.log('Current form data:', formData);

        const initialSuggestions = await generateSuggestions({
          ...formData,
          step: currentStep
        });

        // Only update state if component is still mounted
        if (isMounted) {
          console.log('Setting initial suggestions:', initialSuggestions);
          setSuggestions(initialSuggestions);
        }
      } catch (error) {
        console.error('Error loading initial suggestions:', error);
      }
    };

    // Add a small delay to ensure all state is properly initialized
    const timer = setTimeout(() => {
      loadInitialSuggestions();
    }, 500);

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isPageLoading]); // Intentionally omitting other dependencies to prevent infinite loops

  // Set active provider based on available API keys - only run once when apiKeys change
  useEffect(() => {
    // Only update if we're authenticated
    if (!isAuthenticated) {
      return;
    }

    const availableProviders = getAvailableProviders();
    if (availableProviders.length > 0) {
      setActiveProvider(availableProviders[0]);
    } else {
      setActiveProvider(null);
    }
  }, [apiKeys, getAvailableProviders, isAuthenticated]);

  // This comment is kept for clarity but the state declaration has been moved up

  // Generate suggestions when form data changes or when step changes
  useEffect(() => {
    // Only fetch suggestions if we're authenticated and not already fetching
    if (!isAuthenticated || isFetchingSuggestions || isGenerating) {
      return;
    }

    // For step 0, we don't need any form data
    // For other steps, we need at least the category
    if (currentStep > 0 && !debouncedFormData.category) {
      return;
    }

    // Skip if we already have suggestions and nothing has changed
    if (suggestions.length > 0 && !debouncedFormData.category) {
      return;
    }

    // Use a flag to track the current request
    let isCancelled = false;

    const fetchSuggestions = async () => {
      try {
        setIsFetchingSuggestions(true);
        console.log(`Fetching suggestions for step ${currentStep}`);

        const results = await generateSuggestions({
          ...debouncedFormData,
          step: currentStep
        });

        // Only update state if the component is still mounted and this is the latest request
        if (!isCancelled) {
          console.log(`Setting suggestions for step ${currentStep}:`, results);
          setSuggestions(results);
        }
      } catch (error) {
        console.error('Error generating suggestions:', error);
      } finally {
        if (!isCancelled) {
          setIsFetchingSuggestions(false);
        }
      }
    };

    // Add a small delay before fetching to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 1000);

    // Cleanup function to prevent state updates after unmount or when dependencies change
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFormData, currentStep, isAuthenticated, isFetchingSuggestions, isGenerating, suggestions.length]);
  // Note: generateSuggestions is intentionally omitted to prevent infinite loops

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

  // Generate creative writing prompt
  const generateCreativeWritingPrompt = () => {
    let prompt = `Write a creative story`;

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

    return prompt;
  };

  // Generate business prompt
  const generateBusinessPrompt = () => {
    let prompt = `Create a ${formData.components.documentType || 'document'}`;

    if (formData.components.topic) {
      prompt += ` about ${formData.components.topic}`;
    }
    if (formData.audience) {
      prompt += ` for ${formData.audience}`;
    }
    if (formData.components.sections) {
      prompt += `. Include sections on ${formData.components.sections}`;
    }

    return prompt;
  };

  // Generate coding prompt
  const generateCodingPrompt = () => {
    let prompt = `Write ${formData.components.language || 'code'}`;

    if (formData.components.functionality) {
      prompt += ` that ${formData.components.functionality}`;
    }
    if (formData.components.implementation) {
      prompt += `. Implementation details: ${formData.components.implementation}`;
    }

    return prompt;
  };

  // Generate generic prompt
  const generateGenericPrompt = () => {
    let prompt = `Create content`;

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

    return prompt;
  };

  // Generate template-based prompt
  const generateTemplatePrompt = () => {
    let prompt = '';

    // Select template based on category
    switch (formData.category) {
      case 'creative_writing':
        prompt = generateCreativeWritingPrompt();
        break;
      case 'business':
        prompt = generateBusinessPrompt();
        break;
      case 'coding':
        prompt = generateCodingPrompt();
        break;
      default:
        prompt = generateGenericPrompt();
    }

    return prompt + '.';
  };

  // Generate prompt from form data
  const generatePrompt = async () => {
    // Try to generate with AI first
    if (activeProvider) {
      try {
        const aiPrompt = await generateAIPrompt({
          ...formData,
          step: currentStep
        });

        if (aiPrompt) {
          setGeneratedPrompt(aiPrompt);
          return aiPrompt;
        }
      } catch (error) {
        console.error('Error generating AI prompt:', error);
        // Fall back to template-based generation
      }
    }

    // Fallback to template-based generation
    const prompt = generateTemplatePrompt();
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

  // Reset the prompt builder to start fresh
  const resetPromptBuilder = () => {
    // Clear form data
    setFormData(defaultFormData);

    // Reset step to beginning
    setCurrentStep(0);

    // Clear generated prompt
    setGeneratedPrompt('');

    // Clear suggestions
    setSuggestions([]);

    // Clear localStorage
    try {
      localStorage.removeItem('promptBuilderFormData');
      localStorage.removeItem('promptBuilderStep');
      localStorage.removeItem('promptBuilderGeneratedPrompt');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }

    // Show success message
    toast({
      title: "Started new prompt",
      description: "You can now create a fresh prompt",
    });
  };

  // Save as prompt
  const saveAsPrompt = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      const finalPrompt = generatedPrompt || await generatePrompt();
      await createPrompt({
        title: `${formData.category} prompt - ${new Date().toLocaleDateString()}`,
        text: finalPrompt,
        category: formData.category || 'general',
        is_public: false,
        tags: [formData.category, formData.tone, formData.audience].filter(Boolean),
        description: `Generated with Prompt Builder. Category: ${formData.category}, Tone: ${formData.tone}, Audience: ${formData.audience}`
      });

      toast({
        title: "Prompt saved",
        description: "Your custom prompt has been saved to your library",
      });

      // Show a dialog asking if the user wants to start a new prompt or go to library
      const goToLibrary = window.confirm("Prompt saved successfully! Would you like to go to your library? Click 'OK' to go to library or 'Cancel' to start a new prompt.");

      if (goToLibrary) {
        // Navigate to library
        navigate('/library');
      } else {
        // Reset the prompt builder to start fresh
        resetPromptBuilder();
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        variant: "destructive",
        title: "Failed to save prompt",
        description: error.message || "An unexpected error occurred",
      });
    }
  };

  // Helper function to handle snippet suggestions based on category
  const handleSnippetSuggestion = (suggestion: AISuggestion) => {
    const suggestionValue = suggestion.value || suggestion.text;

    // Handle snippets differently based on the current step and category
    if (currentStep === 3) {
      // If we're on the final step, add the snippet to the goal field
      updateFormData('goal', suggestionValue);
      return;
    }

    // Handle based on category
    switch (formData.category) {
      case 'creative_writing':
        // For creative writing, add snippets to appropriate fields
        if (!formData.components.theme) {
          updateFormData('component.theme', suggestionValue);
        } else if (!formData.components.character) {
          updateFormData('component.character', suggestionValue);
        } else {
          updateFormData('component.setting', suggestionValue);
        }
        break;

      case 'business':
        // For business, add snippets to appropriate fields
        if (!formData.components.documentType) {
          updateFormData('component.documentType', suggestionValue);
        } else if (!formData.components.topic) {
          updateFormData('component.topic', suggestionValue);
        } else {
          updateFormData('component.sections', suggestionValue);
        }
        break;

      default:
        // Default: add to goal field
        updateFormData('goal', suggestionValue);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion: AISuggestion) => {
    // Update form data based on suggestion type
    switch (suggestion.type) {
      case 'category':
        updateFormData('category', suggestion.value);
        break;

      case 'tone':
        updateFormData('tone', suggestion.value);
        break;

      case 'audience':
        updateFormData('audience', suggestion.value);
        break;

      case 'snippet':
        handleSnippetSuggestion(suggestion);
        break;
    }

    // If we're on the final step, regenerate the prompt to include the new suggestion
    if (currentStep === 3) {
      await generatePrompt();
    }
  };

  // Next step
  const handleNextStep = async () => {
    if (currentStep === 0 && !formData.category) {
      toast({
        variant: "destructive",
        title: "Category required",
        description: "Please select a category before proceeding",
      });
      return;
    }

    if (currentStep < 3) {
      // Clear current suggestions before changing step
      setSuggestions([]);

      // Update step
      setCurrentStep(currentStep + 1);

      // Generate prompt at the preview step
      if (currentStep === 2) {
        await generatePrompt();
      }
    }
  };

  // Previous step
  const handlePrevStep = () => {
    if (currentStep > 0) {
      // Clear current suggestions before changing step
      setSuggestions([]);

      // Update step
      setCurrentStep(currentStep - 1);
    }
  };

  // Render login prompt if user is not authenticated
  if (!isAuthenticated && showLoginPrompt) {
    return <LoginPrompt message="Log in to build and save your custom prompts with personalized suggestions!" onClose={() => setShowLoginPrompt(false)} />;
  }

  // Always render the main component structure, even during loading
  return (
    <div className="container py-8">
      <SeoComponent
        title="Interactive Prompt Builder"
        description="Build custom prompts with AI-powered personalized suggestions"
      />

      {/* Always show the header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text mb-2">Interactive Prompt Builder</h1>
        <p className="text-muted-foreground">Create custom prompts with personalized suggestions</p>
      </div>

      {/* Show loading spinner or content */}
      {isPageLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <PromptBuilderStepper
                  currentStep={currentStep}
                  formData={formData}
                  updateFormData={updateFormData}
                  generatedPrompt={generatedPrompt}
                />

                <div className="flex flex-col space-y-4 mt-6">
                  {/* New Prompt Button - Only show on final step */}
                  {currentStep === 3 && (
                    <div className="flex justify-center w-full">
                      <Button
                        variant="secondary"
                        onClick={resetPromptBuilder}
                        className="w-full md:w-auto flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Start New Prompt
                      </Button>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
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
                isLoading={isGenerating}
                providerName={activeProvider}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PromptBuilderPage;
