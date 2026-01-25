"""Example usage of the Scientific Paper Processing Pipeline."""
import logging
from pathlib import Path
from pipeline import ScientificPaperPipeline
from config import Config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def main():
    """Example usage."""
    # Ensure output directory exists
    Config.ensure_output_dir()
    
    # Initialize pipeline
    pipeline = ScientificPaperPipeline()
    
    # Check if GROBID is available
    if not pipeline.pdf_converter.is_available():
        print("WARNING: GROBID service is not available.")
        print("Please start GROBID using: docker run -d -p 8070:8070 lfoppiano/grobid:0.8.1")
        return
    
    # Process a PDF (replace with your PDF path)
    pdf_path = Path("example_paper.pdf")
    
    if not pdf_path.exists():
        print(f"PDF file not found: {pdf_path}")
        print("Please provide a valid PDF file path.")
        return
    
    # Process the PDF
    print(f"Processing PDF: {pdf_path}")
    results = pipeline.process_pdf(pdf_path)
    
    # Print results
    print("\n" + "="*50)
    print("PROCESSING RESULTS")
    print("="*50)
    print(f"Paper ID: {results['paper_id']}")
    print(f"Status: {results['summary']['status']}")
    
    if results['summary']['status'] == 'success':
        print(f"Total Blocks: {results['summary']['total_blocks']}")
        print(f"Total Experiments: {results['summary']['total_experiments']}")
        print(f"Sections: {results['summary']['sections']}")
        
        # Retrieve experiments
        experiments = pipeline.get_paper_experiments(results['paper_id'])
        print(f"\nExtracted {len(experiments)} experiments:")
        for i, exp in enumerate(experiments[:5], 1):  # Show first 5
            print(f"\n  Experiment {i}:")
            if exp.get('protein_name'):
                print(f"    Protein: {exp['protein_name']}")
            if exp.get('method'):
                print(f"    Method: {exp['method']}")
            if exp.get('observations'):
                print(f"    Observations: {exp['observations'][:100]}...")
    else:
        print(f"Error: {results['summary'].get('error', 'Unknown error')}")

if __name__ == "__main__":
    main()


