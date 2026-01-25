"""TEI XML Parser - converts TEI XML to structured Blocks JSON."""
from lxml import etree
from typing import List, Dict, Any, Optional
import json
import logging
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class Block(BaseModel):
    """Represents a structured block from a scientific paper."""
    block_id: str = Field(..., description="Unique identifier for the block")
    block_type: str = Field(..., description="Type: section, heading, paragraph, figure, table, reference")
    content: str = Field(..., description="Text content of the block")
    section_title: Optional[str] = Field(None, description="Parent section title")
    level: int = Field(1, description="Hierarchy level (1=main section, 2=subsection, etc.)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    
    class Config:
        json_schema_extra = {
            "example": {
                "block_id": "block_001",
                "block_type": "paragraph",
                "content": "We performed experiments using...",
                "section_title": "Methods",
                "level": 2,
                "metadata": {}
            }
        }


class TEIParser:
    """Parses TEI XML into structured Blocks JSON."""
    
    def __init__(self):
        self.namespaces = {
            'tei': 'http://www.tei-c.org/ns/1.0',
            'xml': 'http://www.w3.org/XML/1998/namespace'
        }
    
    def parse(self, tei_xml: str) -> List[Block]:
        """
        Parse TEI XML into Blocks JSON.
        
        Args:
            tei_xml: TEI XML content as string
            
        Returns:
            List of Block objects
        """
        logger.info("Parsing TEI XML to Blocks JSON")
        
        try:
            root = etree.fromstring(tei_xml.encode('utf-8'))
        except etree.XMLSyntaxError as e:
            logger.error(f"Invalid TEI XML: {e}")
            raise ValueError(f"Failed to parse TEI XML: {e}")
        
        blocks = []
        block_counter = 0
        
        # Extract document title
        title = self._extract_title(root)
        if title:
            blocks.append(Block(
                block_id=f"block_{block_counter:03d}",
                block_type="heading",
                content=title,
                section_title=None,
                level=0,
                metadata={"is_title": True}
            ))
            block_counter += 1
        
        # Extract abstract
        abstract = self._extract_abstract(root)
        if abstract:
            blocks.append(Block(
                block_id=f"block_{block_counter:03d}",
                block_type="section",
                content=abstract,
                section_title="Abstract",
                level=1,
                metadata={"is_abstract": True}
            ))
            block_counter += 1
        
        # Extract main body sections
        body = root.find('.//tei:body', self.namespaces)
        if body is not None:
            section_blocks = self._extract_sections(body, block_counter)
            blocks.extend(section_blocks)
            block_counter += len(section_blocks)
        
        # Extract figures
        figures = self._extract_figures(root)
        for fig in figures:
            blocks.append(Block(
                block_id=f"block_{block_counter:03d}",
                block_type="figure",
                content=fig['caption'],
                section_title=fig.get('section'),
                level=fig.get('level', 1),
                metadata={"figure_id": fig['id'], "figure_label": fig.get('label')}
            ))
            block_counter += 1
        
        # Extract tables
        tables = self._extract_tables(root)
        for table in tables:
            blocks.append(Block(
                block_id=f"block_{block_counter:03d}",
                block_type="table",
                content=table['content'],
                section_title=table.get('section'),
                level=table.get('level', 1),
                metadata={"table_id": table['id'], "table_label": table.get('label')}
            ))
            block_counter += 1
        
        # Extract references
        references = self._extract_references(root)
        for ref in references:
            blocks.append(Block(
                block_id=f"block_{block_counter:03d}",
                block_type="reference",
                content=ref['text'],
                section_title="References",
                level=1,
                metadata={"reference_id": ref['id']}
            ))
            block_counter += 1
        
        logger.info(f"Parsed {len(blocks)} blocks from TEI XML")
        return blocks
    
    def _extract_title(self, root: etree.Element) -> Optional[str]:
        """Extract document title."""
        title_elem = root.find('.//tei:titleStmt/tei:title[@type="main"]', self.namespaces)
        if title_elem is None:
            title_elem = root.find('.//tei:titleStmt/tei:title', self.namespaces)
        return title_elem.text if title_elem is not None and title_elem.text else None
    
    def _extract_abstract(self, root: etree.Element) -> Optional[str]:
        """Extract abstract."""
        abstract_elem = root.find('.//tei:abstract', self.namespaces)
        if abstract_elem is not None:
            return ' '.join(abstract_elem.itertext())
        return None
    
    def _extract_sections(self, body: etree.Element, start_counter: int) -> List[Block]:
        """Extract sections and subsections recursively."""
        blocks = []
        counter = start_counter
        
        def process_div(div: etree.Element, level: int = 1, parent_title: Optional[str] = None):
            nonlocal counter
            
            # Extract section heading
            head = div.find('tei:head', self.namespaces)
            section_title = None
            if head is not None:
                section_title = ' '.join(head.itertext()).strip()
                blocks.append(Block(
                    block_id=f"block_{counter:03d}",
                    block_type="heading",
                    content=section_title,
                    section_title=parent_title,
                    level=level,
                    metadata={}
                ))
                counter += 1
            
            # Extract paragraphs
            for p in div.findall('tei:p', self.namespaces):
                text = ' '.join(p.itertext()).strip()
                if text:
                    blocks.append(Block(
                        block_id=f"block_{counter:03d}",
                        block_type="paragraph",
                        content=text,
                        section_title=section_title or parent_title,
                        level=level,
                        metadata={}
                    ))
                    counter += 1
            
            # Process nested divisions (subsections)
            for subdiv in div.findall('tei:div', self.namespaces):
                process_div(subdiv, level + 1, section_title or parent_title)
        
        # Process all top-level divisions
        for div in body.findall('tei:div', self.namespaces):
            process_div(div, level=1)
        
        return blocks
    
    def _extract_figures(self, root: etree.Element) -> List[Dict[str, Any]]:
        """Extract figures with captions."""
        figures = []
        for fig in root.findall('.//tei:figure', self.namespaces):
            fig_id = fig.get('{http://www.w3.org/XML/1998/namespace}id', '')
            label_elem = fig.find('tei:head', self.namespaces)
            label = label_elem.text if label_elem is not None else None
            
            fig_desc = fig.find('tei:figDesc', self.namespaces)
            caption = ' '.join(fig_desc.itertext()) if fig_desc is not None else ''
            
            figures.append({
                'id': fig_id,
                'label': label,
                'caption': caption,
                'section': None,  # Could be enhanced to track section context
                'level': 1
            })
        return figures
    
    def _extract_tables(self, root: etree.Element) -> List[Dict[str, Any]]:
        """Extract tables."""
        tables = []
        for table in root.findall('.//tei:table', self.namespaces):
            table_id = table.get('{http://www.w3.org/XML/1998/namespace}id', '')
            head = table.find('tei:head', self.namespaces)
            label = head.text if head is not None else None
            
            # Extract table content
            rows = []
            for row in table.findall('.//tei:row', self.namespaces):
                cells = []
                for cell in row.findall('tei:cell', self.namespaces):
                    cells.append(' '.join(cell.itertext()).strip())
                rows.append(' | '.join(cells))
            content = '\n'.join(rows)
            
            tables.append({
                'id': table_id,
                'label': label,
                'content': content,
                'section': None,
                'level': 1
            })
        return tables
    
    def _extract_references(self, root: etree.Element) -> List[Dict[str, Any]]:
        """Extract bibliographic references."""
        references = []
        for ref in root.findall('.//tei:listBibl/tei:biblStruct', self.namespaces):
            ref_id = ref.get('{http://www.w3.org/XML/1998/namespace}id', '')
            
            # Extract reference text
            title_elem = ref.find('.//tei:title[@level="a"]', self.namespaces)
            title = title_elem.text if title_elem is not None else ''
            
            authors = []
            for author in ref.findall('.//tei:author/tei:persName', self.namespaces):
                forename = author.find('tei:forename', self.namespaces)
                surname = author.find('tei:surname', self.namespaces)
                if forename is not None and surname is not None:
                    authors.append(f"{forename.text} {surname.text}")
            
            year_elem = ref.find('.//tei:date[@type="published"]', self.namespaces)
            year = year_elem.get('when', '') if year_elem is not None else ''
            
            ref_text = f"{', '.join(authors)}. {title}. {year}".strip()
            
            references.append({
                'id': ref_id,
                'text': ref_text
            })
        return references
    
    def to_json(self, blocks: List[Block]) -> str:
        """Convert blocks to JSON string."""
        return json.dumps([block.model_dump() for block in blocks], indent=2, ensure_ascii=False)


