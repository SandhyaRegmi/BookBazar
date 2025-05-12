using System;

namespace BookBazar.DTO.Request;

public class UpdateAnnouncementDTO
{
 public string Title { get; set; }
    public string Message { get; set; }
     public DateTime StartAt { get; set; } 
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; }
}
