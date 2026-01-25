"""Summarization Layer - compresses sections using small models or API-based LLMs."""
from transformers import pipeline as hf_pipeline
from typing import List, Dict, Any, Optional
import logging
import requests
import json
from config import Config

logger = logging.getLogger(__name__)


class Summarizer:
    """Summarizes scientific sections using small models or API-based LLMs."""
    
    def __init__(self, model_name: str = None, device: str = None, use_api: bool = None):
        self.model_name = model_name or Config.SUMMARIZATION_MODEL
        self.device = device or Config.DEVICE
        self.use_api = use_api if use_api is not None else Config.USE_API_SUMMARIZATION
        self.api_provider = Config.SUMMARIZATION_API_PROVIDER
        self.api_key = Config.SUMMARIZATION_API_KEY
        self.api_model = Config.SUMMARIZATION_API_MODEL
        self.api_base_url = Config.SUMMARIZATION_API_BASE_URL
        
        self.summarizer = None
        if not self.use_api:
            self._initialize_model()
        else:
            self._validate_api_config()
    
    def _validate_api_config(self):
        """Validate API configuration."""
        if not self.api_key:
            logger.warning("API key not found. Set SUMMARIZATION_API_KEY in .env file")
            logger.warning("Falling back to local model")
            self.use_api = False
            self._initialize_model()
        else:
            logger.info(f"Using API-based summarization: {self.api_provider} ({self.api_model})")
    
    def _initialize_model(self):
        """Initialize the local summarization model."""
        logger.info(f"Initializing local summarization model: {self.model_name}")
        try:
            self.summarizer = hf_pipeline(
                "summarization",
                model=self.model_name,
                device=0 if self.device == "cuda" else -1,
                max_length=512,
                min_length=50
            )
            logger.info("Summarization model loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load summarization model: {e}. Using fallback.")
            self.summarizer = None
    
    def summarize_section(self, content: str, max_length: int = 150, min_length: int = 30) -> str:
        """
        Summarize a single section.
        
        Args:
            content: Section content to summarize
            max_length: Maximum summary length
            min_length: Minimum summary length
            
        Returns:
            Summarized text
        """
        if not content or len(content.strip()) < min_length:
            return content
        
        # Use API if configured
        if self.use_api and self.api_key:
            return self._summarize_with_api(content, max_length, min_length)
        
        # Use local model
        if self.summarizer is None:
            # Simple truncation fallback
            words = content.split()
            if len(words) > max_length:
                return ' '.join(words[:max_length]) + "..."
            return content
        
        try:
            # Handle long content by chunking
            if len(content) > 1024:
                # Split into chunks and summarize each
                chunks = self._chunk_text(content, chunk_size=1024)
                summaries = []
                for chunk in chunks:
                    summary = self.summarizer(
                        chunk,
                        max_length=max_length,
                        min_length=min_length,
                        do_sample=False
                    )[0]['summary_text']
                    summaries.append(summary)
                return ' '.join(summaries)
            else:
                result = self.summarizer(
                    content,
                    max_length=max_length,
                    min_length=min_length,
                    do_sample=False
                )
                return result[0]['summary_text']
        except Exception as e:
            logger.error(f"Summarization failed: {e}")
            # Fallback to truncation
            words = content.split()
            if len(words) > max_length:
                return ' '.join(words[:max_length]) + "..."
            return content
    
    def _summarize_with_api(self, content: str, max_length: int, min_length: int) -> str:
        """Summarize using API-based LLM."""
        try:
            if self.api_provider.lower() == "openai":
                return self._summarize_openai(content, max_length, min_length)
            elif self.api_provider.lower() == "anthropic":
                return self._summarize_anthropic(content, max_length, min_length)
            elif self.api_provider.lower() == "together":
                return self._summarize_together(content, max_length, min_length)
            elif self.api_provider.lower() == "groq":
                return self._summarize_groq(content, max_length, min_length)
            else:
                logger.warning(f"Unknown API provider: {self.api_provider}. Using OpenAI format.")
                return self._summarize_openai(content, max_length, min_length)
        except Exception as e:
            logger.error(f"API summarization failed: {e}. Falling back to truncation.")
            words = content.split()
            if len(words) > max_length:
                return ' '.join(words[:max_length]) + "..."
            return content
    
    def _summarize_openai(self, content: str, max_length: int, min_length: int) -> str:
        """Summarize using OpenAI API."""
        base_url = self.api_base_url or "https://api.openai.com/v1"
        url = f"{base_url}/chat/completions"
        
        # Estimate tokens (rough: 1 token ≈ 4 characters)
        max_tokens = max_length * 2  # Rough estimate
        
        prompt = f"""Summarize the following scientific text concisely. 
Focus on preserving experimental context, methods, and key results.
Keep the summary between {min_length} and {max_length} words.

Text to summarize:
{content[:4000]}"""  # Limit input length
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": self.api_model,
            "messages": [
                {"role": "system", "content": "You are a scientific text summarizer. Create concise summaries that preserve experimental context."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": max_tokens,
            "temperature": 0.3
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        summary = result['choices'][0]['message']['content'].strip()
        return summary
    
    def _summarize_anthropic(self, content: str, max_length: int, min_length: int) -> str:
        """Summarize using Anthropic (Claude) API."""
        url = "https://api.anthropic.com/v1/messages"
        
        max_tokens = max_length * 2  # Rough estimate
        
        prompt = f"""Summarize the following scientific text concisely. 
Focus on preserving experimental context, methods, and key results.
Keep the summary between {min_length} and {max_length} words.

Text to summarize:
{content[:4000]}"""
        
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": self.api_model,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        summary = result['content'][0]['text'].strip()
        return summary
    
    def _summarize_together(self, content: str, max_length: int, min_length: int) -> str:
        """Summarize using Together AI API."""
        url = "https://api.together.xyz/v1/chat/completions"
        
        max_tokens = max_length * 2
        
        prompt = f"""Summarize the following scientific text concisely. 
Focus on preserving experimental context, methods, and key results.
Keep the summary between {min_length} and {max_length} words.

Text to summarize:
{content[:4000]}"""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": self.api_model,
            "messages": [
                {"role": "system", "content": "You are a scientific text summarizer."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": max_tokens,
            "temperature": 0.3
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        summary = result['choices'][0]['message']['content'].strip()
        return summary
    
    def _summarize_groq(self, content: str, max_length: int, min_length: int) -> str:
        """Summarize using Groq API (OpenAI-compatible)."""
        base_url = self.api_base_url or "https://api.groq.com/openai/v1"
        url = f"{base_url}/chat/completions"
        
        # Force a high-capacity flagship model
        model = "llama-3.3-70b-versatile"
        
        # Estimate tokens (rough: 1 token ≈ 4 characters)
        max_tokens = max_length * 2  # Rough estimate
        
        prompt = f"""Summarize the following scientific text concisely. 
Focus on preserving experimental context, methods, and key results.
Keep the summary between {min_length} and {max_length} words.

Text to summarize:
{content[:4000]}"""  # Limit input length
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a scientific text summarizer. Create concise summaries that preserve experimental context."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": max_tokens,
            "temperature": 0.3
        }
        
        try:
            logger.info(f"Calling Groq Summarization with model {model}...")
            response = requests.post(url, headers=headers, json=data, timeout=30)
            if response.status_code != 200:
                logger.error(f"Groq Summarization Error {response.status_code}: {response.text}")
                return content[:200] + "..." # Fallback to truncation
            
            result = response.json()
            summary = result['choices'][0]['message']['content'].strip()
            return summary
        except Exception as e:
            logger.error(f"Groq Summarization Exception: {e}")
            return content[:200] + "..."
    
    def summarize_packets(self, packets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Summarize section packets while preserving experimental context.
        
        Args:
            packets: List of section packets
            
        Returns:
            Summarized packets
        """
        logger.info(f"Summarizing {len(packets)} section packets")
        
        summarized_packets = []
        
        for packet in packets:
            section_title = packet.get('section_title', 'Unknown')
            blocks = packet.get('blocks', [])
            
            # Combine block contents
            combined_content = ' '.join([
                block.get('content', '') 
                for block in blocks 
                if block.get('block_type') in ['paragraph', 'section']
            ])
            
            if not combined_content.strip():
                summarized_packets.append(packet)
                continue
            
            # Summarize based on section type
            if section_title.lower() in ['methods', 'methodology', 'experimental']:
                # Preserve more detail for methods
                summary = self.summarize_section(combined_content, max_length=200, min_length=50)
            elif section_title.lower() in ['results', 'findings']:
                # Preserve experimental results
                summary = self.summarize_section(combined_content, max_length=200, min_length=50)
            else:
                # Standard summarization for other sections
                summary = self.summarize_section(combined_content, max_length=150, min_length=30)
            
            # Create summarized packet
            summarized_packet = {
                'section_title': section_title,
                'level': packet.get('level', 1),
                'summary': summary,
                'original_block_count': len(blocks),
                'blocks': blocks  # Keep original blocks for reference
            }
            
            summarized_packets.append(summarized_packet)
        
        logger.info(f"Summarized {len(summarized_packets)} packets")
        return summarized_packets
    
    def _chunk_text(self, text: str, chunk_size: int = 1024) -> List[str]:
        """Split text into chunks of approximately chunk_size characters."""
        chunks = []
        words = text.split()
        current_chunk = []
        current_size = 0
        
        for word in words:
            word_size = len(word) + 1  # +1 for space
            if current_size + word_size > chunk_size and current_chunk:
                chunks.append(' '.join(current_chunk))
                current_chunk = [word]
                current_size = word_size
            else:
                current_chunk.append(word)
                current_size += word_size
        
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks


