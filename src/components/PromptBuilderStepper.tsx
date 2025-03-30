
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePromptBuilder } from '@/hooks/use-prompt-builder';
import { useToast } from '@/hooks/use-toast';

// Step components
import PromptBuilderStepOne from './PromptBuilderStepOne';
import PromptBuilderStepTwo from './PromptBuilderStepTwo';
import PromptBuilderStepThree from './PromptBuilderStepThree';

const steps = [
  { id: 1, name: 'Define Purpose' },
  { id: 2, name: 'Add Context' },
  { id: 3, name: 'Refine Output' }
];

const PromptBuilderStepper = ({ currentStep, formData, updateFormData, generatedPrompt }) => {
  const [internalStep, setInternalStep] = useState(currentStep || 1);
  const { toast } = useToast();
  
  const handleNext = () => {
    // Validate current step
    if (internalStep === 1 && !formData.category) {
      toast({
        variant: "destructive",
        title: "Category is required",
        description: "Please select a category before proceeding."
      });
      return;
    }
    
    if (internalStep === 2) {
      // Validation depends on the category
      if (formData.category === 'creative_writing' && 
          (!formData.components.theme && !formData.components.character && !formData.components.setting)) {
        toast({
          variant: "destructive",
          title: "Details required",
          description: "Please add at least one detail before proceeding."
        });
        return;
      } else if (formData.category === 'business' && 
                (!formData.components.documentType && !formData.components.topic)) {
        toast({
          variant: "destructive",
          title: "Details required",
          description: "Please provide at least document type or topic before proceeding."
        });
        return;
      } else if (formData.category === 'coding' && !formData.components.functionality) {
        toast({
          variant: "destructive",
          title: "Functionality required",
          description: "Please describe what the code should do before proceeding."
        });
        return;
      } else if (!formData.category && !formData.goal) {
        toast({
          variant: "destructive",
          title: "Context required",
          description: "Please add some context to your prompt before proceeding."
        });
        return;
      }
    }
    
    if (internalStep < steps.length) {
      setInternalStep(internalStep + 1);
    }
  };
  
  const handlePrevious = () => {
    if (internalStep > 1) {
      setInternalStep(internalStep - 1);
    }
  };
  
  const handleReset = () => {
    // Reset form data by updating parent component
    if (typeof updateFormData === 'function') {
      // Reset category
      updateFormData('category', '');
      // Reset tone
      updateFormData('tone', '');
      // Reset audience
      updateFormData('audience', '');
      // Reset goal
      updateFormData('goal', '');
      // Reset components (this depends on the parent implementation)
      Object.keys(formData.components || {}).forEach(key => {
        updateFormData(`component.${key}`, '');
      });
    }
    
    // Reset step
    setInternalStep(1);
    
    toast({
      title: "Prompt builder reset",
      description: "All prompt details have been cleared."
    });
  };
  
  const isStepComplete = (step) => {
    switch (step) {
      case 1:
        return !!formData.category;
      case 2:
        if (formData.category === 'creative_writing') {
          return !!(formData.components.theme || formData.components.character || formData.components.setting);
        } else if (formData.category === 'business') {
          return !!(formData.components.documentType || formData.components.topic);
        } else if (formData.category === 'coding') {
          return !!formData.components.functionality;
        } else {
          return !!formData.goal;
        }
      case 3:
        return !!generatedPrompt;
      default:
        return false;
    }
  };
  
  return (
    <div className="w-full">
      {/* Steps indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => {
                  // Only allow moving to steps that are already completed or the current one
                  if (step.id < internalStep || (step.id === internalStep)) {
                    setInternalStep(step.id);
                  } else if (isStepComplete(internalStep)) {
                    setInternalStep(step.id);
                  } else {
                    toast({
                      variant: "destructive",
                      title: "Complete current step",
                      description: "Please complete the current step before moving ahead."
                    });
                  }
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  step.id === internalStep
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isStepComplete(step.id)
                    ? 'border-primary text-primary bg-background'
                    : 'border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                {isStepComplete(step.id) ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  step.id
                )}
              </button>
              {step.id < steps.length && (
                <div
                  className={`h-1 w-full ${
                    isStepComplete(step.id) ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          {steps.map((step) => (
            <div key={step.id} className="text-center text-sm">
              <span
                className={
                  step.id === internalStep ? 'text-primary font-medium' : 'text-muted-foreground'
                }
              >
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Current step content */}
      <Card>
        <CardContent className="pt-6">
          {internalStep === 1 && <PromptBuilderStepOne />}
          {internalStep === 2 && <PromptBuilderStepTwo />}
          {internalStep === 3 && <PromptBuilderStepThree />}
        </CardContent>
        <Separator />
        <CardFooter className="flex justify-between pt-4">
          <div>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
          <div className="flex space-x-2">
            {internalStep > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            {internalStep < steps.length ? (
              <Button onClick={handleNext}>Next</Button>
            ) : (
              <Button onClick={() => console.log("Complete")}>Complete</Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PromptBuilderStepper;
