// Doom Scroll Daily - Enhanced Professional SOC Dashboard

class DoomScrollDashboard {
    constructor() {
        this.apiBase = 'http://localhost:5001/api';
        this.articles = [];
        this.filteredArticles = [];
        this.sources = [];
        this.autoRefresh = false;
        this.refreshInterval = null;
        this.isLoading = false;
        
        // AI Summary caching (24 hour duration)
        this.summaryCache = new Map();
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        // Threat detection keywords for severity classification
        this.threatKeywords = {
            critical: ['zero-day', 'critical vulnerability', 'ransomware', 'data breach', 'nation-state', 'apt', 'supply chain'],
            high: ['vulnerability', 'malware', 'phishing', 'exploit', 'backdoor', 'trojan', 'botnet'],
            medium: ['patch', 'update', 'security advisory', 'warning', 'alert', 'suspicious'],
            low: ['announcement', 'release', 'feature', 'improvement', 'maintenance']
        };
        
        this.init();
    }

    init() {
        console.log('Doom Scroll Daily initializing...');
        try {
            this.initializeEventListeners();
            this.initializeMatrixBackground();
            this.startSystemClock();
            this.initializeThreatLevel();
            
            // Start loading real RSS data immediately
            this.loadRSSFeeds();
            
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
        
        // Update threat level based on actual article severity
        this.updateThreatLevelFromData();
    }

    updateThreatLevelFromData() {
        if (this.articles.length === 0) return;
        
        const severityCounts = {
            critical: this.articles.filter(a => a.severity === 'critical').length,
            high: this.articles.filter(a => a.severity === 'high').length,
            medium: this.articles.filter(a => a.severity === 'medium').length,
            low: this.articles.filter(a => a.severity === 'low').length
        };
        
        let currentIndex;
        if (severityCounts.critical > 2) currentIndex = 3; // CRITICAL
        else if (severityCounts.critical > 0 || severityCounts.high > 5) currentIndex = 2; // HIGH
        else if (severityCounts.high > 0 || severityCounts.medium > 3) currentIndex = 1; // MEDIUM
        else currentIndex = 0; // LOW
        
        const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const colors = ['#5cb85c', '#f0ad4e', '#d9534f', '#ff1744'];
        const percentages = [25, 50, 75, 90];
        
        const threatBar = document.getElementById('threatBar');
        const threatLevel = document.getElementById('threatLevel');
        
        if (threatBar && threatLevel) {
            threatLevel.textContent = levels[currentIndex];
            threatLevel.style.color = colors[currentIndex];
            threatBar.style.width = `${percentages[currentIndex]}%`;
            threatBar.style.background = `linear-gradient(90deg, ${colors[currentIndex]}, ${colors[Math.min(currentIndex + 1, colors.length - 1)]})`;
        }
    }

    showAdvancedLoading() {
        const container = document.getElementById('articlesContainer');
        if (container) {
            container.innerHTML = `
                <div class="terminal-loading">
                    <div class="loading-text">
                        <span class="cursor">></span> <span id="loadingMessage">Fetching live threat intelligence...</span>
                    </div>
                    <div class="loading-progress">
                        <div class="progress-bar" id="loadingProgress"></div>
                    </div>
                    <div class="loading-details">
                        <div class="loading-step" id="step1">⟳ Connecting to RSS feeds</div>
                        <div class="loading-step" id="step2">⟳ Parsing security news</div>
                        <div class="loading-step" id="step3">⟳ Analyzing threat data</div>
                        <div class="loading-step" id="step4">⟳ Building dashboard</div>
                    </div>
                </div>
            `;
        }
        
        // Animate loading steps
        const steps = ['step1', 'step2', 'step3', 'step4'];
        let currentStep = 0;
        
        const progressBar = document.getElementById('loadingProgress');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
        
        const updateProgress = () => {
            if (currentStep < steps.length) {
                const stepElement = document.getElementById(steps[currentStep]);
                if (stepElement) {
                    stepElement.innerHTML = stepElement.innerHTML.replace('⟳', '✓');
                    stepElement.style.color = '#5cb85c';
                }
                
                if (progressBar) {
                    progressBar.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
                }
                
                currentStep++;
                setTimeout(updateProgress, 800);
            }
        };
        
        updateProgress();
    }

    async loadRSSFeeds() {
        console.log('Loading real RSS feeds from backend...');
        this.isLoading = true;
        this.showAdvancedLoading();
        
        try {
            const response = await fetch(`${this.apiBase}/feeds`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                console.log(`✅ Loaded ${data.articles.length} articles from ${data.successful_feeds}/${data.total_feeds} feeds`);
                
                this.articles = this.processArticles(data.articles);
                this.filteredArticles = [...this.articles];
                this.sources = data.sources || [];
                
                this.updateSourceFilter();
                this.updateStats(data);
                this.updateTimeline();
                this.renderArticles();
                this.updateThreatLevelFromData();
                
                // Update feed status
                const feedStatus = document.querySelector('.feed-status');
                if (feedStatus) {
                    feedStatus.innerHTML = `
                        <span class="feed-indicator live"></span>
                        <span>LIVE (${data.successful_feeds}/${data.total_feeds} feeds)</span>
                    `;
                }
                
                // Setup auto-refresh if enabled
                this.setupAutoRefresh();
                
            } else {
                throw new Error(data.message || 'Failed to load feeds');
            }
            
        } catch (error) {
            console.error('❌ Failed to load RSS feeds:', error);
            this.showError('Failed to load live feeds: ' + error.message);
            
            // Show error in feed status
            const feedStatus = document.querySelector('.feed-status');
            if (feedStatus) {
                feedStatus.innerHTML = `
                    <span class="feed-indicator" style="background: var(--accent-danger);"></span>
                    <span>OFFLINE</span>
                `;
            }
        } finally {
            this.isLoading = false;
        }
    }

    processArticles(articles) {
        return articles.map(article => {
            const text = (article.title + ' ' + (article.summary || '')).toLowerCase();
            let severity = 'low';
            
            // Classify severity based on content
            if (this.threatKeywords.critical.some(keyword => text.includes(keyword))) {
                severity = 'critical';
            } else if (this.threatKeywords.high.some(keyword => text.includes(keyword))) {
                severity = 'high';
            } else if (this.threatKeywords.medium.some(keyword => text.includes(keyword))) {
                severity = 'medium';
            }
            
            return {
                ...article,
                severity: severity,
                published_date: new Date(article.published),
                published_ago: article.published_ago || this.getTimeAgo(new Date(article.published))
            };
        });
    }

    getTimeAgo(pubDate) {
        const now = new Date();
        const diff = now - pubDate;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    }

    updateSourceFilter() {
        const sourceFilter = document.getElementById('sourceFilter');
        if (sourceFilter && this.sources.length > 0) {
            sourceFilter.innerHTML = '<option value="">All Sources</option>' +
                this.sources.map(source => `<option value="${source}">${source}</option>`).join('');
        }
    }

    updateStats(data) {
        const severityCounts = {
            critical: this.articles.filter(a => a.severity === 'critical').length,
            high: this.articles.filter(a => a.severity === 'high').length,
            medium: this.articles.filter(a => a.severity === 'medium').length,
            low: this.articles.filter(a => a.severity === 'low').length
        };
        
        // Articles from last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentArticles = this.articles.filter(article => {
            return new Date(article.published) > oneDayAgo;
        });
        
        // Animate stat updates
        this.animateStatUpdate('criticalThreats', severityCounts.critical);
        this.animateStatUpdate('totalArticles', this.articles.length);
        this.animateStatUpdate('totalSources', data.successful_feeds || this.sources.length);
        this.animateStatUpdate('recentArticles', recentArticles.length);
    }

    animateStatUpdate(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let currentValue = 0;
        const increment = Math.max(1, Math.ceil(targetValue / 20));
        const stepTime = Math.max(20, 1000 / (targetValue / increment));
        
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            element.textContent = currentValue;
        }, stepTime);
    }

    updateTimeline() {
        const timelineContainer = document.querySelector('.timeline-container');
        if (!timelineContainer) return;
        
        // Group articles by hour for the last 24 hours
        const now = new Date();
        const hours = Array.from({length: 24}, (_, i) => {
            const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
            return hour;
        });
        
        const threatCounts = hours.map(hour => {
            const hourStart = new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours());
            const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
            
            return this.articles.filter(article => {
                const articleDate = new Date(article.published);
                return articleDate >= hourStart && articleDate < hourEnd;
            }).length;
        });
        
        const maxThreat = Math.max(...threatCounts, 1);
        
        const timelineHTML = `
            <div class="timeline-chart">
                <div class="timeline-grid">
                    ${hours.map((hour, index) => `
                        <div class="timeline-bar" style="height: ${(threatCounts[index] / maxThreat) * 80}%; --bar-color: ${this.getThreatColor(threatCounts[index], maxThreat)}">
                            <div class="timeline-tooltip">
                                ${hour.getHours().toString().padStart(2, '0')}:00<br>
                                ${threatCounts[index]} articles
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="timeline-labels">
                    <span>24h ago</span>
                    <span>18h ago</span>
                    <span>12h ago</span>
                    <span>6h ago</span>
                    <span>Now</span>
                </div>
            </div>
        `;
        
        timelineContainer.innerHTML = timelineHTML;
    }

    getThreatColor(value, max) {
        if (max === 0) return 'var(--accent-success)';
        const ratio = value / max;
        if (ratio > 0.8) return 'var(--accent-critical)';
        if (ratio > 0.6) return 'var(--accent-danger)';
        if (ratio > 0.4) return 'var(--accent-warning)';
        return 'var(--accent-success)';
    }

    renderArticles() {
        const container = document.getElementById('articlesContainer');
        if (!container) return;
        
        if (this.filteredArticles.length === 0) {
            container.innerHTML = `
                <div class="no-articles">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>No articles found</h3>
                    <p>Try adjusting your filters or refresh the feed</p>
                </div>
            `;
            return;
        }
        
        const articlesHTML = this.filteredArticles.map(article => {
            const severityIcon = this.getSeverityIcon(article.severity);
            const severityColor = this.getSeverityColor(article.severity);
            
            return `
                <div class="article-card ${article.severity}" data-source="${article.source}" data-severity="${article.severity}">
                    <div class="article-header">
                        <div class="article-meta">
                            <span class="source-badge">${article.source}</span>
                            <span class="severity-badge ${article.severity}">
                                ${severityIcon} ${article.severity.toUpperCase()}
                            </span>
                            <span class="time-badge">${article.published_ago}</span>
                        </div>
                    </div>
                    <div class="article-content">
                        <h3 class="article-title">
                            <a href="${article.link}" target="_blank" rel="noopener">${article.title}</a>
                        </h3>
                        ${article.summary ? `<p class="article-summary">${article.summary}</p>` : ''}
                    </div>
                    <div class="article-actions">
                        <button class="action-btn ai-summary-btn" onclick="window.threatDashboard.generateAISummary('${article.id}')">
                            <i class="fas fa-robot"></i> AI Summary
                        </button>
                        <button class="action-btn" onclick="window.threatDashboard.showThreatDetail('${article.id}')">
                            <i class="fas fa-search"></i> Analyze
                        </button>
                        <button class="action-btn" onclick="window.open('${article.link}', '_blank')">
                            <i class="fas fa-external-link-alt"></i> Read More
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = articlesHTML;
    }

    getSeverityIcon(severity) {
        switch (severity) {
            case 'critical': return '<i class="fas fa-skull-crossbones"></i>';
            case 'high': return '<i class="fas fa-exclamation-triangle"></i>';
            case 'medium': return '<i class="fas fa-exclamation-circle"></i>';
            case 'low': return '<i class="fas fa-info-circle"></i>';
            default: return '<i class="fas fa-info"></i>';
        }
    }

    getSeverityColor(severity) {
        switch (severity) {
            case 'critical': return 'var(--accent-critical)';
            case 'high': return 'var(--accent-danger)';
            case 'medium': return 'var(--accent-warning)';
            case 'low': return 'var(--accent-success)';
            default: return 'var(--text-secondary)';
        }
    }

    filterArticles() {
        const searchTerm = document.getElementById('searchFilter')?.value.toLowerCase() || '';
        const sourceFilter = document.getElementById('sourceFilter')?.value || '';
        
        // Get active severity filters
        const activeSeverityFilters = Array.from(document.querySelectorAll('.severity-btn.active'))
            .map(btn => btn.dataset.severity);
        
        this.filteredArticles = this.articles.filter(article => {
            const matchesSearch = !searchTerm || 
                article.title.toLowerCase().includes(searchTerm) ||
                (article.summary && article.summary.toLowerCase().includes(searchTerm));
            
            const matchesSource = !sourceFilter || article.source === sourceFilter;
            
            const matchesSeverity = activeSeverityFilters.length === 0 || 
                activeSeverityFilters.includes(article.severity);
            
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
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-sync-alt spinning"></i> Auto-Refresh ON';
            this.setupAutoRefresh();
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> Auto-Refresh';
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
            }
        }
    }

    setupAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        if (this.autoRefresh) {
            this.refreshInterval = setInterval(() => {
                console.log('🔄 Auto-refreshing feeds...');
                this.loadRSSFeeds();
            }, 30 * 60 * 1000); // Refresh every 30 minutes
        }
    }

    showThreatDetail(articleId) {
        const article = this.articles.find(a => a.id === articleId);
        if (!article) return;
        
        const modal = document.getElementById('threatModal');
        const modalContent = document.getElementById('modalContent');
        
        if (modal && modalContent) {
            modalContent.innerHTML = `
                <div class="threat-detail">
                    <div class="threat-header">
                        <h4>${article.title}</h4>
                        <div class="threat-badges">
                            <span class="severity-badge ${article.severity}">${article.severity.toUpperCase()}</span>
                            <span class="source-badge">${article.source}</span>
                        </div>
                    </div>
                    <div class="threat-content">
                        <p><strong>Published:</strong> ${new Date(article.published).toLocaleString()}</p>
                        ${article.summary ? `<p><strong>Summary:</strong> ${article.summary}</p>` : ''}
                        <p><strong>Source Link:</strong> <a href="${article.link}" target="_blank">${article.link}</a></p>
                    </div>
                </div>
            `;
            modal.style.display = 'block';
        }
    }

    showError(message) {
        const container = document.getElementById('articlesContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Feeds</h3>
                    <p>${message}</p>
                    <button onclick="window.threatDashboard.loadRSSFeeds()" class="retry-btn">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    // Additional utility methods
    setTimelinePeriod(period) {
        document.querySelectorAll('.timeline-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        this.updateTimeline();
    }

    toggleFabMenu() {
        const fabMenu = document.getElementById('fabMenu');
        if (fabMenu) {
            fabMenu.classList.toggle('open');
        }
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            this.loadRSSFeeds();
        }
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchFilter')?.focus();
        }
    }

    // AI Summary functionality
    async generateAISummary(articleId) {
        console.log(`Generating AI summary for article: ${articleId}`);
        
        // Find the article
        const article = this.articles.find(a => a.id === articleId);
        if (!article) {
            this.showError('Article not found');
            return;
        }
        
        // Check cache first
        const cacheKey = `summary_${articleId}`;
        const cached = this.summaryCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            console.log(`Using cached summary for ${articleId}`);
            this.showAISummaryModal(article, cached.summary, true);
            return;
        }
        
        // Show loading state
        this.showAISummaryModal(article, null, false, true);
        
        try {
            const response = await fetch(`${this.apiBase}/summarize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: article.id,
                    title: article.title,
                    summary: article.summary,
                    source: article.source,
                    severity: article.severity,
                    link: article.link,
                    published: article.published
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.summary) {
                // Cache the summary
                this.summaryCache.set(cacheKey, {
                    summary: data.summary,
                    timestamp: Date.now()
                });
                
                // Show the summary
                this.showAISummaryModal(article, data.summary, data.cached || false);
                
                console.log(`✅ Generated AI summary for ${articleId}`);
            } else {
                throw new Error('No summary received from API');
            }
            
        } catch (error) {
            console.error('❌ Failed to generate AI summary:', error);
            this.showAISummaryModal(article, null, false, false, error.message);
        }
    }
    
    showAISummaryModal(article, summary, isCached = false, isLoading = false, error = null) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('aiSummaryModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'aiSummaryModal';
            modal.className = 'threat-modal';
            document.body.appendChild(modal);
        }
        
        let content = '';
        
        if (isLoading) {
            content = `
                <div class="modal-content ai-summary-modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-robot"></i> AI Threat Analysis</h3>
                        <button class="close-btn" onclick="closeAISummaryModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="article-info">
                            <h4>${article.title}</h4>
                            <div class="article-meta">
                                <span class="source">${article.source}</span>
                                <span class="severity ${article.severity}">${article.severity.toUpperCase()}</span>
                                <span class="time">${article.published_ago}</span>
                            </div>
                        </div>
                        <div class="ai-loading">
                            <div class="loading-spinner"></div>
                            <p>🤖 Analyzing threat intelligence with Claude AI...</p>
                            <p class="loading-subtext">This may take a few moments</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (error) {
            content = `
                <div class="modal-content ai-summary-modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-robot"></i> AI Analysis Error</h3>
                        <button class="close-btn" onclick="closeAISummaryModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="article-info">
                            <h4>${article.title}</h4>
                            <div class="article-meta">
                                <span class="source">${article.source}</span>
                                <span class="severity ${article.severity}">${article.severity.toUpperCase()}</span>
                                <span class="time">${article.published_ago}</span>
                            </div>
                        </div>
                        <div class="error-message">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h4>Unable to Generate AI Summary</h4>
                            <p>${error}</p>
                            <p class="error-note">Make sure your Claude API key is configured in the backend.</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (summary) {
            content = `
                <div class="modal-content ai-summary-modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-robot"></i> AI Threat Analysis ${isCached ? '<span class="cache-badge">cached</span>' : '<span class="fresh-badge">fresh</span>'}</h3>
                        <button class="close-btn" onclick="closeAISummaryModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="article-info">
                            <h4>${article.title}</h4>
                            <div class="article-meta">
                                <span class="source">${article.source}</span>
                                <span class="severity ${article.severity}">${article.severity.toUpperCase()}</span>
                                <span class="time">${article.published_ago}</span>
                            </div>
                            <a href="${article.link}" target="_blank" class="original-link">
                                <i class="fas fa-external-link-alt"></i> View Original Article
                            </a>
                        </div>
                        <div class="ai-summary-content">
                            ${summary}
                        </div>
                        <div class="modal-footer">
                            <small class="ai-disclaimer">
                                <i class="fas fa-info-circle"></i>
                                AI-generated analysis powered by Claude. Please verify critical information independently.
                            </small>
                        </div>
                    </div>
                </div>
            `;
        }
        
        modal.innerHTML = content;
        modal.style.display = 'flex';
        
        // Add click-outside-to-close functionality
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeAISummaryModal();
            }
        };
    }
    
    closeAISummaryModal() {
        const modal = document.getElementById('aiSummaryModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    clearNotifications() {
        // Clear any notification badges or alerts
    }

    openDailyBrief() {
        // Implement daily brief functionality
        alert('Daily Brief feature coming soon...');
    }
}

// Global functions for HTML onclick handlers
function closeThreatModal() {
    const modal = document.getElementById('threatModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeAISummaryModal() {
    const modal = document.getElementById('aiSummaryModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeAlert() {
    const alertBanner = document.getElementById('alertBanner');
    if (alertBanner) {
        alertBanner.style.display = 'none';
    }
}

function exportData() {
    alert('Export feature coming soon...');
}

function showSettings() {
    alert('Settings panel coming soon...');
}

function showHelp() {
    alert('Keyboard shortcuts: Ctrl+R (Refresh), Ctrl+F (Search)');
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Doom Scroll Daily...');
    try {
        window.threatDashboard = new DoomScrollDashboard();
        console.log('Doom Scroll Daily initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Doom Scroll Daily:', error);
    }
});
