"""
Experiment Intelligence Engine - QA System.
Strictly answers questions based on extracted experiment knowledge base.
"""
import logging
from typing import List, Dict, Any, Optional
import requests
import json
from config import Config
from pipeline.vectorizer import Vectorizer, Storage

logger = logging.getLogger(__name__)

class ExperimentQA:
    """Answers questions using ONLY the extracted experiment knowledge base."""
    
    def __init__(self):
        self.vectorizer = Vectorizer()
        self.storage = Storage()
        self.api_key = Config.SUMMARIZATION_API_KEY
        self.api_model = "llama-3.3-70b-versatile"
        self.api_base_url = Config.SUMMARIZATION_API_BASE_URL or "https://api.groq.com/openai/v1"
        
    def answer_question(self, question: str, limit: int = 5) -> Dict[str, Any]:
        """
        Answer a question using retrieved experiments as context.
        """
        logger.info(f"Answering question: {question}")
        
        # 1. Search for relevant experiments
        hits = self.vectorizer.search_by_text(question, limit=limit)
        logger.info(f"Vector search found {len(hits)} hits")
        
        # Keyword Fallback (if vector hits are few)
        if not hits or (len(hits) < 2):
            keywords = [w for w in question.split() if len(w) > 3]
            logger.info(f"Triggering keyword fallback for terms: {keywords}")
            for kw in keywords:
                kw_hits = self.storage.search_by_keyword(kw, limit=3)
                for kh in kw_hits:
                    if not any(h['experiment_id'] == kh['experiment_id'] for h in hits):
                        hits.append(kh)
        
        if not hits:
            return {
                "answer": "I don't have enough experimental evidence in the Knowledge Base to answer this. Try using the 'Extract Experiments' tab for real-time analysis.",
                "sources": [],
                "confidence": "low"
            }
            
        # 2. Retrieve full experiment details
        context_parts = []
        sources = []
        
        for hit in hits:
            exp_id = str(hit['experiment_id'])
            try:
                full_exp = self.storage.get_experiment_by_id(exp_id)
                if full_exp:
                    exp_text = self._format_experiment_for_context(full_exp)
                    context_parts.append(exp_text)
                    sources.append(full_exp)
                else:
                    logger.warning(f"Experiment ID {exp_id} found in index but missing in ScyllaDB. Skipping.")
            except Exception as e:
                logger.error(f"Error retrieving experiment {exp_id}: {e}")
        
        if not context_parts:
            # Fallback: if we have keywords in payloads (Qdrant often stores metadata)
            # we can try to use the payload itself as context if ScyllaDB is failing
            for hit in hits:
                payload = hit.get('payload')
                if payload:
                    context_parts.append(f"Target: {payload.get('protein_or_target')}\nMethod: {payload.get('methodology')}\nResult: {payload.get('results', 'N/A')}")
            
        if not context_parts:
            return {
                "answer": "I found references to relevant experiments, but their detailed scientific records are currently inaccessible. Please try re-extracting the data.",
                "sources": [],
                "confidence": "low"
            }
            
        context = "\n---\n".join(context_parts)
        
        # 3. Generate answer using LLM with strict persona
        prompt = self._create_qa_prompt(question, context)
        
        try:
            answer_json = self._generate_llm_response(prompt)
            data = json.loads(answer_json)
            return {
                "answer": data.get("answer", "I don't have enough experimental evidence to answer this."),
                "evidence": data.get("evidence", []),
                "missing_data": data.get("missing_data", []),
                "sources": sources
            }
        except Exception as e:
            logger.error(f"Failed to generate QA response: {e}")
            return {
                "answer": "Error generating response from experimental data.",
                "sources": sources,
                "error": str(e)
            }

    def _format_experiment_for_context(self, exp: Dict[str, Any]) -> str:
        """Format a single experiment record for the LLM prompt."""
        lines = [
            f"ID: {exp['experiment_id']}",
            f"Protein/Subject: {exp.get('protein_or_target', 'Unknown')}",
            f"Type: {exp.get('experiment_type', 'Unknown')}",
            f"Methodology: {exp.get('methodology', 'Unknown')}",
            f"Section: {exp.get('section_context', 'Unknown')}"
        ]
        
        if exp.get('conditions'):
            conds = ", ".join([f"{k}: {v}" for k, v in exp['conditions'].items()])
            lines.append(f"Conditions: {conds}")
            
        if exp.get('measurements'):
            lines.append(f"Measurements: {exp['measurements']}")
            
        if exp.get('results'):
            lines.append(f"Results: {exp['results']}")
            
        return "\n".join(lines)

    def _create_qa_prompt(self, question: str, context: str) -> str:
        """Create the prompt for the Experiment Intelligence Engine."""
        return f"""You are the Experiment Intelligence Engine.
Rules:
- Answer the scientific question based ONLY on the provided Experimental Context.
- If the context contains relevant data, synthesize it into a clear, professional answer.
- Distinguish between measured data (explicitly stated) and inferred data (logical conclusions).
- If the answer cannot be found in the context, say: "I don't have enough experimental evidence to answer this."
- Return ONLY a JSON object.

Question: {question}

Experimental Context:
{context}

Output Format:
{{
  "answer": "Your concise answer here",
  "evidence": [
    {{ "fact": "...", "type": "measured|inferred", "source_id": "..." }}
  ],
  "missing_data": ["list of variables not found in the evidence that would be needed for a complete answer"]
}}
"""

    def _generate_llm_response(self, prompt: str) -> str:
        """Call Groq API to get the structured answer."""
        url = f"{self.api_base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": self.api_model,
            "messages": [
                {"role": "system", "content": "You are a scientific experiment intelligence engine. You only speak JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.0, # High precision
            "response_format": { "type": "json_object" }
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=60)
        response.raise_for_status()
        
        result = response.json()
        return result['choices'][0]['message']['content'].strip()
