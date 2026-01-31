import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { MemorySaver, StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { buildInstruction } from "@/ai/agent/prompts";
import { buildSearchTools } from "@/ai/agent/tools";
import { buildLinkFixer } from "@/ai/agent/link-fixer";
import { buildLinkSanitizer } from "@/ai/agent/links";

// 1. Définition de l'Annotation d'état (Recommandé pour la clarté et le typage)
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
});

export function buildAgentGraph(model: string) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const tools = process.env.MCP_QDRANT_URL ? buildSearchTools() : [];

  // Configuration correcte pour OpenRouter
  const llm = new ChatOpenAI({
    model,
    apiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: process.env.OPENROUTER_API_BASE ?? "https://openrouter.ai/api/v1",
    }
  }).bindTools(tools);

  const toolNode = new ToolNode(tools);
  const linkFixer = buildLinkFixer(model);

  // Utilisation du type AgentState pour le paramètre 'state'
  const callModel = async (state: typeof AgentState.State) => {
    const messages = [
      new SystemMessage(buildInstruction()),
      ...state.messages,
    ];
    const response = await llm.invoke(messages);
    // Retourne l'update des messages (le reducer s'occupe de la concaténation)
    return { messages: [response] };
  };

  const checkpointer = new MemorySaver();
  const sanitizeLinks = buildLinkSanitizer();

  // 2. Initialisation du graphe avec l'annotation
  return new StateGraph(AgentState)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addNode("link_fixer", linkFixer)
    .addNode("sanitize", sanitizeLinks)
    .addEdge(START, "agent")
    .addEdge(START, "agent")
   .addConditionalEdges(
      "agent",
      toolsCondition, 
      {
        tools: "tools",
        __end__: "link_fixer" 
      }
    )
    .addEdge("tools", "agent")
    .addEdge("link_fixer", "sanitize")
    .addEdge("sanitize", END)
    .compile({ checkpointer });
}
