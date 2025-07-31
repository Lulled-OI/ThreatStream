// Security News Aggregator Frontend JavaScript

class SecurityNewsAggregator {
    constructor() {
        this.apiBase = 'http://localhost:5000/api';
        this.articles = [];
        this.filteredArticles = [];
        this.sources = [];
        
        this.initializeEventListeners();
        this.loadNews();
    }

    initializeEventListeners() {
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadNews();
        });

        // Search filter
        document.getElementById('searchFilter').addEventListener('input', (e) => {
            this.filterArticles();
        });

        // Source filter
        document.getElementById('sourceFilter').addEventListener('change', (e) => {
            this.filterArticles();
        });
    }

    async loadNews() {
        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.apiBase}/news`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.articles = data.articles || [];
            this.filteredArticles = [...this.articles];
            
            this.updateSourceFilter();
            this.updateStats(data);
            this.renderArticles();
            this.updateLastUpdated(data.last_updated);
            
        } catch (error) {
            console.error('Error loading news:', error);
            this.showError('Failed to load security news. Please check if the backend server is running.');
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const loadingEl = document.getElementById('loading');
        const statsEl = document.getElementById('stats');
        const articlesEl = document.getElementById('articlesContainer');
        
        if (show) {
            loadingEl.style.display = 'block';
            statsEl.style.display = 'none';
            articlesEl.innerHTML = '';
        } else {
            loadingEl.style.display = 'none';
            statsEl.style.display = 'grid';
        }
    }

    showError(message) {
        const container = document.getElementById('articlesContainer');
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                ${message}
            </div>
        `;
    }

    updateSourceFilter() {
        const sourceFilter = document.getElementById('sourceFilter');
        const uniqueSources = [...new Set(this.articles.map(article => article.source))];
        
        // Clear existing options (except "All Sources")
        sourceFilter.innerHTML = '<option value="">All Sources</option>';
        
        // Add source options
        uniqueSources.forEach(source => {
            const option = document.createElement('option');
            option.value = source;
            option.textContent = source;
            sourceFilter.appendChild(option);
        });
    }

    filterArticles() {
        const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
        const selectedSource = document.getElementById('sourceFilter').value;
        
        this.filteredArticles = this.articles.filter(article => {
            const matchesSearch = !searchTerm || 
                article.title.toLowerCase().includes(searchTerm) ||
                article.summary.toLowerCase().includes(searchTerm);
            
            const matchesSource = !selectedSource || article.source === selectedSource;
            
            return matchesSearch && matchesSource;
        });
        
        this.renderArticles();
    }

    updateStats(data) {
        const today = new Date().toDateString();
        const todayArticles = this.articles.filter(article => {
            if (!article.published) return false;
            const articleDate = new Date(article.published);
            return articleDate.toDateString() === today;
        });

        document.getElementById('totalArticles').textContent = data.total_count || 0;
        document.getElementById('totalSources').textContent = data.sources?.length || 0;
        document.getElementById('recentArticles').textContent = todayArticles.length;
    }

    renderArticles() {
        const container = document.getElementById('articlesContainer');
        
        if (this.filteredArticles.length === 0) {
            container.innerHTML = `
                <div class="no-articles">
                    <i class="fas fa-search"></i>
                    <p>No articles found matching your criteria.</p>
                </div>
            `;
            return;
        }

        const articlesHTML = this.filteredArticles.map(article => `
            <article class="article-card fade-in">
                <div class="article-header">
                    <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="article-title">
                        ${this.escapeHtml(article.title)}
                    </a>
                    <div class="article-meta">
                        <span class="source-badge">${this.escapeHtml(article.source)}</span>
                        <span><i class="fas fa-calendar-alt"></i> ${article.published_readable || 'Unknown date'}</span>
                    </div>
                </div>
                <div class="article-summary">
                    ${this.escapeHtml(this.truncateText(article.summary, 200))}
                </div>
            </article>
        `).join('');

        container.innerHTML = articlesHTML;
    }

    updateLastUpdated(timestamp) {
        const lastUpdatedEl = document.getElementById('lastUpdated');
        if (timestamp) {
            const date = new Date(timestamp);
            lastUpdatedEl.innerHTML = `
                <i class="fas fa-clock"></i> 
                Last updated: ${date.toLocaleString()}
            `;
        }
    }

    // Utility functions
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

    // Risk-related keyword highlighting (future enhancement)
    highlightRiskKeywords(text) {
        const riskKeywords = [
            'breach', 'vulnerability', 'exploit', 'malware', 'ransomware',
            'phishing', 'attack', 'threat', 'compromise', 'leak'
        ];
        
        let highlightedText = text;
        riskKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            highlightedText = highlightedText.replace(regex, `<mark>$&</mark>`);
        });
        
        return highlightedText;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SecurityNewsAggregator();
});

// Auto-refresh every 30 minutes
setInterval(() => {
    console.log('Auto-refreshing news...');
    if (window.newsAggregator) {
        window.newsAggregator.loadNews();
    }
}, 30 * 60 * 1000);