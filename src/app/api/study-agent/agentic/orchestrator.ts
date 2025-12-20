/**
 * Study Buddy Agent Orchestrator
 * Main service for running the agentic workflow
 */

import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { getStudyBuddyGraph } from "./graph";
import { createInitialState, type StudyAgentState } from "./state";
import type {
  StudyAgentRequest,
  StudyAgentResponse,
  EmotionTag,
  Flashcard,
  Quiz,
  ConceptExplanation,
  StudyPlanItem,
} from "./types";

// ============================================================================
// Emotion Processing
// ============================================================================

/**
 * Emotion tags supported by ElevenLabs TTS
 */
const EMOTION_TAGS: EmotionTag[] = [
  "happy",
  "sad",
  "angry",
  "fearful",
  "surprised",
  "disgusted",
  "excited",
  "calm",
  "encouraging",
  "curious",
];

/**
 * Strip emotion tags from text for display
 */
function stripEmotionTags(text: string): string {
  let result = text;
  for (const tag of EMOTION_TAGS) {
    result = result.replace(new RegExp(`\\[${tag}\\]`, "gi"), "");
  }
  return result.trim();
}

/**
 * Add emotion tag to response for TTS
 */
function addEmotionTag(text: string, emotion: EmotionTag): string {
  // Check if already has emotion tag
  for (const tag of EMOTION_TAGS) {
    if (text.toLowerCase().includes(`[${tag}]`)) {
      return text;
    }
  }
  return `[${emotion}] ${text}`;
}

/**
 * Ensure trailing ellipses for natural TTS pauses
 */
function ensureTrailingEllipses(text: string): string {
  // Add ellipses after sentences for natural pauses
  return text
    .replace(/\.(\s+)(?=[A-Z])/g, "...$1")
    .replace(/\?(\s+)(?=[A-Z])/g, "?...$1")
    .replace(/!(\s+)(?=[A-Z])/g, "!...$1");
}

// ============================================================================
// Main Orchestrator
// ============================================================================

/**
 * Run the Study Buddy Agent workflow
 */
export async function runStudyBuddyAgent(
  request: StudyAgentRequest
): Promise<StudyAgentResponse> {
  const startTime = Date.now();

  console.log("🚀 [Study Buddy Agent] Starting workflow...");
  console.log(`   Mode: ${request.mode}`);
  console.log(`   User ID: ${request.userId}`);
  console.log(`   Documents: ${request.selectedDocuments?.length ?? 0}`);
  console.log(`   Message: ${request.message.substring(0, 100)}...`);

  try {
    // Get the compiled graph
    const graph = getStudyBuddyGraph();

    // Create initial state
    const initialState = createInitialState(request.userId, request.mode, {
      fieldOfStudy: request.fieldOfStudy,
      selectedDocuments: request.selectedDocuments,
      studyPlan: request.studyPlan,
      learningStyle: request.preferences?.learningStyle,
      preferredDifficulty: request.preferences?.preferredDifficulty,
    });

    // Build message history
    const messages = [];

    // Add conversation history if provided
    if (request.conversationHistory) {
      for (const msg of request.conversationHistory.slice(-10)) {
        // Keep last 10 messages
        if (msg.role === "user") {
          messages.push(new HumanMessage(msg.content));
        } else {
          messages.push(new AIMessage(msg.content));
        }
      }
    }

    // Add current message
    messages.push(new HumanMessage(request.message));

    // Run the graph
    const result = await graph.invoke(
      {
        ...initialState,
        messages,
      },
      {
        configurable: {
          userId: request.userId,
        },
      }
    );

    // Extract final response
    const finalState = result as StudyAgentState;
    const lastMessage = finalState.messages[finalState.messages.length - 1];

    let responseText =
      typeof lastMessage?.content === "string"
        ? lastMessage.content
        : extractTextFromContent(lastMessage?.content);

    // Process response for TTS
    const displayResponse = stripEmotionTags(responseText);
    const ttsResponse = ensureTrailingEllipses(
      addEmotionTag(responseText, finalState.emotion)
    );

    // Build response object
    const response: StudyAgentResponse = {
      response: ttsResponse,
      displayResponse,
      emotion: finalState.emotion,
      mode: request.mode,

      // Generated content
      flashcards:
        finalState.generatedFlashcards.length > 0
          ? finalState.generatedFlashcards
          : undefined,
      quiz:
        finalState.generatedQuizzes.length > 0
          ? finalState.generatedQuizzes[finalState.generatedQuizzes.length - 1]
          : undefined,
      conceptExplanation:
        finalState.conceptExplanations.length > 0
          ? finalState.conceptExplanations[
              finalState.conceptExplanations.length - 1
            ]
          : undefined,
      updatedStudyPlan:
        finalState.studyPlan.length > 0 ? finalState.studyPlan : undefined,

      // Metadata
      toolsUsed: finalState.toolsUsed,
      retrievedSources: finalState.retrievedContext.map((ctx) => ({
        documentTitle: ctx.documentTitle,
        page: ctx.page,
      })),
      confidence: finalState.confidence,
      processingTimeMs: Date.now() - startTime,

      // Suggestions
      suggestedQuestions: generateSuggestedQuestions(
        request.message,
        finalState
      ),
      relatedTopics: extractRelatedTopics(finalState),
    };

    console.log(
      `✅ [Study Buddy Agent] Completed in ${response.processingTimeMs}ms`
    );
    console.log(`   Tools used: ${response.toolsUsed.join(", ") || "none"}`);
    console.log(`   Emotion: ${response.emotion}`);

    return response;
  } catch (error) {
    console.error("❌ [Study Buddy Agent] Error:", error);

    // Return error response
    return {
      response: `[calm] I encountered an issue processing your request... Let me try again in a moment...`,
      displayResponse:
        "I encountered an issue processing your request. Let me try again in a moment.",
      emotion: "calm",
      mode: request.mode,
      toolsUsed: [],
      retrievedSources: [],
      confidence: 0.3,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract text from complex message content
 */
function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item) {
          return String(item.text);
        }
        return "";
      })
      .join("");
  }

  if (content && typeof content === "object" && "text" in content) {
    return String((content as { text: string }).text);
  }

  return "";
}

/**
 * Generate suggested follow-up questions
 */
function generateSuggestedQuestions(
  userMessage: string,
  state: StudyAgentState
): string[] {
  const suggestions: string[] = [];
  const lowerMessage = userMessage.toLowerCase();

  // Based on what was generated
  if (state.generatedFlashcards.length > 0) {
    suggestions.push("Quiz me on these flashcards!");
    suggestions.push("Can you make more flashcards on a related topic?");
  }

  if (state.generatedQuizzes.length > 0) {
    suggestions.push("Explain the answers to the quiz questions");
    suggestions.push("Create a harder quiz on this topic");
  }

  if (state.conceptExplanations.length > 0) {
    const lastConcept = state.conceptExplanations[state.conceptExplanations.length - 1];
    if (lastConcept?.relatedConcepts?.length > 0) {
      suggestions.push(
        `Explain ${lastConcept.relatedConcepts[0]} to me`
      );
    }
    suggestions.push("Can you give me more examples?");
  }

  // General suggestions based on mode
  if (state.mode === "study-buddy") {
    if (!lowerMessage.includes("flashcard")) {
      suggestions.push("Create flashcards for this topic");
    }
    if (!lowerMessage.includes("quiz")) {
      suggestions.push("Test my understanding with a quick quiz");
    }
  }

  if (state.mode === "teacher") {
    suggestions.push("Can you explain this in simpler terms?");
    suggestions.push("What are the key takeaways?");
  }

  return suggestions.slice(0, 3); // Return max 3 suggestions
}

/**
 * Extract related topics from generated content
 */
function extractRelatedTopics(state: StudyAgentState): string[] {
  const topics = new Set<string>();

  // From concept explanations
  for (const explanation of state.conceptExplanations) {
    for (const related of explanation.relatedConcepts ?? []) {
      topics.add(related);
    }
  }

  // From flashcards
  for (const card of state.generatedFlashcards) {
    if (card.topic) {
      topics.add(card.topic);
    }
  }

  // From quizzes
  for (const quiz of state.generatedQuizzes) {
    for (const question of quiz.questions) {
      if (question.topic) {
        topics.add(question.topic);
      }
    }
  }

  return Array.from(topics).slice(0, 5);
}

// ============================================================================
// Streaming Support (Future Enhancement)
// ============================================================================

/**
 * Run the Study Buddy Agent with streaming support
 * Returns an async generator for streaming responses
 */
export async function* streamStudyBuddyAgent(
  request: StudyAgentRequest
): AsyncGenerator<{
  type: "thinking" | "tool_start" | "tool_end" | "response" | "complete";
  data: unknown;
}> {
  const startTime = Date.now();

  yield {
    type: "thinking",
    data: { step: "understanding", message: "Analyzing your request..." },
  };

  try {
    const graph = getStudyBuddyGraph();

    const initialState = createInitialState(request.userId, request.mode, {
      fieldOfStudy: request.fieldOfStudy,
      selectedDocuments: request.selectedDocuments,
      studyPlan: request.studyPlan,
    });

    const messages = [new HumanMessage(request.message)];

    // Stream graph execution
    const stream = await graph.stream(
      {
        ...initialState,
        messages,
      },
      {
        configurable: {
          userId: request.userId,
        },
        streamMode: "values",
      }
    );

    let lastState: StudyAgentState | null = null;

    for await (const state of stream) {
      lastState = state as StudyAgentState;
      const typedState = state as StudyAgentState;

      // Yield updates based on state changes
      if (typedState.currentStep === "retrieve") {
        yield {
          type: "tool_start",
          data: { tool: "rag_search", message: "Searching documents..." },
        };
      }

      if (typedState.toolsUsed.length > 0) {
        yield {
          type: "tool_end",
          data: {
            tools: typedState.toolsUsed,
            results: typedState.toolResults.length,
          },
        };
      }
    }

    if (lastState) {
      const lastMessage = lastState.messages[lastState.messages.length - 1];
      const responseText =
        typeof lastMessage?.content === "string"
          ? lastMessage.content
          : extractTextFromContent(lastMessage?.content);

      yield {
        type: "response",
        data: {
          text: stripEmotionTags(responseText),
          emotion: lastState.emotion,
        },
      };
    }

    yield {
      type: "complete",
      data: { processingTimeMs: Date.now() - startTime },
    };
  } catch (error) {
    yield {
      type: "complete",
      data: {
        error: error instanceof Error ? error.message : "Unknown error",
        processingTimeMs: Date.now() - startTime,
      },
    };
  }
}

