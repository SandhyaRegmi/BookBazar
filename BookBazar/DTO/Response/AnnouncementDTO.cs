using System;

namespace BookBazar.DTO.Response;

public class AnnouncementDTO
{
 public Guid Id { get; set; }
    public string Title { get; set; }
    public string Message { get; set; }
    public DateTime CreatedAt { get; set; }
      public DateTime StartAt { get; set; } 
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; }
    public string Status { get; set; }  

       public string CreatedBy { get; set; }
}
