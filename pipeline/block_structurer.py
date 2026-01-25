"""Block Structuring Layer - cleans and normalizes blocks into semantic units."""
import re
from typing import List, Dict, Any
import logging
from pipeline.tei_parser import Block

logger = logging.getLogger(__name__)


class BlockStructurer:
    """Transforms noisy academic text into clean semantic units."""
    
    def __init__(self, max_block_size: int = 1000, min_block_size: int = 50):
        self.max_block_size = max_block_size
        self.min_block_size = min_block_size
        
        # Common noise patterns in academic papers
        self.noise_patterns = [
            r'^\s*-\s*$',  # Standalone dashes
            r'^\s*\.\s*$',  # Standalone periods
            r'^\s*\d+\s*$',  # Standalone numbers
            r'^[^\w\s]+$',  # Only punctuation
        ]
        
        # Heading normalization patterns
        self.heading_patterns = [
            (r'^\s*(\d+\.?\s*)+', ''),  # Remove numbering
            (r'^\s*[A-Z]+\s*$', ''),  # All caps (likely noise)
            (r'\s+', ' '),  # Multiple spaces
        ]
    
    def structure(self, blocks: List[Block]) -> List[Block]:
        """
        Structure blocks into clean semantic units.
        
        Args:
            blocks: Raw blocks from TEI parser
            
        Returns:
            Cleaned and structured blocks (Section Packets)
        """
        logger.info(f"Structuring {len(blocks)} blocks")
        
        # Step 1: Fix headings & remove noise
        cleaned_blocks = self._clean_blocks(blocks)
        
        # Step 2: Normalize section titles
        cleaned_blocks = self._normalize_sections(cleaned_blocks)
        
        # Step 3: Create atomic blocks
        atomic_blocks = self._create_atomic_blocks(cleaned_blocks)
        
        # Step 4: Remove artifacts
        final_blocks = self._remove_artifacts(atomic_blocks)
        
        logger.info(f"Structured into {len(final_blocks)} clean blocks")
        return final_blocks
    
    def _clean_blocks(self, blocks: List[Block]) -> List[Block]:
        """Remove noise and fix headings."""
        cleaned = []
        
        for block in blocks:
            # Skip empty blocks
            if not block.content or not block.content.strip():
                continue
            
            # Remove noise patterns
            content = block.content.strip()
            if any(re.match(pattern, content) for pattern in self.noise_patterns):
                continue
            
            # Clean heading blocks
            if block.block_type == "heading":
                content = self._normalize_heading(content)
                if not content:
                    continue
            
            # Create cleaned block
            cleaned_block = Block(
                block_id=block.block_id,
                block_type=block.block_type,
                content=content,
                section_title=block.section_title,
                level=block.level,
                metadata=block.metadata
            )
            cleaned.append(cleaned_block)
        
        return cleaned
    
    def _normalize_heading(self, heading: str) -> str:
        """Normalize heading text."""
        normalized = heading.strip()
        
        # Apply normalization patterns
        for pattern, replacement in self.heading_patterns:
            normalized = re.sub(pattern, replacement, normalized)
        
        # Remove leading/trailing punctuation
        normalized = re.sub(r'^[^\w]+|[^\w]+$', '', normalized)
        
        return normalized.strip()
    
    def _normalize_sections(self, blocks: List[Block]) -> List[Block]:
        """Normalize section titles across blocks."""
        section_map = {}
        
        # Build section title map from headings
        for block in blocks:
            if block.block_type == "heading" and block.content:
                section_map[block.level] = block.content
        
        # Propagate section titles to child blocks
        normalized = []
        current_sections = {}
        
        for block in blocks:
            if block.block_type == "heading":
                # Update current section for this level
                current_sections[block.level] = block.content
                # Clear deeper levels
                for level in list(current_sections.keys()):
                    if level > block.level:
                        del current_sections[level]
            
            # Assign section title from hierarchy
            if block.block_type != "heading":
                # Find the most recent section at or above this block's level
                section_title = None
                for level in sorted(current_sections.keys(), reverse=True):
                    if level <= block.level:
                        section_title = current_sections[level]
                        break
                
                if section_title:
                    block.section_title = section_title
            
            normalized.append(block)
        
        return normalized
    
    def _create_atomic_blocks(self, blocks: List[Block]) -> List[Block]:
        """Split large blocks into atomic units."""
        atomic = []
        block_counter = 0
        
        for block in blocks:
            # Skip splitting for certain block types
            if block.block_type in ["heading", "figure", "table", "reference"]:
                atomic.append(block)
                continue
            
            # Split large paragraphs into atomic blocks
            content = block.content
            if len(content) > self.max_block_size:
                # Split by sentences
                sentences = re.split(r'(?<=[.!?])\s+', content)
                
                current_chunk = []
                current_size = 0
                
                for sentence in sentences:
                    sentence = sentence.strip()
                    if not sentence:
                        continue
                    
                    sentence_size = len(sentence)
                    
                    # If adding this sentence exceeds max size, create a block
                    if current_size + sentence_size > self.max_block_size and current_chunk:
                        chunk_content = ' '.join(current_chunk)
                        if len(chunk_content) >= self.min_block_size:
                            atomic.append(Block(
                                block_id=f"{block.block_id}_atomic_{block_counter}",
                                block_type=block.block_type,
                                content=chunk_content,
                                section_title=block.section_title,
                                level=block.level,
                                metadata={**block.metadata, "is_atomic": True}
                            ))
                            block_counter += 1
                        current_chunk = []
                        current_size = 0
                    
                    current_chunk.append(sentence)
                    current_size += sentence_size
                
                # Add remaining chunk
                if current_chunk:
                    chunk_content = ' '.join(current_chunk)
                    if len(chunk_content) >= self.min_block_size:
                        atomic.append(Block(
                            block_id=f"{block.block_id}_atomic_{block_counter}",
                            block_type=block.block_type,
                            content=chunk_content,
                            section_title=block.section_title,
                            level=block.level,
                            metadata={**block.metadata, "is_atomic": True}
                        ))
                        block_counter += 1
            else:
                # Block is already atomic-sized
                atomic.append(block)
        
        return atomic
    
    def _remove_artifacts(self, blocks: List[Block]) -> List[Block]:
        """Remove remaining artifacts and invalid blocks."""
        cleaned = []
        
        for block in blocks:
            # Skip blocks that are too short (likely artifacts)
            if len(block.content.strip()) < self.min_block_size and block.block_type == "paragraph":
                continue
            
            # Skip blocks with only whitespace/punctuation
            if not re.search(r'\w', block.content):
                continue
            
            cleaned.append(block)
        
        return cleaned
    
    def create_section_packets(self, blocks: List[Block]) -> List[Dict[str, Any]]:
        """
        Group blocks into section packets.
        
        Returns:
            List of section packets, each containing blocks for a section
        """
        packets = []
        current_packet = None
        
        for block in blocks:
            # Start new packet for new sections
            if block.block_type == "heading" or (
                current_packet is None or 
                current_packet.get('section_title') != block.section_title
            ):
                # Save previous packet
                if current_packet is not None:
                    packets.append(current_packet)
                
                # Start new packet
                current_packet = {
                    'section_title': block.section_title or "Unknown",
                    'level': block.level,
                    'blocks': []
                }
            
            # Add block to current packet
            if current_packet is not None:
                current_packet['blocks'].append(block.model_dump())
        
        # Add final packet
        if current_packet is not None:
            packets.append(current_packet)
        
        return packets


