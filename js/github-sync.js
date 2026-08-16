/**
 * Smart Kids Preschool - In-App Direct GitHub Push Engine
 * Connects directly to GitHub REST API from the browser using Personal Access Token (PAT).
 * Zero-cost deployments on Cloudflare Pages or GitHub Pages!
 */

class GitHubSyncEngine {
  constructor() {
    this.apiBase = 'https://api.github.com';
    this.syncHistoryKey = 'sk_github_sync_history';
  }

  getConfig() {
    return window.schoolStore.getGithubConfig();
  }

  saveConfig(repoOwner, repoName, branch, token) {
    const config = {
      repoOwner: repoOwner.trim(),
      repoName: repoName.trim(),
      branch: (branch || 'main').trim(),
      token: token.trim(),
      lastSync: new Date().toISOString()
    };
    window.schoolStore.saveGithubConfig(config);
    showToast('GitHub configuration saved securely.', 'success');
  }

  getSyncHistory() {
    return JSON.parse(localStorage.getItem(this.syncHistoryKey) || '[]');
  }

  addSyncHistory(logItem) {
    const history = this.getSyncHistory();
    history.unshift({
      ...logItem,
      id: `sync_${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN')
    });
    localStorage.setItem(this.syncHistoryKey, JSON.stringify(history.slice(0, 15)));
  }

  /**
   * Test Connection to GitHub Repository
   */
  async testConnection() {
    const config = this.getConfig();
    if (!config.repoOwner || !config.repoName || !config.token) {
      showToast('Please provide Repository Owner, Repo Name, and GitHub Token.', 'warning');
      return { success: false, message: 'Missing configuration' };
    }

    try {
      showToast('Testing connection with GitHub API...', 'info', 2000);
      const url = `${this.apiBase}/repos/${config.repoOwner}/${config.repoName}/branches/${config.branch || 'main'}`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `token ${config.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Connected to ${config.repoOwner}/${config.repoName} (${config.branch})!`, 'success');
        return {
          success: true,
          repo: `${config.repoOwner}/${config.repoName}`,
          latestCommit: data.commit.sha.substring(0, 7),
          commitMessage: data.commit.commit.message
        };
      } else {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.message || `HTTP ${res.status}: ${res.statusText}`;
        showToast(`GitHub Error: ${msg}`, 'error');
        return { success: false, message: msg };
      }
    } catch (err) {
      showToast(`Network error connecting to GitHub: ${err.message}`, 'error');
      return { success: false, message: err.message };
    }
  }

  /**
   * Push/Update a File on GitHub directly via GitHub API
   */
  async pushFileToGitHub(filePath, fileContentString, commitMessage) {
    const config = this.getConfig();
    if (!config.repoOwner || !config.repoName || !config.token) {
      showToast('GitHub token and repository settings required in Admin settings.', 'error');
      return { success: false, error: 'Not configured' };
    }

    const cleanPath = filePath.replace(/^\/+/, '');
    const url = `${this.apiBase}/repos/${config.repoOwner}/${config.repoName}/contents/${cleanPath}`;

    try {
      // Check if file already exists to get its SHA
      let existingSha = null;
      try {
        const checkRes = await fetch(`${url}?ref=${config.branch || 'main'}`, {
          headers: {
            'Authorization': `token ${config.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (checkRes.ok) {
          const fileData = await checkRes.json();
          existingSha = fileData.sha;
        }
      } catch (e) {
        // file doesn't exist yet, proceed with new create
      }

      // Encode UTF-8 to Base64 safely
      const utf8Bytes = new TextEncoder().encode(fileContentString);
      let binary = '';
      utf8Bytes.forEach(b => binary += String.fromCharCode(b));
      const base64Content = btoa(binary);

      const payload = {
        message: commitMessage || `Update ${cleanPath} via Smart Kids Web App`,
        content: base64Content,
        branch: config.branch || 'main'
      };
      if (existingSha) payload.sha = existingSha;

      const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${config.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(payload)
      });

      if (putRes.ok) {
        const resultData = await putRes.json();
        this.addSyncHistory({
          filePath: cleanPath,
          commitSha: resultData.commit.sha.substring(0, 7),
          message: payload.message,
          status: 'Deployed'
        });
        return { success: true, sha: resultData.commit.sha };
      } else {
        const errorData = await putRes.json().catch(() => ({}));
        throw new Error(errorData.message || putRes.statusText);
      }
    } catch (err) {
      console.error('GitHub Push Error:', err);
      showToast(`Push failed: ${err.message}`, 'error');
      return { success: false, error: err.message };
    }
  }

  /**
   * Push Full Live Website State / Database to GitHub
   */
  async pushCompleteDataSnapshot() {
    showToast('Preparing full school database snapshot...', 'info', 2000);

    const snapshot = {
      exportedAt: new Date().toISOString(),
      schoolName: 'Smart Kids Preschool & Daycare',
      students: window.schoolStore.getStudents(),
      announcements: window.schoolStore.getAnnouncements(),
      gallery: window.schoolStore.getGallery(),
      admissions: window.schoolStore.getAdmissions(),
      transactions: window.schoolStore.getTransactions()
    };

    const contentStr = JSON.stringify(snapshot, null, 2);
    const result = await this.pushFileToGitHub(
      'data/school-data.json',
      contentStr,
      `chore: automated school state snapshot (${new Date().toLocaleDateString('en-IN')})`
    );

    if (result.success) {
      showToast(`Successfully pushed database snapshot to GitHub! Commit: ${result.sha.substring(0, 7)}`, 'success', 5000);
      if (window.renderAdminSyncHistory) window.renderAdminSyncHistory();
    }
    return result;
  }
}

// Global GitHub Sync Instance
window.githubSync = new GitHubSyncEngine();
