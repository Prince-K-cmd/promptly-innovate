
import React from 'react';
import { usePromptBuilder } from '@/hooks/use-prompt-builder';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const PromptBuilderStepThree = () => {
  const { formData, updateFormData } = usePromptBuilder();

  const outputFormats = [
    { value: "paragraph", label: "Paragraph" },
    { value: "bullet_points", label: "Bullet Points" },
    { value: "numbered_list", label: "Numbered List" },
    { value: "code_block", label: "Code Block" },
    { value: "table", label: "Table" },
    { value: "essay", label: "Essay" },
    { value: "story", label: "Story" },
    { value: "conversation", label: "Conversation" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Refine Output Format</h2>
        <p className="text-muted-foreground mb-6">
          Specify how you want the AI's response to be structured and formatted.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="outputFormat">Preferred Output Format</Label>
          <Select
            value={formData.components.outputFormat || ""}
            onValueChange={(value) => updateFormData('component.outputFormat', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a format" />
            </SelectTrigger>
            <SelectContent>
              {outputFormats.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="outputLength">Approximate Length</Label>
          <Input
            id="outputLength"
            placeholder="E.g., 300 words, 3 paragraphs"
            value={formData.components.outputLength || ""}
            onChange={(e) => updateFormData('component.outputLength', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="additionalInstructions">Additional Instructions</Label>
          <Textarea
            id="additionalInstructions"
            placeholder="Any other specific instructions for the output format?"
            className="min-h-[120px]"
            value={formData.components.additionalInstructions || ""}
            onChange={(e) => updateFormData('component.additionalInstructions', e.target.value)}
          />
        </div>

        <Card className="mt-4 bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-sm">
              <p className="font-medium mb-2">Preview of your prompt requirements:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><span className="font-medium">Category:</span> {formData.category || "Not specified"}</li>
                <li><span className="font-medium">Tone:</span> {formData.tone || "Not specified"}</li>
                <li><span className="font-medium">Audience:</span> {formData.audience || "Not specified"}</li>
                <li><span className="font-medium">Format:</span> {formData.components.outputFormat || "Not specified"}</li>
                <li><span className="font-medium">Length:</span> {formData.components.outputLength || "Not specified"}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PromptBuilderStepThree;
