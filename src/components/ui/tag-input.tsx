import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "employee" | "department" | "tools";
}

const variantStyles = {
  default: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  employee: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50",
  department: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50",
  tools: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50",
};

export function TagInput({ 
  value, 
  onChange, 
  placeholder = "Add tag...", 
  className,
  disabled = false,
  variant = "default"
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = () => {
    const tag = inputValue.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
      setInputValue("");
    }
  };

  const removeTag = (index: number) => {
    const newTags = value.filter((_, i) => i !== index);
    onChange(newTags);
  };

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {value.map((tag, index) => (
        <Badge
          key={`${tag}-${index}`}
          className={cn(
            "flex items-center gap-1 pr-1",
            variantStyles[variant]
          )}
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      {!disabled && (
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] h-8 text-sm border-dashed"
        />
      )}
    </div>
  );
}

interface TagDisplayProps {
  tags: string[];
  variant?: "default" | "employee" | "department" | "tools";
  className?: string;
}

export function TagDisplay({ tags, variant = "default", className }: TagDisplayProps) {
  if (tags.length === 0) return null;
  
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag, index) => (
        <Badge
          key={`${tag}-${index}`}
          className={cn("text-xs", variantStyles[variant])}
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
}
