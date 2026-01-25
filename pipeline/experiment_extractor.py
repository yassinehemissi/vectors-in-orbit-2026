"""Experiment Extraction Layer - extracts structured experiments using large model."""
import requests
from typing import List, Dict, Any, Optional
import json
import logging
from pydantic import BaseModel, Field
from config import Config

logger = logging.getLogger(__name__)

class ExperimentUnit(BaseModel):
    """Structured experiment object designed for UI visualization and scientific reasoning."""
    experiment_id: str
    protein_or_target: Optional[str] = Field(None, description="Name of the protein(s) or subject")
    experiment_type: Optional[str] = Field(None, description="Type of experiment (e.g. Activity, Binding)")
    methodology: Optional[str] = Field(None, description="Experimental method used")
    conditions: Dict[str, Any] = Field(default_factory=dict, description="Temperature, buffer, pH, time, etc.")
    measurements: Optional[str] = Field(None, description="Quantitative measurements")
    results: Optional[str] = Field(None, description="Outcome/findings")
    # Using simple list for UI compatibility
    missing_parameters: List[str] = Field(default_factory=list)
    inferred_parameters: List[Dict[str, Any]] = Field(default_factory=list)
    overall_confidence: float = Field(0.0)
    section_context: Optional[str] = Field(None)
    block_id: Optional[str] = Field(None)

class ExperimentExtractor:
    def __init__(self):
        self.use_api = True # Force API for speed as per user feedback
        self.api_key = Config.SUMMARIZATION_API_KEY
        self.api_model = "llama3-70b-8192"
        self.api_base_url = "https://api.groq.com/openai/v1"

    def extract_experiments(self, blocks: List[Dict[str, Any]]) -> List[ExperimentUnit]:
        logger.info(f"Extracting experiments from {len(blocks)} blocks")
        experiments = []
        
        # For manual input (few blocks), bypass filter
        if len(blocks) <= 2:
            experiment_blocks = blocks
        else:
            experiment_blocks = self._filter_experiment_blocks(blocks)
            
        for block in experiment_blocks:
            try:
                res_text = self._generate_api(self._create_prompt(block))
                logger.info(f"Raw LLM response: {res_text}")
                extracted = self._parse_json(res_text, block)
                if not extracted:
                    logger.warning(f"No experiments extracted from block content: {block.get('content')[:100]}...")
                experiments.extend(extracted)
            except Exception as e:
                logger.error(f"Extraction failed: {e}", exc_info=True)
        return experiments

    def _filter_experiment_blocks(self, blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        keywords = ['method', 'assay', 'result', 'experiment', 'dna', 'protein', 'isolation', 'extraction', 'centrifuge', 'incubate']
        filtered = []
        for b in blocks:
            text = b.get('content', '').lower()
            if any(k in text for k in keywords) or len(text) > 200:
                filtered.append(b)
        return filtered

    def _create_prompt(self, block: Dict[str, Any]) -> str:
        return f"""You are the Experiment Intelligence Engine.
Extract scientific experiments from this text as a list of JSON objects.
Text: {block.get('content')}

IMPORTANT: Respond strictly with a JSON object containing an "experiments" key.

Return JSON:
{{
  "experiments": [
    {{
      "protein_or_target": "name of target subject",
      "experiment_type": "Binding, Isolation, CRISPR, Western Blot, etc",
      "methodology": "The tool/technique used",
      "conditions": {{"temp": "...", "ph": "...", "time": "..."}},
      "measurements": "What quantitative values were measured",
      "results": "Finding/outcome",
      "missing_parameters": ["List what is clearly missing from the text"],
      "overall_confidence": 0.0 to 1.0
    }}
  ]
}}
"""

    def _generate_api(self, prompt: str) -> str:
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        # Use the flagship Groq model
        model = "llama-3.3-70b-versatile"
        data = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }
        try:
            logger.info(f"Calling Groq API with model {model}...")
            res = requests.post(f"{self.api_base_url}/chat/completions", headers=headers, json=data, timeout=30)
            if res.status_code != 200:
                logger.error(f"Groq API Error {res.status_code}: {res.text}")
                return '{"experiments": []}'
            
            res_json = res.json()
            if 'choices' not in res_json:
                logger.error(f"Unexpected Groq response structure: {res_json}")
                return '{"experiments": []}'
                
            return res_json['choices'][0]['message']['content']
        except Exception as e:
            logger.error(f"API Request failed: {e}", exc_info=True)
            return '{"experiments": []}'

    def _parse_json(self, text: str, block: Dict[str, Any]) -> List[ExperimentUnit]:
        try:
            data = json.loads(text)
            # Find the array
            exps_raw = []
            if isinstance(data, list): exps_raw = data
            elif isinstance(data, dict):
                for v in data.values():
                    if isinstance(v, list): exps_raw = v; break
                if not exps_raw: exps_raw = [data]
            
            result = []
            for item in exps_raw:
                if not isinstance(item, dict): continue
                result.append(ExperimentUnit(
                    experiment_id=f"{block.get('block_id', 'ext')}_{len(result)}",
                    protein_or_target=item.get('protein_or_target'),
                    experiment_type=item.get('experiment_type'),
                    methodology=item.get('methodology'),
                    conditions=item.get('conditions') or {},
                    measurements=item.get('measurements'),
                    results=item.get('results'),
                    missing_parameters=item.get('missing_parameters') or [],
                    inferred_parameters=item.get('inferred_parameters') or [],
                    overall_confidence=item.get('overall_confidence', 0.8),
                    section_context=block.get('section_title'),
                    block_id=block.get('block_id')
                ))
            return result
        except:
            return []
