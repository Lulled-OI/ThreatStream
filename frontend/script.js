// ThreatStream - Enhanced Professional SOC Dashboard

class ThreatStreamDashboard {
    constructor() {
        this.apiBase = 'http://localhost:5000/api';
        this.articles = [];
        this.filteredArticles = [];
        this.sources = [];
        this.autoRefresh = false;
        this.refreshInterval = null;
        this.isLoading = false;
        this.demoMode = false;
        
        // Sample threat data for demonstration
        this.sampleThreats = [
            {
                id: 'CVE-2025-0147',
                title: 'Critical Zero-Day Vulnerability in Apache Struts 2.5.x',
                summary: 'Remote code execution vulnerability affecting Apache Struts 2.5.x allows attackers to execute arbitrary code. Immediate patching recommended.',
                source: 'NIST NVD',
                severity: 'critical',
                published: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                link: '#',
                threats: ['RCE', 'Zero-Day'],
                cvss: 9.8
            },
            {
                id: 'ALERT-2025-0831',
                title: 'New Ransomware Campaign Targeting Healthcare Sector',
                summary: 'BlackCat ransomware variant detected targeting hospital networks via phishing emails. Enhanced monitoring advised for healthcare organizations.',
                source: 'CISA',
                severity: 'high',
                published: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
                link: '#',
                threats: ['Ransomware', 'Phishing'],
                cvss: 8.1
            },
            {
                id: 'IOC-2025-1247',
                title: 'Malicious NPM Package "secure-crypto-utils" Identified',
                summary: 'NPM package "secure-crypto-utils" v2.1.3 contains malicious code that exfiltrates environment variables. Package has been removed.',
                source: 'GitHub Security',
                severity: 'high',
                published: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
                link: '#',
                threats: ['Supply Chain', 'Data Theft'],
                cvss: 7.5
            },
            {
                id: 'VULN-2025-2456',
                title: 'Microsoft Exchange Server Security Update Available',
                summary: 'Microsoft has released security updates for Exchange Server 2019 and 2016 addressing multiple vulnerabilities including potential privilege escalation.',
                source: 'Microsoft MSRC',
                severity: 'medium',
                published: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
                link: '#',
                threats: ['Privilege Escalation'],
                cvss: 6.8
            },
            {
                id: 'INTEL-2025-0789',
                title: 'APT29 Infrastructure Changes Detected',
                summary: 'Cozy Bear (APT29) has shifted to new command and control infrastructure. Updated IOCs and TTPs have been released for threat hunting.',
                source: 'FireEye Mandiant',
                severity: 'high',
                published: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
                link: '#',
                threats: ['APT', 'C2 Infrastructure'],
                cvss: 8.3
            },
            {
                id: 'PATCH-2025-1156',
                title: 'Chrome 127.0.6533.119 Security Update Released',
                summary: 'Google Chrome security update addresses 8 vulnerabilities including 2 high-severity issues. Automatic updates are rolling out.',
                source: 'Google Chrome Releases',
                severity: 'medium',
                published: new Date(Date.now() - 16 * 60 * 60 * 1000), // 16 hours ago
                link: '#',
                threats: ['Browser Security'],
                cvss: 6.1
            }
        ];
        
        this.threatKeywords = {
            critical: ['zero-day', 'critical vulnerability', 'ransomware', 'data breach', 'nation-state', 'apt', 'supply chain'],
            high: ['vulnerability', 'malware', 'phishing', 'exploit', 'backdoor', 'trojan', 'botnet'],
            medium: ['patch', 'update', 'security advisory', 'warning', 'alert', 'suspicious'],
            low: ['announcement', 'release', 'feature', 'improvement', 'maintenance']
        };
        
        this.init();
    }

    init() {
        console.log('ThreatStream initializing...');
        try {
            this.initializeEventListeners();
            this.initializeMatrixBackground();
            this.startSystemClock();
            this.initializeThreatLevel();
            this.startRealTimeUpdates();
            
            // Load sample data immediately for demo
            this.loadSampleData();
            
            // Try to load real data in background
            setTimeout(() => this.loadNews(), 2000);
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize dashboard: ' + error.message);
        }
    }

    initializeEventListeners() {
        console.log('Setting up event listeners...');
        
        // Auto-refresh toggle
        const autoRefreshBtn = document.getElementById('autoRefreshBtn');
        if (autoRefreshBtn) {
            autoRefreshBtn.addEventListener('click', () => {
                this.toggleAutoRefresh();
            });
        }

        // Search and filters
        const searchFilter = document.getElementById('searchFilter');
        if (searchFilter) {
            searchFilter.addEventListener('input', () => {
                this.filterArticles();
            });
        }

        const sourceFilter = document.getElementById('sourceFilter');
        if (sourceFilter) {
            sourceFilter.addEventListener('change', () => {
                this.filterArticles();
            });
        }

        // Severity filter buttons
        document.querySelectorAll('.severity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.toggleSeverityFilter(e.target);
            });
        });

        // Timeline controls
        document.querySelectorAll('.timeline-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTimelinePeriod(e.target.textContent);
            });
        });

        // FAB menu
        const mainFab = document.getElementById('mainFab');
        if (mainFab) {
            mainFab.addEventListener('click', () => {
                this.toggleFabMenu();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window focus/blur for notifications
        window.addEventListener('focus', () => {
            this.clearNotifications();
        });
    }

    initializeMatrixBackground() {
        console.log('Setting up matrix background...');
        // Keep the existing matrix background code but make it more subtle
        const matrixBg = document.querySelector('.matrix-bg');
        if (matrixBg) {
            console.log('Matrix background initialized');
        }
    }

    startSystemClock() {
        console.log('Starting system clock...');
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            const timeElement = document.getElementById('systemTime');
            if (timeElement) {
                timeElement.textContent = timeString;
            }
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }

    initializeThreatLevel() {
        // Start with dynamic threat level indicator
        this.animateThreatLevel();
    }

    animateThreatLevel() {
        const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const colors = ['#5cb85c', '#f0ad4e', '#d9534f', '#ff1744'];
        const percentages = [25, 50, 75, 90];
        
        let currentIndex = 1; // Start at MEDIUM
        
        const updateLevel = () => {
            const threatBar = document.getElementById('threatBar');
            const threatLevel = document.getElementById('threatLevel');
            
            if (threatBar && threatLevel) {
                threatLevel.textContent = levels[currentIndex];
                threatLevel.style.color = colors[currentIndex];
                threatBar.style.width = `${percentages[currentIndex]}%`;
                threatBar.style.background = `linear-gradient(90deg, ${colors[currentIndex]}, ${colors[Math.min(currentIndex + 1, colors.length - 1)]})`;
            }
        };
        
        updateLevel();
        
        // Simulate threat level changes
        setInterval(() => {
            const change = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
            currentIndex = Math.max(0, Math.min(levels.length - 1, currentIndex + change));
            updateLevel();
        }, 30000); // Change every 30 seconds
    }

    startRealTimeUpdates() {
        // Simulate real-time feed updates
        const feedContainer = document.getElementById('articlesContainer');
        
        // Start with loading animation
        this.showAdvancedLoading();
        
        // After 3 seconds, show the data
        setTimeout(() => {
            this.hideLoading();
        }, 3000);
    }

    showAdvancedLoading() {
        const container = document.getElementById('articlesContainer');
        if (container) {
            container.innerHTML = `
                <div class="terminal-loading">
                    <div class="loading-text">
                        <span class="cursor">></span> <span id="loadingMessage">Initializing secure connection...</span>
                    </div>
                    <div class="loading-progress">
                        <div class="progress-bar" id="loadingProgress"></div>
                    </div>
                    <div class="loading-details">
                        <div class="loading-step">✓ Connecting to threat intelligence sources</div>
                        <div class="loading-step">✓ Authenticating security protocols</div>
                        <div class="loading-step">⟳ Analyzing real-time threat landscape</div>
                        <div class="loading-step">⟳ Processing vulnerability databases</div>
                        <div class="loading-step">⟳ Finalizing threat assessment</div>
                    </div>
                </div>
            `;
        }
        
        // Animate loading messages
        const messages = [
            'Initializing secure connection...',
            'Connecting to threat intelligence feeds...',
            'Analyzing global threat landscape...',
            'Processing vulnerability databases...',
            'Correlating threat indicators...',
            'Finalizing threat assessment...'
        ];
        
        let messageIndex = 0;
        const messageElement = document.getElementById('loadingMessage');
        
        const updateMessage = () => {
            if (messageElement && messageIndex < messages.length) {
                messageElement.textContent = messages[messageIndex];
                messageIndex++;
                setTimeout(updateMessage, 500);
            }
        };
        
        updateMessage();
    }

    hideLoading() {
        // Remove loading and show content
        this.renderArticles();
    }

    loadSampleData() {
        console.log('Loading sample threat data...');
        this.articles = [...this.sampleThreats];
        this.filteredArticles = [...this.articles];
        
        this.updateSourceFilter();
        this.updateStatsWithSample();
        this.updateTimeline();
        this.initializeAdvancedTimeline();
    }

    updateStatsWithSample() {
        const severityCounts = {
            critical: this.articles.filter(a => a.severity === 'critical').length,
            high: this.articles.filter(a => a.severity === 'high').length,
            medium: this.articles.filter(a => a.severity === 'medium').length,
            low: this.articles.filter(a => a.severity === 'low').length
        };
        
        const today = new Date().toDateString();
        const todayArticles = this.articles.filter(article => {
            return article.published.toDateString() === today;
        });
        
        // Animate stat updates
        this.animateStatUpdate('criticalThreats', severityCounts.critical);
        this.animateStatUpdate('totalArticles', this.articles.length);
        this.animateStatUpdate('totalSources', [...new Set(this.articles.map(a => a.source))].length);
        this.animateStatUpdate('recentArticles', todayArticles.length);
    }

    animateStatUpdate(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let currentValue = 0;
        const increment = Math.ceil(targetValue / 20);
        const duration = 1000; // 1 second
        const stepTime = duration / (targetValue / increment);
        
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            element.textContent = currentValue;
        }, stepTime);
    }

    initializeAdvancedTimeline() {
        const timelineContainer = document.querySelector('.timeline-container');
        if (!timelineContainer) return;
        
        // Create a simple threat activity timeline
        const hours = Array.from({length: 24}, (_, i) => i);
        const threatData = hours.map(() => Math.floor(Math.random() * 15) + 1);
        
        const maxThreat = Math.max(...threatData);
        
        const timelineHTML = `
            <div class="timeline-chart">
                <div class="timeline-grid">
                    ${hours.map((hour, index) => `
                        <div class="timeline-bar" style="height: ${(threatData[index] / maxThreat) * 80}%; --bar-color: ${this.getThreatColor(threatData[index], maxThreat)}">
                            <div class="timeline-tooltip">
                                ${hour.toString().padStart(2, '0')}:00<br>
                                ${threatData[index]} threats
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="timeline-labels">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>24:00</span>
                </div>
            </div>
        `;
        
        timelineContainer.innerHTML = timelineHTML;
    }

    getThreatColor(value, max) {
        const ratio = value / max;
        if (ratio > 0.8) return 'var(--accent-critical)';
        if (ratio > 0.6) return 'var(--accent-danger)';
        if (ratio > 0.4) return 'var(--accent-warning)';
        return 'var(--accent-success)';
    }

    setTimelinePeriod(period) {
        // Update timeline buttons
        document.querySelectorAll('.timeline-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        event.target.classList.add('active');
        
        // Regenerate timeline data based on period
        this.initializeAdvancedTimeline();
    }

    async loadNews() {
        console.log('Attempting to load live data...');
        
        try {
            const response = await fetch(`${this.apiBase}/news`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Live data loaded, replacing sample data');
            
            this.articles = this.processArticles(data.articles || []);
            this.filteredArticles = [...this.articles];
            this.demoMode = false;
            
            this.updateSourceFilter();
            this.updateStats(data);
            this.renderArticles();
            
        } catch (error) {
            console.log('Live data unavailable, continuing with sample data');
            this.demoMode = true;
            
            // Show discrete indicator that we're in demo mode
            const feedStatus = document.querySelector('.feed-status');
            if (feedStatus) {
                feedStatus.innerHTML = `
                    <div class="feed-indicator" style="background: var(--accent-warning);"></div>
                    DEMO MODE
                `;
            }
        }
    }

    processArticles(articles) {
        return articles.map(article => {
            const text = (article.title + ' ' + article.summary).toLowerCase();
            let severity = 'low';
            
            if (text.includes('critical') || text.includes('zero-day') || text.includes('ransomware')) {
                severity = 'critical';
            } else if (text.includes('vulnerability') || text.includes('exploit') || text.includes('malware')) {
                severity = 'high';
            } else if (text.includes('patch') || text.includes('update') || text.includes('alert')) {
                severity = 'medium';
            }
            
            return {
                ...article,
                severity,
                threats: [],
                published: new Date(article.published || Date.now())
            };
        });
    }

    updateStats(data) {
        const severityCounts = {
            critical: this.articles.filter(a => a.severity === 'critical').length,
            high: this.articles.filter(a => a.severity === 'high').length,
            medium: this.articles.filter(a => a.severity === 'medium').length,
            low: this.articles.filter(a => a.severity === 'low').length
        };
        
        const today = new Date().toDateString();
        const todayArticles = this.articles.filter(article => {
            return article.published.toDateString() === today;
        });
        
        this.animateStatUpdate('criticalThreats', severityCounts.critical);
        this.animateStatUpdate('totalArticles', data.total_count || this.articles.length);
        this.animateStatUpdate('totalSources', data.sources?.length || [...new Set(this.articles.map(a => a.source))].length);
        this.animateStatUpdate('recentArticles', todayArticles.length);
    }

    renderArticles() {
        console.log('Rendering articles...');
        const container = document.getElementById('articlesContainer');
        if (!container) return;
        
        if (this.filteredArticles.length === 0) {
            container.innerHTML = `
                <div class="no-articles">
                    <div class="no-articles-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h3>No Active Threats</h3>
                    <p>No threats detected matching current filters.</p>
                    <small>Adjust filters or refresh feed to see more results.</small>
                </div>
            `;
            return;
        }

        const articlesHTML = this.filteredArticles.map((article, index) => `
            <article class="article-card severity-${article.severity} fade-in" 
                     style="animation-delay: ${index * 0.05}s">
                <div class="article-header">
                    <a href="${article.link}" target="_blank" rel="noopener noreferrer" 
                       class="article-title">
                        ${this.escapeHtml(article.title)}
                    </a>
                    <div class="article-meta">
                        <div class="article-badges">
                            <div class="source-badge">${this.escapeHtml(article.source)}</div>
                            ${article.cvss ? `<div class="cvss-badge">CVSS ${article.cvss}</div>` : ''}
                        </div>
                        <div class="article-time">${this.formatTime(article.published)}</div>
                    </div>
                </div>
                <div class="article-summary">
                    ${this.escapeHtml(this.truncateText(article.summary, 150))}
                </div>
                ${article.threats && article.threats.length > 0 ? `
                    <div class="threat-tags">
                        ${article.threats.map(threat => `<span class="threat-tag">${threat}</span>`).join('')}
                    </div>
                ` : ''}
            </article>
        `).join('');

        container.innerHTML = articlesHTML;
        console.log('Articles rendered:', this.filteredArticles.length);
    }

    updateSourceFilter() {
        const sourceFilter = document.getElementById('sourceFilter');
        if (!sourceFilter) return;
        
        const uniqueSources = [...new Set(this.articles.map(article => article.source))];
        
        sourceFilter.innerHTML = '<option value="">All Sources</option>';
        
        uniqueSources.forEach(source => {
            const option = document.createElement('option');
            option.value = source;
            option.textContent = source;
            sourceFilter.appendChild(option);
        });
    }

    updateTimeline() {
        console.log('Timeline updated');
    }

    filterArticles() {
        const searchTerm = document.getElementById('searchFilter')?.value.toLowerCase() || '';
        const selectedSource = document.getElementById('sourceFilter')?.value || '';
        const activeSeverities = Array.from(document.querySelectorAll('.severity-btn.active')).map(btn => btn.textContent.toLowerCase());
        
        this.filteredArticles = this.articles.filter(article => {
            const matchesSearch = !searchTerm || 
                article.title.toLowerCase().includes(searchTerm) ||
                article.summary.toLowerCase().includes(searchTerm);
            
            const matchesSource = !selectedSource || article.source === selectedSource;
            
            const matchesSeverity = activeSeverities.length === 0 || activeSeverities.includes(article.severity);
            
            return matchesSearch && matchesSource && matchesSeverity;
        });
        
        this.renderArticles();
    }

    toggleSeverityFilter(button) {
        button.classList.toggle('active');
        this.filterArticles();
    }

    toggleAutoRefresh() {
        this.autoRefresh = !this.autoRefresh;
        const btn = document.getElementById('autoRefreshBtn');
        
        if (this.autoRefresh) {
            btn?.classList.add('active');
            if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> Auto-Refresh';
            this.refreshInterval = setInterval(() => this.loadNews(), 300000);
            this.showAlert('Auto-refresh enabled - Updates every 5 minutes');
        } else {
            btn?.classList.remove('active');
            if (btn) btn.innerHTML = '<i class="fas fa-sync-alt"></i> Auto-Refresh';
            clearInterval(this.refreshInterval);
            this.showAlert('Auto-refresh disabled');
        }
    }

    toggleFabMenu() {
        const menu = document.getElementById('fabMenu');
        if (menu) {
            menu.classList.toggle('active');
        }
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'r':
                    e.preventDefault();
                    this.loadNews();
                    break;
                case 'f':
                    e.preventDefault();
                    document.getElementById('searchFilter')?.focus();
                    break;
            }
        }
    }

    showAlert(message, type = 'info') {
        console.log('Alert:', message);
        // Could implement toast notifications here
    }

    clearNotifications() {
        // Clear any notifications
    }

    // Utility methods
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, maxLength) {
        if (!text) return 'No description available';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    showError(message) {
        console.error('Dashboard error:', message);
    }
}

// Global functions for UI interactions
function exportData() {
    if (window.threatDashboard) {
        const data = {
            articles: window.threatDashboard.articles,
            timestamp: new Date().toISOString(),
            stats: {
                total: window.threatDashboard.articles.length,
                critical: window.threatDashboard.articles.filter(a => a.severity === 'critical').length,
                sources: [...new Set(window.threatDashboard.articles.map(a => a.source))]
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `threatstream-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

function showSettings() {
    alert('Settings panel coming soon...');
}

function showHelp() {
    alert('Keyboard shortcuts: Ctrl+R (Refresh), Ctrl+F (Search)');
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ThreatStream...');
    try {
        window.threatDashboard = new ThreatStreamDashboard();
        console.log('ThreatStream initialized successfully');
    } catch (error) {
        console.error('Failed to initialize ThreatStream:', error);
    }
});