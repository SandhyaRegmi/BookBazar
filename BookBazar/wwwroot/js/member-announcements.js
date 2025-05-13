class MemberAnnouncementManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000';
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl("/announcementHub", {
                accessTokenFactory: () => localStorage.getItem('token'),
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .configureLogging(signalR.LogLevel.Information)
            .withAutomaticReconnect()
            .build();

        this.dismissedAnnouncements = new Set(
            JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]')
        );
        this.currentAnnouncement = null;

        this.init();
    }

    async init() {
        await this.startConnection();
        await this.loadActiveAnnouncements();
        const announcements = await this.loadActiveAnnouncements();
        for (const announcement of announcements) {
            if (this.shouldShowAnnouncement(announcement)) {
                this.showAnnouncement(announcement);
            }
        }

        this.startExpirationChecker();
        this.startActiveAnnouncementsRefresher();
    }


    async startConnection() {
        try {
            await this.connection.start();
            console.log("SignalR Connected as Member");

            // Clear previous handlers to avoid duplicates
            this.connection.off("ReceiveAnnouncement");
            this.connection.off("UpdateAnnouncement");
            this.connection.off("RemoveAnnouncement");

            this.connection.on("ReceiveAnnouncement", (announcement) => {
                console.log("New announcement received:", announcement);
                if (this.shouldShowAnnouncement(announcement)) {
                    this.showAnnouncement(announcement);
                }
            });

            this.connection.on("UpdateAnnouncement", (announcement) => {
                console.log("Announcement updated:", announcement);
                if (this.shouldShowAnnouncement(announcement)) {
                    this.showAnnouncement(announcement);
                } else {
                    this.hideAnnouncement(announcement.id);
                }
            });

            this.connection.on("RemoveAnnouncement", (id) => {
                console.log("Announcement removed:", id);
                this.hideAnnouncement(id);
            });

            this.connection.onclose(async () => {
                console.log("Connection closed. Attempting to reconnect...");
                await this.startConnection();
            });

        } catch (err) {
            console.error("SignalR Connection Error:", err);
            setTimeout(() => this.startConnection(), 5000);
        }
    }

    shouldShowAnnouncement(announcement) {
        if (!announcement) return false;

        const now = new Date();
        const startAt = new Date(announcement.startAt);
        const expiresAt = announcement.expiresAt ? new Date(announcement.expiresAt) : null;

        return announcement.isActive &&
            !this.dismissedAnnouncements.has(announcement.id) &&
            startAt <= now &&
            (expiresAt === null || expiresAt > now);
    }

    async loadActiveAnnouncements() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/Announcement/active`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('Failed to load announcements:', response.status);
                return []; // Return empty array instead of throwing
            }

            const announcements = await response.json();
            return announcements;
        } catch (error) {
            console.warn('Error loading announcements:', error);
            return [];
        }
    }

    showAnnouncement(announcement) {
        const banner = document.getElementById('announcements-banner');
        if (!banner) {
            console.error("Announcement banner element not found");
            return;
        }

        this.currentAnnouncement = announcement;

        banner.innerHTML = `
            <div class="announcement-content">
                <div class="announcement-icon">
                    <i class="fas fa-bullhorn"></i>
                </div>
                <div class="announcement-message">
                    <strong>${announcement.title}</strong>: ${announcement.message}
                </div>
                <button class="announcement-close" data-id="${announcement.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        banner.style.display = 'flex';

        // Add click handler for close button
        banner.querySelector('.announcement-close')?.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            this.dismissAnnouncement(id);
        });
    }

    hideAnnouncement(id) {
        if (this.currentAnnouncement?.id === id) {
            const banner = document.getElementById('announcements-banner');
            if (banner) {
                banner.style.display = 'none';
            }
            this.currentAnnouncement = null;
        }
    }

    dismissAnnouncement(id) {
        this.dismissedAnnouncements.add(id);
        localStorage.setItem('dismissedAnnouncements',
            JSON.stringify(Array.from(this.dismissedAnnouncements)));

        this.hideAnnouncement(id);
    }

    startActiveAnnouncementsRefresher() {
        this.refreshInterval = setInterval(async () => {
            const announcements = await this.loadActiveAnnouncements();
            for (const announcement of announcements) {
                if (this.shouldShowAnnouncement(announcement)) {
                    this.showAnnouncement(announcement);
                }
            }
        }, 60000); // Every minute
    }

    startExpirationChecker() {
        // Check every minute if current announcement has expired
        this.checkInterval = setInterval(() => {
            if (this.currentAnnouncement) {
                const now = new Date();
                const expired = this.currentAnnouncement.expiresAt &&
                    new Date(this.currentAnnouncement.expiresAt) <= now;

                if (expired) {
                    this.hideAnnouncement(this.currentAnnouncement.id);
                }
            }
        }, 60000); // Check every minute
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const announcementManager = new MemberAnnouncementManager();
    window.memberAnnouncementManager = announcementManager;
});