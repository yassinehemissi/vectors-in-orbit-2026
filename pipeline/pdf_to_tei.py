"""PDF to TEI XML conversion using GROBID."""
import requests
from pathlib import Path
from typing import Optional
import logging
from config import Config

logger = logging.getLogger(__name__)


class PDFToTEIConverter:
    """Converts PDF papers to TEI XML using GROBID."""
    
    def __init__(self, grobid_url: Optional[str] = None):
        self.grobid_url = grobid_url or Config.GROBID_URL
        self.timeout = Config.GROBID_TIMEOUT
        
    def convert(self, pdf_path: Path) -> str:
        """
        Convert PDF to TEI XML.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            TEI XML content as string
            
        Raises:
            requests.RequestException: If GROBID service is unavailable
        """
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        logger.info(f"Converting PDF to TEI XML: {pdf_path}")
        
        # GROBID processFulltextDocument endpoint
        url = f"{self.grobid_url}/api/processFulltextDocument"
        
        with open(pdf_path, 'rb') as pdf_file:
            files = {'input': pdf_file}
            data = {
                'generateIDs': '1',
                'consolidateCitations': '1',
                'includeRawCitations': '1',
                'includeRawAffiliations': '1',
                'teiCoordinates': ['s', 'head', 'note', 'ref', 'figure', 'table']
            }
            
            try:
                response = requests.post(
                    url,
                    files=files,
                    data=data,
                    timeout=self.timeout
                )
                response.raise_for_status()
                
                tei_xml = response.text
                logger.info(f"Successfully converted PDF to TEI XML ({len(tei_xml)} chars)")
                return tei_xml
                
            except requests.exceptions.RequestException as e:
                logger.error(f"GROBID conversion failed: {e}")
                raise
    
    def is_available(self) -> bool:
        """Check if GROBID service is available."""
        try:
            response = requests.get(f"{self.grobid_url}/api/isalive", timeout=5)
            return response.status_code == 200
        except:
            return False


