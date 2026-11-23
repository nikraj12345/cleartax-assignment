/**
 * LangGraph entrypoint for future live-LLM routing.
 * MVP uses deterministic fixture routing in graph.ts; this module wires the graph shell.
 */
import { END, START, StateGraph, Annotation } from '@langchain/langgraph';
import { runSupportGraph, RunInput, RunOutput } from './graph';

const SupportState = Annotation.Root({
  input: Annotation<RunInput>(),
  output: Annotation<RunOutput | undefined>(),
});

export function buildSupportGraph() {
  const graph = new StateGraph(SupportState)
    .addNode('run', async (state) => ({
      output: await runSupportGraph(state.input),
    }))
    .addEdge(START, 'run')
    .addEdge('run', END);

  return graph.compile();
}