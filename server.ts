import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new Database(path.join(__dirname, "database.sqlite"));

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    category TEXT,
    title TEXT,
    content TEXT,
    encrypted_content TEXT,
    tags TEXT,
    is_pinned INTEGER DEFAULT 0,
    is_archived INTEGER DEFAULT 0,
    metadata TEXT,
    created_at TEXT,
    updated_at TEXT
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Get all items
  app.get("/api/items", (req, res) => {
    try {
      const items = db.prepare("SELECT * FROM items ORDER BY updated_at DESC").all();
      
      // Parse JSON fields
      const parsedItems = items.map((item: any) => ({
        ...item,
        tags: item.tags ? JSON.parse(item.tags) : [],
        metadata: item.metadata ? JSON.parse(item.metadata) : {},
        is_pinned: Boolean(item.is_pinned),
        is_archived: Boolean(item.is_archived)
      }));
      
      res.json(parsedItems);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create item
  app.post("/api/items", (req, res) => {
    try {
      const item = req.body;
      const id = item.id || Math.random().toString(36).substr(2, 9);
      const now = new Date().toISOString();
      
      const stmt = db.prepare(`
        INSERT INTO items (
          id, user_id, category, title, content, encrypted_content, 
          tags, is_pinned, is_archived, metadata, created_at, updated_at
        ) VALUES (
          @id, @user_id, @category, @title, @content, @encrypted_content,
          @tags, @is_pinned, @is_archived, @metadata, @created_at, @updated_at
        )
      `);
      
      stmt.run({
        id,
        user_id: item.user_id || 'default_user',
        category: item.category,
        title: item.title,
        content: item.content || '',
        encrypted_content: item.encrypted_content || null,
        tags: JSON.stringify(item.tags || []),
        is_pinned: item.is_pinned ? 1 : 0,
        is_archived: item.is_archived ? 1 : 0,
        metadata: JSON.stringify(item.metadata || {}),
        created_at: item.created_at || now,
        updated_at: item.updated_at || now
      });
      
      const newItem = db.prepare("SELECT * FROM items WHERE id = ?").get(id) as any;
      
      res.status(201).json({
        ...newItem,
        tags: newItem.tags ? JSON.parse(newItem.tags) : [],
        metadata: newItem.metadata ? JSON.parse(newItem.metadata) : {},
        is_pinned: Boolean(newItem.is_pinned),
        is_archived: Boolean(newItem.is_archived)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Import items
  app.post("/api/items/import", (req, res) => {
    try {
      const items = req.body.items;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Items must be an array" });
      }

      const now = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO items (
          id, user_id, category, title, content, encrypted_content, 
          tags, is_pinned, is_archived, metadata, created_at, updated_at
        ) VALUES (
          @id, @user_id, @category, @title, @content, @encrypted_content,
          @tags, @is_pinned, @is_archived, @metadata, @created_at, @updated_at
        )
        ON CONFLICT(id) DO UPDATE SET
          category = excluded.category,
          title = excluded.title,
          content = excluded.content,
          encrypted_content = excluded.encrypted_content,
          tags = excluded.tags,
          is_pinned = excluded.is_pinned,
          is_archived = excluded.is_archived,
          metadata = excluded.metadata,
          updated_at = excluded.updated_at
      `);

      const insertMany = db.transaction((itemsToInsert) => {
        for (const item of itemsToInsert) {
          stmt.run({
            id: item.id || Math.random().toString(36).substr(2, 9),
            user_id: item.user_id || 'default_user',
            category: item.category,
            title: item.title,
            content: item.content || '',
            encrypted_content: item.encrypted_content || null,
            tags: JSON.stringify(item.tags || []),
            is_pinned: item.is_pinned ? 1 : 0,
            is_archived: item.is_archived ? 1 : 0,
            metadata: JSON.stringify(item.metadata || {}),
            created_at: item.created_at || now,
            updated_at: item.updated_at || now
          });
        }
      });

      insertMany(items);
      res.status(200).json({ success: true, count: items.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update item
  app.put("/api/items/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const now = new Date().toISOString();
      
      // Get existing item
      const existing = db.prepare("SELECT * FROM items WHERE id = ?").get(id) as any;
      if (!existing) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      const updatedItem = {
        ...existing,
        ...updates,
        tags: updates.tags ? JSON.stringify(updates.tags) : existing.tags,
        metadata: updates.metadata ? JSON.stringify(updates.metadata) : existing.metadata,
        is_pinned: updates.is_pinned !== undefined ? (updates.is_pinned ? 1 : 0) : existing.is_pinned,
        is_archived: updates.is_archived !== undefined ? (updates.is_archived ? 1 : 0) : existing.is_archived,
        updated_at: now
      };
      
      const stmt = db.prepare(`
        UPDATE items SET
          category = @category,
          title = @title,
          content = @content,
          encrypted_content = @encrypted_content,
          tags = @tags,
          is_pinned = @is_pinned,
          is_archived = @is_archived,
          metadata = @metadata,
          updated_at = @updated_at
        WHERE id = @id
      `);
      
      stmt.run(updatedItem);
      
      const result = db.prepare("SELECT * FROM items WHERE id = ?").get(id) as any;
      
      res.json({
        ...result,
        tags: result.tags ? JSON.parse(result.tags) : [],
        metadata: result.metadata ? JSON.parse(result.metadata) : {},
        is_pinned: Boolean(result.is_pinned),
        is_archived: Boolean(result.is_archived)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete item
  app.delete("/api/items/:id", (req, res) => {
    try {
      const { id } = req.params;
      db.prepare("DELETE FROM items WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
