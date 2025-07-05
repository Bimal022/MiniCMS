class MiniCMS {
            constructor() {
                this.pages = JSON.parse(localStorage.getItem('miniCMSPages')) || [];
                this.currentPageId = null;
                this.components = [];
                this.init();
            }

            init() {
                this.bindEvents();
                this.loadPages();
            }

            bindEvents() {
                // Login
                document.getElementById('loginForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.login();
                });

                // Logout
                document.getElementById('logoutBtn').addEventListener('click', () => {
                    this.logout();
                });

                // New Page
                document.getElementById('newPageBtn').addEventListener('click', () => {
                    this.newPage();
                });

                // Save Page
                document.getElementById('editorForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.savePage();
                });

                // Preview
                document.getElementById('previewBtn').addEventListener('click', () => {
                    this.previewPage();
                });

                // Add Component
                document.getElementById('addComponentBtn').addEventListener('click', () => {
                    this.addComponent();
                });

                // Modal
                document.getElementById('closeModal').addEventListener('click', () => {
                    this.closeModal();
                });

                // Close modal on outside click
                document.getElementById('previewModal').addEventListener('click', (e) => {
                    if (e.target.id === 'previewModal') {
                        this.closeModal();
                    }
                });
            }

            login() {
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;

                // Simple validation (no real authentication)
                if (username && password) {
                    document.getElementById('loginScreen').style.display = 'none';
                    document.getElementById('dashboard').style.display = 'block';
                    this.showNotification('Login successful!', 'success');
                } else {
                    this.showNotification('Please enter both username and password', 'error');
                }
            }

            logout() {
                document.getElementById('loginScreen').style.display = 'flex';
                document.getElementById('dashboard').style.display = 'none';
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
                this.showNotification('Logged out successfully', 'info');
            }

            loadPages() {
                const pageList = document.getElementById('pageList');
                pageList.innerHTML = '';

                this.pages.forEach((page, index) => {
                    const li = document.createElement('li');
                    li.className = 'page-item';
                    li.innerHTML = `
                        <span onclick="cms.editPage(${index})">${page.title}</span>
                        <button class="delete-page-btn" onclick="cms.deletePage(${index})">Delete</button>
                    `;
                    pageList.appendChild(li);
                });
            }

            newPage() {
                this.currentPageId = null;
                this.components = [];
                document.getElementById('editorTitle').textContent = 'Create New Page';
                document.getElementById('pageTitle').value = '';
                document.getElementById('pageImage').value = '';
                document.getElementById('pageContent').value = '';
                this.updateComponentList();
                this.clearActivePages();
            }

            editPage(index) {
                const page = this.pages[index];
                this.currentPageId = index;
                this.components = page.components || [];
                
                document.getElementById('editorTitle').textContent = `Edit: ${page.title}`;
                document.getElementById('pageTitle').value = page.title;
                document.getElementById('pageImage').value = page.image || '';
                document.getElementById('pageContent').value = page.content || '';
                this.updateComponentList();
                
                // Highlight active page
                this.clearActivePages();
                document.querySelectorAll('.page-item')[index].classList.add('active');
            }

            clearActivePages() {
                document.querySelectorAll('.page-item').forEach(item => {
                    item.classList.remove('active');
                });
            }

            savePage() {
                const title = document.getElementById('pageTitle').value;
                const image = document.getElementById('pageImage').value;
                const content = document.getElementById('pageContent').value;

                if (!title) {
                    this.showNotification('Please enter a page title', 'error');
                    return;
                }

                const pageData = {
                    title,
                    image,
                    content,
                    components: this.components,
                    createdAt: new Date().toISOString()
                };

                if (this.currentPageId !== null) {
                    // Update existing page
                    this.pages[this.currentPageId] = pageData;
                    this.showNotification('Page updated successfully!', 'success');
                } else {
                    // Create new page
                    this.pages.push(pageData);
                    this.showNotification('Page created successfully!', 'success');
                }

                this.saveToStorage();
                this.loadPages();
            }

            deletePage(index) {
                if (confirm('Are you sure you want to delete this page?')) {
                    this.pages.splice(index, 1);
                    this.saveToStorage();
                    this.loadPages();
                    this.newPage(); // Reset editor
                    this.showNotification('Page deleted successfully', 'info');
                }
            }

            addComponent() {
                const componentType = document.getElementById('componentType').value;
                if (!componentType) {
                    this.showNotification('Please select a component type', 'error');
                    return;
                }

                const component = {
                    type: componentType,
                    id: Date.now(),
                    content: this.getDefaultComponentContent(componentType)
                };

                this.components.push(component);
                this.updateComponentList();
                document.getElementById('componentType').value = '';
            }

            getDefaultComponentContent(type) {
                const defaults = {
                    header: { title: 'Header Title', subtitle: 'Header Subtitle' },
                    hero: { title: 'Hero Title', description: 'Hero Description', image: '' },
                    text: { content: 'Your text content here...' },
                    image: { url: '', alt: 'Image description', caption: '' }
                };
                return defaults[type] || {};
            }

            updateComponentList() {
                const componentList = document.getElementById('componentList');
                componentList.innerHTML = '';

                this.components.forEach((component, index) => {
                    const div = document.createElement('div');
                    div.className = 'component-item';
                    div.draggable = true;
                    div.innerHTML = `
                        <span>🧩 ${component.type.charAt(0).toUpperCase() + component.type.slice(1)} Component</span>
                        <button class="remove-component-btn" onclick="cms.removeComponent(${index})">Remove</button>
                    `;
                    
                    // Add drag and drop functionality
                    div.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', index);
                        div.classList.add('dragging');
                    });
                    
                    div.addEventListener('dragend', () => {
                        div.classList.remove('dragging');
                    });
                    
                    div.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        div.classList.add('drag-over');
                    });
                    
                    div.addEventListener('dragleave', () => {
                        div.classList.remove('drag-over');
                    });
                    
                    div.addEventListener('drop', (e) => {
                        e.preventDefault();
                        div.classList.remove('drag-over');
                        const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                        this.reorderComponents(draggedIndex, index);
                    });
                    
                    componentList.appendChild(div);
                });
            }

            reorderComponents(fromIndex, toIndex) {
                const component = this.components.splice(fromIndex, 1)[0];
                this.components.splice(toIndex, 0, component);
                this.updateComponentList();
            }

            removeComponent(index) {
                this.components.splice(index, 1);
                this.updateComponentList();
            }

            previewPage() {
                const title = document.getElementById('pageTitle').value;
                const image = document.getElementById('pageImage').value;
                const content = document.getElementById('pageContent').value;

                if (!title) {
                    this.showNotification('Please enter a page title to preview', 'error');
                    return;
                }

                const previewHTML = this.generatePreviewHTML(title, image, content, this.components);
                document.getElementById('previewContent').innerHTML = previewHTML;
                document.getElementById('previewModal').style.display = 'block';
            }

            generatePreviewHTML(title, image, content, components) {
                let html = `<div class="preview-page">`;

                // Generate components
                components.forEach(component => {
                    switch(component.type) {
                        case 'header':
                            html += `
                                <div class="preview-header">
                                    <h1>${component.content.title}</h1>
                                    <p>${component.content.subtitle}</p>
                                </div>
                            `;
                            break;
                        case 'hero':
                            html += `
                                <div class="preview-hero">
                                    ${component.content.image ? `<img src="${component.content.image}" alt="${component.content.title}">` : ''}
                                    <h2>${component.content.title}</h2>
                                    <p>${component.content.description}</p>
                                </div>
                            `;
                            break;
                        case 'text':
                            html += `
                                <div class="preview-text">
                                    <p>${component.content.content}</p>
                                </div>
                            `;
                            break;
                        case 'image':
                            html += `
                                <div class="preview-text" style="text-align: center;">
                                    ${component.content.url ? `<img src="${component.content.url}" alt="${component.content.alt}" style="max-width: 100%; height: auto; border-radius: 8px;">` : ''}
                                    ${component.content.caption ? `<p style="font-style: italic; margin-top: 0.5rem;">${component.content.caption}</p>` : ''}
                                </div>
                            `;
                            break;
                    }
                });

                // Add main content if components are empty
                if (components.length === 0) {
                    html += `
                        <div class="preview-header">
                            <h1>${title}</h1>
                        </div>
                    `;
                    
                    if (image) {
                        html += `
                            <div class="preview-hero">
                                <img src="${image}" alt="${title}">
                            </div>
                        `;
                    }
                    
                    if (content) {
                        html += `
                            <div class="preview-text">
                                <p>${content}</p>
                            </div>
                        `;
                    }
                }

                html += `</div>`;
                return html;
            }

            closeModal() {
                document.getElementById('previewModal').style.display = 'none';
            }

            saveToStorage() {
                localStorage.setItem('miniCMSPages', JSON.stringify(this.pages));
            }

            showNotification(message, type = 'info') {
                // Create notification element
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
                    color: white;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    z-index: 10000;
                    animation: slideIn 0.3s ease;
                `;
                notification.textContent = message;
                
                document.body.appendChild(notification);
                
                // Remove after 3 seconds
                setTimeout(() => {
                    notification.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => {
                        document.body.removeChild(notification);
                    }, 300);
                }, 3000);
            }
        }

        // Add slide animations for notifications
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        // Initialize CMS
        const cms = new MiniCMS();