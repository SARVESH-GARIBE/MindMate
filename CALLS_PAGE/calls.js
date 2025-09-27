/* Calls page behavior - mock handlers with TODOs for real SDK integration */
(function () {
    'use strict';

    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const startAudio = document.getElementById('start-audio');
    const joinAudio = document.getElementById('join-audio');
    const startVideo = document.getElementById('start-video');
    const joinVideo = document.getElementById('join-video');
    const modal = document.getElementById('call-modal');
    const localVideo = document.getElementById('local-video');
    const endPreview = document.getElementById('end-preview');
    const muteAudio = document.getElementById('mute-audio');
    const toggleVideo = document.getElementById('toggle-video');
    const loadRecordings = document.getElementById('load-recordings');
    const recordingsList = document.getElementById('recordings-list');
    let localStream = null;
    let recorder = null;
    let recordingChunks = [];
    let currentRecordingType = 'audio';

    function toast(message) {
        const el = document.createElement('div');
        el.className = 'toast';
        el.textContent = message;
        Object.assign(el.style, { position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)', background: '#0b1220', color: '#e5e7eb', border: '1px solid #1f2937', padding: '10px 12px', borderRadius: '10px', zIndex: 50 });
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2200);
    }

    async function openPreview(kind) {
        try {
            const constraints = kind === 'Audio' ? { audio: true, video: false } : { audio: true, video: { width: 1280, height: 720 } };
            localStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (localVideo) {
                if (constraints.video) {
                    localVideo.srcObject = localStream;
                    localVideo.style.display = 'block';
                } else {
                    localVideo.style.display = 'none';
                }
            }
            // Start local recording
            currentRecordingType = constraints.video ? 'video' : 'audio';
            recordingChunks = [];
            const mime = constraints.video ? 'video/webm;codecs=vp9,opus' : 'audio/webm;codecs=opus';
            const mediaStream = constraints.video ? localStream : new MediaStream(localStream.getAudioTracks());
            try {
                recorder = new MediaRecorder(mediaStream, { mimeType: mime });
            } catch {
                recorder = new MediaRecorder(mediaStream);
            }
            recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordingChunks.push(e.data); };
            recorder.start();
            showModal();
        } catch (err) {
            console.error(err);
            toast('Permission denied or no device available');
        }
        // Optionally create a CallSession on backend immediately
        try { await createCallSession(kind === 'Audio' ? 'audio' : 'video'); } catch { }
    }

    function showModal() {
        if (!modal) return;
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
    }

    function closePreview() {
        if (modal) {
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
        }
        if (recorder && recorder.state !== 'inactive') {
            const localRecorder = recorder;
            recorder = null;
            localRecorder.onstop = async () => {
                try {
                    const blob = new Blob(recordingChunks, { type: currentRecordingType === 'video' ? 'video/webm' : 'audio/webm' });
                    await uploadRecording(blob, currentRecordingType);
                } catch { }
                recordingChunks = [];
            };
            try { localRecorder.stop(); } catch { }
        }
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            localStream = null;
        }
        if (localVideo) {
            localVideo.srcObject = null;
        }
        muteAudio?.setAttribute('aria-pressed', 'false');
        toggleVideo?.setAttribute('aria-pressed', 'false');
        toggleVideo && (toggleVideo.textContent = 'Video Off');
        muteAudio && (muteAudio.textContent = 'Mute');
    }

    startAudio?.addEventListener('click', () => openPreview('Audio'));
    startVideo?.addEventListener('click', () => openPreview('Video'));
    joinAudio?.addEventListener('click', () => toast('Enter room link UI coming soon'));
    joinVideo?.addEventListener('click', () => toast('Enter room link UI coming soon'));

    // Modal interactions
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        if (target.matches('[data-close]')) {
            closePreview();
        }
    });
    endPreview?.addEventListener('click', closePreview);

    muteAudio?.addEventListener('click', () => {
        if (!localStream) return;
        const pressed = muteAudio.getAttribute('aria-pressed') === 'true';
        const next = !pressed;
        muteAudio.setAttribute('aria-pressed', String(next));
        muteAudio.textContent = next ? 'Unmute' : 'Mute';
        localStream.getAudioTracks().forEach(t => t.enabled = !next);
    });

    toggleVideo?.addEventListener('click', () => {
        if (!localStream) return;
        const pressed = toggleVideo.getAttribute('aria-pressed') === 'true';
        const next = !pressed;
        toggleVideo.setAttribute('aria-pressed', String(next));
        toggleVideo.textContent = next ? 'Video On' : 'Video Off';
        localStream.getVideoTracks().forEach(t => t.enabled = !next);
    });

    loadRecordings?.addEventListener('click', async () => {
        const token = localStorage.getItem('auth_access');
        if (!token) { toast('Please login first'); return; }
        try {
            const res = await fetch('/api/calls/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed');
            const items = await res.json();
            renderRecordings(items);
        } catch (e) {
            toast('Failed to load recordings');
        }
    });

    function renderRecordings(items) {
        if (!recordingsList) return;
        recordingsList.innerHTML = '';
        const frag = document.createDocumentFragment();
        for (const it of items) {
            const li = document.createElement('li');
            const date = new Date(it.started_at).toLocaleString();
            const hasFile = !!it.recording_file;
            li.innerHTML = `
                <div class="rec-item">
                    <div class="meta">${date} • ${it.recording_type}</div>
                    ${hasFile ? `<a class="btn btn-ghost" href="${it.recording_file}" download>Download</a>` : '<span class="note">No file</span>'}
                </div>
            `;
            frag.appendChild(li);
        }
        recordingsList.appendChild(frag);
    }

    async function createCallSession(recordingType) {
        const token = localStorage.getItem('auth_access');
        if (!token) return;
        // naive: set callee to self (id 1) until you implement selection
        try {
            await fetch('/api/calls/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: toFormData({ callee: 1, recording_type: recordingType })
            });
        } catch (e) { }
    }

    function toFormData(obj) {
        const fd = new FormData();
        for (const k in obj) fd.append(k, obj[k]);
        return fd;
    }

    async function uploadRecording(blob, recordingType) {
        const token = localStorage.getItem('auth_access');
        if (!token) return;
        const file = new File([blob], recordingType === 'video' ? 'recording.webm' : 'recording.webm', { type: blob.type });
        const fd = new FormData();
        fd.append('callee', '1');
        fd.append('recording_type', recordingType);
        fd.append('recording_file', file);
        try {
            await fetch('/api/calls/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: fd
            });
            toast('Recording saved');
        } catch (e) {
            console.error(e);
            toast('Failed to upload recording');
        }
    }
})();


