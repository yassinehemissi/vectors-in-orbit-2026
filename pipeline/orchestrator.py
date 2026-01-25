"""Main pipeline orchestrator - coordinates all processing stages."""
from pathlib import Path
from typing import Dict, Any, Optional, List
import logging
import uuid
from datetime import datetime

from config import Config

logger = logging.getLogger(__name__)


class ScientificPaperPipeline:
    """Main pipeline for processing scientific papers."""
    
    def __init__(self):
        """Initialize all pipeline components lazily."""
        logger.info("Initializing Scientific Paper Pipeline (lazy)")
        self._pdf_converter = None
        self._tei_parser = None
        self._block_structurer = None
        self._summarizer = None
        self._experiment_extractor = None
        self._vectorizer = None
        self._storage = None

    @property
    def pdf_converter(self):
        if self._pdf_converter is None:
            from pipeline.pdf_to_tei import PDFToTEIConverter
            self._pdf_converter = PDFToTEIConverter()
        return self._pdf_converter

    @property
    def tei_parser(self):
        if self._tei_parser is None:
            from pipeline.tei_parser import TEIParser
            self._tei_parser = TEIParser()
        return self._tei_parser

    @property
    def block_structurer(self):
        if self._block_structurer is None:
            from pipeline.block_structurer import BlockStructurer
            self._block_structurer = BlockStructurer(
                max_block_size=Config.MAX_BLOCK_SIZE,
                min_block_size=Config.MIN_BLOCK_SIZE
            )
        return self._block_structurer

    @property
    def summarizer(self):
        if self._summarizer is None:
            from pipeline.summarizer import Summarizer
            self._summarizer = Summarizer()
        return self._summarizer

    @property
    def experiment_extractor(self):
        if self._experiment_extractor is None:
            from pipeline.experiment_extractor import ExperimentExtractor
            self._experiment_extractor = ExperimentExtractor()
        return self._experiment_extractor

    @property
    def vectorizer(self):
        if self._vectorizer is None:
            from pipeline.vectorizer import Vectorizer
            self._vectorizer = Vectorizer()
        return self._vectorizer

    @property
    def storage(self):
        if self._storage is None:
            from pipeline.vectorizer import Storage
            self._storage = Storage()
        return self._storage
    
    def process_pdf(self, pdf_path: Path, paper_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a PDF paper through the entire pipeline.
        
        Args:
            pdf_path: Path to the PDF file
            paper_id: Optional paper ID (generated if not provided)
            
        Returns:
            Dictionary containing processing results
        """
        if paper_id is None:
            paper_id = str(uuid.uuid4())
        
        logger.info(f"Processing PDF: {pdf_path} (Paper ID: {paper_id})")
        
        results = {
            "paper_id": paper_id,
            "pdf_path": str(pdf_path),
            "timestamp": datetime.utcnow().isoformat(),
            "stages": {}
        }
        
        try:
            # Stage 1: PDF → TEI XML
            logger.info("Stage 1: Converting PDF to TEI XML")
            tei_xml = self.pdf_converter.convert(pdf_path)
            results["stages"]["pdf_to_tei"] = {
                "status": "success",
                "tei_xml_length": len(tei_xml)
            }
            
            # Stage 2: TEI XML → Blocks JSON
            logger.info("Stage 2: Parsing TEI XML to Blocks JSON")
            blocks = self.tei_parser.parse(tei_xml)
            blocks_json = self.tei_parser.to_json(blocks)
            results["stages"]["tei_parsing"] = {
                "status": "success",
                "block_count": len(blocks)
            }
            
            # Stage 3: Block Structuring
            logger.info("Stage 3: Structuring blocks")
            structured_blocks = self.block_structurer.structure(blocks)
            section_packets = self.block_structurer.create_section_packets(structured_blocks)
            results["stages"]["block_structuring"] = {
                "status": "success",
                "structured_block_count": len(structured_blocks),
                "section_packet_count": len(section_packets)
            }
            
            # Stage 4: Summarization
            logger.info("Stage 4: Summarizing sections")
            summarized_packets = self.summarizer.summarize_packets(section_packets)
            results["stages"]["summarization"] = {
                "status": "success",
                "summarized_packet_count": len(summarized_packets)
            }
            results["sections"] = summarized_packets
            
            # Stage 5: Experiment Extraction
            logger.info("Stage 5: Extracting experiments")
            block_dicts = [block.model_dump() for block in structured_blocks]
            experiments = self.experiment_extractor.extract_experiments(block_dicts)
            results["stages"]["experiment_extraction"] = {
                "status": "success",
                "experiment_count": len(experiments)
            }
            
            # Stage 6: Vectorization & Storage
            logger.info("Stage 6: Storing experiments")
            experiment_ids = []
            for experiment in experiments:
                experiment_id = self.vectorizer.store_experiment(experiment, paper_id)
                self.storage.store_experiment(experiment, paper_id, experiment_id)
                experiment_ids.append(experiment_id)
            
            # Store paper metadata
            title = None
            abstract = None
            for block in blocks:
                if block.block_type == "heading" and block.level == 0:
                    title = block.content
                elif block.metadata.get("is_abstract"):
                    abstract = block.content
            
            self.storage.store_paper_metadata(
                paper_id=paper_id,
                title=title or "Unknown",
                abstract=abstract or "",
                file_path=str(pdf_path),
                block_count=len(structured_blocks),
                experiment_count=len(experiments)
            )
            
            results["stages"]["storage"] = {
                "status": "success",
                "experiment_ids": experiment_ids
            }
            
            # Final results
            results["summary"] = {
                "total_blocks": len(structured_blocks),
                "total_experiments": len(experiments),
                "sections": len(section_packets),
                "status": "success"
            }
            results["experiments"] = [exp.model_dump() for exp in experiments]
            
            logger.info(f"Pipeline completed successfully for paper {paper_id}")
            
        except Exception as e:
            logger.error(f"Pipeline failed: {e}", exc_info=True)
            results["summary"] = {
                "status": "error",
                "error": str(e)
            }
            results["stages"]["error"] = {
                "status": "failed",
                "error": str(e)
            }
        
        return results
    
    def search_similar_experiments(self, query_experiment: Dict[str, Any], limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search for similar experiments.
        
        Args:
            query_experiment: Experiment dictionary to search for
            limit: Maximum number of results
            
        Returns:
            List of similar experiments with scores
        """
        from pipeline.experiment_extractor import ExperimentUnit
        
        experiment_unit = ExperimentUnit(**query_experiment)
        return self.vectorizer.search_similar(experiment_unit, limit=limit)
    
    def get_paper_experiments(self, paper_id: str) -> List[Dict[str, Any]]:
        """Retrieve all experiments for a paper."""
        return self.storage.get_experiments_by_paper(paper_id)


