# models.md

## OpenRouter Master API Key

```env id="3kzrbv"
OPENROUTER_API_KEY="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"
```

---

# Available Free Models For Antigravity Orchestration

## Google

```text id="0h4h4w"
google/gemma-4-26b-a4b-it
```

* 262K context
* Multimodal
* Function calling
* Structured outputs
* Reasoning support

---

## Meta

```text id="r34u7x"
meta-llama/llama-3.3-70b-instruct
```

* 131K context
* Strong multilingual support
* Good instruction following

---

## Qwen

```text id="fkmhsi"
qwen/qwen3-next-80b-a3b-instruct
```

* 262K context
* Agentic workflows
* Long-context optimization
* Stable structured outputs

---

## Qwen Coder

```text id="xx07mg"
qwen/qwen3-coder-480b-a35b
```

* 1.05M context
* Agentic coding
* Tool use
* Repository reasoning
* Function calling

---

## NVIDIA Embedding Model

```text id="u5k2b9"
nvidia/llama-nemotron-embed-vl-1b-v2
```

* Embeddings
* Multimodal retrieval
* Semantic search

---

## Liquid Thinking

```text id="mth8l7"
liquid/lfm2.5-1.2b-thinking
```

* Lightweight reasoning
* Fast agentic tasks
* Extraction/RAG support

---

## Liquid Instruct

```text id="6wq8gv"
liquid/lfm2.5-1.2b-instruct
```

* Lightweight assistant
* Fast responses
* Utility workflows

---

## Hermes

```text id="79jz9o"
nousresearch/hermes-3-405b-instruct
```

* Frontier-scale reasoning
* Function calling
* Agentic execution
* Long-context workflows

---

## Venice

```text id="q0q1bb"
venice/uncensored
```

* Experimental unrestricted model
* Advanced steerability

---

## Small Fast Model

```text id="0i1ub8"
meta-llama/llama-3.2-3b-instruct
```

* Small multilingual model
* Fast lightweight tasks

---

# Official Agentic / Orchestration References

## Google ADK

```text id="mn5q4k"
https://github.com/google/adk-docs
```

```text id="8lbz0l"
https://github.com/google/adk-samples
```

---

## OpenAI Agents SDK

```text id="n0g7ak"
https://github.com/openai/openai-agents-python
```

---

## Microsoft AutoGen

```text id="e1ot1f"
https://github.com/microsoft/autogen
```

---

## LangGraph

```text id="9xhqee"
https://github.com/langchain-ai/langgraph
```

---

## CrewAI

```text id="cg3mbz"
https://github.com/crewAIInc/crewAI
```

---

# Notes

* Antigravity should dynamically choose models based on:

  * reasoning complexity
  * latency requirements
  * context size
  * coding/tool usage
  * multilingual tasks
  * scheduling workflows
  * dispute handling

* Keep orchestration model-agnostic.

* Avoid hardcoding model assignments initially.

* Use provider abstraction layers.

* Prefer structured outputs + JSON mode wherever possible.
