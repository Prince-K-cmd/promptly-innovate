
import React from 'react';
import { usePromptBuilder } from '@/hooks/use-prompt-builder';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const PromptBuilderStepTwo = () => {
  const { formData, updateFormData } = usePromptBuilder();

  // Show different fields based on the selected category
  const renderCategorySpecificFields = () => {
    switch (formData.category) {
      case 'creative_writing':
        return (
          <>
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Input
                id="theme"
                placeholder="What is the theme of your story?"
                value={formData.components.theme || ""}
                onChange={(e) => updateFormData('component.theme', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="character">Main Character</Label>
              <Input
                id="character"
                placeholder="Describe the main character"
                value={formData.components.character || ""}
                onChange={(e) => updateFormData('component.character', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="setting">Setting</Label>
              <Input
                id="setting"
                placeholder="Where does the story take place?"
                value={formData.components.setting || ""}
                onChange={(e) => updateFormData('component.setting', e.target.value)}
              />
            </div>
          </>
        );

      case 'business':
        return (
          <>
            <div>
              <Label htmlFor="documentType">Document Type</Label>
              <Input
                id="documentType"
                placeholder="E.g., proposal, report, email"
                value={formData.components.documentType || ""}
                onChange={(e) => updateFormData('component.documentType', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="What is this document about?"
                value={formData.components.topic || ""}
                onChange={(e) => updateFormData('component.topic', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="sections">Key Sections</Label>
              <Input
                id="sections"
                placeholder="What sections should be included?"
                value={formData.components.sections || ""}
                onChange={(e) => updateFormData('component.sections', e.target.value)}
              />
            </div>
          </>
        );

      case 'coding':
        return (
          <>
            <div>
              <Label htmlFor="language">Programming Language</Label>
              <Input
                id="language"
                placeholder="E.g., JavaScript, Python, Java"
                value={formData.components.language || ""}
                onChange={(e) => updateFormData('component.language', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="functionality">Functionality</Label>
              <Textarea
                id="functionality"
                placeholder="What should the code do?"
                className="min-h-[100px]"
                value={formData.components.functionality || ""}
                onChange={(e) => updateFormData('component.functionality', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="implementation">Implementation Details</Label>
              <Textarea
                id="implementation"
                placeholder="Any specific implementation requirements?"
                className="min-h-[100px]"
                value={formData.components.implementation || ""}
                onChange={(e) => updateFormData('component.implementation', e.target.value)}
              />
            </div>
          </>
        );

      default:
        return (
          <div>
            <Label htmlFor="context">Additional Context</Label>
            <Textarea
              id="context"
              placeholder="Add any additional context or requirements for your prompt"
              className="min-h-[200px]"
              value={formData.goal || ""}
              onChange={(e) => updateFormData('goal', e.target.value)}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Add Context & Details</h2>
        <p className="text-muted-foreground mb-6">
          Provide context and specific details to make your prompt more effective.
        </p>
      </div>

      <div className="space-y-4">
        {renderCategorySpecificFields()}
      </div>
    </div>
  );
};

export default PromptBuilderStepTwo;
