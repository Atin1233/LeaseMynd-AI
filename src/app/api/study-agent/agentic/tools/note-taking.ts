/**
 * Note-Taking Tool
 * Create, update, search, and manage study notes
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { ChatOpenAI } from "@langchain/openai";
import type { StudyNote, NoteInput } from "../types";

// In-memory note store (in production, this would be in the database)
const noteStore = new Map<string, StudyNote>();

const NoteSchema = z.object({
  action: z
    .enum(["create", "update", "delete", "list", "search", "get", "summarize"])
    .describe("The action to perform on notes"),
  userId: z.string().describe("The user ID"),
  noteId: z.string().optional().describe("Note ID for update/delete/get actions"),
  data: z
    .object({
      title: z.string().optional(),
      content: z.string().optional(),
      format: z.enum(["text", "markdown", "bullet_points"]).optional(),
      tags: z.array(z.string()).optional(),
      relatedDocuments: z.array(z.string()).optional(),
      relatedConcepts: z.array(z.string()).optional(),
      isFavorite: z.boolean().optional(),
      isArchived: z.boolean().optional(),
    })
    .optional()
    .describe("Note data for create/update actions"),
  searchQuery: z.string().optional().describe("Search query for finding notes"),
  filters: z
    .object({
      tags: z.array(z.string()).optional(),
      isFavorite: z.boolean().optional(),
      isArchived: z.boolean().optional(),
      createdAfter: z.string().optional(),
      createdBefore: z.string().optional(),
    })
    .optional()
    .describe("Filters for list action"),
});

/**
 * Search notes using simple text matching
 */
function searchNotes(notes: StudyNote[], query: string): StudyNote[] {
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/).filter(Boolean);

  return notes
    .map((note) => {
      const searchText = `${note.title} ${note.content} ${note.tags.join(" ")} ${note.relatedConcepts.join(" ")}`.toLowerCase();
      const matchCount = words.filter((word) => searchText.includes(word)).length;
      return { note, score: matchCount / words.length };
    })
    .filter(({ score }) => score > 0.3)
    .sort((a, b) => b.score - a.score)
    .map(({ note }) => note);
}

/**
 * Summarize note content using AI
 */
async function summarizeNote(note: StudyNote): Promise<string> {
  const chat = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.5,
    timeout: 15000,
  });

  const response = await chat.invoke([
    {
      role: "system",
      content:
        "You are a helpful study assistant. Summarize the following note concisely, highlighting key points and main ideas. Keep it under 100 words.",
    },
    {
      role: "user",
      content: `Title: ${note.title}\n\nContent:\n${note.content}`,
    },
  ]);

  return typeof response.content === "string"
    ? response.content
    : JSON.stringify(response.content);
}

/**
 * Manage study notes
 */
export async function manageNotes(
  input: NoteInput & { userId: string }
): Promise<{
  success: boolean;
  note?: StudyNote;
  notes?: StudyNote[];
  summary?: string;
  message: string;
}> {
  const now = new Date();

  switch (input.action) {
    case "create": {
      if (!input.data?.title && !input.data?.content) {
        return {
          success: false,
          message: "Note title or content is required",
        };
      }

      const newNote: StudyNote = {
        id: uuidv4(),
        userId: input.userId,
        title: input.data?.title ?? "Untitled Note",
        content: input.data?.content ?? "",
        format: input.data?.format ?? "text",
        tags: input.data?.tags ?? [],
        relatedDocuments: input.data?.relatedDocuments ?? [],
        relatedConcepts: input.data?.relatedConcepts ?? [],
        linkedNotes: [],
        createdAt: now,
        updatedAt: now,
        isFavorite: input.data?.isFavorite ?? false,
        isArchived: false,
      };

      noteStore.set(newNote.id, newNote);
      console.log(`📝 [Notes] Created note: ${newNote.title}`);

      return {
        success: true,
        note: newNote,
        message: `Created note "${newNote.title}"${newNote.tags.length > 0 ? ` with tags: ${newNote.tags.join(", ")}` : ""}`,
      };
    }

    case "update": {
      if (!input.noteId) {
        return { success: false, message: "Note ID is required for update" };
      }

      const existingNote = noteStore.get(input.noteId);
      if (!existingNote) {
        return { success: false, message: "Note not found" };
      }

      const updatedNote: StudyNote = {
        ...existingNote,
        title: input.data?.title ?? existingNote.title,
        content: input.data?.content ?? existingNote.content,
        format: input.data?.format ?? existingNote.format,
        tags: input.data?.tags ?? existingNote.tags,
        relatedDocuments: input.data?.relatedDocuments ?? existingNote.relatedDocuments,
        relatedConcepts: input.data?.relatedConcepts ?? existingNote.relatedConcepts,
        isFavorite: input.data?.isFavorite ?? existingNote.isFavorite,
        isArchived: input.data?.isArchived ?? existingNote.isArchived,
        updatedAt: now,
      };

      noteStore.set(input.noteId, updatedNote);
      console.log(`📝 [Notes] Updated note: ${updatedNote.title}`);

      return {
        success: true,
        note: updatedNote,
        message: `Updated note "${updatedNote.title}"`,
      };
    }

    case "delete": {
      if (!input.noteId) {
        return { success: false, message: "Note ID is required for delete" };
      }

      const note = noteStore.get(input.noteId);
      if (!note) {
        return { success: false, message: "Note not found" };
      }

      noteStore.delete(input.noteId);
      console.log(`🗑️ [Notes] Deleted note: ${note.title}`);

      return {
        success: true,
        message: `Deleted note "${note.title}"`,
      };
    }

    case "get": {
      if (!input.noteId) {
        return { success: false, message: "Note ID is required" };
      }

      const note = noteStore.get(input.noteId);
      if (!note) {
        return { success: false, message: "Note not found" };
      }

      return {
        success: true,
        note,
        message: `Found note "${note.title}"`,
      };
    }

    case "search": {
      if (!input.searchQuery) {
        return { success: false, message: "Search query is required" };
      }

      const userNotes = Array.from(noteStore.values()).filter(
        (n) => n.userId === input.userId && !n.isArchived
      );

      const results = searchNotes(userNotes, input.searchQuery);
      console.log(
        `🔍 [Notes] Search for "${input.searchQuery}" found ${results.length} notes`
      );

      return {
        success: true,
        notes: results,
        message:
          results.length > 0
            ? `Found ${results.length} notes matching "${input.searchQuery}"`
            : `No notes found matching "${input.searchQuery}"`,
      };
    }

    case "list": {
      let notes = Array.from(noteStore.values()).filter(
        (n) => n.userId === input.userId
      );

      // Apply filters
      if (input.filters?.tags && input.filters.tags.length > 0) {
        notes = notes.filter((n) =>
          input.filters!.tags!.some((tag) => n.tags.includes(tag))
        );
      }
      if (input.filters?.isFavorite !== undefined) {
        notes = notes.filter((n) => n.isFavorite === input.filters!.isFavorite);
      }
      if (input.filters?.isArchived !== undefined) {
        notes = notes.filter((n) => n.isArchived === input.filters!.isArchived);
      } else {
        // By default, exclude archived notes
        notes = notes.filter((n) => !n.isArchived);
      }
      if (input.filters?.createdAfter) {
        const after = new Date(input.filters.createdAfter);
        notes = notes.filter((n) => n.createdAt >= after);
      }
      if (input.filters?.createdBefore) {
        const before = new Date(input.filters.createdBefore);
        notes = notes.filter((n) => n.createdAt <= before);
      }

      // Sort by updated date (most recent first)
      notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      const favoriteCount = notes.filter((n) => n.isFavorite).length;

      console.log(`📝 [Notes] Listed ${notes.length} notes`);

      return {
        success: true,
        notes,
        message: `Found ${notes.length} notes${favoriteCount > 0 ? ` (${favoriteCount} favorites)` : ""}`,
      };
    }

    case "summarize": {
      if (!input.noteId) {
        return { success: false, message: "Note ID is required for summarize" };
      }

      const note = noteStore.get(input.noteId);
      if (!note) {
        return { success: false, message: "Note not found" };
      }

      try {
        const summary = await summarizeNote(note);
        console.log(`📋 [Notes] Summarized note: ${note.title}`);

        return {
          success: true,
          note,
          summary,
          message: `Summary of "${note.title}": ${summary}`,
        };
      } catch (error) {
        return {
          success: false,
          message: "Failed to summarize note",
        };
      }
    }

    default:
      return { success: false, message: "Unknown action" };
  }
}

/**
 * Note-Taking Tool for LangChain
 */
export const noteTakingTool = tool(
  async (input): Promise<string> => {
    try {
      const result = await manageNotes({
        action: input.action,
        userId: input.userId,
        noteId: input.noteId,
        data: input.data,
        searchQuery: input.searchQuery,
        filters: input.filters,
      });

      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  {
    name: "take_notes",
    description: `Manage study notes - create, update, search, list, or summarize notes.
Use this when the user wants to:
- Create a new note or write something down
- Update or edit an existing note
- Search through their notes
- View their notes list
- Summarize a note's content
- Mark a note as favorite

Examples: "Take a note about photosynthesis", "Add to my chemistry notes", "Find my notes about the French Revolution", "Show me my favorite notes", "Summarize my calculus notes"`,
    schema: NoteSchema,
  }
);

