import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Prompt } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useCategories } from '@/hooks/use-categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { capitalizeTitle } from '@/lib/utils/text-utils';

interface EditBeforeSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: Prompt;
  onSave: (editedPrompt: Partial<Prompt>) => void;
  loading?: boolean;
}

const EditBeforeSaveDialog: React.FC<EditBeforeSaveDialogProps> = ({
  open,
  onOpenChange,
  prompt,
  onSave,
  loading = false
}) => {
  // Get categories
  const { categories } = useCategories();

  // State for edited prompt
  const [title, setTitle] = useState(prompt.title || '');
  const [text, setText] = useState(prompt.text || '');
  const [description, setDescription] = useState(prompt.description || '');
  const [category, setCategory] = useState(prompt.category || 'general');
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>(
    // Filter out system tags like 'spotlight' and 'featured'
    (prompt.tags || []).filter(tag =>
      !['spotlight', 'featured', 'spotlight_copy'].includes(tag)
    )
  );
  const [newTag, setNewTag] = useState('');

  // Handle adding a new tag
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
      setTags([...tags, newTag.trim().toLowerCase()]);
      setNewTag('');
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle key down in tag input
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Handle save
  const handleSave = () => {
    // Auto-capitalize the title
    const capitalizedTitle = capitalizeTitle(title);

    onSave({
      title: capitalizedTitle,
      text,
      description: description || undefined,
      category,
      tags: tags.length > 0 ? tags : undefined,
      is_public: isPublic
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save to My Collection</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this prompt"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="text">Prompt Text</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the prompt text"
              className="min-h-[150px]"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description"
              className="min-h-[80px]"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add a tag and press Enter"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center text-xs"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-public"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked as boolean)}
              />
              <Label htmlFor="is-public">Make this prompt public</Label>
            </div>
            {isPublic && (
              <p className="text-xs text-muted-foreground ml-6">
                Public prompts can be discovered by other users
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !title || !text}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save to My Collection'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditBeforeSaveDialog;
