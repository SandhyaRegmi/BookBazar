using BookBazar.Data;
using BookBazar.DTO.Request;
using BookBazar.DTO.Response;
using BookBazar.Model;
using Microsoft.EntityFrameworkCore;

public class AnnouncementService
{
    private readonly ApplicationDbContext _context;

    public AnnouncementService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<AnnouncementDTO>> GetActiveAnnouncementsAsync()
    {
        var now = DateTime.UtcNow;
        return await _context.Announcements
            .Where(a => a.IsActive && a.StartAt <= now && (a.ExpiresAt == null || a.ExpiresAt > now))
            .OrderByDescending(a => a.StartAt)
            .Select(a => MapToDto(a))
            .ToListAsync();
    }

    public async Task<List<AnnouncementDTO>> GetAllAnnouncementsAsync()
    {
        return await _context.Announcements
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => MapToDto(a))
            .ToListAsync();
    }

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

    public async Task<bool> DeleteAnnouncementAsync(Guid id)
    {
        var announcement = await _context.Announcements.FindAsync(id);
        if (announcement == null) return false;

        _context.Announcements.Remove(announcement);
        await _context.SaveChangesAsync();
        return true;
    }

    private static AnnouncementDTO MapToDto(Announcement announcement)
    {
        var now = DateTime.UtcNow;
        var status = announcement.IsActive
            ? announcement.StartAt > now 
                ? "Upcoming" 
                : (announcement.ExpiresAt == null || announcement.ExpiresAt > now)
                    ? "Ongoing"
                    : "Ended"
            : "Inactive";

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