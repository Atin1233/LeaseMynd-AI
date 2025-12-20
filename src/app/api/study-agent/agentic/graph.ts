/**
 * Study Buddy Agent Graph
 * LangGraph workflow for the agentic study assistant
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  type BaseMessage,
} from "@langchain/core/messages";

import { StudyAgentStateAnnotation, type StudyAgentState } from "./state";
import { studyBuddyTools } from "./tools";
import type { EmotionTag, StudyMode } from "./types";

// ============================================================================
// Node Functions
// ============================================================================

/**
 * Understand Node: Analyze user intent and determine next action
 */
async function understandNode(
  state: StudyAgentState
): Promise<Partial<StudyAgentState>> {
  console.log("🧠 [Understand Node] Analyzing user intent...");

  const lastMessage = state.messages[state.messages.length - 1];
  const userMessage =
    typeof lastMessage?.content === "string"
      ? lastMessage.content.toLowerCase()
      : "";

  // Determine user intent based on message patterns
  let userIntent = "general_question";
  let nextAction = "respond";

  // Flashcard intent
  if (
    userMessage.includes("flashcard") ||
    userMessage.includes("flash card") ||
    userMessage.includes("study cards") ||
    userMessage.includes("memorize")
  ) {
    userIntent = "create_flashcards";
    nextAction = "generate";
  }
  // Quiz intent
  else if (
    userMessage.includes("quiz") ||
    userMessage.includes("test me") ||
    userMessage.includes("practice questions") ||
    userMessage.includes("test my knowledge")
  ) {
    userIntent = "create_quiz";
    nextAction = "generate";
  }
  // Concept explanation intent
  else if (
    userMessage.includes("explain") ||
    userMessage.includes("what is") ||
    userMessage.includes("what are") ||
    userMessage.includes("help me understand") ||
    userMessage.includes("define")
  ) {
    userIntent = "explain_concept";
    nextAction = "retrieve";
  }
  // Study plan intent
  else if (
    userMessage.includes("study plan") ||
    userMessage.includes("schedule") ||
    userMessage.includes("organize my study") ||
    userMessage.includes("learning plan")
  ) {
    userIntent = "create_study_plan";
    nextAction = "generate";
  }
  // Research intent
  else if (
    userMessage.includes("research") ||
    userMessage.includes("find information") ||
    userMessage.includes("look up") ||
    userMessage.includes("search for")
  ) {
    userIntent = "web_research";
    nextAction = "retrieve";
  }
  // Document question
  else if (
    userMessage.includes("in the document") ||
    userMessage.includes("from my notes") ||
    userMessage.includes("according to") ||
    state.selectedDocuments.length > 0
  ) {
    userIntent = "document_question";
    nextAction = "retrieve";
  }
  // Progress tracking
  else if (
    userMessage.includes("my progress") ||
    userMessage.includes("how am i doing") ||
    userMessage.includes("session summary")
  ) {
    userIntent = "track_progress";
    nextAction = "respond";
  }
  // Task management intent
  else if (
    userMessage.includes("task") ||
    userMessage.includes("todo") ||
    userMessage.includes("to-do") ||
    userMessage.includes("to do") ||
    userMessage.includes("add a") ||
    userMessage.includes("create a") ||
    userMessage.includes("mark as done") ||
    userMessage.includes("complete the") ||
    userMessage.includes("my tasks") ||
    userMessage.includes("what do i need to")
  ) {
    userIntent = "manage_tasks";
    nextAction = "generate";
  }
  // Pomodoro timer intent - expanded patterns
  else if (
    userMessage.includes("pomodoro") ||
    userMessage.includes("timer") ||
    userMessage.includes("focus session") ||
    userMessage.includes("start studying") ||
    userMessage.includes("take a break") ||
    userMessage.includes("pause") ||
    userMessage.includes("resume") ||
    userMessage.includes("how much time") ||
    userMessage.includes("time left") ||
    userMessage.includes("start a focus") ||
    userMessage.includes("let's focus") ||
    userMessage.includes("let me focus") ||
    userMessage.includes("focus time") ||
    userMessage.includes("study session") ||
    userMessage.includes("start the timer") ||
    userMessage.includes("stop the timer") ||
    userMessage.includes("begin a") ||
    (userMessage.includes("start") && (userMessage.includes("session") || userMessage.includes("studying")))
  ) {
    userIntent = "pomodoro_timer";
    nextAction = "generate";
  }
  // Note-taking intent
  else if (
    userMessage.includes("note") ||
    userMessage.includes("write down") ||
    userMessage.includes("remember this") ||
    userMessage.includes("jot down") ||
    userMessage.includes("save this") ||
    userMessage.includes("my notes") ||
    userMessage.includes("find my") ||
    userMessage.includes("search notes")
  ) {
    userIntent = "take_notes";
    nextAction = "generate";
  }

  return {
    currentStep: "plan",
    userIntent,
    nextAction,
    planningThoughts: `User intent: ${userIntent}. Next action: ${nextAction}.`,
  };
}

/**
 * Plan Node: Create execution plan based on intent
 */
async function planNode(
  state: StudyAgentState
): Promise<Partial<StudyAgentState>> {
  console.log(`📋 [Plan Node] Planning for intent: ${state.userIntent}`);

  // Determine which tools to use based on intent
  const toolsToUse: string[] = [];

  switch (state.userIntent) {
    case "create_flashcards":
      if (state.selectedDocuments.length > 0) {
        toolsToUse.push("rag_search");
      }
      toolsToUse.push("generate_flashcards");
      break;

    case "create_quiz":
      if (state.selectedDocuments.length > 0) {
        toolsToUse.push("rag_search");
      }
      toolsToUse.push("generate_quiz");
      break;

    case "explain_concept":
      if (state.selectedDocuments.length > 0) {
        toolsToUse.push("rag_search");
      }
      toolsToUse.push("explain_concept");
      break;

    case "create_study_plan":
      toolsToUse.push("create_study_plan");
      break;

    case "web_research":
      toolsToUse.push("web_research");
      break;

    case "document_question":
      toolsToUse.push("rag_search");
      break;

    case "track_progress":
      toolsToUse.push("track_progress");
      break;

    case "manage_tasks":
      toolsToUse.push("manage_tasks");
      break;

    case "pomodoro_timer":
      toolsToUse.push("pomodoro_timer");
      break;

    case "take_notes":
      toolsToUse.push("take_notes");
      break;

    default:
      // General question - may need RAG if documents available
      if (state.selectedDocuments.length > 0) {
        toolsToUse.push("rag_search");
      }
  }

  return {
    currentStep: state.nextAction === "retrieve" ? "retrieve" : "generate",
    toolsUsed: toolsToUse,
    planningThoughts: `Planned tools: ${toolsToUse.join(", ") || "none (direct response)"}`,
  };
}

/**
 * Agent Node: Run the LLM with tools to process the request
 */
async function agentNode(
  state: StudyAgentState
): Promise<Partial<StudyAgentState>> {
  console.log(`🤖 [Agent Node] Processing with mode: ${state.mode}`);
  console.log(`   Planned tools: ${state.toolsUsed.join(", ") || "none"}`);
  console.log(`   User intent: ${state.userIntent}`);

  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,
    timeout: 60000,
  }).bindTools(studyBuddyTools);

  // Build system prompt based on mode
  const systemPrompt = getSystemPrompt(state.mode, state);

  // Build message list
  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...state.messages,
  ];

  // Add context if available
  if (state.formattedContext) {
    messages.push(
      new HumanMessage(
        `[Context from documents]\n${state.formattedContext}\n\n[End of context]`
      )
    );
  }

  // Add tool usage instruction if specific tools were planned
  if (state.toolsUsed.length > 0) {
    const toolInstructionMessage = buildToolInstructionMessage(state);
    if (toolInstructionMessage) {
      messages.push(new SystemMessage(toolInstructionMessage));
    }
  }

  const response = await model.invoke(messages, {
    configurable: {
      userId: state.userId,
    },
  });

  return {
    messages: [response],
    currentStep: "respond",
  };
}

/**
 * Build a tool instruction message based on planned tools
 */
function buildToolInstructionMessage(state: StudyAgentState): string | null {
  const plannedTools = state.toolsUsed;
  const userMessage = state.messages[state.messages.length - 1];
  const messageText = typeof userMessage?.content === "string" 
    ? userMessage.content.toLowerCase() 
    : "";

  if (plannedTools.includes("pomodoro_timer")) {
    // Determine action from message
    let action = "status";
    if (messageText.includes("start") || messageText.includes("begin") || messageText.includes("let's focus")) {
      action = "start";
    } else if (messageText.includes("pause") || messageText.includes("hold")) {
      action = "pause";
    } else if (messageText.includes("resume") || messageText.includes("continue")) {
      action = "resume";
    } else if (messageText.includes("stop") || messageText.includes("end") || messageText.includes("finish")) {
      action = "stop";
    } else if (messageText.includes("skip")) {
      action = "skip";
    } else if (messageText.includes("time left") || messageText.includes("how much") || messageText.includes("status")) {
      action = "status";
    } else if (messageText.includes("configure") || messageText.includes("set") || messageText.includes("change")) {
      action = "configure";
    }

    return `IMPORTANT: You MUST use the pomodoro_timer tool to handle this request. 
The user wants to ${action} their Pomodoro timer.
Call the pomodoro_timer tool with:
- action: "${action}"
- userId: "${state.userId}"

After calling the tool, respond with the result in an encouraging way.`;
  }

  if (plannedTools.includes("manage_tasks")) {
    let action = "list";
    if (messageText.includes("add") || messageText.includes("create") || messageText.includes("new")) {
      action = "create";
    } else if (messageText.includes("complete") || messageText.includes("done") || messageText.includes("finish")) {
      action = "complete";
    } else if (messageText.includes("delete") || messageText.includes("remove")) {
      action = "delete";
    } else if (messageText.includes("update") || messageText.includes("edit") || messageText.includes("change")) {
      action = "update";
    }

    return `IMPORTANT: You MUST use the manage_tasks tool to handle this request.
The user wants to ${action} tasks.
Call the manage_tasks tool with:
- action: "${action}"
- userId: "${state.userId}"

Extract any task title, description, priority, or due date from the user's message.
After calling the tool, respond with the result in an encouraging way.`;
  }

  if (plannedTools.includes("take_notes")) {
    let action = "list";
    if (messageText.includes("take") || messageText.includes("write") || messageText.includes("add") || messageText.includes("jot")) {
      action = "create";
    } else if (messageText.includes("search") || messageText.includes("find")) {
      action = "search";
    } else if (messageText.includes("update") || messageText.includes("edit")) {
      action = "update";
    } else if (messageText.includes("delete") || messageText.includes("remove")) {
      action = "delete";
    } else if (messageText.includes("summarize")) {
      action = "summarize";
    }

    return `IMPORTANT: You MUST use the take_notes tool to handle this request.
The user wants to ${action} notes.
Call the take_notes tool with:
- action: "${action}"
- userId: "${state.userId}"

Extract any note content, title, or tags from the user's message.
After calling the tool, respond with the result in an encouraging way.`;
  }

  return null;
}

/**
 * Tool execution node
 */
const toolNode = new ToolNode(studyBuddyTools);

/**
 * Respond Node: Format the final response
 */
async function respondNode(
  state: StudyAgentState
): Promise<Partial<StudyAgentState>> {
  console.log("💬 [Respond Node] Formatting final response...");

  const lastMessage = state.messages[state.messages.length - 1];
  const content =
    typeof lastMessage?.content === "string"
      ? lastMessage.content
      : JSON.stringify(lastMessage?.content ?? "");

  // Detect emotion from response
  const emotion = detectEmotion(content, state.mode);

  // Extract any generated content from tool results
  let flashcards = state.generatedFlashcards;
  let quizzes = state.generatedQuizzes;
  let explanations = state.conceptExplanations;

  for (const result of state.toolResults) {
    if (result.toolName === "generate_flashcards" && result.data) {
      const data = result.data as { flashcards?: typeof flashcards };
      if (data.flashcards) {
        flashcards = [...flashcards, ...data.flashcards];
      }
    }
    if (result.toolName === "generate_quiz" && result.data) {
      const data = result.data as { quiz?: typeof quizzes[0] };
      if (data.quiz) {
        quizzes = [...quizzes, data.quiz];
      }
    }
    if (result.toolName === "explain_concept" && result.data) {
      const data = result.data as { explanation?: typeof explanations[0] };
      if (data.explanation) {
        explanations = [...explanations, data.explanation];
      }
    }
  }

  return {
    currentStep: "respond",
    emotion,
    generatedFlashcards: flashcards,
    generatedQuizzes: quizzes,
    conceptExplanations: explanations,
    shouldContinue: false,
    confidence: 0.85,
  };
}

// ============================================================================
// Routing Functions
// ============================================================================

/**
 * Determine if we should continue to tools or end
 */
function shouldContinue(state: StudyAgentState): string {
  const lastMessage = state.messages[state.messages.length - 1];

  // Check if the AI wants to use tools
  if (lastMessage && "tool_calls" in lastMessage) {
    const toolCalls = (lastMessage as AIMessage).tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      console.log(
        `🔧 [Router] Tool calls detected: ${toolCalls.map((t) => t.name).join(", ")}`
      );
      return "tools";
    }
  }

  return "respond";
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the system prompt based on study mode
 */
function getSystemPrompt(mode: StudyMode, state: StudyAgentState): string {
  const baseContext = `
Field of study: ${state.fieldOfStudy ?? "General"}
Selected documents: ${state.selectedDocuments.length} document(s)
Study plan items: ${state.studyPlan.length} item(s)
`;

  const modePrompts: Record<StudyMode, string> = {
    teacher: `You are Macy, an expert teacher and educator. Your role is to:
- Explain concepts clearly and thoroughly
- Use the Socratic method when appropriate
- Provide structured, lecture-style explanations
- Check for understanding with questions
- Reference study materials when available

Keep responses educational and encouraging. Use a warm but authoritative tone.
${baseContext}`,

    "study-buddy": `You are Macy, a friendly and supportive study buddy. Your role is to:
- Be encouraging and casual in tone
- Keep responses short and conversational
- Celebrate progress and provide emotional support
- Help with quick questions and explanations
- Stay positive and motivating

Use tildes (~) occasionally for warmth. Keep responses under 100 words unless asked for more.
${baseContext}`,

    "quiz-master": `You are Macy, an engaging quiz master. Your role is to:
- Create and administer quizzes effectively
- Provide clear feedback on answers
- Explain correct answers when needed
- Keep the testing engaging and not stressful
- Track progress and celebrate improvement

Make testing feel like a fun challenge, not a stressful exam.
${baseContext}`,

    coach: `You are Macy, a learning coach and mentor. Your role is to:
- Help create effective study plans
- Provide learning strategies and tips
- Monitor progress and adjust approaches
- Motivate and hold accountable
- Teach meta-learning skills

Focus on learning how to learn, not just the content itself.
${baseContext}`,
  };

  const toolInstructions = `

Available Tools:

📚 Learning Tools:
- rag_search: Search through uploaded documents for relevant content
- generate_flashcards: Create study flashcards from content
- generate_quiz: Create quiz questions with multiple types
- explain_concept: Provide detailed concept explanations with analogies

📋 Planning Tools:
- create_study_plan: Create or update personalized study plans
- track_progress: Track study session progress and insights

✅ Productivity Tools:
- manage_tasks: Create, update, complete, or list study tasks/todos
- pomodoro_timer: Start, pause, resume, or stop Pomodoro focus sessions

📝 Notes Tools:
- take_notes: Create, update, search, or list study notes
- web_research: Search the web for additional information

Use tools when:
- User asks for flashcards, quizzes, or study plans
- User wants to manage tasks, start a timer, or take notes
- You need information from their documents
- User asks to explain or define something
- More research is needed beyond the documents

Always search documents first before generating content based on them.
Always be encouraging and supportive when managing tasks or timers!
`;

  return modePrompts[mode] + toolInstructions;
}

/**
 * Detect emotion from response content
 */
function detectEmotion(content: string, mode: StudyMode): EmotionTag {
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes("great job") ||
    lowerContent.includes("excellent") ||
    lowerContent.includes("well done") ||
    lowerContent.includes("amazing")
  ) {
    return "excited";
  }
  if (
    lowerContent.includes("you've got this") ||
    lowerContent.includes("you can do it") ||
    lowerContent.includes("keep going")
  ) {
    return "encouraging";
  }
  if (
    lowerContent.includes("interesting") ||
    lowerContent.includes("curious") ||
    lowerContent.includes("let's explore")
  ) {
    return "curious";
  }
  if (
    lowerContent.includes("that's tough") ||
    lowerContent.includes("understandable") ||
    lowerContent.includes("it's okay")
  ) {
    return "calm";
  }
  if (lowerContent.includes("!") && mode === "study-buddy") {
    return "happy";
  }

  // Default based on mode
  return mode === "study-buddy" ? "happy" : "calm";
}

// ============================================================================
// Graph Construction
// ============================================================================

/**
 * Create the Study Buddy Agent graph
 */
export function createStudyBuddyGraph() {
  const workflow = new StateGraph(StudyAgentStateAnnotation)
    // Add nodes
    .addNode("understand", understandNode)
    .addNode("plan", planNode)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addNode("respond", respondNode)

    // Define edges
    .addEdge(START, "understand")
    .addEdge("understand", "plan")
    .addEdge("plan", "agent")
    .addConditionalEdges("agent", shouldContinue, {
      tools: "tools",
      respond: "respond",
    })
    .addEdge("tools", "agent") // Loop back after tool execution
    .addEdge("respond", END);

  return workflow.compile();
}

/**
 * Singleton instance of the compiled graph
 */
let compiledGraph: ReturnType<typeof createStudyBuddyGraph> | null = null;

/**
 * Get or create the Study Buddy Agent graph
 */
export function getStudyBuddyGraph() {
  if (!compiledGraph) {
    compiledGraph = createStudyBuddyGraph();
  }
  return compiledGraph;
}

