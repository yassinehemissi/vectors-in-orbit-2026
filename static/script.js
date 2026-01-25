document.addEventListener('DOMContentLoaded', () => {
    // --- State & Selectors ---
    let uploadedFilename = null;
    const navItems = document.querySelectorAll('.nav-item');
    const panes = document.querySelectorAll('.content-pane');
    const tabTitle = document.getElementById('tab-title');

    // --- Tab Switching ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    function switchTab(tabId) {
        navItems.forEach(i => i.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));

        const targetNav = document.querySelector(`[data-tab="${tabId}"]`);
        if (targetNav) targetNav.classList.add('active');

        const targetPane = document.getElementById(`tab-${tabId}`);
        if (targetPane) targetPane.classList.add('active');

        tabTitle.textContent = tabId.charAt(0).toUpperCase() + tabId.slice(1).replace('-', ' ');
    }

    // --- Sub-Tab Switching (PDF Results) ---
    document.querySelectorAll('.tab-sm').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-sm').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.subtab-content').forEach(c => c.style.display = 'none');

            tab.classList.add('active');
            const subtab = tab.getAttribute('data-subtab');
            document.getElementById(`pdf-${subtab}-content`).style.display = 'block';
        });
    });

    // --- Summarization ---
    const summarizeBtn = document.getElementById('summarize-btn');
    const summaryInput = document.getElementById('summary-input');
    const summaryCard = document.getElementById('summary-result-card');
    const summaryContent = document.getElementById('summary-content');

    if (summarizeBtn) {
        summarizeBtn.addEventListener('click', async () => {
            const text = summaryInput.value.trim();
            if (!text) return;

            setLoading(summarizeBtn, true);
            try {
                const res = await fetch('/api/summarize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });
                const data = await res.json();
                summaryContent.textContent = data.summary || 'Summary failed.';
                summaryCard.style.display = 'block';
            } catch (e) {
                alert('Summarization error: ' + e);
            } finally {
                setLoading(summarizeBtn, false);
            }
        });
    }

    // --- Experiment Chat ---
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');

    if (chatSend) {
        chatSend.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    }

    async function sendMessage() {
        const question = chatInput.value.trim();
        if (!question) return;

        addMessage('user', question);
        chatInput.value = '';
        setLoading(chatSend, true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });
            const data = await res.json();

            let answer = data.answer || "I could not generate an answer.";

            // Add Evidence
            if (data.evidence && data.evidence.length > 0) {
                answer += "<br><br><strong>Evidence Points:</strong><ul>";
                data.evidence.forEach(ev => {
                    answer += `<li>${ev.fact} (<em>${ev.type}</em>)</li>`;
                });
                answer += "</ul>";
            }

            // Append Sources as Cards
            if (data.sources && data.sources.length > 0) {
                answer += "<br><strong>Retrieved Evidence:</strong>";
                data.sources.forEach(src => {
                    answer += `
                        <div class="chat-source-card">
                            <div class="source-header">ID: ${src.experiment_id}</div>
                            <div class="source-body">
                                <strong>Target:</strong> ${src.protein_or_target || 'N/A'}<br>
                                <strong>Method:</strong> ${src.methodology || 'N/A'}<br>
                                <strong>Results:</strong> ${src.results || 'N/A'}
                            </div>
                        </div>
                    `;
                });
            }

            addMessage('assistant', answer);
        } catch (e) {
            addMessage('assistant', 'Error: ' + e.message);
        } finally {
            setLoading(chatSend, false);
        }
    }

    function addMessage(role, text) {
        const div = document.createElement('div');
        div.className = `message ${role}`;
        div.innerHTML = `
            <div class="avatar">${role === 'user' ? '👤' : '🤖'}</div>
            <div class="bubble">${text}</div>
        `;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- PDF Processing ---
    const uploadZone = document.getElementById('upload-zone');
    const pdfInput = document.getElementById('pdf-input');
    const uploadInfo = document.getElementById('upload-info');
    const filenameDisplay = document.getElementById('filename-display');
    const processPdfBtn = document.getElementById('process-pdf-btn');
    const pipelineProgress = document.getElementById('pipeline-progress');
    const pdfResults = document.getElementById('pdf-results');

    if (uploadZone) {
        uploadZone.onclick = () => pdfInput.click();
        pdfInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            uploadFile(file);
        };
    }

    async function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                uploadedFilename = data.filename;
                filenameDisplay.textContent = data.filename;
                uploadZone.style.display = 'none';
                uploadInfo.style.display = 'block';
            }
        } catch (e) { alert('Upload failed: ' + e); }
    }

    if (processPdfBtn) {
        processPdfBtn.onclick = async () => {
            if (!uploadedFilename) return;
            setLoading(processPdfBtn, true);
            pipelineProgress.style.display = 'block';
            pdfResults.style.display = 'none';

            document.querySelectorAll('.stage').forEach(s => {
                s.classList.remove('complete', 'error');
                s.querySelector('.stage-status').textContent = '⏳';
            });

            try {
                const res = await fetch('/api/process-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: uploadedFilename })
                });
                const data = await res.json();

                document.querySelectorAll('.stage').forEach(s => {
                    s.classList.add('complete');
                    s.querySelector('.stage-status').textContent = '✓';
                });

                renderPdfResults(data);
            } catch (e) {
                alert('Processing failed: ' + e);
            } finally {
                setLoading(processPdfBtn, false);
            }
        };
    }

    function renderPdfResults(data) {
        const summaryGrid = document.getElementById('results-summary');
        summaryGrid.innerHTML = `
            <div class="summary-item"><div class="summary-value">${data.summary.total_blocks}</div><div class="summary-label">Blocks</div></div>
            <div class="summary-item"><div class="summary-value">${data.summary.total_sections}</div><div class="summary-label">Sections</div></div>
            <div class="summary-item"><div class="summary-value">${data.summary.total_experiments}</div><div class="summary-label">Experiments</div></div>
        `;

        const sectionsPane = document.getElementById('pdf-sections-content');
        sectionsPane.innerHTML = data.data.sections.map(s => `
            <div class="card" style="padding: 1rem; margin-bottom: 0.5rem;">
                <div style="font-weight: 600;">${s.title}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">${s.summary}</div>
            </div>
        `).join('');

        const experimentsPane = document.getElementById('pdf-experiments-content');
        experimentsPane.innerHTML = `<div class="experiment-list">${renderExperimentCards(data.data.experiments)}</div>`;

        pdfResults.style.display = 'block';
    }

    // --- Manual Extraction ---
    const extractBtn = document.getElementById('extract-btn');
    const extractInput = document.getElementById('extract-input');
    const extractContainer = document.getElementById('extract-results-container');
    const extractedList = document.getElementById('extracted-list');

    if (extractBtn) {
        extractBtn.onclick = async () => {
            const text = extractInput.value.trim();
            if (!text) return;
            setLoading(extractBtn, true);

            try {
                const res = await fetch('/api/extract-experiments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });
                const data = await res.json();
                extractedList.innerHTML = renderExperimentCards(data.experiments);
                extractContainer.style.display = 'block';
            } catch (e) {
                alert('Extraction failed: ' + e);
            } finally {
                setLoading(extractBtn, false);
            }
        };
    }

    function renderExperimentCards(experiments) {
        if (!experiments || experiments.length === 0) return '<div class="empty-state">No experiments found.</div>';
        return experiments.map(e => `
            <div class="experiment-item">
                <div class="item-header">
                    <span class="badge badge-${getConfidenceClass(e.overall_confidence || 0.8)}">
                        ${Math.round((e.overall_confidence || 0.8) * 100)}% Confidence
                    </span>
                </div>
                <div class="experiment-field">
                    <span class="field-label">Target</span>
                    <span class="field-value">${e.protein_or_target || 'N/A'}</span>
                </div>
                <div class="experiment-field">
                    <span class="field-label">Type</span>
                    <span class="field-value">${e.experiment_type || 'N/A'}</span>
                </div>
                <div class="experiment-field">
                    <span class="field-label">Methodology</span>
                    <span class="field-value">${e.methodology || 'N/A'}</span>
                </div>
                <div class="experiment-field">
                    <span class="field-label">Results</span>
                    <span class="field-value">${e.results || 'N/A'}</span>
                </div>
                ${e.missing_parameters && e.missing_parameters.length > 0 ? `
                    <div class="experiment-field">
                        <span class="field-label">Missing Data</span>
                        <span class="missing-text">${e.missing_parameters.join(', ')}</span>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    function getConfidenceClass(conf) {
        if (conf >= 0.8) return 'high';
        if (conf >= 0.5) return 'medium';
        return 'low';
    }

    function setLoading(btn, isLoading) {
        if (!btn) return;
        if (isLoading) {
            btn.classList.add('loading');
            btn.disabled = true;
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    // --- Health & Config ---
    async function init() {
        try {
            const apiRes = await fetch('/api/health');
            if (apiRes.ok) document.getElementById('api-status').textContent = 'Online';
        } catch {
            const status = document.getElementById('api-status');
            if (status) status.textContent = 'Offline';
        }

        try {
            const grobidRes = await fetch('/api/grobid/status');
            const grobidData = await grobidRes.json();
            const status = document.getElementById('grobid-status');
            const dot = document.getElementById('grobid-dot');
            if (status) status.textContent = grobidData.available ? 'Online' : 'Offline';
            if (dot) dot.className = `status-dot ${grobidData.available ? 'online' : 'offline'}`;
        } catch { }

        try {
            const cfgRes = await fetch('/api/config');
            const data = await cfgRes.json();
            const prov = document.getElementById('cfg-provider');
            if (prov) prov.textContent = data.provider.toUpperCase();
            const mod = document.getElementById('cfg-model');
            if (mod) mod.textContent = data.model;
            const grob = document.getElementById('cfg-grobid');
            if (grob) grob.textContent = data.grobid_url;
            const key = document.getElementById('cfg-apikey');
            if (key) key.textContent = data.api_key_set ? '✓ Active' : '✗ Missing';
        } catch { }
    }

    init();
});
