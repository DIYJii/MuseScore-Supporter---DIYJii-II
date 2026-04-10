/* main.js (English Version) */
(function() {
    const PANEL_WIDTH = '350px'; 
    const PANEL_ID = 'my-ai-sidebar';

    /* Toggle function: close if already open */
    const existing = document.getElementById(PANEL_ID);
    if (existing) {
        closePanel();
        return;
    }

    function closePanel() {
        const p = document.getElementById(PANEL_ID);
        if (p) {
            document.body.style.marginRight = '0px';
            p.style.transform = 'translateX(100%)';
            setTimeout(() => p.remove(), 300);
        }
    }

    /* Shrink main content to the left */
    document.body.style.transition = 'margin-right 0.3s ease';
    document.body.style.marginRight = PANEL_WIDTH;

    /* Create Sidebar Panel */
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    Object.assign(panel.style, {
        position: 'fixed', top: '0', right: '0', width: PANEL_WIDTH, height: '100%',
        backgroundColor: '#ffffff', borderLeft: '1px solid #ddd',
        boxShadow: '-4px 0 15px rgba(0,0,0,0.1)', zIndex: '2147483647',
        padding: '0', boxSizing: 'border-box', fontFamily: 'sans-serif',
        transition: 'transform 0.3s ease', transform: 'translateX(0)'
    });

    panel.innerHTML = `
        <div style="background:#f8f9fa; padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:bold; color:#1a73e8;">AI Search Assistant</span>
            <button id="close-x" style="cursor:pointer; border:none; background:none; font-size:24px; color:#999; line-height:1;">&times;</button>
        </div>
        <div style="padding:20px;">
            <p style="font-size:13px; color:#555; margin-bottom:8px;">Enter your search instructions:</p>
            <textarea id="ai-query" placeholder="e.g. Summarize the latest news from this site" style="width:100%; height:150px; border:1px solid #ddd; border-radius:8px; padding:12px; font-size:14px; resize:none; outline:none;"></textarea>
            <button id="ai-submit" style="width:100%; margin-top:20px; padding:14px; background:#1a73e8; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px;">Launch Google AI Search</button>
        </div>
    `;

    document.body.appendChild(panel);
    document.getElementById('close-x').onclick = closePanel;

    /* Execute Search */
    document.getElementById('ai-submit').onclick = function() {
        const query = document.getElementById('ai-query').value;
        if(!query) return alert('Please enter a search query.');
        
        /* The protected image URL (will be updated after Vercel deployment) */
        const imgUrl = "https://vercel.app"; 
        const finalQuery = `${query} \n\nPlease follow the instructions in this image: ${imgUrl}`;

        const form = document.createElement('form');
        form.method = 'GET';
        form.action = 'https://google.com';
        form.target = '_blank';
        const p = { q: finalQuery, udm: '50', hl: 'en' }; // Language set to English
        for(let k in p) {
            const i = document.createElement('input');
            i.type='hidden'; i.name=k; i.value=p[k];
            form.appendChild(i);
        }
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };
})();
