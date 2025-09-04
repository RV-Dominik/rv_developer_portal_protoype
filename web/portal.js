// API Configuration
const API_BASE = '/api';

// State management
let currentUser = null;
let currentProject = null;
let projects = [];

// DOM elements
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const projectScreen = document.getElementById('project-screen');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const projectsList = document.getElementById('projects-list');
const createProjectBtn = document.getElementById('create-project-btn');
const logoutBtn = document.getElementById('logout-btn');
const backToDashboard = document.getElementById('back-to-dashboard');

// Project form elements
const projectTitleInput = document.getElementById('project-title-input');
const projectSlug = document.getElementById('project-slug');
const shortDesc = document.getElementById('short-desc');
const longDesc = document.getElementById('long-desc');
const saveProjectBtn = document.getElementById('save-project');

// Asset upload elements
const assetUploads = {
    logo: document.getElementById('logo-upload'),
    header: document.getElementById('header-upload'),
    screenshot: document.getElementById('screenshot-upload'),
    trailer: document.getElementById('trailer-upload')
};

const assetPreviews = {
    logo: document.getElementById('logo-preview'),
    header: document.getElementById('header-preview'),
    screenshot: document.getElementById('screenshot-preview'),
    trailer: document.getElementById('trailer-preview')
};

// API functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

async function checkAuth() {
    try {
        const user = await apiRequest('/auth/session');
        currentUser = user.user;
        return true;
    } catch (error) {
        return false;
    }
}

async function login(email) {
    try {
        await apiRequest('/auth/magic-link', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        showMessage('Magic link sent! Check your email.', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function logout() {
    try {
        await apiRequest('/auth/logout', { method: 'POST' });
        currentUser = null;
        showScreen('login');
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

async function loadProjects() {
    try {
        projects = await apiRequest('/projects');
        renderProjects();
    } catch (error) {
        console.error('Failed to load projects:', error);
        showMessage('Failed to load projects', 'error');
    }
}

async function createProject(title, slug) {
    try {
        const project = await apiRequest('/projects', {
            method: 'POST',
            body: JSON.stringify({ title, slug })
        });
        projects.unshift(project);
        renderProjects();
        return project;
    } catch (error) {
        throw error;
    }
}

async function loadProject(id) {
    try {
        currentProject = await apiRequest(`/projects/${id}`);
        populateProjectForm();
        loadProjectAssets();
    } catch (error) {
        console.error('Failed to load project:', error);
        showMessage('Failed to load project', 'error');
    }
}

async function saveProject() {
    if (!currentProject) return;

    try {
        const updates = {
            title: projectTitleInput.value,
            short_desc: shortDesc.value,
            long_desc: longDesc.value
        };

        const updatedProject = await apiRequest(`/projects/${currentProject.id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });

        currentProject = updatedProject;
        showMessage('Project saved successfully!', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function uploadAsset(kind, file) {
    if (!currentProject) return;

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('kind', kind);

        const response = await fetch(`${API_BASE}/uploads/${currentProject.id}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        const asset = await response.json();
        showMessage('Asset uploaded successfully!', 'success');
        loadProjectAssets();
        return asset;
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function loadProjectAssets() {
    if (!currentProject) return;

    try {
        const assets = await apiRequest(`/uploads/${currentProject.id}`);
        renderProjectAssets(assets);
    } catch (error) {
        console.error('Failed to load assets:', error);
    }
}

// UI functions
function showScreen(screenName) {
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.add('hidden');
    projectScreen.classList.add('hidden');

    switch (screenName) {
        case 'login':
            loginScreen.classList.remove('hidden');
            break;
        case 'dashboard':
            dashboardScreen.classList.remove('hidden');
            break;
        case 'project':
            projectScreen.classList.remove('hidden');
            break;
    }
}

function showMessage(message, type) {
    loginMessage.textContent = message;
    loginMessage.className = `message ${type}`;
    loginMessage.style.display = 'block';

    setTimeout(() => {
        loginMessage.style.display = 'none';
    }, 5000);
}

function renderProjects() {
    projectsList.innerHTML = '';

    if (projects.length === 0) {
        projectsList.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #888;">
                <h3>No projects yet</h3>
                <p>Create your first project to get started</p>
            </div>
        `;
        return;
    }

    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.innerHTML = `
            <h3>${project.title}</h3>
            <p>${project.short_desc || 'No description'}</p>
            <div class="project-meta">
                <span>Slug: ${project.slug}</span>
                <span>${new Date(project.updated_at).toLocaleDateString()}</span>
            </div>
        `;
        projectCard.addEventListener('click', () => openProject(project));
        projectsList.appendChild(projectCard);
    });
}

function openProject(project) {
    currentProject = project;
    showScreen('project');
    loadProject(project.id);
}

function populateProjectForm() {
    if (!currentProject) return;

    projectTitleInput.value = currentProject.title;
    projectSlug.value = currentProject.slug;
    shortDesc.value = currentProject.short_desc || '';
    longDesc.value = currentProject.long_desc || '';
}

function renderProjectAssets(assets) {
    // Clear existing previews
    Object.values(assetPreviews).forEach(preview => {
        preview.innerHTML = '';
    });

    // Group assets by kind
    const assetsByKind = {};
    assets.forEach(asset => {
        if (!assetsByKind[asset.kind]) {
            assetsByKind[asset.kind] = [];
        }
        assetsByKind[asset.kind].push(asset);
    });

    // Render each kind
    Object.entries(assetsByKind).forEach(([kind, kindAssets]) => {
        const preview = assetPreviews[kind];
        if (!preview) return;

        kindAssets.forEach(asset => {
            const element = document.createElement(kind === 'trailer' ? 'video' : 'img');
            element.src = asset.file_key; // This would need to be a signed URL in production
            element.alt = asset.kind;
            element.style.maxWidth = '100%';
            element.style.maxHeight = '200px';
            element.style.objectFit = 'cover';
            
            if (kind === 'video') {
                element.controls = true;
            }

            preview.appendChild(element);
        });
    });
}

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

// Event listeners
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    await login(email);
});

logoutBtn.addEventListener('click', logout);

createProjectBtn.addEventListener('click', async () => {
    const title = prompt('Enter project title:');
    if (!title) return;

    const slug = generateSlug(title);
    try {
        const project = await createProject(title, slug);
        openProject(project);
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

backToDashboard.addEventListener('click', () => {
    showScreen('dashboard');
    loadProjects();
});

saveProjectBtn.addEventListener('click', saveProject);

// Asset upload handlers
Object.entries(assetUploads).forEach(([kind, input]) => {
    const uploadArea = input.closest('.upload-area');
    const uploadBtn = uploadArea.querySelector('.upload-btn');

    uploadBtn.addEventListener('click', () => input.click());

    input.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        
        for (const file of files) {
            await uploadAsset(kind, file);
        }
        
        e.target.value = ''; // Reset input
    });
});

// Initialize app
async function init() {
    const isAuthenticated = await checkAuth();
    
    if (isAuthenticated) {
        showScreen('dashboard');
        await loadProjects();
    } else {
        showScreen('login');
    }
}

// Handle magic link authentication
if (window.location.search.includes('auth=success')) {
    // Clear the URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Check authentication
    setTimeout(async () => {
        const isAuthenticated = await checkAuth();
        if (isAuthenticated) {
            showScreen('dashboard');
            await loadProjects();
        }
    }, 1000);
}

// Start the app
init();
