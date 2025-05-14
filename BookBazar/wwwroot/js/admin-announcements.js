class AdminAnnouncementManager {
    constructor() {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl("/announcementHub", {
                accessTokenFactory: () => localStorage.getItem('token'),
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .configureLogging(signalR.LogLevel.Information)
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: retryContext => {
                    if (retryContext.elapsedMilliseconds < 60000) {
                        return Math.random() * 2000 + 2000; // 2-4 seconds
                    }
                    return null; // Stop retrying after 60 seconds
                }
            })
            .build();
        
        this.init();
    }

     async init() {
        this.setupEventListeners();
        await this.startConnection();
        await this.loadAnnouncements();
    }

    

     async startConnection() {
        try {
            await this.connection.start();
            console.log("SignalR Connected as Admin");
            
            this.connection.on("ReceiveAnnouncement", (announcement) => {
                this.addOrUpdateAnnouncement(announcement);
            });
            
            this.connection.on("UpdateAnnouncement", (announcement) => {
                this.addOrUpdateAnnouncement(announcement);
            });
            
            this.connection.on("RemoveAnnouncement", (id) => {
                this.removeAnnouncement(id);
            });
            
            this.connection.on("ReceiveSystemMessage", (message) => {
                console.log("System message:", message);
            });
             
            this.connection.onreconnecting(() => {
                console.log("SignalR reconnecting...");
            });
            
            this.connection.onreconnected(() => {
                console.log("SignalR reconnected");
            });
            
            this.connection.onclose(() => {
                console.log("SignalR connection closed");
                setTimeout(() => this.startConnection(), 5000);
            });
            
        } catch (err) {
            console.error("SignalR Connection Error:", err);
            setTimeout(() => this.startConnection(), 5000);
        }
    }

    async loadAnnouncements() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
    
            const response = await fetch('http://localhost:5000/api/Announcement/all', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to load announcements');
            }
            
            const announcements = await response.json();
            this.displayAnnouncements(announcements);
        } catch (error) {
            console.error('Error loading announcements:', error);
            alert('Failed to load announcements: ' + error.message);
        }
    }

    displayAnnouncements(announcements) {
        const container = document.getElementById('announcementList');
        if (!container) return;
        
        // Group announcements by status
        const upcoming = announcements.filter(a => a.status === "Upcoming");
        const ongoing = announcements.filter(a => a.status === "Ongoing");
        const ended = announcements.filter(a => a.status === "Ended");
        const inactive = announcements.filter(a => a.status === "Inactive");
        
        container.innerHTML = `
            <div class="announcement-section">
                <h3 class="section-title">Ongoing Announcements</h3>
                <div class="ongoing-announcements">
                    ${ongoing.length > 0 ? ongoing.map(a => this.createAnnouncementCard(a)).join('') : 
                     '<p class="no-announcements">No ongoing announcements</p>'}
                </div>
            </div>
            
            <div class="announcement-section">
                <h3 class="section-title">Upcoming Announcements</h3>
                <div class="upcoming-announcements">
                    ${upcoming.length > 0 ? upcoming.map(a => this.createAnnouncementCard(a)).join('') : 
                     '<p class="no-announcements">No upcoming announcements</p>'}
                </div>
            </div>
            
            <div class="announcement-section">
                <h3 class="section-title">Ended Announcements</h3>
                <div class="ended-announcements">
                    ${ended.length > 0 ? ended.map(a => this.createAnnouncementCard(a)).join('') : 
                     '<p class="no-announcements">No ended announcements</p>'}
                </div>
            </div>
            
            <div class="announcement-section">
                <h3 class="section-title">Inactive Announcements</h3>
                <div class="inactive-announcements">
                    ${inactive.length > 0 ? inactive.map(a => this.createAnnouncementCard(a)).join('') : 
                     '<p class="no-announcements">No inactive announcements</p>'}
                </div>
            </div>
        `;
        
        this.setupCardEventListeners();
    }

    createAnnouncementCard(announcement) {
        const canEdit = announcement.status === 'Ongoing' || announcement.status === 'Upcoming';
        return `
            <div class="announcement-card card mb-3" data-id="${announcement.id}" data-status="${announcement.status}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title">${announcement.title}</h5>
                        <span class="badge ${this.getStatusBadgeClass(announcement)}">
                            ${announcement.status}
                        </span>
                    </div>
                    <p class="card-text">${announcement.message}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            ${new Date(announcement.startAt).toLocaleString()} - 
                            ${announcement.expiresAt ? new Date(announcement.expiresAt).toLocaleString() : 'No expiry'}
                        </small>
                        <div>
                            <button class="btn btn-sm btn-primary edit-btn" data-id="${announcement.id}" 
                                ${!canEdit ? 'disabled title="Only ongoing or upcoming announcements can be edited"' : ''}>
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${announcement.id}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusBadgeClass(announcement) {
        switch(announcement.status) {
            case 'Ongoing': return 'bg-success';
            case 'Upcoming': return 'bg-warning text-dark';
            case 'Ended': return 'bg-secondary';
            case 'Inactive': return 'bg-danger';
            default: return 'bg-info';
        }
    }

    addOrUpdateAnnouncement(announcement) {
        const container = document.getElementById('announcementList');
        if (!container) return;
        
        const existingCard = container.querySelector(`[data-id="${announcement.id}"]`);
        
        if (existingCard) {
            existingCard.outerHTML = this.createAnnouncementCard(announcement);
        } else {
            let section;
            switch(announcement.status) {
                case 'Ongoing': section = container.querySelector('.ongoing-announcements'); break;
                case 'Upcoming': section = container.querySelector('.upcoming-announcements'); break;
                case 'Ended': section = container.querySelector('.ended-announcements'); break;
                case 'Inactive': section = container.querySelector('.inactive-announcements'); break;
                default: return;
            }
            
            if (section) {
                const noAnnouncements = section.querySelector('.no-announcements');
                if (noAnnouncements) {
                    noAnnouncements.remove();
                }
                section.insertAdjacentHTML('afterbegin', this.createAnnouncementCard(announcement));
            }
        }
        
        this.setupCardEventListeners();
    }

    removeAnnouncement(id) {
        const container = document.getElementById('announcementList');
        if (!container) return;
        
        const card = container.querySelector(`[data-id="${id}"]`);
        if (card) {
            const section = card.closest('.announcement-section');
            card.remove();
            
            // If section is now empty, add "no announcements" message
            if (section && section.querySelector('.card') === null) {
                const sectionType = section.querySelector('h3').textContent.replace(' Announcements', '').toLowerCase();
                section.querySelector(`.${sectionType}-announcements`).innerHTML = 
                    '<p class="no-announcements">No ' + sectionType + ' announcements</p>';
            }
        }
    }

    setupCardEventListeners() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.editAnnouncement(id);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.deleteAnnouncement(id);
            });
        });
    }

    setupEventListeners() {
        // New announcement button
        document.getElementById('newAnnouncementBtn')?.addEventListener('click', () => {
            this.resetForm();
            document.getElementById('announcementForm').style.display = 'block';
            document.getElementById('announcementTitle').focus();
        });
        
        // Cancel button
        document.getElementById('cancelAnnouncementBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.resetForm();
        });
        
        // Form submission
        document.getElementById('announcementFormElement')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const announcementId = form.getAttribute('data-edit-id');
            
            if (announcementId) {
                await this.updateAnnouncement(announcementId);
            } else {
                await this.createAnnouncement();
            }
        });
    }

    async createAnnouncement() {
        const title = document.getElementById('announcementTitle').value;
        const message = document.getElementById('announcementMessage').value;
        const startAt = document.getElementById('announcementStart').value;
        const expiresAt = document.getElementById('announcementExpiry').value;
        
        if (!title || !message || !startAt) {
            alert('Please fill in all required fields');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('http://localhost:5000/api/Announcement', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    message,
                    startAt: new Date(startAt).toISOString(),
                    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
                    isActive: document.getElementById('announcementActive').checked
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to create announcement');
            }
            
            const result = await response.json();
            this.resetForm();
            await this.loadAnnouncements(); // Reload the announcements list
            
        } catch (error) {
            console.error('Error creating announcement:', error);
            alert('Failed to create announcement: ' + error.message);
        }
    }

    async editAnnouncement(id) {
        try {
            const response = await fetch(`http://localhost:5000/api/Announcement/all`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch announcement details');
            }

            const announcements = await response.json();
            const announcement = announcements.find(a => a.id === id);

            if (!announcement) {
                throw new Error('Announcement not found');
            }

            // Check if announcement can be edited
            if (announcement.status !== 'Ongoing' && announcement.status !== 'Upcoming') {
                alert('Only ongoing or upcoming announcements can be edited');
                return;
            }

            // Populate form with announcement details
            const form = document.getElementById('announcementFormElement');
            form.setAttribute('data-edit-id', id);
            
            document.getElementById('announcementTitle').value = announcement.title;
            document.getElementById('announcementMessage').value = announcement.message;
            document.getElementById('announcementStart').value = new Date(announcement.startAt).toISOString().slice(0, 16);
            document.getElementById('announcementExpiry').value = announcement.expiresAt ? 
                new Date(announcement.expiresAt).toISOString().slice(0, 16) : '';
            document.getElementById('announcementActive').checked = announcement.isActive;

            // Update save button text
            const saveBtn = document.getElementById('saveAnnouncementBtn');
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Update';

            // Show the form
            document.getElementById('announcementForm').style.display = 'block';
        } catch (error) {
            console.error('Error loading announcement details:', error);
            alert('Failed to load announcement details: ' + error.message);
        }
    }

    resetForm() {
        const form = document.getElementById('announcementFormElement');
        if (form) {
            form.reset();
            form.removeAttribute('data-edit-id');
        }
        document.getElementById('announcementForm').style.display = 'none';
        
        // Restore save button to create mode
        const saveBtn = document.getElementById('saveAnnouncementBtn');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
    }

    async updateAnnouncement(id) {
        const title = document.getElementById('announcementTitle').value;
        const message = document.getElementById('announcementMessage').value;
        const startAt = document.getElementById('announcementStart').value;
        const expiresAt = document.getElementById('announcementExpiry').value;
        const isActive = document.getElementById('announcementActive').checked;
        
        if (!title || !message || !startAt) {
            alert('Please fill in all required fields');
            return;
        }

        // Convert local dates to UTC
        const startDate = new Date(startAt);
        const expiryDate = expiresAt ? new Date(expiresAt) : null;
        const now = new Date();

        // Validate dates
        if (expiryDate && startDate >= expiryDate) {
            alert('Start date must be before expiry date');
            return;
        }

        // Ensure dates are in UTC format
        const startAtUTC = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000);
        const expiresAtUTC = expiryDate ? new Date(expiryDate.getTime() - expiryDate.getTimezoneOffset() * 60000) : null;
        
        try {
            const response = await fetch(`http://localhost:5000/api/Announcement/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    title,
                    message,
                    startAt: startAtUTC.toISOString(),
                    expiresAt: expiresAtUTC ? expiresAtUTC.toISOString() : null,
                    isActive
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update announcement');
            }
            
            const updatedAnnouncement = await response.json();
            
            // Reset form after successful update
            this.resetForm();
            
            // Reload announcements to show updated status
            await this.loadAnnouncements();
            
        } catch (error) {
            console.error('Error updating announcement:', error);
            alert('Failed to update announcement: ' + error.message);
        }
    }

    async deleteAnnouncement(id) {
        if (!confirm('Are you sure you want to delete this announcement?')) return;
        
        try {
            const response = await fetch(`/api/Announcement/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete announcement');
            }
            
        } catch (error) {
            console.error('Error deleting announcement:', error);
            alert('Failed to delete announcement');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const announcementManager = new AdminAnnouncementManager();
    window.adminAnnouncementManager = announcementManager;
});