
import React from 'react';
import { usePromptBuilder } from '@/hooks/use-prompt-builder';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PromptBuilderStepOne = () => {
  const { formData, updateFormData } = usePromptBuilder();

  const categories = [
    { value: "creative_writing", label: "Creative Writing" },
    { value: "business", label: "Business" },
    { value: "coding", label: "Coding" },
    { value: "education", label: "Education" },
    { value: "general", label: "General" }
  ];

  const tones = [
    { value: "professional", label: "Professional" },
    { value: "casual", label: "Casual" },
    { value: "friendly", label: "Friendly" },
    { value: "authoritative", label: "Authoritative" },
    { value: "humorous", label: "Humorous" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Define Your Prompt's Purpose</h2>
        <p className="text-muted-foreground mb-6">
          Start by selecting a category and defining the core purpose of your prompt.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => updateFormData('category', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tone">Tone</Label>
          <Select
            value={formData.tone}
            onValueChange={(value) => updateFormData('tone', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a tone" />
            </SelectTrigger>
            <SelectContent>
              {tones.map((tone) => (
                <SelectItem key={tone.value} value={tone.value}>
                  {tone.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="audience">Target Audience</Label>
          <Input
            id="audience"
            placeholder="Who is this prompt targeting?"
            value={formData.audience || ""}
            onChange={(e) => updateFormData('audience', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default PromptBuilderStepOne;
