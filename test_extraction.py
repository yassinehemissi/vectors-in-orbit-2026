import sys
import os
from pathlib import Path
import logging

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pipeline.experiment_extractor import ExperimentExtractor
from config import Config

logging.basicConfig(level=logging.INFO)

def test_extraction():
    extractor = ExperimentExtractor()
    text = "We performed CRISPR-Cas9 knockout of the TP53 gene in human MCF-7 cells. Cells were transfected using Lipofectamine 3000 at a concentration of 2 ug/mL. After 48 hours of incubation at 37C in 5% CO2, Western blot analysis revealed a 92% reduction in p53 protein levels."
    
    blocks = [{
        'block_id': 'test_block',
        'content': text,
        'section_title': 'Methods'
    }]
    
    print("Starting extraction...")
    results = extractor.extract_experiments(blocks)
    print(f"Extracted {len(results)} experiments.")
    for i, exp in enumerate(results):
        print(f"--- Experiment {i+1} ---")
        print(exp.model_dump_json(indent=2))

if __name__ == "__main__":
    test_extraction()
