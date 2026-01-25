import sys
import os
from pathlib import Path
import logging

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pipeline.orchestrator import ScientificPaperPipeline
from pipeline.experiment_extractor import ExperimentUnit

logging.basicConfig(level=logging.INFO)

def test_persistence():
    pipeline = ScientificPaperPipeline()
    
    exp = ExperimentUnit(
        experiment_id="test_exp_999",
        protein_or_target="TP53",
        experiment_type="Western Blot",
        methodology="SDS-PAGE",
        conditions={"temp": "4C"},
        results="Positive",
        missing_parameters=["pH"],
        overall_confidence=0.9
    )
    
    paper_id = "test_persistence_paper"
    
    print("Saving to Qdrant...")
    internal_id = pipeline.vectorizer.store_experiment(exp, paper_id)
    print(f"Generated UUID: {internal_id}")
    
    print("Saving to ScyllaDB...")
    pipeline.storage.store_experiment(exp, paper_id, internal_id)
    print("Done.")

if __name__ == "__main__":
    test_persistence()
