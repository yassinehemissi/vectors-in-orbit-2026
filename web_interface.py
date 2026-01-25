"""
Comprehensive Web Interface for Experiment Intelligence Engine.
"""
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import logging
import sys
import os
from pathlib import Path
from datetime import datetime

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from pipeline.orchestrator import ScientificPaperPipeline
from pipeline.experiment_qa import ExperimentQA
from pipeline.summarizer import Summarizer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

UPLOAD_FOLDER = Path('./uploads')
UPLOAD_FOLDER.mkdir(exist_ok=True)
app.config['UPLOAD_FOLDER'] = str(UPLOAD_FOLDER)

# Lazy init
_pipeline = None
_qa_engine = None
_summarizer = None

def get_pipeline():
    global _pipeline
    if _pipeline is None:
        _pipeline = ScientificPaperPipeline()
    return _pipeline

def get_qa_engine():
    global _qa_engine
    if _qa_engine is None:
        _qa_engine = ExperimentQA()
    return _qa_engine

def get_summarizer():
    global _summarizer
    if _summarizer is None:
        _summarizer = Summarizer()
    return _summarizer

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/config')
def get_config():
    return jsonify({
        'provider': Config.SUMMARIZATION_API_PROVIDER,
        'model': Config.SUMMARIZATION_API_MODEL,
        'grobid_url': Config.GROBID_URL,
        'api_key_set': bool(Config.SUMMARIZATION_API_KEY)
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No filename'}), 400
    if file:
        filename = secure_filename(file.filename)
        path = UPLOAD_FOLDER / filename
        file.save(str(path))
        return jsonify({'success': True, 'filename': filename})

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/grobid/status', methods=['GET'])
def grobid_status():
    try:
        pipeline = get_pipeline()
        is_available = pipeline.pdf_converter.is_available()
        return jsonify({
            'available': is_available,
            'url': Config.GROBID_URL
        })
    except Exception as e:
        return jsonify({'available': False, 'error': str(e)})

@app.route('/api/extract-experiments', methods=['POST'])
def extract_experiments():
    data = request.get_json()
    text = data.get('text', '')
    logger.info(f"Manual extraction requested for text: {text[:100]}...")
    if not text.strip():
        return jsonify({'error': 'No text'}), 400
    
    pipeline = get_pipeline()
    # Create a mock block for extraction
    mock_blocks = [{
        'block_id': 'manual_ext_block',
        'block_type': 'paragraph',
        'content': text,
        'section_title': 'Experimental',
        'metadata': {}
    }]
    
    experiments = pipeline.experiment_extractor.extract_experiments(mock_blocks)
    logger.info(f"Extracted {len(experiments)} manual experiments")
    
    # NEW: Persist manual extractions to the Knowledge Base
    paper_id = "manual_extraction_kb"
    peristed_count = 0
    for exp in experiments:
        try:
            # Generate internal ID and save
            internal_id = pipeline.vectorizer.store_experiment(exp, paper_id)
            pipeline.storage.store_experiment(exp, paper_id, internal_id)
            peristed_count += 1
        except Exception as e:
            logger.error(f"Failed to persist manual experiment: {e}")
        
    return jsonify({
        'success': True,
        'experiments': [exp.model_dump() for exp in experiments],
        'count': len(experiments),
        'persisted_count': peristed_count
    })

@app.route('/api/process-pdf', methods=['POST'])
def process_paper():
    data = request.get_json()
    filename = data.get('filename')
    logger.info(f"Processing PDF requested for: {filename}")
    path = UPLOAD_FOLDER / filename
    
    try:
        pipeline = get_pipeline()
        logger.info("Starting pipeline process_pdf...")
        results = pipeline.process_pdf(path)
        logger.info(f"Pipeline finished. Status: {results.get('summary', {}).get('status')}")
        
        if results.get('summary', {}).get('status') == 'success':
            # We need to get the paper_id to retrieve information if needed
            paper_id = results.get('paper_id')
            
            # The pipeline results don't contain everything the frontend wants.
            # In a real app, we'd store the PDF results in the database.
            # For now, we'll augment the results.
            
            processed_data = {
                'paper_id': paper_id,
                'summary': {
                    'status': 'success',
                    'total_blocks': results['summary']['total_blocks'],
                    'total_sections': results['summary']['sections'],
                    'total_experiments': results['summary']['total_experiments']
                },
                'stages': results.get('stages', {}),
                'data': {
                    'sections': [
                        {
                            'title': s.get('section_title', 'Untitled Section'),
                            'summary': s.get('summary', '')
                        } for s in results.get('sections', [])
                    ],
                    'experiments': results.get('experiments', [])
                }
            }
            return jsonify(processed_data)
        else:
            return jsonify(results)
            
    except Exception as e:
        logger.error(f"Processing error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    question = data.get('question')
    if not question:
        return jsonify({'error': 'No question'}), 400
        
    qa = get_qa_engine()
    response = qa.answer_question(question)
    return jsonify(response)

@app.route('/api/summarize', methods=['POST'])
def summarize():
    data = request.get_json()
    text = data.get('text')
    if not text:
        return jsonify({'error': 'No text'}), 400
        
    sumr = get_summarizer()
    summary = sumr.summarize_section(text)
    return jsonify({'summary': summary})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
