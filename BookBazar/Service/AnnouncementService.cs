using BookBazar.Data;
using BookBazar.DTO.Request;
using BookBazar.DTO.Response;
using BookBazar.Model;
using BookBazar.Hubs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

public class AnnouncementService
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<AnnouncementHub> _hubContext;
    
    public AnnouncementService(ApplicationDbContext context, IHubContext<AnnouncementHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    /* Retrieves currently active announcements that haven't expired */
    public async Task<List<AnnouncementDTO>> GetActiveAnnouncementsAsync()
    {
        var now = DateTime.UtcNow;
        return await _context.Announcements
            .Where(a => a.IsActive && a.StartAt <= now && (a.ExpiresAt == null || a.ExpiresAt > now))
            .OrderByDescending(a => a.StartAt)
            .Select(a => MapToDto(a))
            .ToListAsync();
    }

    /* Gets all announcements and notifies clients of status changes */
    public async Task<List<AnnouncementDTO>> GetAllAnnouncementsAsync()
    {
        var announcements = await _context.Announcements
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        var dtos = announcements.Select(a => MapToDto(a)).ToList();
        
        foreach (var dto in dtos)
        {
            var originalStatus = dto.Status;
            var currentStatus = GetCurrentStatus(dto);
            
            if (originalStatus != currentStatus)
            {
                dto.Status = currentStatus;
                await _hubContext.Clients.All.SendAsync("UpdateAnnouncement", dto);
            }
        }

        return dtos;
    }

    /* Determines the current status of an announcement based on its timing */
    private string GetCurrentStatus(AnnouncementDTO announcement)
    {
        var now = DateTime.UtcNow;
        
        if (!announcement.IsActive) return "Inactive";
        if (announcement.StartAt > now) return "Upcoming";
        if (announcement.ExpiresAt.HasValue && announcement.ExpiresAt.Value <= now) return "Ended";
        return "Ongoing";
    }

    /* Creates a new announcement and saves it to the database */
    public async Task<AnnouncementDTO> CreateAnnouncementAsync(CreateAnnouncementDTO dto, string createdBy)
    {
        var announcement = new Announcement
        {
            Title = dto.Title,
            Message = dto.Message,
            CreatedAt = DateTime.UtcNow,
            StartAt = dto.StartAt,
            ExpiresAt = dto.ExpiresAt,
            IsActive = true,
            CreatedBy = createdBy
        };

        _context.Announcements.Add(announcement);
        await _context.SaveChangesAsync();

        return MapToDto(announcement);
    }

    /* Updates an existing announcement with new information */
    public async Task<AnnouncementDTO> UpdateAnnouncementAsync(Guid id, UpdateAnnouncementDTO dto)
    {
        var announcement = await _context.Announcements.FindAsync(id);
        if (announcement == null) return null;

        announcement.Title = dto.Title;
        announcement.Message = dto.Message;
        announcement.StartAt = dto.StartAt;
        announcement.ExpiresAt = dto.ExpiresAt;
        announcement.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return MapToDto(announcement);
    }

    /* Removes an announcement from the database */
    public async Task<bool> DeleteAnnouncementAsync(Guid id)
    {
        var announcement = await _context.Announcements.FindAsync(id);
        if (announcement == null) return false;

        _context.Announcements.Remove(announcement);
        await _context.SaveChangesAsync();
        return true;
    }

    /* Converts an Announcement entity to its DTO representation with status */
    private static AnnouncementDTO MapToDto(Announcement announcement)
    {
        var now = DateTime.UtcNow;
        string status;

        if (!announcement.IsActive)
            status = "Inactive";
        else if (announcement.StartAt > now)
            status = "Upcoming";
        else if (announcement.ExpiresAt.HasValue && announcement.ExpiresAt.Value <= now)
            status = "Ended";
        else
            status = "Ongoing";

        return new AnnouncementDTO
        {
            Id = announcement.Id,
            Title = announcement.Title,
            Message = announcement.Message,
            CreatedAt = announcement.CreatedAt,
            StartAt = announcement.StartAt,
            ExpiresAt = announcement.ExpiresAt,
            IsActive = announcement.IsActive,
            Status = status,
            CreatedBy = announcement.CreatedBy
        };
    }
}