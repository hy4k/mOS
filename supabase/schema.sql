-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  encrypted_content TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add due_date to existing table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='due_date') THEN
        ALTER TABLE items ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
    END IF;
END
$$;

-- Enable Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Policy: Users can only select their own items
CREATE POLICY "Users can view their own items" 
ON items FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can only insert their own items
CREATE POLICY "Users can insert their own items" 
ON items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own items
CREATE POLICY "Users can update their own items" 
ON items FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can only delete their own items
CREATE POLICY "Users can delete their own items" 
ON items FOR DELETE 
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
