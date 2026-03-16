import { useState } from 'react';
import { Pencil } from 'lucide-react';

interface EditableTitleProps {
  initialTitle: string;
  onSave: (title: string) => void;
}

export function EditableTitle({ initialTitle, onSave }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);

  const handleBlur = () => {
    setIsEditing(false);
    if (title.trim() && title !== initialTitle) {
      onSave(title.trim());
    }
  };

  return (
    <div className="flex items-center gap-2 group">
      {isEditing ? (
        <input
          autoFocus
          className="text-xl font-bold bg-transparent border-b-2 border-primary outline-none w-full py-1"
          value={title}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          onChange={(e) => setTitle(e.target.value)}
        />
      ) : (
        <h1
          onClick={() => setIsEditing(true)}
          className="text-xl font-bold tracking-tight cursor-pointer"
        >
          {title}
        </h1>
      )}
      {!isEditing && (
        <Pencil
          className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={() => setIsEditing(true)}
        />
      )}
    </div>
  );
}
