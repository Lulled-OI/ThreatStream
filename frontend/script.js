// ThreatStream - Fixed SOC Dashboard JavaScript

class ThreatStreamDashboard {
    constructor() {
        this.apiBase = 'http://localhost:5000/api';
        this.articles = [];
        this.filteredArticles = [];
        this.sources = [];
        this.autoRefresh = false;
        this.refreshInterval = null;
        this.isLoading = false;
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
            this.showLoadingSequence();
            // Load news after loading sequence starts
            setTimeout(() => this.loadNews(), 1000);
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
                this.setTimelinePeriod(e.target.dataset.period);
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
        try {
            const canvas = document.getElementById('matrixCanvas');
            if (!canvas) {
                console.log('Matrix canvas not found');
                return;
            }
            
            const ctx = canvas.getContext('2d');
            
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const matrix = "01";
            const matrixArray = matrix.split("");
            const fontSize = 10;
            const columns = canvas.width / fontSize;
            const drops = [];
            
            for (let x = 0; x < columns; x++) {
                drops[x] = 1;
            }
            
            const drawMatrix = () => {
                ctx.fillStyle = 'rgba(10, 10, 15, 0.04)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = '#4facfe';
                ctx.font = fontSize + 'px JetBrains Mono';
                
                for (let i = 0; i < drops.length; i++) {
                    const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                    
                    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                    drops[i]++;
                }
            };
            
            setInterval(drawMatrix, 35);
            
            // Resize handler
            window.addEventListener('resize', () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            });
            
            console.log('Matrix background initialized');
        } catch (error) {
            console.error('Matrix background error:', error);
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

    showLoadingSequence() {
        console.log('Starting loading sequence...');
        const loadingSteps = [
            'Initializing threat intelligence feeds...',
            'Connecting to security sources...',
            'Analyzing threat landscape...',
            'Processing vulnerability data...',
            'Finalizing dashboard...'
        ];
        
        let currentStep = 0;
        const loadingElement = document.getElementById('loading');
        const loadingText = document.querySelector('.loading-text');
        const progressBar = document.getElementById('loadingProgress');
        
        if (!loadingText || !progressBar) {
            console.error('Loading elements not found');
            return;
        }
        
        const showNextStep = () => {
            if (currentStep < loadingSteps.length && this.isLoading) {
                loadingText.innerHTML = `<span class="cursor">></span> ${loadingSteps[currentStep]}`;
                progressBar.style.width = `${((currentStep + 1) / loadingSteps.length) * 100}%`;
                currentStep++;
                setTimeout(showNextStep, 800);
            } else if (!this.isLoading) {
                // Data has loaded, hide loading screen
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
                console.log('Loading sequence completed');
            }
        };
        
        this.isLoading = true;
        showNextStep();
    }

    async loadNews() {
        console.log('Loading news from:', `${this.apiBase}/news`);
        
        try {
            // Test basic connectivity first
            const testResponse = await fetch(`${this.apiBase}/test`);
            console.log('Test response status:', testResponse.status);
            
            if (!testResponse.ok) {
                throw new Error(`Backend not responding (status: ${testResponse.status})`);
            }
            
            // Now fetch the actual news
            const response = await fetch(`${this.apiBase}/news`);
            console.log('News response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received data:', data);
            
            this.articles = this.processArticles(data.articles || []);
            this.filteredArticles = [...this.articles];
            
            this.updateSourceFilter();
            this.updateStats(data);
            this.renderArticles();
            this.updateThreatLevel();
            this.updateTimeline();
            
            console.log('News loaded successfully:', this.articles.length, 'articles');
            
            // Stop loading sequence
            this.isLoading = false;
            
            // Hide loading screen
            const loadingElement = document.getElementById('loading');
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Error loading news:', error);
            this.isLoading = false;
            
            // Hide loading screen and show error
            const loadingElement = document.getElementById('loading');
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            
            this.showConnectionError(error.message);
        }
    }

    showConnectionError(message) {
        const container = document.getElementById('articlesContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Connection Error</h3>
                    <p><strong>Cannot connect to ThreatStream API</strong></p>
                    <p>Error: ${message}</p>
                    <div style="margin: 20px 0;">
                        <p><strong>Troubleshooting Steps:</strong></p>
                        <ul>
                            <li>Make sure backend server is running: <code>python app.py</code></li>
                            <li>Check if <a href="http://localhost:5000/api/test" target="_blank">http://localhost:5000/api/test</a> works</li>
                            <li>Verify no firewall is blocking localhost:5000</li>
                            <li>Check browser console for detailed errors</li>
                        </ul>
                    </div>
                    <button onclick="window.threatDashboard.loadNews()" class="action-btn primary">
                        <i class="fas fa-sync-alt"></i> Retry Connection
                    </button>
                </div>
            `;
        }
        
        this.showAlert('Failed to load threat intelligence: ' + message, 'error');
    }

    processArticles(articles) {
        return articles.map(article => {
            // Simple severity analysis
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
                timestamp: new Date(article.published || Date.now())
            };
        });
    }

    updateStats(data) {
        console.log('Updating stats...');
        const severityCounts = {
            critical: this.articles.filter(a => a.severity === 'critical').length,
            high: this.articles.filter(a => a.severity === 'high').length,
            medium: this.articles.filter(a => a.severity === 'medium').length,
            low: this.articles.filter(a => a.severity === 'low').length
        };
        
        const today = new Date().toDateString();
        const todayArticles = this.articles.filter(article => {
            return article.timestamp.toDateString() === today;
        });
        
        // Update stat cards
        this.updateStatCard('criticalThreats', severityCounts.critical);
        this.updateStatCard('totalArticles', data.total_count || 0);
        this.updateStatCard('totalSources', data.sources?.length || 0);
        this.updateStatCard('recentArticles', todayArticles.length);
    }

    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    updateThreatLevel() {
        const criticalCount = this.articles.filter(a => a.severity === 'critical').length;
        const highCount = this.articles.filter(a => a.severity === 'high').length;
        
        let level, percentage, color;
        
        if (criticalCount > 5) {
            level = 'CRITICAL';
            percentage = 90;
            color = '#ff6b6b';
        } else if (criticalCount > 2 || highCount > 10) {
            level = 'HIGH';
            percentage = 75;
            color = '#ff9f43';
        } else if (highCount > 5) {
            level = 'MEDIUM';
            percentage = 60;
            color = '#feca57';
        } else {
            level = 'LOW';
            percentage = 30;
            color = '#48ca8b';
        }
        
        const threatBar = document.getElementById('threatBar');
        const threatLevel = document.getElementById('threatLevel');
        
        if (threatBar) {
            threatBar.style.width = `${percentage}%`;
            threatBar.style.background = color;
        }
        
        if (threatLevel) {
            threatLevel.textContent = level;
            threatLevel.style.color = color;
        }
    }

    renderArticles() {
        console.log('Rendering articles...');
        const container = document.getElementById('articlesContainer');
        if (!container) {
            console.error('Articles container not found');
            return;
        }
        
        if (this.filteredArticles.length === 0) {
            container.innerHTML = `
                <div class="no-articles text-center">
                    <i class="fas fa-shield-alt"></i>
                    <p>No threats detected matching current filters.</p>
                    <small>Adjust filters or refresh feed to see more results.</small>
                </div>
            `;
            return;
        }

        const articlesHTML = this.filteredArticles.map((article, index) => `
            <article class="article-card severity-${article.severity} fade-in" 
                     style="animation-delay: ${index * 0.1}s">
                <div class="article-header">
                    <a href="${article.link}" target="_blank" rel="noopener noreferrer" 
                       class="article-title">
                        ${this.escapeHtml(article.title)}
                    </a>
                    <div class="article-meta">
                        <div class="source-badge">${this.escapeHtml(article.source)}</div>
                        <div class="article-time">${this.formatTime(article.timestamp)}</div>
                    </div>
                </div>
                <div class="article-summary">
                    ${this.escapeHtml(this.truncateText(article.summary, 150))}
                </div>
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
        // Simple timeline implementation
        console.log('Timeline updated');
    }

    filterArticles() {
        const searchTerm = document.getElementById('searchFilter')?.value.toLowerCase() || '';
        const selectedSource = document.getElementById('sourceFilter')?.value || '';
        
        this.filteredArticles = this.articles.filter(article => {
            const matchesSearch = !searchTerm || 
                article.title.toLowerCase().includes(searchTerm) ||
                article.summary.toLowerCase().includes(searchTerm);
            
            const matchesSource = !selectedSource || article.source === selectedSource;
            
            return matchesSearch && matchesSource;
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
            this.refreshInterval = setInterval(() => this.loadNews(), 300000); // 5 minutes
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
                case 'Escape':
                    // Close any modals
                    break;
            }
        }
    }

    showAlert(message, type = 'info') {
        console.log('Alert:', message);
        const banner = document.getElementById('alertBanner');
        const text = document.getElementById('alertText');
        
        if (banner && text) {
            text.textContent = message;
            banner.className = `alert-banner alert-${type}`;
            banner.style.display = 'flex';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.closeAlert();
            }, 5000);
        }
    }

    closeAlert() {
        const banner = document.getElementById('alertBanner');
        if (banner) {
            banner.style.display = 'none';
        }
    }

    clearNotifications() {
        this.closeAlert();
    }

    // Utility methods
    escapeHtml(text) {
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
        this.showAlert(message, 'error');
    }
}

// Global functions for UI interactions
function closeThreatModal() {
    const modal = document.getElementById('threatModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function closeAlert() {
    if (window.threatDashboard) {
        window.threatDashboard.closeAlert();
    }
}

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
        
        window.threatDashboard.showAlert('Threat data exported successfully');
    }
}

function showSettings() {
    if (window.threatDashboard) {
        window.threatDashboard.showAlert('Settings panel coming soon...');
    }
}

function showHelp() {
    if (window.threatDashboard) {
        window.threatDashboard.showAlert('Keyboard shortcuts: Ctrl+R (Refresh), Ctrl+F (Search), Esc (Close)');
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ThreatStream...');
    try {
        window.threatDashboard = new ThreatStreamDashboard();
        console.log('ThreatStream initialized successfully');
    } catch (error) {
        console.error('Failed to initialize ThreatStream:', error);
        
        // Show basic error message
        const container = document.getElementById('articlesContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>Initialization Failed</h3>
                    <p>ThreatStream failed to start: ${error.message}</p>
                    <p>Check browser console for details.</p>
                </div>
            `;
        }
    }
});

// Handle page visibility for better performance
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.threatDashboard) {
        window.threatDashboard.clearNotifications();
    }
});