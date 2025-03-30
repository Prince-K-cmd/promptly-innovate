
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePromptBuilder } from '@/hooks/use-prompt-builder';
import { useToast } from '@/hooks/use-toast'; // Fix missing import

// Step components
import PromptBuilderStepOne from './PromptBuilderStepOne';
import PromptBuilderStepTwo from './PromptBuilderStepTwo';
import PromptBuilderStepThree from './PromptBuilderStepThree';

const steps = [
  { id: 1, name: 'Define Purpose' },
  { id: 2, name: 'Add Context' },
  { id: 3, name: 'Refine Output' }
];

const PromptBuilderStepper = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { promptDetails, resetPromptBuilder } = usePromptBuilder();
  const { toast } = useToast(); // Fix missing import
  
  const handleNext = () => {
    // Validate current step
    if (currentStep === 1 && !promptDetails.purpose) {
      toast({
        variant: "destructive",
        title: "Purpose is required",
        description: "Please define the purpose of your prompt before proceeding."
      });
      return;
    }
    
    if (currentStep === 2 && !promptDetails.context) {
      toast({
        variant: "destructive",
        title: "Context is required",
        description: "Please add some context to your prompt before proceeding."
      });
      return;
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleReset = () => {
    resetPromptBuilder();
    setCurrentStep(1);
    toast({
      title: "Prompt builder reset",
      description: "All prompt details have been cleared."
    });
  };
  
  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return !!promptDetails.purpose;
      case 2:
        return !!promptDetails.context;
      case 3:
        return !!promptDetails.outputFormat;
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
                  if (step.id < currentStep || (step.id === currentStep)) {
                    setCurrentStep(step.id);
                  } else if (isStepComplete(currentStep)) {
                    setCurrentStep(step.id);
                  } else {
                    toast({
                      variant: "destructive",
                      title: "Complete current step",
                      description: "Please complete the current step before moving ahead."
                    });
                  }
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  step.id === currentStep
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
                  step.id === currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
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
          {currentStep === 1 && <PromptBuilderStepOne />}
          {currentStep === 2 && <PromptBuilderStepTwo />}
          {currentStep === 3 && <PromptBuilderStepThree />}
        </CardContent>
        <Separator />
        <CardFooter className="flex justify-between pt-4">
          <div>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
          <div className="flex space-x-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            {currentStep < steps.length ? (
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
